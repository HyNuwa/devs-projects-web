## Context

See proposal.md (Why) and the specs under `specs/moderation/`. What exists after `moderacion-casos`:

- **Casos and decisions:**
  - `ModerationCase`, `Report` and the append-only `ModerationEvent`.
  - `DecisionsService` closes a caso with conditional writes. Restore only goes through the content's most recent caso.
  - Content has one `publicationStatus`, and points are awarded and reverted idempotently by `PointService`.
- **Sanction fields exist but do nothing:** `User.isBanned`, `User.isMuted` and `User.mutedUntil` are in the schema, but nothing sets or enforces them. Only the legacy ranking filters on `isBanned`.
- **Auth:**
  - Access tokens are 15-minute JWTs, and a request never reads the account from the DB.
  - Refresh tokens are rows in `refresh_tokens` and can be deleted.
  - Login goes through `LocalStrategy` → `AuthService.validateUser` → `login`.
- **Write endpoints the sanctions affect:**
  - `POST/PATCH /materials`, `PUT /materials/:id/helpfulness`
  - `POST /subjects/:code/reviews|exams`, `PUT /subjects/reviews|exams/:id`
  - `POST /me/submissions/:type/:id/resubmit`
  - `POST /reports`
- **Tests:** Jest (via `@swc/jest`) picks up `*.spec.ts` and `*.e2e-spec.ts`.

## Goals / Non-Goals

**Goals:**
- One place that decides whether an account may contribute, used by every write path, by login and by refresh.
- A sanción and its effect cannot drift apart.
- The escalera is a pure, clock-injected function.
- Anonymous authors stay hidden in every new surface: user file, appeals and history.

**Non-Goals:**
- Freezing points or privilegios during a sanción (points change).
- Notifications or email.
- Retention purges.
- Per-facultad scope.
- Sanctions or appeals for eventos and avisos.
- Changing how 2a's decisions, visibility or reports work, beyond the hooks named below.

## Decisions

### Data model

- **`Sanction`**: the record of each advertencia, silenciamiento and suspensión.
  - Fields:
    - `userId`, `type` (`WARNING | MUTE | SUSPENSION`), `reason`
    - `startsAt`, `endsAt` (null for permanent suspensions and for warnings)
    - `appliedById`, and optionally `caseId`
    - `liftedAt` / `liftedById` / `liftReason`
    - `voidedAt` / `voidedByAppealId`
    - `seenAt` (a warning is shown once)
  - Indexes on `(userId, startsAt)` and `(caseId)`.
- **`SuspensionProposal`**:
  - Fields: `userId`, `proposedById`, `reason`, `durationDays` (7 | 30 | null = permanent), `caseId?`, `status` (`PENDING | CONFIRMED | REJECTED`), `decidedById`, `decisionReason`, `decidedAt`, and `sanctionId` once confirmed.
  - A partial unique index allows one PENDING proposal per user.
- **`Appeal`**:
  - Fields: `appellantId`, `kind` (`RETIRO | SANCTION`), `caseId?`, `sanctionId?`, `explanation`, `status` (`PENDING | ACCEPTED | REJECTED`), `decidedById` (the appealed decider, fixed at filing), `reviewerId`, `answer`, `answeredAt`.
  - Constraints: a CHECK that exactly one target is set, and unique indexes on `caseId` and `sanctionId`, so each decision can only be appealed once.
- **`User` enforcement cache:** `mutedUntil` (existing), a new `bannedUntil`, and `isBanned` (true while suspended; `bannedUntil` null means permanent). All three are written only by `SanctionsService`, in the same transaction as the `Sanction` row.
  - Every read compares dates to *now*, so expiry needs no job.
  - `isMuted` is kept in sync for backwards compatibility, but no read relies on it.
  - Alternative considered: deriving the state from `Sanction` rows on every check. It is correct, but it costs a join on every write and every login, and the legacy ranking already filters on `isBanned`.
- **`ModerationCase` additions:**
  - `targetAuthorId`: set when the caso opens, and backfilled from the content by the migration.
  - `revertedAt`: set by a restore or by an accepted appeal.
  - Together they make «retiros por normas of user U in 90 days» a single indexed query (`targetAuthorId, decision = REMOVE, revertedAt IS NULL, closedAt >= now − 90 d`), without joining the three content tables. This counts anonymous content too, so anonymity cannot shield an account.
- **New `ModerationEventAction` values:** `WARNED`, `MUTED`, `SUSPENDED`, `SANCTION_LIFTED`, `SUSPENSION_PROPOSED`, `SUSPENSION_REJECTED`, `APPEAL_FILED`, `APPEAL_ACCEPTED`, `APPEAL_REJECTED`.
  - Events keep `targetUserId`, plus the content columns when the action came from a caso.
  - As a result, 2a's masking already hides the account for anonymous content in the moderator history.

### Escalera

`suggestedStep({ retiros, warnings, mutes, suspensions }, now)` in `moderation/escalera.ts` returns `NONE | WARNING | MUTE | PROPOSE_SUSPENSION`, following the sanctions spec:
- Warnings and mutes older than 90 days are ignored; a suspension never is.
- Voided and lifted-by-appeal sanctions are excluded by the caller.

`SanctionsService.stepFor(userId)` loads the three inputs with the indexes above. The «Retirar» screen, the user file and the Usuarios list all use it.

### Applying sanctions

`SanctionsService` owns every change to a sanción:
- **Operations:** `warn`, `mute`, `unmute`, `proposeSuspension`, `confirmProposal`, `rejectProposal`, `suspend`, `liftSuspension`, `voidByAppeal`.
- **Each operation, in one transaction:**
  1. Check role rules and conflict of interest through a pure `canSanction(actor, target, source)`.
  2. Write the `Sanction` row and the `User` cache.
  3. Write the event.
- **When a suspension is confirmed**, the same transaction also:
  - deletes the account's refresh tokens
  - optionally retires its `Publicado` contributions: each goes through the same conditional status write and `PointService.revertFor` used by decisions, and a closed REMOVE caso is created per item so the retiro is attributable and appealable
- **«Advertir también»:** `CaseDecisionDto` gains `warn?: boolean`. When it is true and the decision is REMOVE, `DecisionsService` calls `SanctionsService.warn(..., { caseId })` inside its transaction.
  - Alternative considered: warning in a separate request after the retiro. It could leave a retiro without the advertencia the moderator chose.

### Enforcement

- **`AccountStatusService.assertCanContribute(userId, now)`:**
  - Reads `isBanned`, `bannedUntil` and `mutedUntil`.
  - Throws `ForbiddenException` with `code: ACCOUNT_SUSPENDED | ACCOUNT_MUTED` and `until`.
  - It is applied by `@RequiresActiveAccount()` (a guard plus a decorator) on the write endpoints listed in Context. «Guardar», downloads and profile editing are not guarded.
  - Alternative considered: checking inside each service. A new write path could easily be added without the check.
- **Login:**
  - `validateUser` checks the password first. Only for a correct password does it check the suspension, and it throws 403 `ACCOUNT_SUSPENDED` with `reason`, `until`, `appealable` and `appealDeadline`. A wrong password keeps the generic 401, so nothing leaks.
  - Refresh does the same check and deletes the tokens.
- **The 15-minute access token:** it can still read, but it can no longer write, because of the guard. The frontend reacts to 403 `ACCOUNT_SUSPENDED` by signing out and showing the suspension screen.
- **`GET /auth/me`** adds `restriction: { type, reason, until, appealable, appealId? } | null` and `unseenWarning?`, so the shell banner and the disabled states need no extra request. `POST /me/warnings/:id/seen` marks a warning as seen.

### Appeals

- **`AppealsService.file`:**
  - It accepts `{ kind: RETIRO, caseId }` when the caso was decided REMOVE on content authored by the appellant, and `{ kind: SANCTION, sanctionId }` when the sanction belongs to the appellant.
  - The decision must be within 14 days, and must not have been lifted, voided or appealed before.
  - Eligibility is a pure `canAppeal(decision, now)`.
- **`POST /auth/suspension-appeal { email, password, explanation }`:**
  - Public, and behind the existing auth throttler.
  - It verifies the credentials and files the appeal against the active suspension. It never issues tokens, and it answers bad credentials with the generic 401.
- **Reviewer eligibility:** a pure `canReview(viewer, appeal)`, where the viewer is neither the decider nor the appellant, and suspensions need ADMIN+.
  - A MODERATOR sees only eligible appeals. Admins see every appeal they are not party to.
  - That alone gives «waits for an admin when nobody else is eligible», with no extra state.
- **Answers:**
  - An accepted RETIRO calls `DecisionsService.restoreFromAppeal`. It uses the same conditional write, re-awards points, sets `caso.revertedAt`, and voids the WARNING with the same `caseId`.
  - An accepted SANCTION calls `SanctionsService.voidByAppeal`, which clears the cache if the sanction is still active.
  - Answers use a conditional `updateMany … status = 'PENDING'`, like 2a's decisions, so two reviewers cannot both answer.

### Queue and panel

- **Queue:** `groupQueue` gains a `vencidos` group. The due time is 48 h after `hiddenAt` for hidden content, and 7 days after `openedAt` for everything else. Overdue casos move out of their group into Vencidos, sorted by how overdue they are.
- **`GET /moderation/summary`** returns the overdue count, the pending casos and the eligible appeals for the tab counts and the admin banner.
- **Usuarios:**
  - `GET /moderation/users?filter=suggested|sanctioned|prior-review&q=` and `GET /moderation/users/:id` build the file.
  - Report precision is `confirmed / (confirmed + dismissed)`, returned as null below 5 resolved reportes.
  - Timeline entries from casos whose content is anonymous are dropped, and sanctions linked to such casos come back as `{ anonymousCase: true }` without `caseId`.
  - Masked email: first character, then `••••`, then the domain.
- **Frontend:** Usuarios and Apelaciones become tabs in `ModerationHeader`, next to the existing panels.

### Frontend restrictions

- A `useAccountRestriction()` hook reads `restriction` from the auth store.
- **Shell banner:** `SiteHeader` renders a `SanctionBanner` under the header while a restriction is active, and shows an unseen warning once.
- **Silenced accounts:** write entry points disable their submit and show the shared explanation. These are Subir material, the reseña and experiencia forms, Reportar, «Me sirvió» and resubmitting in Mis envíos.
- **Suspended accounts:** the login page renders the suspension screen from the 403 body, with the appeal form.
- **Mis envíos:** gains «Apelar» on retiros and the Sanciones section.

### Tests with Vitest

- **Backend config:** `vitest.config.ts` uses `unplugin-swc`, so decorators and metadata work, and `pool: 'threads'` with `maxThreads: 2`.
- **Separate suffixes:** Vitest runs `src/**/*.test.ts` and `test/**/*.e2e.test.ts`, while Jest keeps `*.spec.ts` and `*.e2e-spec.ts`. The two runners never pick up each other's files.
- **Scripts:**
  - `test:vitest` and `test:vitest:e2e` run the new suites.
  - `test` stays Jest.
  - A `test:all` script runs both.
- **Scope:** every new test in this change is Vitest, and the existing Jest specs are only edited where the behavior they cover changes.

## Risks / Trade-offs

- **[Risk] The `User` cache drifts from `Sanction` rows.** → Only `SanctionsService` writes it, always in the same transaction, and the migration test asserts that the cache matches the rows after each operation.
- **[Risk] A suspended account keeps reading for up to 15 minutes.** → Accepted: reading is harmless, and writes and refresh are blocked immediately.
- **[Risk] The login response tells a correct-password user that they are suspended.** → Intended: only someone who knows the password learns it, and wrong passwords stay generic.
- **[Risk] `targetAuthorId` could leak anonymity if exposed.** → It is used only in the server-side counts, and the user file drops anonymous casos. A test asserts that no caso id of anonymous content appears in `GET /moderation/users/:id`.
- **[Risk] Two runners mean two configs and two reports.** → Accepted for now (user decision). Verification runs both, and the suffixes keep them apart.
- **[Trade-off] Retiring a suspended account's contributions creates one closed caso per item.** → A bulk decision would be one row, but every item would lose its own appealable retiro and history.

## Migration Plan

1. A migration adds the enums, the models, `User.bannedUntil`, and `ModerationCase.targetAuthorId` (backfilled from each target's author) and `revertedAt` (backfilled for casos whose content was restored later).
2. No existing data holds active sanctions: `isMuted` and `isBanned` are unset everywhere. The migration test asserts this.
3. Rollback: the migration only adds structures, so reverting the code leaves unused tables.
