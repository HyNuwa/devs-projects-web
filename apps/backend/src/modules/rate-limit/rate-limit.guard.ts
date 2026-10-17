import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Response } from 'express';

import {
  RateLimitPolicies,
  type RateLimitPolicy,
  type RateLimitRequest,
} from './rate-limit.policies';
import { RateLimiterService } from './rate-limiter.service';

const RATE_LIMIT_POLICY = 'rateLimitPolicy';

/** Applies a limit of openspec security/rate-limiting; needs `RateLimitGuard`. */
export const RateLimit = (policy: RateLimitPolicy) =>
  SetMetadata(RATE_LIMIT_POLICY, policy);

/** «Probá de nuevo en X minutos», rounded up, never 0. */
export function tooManyRequestsMessage(retryAfterSeconds: number) {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
  return `Demasiados intentos. Probá de nuevo en ${minutes} ${
    minutes === 1 ? 'minuto' : 'minutos'
  }`;
}

/**
 * Counts the request on every key of its policy and refuses it with 429 when
 * any key is over its limit. A refused request is not an attempt: keys still
 * within their limit get their hit back, so a blocked email does not also use
 * up the IP's allowance.
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly limiter: RateLimiterService,
    private readonly policies: RateLimitPolicies,
  ) {}

  async canActivate(context: ExecutionContext) {
    const policy = this.reflector.getAllAndOverride<
      RateLimitPolicy | undefined
    >(RATE_LIMIT_POLICY, [context.getHandler(), context.getClass()]);
    if (!policy) return true;

    const http = context.switchToHttp();
    const rules = this.policies.rules(
      policy,
      http.getRequest<RateLimitRequest>(),
      `${context.getClass().name}.${context.getHandler().name}`,
    );
    const results = await Promise.all(
      rules.map(async (rule) => ({
        rule,
        ...(await this.limiter.hit(rule.key, rule.windowMs)),
      })),
    );
    const over = results.filter(({ rule, count }) => count > rule.limit);
    if (over.length === 0) return true;

    await Promise.all(
      results
        .filter(({ rule, count }) => count <= rule.limit)
        .map(({ rule }) => this.limiter.refund(rule.key)),
    );
    const retryAfter = Math.max(
      1,
      Math.ceil(Math.max(...over.map((r) => r.retryAfterMs)) / 1000),
    );
    http.getResponse<Response>().setHeader('Retry-After', String(retryAfter));
    throw new HttpException(
      {
        code: 'TOO_MANY_REQUESTS',
        message: tooManyRequestsMessage(retryAfter),
        retryAfter,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
