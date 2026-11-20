## Context

See proposal.md for the why. State of the code this design builds on:

- **Catálogo:** `University`, `Faculty`, `Career`, `StudyPlan` (one per carrera, `study_plans_career_id_key`), `StudyPlanSubject` (`year`, `semester`, `credits`), `Subject` (`code` unique, nullable, `VarChar(20)`). Existing FI-UNJU codes are short (`01`, `02`, …). Four triggers keep a materia in one facultad. FKs are `Restrict`.
- **Slugs:** unique indexes on `lower(short_name)` (universities), `(university_id, lower(short_name))` (faculties), `(faculty_id, lower(code))` (careers). `institutions.controller.ts` serves `GET /institutions` and `GET /institutions/browse[/:uni[/:fac[/:career]]]` through `catalog-browse.service.ts`. The `/universidades/...` and `/materias/[codigo]` pages are server components over those endpoints.
- **Declarations:** `GET`/`PUT /users/me/study-plans` (`study-plans.controller.ts`) by `careerId`.
- **Moderation panel:** `ModerationHeader.tsx` defines the tabs (Casos, Correcciones, Usuarios, Apelaciones, Historial) under `/admin/*`. `ModerationEvent` is the append-only history. `history.service.ts` keeps `ADMIN_ONLY_ACTIONS` for events only admins see.
- **Mail:** `MailService` has a private `send` and one method per template (verification, password reset).
- **Semester** is read in `catalog-browse.service.ts`, `CareerView.tsx`, `SubjectHub.tsx`, `catalog-client.ts`, `types/subject.ts` and `ranking-client.ts`. The ranking's `semesterOf` is about calendar halves and is unrelated.

## Goals / Non-Goals

**Goals:**
- One catálogo service that owns every write and its history event, so no write skips the record.
- A carrera en borrador model the bot of change 4c can fill without new concepts.
- Old links keep working after renames.

**Non-Goals:**
- The bot (4c), in-app notifications, moderators editing their facultades' catálogo, merging duplicate materias, plan versions (ADR 0003).

## Decisions

### Carrera en borrador
- `careers.status` enum `CareerStatus { DRAFT, PUBLISHED }`, default `DRAFT`. The migration sets every existing row to `PUBLISHED`.
- **Readers:** `GET /institutions`, the browse endpoints, the study plans declaration, search's facultad and carrera options, and the ranking's carrera lists filter `status = PUBLISHED`. A browse request for a draft carrera returns 404, like an unknown one.
- **Declarations:** `PUT /users/me/study-plans` refuses a draft `careerId` as invalid (400), the same answer as a carrera without a plan.
- **Unpublishing:** allowed only when `user_study_plans` has no row for the carrera's plan. The check and the update run in one transaction that locks the carrera row; a declaration in progress is refused because it reads the status inside its own transaction.
- **Plan row:** creating a carrera creates its single `StudyPlan` in the same transaction (name = carrera name, code = carrera code, `duration` = 0 until materias exist; `duration` is recomputed as the highest año on each placement change).
- **Alternative rejected:** a separate staging table for draft carreras. Publishing would copy rows and break the ids that 4c and the solicitud already point to.

### Materias anuales
- `study_plan_subjects.semester` stays a `SmallInt`. `0` means anual, and a CHECK constraint allows only `0`, `1` and `2`. The API exposes `semester: 0 | 1 | 2`, and the frontend labels `0` as «Anual».
- `CareerView` orders each año's materias with `0` first, then `1`, then `2`.
- **Alternative rejected:** a nullable column or an enum. Either would touch every reader for one extra value, and the column already holds only `1` and `2`, so the CHECK validates without rewriting rows.

### Slug aliases
- A table `catalog_slug_aliases (id, kind, parent_id, slug, target_id, created_at)`:
  - `kind` ∈ `UNIVERSITY`, `FACULTY`, `CAREER`, `SUBJECT`;
  - `parent_id` is the universidad for a facultad and the facultad for a carrera, NULL otherwise;
  - `slug` is stored lowercase, unique on `(kind, coalesce(parent_id, nil-uuid), slug)`;
  - `target_id` has no FK, because it points to one of four tables. Deleting an entity deletes its aliases in the same transaction.
- A rename inserts the old slug as an alias. Renaming back to an old slug deletes that alias.
- A create or rename whose slug equals an alias of another entity in the same parent deletes that alias in the same transaction. The editor first calls a check endpoint that returns the entity the alias points to, so it can warn.
- **Resolution:** the browse endpoints and `GET /subjects/:code` resolve the current slug first. On a miss they look up the alias and answer `{ redirect: <canonical path> }` with 200. The server components call `permanentRedirect()` with it. Chains don't form, because each rename writes aliases that point to the entity id, and the canonical path is built from the current slugs.
- **Facultad renames** change every carrera URL under it with no alias per carrera: the facultad alias is resolved first, then the carrera segment is matched under the current facultad.
- **Alternative rejected:** slug history columns on each table. It would need four sets of queries for the same lookup.

### Materia codes
- `subjects.code` grows to `VarChar(60)`. Existing codes are not touched.
- **Proposal:** `slugify(uni.shortName)-slugify(fac.shortName)-slugify(name)`. `slugify` lowercases, strips accents, turns runs of other characters into `-`, and trims to 60 characters. The code gets `-2`, `-3`, … when it is taken as a code or as a subject alias.
- `POST /admin/catalog/subjects/code-proposal` returns it, so the editor and the carga masiva preview show the same thing.
- Slug-safe codes and short names: `^[A-Za-z0-9-]+$` (DTO validation, plus a CHECK on new writes through a `NOT VALID` constraint so existing rows are not re-checked).

### Catálogo API
- A new `CatalogAdminModule` under `/admin/catalog`, with `@Roles(ADMIN, SUPERADMIN)` on the controller.
  - `GET /tree`, plus lazy children: `/universities/:id/faculties`, `/faculties/:id/careers`, `/careers/:id` with placements, and `/faculties/:id/subjects` for the picker.
  - `POST`/`PATCH`/`DELETE` for universities, faculties, careers and subjects.
  - `POST /careers/:id/publish` and `/unpublish`.
  - `PUT /careers/:id/placements/:subjectId` (año, cuatrimestre, créditos) and `DELETE` for the same placement.
  - `POST /careers/:id/bulk/preview` and `/bulk/apply`.
  - `GET /slug-check?kind&parentId&slug` for the alias warning.
- **One `CatalogService`** owns every write. Each method runs one Prisma transaction that does the change, writes aliases and writes a `ModerationEvent` (see «History»). Controllers never touch Prisma.
- **Deletion checks** count dependents inside the transaction and refuse with 409 and a `blockers` list (for example `{ moderators: 2 }` or `{ declarations: 14 }`), which the UI turns into the message.
- **Trigger errors** (`23514`) and unique violations (`23505`) map to 409 with a field-specific message.

### Carga masiva
- **Parser** (pure function, unit-tested): split lines, trim, skip empty lines, split on `;`. Each line needs `año` 1–10, `cuatrimestre` `1|2|A` (case-insensitive), a non-empty name up to 150 characters, and optional `créditos` 0–99. Each line gets its line number and errors.
- **Preview** (no writes): for each valid row it matches the facultad's materias by `searchKey`-style normalization (lowercase, no accents, collapsed spaces). It returns `reuse` (with the materia id), or `new` (with the proposed code, unique within the batch too). It also flags rows whose materia is already in the carrera as `update` when año, cuatrimestre or créditos differ, and `unchanged` otherwise.
- **Apply:** takes the reviewed rows (each with `action: reuse | new`, `subjectId` or `code` + `name`, `year`, `semester`, `credits`). It re-validates everything and writes it in one transaction. It records one `CATALOG_BULK_APPLIED` event with the counts and the rows. It refuses the whole batch if any row is invalid, and never deletes placements.

### History
- New `ModerationEventAction` values: `CATALOG_CREATED`, `CATALOG_UPDATED`, `CATALOG_DELETED`, `CAREER_PUBLISHED`, `CAREER_UNPUBLISHED`, `CATALOG_PLACEMENT_CHANGED`, `CATALOG_BULK_APPLIED` and `CAREER_REQUEST_RESOLVED`.
- `targetType` stays NULL. `metadata` holds `{ kind, id, label, before, after }`.
- All of them are added to `ADMIN_ONLY_ACTIONS`, so the facultad scoping of moderators never has to place them.
- `HistoryPanel` renders a line per action («Renombró la facultad FCEx → FCE · UNSa»).

### Solicitudes de carrera
- **Tables:**
  - `career_requests`: `id`, `author_id`, `faculty_id?`, `faculty_text?`, `university_text?`, `career_name`, `plan_url` (CHECK `https://`), `comment?`, `status`, `rejection_reason?`, `career_id?`, `resolved_by_id?`, `resolved_at?`, `created_at`, `updated_at`.
  - `status` ∈ `PENDING`, `ACCEPTED`, `PUBLISHED`, `REJECTED`, `ALREADY_LOADED`, `WITHDRAWN`. A CHECK requires `faculty_id` or `faculty_text`.
  - `career_request_supporters`: `request_id`, `user_id`, `created_at`, with primary key on the pair.
- **Author vs. supporters:** the author is not a supporter row. The count is `1 + supporters`. On the author's withdrawal with supporters, a transaction moves `author_id` to the oldest supporter and deletes that supporter row.
- **Eligibility:** reuse the existing guards. A verified email and no active sanción is the same check that publishing uses (silenciamiento blocks writes). The limit of 3 pending is counted inside the insert transaction after locking the user row.
- **Rate limit:** the existing rate-limit module, 10 requests per hour per account across create and join, so «Yo también» toggling can't spam.
- **Accept:** in one transaction it creates the facultad (and universidad) from admin-confirmed values when they were text, creates the carrera en borrador with `planUrl`, sets `career_id` and `ACCEPTED`, and writes the event. Publishing a carrera sets every `ACCEPTED` request pointing to it to `PUBLISHED` and enqueues the emails after commit.
- **Already loaded:** sets `career_id` to an existing published carrera.
- **Emails:** two `MailService` methods, `sendCareerRequestRejected` and `sendCareerPublished`, sent after commit to the author and every supporter with a verified email. A failed send is logged and does not roll back the decision.
- **Endpoints:**
  - students: `POST /career-requests`, `GET /career-requests?facultyId=` (pending in that facultad, for «Yo también», without who asked), `POST`/`DELETE /career-requests/:id/support`, `DELETE /career-requests/:id` (withdraw), `GET /users/me/career-requests`;
  - admins: `GET /admin/catalog/requests`, `POST /admin/catalog/requests/:id/accept|reject|already-loaded`, `GET /admin/catalog/requests/count`.

### Frontend
- A new tab «Catálogo» (`/admin/catalogo`), shown only for ADMIN and SUPERADMIN. In `ModerationHeader` it carries the pending solicitudes count.
  - `/admin/catalogo` is the tree, with lazy expansion. Selecting a node opens an edit panel next to it.
  - `/admin/catalogo/solicitudes` is the queue.
  - A carrera opens an editor with its placements by año and a «Carga masiva» dialog (textarea → preview table with per-row action and values → confirm).
- The solicitud form is `/universidades/pedir?facultad=<id>`. Without a session it goes to login with `next`.
- «Pedí tu carrera» goes on the empty facultad page, «¿No está la tuya?» on `/universidades`, and «No encuentro mi carrera» in `MyStudyPlans`.
- «Mis solicitudes» is a section of the profile page, next to «Mi carrera».

## Risks / Trade-offs

- [An alias resolution adds one query on every miss] → Only misses pay it, and misses are rare.
- [`target_id` without an FK can dangle] → Every delete goes through `CatalogService`, which deletes aliases in the same transaction. A migration test checks that no alias points nowhere.
- [The carga masiva matches materias by normalized name and could reuse the wrong one (for example «Física I» in two departments of the same facultad)] → The preview shows every reuse, and the admin can switch it to `new`.
- [Unpublish versus a concurrent declaration] → Both run in transactions that read the carrera row with a lock.
- [Emails to supporters could expose who else asked] → Each email goes to one recipient, and no list of students is ever shown to students.

## Migration Plan

1. A schema migration adds:
   - `careers.status` (existing rows become `PUBLISHED`);
   - the semester CHECK `IN (0,1,2)`;
   - `subjects.code` widened to 60;
   - a slug-safe CHECK `NOT VALID` on short names and codes;
   - `catalog_slug_aliases`, `career_requests` and `career_request_supporters`;
   - the new `ModerationEventAction` values.
2. A Vitest migration test covers the defaults, the CHECKs, and that existing rows are unchanged.
3. `rollback.sql` drops the new tables and columns and restores `VarChar(20)`. It aborts if any code is longer than 20, any semester is 0, or any catálogo event exists, because the history is append-only.

## Open Questions

None. Every product decision was settled in the grilling of 2026-10-13.
