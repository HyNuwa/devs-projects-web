import { defineConfig, mergeConfig } from 'vitest/config';

import { sharedConfig } from './vitest.shared';

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      include: ['test/**/*.e2e.test.ts'],
      fileParallelism: false,
      globalSetup: ['test/support/e2e-global-setup.ts'],
      setupFiles: ['test/support/e2e-env.ts'],
      testTimeout: 30_000,
      hookTimeout: 120_000,
    },
  }),
);
