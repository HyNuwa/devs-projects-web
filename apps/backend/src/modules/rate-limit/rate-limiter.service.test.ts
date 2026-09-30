import { Logger } from '@nestjs/common';
import RedisMock from 'ioredis-mock';
import type Redis from 'ioredis';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { RateLimiterService } from './rate-limiter.service';

const WINDOW = 60_000;

describe('RateLimiterService', () => {
  let errorLog: ReturnType<typeof vi.spyOn>;
  let infoLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorLog = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    infoLog = vi
      .spyOn(Logger.prototype, 'log')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses memory when no Redis is configured', async () => {
    const limiter = new RateLimiterService(null);
    await limiter.onModuleInit();
    expect(limiter.mode()).toBe('memory');
    expect((await limiter.hit('k', WINDOW)).count).toBe(1);
    expect((await limiter.hit('k', WINDOW)).count).toBe(2);
  });

  describe('with Redis', () => {
    let redis: Redis;
    let limiter: RateLimiterService;

    beforeEach(async () => {
      redis = new RedisMock();
      await redis.flushall();
      limiter = new RateLimiterService(redis);
      await limiter.onModuleInit();
    });

    afterEach(() => redis.disconnect());

    it('counts in Redis', async () => {
      await limiter.hit('k', WINDOW);
      expect(limiter.mode()).toBe('redis');
      expect(await redis.get('k')).toBe('1');
    });

    it('falls back to memory on a Redis error and logs it once', async () => {
      vi.spyOn(redis, 'eval').mockRejectedValue(new Error('down'));
      expect((await limiter.hit('k', WINDOW)).count).toBe(1);
      expect((await limiter.hit('k', WINDOW)).count).toBe(2);
      redis.emit('error', new Error('still down'));
      expect(limiter.mode()).toBe('memory-fallback');
      expect(errorLog).toHaveBeenCalledTimes(1);
    });

    it('goes back to Redis when it is ready again and logs it once', async () => {
      const evalSpy = vi
        .spyOn(redis, 'eval')
        .mockRejectedValueOnce(new Error('down'));
      await limiter.hit('k', WINDOW);
      evalSpy.mockRestore();
      redis.emit('ready');
      redis.emit('ready');
      expect(limiter.mode()).toBe('redis');
      expect(infoLog).toHaveBeenCalledTimes(1);
      await limiter.hit('k', WINDOW);
      expect(await redis.get('k')).toBe('1');
    });

    it('drops the fallback counters on recovery', async () => {
      const evalSpy = vi
        .spyOn(redis, 'eval')
        .mockRejectedValue(new Error('down'));
      await limiter.hit('k', WINDOW);
      redis.emit('ready');
      vi.spyOn(redis, 'eval').mockRejectedValue(new Error('down again'));
      expect((await limiter.hit('k', WINDOW)).count).toBe(1);
      expect(evalSpy).toHaveBeenCalled();
    });

    it('reset and refund also fall back to memory', async () => {
      vi.spyOn(redis, 'eval').mockRejectedValue(new Error('down'));
      vi.spyOn(redis, 'del').mockRejectedValue(new Error('down'));
      await limiter.hit('k', WINDOW);
      await limiter.hit('k', WINDOW);
      await limiter.refund('k');
      expect((await limiter.hit('k', WINDOW)).count).toBe(2);
      await limiter.reset('k');
      expect((await limiter.hit('k', WINDOW)).count).toBe(1);
    });
  });

  it('starts in fallback when Redis cannot connect at boot', async () => {
    const redis = new RedisMock();
    vi.spyOn(redis, 'connect').mockRejectedValue(new Error('refused'));
    Object.defineProperty(redis, 'status', { value: 'wait' });
    const limiter = new RateLimiterService(redis);
    await limiter.onModuleInit();
    expect(limiter.mode()).toBe('memory-fallback');
    expect(errorLog).toHaveBeenCalledTimes(1);
    redis.disconnect();
  });
});
