import 'reflect-metadata';
import { describe, expect, it } from 'vitest';

import { validate } from './env.validation';

const base = { DATABASE_URL: 'postgres://db', JWT_SECRET: 'jwt' };
const production = {
  ...base,
  NODE_ENV: 'production',
  REDIS_URL: 'redis://localhost:6379',
  RATE_LIMIT_SECRET: 'b3f1c9a27e584d0c9a1f6e2d7c4b8a90',
};

describe('validate (rate limiting variables)', () => {
  it('runs without Redis in development, with a fixed secret and no proxy', () => {
    const config = validate(base);
    expect(config.REDIS_URL).toBeUndefined();
    expect(config.RATE_LIMIT_SECRET).toEqual(expect.any(String));
    expect(config.TRUST_PROXY).toBe(0);
  });

  it('starts in production with Redis and a secret', () => {
    expect(() => validate(production)).not.toThrow();
  });

  it('refuses production without REDIS_URL, naming it', () => {
    const { REDIS_URL: _omit, ...config } = production;
    expect(() => validate(config)).toThrow(/REDIS_URL/);
  });

  it('refuses production without RATE_LIMIT_SECRET, naming it', () => {
    const { RATE_LIMIT_SECRET: _omit, ...config } = production;
    expect(() => validate(config)).toThrow(/RATE_LIMIT_SECRET/);
  });

  it('refuses the development secret or a short one in production', () => {
    for (const secret of ['devsproject-dev-rate-limit-secret', 'corto']) {
      expect(() =>
        validate({ ...production, RATE_LIMIT_SECRET: secret }),
      ).toThrow(/RATE_LIMIT_SECRET/);
    }
  });

  it('reads TRUST_PROXY as a hop count', () => {
    expect(validate({ ...base, TRUST_PROXY: '1' }).TRUST_PROXY).toBe(1);
    expect(() => validate({ ...base, TRUST_PROXY: '-1' })).toThrow(
      /TRUST_PROXY/,
    );
  });
});
