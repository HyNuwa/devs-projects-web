import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { emailHmac } from './email-key';

export type RateLimitPolicy =
  'login' | 'signup' | 'recovery' | 'appeal' | 'communityWrite';

/** What the policies read from a request (Express request after the JWT guard). */
export type RateLimitRequest = {
  ip?: string;
  body?: { email?: unknown };
  user?: { id?: string };
};

export type RateLimitRule = { key: string; limit: number; windowMs: number };

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

/**
 * The limits of openspec security/rate-limiting. Keys hold the client IP
 * (`req.ip`, which honors `TRUST_PROXY`), an HMAC of the email, or the account.
 */
@Injectable()
export class RateLimitPolicies {
  private readonly secret: string;
  private readonly communityLimit: number;
  private readonly communityWindowMs: number;

  constructor(config: ConfigService) {
    this.secret = config.get<string>(
      'RATE_LIMIT_SECRET',
      'devsproject-dev-rate-limit-secret',
    );
    this.communityLimit = Number(
      config.get<number>('COMMUNITY_WRITE_RATE_LIMIT', 6),
    );
    this.communityWindowMs = Number(
      config.get<number>('COMMUNITY_WRITE_RATE_TTL_MS', MINUTE),
    );
  }

  /** `action` names the endpoint: each community write has its own limit. */
  rules(
    policy: RateLimitPolicy,
    req: RateLimitRequest,
    action = '',
  ): RateLimitRule[] {
    const ip = req.ip ?? 'unknown';
    const email = this.email(req);
    switch (policy) {
      case 'login':
        return this.loginRules(email, ip);
      case 'signup':
        return [{ key: `signup:${ip}`, limit: 3, windowMs: HOUR }];
      case 'recovery':
        return [
          { key: `recovery:${email}`, limit: 3, windowMs: HOUR },
          { key: `recovery-ip:${ip}`, limit: 3, windowMs: HOUR },
        ];
      case 'appeal':
        return [
          { key: `appeal:${email}:${ip}`, limit: 5, windowMs: 15 * MINUTE },
        ];
      case 'communityWrite':
        return [
          {
            key: `community:${action}:${req.user?.id ?? `ip:${ip}`}`,
            limit: this.communityLimit,
            windowMs: this.communityWindowMs,
          },
        ];
    }
  }

  /** Counts failed sign-ins; see `LoginAttempts.forgive` for the successes. */
  loginRules(emailKey: string, ip: string): RateLimitRule[] {
    return [
      { key: `login:${emailKey}:${ip}`, limit: 5, windowMs: 15 * MINUTE },
      { key: `login-ip:${ip}`, limit: 20, windowMs: 15 * MINUTE },
    ];
  }

  emailKey(email: string) {
    return emailHmac(this.secret, email);
  }

  private email(req: RateLimitRequest) {
    const email = req.body?.email;
    return this.emailKey(typeof email === 'string' ? email : '');
  }
}
