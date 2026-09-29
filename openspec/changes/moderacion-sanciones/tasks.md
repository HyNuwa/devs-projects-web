## 1. Vitest in the backend

- [x] 1.1 Add Vitest with `unplugin-swc` to `apps/backend`: `vitest.config.ts` for `src/**/*.test.ts` and `vitest.e2e.config.ts` for `test/**/*.e2e.test.ts`, threads pool with at most 2 threads, plus the scripts `test:vitest`, `test:vitest:e2e` and `test:all`. Verify with a throwaway Nest-injected service test that decorators and DI work, that `pnpm test` (Jest) does not pick up `*.test.ts`, and that Vitest does not pick up `*.spec.ts`. Delete the throwaway test afterwards.

## 2. Schema and migration

- [x] 2.1 Add `Sanction`, `SuspensionProposal` and `Appeal`, with their enums, the partial unique index for one PENDING proposal per user, the CHECK for exactly one appeal target, and the unique indexes on `Appeal.caseId` and `Appeal.sanctionId`. Also add `User.bannedUntil`, the new `ModerationEventAction` values, and `ModerationCase.targetAuthorId` and `revertedAt`, backfilling `targetAuthorId` from each target's author and `revertedAt` for restored casos. Verify with a Vitest migration test:
  - backfilled authors, including anonymous content
  - a second appeal of the same caso is refused
  - a second PENDING proposal is refused
  - no account has an active sanction after the migration
- [x] 2.2 Set `targetAuthorId` wherever casos are opened (reports and revisión previa) and `revertedAt` on restore. Verify with Vitest service tests on both paths.
- [x] 2.3 Extend the seed with accounts at each escalera step, one silenced account, one suspension proposal, one suspended account, and pending appeals of a retiro and of a silenciamiento. Verify that the seed runs after `migrate reset`.

## 3. Rule functions

- [x] 3.1 Implement `suggestedStep` test-first, with a fixed clock. Cover every scenario of «Suggested escalera»: first, second and third retiro; a retiro after a silenciamiento; warnings and mutes older than 90 days ignored; a suspension never expiring; restored retiros and voided sanciones excluded. Verify the Vitest unit tests pass.
- [x] 3.2 Implement `canSanction`, `canAppeal` and `canReview` test-first. Cover:
  - the role matrix and self-sanction
  - sanctioning from a caso the actor reported
  - the 14-day window, no second appeal, and non-appealable decisions
  - excluding the decider and the appellant
  - suspensions only for ADMIN+

  Verify the Vitest unit tests pass.

## 4. Sanctions backend

- [x] 4.1 Implement `SanctionsService` warn / mute / unmute / suspend / liftSuspension test-first. Each writes the `Sanction` row, the `User` cache and the event in one transaction, refuses an empty reason, and deletes refresh tokens on suspension. Verify with Vitest service tests, including that the cache matches the rows after each operation.
- [x] 4.2 Implement suspension proposals test-first. A proposal has no effect on the account; confirming can change the duration; rejecting requires a reason; confirming with «Retirar también sus aportes publicados» retires each `Publicado` contribution through its own closed REMOVE caso and reverts its points. Verify with Vitest service tests.
- [x] 4.3 Add «Advertir también» to «Retirar». `CaseDecisionDto.warn` makes `DecisionsService` warn inside the same transaction, linked to the caso, and anonymous content stays hidden. Verify with a Vitest service test and a Vitest e2e test of the decision endpoint.
- [x] 4.4 Expose the sanction endpoints under `/moderation/users/:id/…` (warn, mute, unmute, propose, suspend, lift) and `/moderation/suspension-proposals/:id/{confirm,reject}`, with role guards. Verify with Vitest e2e tests of the role matrix: a moderator cannot silence a moderator, and a moderator cannot confirm a proposal.

## 5. Enforcement

- [x] 5.1 Implement `AccountStatusService.assertCanContribute` and `@RequiresActiveAccount()` test-first, and apply them to every write endpoint listed in design.md. Verify with Vitest e2e tests:
  - silenced and suspended accounts get 403 with their code and `until` on each endpoint
  - saving and downloading still work
  - once `mutedUntil` has passed, writing works again
- [x] 5.2 Refuse login and refresh for suspended accounts with 403 `ACCOUNT_SUSPENDED` (reason, until, appealable, deadline) only after a correct password, and keep the generic 401 for a wrong one. Verify with Vitest e2e tests, including that a refresh token issued before the suspension no longer works.
- [x] 5.3 Add `restriction` and `unseenWarning` to `GET /auth/me`, and add `POST /me/warnings/:id/seen`. Verify with Vitest e2e tests.

## 6. Appeals backend

- [x] 6.1 Implement `AppealsService.file` for retiros and sanciones, and `POST /auth/suspension-appeal` with credential check, throttling and no token issued. Verify with Vitest service and e2e tests covering every «What can be appealed» and «A suspended account appeals from sign-in» scenario.
- [x] 6.2 Implement answering test-first:
  - an accepted retiro restores the content, re-awards its points, sets `revertedAt` and voids the linked advertencia
  - an accepted sanción is lifted and stops counting
  - a rejection keeps the decision
  - a reason is required
  - the conditional update prevents a double answer
  - events are written

  Verify with Vitest service tests.
- [x] 6.3 Expose `GET /moderation/appeals`, `GET /moderation/appeals/:id` and `POST /moderation/appeals/:id/answer`, filtered by `canReview`, with «Autor oculto» for anonymous content. Also expose the author's appeals in `GET /me/submissions` and `GET /me/sanctions`. Verify with Vitest e2e tests: a moderator never sees appeals of their own decisions or of suspensiones, and the appellant never sees the reviewer.

## 7. Queue, users and summary

- [x] 7.1 Add the Vencidos group to `groupQueue` (48 h after `hiddenAt` for hidden content, 7 days after `openedAt` otherwise, most overdue first) and add `GET /moderation/summary`. Verify with Vitest unit tests on the grouping and an e2e test of the summary counts.
- [x] 7.2 Implement `GET /moderation/users` (filters suggested, sanctioned and prior-review, search, and pending proposals for admins) and `GET /moderation/users/:id`. The file includes the masked email, counts, precision (null below 5 resolved reportes), the timeline and the paso sugerido. Verify with Vitest e2e tests, including that no id of an anonymous caso appears in the file and that its sanction shows as `anonymousCase`.
- [x] 7.3 Record sanctions, proposals and appeals in Historial, with 2a's masking applied to anonymous casos. Verify with a Vitest service test.

## 8. Frontend

- [x] 8.1 Add the Usuarios and Apelaciones tabs to `ModerationHeader`, with counts from the summary, and the admin overdue banner. Verify with Vitest component tests.
- [x] 8.2 Build the Usuarios tab to match the canvas `ModeracionUsuarios`: list, filters and search; the file with status, counts, precision, timeline and paso sugerido; and the actions the viewer may take, each with a required reason. Admins also get proposal confirm and reject, the duration choice and «Retirar también sus aportes publicados». Verify with Vitest component tests.
- [x] 8.3 Build the Apelaciones tab to match the canvas `ModeracionApelaciones`: list, detail with the appealed decision, the explanation, the content (or «Autor oculto») and the answer with a required reason. Verify with Vitest component tests.
- [ ] 8.4 Add the Vencidos group to Casos, and add «Advertir también» to «Retirar», preselected from the paso sugerido. Verify with Vitest component tests.
- [ ] 8.5 Add `useAccountRestriction`, the shell `SanctionBanner` (active sanction, and an unseen warning shown once), and the disabled state with the shared explanation on Subir material, the reseña and experiencia forms, Reportar, «Me sirvió» and resubmitting. Verify with Vitest component tests.
- [ ] 8.6 Add the suspension screen to the login page from the 403 body, with the «Apelar esta suspensión» form. The client also signs out and shows that screen on any 403 `ACCOUNT_SUSPENDED`. Verify with Vitest component tests.
- [ ] 8.7 In Mis envíos, add «Apelar» on retiros within 14 days with an appeal dialog, the appeal status and answer, and the Sanciones section. Verify with Vitest component tests.
- [ ] 8.8 Add the sanciones and apelaciones sections to `/normas`, removing the 2a restriction. Verify with the page test.

## 9. Verification

- [ ] 9.1 Run backend lint, build, Jest (unit and e2e), Vitest (unit and e2e) and the migration tests; and frontend lint, `verify:design-tokens`, tests and build. Keep full output in `.audit-logs/`. Verify that the summaries show zero failures.
- [ ] 9.2 In a real browser against the real backend and the seeded database, exercise these flows at 390 and 1440px, and save evidence to `docs/validation/evidence/moderacion-sanciones/`:
  - retire with «Advertir también» → the author sees the warning once and in Sanciones
  - second retiro → paso sugerido «Silenciar» → silence → the author's write actions are disabled and the API refuses them → unmute
  - propose a suspension → admin confirms → the open session cannot write or refresh → the login screen shows the suspension → appeal from login
  - appeal of a retiro → another moderator accepts → the content and points are back
  - a moderator does not see appeals of their own decisions
  - an overdue caso appears in Vencidos and admins see the banner

  Also verify no serious axe violations on Usuarios, Apelaciones, the login suspension screen and Mis envíos.
- [ ] 9.3 Run `graphify update .` and verify it completes.
