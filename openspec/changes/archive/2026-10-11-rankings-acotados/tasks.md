## 1. Building blocks

- [x] 1.1 Write Vitest unit tests:
  - `semesterRange(now)`: 1 April 2026 falls in March–July; 15 September in August–February; 10 January 2027 in the second cuatrimestre of 2026; Argentina time at the boundaries;
  - competition ranks: 30, 30, 20 gives 1, 1, 3.

  Implement them in `badge-calendar.ts` and `ranking/ranks.ts`. Verify the tests pass.
- [x] 1.2 Write Vitest e2e tests for `ranking/attribution.ts`, resolving each reason to its materia:
  - material, «Me sirvió», pioneer bonus, reseña, experiencia, confirmed reporte (through its case) and accepted correction;
  - guía and legacy movimientos resolve to none;
  - `careersOf` returns every carrera with a plan that includes the materia.

  Implement it. Verify the tests pass.

## 2. Rankings API

- [x] 2.1 Write Vitest e2e tests for `GET /ranking/monthly`:
  - net points of this month only, in Argentina time, with a reversal this month subtracting;
  - a shared materia counts for both carreras;
  - top 10 with competition ranks, «Nv.» and points;
  - an account with the switch off and an account under an active sanción are excluded and take no place;
  - the first carrera by name without `careerId`;
  - public.

  Then test `GET /ranking/monthly/me`: the place outside the top 10, `null` when hidden or sanctioned, `defaultCareerId` from the active plan, and 401 without a session. Implement them. Verify the tests pass.
- [x] 2.2 Write Vitest e2e tests for `GET /ranking/legends` and `/ranking/legends/me`:
  - nivel máximo alcanzado 10 with an active or finished plan in the facultad, but not an abandoned one or none;
  - two facultades list the account in both;
  - alphabetical order;
  - points dropping below nivel 10 keep it;
  - excluded when the switch is off or under a permanent suspensión, kept during a silenciamiento;
  - `defaultFacultyId` from the plans.

  Implement them. Verify the tests pass.
- [x] 2.3 Write Vitest e2e tests for `GET /subjects/:code/top-materials`:
  - counts only valid «Me sirvió» received this cuatrimestre, whatever the publication date;
  - excludes retired or deleted materials, «Me sirvió» from unverified or sanctioned givers, and the author's own mark;
  - top 10 with competition ranks;
  - an empty list when there is no activity.

  Implement it. Verify the tests pass.
- [x] 2.4 Remove `GET /ranking?period=`, `/ranking/top` and `/ranking/me`, the old service methods and `ranking.service.spec.ts`, and keep `GET /ranking/levels`. Write an e2e test that the removed routes answer 404 and `/ranking/levels` still answers. Verify every backend suite still compiles and passes.

## 3. Frontend

- [x] 3.1 Write frontend Vitest tests for `RankingPage`:
  - two tabs synced to `?tab=`;
  - the monthly list with ranks, «Nv.», points and `AuthorLink`;
  - «Tu posición» below the top 10 for a signed-in student outside it;
  - the carrera select defaults to the active plan and changes the list;
  - Leyendas with the facultad select, ordered as returned;
  - empty and error states;
  - no global or weekly ranking.

  Implement it, replace the `/ranking` page, and delete the legacy ranking components and client with their tests. Verify the tests pass.
- [x] 3.2 Write frontend Vitest tests for «Más útiles este cuatrimestre» in `SubjectHub`:
  - it lists materials with their «Me sirvió» count and opens the preview;
  - it is hidden when empty.

  Then test the «Ver rankings» link in «Tu progreso». Implement them. Verify these tests and the existing tests of those components pass.

## 4. Docs, review and verification

- [x] 4.1 Update the docs and verify they match groups 1–3:
  - `README_PUNTOS_E_INSIGNIAS.md`: state line, §7 «cómo quedó implementado», §8;
  - `PLAN_LIMPIEZA_HEREDADOS.md`: the legacy ranking was removed here;
  - `README_DATABASE.md`, only if a query or index is added.
- [x] 4.2 Run a browser check with agent-browser on dev `devs_project_moderacion`. Use only targeted inserts for demo data and revert them.
  - `/ranking`: both tabs, the selectors, «Tu posición», at 1440 and 390;
  - a materia page with «Más útiles».

  Save the evidence in `docs/validation/evidence/rankings-acotados/`, then stop the servers.
- [x] 4.3 Run a fresh code review with an Opus subagent focused on attribution correctness, exclusions (switch, sanciones, permanent suspensión), anonymity (no ranking reveals anonymous authorship or a sanción), month and cuatrimestre boundaries, and the removed endpoints. Fix the confirmed findings and rerun the affected tests.
- [x] 4.4 Run full verification with logs in `.audit-logs/`, reporting only summaries:
  - backend: Jest (unit with `--maxWorkers=2`, e2e), Vitest (unit, e2e, migration), lint and build;
  - frontend: tests, lint, design tokens and build;
  - then `graphify update .`.

  Verify everything passes.

## Review notes

The Opus review (4.3) found two leaks and changed two rules of the spec, with failing tests written first:

- **`REPORT_CONFIRMED` and `CORRECTION_ACCEPTED`** no longer count in the monthly ranking. Their +2 lands right when the author sees the retiro or the change, so it would reveal who reported or suggested.
- **Sanciones** are judged at the start of the month from `Sanction`, so a sanción applied, lifted or voided mid-month never changes the list.

Also fixed:
- non-uuid references no longer fail the monthly query;
- the public lists load when the viewer's own request fails;
- tabs support arrow keys and a roving `tabIndex`;
- a note appears when the carreras cannot load;
- once the carrera is known, the two monthly requests run in parallel.

Accepted and documented in design.md and README §7.1: hard-deleted reseñas and experiencias leave reversals with no materia, and a material moved by a correction moves its points.

Not changed: switching tabs forgets the chosen carrera or facultad.

