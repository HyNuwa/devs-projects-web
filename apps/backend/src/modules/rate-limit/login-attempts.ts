import { Injectable } from '@nestjs/common';

import { RateLimitPolicies } from './rate-limit.policies';
import { RateLimiterService } from './rate-limiter.service';

/**
 * Sign-in limits count failures only. The guard reserves every attempt before
 * the password is checked, so parallel guesses cannot slip past the limit; a
 * correct password (also when the account turns out suspended) then clears the
 * email+IP counter and gives back this attempt on the IP counter, keeping the
 * IP's earlier failures.
 */
@Injectable()
export class LoginAttempts {
  constructor(
    private readonly limiter: RateLimiterService,
    private readonly policies: RateLimitPolicies,
  ) {}

  async forgive(email: string, ip: string | undefined) {
    const [perEmail, perIp] = this.policies.loginRules(
      this.policies.emailKey(email),
      this.policies.clientKey(ip),
    );
    await Promise.all([
      this.limiter.reset(perEmail.key),
      this.limiter.refund(perIp.key),
    ]);
  }

  /**
   * The appeal from sign-in shares the per-client cap: a correct password there
   * gives back its attempt, as a successful sign-in does.
   */
  async forgiveClient(ip: string | undefined) {
    const [, perIp] = this.policies.loginRules('', this.policies.clientKey(ip));
    await this.limiter.refund(perIp.key);
  }
}
