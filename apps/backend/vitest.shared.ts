import swc from 'unplugin-swc';
import type { ViteUserConfig } from 'vitest/config';

/**
 * Shared Vitest setup for the backend. Nest needs decorator metadata for DI,
 * which esbuild does not emit, so files go through SWC like in Jest.
 * Vitest runs `*.test.ts`; Jest keeps `*.spec.ts` and `*.e2e-spec.ts`.
 */
export const sharedConfig: ViteUserConfig = {
  plugins: [
    swc.vite({
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
        target: 'es2022',
      },
    }),
  ],
  test: {
    environment: 'node',
    pool: 'threads',
    // Keep memory low on developer machines.
    maxWorkers: 2,
  },
};
