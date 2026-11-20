/**
 * The command e2e.config.ts starts: seeds the ADMIN account, then runs the
 * backend and the frontend against the e2e database, on ports away from the
 * dev ones. The runner probes the frontend and stops this process at the end.
 */
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';

import {
  API_URL,
  BACKEND_DIR,
  BACKEND_PORT,
  backendEnv,
  FRONTEND_DIR,
  FRONTEND_PORT,
  FRONTEND_URL,
  guardedDatabaseUrl,
} from './e2e-env.ts';
import { disconnect, seedAdmin } from './seed-e2e.ts';

const databaseUrl = guardedDatabaseUrl();
await seedAdmin();
await disconnect();

const children: ChildProcess[] = [];

function start(name: string, cwd: string, args: string[], env: NodeJS.ProcessEnv) {
  const child = spawn(process.execPath, args, { cwd, env, stdio: 'inherit' });
  child.on('exit', (code) => {
    console.error(`[serve-apps] ${name} exited with ${code}`);
    stop(1);
  });
  children.push(child);
  return child;
}

function killTree(pid: number | undefined) {
  if (!pid) return;
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // Already gone.
    }
  }
}

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) killTree(child.pid);
  process.exit(code);
}
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) process.on(signal, () => stop());

// The backend's own .env, with the e2e database and ports in place of the dev ones.
const backendProcessEnv = {
  ...process.env,
  ...backendEnv(),
  DATABASE_URL: databaseUrl,
  PORT: String(BACKEND_PORT),
  CORS_ORIGIN: FRONTEND_URL,
  FRONTEND_URL,
};
// Built first and run directly: `nest start` would put a wrapper between this
// process and the server, and on Windows the server outlives a killed wrapper.
const build = spawnSync(process.execPath, ['node_modules/@nestjs/cli/bin/nest.js', 'build'], {
  cwd: BACKEND_DIR,
  env: backendProcessEnv,
  stdio: 'inherit',
});
if (build.status !== 0) {
  console.error('[serve-apps] the backend build failed');
  process.exit(1);
}
start('backend', BACKEND_DIR, ['--enable-source-maps', 'dist/src/main'], backendProcessEnv);

const deadline = Date.now() + 240_000;
while (true) {
  try {
    const response = await fetch(`${API_URL}/institutions`);
    if (response.status < 500) break;
  } catch {
    // Not listening yet.
  }
  if (Date.now() > deadline) {
    console.error('[serve-apps] the backend never answered');
    stop(1);
  }
  await new Promise((resolve) => setTimeout(resolve, 1_000));
}

// Without the backend's .env: its NODE_ENV=development breaks `next dev`.
const { NODE_ENV: _nodeEnv, ...frontendEnv } = process.env;
start(
  'frontend',
  FRONTEND_DIR,
  ['node_modules/next/dist/bin/next', 'dev', '--port', String(FRONTEND_PORT)],
  { ...frontendEnv, NEXT_PUBLIC_API_URL: API_URL, NEXT_TELEMETRY_DISABLED: '1' },
);

// On Windows the runner's stop is a hard kill that skips the handlers above, so
// a detached watchdog takes the servers down once this process is gone.
const watchdog = `
const [parent, ...pids] = process.argv.slice(1).map(Number);
const { spawnSync } = require('node:child_process');
setInterval(() => {
  try { process.kill(parent, 0); return; } catch {}
  for (const pid of pids) {
    if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' });
    else { try { process.kill(pid, 'SIGTERM'); } catch {} }
  }
  process.exit(0);
}, 1000);
`;
spawn(
  process.execPath,
  ['-e', watchdog, String(process.pid), ...children.map((child) => String(child.pid))],
  { detached: true, stdio: 'ignore' },
).unref();
