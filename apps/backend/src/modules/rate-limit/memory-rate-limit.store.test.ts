import { beforeEach, describe, expect, it } from 'vitest';

import { MemoryRateLimitStore } from './memory-rate-limit.store';

const WINDOW = 60_000;

describe('MemoryRateLimitStore', () => {
  let now: number;
  let store: MemoryRateLimitStore;

  beforeEach(() => {
    now = 1_000_000;
    store = new MemoryRateLimitStore(() => now);
  });

  it('starts a window on the first hit and counts the following ones', async () => {
    expect(await store.hit('k', WINDOW)).toEqual({
      count: 1,
      retryAfterMs: WINDOW,
    });
    now += 10_000;
    expect(await store.hit('k', WINDOW)).toEqual({
      count: 2,
      retryAfterMs: WINDOW - 10_000,
    });
  });

  it('keeps each key in its own window', async () => {
    await store.hit('a', WINDOW);
    expect((await store.hit('b', WINDOW)).count).toBe(1);
  });

  it('starts over once the window ends', async () => {
    await store.hit('k', WINDOW);
    await store.hit('k', WINDOW);
    now += WINDOW;
    expect(await store.hit('k', WINDOW)).toEqual({
      count: 1,
      retryAfterMs: WINDOW,
    });
  });

  it('reset deletes the counter', async () => {
    await store.hit('k', WINDOW);
    await store.hit('k', WINDOW);
    await store.reset('k');
    expect((await store.hit('k', WINDOW)).count).toBe(1);
  });

  it('refund takes back one hit and keeps the window', async () => {
    await store.hit('k', WINDOW);
    await store.hit('k', WINDOW);
    now += 20_000;
    await store.refund('k');
    expect(await store.hit('k', WINDOW)).toEqual({
      count: 2,
      retryAfterMs: WINDOW - 20_000,
    });
  });

  it('refund never goes below zero', async () => {
    await store.hit('k', WINDOW);
    await store.refund('k');
    await store.refund('k');
    expect((await store.hit('k', WINDOW)).count).toBe(1);
  });

  it('refund of a missing or expired key does nothing', async () => {
    await store.refund('missing');
    await store.hit('k', WINDOW);
    now += WINDOW;
    await store.refund('k');
    expect((await store.hit('k', WINDOW)).count).toBe(1);
    expect((await store.hit('missing', WINDOW)).count).toBe(1);
  });

  it('sweeps expired counters so memory does not grow without bound', async () => {
    for (let i = 0; i < 50; i += 1) await store.hit(`k${i}`, WINDOW);
    expect(store.size()).toBe(50);
    now += WINDOW + 60_000;
    await store.hit('fresh', WINDOW);
    expect(store.size()).toBe(1);
  });
});
