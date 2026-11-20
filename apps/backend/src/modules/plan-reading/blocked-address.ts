import { BlockList, isIP } from 'node:net';

/**
 * Addresses the plan fetcher never connects to (openspec
 * academic-structure/plan-reading, «Reading only safe sources»): private,
 * loopback, link-local, CGNAT, multicast, reserved, documentation,
 * tunnelling and unspecified ranges.
 */
const blocked = new BlockList();
for (const [network, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
] as const) {
  blocked.addSubnet(network, prefix, 'ipv4');
}
for (const [network, prefix] of [
  ['::', 128],
  ['::1', 128],
  ['64:ff9b::', 96],
  // Teredo and 6to4 tunnel to IPv4 addresses that are not checked here.
  ['2001::', 32],
  ['2002::', 16],
  ['2001:db8::', 32],
  ['fc00::', 7],
  ['fe80::', 10],
  ['ff00::', 8],
] as const) {
  blocked.addSubnet(network, prefix, 'ipv6');
}

const MAPPED_V4 = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i;

export function isBlockedAddress(address: string): boolean {
  const mapped = MAPPED_V4.exec(address);
  if (mapped) return isBlockedAddress(mapped[1]);
  const family = isIP(address);
  if (family === 0) return true;
  return blocked.check(address, family === 4 ? 'ipv4' : 'ipv6');
}
