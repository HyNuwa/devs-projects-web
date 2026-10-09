import RedisMock from 'ioredis-mock';
import type Redis from 'ioredis';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { RedisRateLimitStore } from './redis-rate-limit.store';

const WINDOW = 60_000;

// ioredis-mock runs the Lua scripts, so these tests exercise the real scripts.
describe('RedisRateLimitStore', () => {
  let redis: Redis;
  let store: RedisRateLimitStore;

  beforeEach(async () => {
    redis = new RedisMock();
    await redis.flushall();
    store = new RedisRateLimitStore(redis);
  });

  afterEach(() => {
    redis.disconnect();
  });

  it('sets the expiry on the first hit only', async () => {
    const first = await store.hit('k', WINDOW);
    expect(first.count).toBe(1);
    expect(first.retryAfterMs).toBeGreaterThan(WINDOW - 1_000);
    await redis.pexpire('k', 30_000);
    const second = await store.hit('k', WINDOW);
    expect(second.count).toBe(2);
    expect(second.retryAfterMs).toBeLessThanOrEqual(30_000);
  });

  it('gives a counter that lost its expiry a new window', async () => {
    await redis.set('k', '3');
    const result = await store.hit('k', WINDOW);
    expect(result.count).toBe(4);
    expect(await redis.pttl('k')).toBeGreaterThan(0);
  });

  it('counts concurrent hits without repeating a number', async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () => store.hit('k', WINDOW)),
    );
    expect(results.map((r) => r.count).sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });

  it('reset deletes the counter', async () => {
    await store.hit('k', WINDOW);
    await store.reset('k');
    expect(await redis.exists('k')).toBe(0);
  });

  it('refund takes back one hit and keeps the expiry', async () => {
    await store.hit('k', WINDOW);
    await store.hit('k', WINDOW);
    await redis.pexpire('k', 30_000);
    await store.refund('k');
    expect(await redis.get('k')).toBe('1');
    const ttl = await redis.pttl('k');
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(30_000);
  });

  it('a hit after a refund to zero keeps the window, as in memory', async () => {
    await store.hit('k', WINDOW);
    await redis.pexpire('k', 30_000);
    await store.refund('k');
    const next = await store.hit('k', WINDOW);
    expect(next.count).toBe(1);
    expect(next.retryAfterMs).toBeLessThanOrEqual(30_000);
  });

  it('refund never goes below zero nor creates a key', async () => {
    await store.hit('k', WINDOW);
    await store.refund('k');
    await store.refund('k');
    expect(await redis.get('k')).toBe('0');
    await store.refund('missing');
    expect(await redis.exists('missing')).toBe(0);
  });
});
