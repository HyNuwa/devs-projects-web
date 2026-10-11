## 1. Schema and migration

- [x] 1.1 Write a Vitest migration test that applies `trust_privileges` over existing reportes, movimientos and badges and asserts:
  - existing reportes have `priority = false`;
  - `CORRECTION_ACCEPTED` exists in `point_reason`;
  - the `lupa` badge row exists after `ojo-atento`;
  - the partial unique index rejects a second `OPEN` suggestion for the same material and field, but allows it once the first is closed.

  Add the models and enums to `schema.prisma`, the migration SQL, and `rollback.sql` in the change folder. Verify `pnpm test:vitest:migration` passes.

## 2. Good standing and privileges

- [x] 2.1 Write Vitest unit tests for `trust/standing.ts`:
  - no sanciones means good standing;
  - a silenciamiento ended 60 days ago means not yet, with `until` set;
  - it ended 90 days ago exactly means yes;
  - a lifted silenciamiento counts from `liftedAt`;
  - a voided sanción and a reverted retiro do not count;
  - advertencias do not count;
  - an active suspensión means no;
  - a permanent suspensión means never.

  Implement it. Verify the tests pass.
- [x] 2.2 Write Vitest unit tests for `trust/privileges.ts`, covering the requirements and `missing` items of `canSuggestCorrections`, `priorityReporter` (5 confirmed and 70 %, pending reportes excluded, a 90-day window by `resolvedAt`) and `eligibleToModerate` (role, nivel máximo alcanzado, 6 months, confirmed reportes or accepted corrections, standing). Implement it. Verify the tests pass.
- [x] 2.3 Write Vitest e2e tests for `GET /users/me/privileges` on real rows:
  - an active privilege;
  - missing nivel;
  - missing precision (56 %);
  - standing back on a date after a silenciamiento;
  - a retiro of anonymous content counts;
  - it never contains eligibility;
  - 401 without a session.

  Implement `TrustService` and the controller. Verify the tests pass.

## 3. Corrections

- [x] 3.1 Write Vitest e2e tests for `POST /materials/:id/corrections`. It is created for a privileged student, and the material is unchanged. It is rejected (400, 403 or 409) for:
  - no privilege;
  - an own material;
  - an unpublished material;
  - a value equal to the current one;
  - a materia of another facultad;
  - a professor not linked to the resulting materia;
  - a second open suggestion on the same field (another field is fine);
  - an 11th open suggestion.

  Implement the corrections service and DTO. Verify the tests pass.
- [x] 3.2 Write Vitest e2e tests for the author flow:
  - `GET /users/me/correction-suggestions` lists phase AUTHOR with labels and no suggester;
  - accept applies the change and awards +2 to the suggester;
  - a materia or tipo change reverts and re-evaluates the pioneer bonus;
  - reject closes it;
  - after 7 days the author gets 409 and the list no longer shows it;
  - another user cannot decide it.

  Split `MaterialsService.update` into the ownership check and `applyClassification`, and implement it. Verify these tests and the existing materials tests pass.
- [x] 3.3 Write Vitest e2e tests for moderation:
  - `GET /moderation/corrections` lists only phase MODERATION, oldest first, with the suggester;
  - it excludes the moderator's own suggestions and materials;
  - accept and reject work;
  - a moderator gets 409 during the author phase;
  - 403 for USER.

  Implement them. Verify the tests pass.
- [x] 3.4 Write Vitest e2e tests for closing:
  - the author edits the field, and the suggestion disappears from both lists, and deciding it returns 409 and marks it `CLOSED` with `FIELD_CHANGED`;
  - a retired or deleted material gives `MATERIAL_GONE`;
  - accepting one suggestion closes another one made obsolete;
  - the weekly cap of 10 `CORRECTION_ACCEPTED` points;
  - a suggester under an active sanción earns nothing, and the suggestion is still accepted.

  Implement `closeObsolete` and the hooks. Verify the tests pass.

## 4. Priority reportes, eligibility, roles and Lupa

- [x] 4.1 Write tests for priority reportes:
  - unit tests in `queue.spec`: a caso with a priority reporte sorts after high-priority and before the reporte count;
  - e2e tests: a precise reporter in good standing files a priority reporte, an imprecise one or one not in good standing files a normal one, the flag does not change later, and the moderation caso API does not expose reporters or the flag.

  Implement it in `reports.service.ts`, `queue.ts` and `cases.service.ts`. Verify these tests and the existing moderation tests pass.
- [x] 4.2 Write Vitest e2e tests for eligibility and roles:
  - an ADMIN sees the `eligible` filter and field;
  - a MODERATOR gets 403 on the filter and never gets the field;
  - eligibility matches each requirement;
  - `POST /moderation/users/:id/promote` changes only USER to MODERATOR, for admins only;
  - `PATCH /admin/users/:id/role` rejects unknown roles, rejects an ADMIN granting or removing ADMIN or SUPERADMIN, and rejects changing one's own role, while SUPERADMIN can.

  Implement them. Verify these tests and the existing moderation-users tests pass.
- [x] 4.3 Write tests for Lupa:
  - a unit test of the catalog: 18 insignias with `lupa` after `ojo-atento`;
  - e2e: 10 accepted suggestions award it, and it is kept when one of those materials is retired.

  Implement it in the snapshot and catalog. Verify these tests and the existing badge tests pass.

## 5. Frontend

- [x] 5.1 Write frontend Vitest tests for «Sugerir corrección» in `MaterialPreviewDialog`:
  - hidden without the privilege or on one's own material;
  - the form changes its value input with the field;
  - submit sends `{ field, proposedValue, comment }`;
  - the API error is shown.

  Implement the client and the form. Verify the tests pass.
- [x] 5.2 Write frontend Vitest tests for the «Sugerencias para tus materiales» section in `MySubmissions`:
  - it lists current and proposed values without a suggester;
  - accept and reject call the API and remove the row;
  - a 409 shows «La sugerencia ya no aplica».

  Implement it. Verify the tests pass.
- [x] 5.3 Write frontend Vitest tests for `/admin/correcciones`:
  - the `CorrectionsPanel` list with the suggester;
  - accept and reject;
  - the empty state;
  - the new tab with its count in `ModerationHeader`.

  Implement them. Verify these tests and the existing moderation tests pass.
- [x] 5.4 Write frontend Vitest tests for `UsersPanel`:
  - the «Elegibles» chip and «Elegible» mark appear for ADMIN only;
  - «Hacer moderador» on an eligible account calls promote and updates the role.

  Then test `PrivilegesCard` in «Tu progreso»: «Activo», missing nivel, precision, the standing date, and nothing about moderating. Finally test that `/puntos` shows the corrections row, Lupa and the privileges. Implement them. Verify the tests pass.

## 6. Docs, review and verification

- [x] 6.1 Update the docs and verify they match groups 1–5:
  - `README_PUNTOS_E_INSIGNIAS.md`: state line, §5 with how it was implemented, §6 Lupa, §9.1;
  - `README_MODERACION.md`: Correcciones tab, priority order;
  - `README_DATABASE.md`: new tables and columns, rollback;
  - `README_SECURITY.md`: role change rules;
  - `CONTEXT.md`: «buena posición» and «corrección» terms.
- [x] 6.2 Apply the migration to dev `devs_project_moderacion` with `prisma migrate deploy`, with no reset and no seed. Use targeted inserts for demo data and revert them afterwards.

  Run a browser check with agent-browser:
  - suggest a correction as a demo student;
  - accept it from «Mis envíos» as the author;
  - see an escalated one in Correcciones as a moderator;
  - see «Elegibles» as admin;
  - see the privileges card in «Tu progreso», at 1440 and 390.

  Save the evidence in `docs/validation/evidence/privilegios-confianza/`, then stop the servers.
- [x] 6.3 Run a fresh code review with an Opus subagent focused on anonymity (reporters, suggesters, anonymous retiros feeding standing), the role change rules, race conditions on suggestions, and the reuse of the edit path. Fix the confirmed findings and rerun the affected tests.
- [x] 6.4 Run full verification with logs in `.audit-logs/`, reporting only summaries:
  - backend: Jest (unit with `--maxWorkers=2`, e2e), Vitest (unit, e2e, migration), lint and build;
  - frontend: tests, lint, design tokens and build;
  - then `graphify update .`.

  Verify everything passes.

> **Note on test-first:** in 2.2, 3.2, 3.3 and 3.4 the implementation already existed when the tests ran, either written together or built in an earlier task, so no red run was recorded for them. Every other task, and every fix from the review, saw its tests fail first.
