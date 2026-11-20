import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';
import { chatgpt } from 'e2e/oauth/chatgpt';

import { ADMIN_EMAIL, adminPassword, FRONTEND_URL } from './tests/support/e2e-env.ts';

export default {
  // Your ChatGPT subscription serves the model; sign in once with `e2e login openai`, `e2e models openai` lists the ids.
  agents: {
    default: {
      model: chatgpt('gpt-6-luna'),
      system: 'You are a thorough QA agent. Verify every outcome.',
    },
  },
  targets: [
    {
      engine: web(),
      app: {
        url: FRONTEND_URL,
        // Seeds the admin, then starts the backend and `next dev` on the e2e
        // database (tests/support/serve-apps.ts; docs/agents/e2e.md).
        command: {
          executable: 'node',
          args: ['tests/support/serve-apps.ts'],
          inheritEnv: [
            'E2E_DATABASE_URL',
            'E2E_USER_ADMIN_PASSWORD',
            'USERPROFILE',
            'APPDATA',
            'LOCALAPPDATA',
            'PROGRAMDATA',
            'ProgramFiles',
            'SystemDrive',
            'WINDIR',
            'PATHEXT',
            'NUMBER_OF_PROCESSORS',
            'PROCESSOR_ARCHITECTURE',
          ],
          startupTimeout: 360_000,
          log: '.e2e/logs/apps.log',
        },
      },
    },
  ],
  credentials: {
    admin: { username: ADMIN_EMAIL, password: adminPassword() },
  },
} satisfies E2EConfig;
