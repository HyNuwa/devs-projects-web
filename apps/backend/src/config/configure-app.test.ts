import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { describe, expect, it, vi } from 'vitest';

import { configureApp } from './configure-app';

/** An app whose every method is a spy, with a ConfigService over `values`. */
function fakeApp(values: Record<string, unknown>) {
  const config = {
    get: (name: string, fallback?: unknown) => values[name] ?? fallback,
  };
  const spies = new Map<string, ReturnType<typeof vi.fn>>();
  const app = new Proxy(
    {},
    {
      get: (_target, name: string) => {
        if (name === 'get') {
          return (token: unknown) =>
            token === ConfigService ? config : undefined;
        }
        if (!spies.has(name)) spies.set(name, vi.fn());
        return spies.get(name);
      },
    },
  ) as unknown as NestExpressApplication;
  return { app, set: () => spies.get('set') };
}

describe('configureApp trust proxy', () => {
  it('trusts no forwarded address by default', () => {
    const { app, set } = fakeApp({});
    configureApp(app);
    expect(set()?.mock.calls ?? []).not.toContainEqual(
      expect.arrayContaining(['trust proxy']),
    );
  });

  it('trusts the configured number of proxy hops', () => {
    const { app, set } = fakeApp({ TRUST_PROXY: 1 });
    configureApp(app);
    expect(set()).toHaveBeenCalledWith('trust proxy', 1);
  });
});
