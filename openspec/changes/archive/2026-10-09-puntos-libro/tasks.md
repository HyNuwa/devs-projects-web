## 1. Schema and levels

- [x] 1.1 Write a Vitest migration test that converts existing `reason` values (`MATERIAL_APPROVED`, `*_REVERTED`, `GUIDE_CREATED`, `COURSE_REVIEWED`) into `PointReason`, fills `idempotency_key` with `legacy:<id>`, adds `reverses_id`, and deletes no rows. Add the Prisma migration and schema changes; verify `pnpm test:vitest:migration` passes
- [x] 1.2 Write Vitest unit tests for the new levels table (thresholds, names, unlock texts, `max(0, points)`, negative totals at level 1). Replace `rpg-levels.ts`; verify the tests pass

## 2. Ledger core

- [x] 2.1 Write Vitest tests for `PointLedger.award` and `revert`: idempotency key `<reason>:<ref>:<n>`, a retry is a no-op, an award after a reversal, `reversesId` prevents a double reversal, the total and the level follow every movement. Implement `PointLedger`; verify the tests pass
- [x] 2.2 Write Vitest e2e tests for the caps against the database: reseñas per materia and ciclo (null year as its own value), experiencias per materia, session and year, and concurrent awards that cannot pass a cap. Implement the cap checks with the author row lock; verify the tests pass
- [x] 2.3 Write Vitest tests for the sanction freeze: no award while silenced or suspended, nothing kept for later, an `appeal` award still applies. Implement it; verify the tests pass

## 3. Sources

- [x] 3.1 Write Vitest e2e tests that material publication (on upload and on approval) awards 10 once; that a signed reseña or experiencia awards 5 within its caps; that an anonymous one awards nothing; and that an edit never changes `isAnonymous`. Migrate `materials.service.ts` and `subjects.service.ts` to `PointLedger`, ignore `isAnonymous` on update, and stop `GUIDE_CREATED`; verify the tests pass
- [x] 3.2 Write Vitest e2e tests for «Me sirvió»: valid marks award 1; the three caps hold (25 per material, 20 per day, 5 per month from the same giver); unverified, sanctioned or self marks award nothing; removing a mark reverts its point. Wire `setHelpfulness`; verify the tests pass
- [x] 3.3 Write Vitest e2e tests for the pioneer bonus: the first material of a type (not `OTRO`) at 3 valid marks awards 5 once; a second material does not; a retiro reverts it without passing it on; editing subject or type re-evaluates it. Implement it; verify the tests pass
- [x] 3.4 Write Vitest e2e tests for reversals and restores: moderation REMOVE and author deletion revert the contribution, its «Me sirvió» and its pioneer bonus; RESTORE, APPROVE and an accepted appeal award again within the caps; anonymous entries never move the author's points. Migrate `decisions.service.ts`, `bulk-retiro.ts` and the delete paths; verify the tests and the existing moderation e2e tests pass
- [x] 3.5 Write Vitest e2e tests for `REPORT_CONFIRMED`: a REMOVE awards 2 to each reporter whose report came before it, anonymous content included; the 10-points-per-week cap holds; a restore or an overturned retiro reverts it. Implement it; verify the tests pass

## 4. Rebuild and seed

- [x] 4.1 Write a Vitest e2e test for `rebuild-points.ts` against the e2e database. A dry run changes nothing and reports. `--apply` rebuilds an account with signed and anonymous contributions, «Me sirvió» and a confirmed reporte, matching what live awards would give, and keeps `GUIDE_CREATED`. Implement the script; verify the test passes
- [x] 4.2 Make `seed.ts` award demo points through `PointLedger`. Verify by running the seed against the e2e database only, and checking that demo accounts' totals equal the sum of their movements. Do not touch the development database

## 5. Progress API and UI

- [x] 5.1 Write Vitest e2e tests for `GET /me/progress`: level, name, points shown as 0 at least, the next level with missing points and its unlocks, and the last 20 movements naming only the student's own contribution, with no giver and no reported content. Implement the endpoint; verify the tests pass
- [x] 5.2 Write frontend Vitest tests for the «Tu progreso» page at `/mi-espacio/progreso` (level card, bar, unlocks, movements, empty state, link to «Cómo funcionan los puntos») and its account-menu entry. Build them after the canvas `p_progreso`; verify the frontend tests pass
- [x] 5.3 Write frontend Vitest tests for the `/puntos` page and the reseña and experiencia forms: the anonymous notice «Las publicaciones anónimas no suman puntos», and the anonymity choice shown disabled when editing. Implement them; verify the frontend tests pass

## 6. Docs, review and verification

- [x] 6.1 Update `README_PUNTOS_E_INSIGNIAS`: state, §2 «ya existe», §3.3 anonymity fixed at publishing, the REPORT_CONFIRMED cap reading, §11.2 new accounts decided. Check `CONTEXT.md` against the built behavior; verify the docs match groups 1–5
- [x] 6.2 Browser check with agent-browser, as a demo student, of «Tu progreso», the help page and the locked anonymity on edit. Save the evidence in `docs/validation/evidence/puntos-libro/`, then stop the servers
- [x] 6.3 Fresh code review by an Opus subagent focused on idempotency, caps under concurrency, reversal completeness and anonymity; fix the confirmed findings and rerun the affected tests
- [x] 6.4 Full verification with logs in `.audit-logs/`, reporting only the summaries: backend Jest (unit `--maxWorkers=2`, e2e), Vitest (unit, e2e, migration), lint and build; frontend tests, lint, design tokens and build; then `graphify update .`. Verify everything passes
