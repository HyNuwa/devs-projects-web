import { defineConfig, mergeConfig } from 'vitest/config';

import { sharedConfig } from './vitest.shared';

/** Database migration tests: each applies migrations inside a rolled-back transaction. */
export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      include: ['prisma/migration-tests/**/*.test.ts'],
      fileParallelism: false,
      testTimeout: 60_000,
      hookTimeout: 120_000,
    },
  }),
);
