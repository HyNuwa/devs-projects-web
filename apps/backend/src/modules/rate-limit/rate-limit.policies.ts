import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isIPv6 } from 'node:net';

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
    const ip = clientKey(req.ip);
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
        // It checks the password too, so it shares the sign-in cap per client.
        return [
          { key: `appeal:${email}:${ip}`, limit: 5, windowMs: 15 * MINUTE },
          this.loginRules(email, ip)[1],
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

  /** The client part of the keys, from `req.ip`. */
  clientKey(ip: string | undefined) {
    return clientKey(ip);
  }

  emailKey(email: string) {
    return emailHmac(this.secret, email);
  }

  private email(req: RateLimitRequest) {
    const email = req.body?.email;
    return this.emailKey(typeof email === 'string' ? email : '');
  }
}

/**
 * An IPv4-mapped address counts as its IPv4 client, and an IPv6 client by its
 * /64: one subscriber usually holds a whole /64 and could rotate addresses in it.
 */
function clientKey(ip: string | undefined) {
  if (!ip) return 'unknown';
  const mapped = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip);
  if (mapped) return mapped[1];
  if (!isIPv6(ip)) return ip;
  const [head, tail = ''] = ip.toLowerCase().split('::');
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const groups = ip.includes('::')
    ? [
        ...left,
        ...Array<string>(8 - left.length - right.length).fill('0'),
        ...right,
      ]
    : left;
  return `${groups
    .slice(0, 4)
    .map((group) => group.replace(/^0+(?=.)/, ''))
    .join(':')}::/64`;
}
