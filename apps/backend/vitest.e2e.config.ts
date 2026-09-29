import { defineConfig, mergeConfig } from 'vitest/config';

import { sharedConfig } from './vitest.shared';

export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: { include: ['test/**/*.e2e.test.ts'], fileParallelism: false },
  }),
);
