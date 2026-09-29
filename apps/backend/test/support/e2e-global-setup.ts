import { spawnSync } from 'node:child_process';
import { Client } from 'pg';

import { e2eDatabaseUrl, maintenanceUrl } from './e2e-database';

/** Creates the e2e database if needed and applies every migration to it. */
export default async function setup() {
  const url = e2eDatabaseUrl();
  const database = new URL(url).pathname.slice(1);

  const admin = new Client({ connectionString: maintenanceUrl(url) });
  await admin.connect();
  try {
    const exists = await admin.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [database],
    );
    if (exists.rowCount === 0) {
      await admin.query(`CREATE DATABASE "${database}"`);
    }
  } finally {
    await admin.end();
  }

  const deploy = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: url },
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (deploy.status !== 0) {
    throw new Error(
      `prisma migrate deploy falló para ${database}:\n${deploy.stdout}\n${deploy.stderr}`,
    );
  }
}
