/** A counter after a hit: how many hits its window holds and when it ends. */
export type HitResult = { count: number; retryAfterMs: number };

/**
 * Fixed-window counters (openspec security/rate-limiting). Redis and memory
 * implement the same rules: the first hit starts the window, later hits only
 * count, and the key disappears when the window ends.
 */
export interface RateLimitStore {
  hit(key: string, windowMs: number): Promise<HitResult>;
  /** Deletes the counter, so the next hit starts a new window. */
  reset(key: string): Promise<void>;
  /** Takes back one hit, never below zero, keeping the window's end. */
  refund(key: string): Promise<void>;
}
