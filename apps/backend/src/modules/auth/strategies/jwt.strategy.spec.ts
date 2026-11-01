import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

describe('JWT current account', () => {
  const db = { user: { findUnique: jest.fn() } };
  const strategy = new JwtStrategy(
    new ConfigService({ jwt: { secret: 'test-secret' } }),
    db as unknown as PrismaService,
  );
  it('does not trust a stale ADMIN claim', async () => {
    db.user.findUnique.mockResolvedValue({
      id: 1,
      role: 'USER',
      email: 'test@example.com',
      isBanned: false,
    });
    await expect(
      strategy.validate({ sub: 1, role: 'ADMIN', email: 'old@example.com' }),
    ).resolves.toMatchObject({ role: 'USER', email: 'test@example.com' });
  });
  it('rejects missing and actively suspended accounts', async () => {
    db.user.findUnique.mockResolvedValue(null);
    await expect(
      strategy.validate({ sub: 1, role: 'USER', email: '' }),
    ).rejects.toThrow();
    db.user.findUnique.mockResolvedValue({
      id: 1,
      isBanned: true,
      bannedUntil: null,
    });
    await expect(
      strategy.validate({ sub: 1, role: 'USER', email: '' }),
    ).rejects.toThrow();
  });
});
