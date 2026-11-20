## 1. Schema and migration

- [x] 1.1 Write a Vitest migration test (`vitest.migration.config.ts`) that seeds pre-migration carreras, plans, materias, user plans and a material, applies the migration and asserts:
  - UNJU and FI exist with their fixed UUIDs;
  - every carrera and materia has FI;
  - the other rows are unchanged;
  - `careers.code` is unique per facultad, not globally;
  - the triggers reject a plan–materia link across facultades, a materia moved to another facultad while linked, and a carrera moved while it has plans.

  Add the `University` and `Faculty` models, `Career.facultyId` and `Subject.facultyId`, the migration SQL with the triggers, and `rollback.sql` in the change folder. Verify `pnpm test:vitest:migration` passes.
- [x] 1.2 Update `prisma/seed.ts` to create UNJU → FI with the same fixed UUIDs and assign `facultyId` to the carrera and every materia. Fix the test fixtures that build carreras or materias without a facultad. Verify the e2e reset and seed run cleanly and the existing backend suites still pass.

## 2. Catalog and declared plans API

- [x] 2.1 Write Vitest e2e tests for `GET /institutions`:
  - public, without a session;
  - the tree goes universidad → facultades → carreras → plans, sorted by name at every level;
  - with a second facultad in fixtures, each carrera appears only under its own facultad.

  Implement the `institutions` module. Verify the tests pass.
- [x] 2.2 Write Vitest e2e tests for `GET`/`PUT /users/me/study-plans`:
  - full path and status in the response;
  - replace-all semantics;
  - plans of different facultades allowed;
  - duplicates rejected with 400, and unknown plans rejected;
  - at most 10 entries;
  - 401 without a session;
  - another user's plans never readable;
  - `GET /users/:id` contains no plans;
  - removing a plan drops it from Puente's carreras (badge snapshot).

  Implement them. Verify the tests and the existing public-profile and badge tests pass.

## 3. Facultad in discovery, materia context and moderation

- [x] 3.1 Write or extend backend tests:
  - `/hierarchy/careers` returns each carrera's facultad and universidad;
  - materia plan placements (`subjects.service.ts`) include the facultad;
  - the moderators' user panel prefers an ACTIVE plan, then a COMPLETED one, and returns the carrera with its facultad.

  Implement them. Verify the discovery, subjects and moderation-users tests pass.

## 4. Frontend

- [x] 4.1 Write frontend Vitest tests for `MaterialHierarchyPage`: carreras grouped under the «Facultad de Ingeniería · UNJU» heading; with two facultades in the mock, each carrera under its own group; URLs unchanged. Implement it. Verify the tests pass.
- [x] 4.2 Write frontend Vitest tests for the facultad label in `SubjectHub` placements («FI (UNJU) · Ingeniería Informática · Año N · Cuatrimestre M»), in the `/buscar` strong-match heading and in `UsersPanel`. Implement it. Verify the tests pass.
- [x] 4.3 Write frontend Vitest tests for the «Mi carrera» section in `ProfilePage`:
  - lists the declared plans with the labels activo, terminado and abandonado;
  - adding a plan uses dependent selects with single options preselected;
  - status changes and removal send the full list;
  - shows the duplicate error;
  - says the plans are private.

  Implement the section and its client. Verify the tests pass.

## 5. Docs, review and verification

- [x] 5.1 Update `README_DATABASE.md` (new models, the four triggers, rollback) and `README_PUNTOS_E_INSIGNIAS.md` (students now declare their plans, which feeds Puente and 3c-3). Note the materia-URL precondition for a second facultad. Update the «Universidad → Facultad en el modelo» row of `README_PROJECT_MANAGEMENT.md` and the related lines in `README_DATABASE.md`, `README_AUTH.md` and `README_SECURITY.md`: the model arrives with `instituciones`, and the canvas navigation and `ModeratorScope` stay in change 4 `alcance-por-facultad`. Verify the docs match groups 1–4.
- [x] 5.2 Apply the migration to dev `devs_project_moderacion` with `prisma migrate deploy` (no reset, no seed). Run a browser check with agent-browser as a demo student:
  - `/materiales` grouped by facultad;
  - a materia page label;
  - declaring a plan in «Mi carrera» at 1440 and 390.

  Save the evidence in `docs/validation/evidence/instituciones/`, then stop the servers.
- [x] 5.3 Run a fresh code review with an Opus subagent focused on migration safety on existing data, the trigger coverage, the privacy of declared plans and the discovery contract. Fix the confirmed findings and rerun the affected tests.
- [x] 5.4 Run full verification with logs in `.audit-logs/`, reporting only summaries:
  - backend: Jest (unit with `--maxWorkers=2`, e2e), Vitest (unit, e2e, migration), lint and build;
  - frontend: tests, lint, design tokens and build;
  - then `graphify update .`.

  Verify everything passes.
