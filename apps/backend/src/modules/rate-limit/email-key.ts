import { createHmac } from 'node:crypto';

/**
 * Limit keys never hold an email address: an HMAC with `RATE_LIMIT_SECRET`
 * cannot be reversed by hashing a list of known emails without the secret.
 */
export function emailHmac(secret: string, email: string) {
  return createHmac('sha256', secret)
    .update(email.trim().toLowerCase())
    .digest('hex');
}
