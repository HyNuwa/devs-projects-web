import { describe, expect, it } from 'vitest';

import { HealthController } from './health.controller';
import type {
  RateLimiterMode,
  RateLimiterService,
} from './rate-limiter.service';

const health = (mode: RateLimiterMode) =>
  new HealthController({
    mode: () => mode,
  } as unknown as RateLimiterService).health();

describe('HealthController', () => {
  it.each<[RateLimiterMode, string]>([
    ['redis', 'ok'],
    ['memory', 'ok'],
    ['memory-fallback', 'degraded'],
  ])('%s limiter reports %s', (mode, status) => {
    expect(health(mode)).toEqual({ status, rateLimiter: mode });
  });
});
