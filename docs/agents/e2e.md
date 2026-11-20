# End-to-end tests

This repo's conventions only. The library docs are in `node_modules/e2e/docs` and the `e2e` skill.

## Which runner

- **UI tests** use [`e2e`](https://e2e.com) in `tests/*.e2e.ts` at the repo root, configured by `e2e.config.ts`.
- **Backend tests** stay on Vitest: `apps/backend/test/*.e2e.test.ts` (`vitest.e2e.config.ts`).

## How a run starts the apps

`e2e.config.ts` starts `node tests/support/serve-apps.ts`, which:

1. seeds the ADMIN account (below);
2. builds the backend and runs `dist/src/main` with `apps/backend/.env`, but with `DATABASE_URL` pointing at `devs_project_e2e`, `PORT=3101` and `CORS_ORIGIN`/`FRONTEND_URL=http://localhost:3100`;
3. waits for the API, then runs `next dev --port 3100` with `NEXT_PUBLIC_API_URL=http://localhost:3101/api/v1` and **without** the backend `.env` (its `NODE_ENV=development` breaks Next).

The runner probes `http://localhost:3100` and stops everything at the end. Ports 3000/3001 (dev) must not be in use by these tests; 3100/3101 must be free before a run.

## The `_e2e` guard

Everything under `tests/support/` reaches the database through `guardedDatabaseUrl()` in `tests/support/e2e-env.ts`. It derives the URL with `apps/backend/test/support/e2e-database.ts` (the same `<dev database>_e2e` the Vitest suites use, or `E2E_DATABASE_URL`) and **throws unless the database name ends in `_e2e`**. Never point UI tests at `devs_project`.

The database must already be migrated: any backend Vitest e2e run (`npx vitest run --config vitest.e2e.config.ts ...` from `apps/backend`) creates and migrates it.

## The seeded account

- `e2e-ui-admin@devsproject.test`, role ADMIN, verified. Password: `E2E_USER_ADMIN_PASSWORD`, or the local default in `tests/support/e2e-env.ts`.
- Declared as `credentials.admin` in `e2e.config.ts`; tests read it with `credentials.user('admin')`, never a literal.
- Seed it alone with `node tests/support/seed-e2e.ts`. Test data (universidad, facultad, materia, solicitud) comes from the helpers in the same file, one fresh universidad per test.
- Tests sign in once in a `test.setup` that saves the `admin` session, and declare `{ session: 'admin' }`.

## Commands

From the repo root, with nothing else using the e2e database:

```bash
npx e2e run tests/catalog-panel.e2e.ts          # one file
npx e2e run tests/catalog-panel.e2e.ts:<line>   # one test
npx e2e run                                     # the suite
```

Output goes to `.e2e/` (ignored); the apps' log is `.e2e/logs/apps.log`.

## Agent steps

Tests here use deterministic `screen` and `expect` steps. An `agent.*` step needs the model in `e2e.config.ts` and a sign-in first: `npx e2e login openai`.
