import { describe, expect, it } from 'vitest';

import { isBlockedAddress } from './blocked-address';

describe('isBlockedAddress', () => {
  it.each([
    '10.0.0.5',
    '172.16.3.4',
    '172.31.255.255',
    '192.168.1.1',
    '127.0.0.1',
    '169.254.169.254',
    '100.64.0.1',
    '0.0.0.0',
    '224.0.0.1',
    '255.255.255.255',
    '::1',
    '::',
    'fc00::1',
    'fd12:3456::1',
    'fe80::1',
    'ff02::1',
    '::ffff:127.0.0.1',
    '::ffff:10.1.2.3',
    '::ffff:7f00:1',
    '192.0.2.10',
    '198.51.100.7',
    '203.0.113.9',
    '2001:db8::1',
    '2002:a00:1::1',
    '2001:0:4136:e378::1',
    'not-an-ip',
  ])('blocks %s', (address) => {
    expect(isBlockedAddress(address)).toBe(true);
  });

  it.each([
    '200.45.12.3',
    '8.8.8.8',
    '172.32.0.1',
    '2800:3f0:4002::200e',
    '::ffff:8.8.8.8',
  ])('lets %s through', (address) => {
    expect(isBlockedAddress(address)).toBe(false);
  });
});
