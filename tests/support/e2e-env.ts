import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { e2eDatabaseUrl } from '../../apps/backend/test/support/e2e-database.ts';

export const BACKEND_DIR = fileURLToPath(new URL('../../apps/backend/', import.meta.url));
export const FRONTEND_DIR = fileURLToPath(new URL('../../apps/frontend/', import.meta.url));

/** Ports of the apps the UI tests start, away from the dev ones (3000, 3001). */
export const FRONTEND_PORT = 3100;
export const BACKEND_PORT = 3101;
export const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}`;
export const API_URL = `http://localhost:${BACKEND_PORT}/api/v1`;

/** The seeded ADMIN of the UI tests; e2e.config.ts declares it as `admin`. */
export const ADMIN_EMAIL = 'e2e-ui-admin@devsproject.test';
export const adminPassword = () => process.env.E2E_USER_ADMIN_PASSWORD ?? 'e2e-ui-admin-pass';

/** `apps/backend/.env` as a map; values already in the environment win, as in dotenv. */
export function backendEnv(): Record<string, string> {
  const values: Record<string, string> = {};
  for (const line of readFileSync(`${BACKEND_DIR}.env`, 'utf8').split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!match) continue;
    values[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  for (const key of Object.keys(values)) {
    if (process.env[key] !== undefined) values[key] = process.env[key]!;
  }
  return values;
}

/**
 * The e2e database (`<dev database>_e2e`, as the backend's Vitest e2e suites
 * use). Throws unless its name ends in `_e2e`, so nothing here can touch the
 * development database.
 */
export function guardedDatabaseUrl(): string {
  const env = backendEnv();
  if (!process.env.DATABASE_URL && env.DATABASE_URL) process.env.DATABASE_URL = env.DATABASE_URL;
  const url = e2eDatabaseUrl();
  const database = new URL(url).pathname.slice(1);
  if (!database.endsWith('_e2e')) {
    throw new Error(`Refusing to use database "${database}": its name must end in _e2e.`);
  }
  return url;
}
