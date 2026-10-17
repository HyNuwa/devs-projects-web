## Context

See proposal.md, «Why». Current state that shapes the approach:

- **Schema:**
  - `Career` has a global `code @unique`. `StudyPlan` has `careerId` and `@@unique([careerId, code])`.
  - `StudyPlanSubject` links plans and `Subject`s, with year, semester and credits. `Subject` has no owner beyond its plan links.
  - `UserStudyPlan` (`userId`, `studyPlanId`, `status` ACTIVE, COMPLETED or DROPPED, with `@@unique([userId, studyPlanId])`) exists, but only the seed writes it.
- **Readers of plans and carreras:**
  - Discovery (`/hierarchy/careers…`, `MaterialHierarchyPage`) starts at carreras.
  - `subjects.service.ts` returns plan placements with `career.name`, which `SubjectHub` renders.
  - `moderation-users.service.ts` shows the first plan's carrera.
  - The Puente insignia (`badge-snapshot.ts`) reads givers' ACTIVE plans and matches one carrera per giver.
- **Data:** dev `devs_project_moderacion` holds the seed's single carrera «Ingeniería Informática» (`II`, «Plan 2023»). It must not be reset; the change ships as a forward migration.

## Goals / Non-Goals

**Goals:**
- Make the facultad an explicit owner of carreras and materias, enforced by the database, so later changes (3c-3 Leyendas) can group by it.
- Let students maintain their `UserStudyPlan` rows themselves.

**Non-Goals:**
- Multi-tenant isolation (per-facultad moderation, accounts or domains).
- Faculty-scoped search, or URLs that carry the facultad.
- Changing how Puente counts carreras.

## Decisions

### `Subject.facultyId` as an explicit column, guarded by a trigger
A materia's facultad could be derived from its plans, but a materia linked to no plan would then have no facultad, and the «one facultad» rule would live only in application code. Instead:
- `Subject.facultyId` is required.
- A `BEFORE INSERT OR UPDATE` trigger on `study_plan_subjects` raises when the plan's carrera facultad differs from the materia's facultad.
- A trigger on `subjects` raises when its `faculty_id` changes while it is linked to plans of another facultad.
- A trigger on `careers` raises when its `faculty_id` changes while it has plans.
- A trigger on `study_plans` raises when a plan with materias moves to a carrera of another facultad (found while implementing: without it, moving the plan would bypass the rule).

All of them live in the migration as raw SQL, as earlier migrations already do for checks Prisma can't express. Alternative considered: a check in the seed or service only. Rejected, because subjects and plans are loaded by scripts, and scripts are exactly where a mismatch would slip in.

### Models
- **`University`:** `id`, `name` (unique), `shortName` (unique, e.g. «UNJU»), timestamps.
- **`Faculty`:** `id`, `universityId`, `name`, `shortName` (e.g. «FI»), timestamps, with `@@unique([universityId, name])` and `@@unique([universityId, shortName])`.
- **`Career`:** gains `facultyId`. `code @unique` becomes `@@unique([facultyId, code])`.
- **`Subject`:** gains `facultyId`, with `@@index([facultyId])`.
- **Deletes:** `onDelete: Restrict` everywhere on the new relations. Removing a facultad with content is never a cascade.

### Migration in three steps, inside one transaction
1. Create the `universities` and `faculties` tables, and insert UNJU and FI with fixed UUIDs, so seed and tests can refer to them.
2. Add nullable `faculty_id` to `careers` and `subjects`, set it to FI, and make it `NOT NULL`.
3. Swap the unique index on `careers.code`, add the foreign keys and create the triggers.

The migration is safe on dev data: it only adds columns and rows. A migration test (`vitest.migration.config.ts`, as in `point_ledger`) seeds pre-migration rows, applies the migration and asserts the backfill and the triggers.

### Catalog API
- **`GET /institutions`** (public): `[{ id, name, shortName, faculties: [{ id, name, shortName, careers: [{ id, name, code, studyPlans: [{ id, name, code }] }] }] }]`, every level sorted by name. The tree is small (one facultad has a handful of carreras), so one bounded query beats paging. If it grows, it can be split by universidad without changing the shape of each node.
- **`GET /users/me/study-plans`** returns the student's plans with the full path (universidad → plan) and their status.
- **`PUT /users/me/study-plans`** replaces the whole list `[{ studyPlanId, status }]`:
  - validated against existing plans;
  - duplicates rejected with 400;
  - at most 10 entries, a sanity bound.
  - Replacing the whole list is simpler to keep consistent than separate add, update and remove endpoints, and the UI edits the whole list anyway.
- **Statuses:** the existing enum names stay (`ACTIVE`, `COMPLETED`, `DROPPED`). The UI labels them activo, terminado and abandonado.

### «Mi carrera» UI
- A section in `ProfilePage` (`/profile/me`) with the declared plans and their status, «Agregar plan» and «Quitar».
- Adding a plan uses four dependent selects: universidad, facultad, carrera, plan. A level with a single option is preselected, so today the student only picks the plan.
- The section says these plans are private.

### Facultad in discovery and the materia context
- **`/hierarchy/careers`:** each carrera gains `faculty: { id, name, shortName, university: { id, name, shortName } }`. `MaterialHierarchyPage` groups by facultad and shows the heading «Facultad de Ingeniería · UNJU», even with one facultad, so the label is visible from day one. URLs keep `careerId`; no level is added.
- **Plan placements** in `subjects.service.ts` include the facultad. `SubjectHub` renders «FI (UNJU) · Ingeniería Informática · Año N · Cuatrimestre M», and the `/buscar` strong-match heading too.
- **`moderation-users.service.ts`:** prefers an ACTIVE plan, then COMPLETED, and returns «Carrera · FI (UNJU)».

### Seed
`prisma/seed.ts` creates UNJU → FI before the carrera, with the same fixed UUIDs, and assigns `facultyId` to the carrera and every materia. The seed is only run on e2e and fresh databases, never on dev without consent.

## Risks / Trade-offs

- **Four triggers hide behavior from the Prisma schema** → each one is named and commented in the migration, the design and a short note in `README_DATABASE.md`. The migration test exercises every trigger.
- **Lookups by code:** no code path reads a carrera by `code` alone today; only test fixtures and the seed use it. The composite unique only affects them.
- **Materia URLs are global** (`/materias/:code`, `findFirst({ where: { code } })`): two facultades with the same materia code would collide.
  - Not solved here, because it needs a URL decision.
  - Recorded as a precondition for the change that loads a second facultad.
  - Until then, materia codes stay globally distinct in practice.
- **Students can declare any plan, true or not** → it only affects private context and Puente, which already counts each giver once. There is no verification, the same as with academic context elsewhere.
- **The Puente insignia starts receiving real data** → expected. Its criterion is unchanged.

## Migration Plan

1. Apply the migration on dev (`prisma migrate deploy`) without resetting, and on e2e through the usual reset.
2. Deploy the backend and frontend together, because the discovery DTO gains a field that the frontend reads.
3. **Rollback:** Prisma has no down migrations. A hand-written SQL in the change folder (`rollback.sql`, never applied automatically) drops the triggers, the foreign keys and the columns, restores `careers_code_key` and drops the two tables, and then the migration row is marked rolled back. It is safe while no second facultad exists.
