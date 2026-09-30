import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { HealthController } from './health.controller';
import { LoginAttempts } from './login-attempts';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitPolicies } from './rate-limit.policies';
import { RATE_LIMIT_REDIS, RateLimiterService } from './rate-limiter.service';

@Global()
@Module({
  controllers: [HealthController],
  providers: [
    {
      provide: RATE_LIMIT_REDIS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL');
        // Fail fast instead of queuing while Redis is down: the limiter falls
        // back to memory, and ioredis keeps reconnecting in the background.
        return url
          ? new Redis(url, {
              lazyConnect: true,
              enableOfflineQueue: false,
              commandTimeout: 500,
              maxRetriesPerRequest: 1,
            })
          : null;
      },
    },
    RateLimiterService,
    RateLimitPolicies,
    RateLimitGuard,
    LoginAttempts,
  ],
  exports: [
    RateLimiterService,
    RateLimitPolicies,
    RateLimitGuard,
    LoginAttempts,
  ],
})
export class RateLimitModule {}
