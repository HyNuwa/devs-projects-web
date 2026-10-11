## Context

- **Sanciones:** `Sanction` holds them (`WARNING`, `MUTE`, `SUSPENSION`, with `startsAt`, `endsAt` null for permanent suspensions, `liftedAt` and `voidedAt`). `User.isBanned`, `mutedUntil` and `bannedUntil` mirror the active one.
- **Retiros por normas:** a `ModerationCase` with `decision = REMOVE`, `targetAuthorId` (set for anonymous content too), `closedAt`, and `revertedAt` when it is restored or overturned on appeal.
- **Reportes:** `Report` holds them (`status` `OPEN`, `CONFIRMED` or `DISMISSED`, with `resolvedAt`). The queue (`moderation/queue.ts`) orders by `overdueHidden`, then `highPriority`, then `reportCount`, then age.
- **Material edits:** `MaterialsService.update` validates academic context (`assertAcademicContext`), and reverts and re-evaluates the pioneer bonus when materia or tipo change.
- **The point ledger** (`PointLedger.award`) applies caps per reason inside the account lock. The weekly cap for `REPORT_CONFIRMED` is the model for `CORRECTION_ACCEPTED`.
- **Insignias:** `BADGE_CATALOG` has 17 insignias, evaluated on read from `loadBadgeSnapshot`. `public/assets/insignias/gema/lupa.{svg,lottie}` already exist.
- **The Usuarios tab** must not depend on retiros of anonymous content for a MODERATOR (moderation/sanctions).
- **Roles:** `PATCH /admin/users/:id/role` (ADMIN and SUPERADMIN) changes any role with an unvalidated body, and no UI uses it.
- **No scheduler** runs in the backend. Every time-based rule in the product is computed on read, such as the overdue casos in the queue.

## Goals / Non-Goals

**Goals:**
- One pure function decides good standing, shared by all three privileges and by «Tu progreso».
- Corrections reuse the author's edit path, so validation and the pioneer bonus behave the same.
- Escalation after 7 days and closing on change are computed on read, with no jobs.
- Privileges never become a way to infer anonymous authorship or sanciones.

**Non-Goals:** notifications, an invitation entity, the ambassador program, rankings, and corrections to title, description or file.

## Decisions

### Good standing: `trust/standing.ts`, a pure function over loaded rows

```
standing({ sanctions, retiros, now }) → { good: boolean, since: Date | null, until: Date | null, permanent: boolean }
```

**Inputs:**
- **Sanciones:** `MUTE` or `SUSPENSION` rows not voided (`voidedAt IS NULL`). Each one ends at `liftedAt ?? endsAt`. A `SUSPENSION` with `endsAt` null and not lifted is permanent.
- **Retiros:** casos with `decision = REMOVE`, `targetAuthorId = user`, `revertedAt IS NULL`. They end at `closedAt`.

**Rules:**
- An active sanción (end in the future, or permanent) means not in good standing, with `until` null or the end plus 90 days.
- Otherwise `until` is the latest end plus 90 days, and the account is in good standing when `now ≥ until`.

`TrustService.standing(userId, tx?)` loads only the rows from the last 90 days plus any active or permanent ones. Unit tests cover:
- voided sanciones and reverted retiros, which do not count;
- a lifted silenciamiento;
- a permanent suspensión;
- warnings;
- the exact 90-day boundary.

### Privileges: `trust/privileges.ts`

| Function | Requires |
|---|---|
| `canSuggestCorrections(user)` | good standing and `maxLevel ≥ 3` |
| `priorityReporter(user)` | good standing and the counts of `CONFIRMED` and `DISMISSED` reports resolved in the last 90 days: `confirmed ≥ 5 && confirmed / (confirmed + dismissed) ≥ 0.7` |
| `eligibleToModerate(user)` | role `USER`, `maxLevel ≥ 6`, `createdAt ≤ now − 6 months`, good standing, and ≥ 5 confirmed reports or ≥ 10 accepted corrections over the whole history |

Each function returns `{ active, missing: [...] }`, so «Tu progreso» can explain what is missing:

```
missing: { kind: 'LEVEL', needed: 3, current: 2 }
       | { kind: 'CONFIRMED_REPORTS', needed: 5, current: 3 }
       | { kind: 'PRECISION', needed: 70, current: 56 }
       | { kind: 'STANDING', until: Date | null }
```

Counting resolved reportes by `resolvedAt` keeps the 90-day window on the decision date, which is what the precision shown in Usuarios uses.

### `CorrectionSuggestion`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | |
| `material_id` | FK, cascade | |
| `suggester_id` | FK, cascade | |
| `field` | enum `CorrectionField` | `SUBJECT`, `RESOURCE_TYPE`, `ACADEMIC_YEAR`, `PROFESSOR` |
| `current_value` | text, null | snapshot when the suggestion was made, serialized |
| `proposed_value` | text, null | `null` means «sin profesor» or «sin ciclo», allowed for those two fields |
| `comment` | varchar(500), null | |
| `status` | enum `CorrectionStatus` | `OPEN`, `ACCEPTED`, `REJECTED`, `CLOSED` |
| `decided_by` | enum, null | `AUTHOR` or `MODERATION` |
| `decided_by_id` | uuid, null | |
| `closed_reason` | enum, null | `FIELD_CHANGED` or `MATERIAL_GONE` |
| `created_at`, `decided_at` | timestamps | |

A partial unique index `(material_id, field) WHERE status = 'OPEN'` guarantees one open suggestion per field, also under races. The API maps `P2002` to 409 «Ya hay una sugerencia abierta para ese dato».

Values are serialized as text: a uuid for materia and profesor, the enum name for tipo, and the year for ciclo. One column pair serves every field, and the snapshot comparison is a string equality.

### Escalation and closing are computed on read

- **Phase:** `phase(s, now)` is `AUTHOR` while `OPEN` and `now < created_at + 7 days`, otherwise `MODERATION`. «Mis envíos» lists phase `AUTHOR`, and Correcciones lists phase `MODERATION`. The author endpoint refuses a decision outside its phase with 409, and the moderation endpoint refuses one inside the author phase with 409.
- **Obsolete:** a suggestion is obsolete when the material is not `PUBLISHED`, is deleted, or its field no longer serializes to `current_value`.
  - Listings filter obsolete suggestions out in SQL: they join the material and compare the field.
  - Any decision on an obsolete suggestion marks it `CLOSED` with its reason and answers 409 «La sugerencia ya no aplica».
  - A short Nest-free helper `closeObsolete(tx, materialId)` also runs inside `MaterialsService.update` and the moderation REMOVE decision. Stored statuses then follow most changes right away, and on-read filtering remains the guarantee.
- **Limit:** a student can have at most 10 open suggestions, counted when creating.

### Accepting reuses the author's edit

`MaterialsService.update` splits into:
- the ownership check, for authors;
- `applyClassification(tx, material, changes)`, which runs `assertAcademicContext` and the pioneer revert and evaluate.

An accepted suggestion runs inside one transaction:
1. lock the suggestion row (`SELECT … FOR UPDATE`);
2. re-check that it is open and not obsolete;
3. `applyClassification`;
4. mark it `ACCEPTED`;
5. `ledger.award(CORRECTION_ACCEPTED, referenceId = suggestion.id, +2)`, with a weekly cap of 10 points, like reportes;
6. close other open suggestions that applying made obsolete.

A failed academic-context check rolls everything back with a 400.

**Profesor:** the API validates it against the materia that results after the change, either the current one or the corrected one, using `assertAcademicContext`.

### Priority reportes

- **`Report.priority`:** a boolean, default false. `ReportsService.file` computes `priorityReporter` before creating the report, in the same transaction, and stores it.
- **Queue:** `QueueItem` gains `priorityReport: boolean`, which is true when any `OPEN` reporte of the caso is priority. `byUrgency` inserts it after `highPriority`. `cases.service.ts` adds it to the queue query with `EXISTS`.
- **Not shown:** the reporte list in a caso does not show priority, and reporters stay hidden.

### Eligibility in Usuarios, for admins only

- **Admins:** `moderation-users.service.ts` adds filter `eligible` and a field `eligible: boolean` per account, only when the viewer is ADMIN or SUPERADMIN.
- **Moderators:** for a MODERATOR the filter is rejected with 403, and the field is absent.
- **Cost:** eligibility is computed for the accounts on the current page. Under the `eligible` filter it is computed for USER accounts with `maxLevel ≥ 6` and age ≥ 6 months, a small set, then filtered in memory and paginated.

### Promoting, and hardening the role endpoint

- **«Hacer moderador»:** `POST /moderation/users/:id/promote` (ADMIN and SUPERADMIN) changes only a `USER` account to `MODERATOR`, and records who did it in the moderation history as a system note. `UsersPanel` shows the action on eligible accounts.
- **The existing `PATCH /admin/users/:id/role`** gets a DTO with `@IsEnum(Role)`. Granting or removing ADMIN or SUPERADMIN requires the caller to be SUPERADMIN, and nobody can change their own role. Today any ADMIN can make anyone SUPERADMIN.

### Lupa

- A migration row inserts `lupa` (Rara, after `ojo-atento` in `sort_order`).
- `badge-snapshot.ts` loads `acceptedCorrections`, the count of `ACCEPTED` suggestions by the user, whatever happened to the material later.
- `badge-catalog.ts` adds `single(acceptedCorrections, 10)`.
- The «Tu progreso» insignias list picks it up with no frontend change, because its art exists.

### Endpoints

| Method and path | Who | Purpose |
|---|---|---|
| `GET /users/me/privileges` | self | «Tu progreso»: `suggestCorrections`, `priorityReports` and `standing` |
| `POST /materials/:id/corrections` | privilege holders | create: `{ field, proposedValue, comment? }` |
| `GET /users/me/correction-suggestions` | author | phase `AUTHOR` on their materials: field, current and proposed value (with labels), comment, no suggester |
| `POST /correction-suggestions/:id/accept`, `/reject` | author | author decision |
| `GET /moderation/corrections` | MODERATOR+ | phase `MODERATION`, oldest first, excluding the moderator's own suggestions and materials |
| `POST /moderation/corrections/:id/accept`, `/reject` | MODERATOR+ | moderation decision, with the same exclusion |

Every response carries display labels: materia name and code, professor name, tipo label. The frontend never resolves ids.

### Frontend

- **`MaterialPreviewDialog`:** shows «Sugerir corrección» when `GET /users/me/privileges` says the privilege is active and the material is not the viewer's. It opens a small form:
  - a field select;
  - a value input that depends on the field: materia select from the facultad's materias in the hierarchy API, tipo select, a year input, or a professor select from the materia's professors;
  - a comment;
  - submit.
- **`MySubmissions`:** a «Sugerencias para tus materiales» section with accept and reject.
- **`/admin/correcciones`:** `CorrectionsPanel`, plus a new tab in `ModerationHeader` with its count.
- **`UsersPanel`:** an «Elegibles» filter chip and an «Elegible» mark, for admins only, and the «Hacer moderador» action.
- **«Tu progreso»:** a `PrivilegesCard` with both privileges and their missing items.
- **`/puntos`:** rows for corrections, Lupa and privileges.

## Risks / Trade-offs

- **Who suggested, in moderation:** a suggestion proves its author was in good standing on its date. Shown to a MODERATOR, it would let them rule out its author as the writer of an anonymous entry they retired in the last 90 days. Only ADMIN and SUPERADMIN see the suggester, decided after the review.
- **Concurrency:** deciding locks the suggestion and then the material (`FOR UPDATE`), and `applyClassification` locks and re-reads the material. An author's edit and an accepted correction never validate against stale values. Creating takes an advisory lock per suggester, so the 10-open limit holds under parallel requests.

- **Priority leaks nothing new to moderators:** they never see reporters, and the flag only nudges order inside a group. A moderator who just retired someone's anonymous content cannot connect it to that person's future reportes.
- **A suggestion can sit obsolete:** its stored status lags until a listing or decision touches it. Listings filter on read, so nobody acts on it.
- **Author anonymity toward the suggester is not needed:** materials are never anonymous. The suggester's identity is hidden from the author so the author judges the content and no feuds start.
- **Eligibility cost:** computing standing per candidate is a few queries each. The candidate set (nivel 6 or more, 6 months old) is small. If it grows, cache it per request.
- **Changing role semantics on `PATCH /admin/users/:id/role`:** ADMIN callers lose the ability to grant ADMIN. No UI uses it, and it is documented in README_SECURITY.

## Migration Plan

1. The migration `trust_privileges` adds:
   - the enums `CorrectionField`, `CorrectionStatus`, `CorrectionDecider` and `CorrectionClosedReason`;
   - the value `CORRECTION_ACCEPTED` in `PointReason`;
   - the table `correction_suggestions` with its partial unique index;
   - `reports.priority boolean default false`;
   - the `lupa` badge row.

   Existing reportes stay non-priority.
2. Dev database: `prisma migrate deploy` only.
3. Rollback: `rollback.sql` drops the table, the column, the badge row and its user badges, and the enums. Postgres cannot drop an enum value, so the rollback rebuilds `PointReason` without it only if no movimiento uses it, and otherwise aborts. It also deletes the migration row.
