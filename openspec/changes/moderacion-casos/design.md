## Context

See `proposal.md` for motivation and scope. Current state that shapes the approach:

- **Materials** carry `moderationStatus` (`PENDING`/`APPROVED`/`REJECTED`), `moderationReason`, `isApproved` and `isRemoved`. Uploads are staged locally (`stagedFilePath`) and `FileStorageService.publish` moves them to Google Drive only when a moderator approves. `MaterialsService.approve` awards 10 points (`MATERIAL_APPROVED`). Every public read filters on `moderationStatus: 'APPROVED'`.
- **Reseñas and experiencias** carry `isRemoved`/`removedAt`/`removedById`, are public on creation and award 5 points on creation. `CommunityReport` (no state, nullable FK per type) and `CommunityModerationAction` (REMOVE/RESTORE) live in `subjects/community-moderation.*`.
- **Other records:** `ModerationLog` is written only by `MaterialsService`. No scheduler exists. `isMuted` is not enforced anywhere, which is 2b's job. The project is not deployed, so migrations only have to carry dev and seed data.
- **Frontend:** `/admin` renders `ModerationPanel` (pending materials) and `CommunityModerationPanel` (reports). Reports on reseñas and experiencias go through `lib/community-report-client.ts`. `MySubmissions` lists `/materials/mine`.
- **Canvas references:** `ModeracionCasos`, `ModeracionCasoResena`, `ModeracionHistorial` and `Normas` in `design/canvas/home/project/`.

## Goals / Non-Goals

**Goals:**
- One publication status and one public-visibility rule used by every read path.
- One queue of casos that covers both reportes and revisión previa.
- One append-only history.
- Keep each backend rule (publication decision, hide threshold, points ledger) in a small, pure, unit-testable function.

**Non-Goals:**
- Sanctions, appeals, the Usuarios and Apelaciones tabs, scheduled jobs, retention, facultad scope and email notifications (2b and later).
- Redesigning the public material, reseña or experiencia pages. Only a «Reportar» entry is added to the existing material preview dialog.

## Decisions

### 1. `PublicationStatus` enum on the three content models
`enum PublicationStatus { PUBLISHED PENDING_REVIEW REJECTED HIDDEN REMOVED }`. The same set of columns goes on `Material`, `CourseReview` and `ExamExperience`:
- `publicationStatus` (default `PUBLISHED`)
- `statusChangedAt`
- `hiddenAt` (nullable)
- `authorFacingReason` (nullable; the latest reason the author may see)

The migration maps the old data: `APPROVED`→`PUBLISHED`, `PENDING`→`PENDING_REVIEW`, `REJECTED`→`REJECTED`, `isRemoved`→`REMOVED`. It then drops `moderationStatus`, `moderationReason`, `isApproved`, `isRemoved`, `removedAt` and `removedById`. Indexes that include `moderationStatus` are recreated on `publicationStatus`.
*Alternative considered:* keeping per-model flags. Rejected in grilling (P5).

### 2. One visibility predicate
`moderation/visibility.ts` exports `publicVisibility(now)`, a Prisma `where` fragment: `publicationStatus = PUBLISHED OR (publicationStatus = HIDDEN AND hiddenAt < now − 7 days)`. It also exports `isOverdueHidden(record, now)`. Every public read in `materials`, `discovery` and `subjects` (lists, search, hierarchy counts, aggregates, detail, preview, download, comments) uses the fragment. A grep-based unit test fails if a read path still filters on the old fields.
*Alternative considered:* a scheduled job that flips expired `HIDDEN` rows back. Rejected in grilling (P7) because there is no scheduler.

### 3. Casos cover reportes and revisión previa
```
ModerationCase { id, kind: REPORTS | PRIOR_REVIEW, status: OPEN | CLOSED,
                 targetType: MATERIAL | COURSE_REVIEW | EXAM_EXPERIENCE,
                 materialId?, courseReviewId?, examExperienceId?,   // exactly one (CHECK)
                 highPriority, openedAt, decision?, decidedById?, decidedAt?, decisionReason?, internalNote? }
Report { id, caseId, reporterId, reason, explanation?, status: OPEN | CONFIRMED | DISMISSED,
         materialId?, courseReviewId?, examExperienceId?, createdAt }
```
- **Nullable foreign keys** keep referential integrity and follow the existing `CommunityReport` pattern. Eventos and Clasificados will add their own columns.
- **Raw SQL in the migration** adds the constraints Prisma can't express: a `CHECK` for exactly one target, a partial unique index for one `OPEN` case per target and kind, and unique `(reporterId, <target>)` indexes so an account can report a target only once.
- **Old reports:** `CommunityReport` rows migrate into `Report`, each with a case. Then the table is dropped.

**Revisión previa as a caso:** it is a case with `kind = PRIOR_REVIEW`, opened at submission, so the panel reads a single queue.
**Resubmission:** a resubmitted item opens a new `PRIOR_REVIEW` case. The closed one stays as history and is shown in the detail.

### 4. Append-only `ModerationEvent` replaces both logs
```
ModerationEvent { id, actorId?  (null = Sistema), action, targetType?, materialId?, courseReviewId?,
                  examExperienceId?, targetUserId?, caseId?, reason?, metadata Json?, createdAt }
action: PRIOR_REVIEW_OPENED | PRIOR_REVIEW_APPROVED | PRIOR_REVIEW_REJECTED | RESUBMITTED | AUTO_HIDDEN |
        AUTO_UNHIDDEN_OVERDUE | KEPT_VISIBLE | REMOVED | RESTORED | AUTHOR_REVEALED | REPORT_FILED
```
- **Append-only at the database:** a `BEFORE UPDATE OR DELETE` trigger raises an exception, so the log is protected even from bugs.
- **Migration:** `ModerationLog` and `CommunityModerationAction` rows migrate into it, and both tables are dropped. User-sanction actions (`BAN_USER`, `MUTE_USER`, …) exist only as enum values with no production rows; 2b re-adds them to this enum.
- **No foreign keys to content:** events store target ids without foreign keys, plus a short label of the target in `metadata`. A cascade from an author's permanent deletion would otherwise hit the append-only trigger and block the deletion; this way the history also survives the content. Legacy log actions with no equivalent yet (for example `BAN_USER`) migrate as `LEGACY_ACTION`, with the original action in `metadata`.
- **Revelación de autor** is an event (`AUTHOR_REVEALED` with the reason), not a separate `AuthorReveal` table. The history API filters those events out unless the viewer is ADMIN or SUPERADMIN. `README_MODERACION.md` §12.1 is updated to match.
- **`AUTO_UNHIDDEN_OVERDUE`** is written lazily, the first time a read or the panel notices an overdue hidden case. It is idempotent by case.
*Alternative considered:* keeping two logs and merging them in the UI. Rejected in grilling (P13).

### 5. Pure rule functions
In `moderation/rules.ts`, all unit-tested with a fixed clock:
- `priorReviewReason(author, now)` returns `'NEW_ACCOUNT' | 'UNVERIFIED_EMAIL' | 'RECENT_REMOVAL' | null`. «Recent removal» means a `REMOVED` event on content authored by the user within 90 days.
- `isQualifiedReporter(user, now)`: verified email and account older than 7 days.
- `hideDecision(openReports, newReport, now)` returns `'HIDE' | 'HIGH_PRIORITY' | 'NONE'`. It hides on 3 distinct qualified reporters within 48 hours, or on 1 qualified `DATOS_PERSONALES` report. An unqualified `DATOS_PERSONALES` report returns `HIGH_PRIORITY`.
- `nextStatusFor(decision, current)`: the state machine. It rejects illegal transitions, such as restoring non-removed content or keeping visible a prior-review case.

Services call these functions inside a single Prisma transaction per command (report, decision, submission), so status, case, reports, events and points change together.

### 6. Material upload pipeline
Inside `MaterialsService.create`, in this order:
1. Validate format, size (25 MB) and non-empty file (existing checks plus the empty-file check).
2. Compute the SHA-256 hash while reading the upload buffer and store it in `fileHash`, indexed on `(subjectId, fileHash)`.
3. If a `PUBLISHED`, `PENDING_REVIEW` or `HIDDEN` material in the same materia has the same hash, return `409` with `{ code: 'DUPLICATE_MATERIAL', materialId }`.
4. If the author has 10 or more materials created in the last 24 hours, return `429` with `{ code: 'UPLOAD_LIMIT', retryAt }`.
5. Evaluate `priorReviewReason`. If it is `null`, publish to Drive in the same request (the existing `publish` from a temporary staged path) and create the material as `PUBLISHED`, with its points. Otherwise keep the staged file and create it as `PENDING_REVIEW` with an open `PRIOR_REVIEW` case.

The response tells the client which of the two happened and the reason code, so Subir material can show the right message. If the Drive publish fails, the request fails and nothing is created; the staged file is discarded.

### 7. Points ledger
`PointService` gains `awardFor(userId, amount, reason, referenceId)` and `revertFor(referenceId)`. Both read the net `PointTransaction` sum for the `referenceId`: award is a no-op when the net is already positive, and revert writes a negative `…_REVERTED` transaction only when it is positive. This makes retire → restore → retire safe. Reasons stay as they are today (`MATERIAL_APPROVED` is renamed `MATERIAL_PUBLISHED`), and the amounts stay 10/5. The points change will redefine them.

### 8. API surface
New `ModerationModule` (`src/modules/moderation`):
- `POST /reports` `{ targetType, targetId, reason, explanation? }`: any signed-in user.
- `GET /moderation/cases?group=hidden|prior-review|reported`, `GET /moderation/cases/:id`: moderators and up. The detail includes the target preview data, reports (reporter identity never exposed; «Estudiante con buena precisión» is out of scope), the author or `{ hidden: true }`, and earlier cases for the same target.
- `POST /moderation/cases/:id/decision` `{ decision: KEEP_VISIBLE | REMOVE | RESTORE | APPROVE | REJECT, reason? }`: enforces the conflict-of-interest rule and reason requirements.
- `POST /moderation/cases/:id/reveal-author` `{ reason }`.
- `GET /moderation/history?action&actor&target&from&to&cursor`.
- `GET /me/submissions`: materials, reseñas and experiencias of the current user with status, reason and date.
- `POST /me/submissions/:type/:id/resubmit`: after an owner edit of a `REJECTED` item.

**Removed:** `GET /materials/pending`, `POST /materials/:id/approve|reject`, and the report/remove/restore endpoints in `community-moderation.controller.ts`, along with that controller, service and DTOs. There are no external consumers.

### 9. Frontend
- **`/admin`** is rebuilt as `ModerationPanel` with tabs Casos and Historial (`/admin` and `/admin/historial`), following `ModeracionCasos`, `ModeracionCasoResena` and `ModeracionHistorial`.
  - Casos is a two-column layout: a grouped list on the left and the case detail on the right.
  - Keyboard: a single `useModerationShortcuts` hook handles J/K/V/R. It is ignored while typing in inputs, and V/R only open the action and focus the reason field.
  - The material preview reuses the existing preview component from `components/discovery`.
- **`ReportDialog`** is one shared component: fixed reasons, explanation required for `OTRO`, and a link to `/normas`. It is used from `MaterialPreviewDialog` (new «Reportar» action) and replaces the report UI of reseñas and experiencias (`community-report-client.ts` points to `POST /reports`).
- **`MySubmissions`** is rewritten to read `/me/submissions`. Each item shows its status chip, reason and date, and `REJECTED` items get «Editar y reenviar».
- **`MaterialCreateForm`** copy becomes «Se publica al instante» and it handles three outcomes: published (link to the material), prior review with its reason, and the duplicate (409, link to the existing material) or limit (429) errors.
- **`/normas`** lives in `app/(site)/normas/page.tsx` as a static server component with text adapted from the `Normas` artboard. Sections: Lo principal, Materiales, Reseñas y experiencias, Convivencia, Si algo no cumple (steps 1–3 only).
- **`SiteFooter`** gains a Normas link.

## Risks / Trade-offs

- [Publishing to Drive inside the upload request makes uploads slower and ties them to Drive availability] → Same call the approval already makes today. Failures return a clear error, nothing is left half-created, and the student can retry.
- [The lazy «overdue hidden» rule means a record's effective visibility depends on the current time] → A single predicate plus `isOverdueHidden`, tested with a fixed clock, and the panel flags the case so it isn't forgotten.
- [Dropping `ModerationLog` and `CommunityModerationAction` loses nothing today, but 2b needs sanction actions] → 2b extends the `ModerationEvent.action` enum; the event table already has `targetUserId`.
- [Anyone who meets no prior-review condition can publish abusive content instantly] → Accepted by ADR 0001. Qualified-report hiding and the 10-per-day limit bound the damage until 2b adds sanctions.
- [Large change surface across backend and frontend] → Tasks are ordered so the schema and rule functions land first with tests, then the services, then the UI. Each group keeps the suite green.

## Migration Plan

One Prisma migration, plus the raw SQL for the CHECK constraints, partial unique indexes and the append-only trigger, and data mapping as in decisions 1, 3 and 4. It is tested with `prisma migrate reset` on dev data and the updated seed, which gets materials in each status, a prior-review case, reportes, a hidden item and an anonymous reseña. Rollback before deployment means reverting the branch and resetting the database; the project has no production data.

## Open Questions

- Exact wording of the reason messages shown to authors for each `priorReviewReason` (for example «Tu cuenta es nueva: la revisamos antes de publicarla»). It can be settled while writing the UI copy without changing the specs.
