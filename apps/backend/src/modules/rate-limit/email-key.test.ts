import { describe, expect, it } from 'vitest';

import { emailHmac } from './email-key';

describe('emailHmac', () => {
  it('ignores surrounding spaces and case', () => {
    expect(emailHmac('secret', '  Ana@Uni.edu ')).toBe(
      emailHmac('secret', 'ana@uni.edu'),
    );
  });

  it('depends on the secret', () => {
    expect(emailHmac('one', 'ana@uni.edu')).not.toBe(
      emailHmac('two', 'ana@uni.edu'),
    );
  });

  it('is a hex HMAC that does not contain the email', () => {
    const key = emailHmac('secret', 'ana@uni.edu');
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).not.toContain('ana');
  });
});
