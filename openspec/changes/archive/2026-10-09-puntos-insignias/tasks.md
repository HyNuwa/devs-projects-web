## 1. Schema and catalog

- [x] 1.1 Write a Vitest migration test: `Badge` gains slug, rarity and sortOrder with the 17 catalog rows inserted; `UserBadge` gains tier, tierUpdatedAt, edition (default 0) and seenAt, with the unique key `[userId, badgeId, edition]`; existing rows are kept. Add the migration and the Prisma schema; verify `pnpm test:vitest:migration` passes
- [x] 1.2 Write Vitest unit tests for `badge-calendar.ts`: cuatrimestre of a date (January–February in the preceding second one), consecutive cuatrimestres, exam period and its `YYYYMM` edición, and the founder window from `FOUNDER_WINDOW_START`/`END` (absent means none). Implement it and add the variables to `env.validation.ts`; verify the tests pass

## 2. Criteria

- [x] 2.1 Write Vitest unit tests for each of the 17 criteria in `badge-catalog.ts` over hand-built snapshots: thresholds and grados, editions, progress to the next grado, anonymous entries and invalid «Me sirvió» never counting, and losing or lowering an insignia when its contributions go. Implement the pure criteria; verify the tests pass
- [x] 2.2 Write a Vitest unit test that the catalog matches the `Badge` rows the migration inserts (slug, name, rarity, order, image); verify it passes

## 3. Evaluation

- [x] 3.1 Write Vitest e2e tests for `loadBadgeSnapshot` and `BadgeService.evaluate`: new insignias inserted unseen, a grado change resets `seenAt`, insignias deleted when their material is retired and back when restored, «Primera luz» and «Puente» from real rows, «Ojo atento» from confirmed reportes, idempotent under concurrent calls. Extract the valid-«Me sirvió» rule shared with `HelpfulPoints`; verify the tests pass

## 4. API

- [x] 4.1 Write Vitest e2e tests for `GET /me/badges` (earned with tier, edition and date; pending with criterion; up to 3 closest with progress phrases; only for the signed-in account) and `POST /me/badges/seen`. Implement them; verify the tests pass
- [x] 4.2 Write Vitest e2e tests that `GET /users/:id` lists another account's earned insignias with tier and edition, without dates and never «Ojo atento». Implement it; verify the tests and the existing public-profile test pass
- [x] 4.3 Write a Vitest e2e test that `rebuildPoints` also awards non-seasonal insignias, already marked seen, and skips seasonal ones. Implement it; verify the rebuild tests pass

## 5. Frontend

- [x] 5.1 Write frontend Vitest tests for the Insignias section of «Tu progreso»: the earned and pending collection with rarity, grado, edición and date; the 3 closest with their bars; a newly earned gem plays «entrada» once (lottie mocked) and then calls «seen»; with reduced motion only the static svg shows. Implement `Gem` and the section after the canvas; verify the frontend tests pass

## 6. Docs, review and verification

- [x] 6.1 Update `README_PUNTOS_E_INSIGNIAS` (state, §6 built for 3b without Lupa, the calendar defaults and the Primera camada variables, public insignias without dates and without Ojo atento, evaluation on read); verify the docs match groups 1–5
- [x] 6.2 Browser check with agent-browser as a demo student: the Insignias section in «Tu progreso» at 1440 and 390 and the entrada animation of a newly earned gem; save the evidence in `docs/validation/evidence/puntos-insignias/`, then stop the servers
- [x] 6.3 Fresh code review by an Opus subagent focused on criteria correctness, anonymity and reporting privacy, evaluation consistency and concurrency; fix the confirmed findings and rerun the affected tests
- [x] 6.4 Full verification with logs in `.audit-logs/`, reporting only summaries: backend Jest (unit `--maxWorkers=2`, e2e), Vitest (unit, e2e, migration), lint and build; frontend tests, lint, design tokens and build; then `graphify update .`. Verify everything passes
