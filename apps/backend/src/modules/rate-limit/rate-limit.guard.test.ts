import 'reflect-metadata';
import { ExecutionContext, HttpException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginAttempts } from './login-attempts';
import {
  RateLimit,
  RateLimitGuard,
  tooManyRequestsMessage,
} from './rate-limit.guard';
import { RateLimitPolicies, type RateLimitPolicy } from './rate-limit.policies';
import { RateLimiterService } from './rate-limiter.service';

const config = (values: Record<string, unknown> = {}) =>
  ({
    get: (name: string, fallback?: unknown) => values[name] ?? fallback,
  }) as unknown as ConfigService;

class Target {
  @RateLimit('login') login() {}
  @RateLimit('recovery') recovery() {}
  @RateLimit('communityWrite') write() {}
  free() {}
}

describe('RateLimitPolicies', () => {
  const policies = new RateLimitPolicies(
    config({ RATE_LIMIT_SECRET: 's', COMMUNITY_WRITE_RATE_LIMIT: 6 }),
  );
  const hmac = policies.emailKey('ana@uni.edu');
  const req = { ip: '1.2.3.4', body: { email: ' Ana@Uni.edu ' } };

  it.each<[RateLimitPolicy, string[], number[], number[]]>([
    [
      'login',
      [`login:${hmac}:1.2.3.4`, 'login-ip:1.2.3.4'],
      [5, 20],
      [900_000, 900_000],
    ],
    ['signup', ['signup:1.2.3.4'], [3], [3_600_000]],
    [
      'recovery',
      [`recovery:${hmac}`, 'recovery-ip:1.2.3.4'],
      [3, 3],
      [3_600_000, 3_600_000],
    ],
    // Its password check shares the sign-in cap per client, or it would be a
    // second guessing channel without one.
    [
      'appeal',
      [`appeal:${hmac}:1.2.3.4`, 'login-ip:1.2.3.4'],
      [5, 20],
      [900_000, 900_000],
    ],
  ])('%s keys, limits and windows', (policy, keys, limits, windows) => {
    const rules = policies.rules(policy, req);
    expect(rules.map((r) => r.key)).toEqual(keys);
    expect(rules.map((r) => r.limit)).toEqual(limits);
    expect(rules.map((r) => r.windowMs)).toEqual(windows);
  });

  it('keys community writes by action and account, 6 per minute', () => {
    expect(
      policies.rules(
        'communityWrite',
        { ...req, user: { id: 'u1' } },
        'Reports.file',
      ),
    ).toEqual([
      { key: 'community:Reports.file:u1', limit: 6, windowMs: 60_000 },
    ]);
  });

  it('keys an IPv4-mapped address as the IPv4 client', () => {
    expect(policies.rules('signup', { ip: '::ffff:1.2.3.4' })[0].key).toBe(
      'signup:1.2.3.4',
    );
  });

  it('keys IPv6 clients by their /64, so rotating addresses in it does not help', () => {
    const keyFor = (ip: string) => policies.rules('signup', { ip })[0].key;
    expect(keyFor('2001:db8:1:2:aaaa::1')).toBe('signup:2001:db8:1:2::/64');
    expect(keyFor('2001:DB8:1:2:bbbb:cccc:dddd:9')).toBe(
      'signup:2001:db8:1:2::/64',
    );
    expect(keyFor('2001:db8::1')).toBe('signup:2001:db8:0:0::/64');
    expect(keyFor('::1')).toBe('signup:0:0:0:0::/64');
  });

  it('never puts the email in a key', () => {
    for (const policy of ['login', 'recovery', 'appeal'] as const) {
      for (const rule of policies.rules(policy, req)) {
        expect(rule.key.toLowerCase()).not.toContain('ana@uni.edu');
      }
    }
  });
});

describe('tooManyRequestsMessage', () => {
  it.each([
    [1, 'Demasiados intentos. Probá de nuevo en 1 minuto'],
    [60, 'Demasiados intentos. Probá de nuevo en 1 minuto'],
    [61, 'Demasiados intentos. Probá de nuevo en 2 minutos'],
    [900, 'Demasiados intentos. Probá de nuevo en 15 minutos'],
  ])('%i seconds', (seconds, message) => {
    expect(tooManyRequestsMessage(seconds)).toBe(message);
  });
});

describe('RateLimitGuard', () => {
  let limiter: RateLimiterService;
  let policies: RateLimitPolicies;
  let guard: RateLimitGuard;
  let setHeader: ReturnType<typeof vi.fn>;
  let now: number;

  beforeEach(async () => {
    limiter = new RateLimiterService(null);
    await limiter.onModuleInit();
    policies = new RateLimitPolicies(config());
    guard = new RateLimitGuard(new Reflector(), limiter, policies);
    setHeader = vi.fn();
    now = Date.now();
    vi.spyOn(Date, 'now').mockImplementation(() => now);
  });

  const context = (
    handler: keyof Target,
    req: Record<string, unknown>,
  ): ExecutionContext =>
    ({
      getHandler: () => Target.prototype[handler],
      getClass: () => Target,
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({ setHeader }),
      }),
    }) as unknown as ExecutionContext;

  const attempt = (handler: keyof Target, req: Record<string, unknown>) =>
    guard.canActivate(context(handler, req));

  const refusal = async (promise: Promise<unknown>) => {
    const error = await promise.catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HttpException);
    return error as HttpException;
  };

  it('lets routes without a policy through', async () => {
    expect(await attempt('free', {})).toBe(true);
  });

  it('refuses the sixth sign-in with 429, Retry-After and the message', async () => {
    const req = { ip: '1.1.1.1', body: { email: 'ana@uni.edu' } };
    for (let i = 0; i < 5; i += 1)
      expect(await attempt('login', req)).toBe(true);
    now += 60_000;
    const error = await refusal(attempt('login', req));
    expect(error.getStatus()).toBe(429);
    expect(error.getResponse()).toEqual({
      code: 'TOO_MANY_REQUESTS',
      message: 'Demasiados intentos. Probá de nuevo en 14 minutos',
      retryAfter: 840,
    });
    expect(setHeader).toHaveBeenCalledWith('Retry-After', '840');
  });

  it('gives back the hit on keys still within their limit when refusing', async () => {
    const req = { ip: '1.1.1.1', body: { email: 'ana@uni.edu' } };
    for (let i = 0; i < 5; i += 1) await attempt('login', req);
    await refusal(attempt('login', req));
    await refusal(attempt('login', req));
    // The IP counted only the five real attempts: 15 more emails still pass.
    for (let i = 0; i < 15; i += 1) {
      expect(
        await attempt('login', { ip: '1.1.1.1', body: { email: `u${i}@x` } }),
      ).toBe(true);
    }
    await refusal(attempt('login', { ip: '1.1.1.1', body: { email: 'z@x' } }));
  });

  it('refuses recovery on the email limit even from new IPs', async () => {
    for (let i = 0; i < 3; i += 1) {
      await attempt('recovery', { ip: `9.9.9.${i}`, body: { email: 'a@x' } });
    }
    const error = await refusal(
      attempt('recovery', { ip: '9.9.9.9', body: { email: 'A@x ' } }),
    );
    expect(error.getStatus()).toBe(429);
  });

  it('forgiving a sign-in clears the email counter and refunds only that attempt on the IP', async () => {
    const attempts = new LoginAttempts(limiter, policies);
    const req = { ip: '2.2.2.2', body: { email: 'ana@uni.edu' } };
    for (let i = 0; i < 3; i += 1) await attempt('login', req);
    await attempts.forgive('ana@uni.edu', '2.2.2.2');
    for (let i = 0; i < 5; i += 1)
      expect(await attempt('login', req)).toBe(true);
    await refusal(attempt('login', req));
    // The third attempt was the correct password: 2 + 5 failures, 13 left.
    for (let i = 0; i < 13; i += 1) {
      expect(
        await attempt('login', { ip: '2.2.2.2', body: { email: `v${i}@x` } }),
      ).toBe(true);
    }
    await refusal(attempt('login', { ip: '2.2.2.2', body: { email: 'w@x' } }));
  });
});
