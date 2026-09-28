## 1. Schema and migration

- [ ] 1.1 Add `PublicationStatus` with `statusChangedAt`, `hiddenAt` and `authorFacingReason` to `Material`, `CourseReview` and `ExamExperience`, plus `Material.fileHash` with its `(subjectId, fileHash)` index. Map the old data (APPROVED→PUBLISHED, PENDING→PENDING_REVIEW, REJECTED→REJECTED, isRemoved→REMOVED), then drop the old columns. Verify that `prisma migrate reset` applies cleanly and that a migration test asserts the mapping on seeded rows.
- [ ] 1.2 Add `ModerationCase`, `Report` and `ModerationEvent`. In raw SQL, add the CHECK for exactly one target, the partial unique index for one OPEN case per target and kind, the unique reporter-per-target indexes, and the append-only trigger. Migrate the `CommunityReport`, `CommunityModerationAction` and `ModerationLog` rows, then drop those tables. Verify with a database test that updating or deleting a `ModerationEvent` raises, that a second OPEN case for the same target is refused, and that migrated rows are present.
- [ ] 1.3 Update `prisma/seed.ts` with materials in every status, one prior-review case, a reported and a hidden item, and an anonymous reseña with reports. Verify that `pnpm seed` succeeds after `migrate reset`.

## 2. Rule functions

- [ ] 2.1 Implement `publicVisibility(now)` and `isOverdueHidden` test-first, with a fixed clock: PUBLISHED is visible, HIDDEN for 7 days or less is not, HIDDEN for more than 7 days is, and every other status is not. Verify the unit tests pass.
- [ ] 2.2 Implement `priorReviewReason`, `isQualifiedReporter` and `hideDecision` test-first, covering every scenario of «Revisión previa for risky accounts» and «Ocultamiento preventivo on strong signals», including the unqualified personal-data report returning HIGH_PRIORITY. Verify the unit tests pass.
- [ ] 2.3 Implement the `nextStatusFor` state machine test-first, covering the legal and illegal transitions for every decision and for resubmission. Verify the unit tests pass.
- [ ] 2.4 Extend `PointService` with idempotent `awardFor`/`revertFor` test-first. Retire → restore → retire must end at a net 0, and double award must be a no-op. Verify the unit tests pass.

## 3. Publication backend

- [ ] 3.1 Switch every public read in `materials`, `discovery` and `subjects` (lists, search, hierarchy counts, aggregates, detail, preview, download, comments) to `publicVisibility`. Add a guard test that fails if source still filters on `moderationStatus`/`isRemoved`/`isApproved`. Verify existing discovery and materials specs pass once updated to the new statuses.
- [ ] 3.2 Rework `MaterialsService.create` test-first: empty-file check, hash, duplicate 409 with `materialId`, 10-per-24h 429 with `retryAt`, immediate Drive publish with points, or PENDING_REVIEW with a staged file, an open case and an event. Verify with service specs for each outcome, including a Drive failure leaving nothing created.
- [ ] 3.3 Make reseña and experiencia creation follow the same decision: publish with points, or PENDING_REVIEW with a case, and return the outcome and reason code. Verify with service specs.
- [ ] 3.4 Add `GET /me/submissions` and `POST /me/submissions/:type/:id/resubmit` test-first. The first covers all three types, including anonymous ones, and exposes no moderator identity. The second is owner-only, only from REJECTED, opens a new PRIOR_REVIEW case and records `RESUBMITTED`. Verify with controller/e2e specs, including another user getting 403.
- [ ] 3.5 Remove `/materials/pending`, `/materials/:id/approve|reject` and `community-moderation.*` (controller, service, DTOs and their specs). Verify that the backend build and the full suite pass with no references left.

## 4. Cases backend

- [ ] 4.1 Implement `POST /reports` test-first: signed-in only, not own content, only visible content, once per account, joins or opens the case, and applies `hideDecision` inside a transaction (HIDDEN + `AUTO_HIDDEN` event, no points change) or marks the case high priority. Verify with the spec scenarios as service and e2e tests.
- [ ] 4.2 Implement the case queue and detail test-first: grouping (hidden, prior review, reported), ordering (hidden first, then report count, then oldest), author or `{ hidden: true }` for anonymous entries, earlier cases, reporter identities never exposed, the lazy `AUTO_UNHIDDEN_OVERDUE` event, and moderator-only access. Verify with service and e2e specs.
- [ ] 4.3 Implement `POST /moderation/cases/:id/decision` test-first:
  - KEEP_VISIBLE, REMOVE (reason required, author-facing, points reverted, aggregates exclude), RESTORE (reason required, points re-awarded), APPROVE and REJECT (reason required) for prior review
  - reports confirmed or dismissed, case closed, event written
  - conflict of interest refused (own content, or the moderator filed a report)

  Verify that every «Decisions on a caso» and «Conflict of interest» scenario passes.
- [ ] 4.4 Implement `POST /moderation/cases/:id/reveal-author` (reason of at most 300 characters required, `AUTHOR_REVEALED` event) and `GET /moderation/history` (filters, cursor, reveal events only for ADMIN/SUPERADMIN, no update or delete routes) test-first. Verify with specs for MODERATOR vs ADMIN visibility.

## 5. Frontend

- [ ] 5.1 Build the shared `ReportDialog` test-first (fixed reasons, explanation required for Otro, sign-in redirect for visitors, link to `/normas`). Wire it into `MaterialPreviewDialog` and the reseña and experiencia views through `POST /reports`, and delete `community-report-client.ts`'s old endpoints. Verify with component tests.
- [ ] 5.2 Rewrite `MySubmissions` on `/me/submissions` test-first: status chip per state, reason and date, «Oculto mientras se revisa» explained as temporary, and «Editar y reenviar» for REJECTED that calls resubmit after editing. Verify with component tests.
- [ ] 5.3 Update `MaterialCreateForm` and the reseña and experiencia forms test-first: «Se publica al instante» copy with a `/normas` link, a published outcome with a link, a prior-review outcome with its reason, the duplicate 409 linking the existing material, and the 429 limit message. Verify with component tests.
- [ ] 5.4 Rebuild `/admin` as the Casos tab test-first, following `ModeracionCasos`/`ModeracionCasoResena`:
  - grouped list and detail with preview, reports, previous cases, and author or «Autor oculto» + «Ver autor» with reason
  - required-reason decision controls, with controls disabled on a conflict of interest
  - J/K/V/R shortcuts that never decide on their own

  Remove the old `ModerationPanel`/`CommunityModerationPanel`. Verify with component tests, including keyboard behavior.
- [ ] 5.5 Build the Historial tab (`/admin/historial`) following `ModeracionHistorial` test-first, with filters and «Sistema» rows. Reveal rows appear only for admins. Verify with component tests.
- [ ] 5.6 Add `/normas` (Lo principal, Materiales, Reseñas y experiencias, Convivencia, Si algo no cumple steps 1–3, with no Clasificados/Eventos/appeals/sanctions) and the footer Normas link test-first. Verify with a page test and the updated `SiteFooter` test.

## 6. Integrated verification

- [ ] 6.1 Run backend lint, build, unit and e2e suites, and frontend lint, `verify:design-tokens`, tests and build, with full output in `.audit-logs/`. Verify that the summaries show zero failures.
- [ ] 6.2 In a real browser against the real backend and the seeded database, exercise these flows at 390 and 1440px, and save evidence to `docs/validation/evidence/moderacion-casos/`:
  - established upload → published
  - new-account upload → prior review → approve
  - reject → edit and resubmit
  - duplicate upload
  - three qualified reports → hidden → keep visible
  - personal-data report → hidden → retire → author sees the reason → restore
  - anonymous reseña → «Ver autor» → admin sees the reveal in Historial

  Verify there are no serious axe violations on the panel, Mis envíos, Subir material and `/normas`.
- [ ] 6.3 Run `graphify update .` and verify it completes.
