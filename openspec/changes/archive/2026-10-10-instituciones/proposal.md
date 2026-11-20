## Why

DevsProject starts at FI-UNJU but will invite other facultades and universidades from day one (ADR 0002). Today the model stops at carrera → plan → materia, with no facultad or universidad, and no student can declare their own plan: `UserStudyPlan` is only written by the seed. Change 3c builds on both, through «Leyendas de la facultad» (one list per facultad, from the student's plans), the monthly ranking's default carrera, and the Puente insignia, which already reads active plans that nobody can set. This change goes first, before 3c-1 (`perfil-publico`).

## What Changes

- **Hierarchy:** new `Universidad` and `Facultad`.
  - Every carrera belongs to exactly one facultad, and its code is unique within that facultad, no longer globally.
  - Every materia belongs to one facultad, and only plans of that facultad can include it. If two facultades teach «Análisis Matemático I», that is two materias.
  - Professors keep hanging from materias, with no facultad of their own.
- **Migration:** creates «Universidad Nacional de Jujuy (UNJU)» → «Facultad de Ingeniería (FI)» and assigns every existing carrera and materia to it. No row is deleted and no reset is needed. The seed creates the same rows.
- **No admin UI:** new facultades are loaded by migration or seed, because adding one also means loading its plans and materias by hand.
- **Catalog API:** a public read-only tree, universidades → facultades → carreras → planes, for choosing a plan and for later rankings.
- **«Mi carrera» in Mi perfil (`/profile/me`):** a student adds one or more plans, choosing universidad, facultad, carrera and plan, and marks each as activo, terminado or abandonado. The section is private for now: neither the public profile API nor other students see it.
- **Facultad wherever the carrera is shown:**
  - `/materiales` groups its carreras under their facultad and universidad;
  - the materia page and its strong-match heading in `/buscar` show the facultad next to the carrera;
  - the moderators' user panel shows it too.
  - When there is a single facultad, no extra browsing level appears.
- **Out of scope:**
  - the redesign's Universidad → Facultad → Carrera → Materia navigation and `ModeratorScope` (moderators per facultad), which stay in the later change 4 `alcance-por-facultad`;
  - creating universidades or facultades from the UI;
  - professors per facultad;
  - showing a student's plans on the public profile (decided in 3c-1);
  - Leyendas and the rankings (3c-3);
  - any change to points or insignias.

## Capabilities

### New Capabilities
- `academic-structure/institutions`: the universidad → facultad → carrera → plan → materia hierarchy and its invariants, the public catalog tree, and a student's declared plans with their status.

### Modified Capabilities
- `academic-resources/discovery`: hierarchical browsing groups carreras by facultad (without a new level while there is one), and materia context headings include the facultad.

## Impact

- **Backend:**
  - `prisma/schema.prisma` and a migration:
    - new `University` and `Faculty` models;
    - `Career.facultyId` (required), with a composite unique key on `(facultyId, code)`;
    - `Subject.facultyId` (required);
    - a database check that a plan only includes materias of its own facultad;
    - backfill to UNJU/FI.
  - `prisma/seed.ts`.
  - A new `institutions` module with the catalog tree and `GET`/`PUT /users/me/study-plans`.
  - `discovery.service.ts` and its DTOs (facultad on carreras).
  - `subjects.service.ts` (facultad in the materia context).
  - `moderation-users.service.ts`.
- **Frontend:**
  - a «Mi carrera» section in `ProfilePage`;
  - `MaterialHierarchyPage` (grouping);
  - `SubjectHub` and the `/buscar` heading (facultad label);
  - `UsersPanel`;
  - the types and clients that go with them.
- **Data:** no destructive step. `devs_project_moderacion` gets the migration only; the e2e database is reset as usual.
- **Docs:** `CONTEXT.md` (Universidad, Facultad and Materia are already updated) and ADR 0002 (already written).
