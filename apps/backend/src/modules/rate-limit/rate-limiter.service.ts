import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import type Redis from 'ioredis';

import { MemoryRateLimitStore } from './memory-rate-limit.store';
import type { HitResult, RateLimitStore } from './rate-limit.store';
import { RedisRateLimitStore } from './redis-rate-limit.store';

export const RATE_LIMIT_REDIS = Symbol('RATE_LIMIT_REDIS');

export type RateLimiterMode = 'redis' | 'memory' | 'memory-fallback';

/** How often a degraded limiter tries Redis again while the connection is up. */
export const RETRY_REDIS_MS = 5_000;

/**
 * The one limiter behind every limit (openspec security/rate-limiting). Counts
 * in Redis when `REDIS_URL` is set, in memory otherwise. When Redis fails it
 * keeps limiting in memory, per instance, until ioredis reconnects or, when a
 * command failed on a live connection (a timeout), until a retry every
 * `RETRY_REDIS_MS` succeeds. It logs each transition once, not once per request.
 */
@Injectable()
export class RateLimiterService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RateLimiterService.name);
  private readonly redisStore: RedisRateLimitStore | null;
  private memory = new MemoryRateLimitStore();
  private degraded = false;
  private retryRedisAt = 0;

  constructor(@Inject(RATE_LIMIT_REDIS) private readonly redis: Redis | null) {
    this.redisStore = redis ? new RedisRateLimitStore(redis) : null;
    redis?.on('error', (error: Error) => this.degrade(error));
    redis?.on('ready', () => this.recover());
  }

  async onModuleInit() {
    if (!this.redis || this.redis.status !== 'wait') return;
    try {
      await this.redis.connect();
    } catch (error) {
      this.degrade(error as Error);
    }
  }

  onModuleDestroy() {
    this.redis?.disconnect();
  }

  mode(): RateLimiterMode {
    if (!this.redisStore) return 'memory';
    return this.degraded ? 'memory-fallback' : 'redis';
  }

  hit(key: string, windowMs: number): Promise<HitResult> {
    return this.run((store) => store.hit(key, windowMs));
  }

  reset(key: string) {
    return this.run((store) => store.reset(key));
  }

  refund(key: string) {
    return this.run((store) => store.refund(key));
  }

  private async run<T>(operation: (store: RateLimitStore) => Promise<T>) {
    if (!this.redisStore) return operation(this.memory);
    if (this.degraded && !this.shouldRetryRedis()) {
      return operation(this.memory);
    }
    try {
      const result = await operation(this.redisStore);
      this.recover();
      return result;
    } catch (error) {
      this.degrade(error as Error);
      return operation(this.memory);
    }
  }

  private shouldRetryRedis() {
    if (this.redis?.status !== 'ready' || Date.now() < this.retryRedisAt) {
      return false;
    }
    this.retryRedisAt = Date.now() + RETRY_REDIS_MS;
    return true;
  }

  private degrade(error: Error) {
    this.retryRedisAt = Date.now() + RETRY_REDIS_MS;
    if (this.degraded) return;
    this.degraded = true;
    this.logger.error(
      `Redis no responde; los límites de frecuencia siguen en memoria por instancia: ${error.message}`,
    );
  }

  private recover() {
    if (!this.degraded) return;
    this.degraded = false;
    // Redis is the source of truth again; per-instance counts are dropped.
    this.memory = new MemoryRateLimitStore();
    this.logger.log('Redis volvió; los límites de frecuencia vuelven a Redis');
  }
}
