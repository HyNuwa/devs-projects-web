## Why

ADR 0001 replaced approval-before-publication with publicación inmediata and moderación posterior. The code still holds every material in `PENDING` until a moderator approves it: contributions take days to appear, and the approval queue is the product's bottleneck. Reports only exist for reseñas and experiencias, carry no state, never group into casos, and the panel always shows the author of anonymous entries. This change (2a) implements the publication side of `docs/README_MODERACION.md` and the case workflow. Sanctions, appeals and the Usuarios tab follow in change 2b.

## What Changes

- **BREAKING**: Materials, reseñas de cursada and experiencias de final share one publication status: Publicado, En revisión previa, Rechazado en revisión previa, Oculto mientras se revisa and Retirado. It replaces `MaterialModerationStatus`, `isApproved` and `isRemoved`/`removedAt`.
- **BREAKING**: A material that passes the automatic checks is published on upload, and its file goes to Drive at that moment. Automatic checks: supported format and size, non-empty file, materia and tipo de recurso, exact duplicate (same file hash in the same materia) blocked and pointed to the existing one, and at most 10 uploads per account per day.
- Revisión previa applies when the account is younger than 7 days, has an unverified email, or had a retiro in the last 90 days. A moderator approves it (it becomes public) or rejects it (it stays private with a reason, and the author can correct and resubmit).
- Reportes for every published material, reseña and experiencia, with the existing 6 reasons. One report per account per content, never on your own content, only on visible content. Reports group into one caso de moderación per content.
- Ocultamiento preventivo: 3 reports from distinct qualified accounts (verified email, older than 7 days) within 48 hours, or 1 qualified report of exposed personal data. Hidden content reappears on its own after 7 days without review, and stays flagged.
- Decisions on a caso: mantener visible (reports dismissed), retirar (reports confirmed, required reason visible to the author) and restaurar (required internal reason). A moderator cannot decide on their own content or on a caso they reported.
- Revelación de autor: anonymous entries show «Autor oculto» to moderators; seeing the author requires a reason and is recorded.
- One append-only audit log for every human and system action. The existing `ModerationLog` and `CommunityModerationAction` rows migrate into it.
- Points: the existing 10 points per material are awarded on publication instead of approval, reverted on retiro and re-awarded on restauración.
- **Moderation panel** rebuilt on the new visual system with a Casos tab (list grouped Ocultos · Revisión previa · Reportados, detail with preview, reports, author card or «Autor oculto», reason and decision, J/K/V/R keys) and a Historial tab. Usuarios and Apelaciones arrive with 2b.
- **Mis envíos** lists materials, reseñas and experiencias, each with its status, reason and date. A rejected revisión previa can be edited and resubmitted.
- «Reportar» on the material preview dialog. Subir material states that content is published immediately, or why it waits for revisión previa. New `/normas` page, linked from the footer, the report dialog and Subir material.
- Out of scope (2b or later): warnings, silencing and suspension (including enforcing `isMuted`), the escalation ladder, appeals, the Usuarios and Apelaciones tabs, SLA alerts, data retention purges, moderator scope by facultad (arrives with the Facultad model), priority reporters (points change), spam and near-duplicate detection, email notifications, and reporting of eventos and avisos (their own changes).

## Capabilities

### New Capabilities
- `moderation/publication`: publication status shared by materials, reseñas and experiencias; automatic checks; revisión previa and its rejection and resubmission; what authors see in Mis envíos; community rules page.
- `moderation/cases`: reportes, casos de moderación, ocultamiento preventivo, decisions and their effects on visibility and points, revelación de autor, audit history, and the moderation panel.

### Modified Capabilities
- `academic-resources/trust`: removes "Mandatory pre-publication moderation" (superseded by `moderation/publication`) and adds a requirement that publication never implies academic correctness.
- `academic-community/discovery`: "Community publication requires only authentication" now allows risky accounts to land in revisión previa; "Reports do not determine visibility automatically" and "Moderator removal is reversible and attributable" are removed, superseded by `moderation/cases`, which also stops showing anonymous authors to moderators by default.
- `frontend/app-shell`: the minimal footer adds a link to Normas.

## Impact

- **Database**: Prisma migration for the publication status enum on `Material`, `CourseReview` and `ExamExperience`; material `fileHash`; generalized `Report` (with state) replacing `CommunityReport`; new `ModerationCase`, `AuthorReveal` and an append-only `ModerationEvent`; data migration from `ModerationLog` and `CommunityModerationAction`. The project is not deployed, so only dev and seed data migrate.
- **Backend**: `materials` (upload, staging and publish, public reads), `subjects` (community write and moderation), `discovery` (visibility filters), a new `moderation` module (cases, decisions, reveal, history), and `ranking/point.service` (award and revert).
- **Frontend**: admin panel rebuilt (`/admin`), `MySubmissions`, `MaterialCreateForm` copy, report dialog on material preview, `/normas` page, footer link.
- **Docs**: `README_MODERACION.md` §4.4 and §12.1 already updated; `CONTEXT.md` gains «Rechazo en revisión previa» and «Revelación de autor».
