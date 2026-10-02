import type Redis from 'ioredis';

import type { HitResult, RateLimitStore } from './rate-limit.store';

// Redis runs a script without interleaving other commands, so counting,
// starting the window and reading its end happen as one step. The window starts
// when the key has no expiry: a new key, or one left without it. A key refunded
// to zero keeps its expiry, so the next hit stays in the same window.
const HIT = `
local count = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {count, ttl}
`;

// DECR keeps the key's expiry; missing keys and zero stay untouched.
const REFUND = `
local count = tonumber(redis.call('GET', KEYS[1]) or '0')
if count > 0 then redis.call('DECR', KEYS[1]) end
return count
`;

/** Counters shared by every API instance (openspec security/rate-limiting). */
export class RedisRateLimitStore implements RateLimitStore {
  constructor(private readonly redis: Redis) {}

  async hit(key: string, windowMs: number): Promise<HitResult> {
    const [count, ttl] = (await this.redis.eval(HIT, 1, key, windowMs)) as [
      number,
      number,
    ];
    return { count: Number(count), retryAfterMs: Number(ttl) };
  }

  async reset(key: string) {
    await this.redis.del(key);
  }

  async refund(key: string) {
    await this.redis.eval(REFUND, 1, key);
  }
}
