import { UnauthorizedException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../prisma/prisma.service';
import type { MailService } from '../mail/mail.service';
import type { LoginAttempts } from '../rate-limit/login-attempts';
import type { AppealsService } from '../moderation/appeals.service';
import { SuspensionAppealController } from '../moderation/suspension-appeal.controller';
import { AuthService } from './auth.service';
import type { PasswordHasher } from './password-hasher';

function doubles() {
  const prisma = { user: { findUnique: vi.fn() } };
  const hasher = { verify: vi.fn(), hash: vi.fn() };
  return { prisma, hasher };
}

describe('credential checks for an unknown email', () => {
  let prisma: ReturnType<typeof doubles>['prisma'];
  let hasher: ReturnType<typeof doubles>['hasher'];

  beforeEach(() => {
    ({ prisma, hasher } = doubles());
    prisma.user.findUnique.mockResolvedValue(null);
    hasher.verify.mockResolvedValue(false);
  });

  it('sign-in still compares the password, against the stand-in hash', async () => {
    const auth = new AuthService(
      prisma as unknown as PrismaService,
      {} as never,
      {} as never,
      {} as MailService,
      hasher as unknown as PasswordHasher,
    );

    await expect(auth.validateUser('nadie@x.test', 'Clave1!')).resolves.toBe(
      null,
    );
    expect(hasher.verify).toHaveBeenCalledExactlyOnceWith('Clave1!', null);
  });

  it('sign-in compares a known account against its own hash', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      passwordHash: '$2b$12$hash',
    });
    const auth = new AuthService(
      prisma as unknown as PrismaService,
      {} as never,
      {} as never,
      {} as MailService,
      hasher as unknown as PasswordHasher,
    );

    await expect(auth.validateUser('a@x.test', 'Mala1!')).resolves.toBe(null);
    expect(hasher.verify).toHaveBeenCalledExactlyOnceWith(
      'Mala1!',
      '$2b$12$hash',
    );
  });

  it('the suspension appeal still compares the password and gives the sign-in refusal', async () => {
    const appeals = { file: vi.fn() };
    const loginAttempts = { forgiveClient: vi.fn() };
    const controller = new SuspensionAppealController(
      prisma as unknown as PrismaService,
      appeals as unknown as AppealsService,
      loginAttempts as unknown as LoginAttempts,
      hasher as unknown as PasswordHasher,
    );

    const attempt = controller.appeal(
      { email: 'nadie@x.test', password: 'Clave1!', explanation: 'No fui yo.' },
      { ip: '10.0.0.1' },
    );

    await expect(attempt).rejects.toThrow(
      new UnauthorizedException('Credenciales inválidas'),
    );
    expect(hasher.verify).toHaveBeenCalledExactlyOnceWith('Clave1!', null);
    expect(loginAttempts.forgiveClient).not.toHaveBeenCalled();
    expect(appeals.file).not.toHaveBeenCalled();
  });
});
