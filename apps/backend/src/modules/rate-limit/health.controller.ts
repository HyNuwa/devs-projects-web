import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { RateLimiterService } from './rate-limiter.service';

/**
 * For monitoring (README_DEVOPS): `degraded` means Redis is configured but not
 * answering, so limits are counted per instance. Nothing else is disclosed.
 */
@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly limiter: RateLimiterService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Estado de la API' })
  health() {
    const rateLimiter = this.limiter.mode();
    return {
      status: rateLimiter === 'memory-fallback' ? 'degraded' : 'ok',
      rateLimiter,
    };
  }
}
