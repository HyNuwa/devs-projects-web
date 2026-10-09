import type { HitResult, RateLimitStore } from './rate-limit.store';

const SWEEP_EVERY_MS = 60_000;

type Counter = { count: number; resetAt: number };

/**
 * Per-process counters: the backend in development and tests, and the fallback
 * while Redis is down. Each operation runs without awaiting, so it is atomic
 * within the process.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private readonly counters = new Map<string, Counter>();
  private lastSweep: number;

  constructor(private readonly now: () => number = Date.now) {
    this.lastSweep = now();
  }

  hit(key: string, windowMs: number): Promise<HitResult> {
    const now = this.now();
    this.sweep(now);
    const counter = this.live(key, now);
    if (!counter) {
      this.counters.set(key, { count: 1, resetAt: now + windowMs });
      return Promise.resolve({ count: 1, retryAfterMs: windowMs });
    }
    counter.count += 1;
    return Promise.resolve({
      count: counter.count,
      retryAfterMs: counter.resetAt - now,
    });
  }

  reset(key: string): Promise<void> {
    this.counters.delete(key);
    return Promise.resolve();
  }

  refund(key: string): Promise<void> {
    const counter = this.live(key, this.now());
    if (counter && counter.count > 0) counter.count -= 1;
    return Promise.resolve();
  }

  /** Live and not-yet-swept counters, for tests. */
  size() {
    return this.counters.size;
  }

  private live(key: string, now: number) {
    const counter = this.counters.get(key);
    if (counter && counter.resetAt <= now) {
      this.counters.delete(key);
      return undefined;
    }
    return counter;
  }

  private sweep(now: number) {
    if (now - this.lastSweep < SWEEP_EVERY_MS) return;
    this.lastSweep = now;
    for (const [key, counter] of this.counters) {
      if (counter.resetAt <= now) this.counters.delete(key);
    }
  }
}
