import { Logger } from '@nestjs/common';
import { inspect } from 'node:util';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { AuthService } from './auth.service';
import type { PasswordHasher } from './password-hasher';

const EMAIL = 'alguien@devsproject.test';
const LEVELS = ['log', 'debug', 'verbose', 'warn', 'error', 'fatal'] as const;

/** Every logger call, at any level, rendered with nested error fields. */
function captureLogs() {
  const lines: string[] = [];
  const calls: unknown[][] = [];
  for (const level of LEVELS) {
    vi.spyOn(Logger.prototype, level).mockImplementation(
      (...args: unknown[]) => {
        calls.push([level, ...args]);
        lines.push(args.map((arg) => inspect(arg, { depth: 5 })).join(' '));
      },
    );
  }
  return { calls, text: () => lines.join('\n') };
}

/** Like the error nodemailer gives when the server refuses the recipient. */
function smtpRefusal() {
  return Object.assign(
    new Error(`Can't send mail - all recipients were rejected: 550 <${EMAIL}>`),
    {
      code: 'EENVELOPE',
      responseCode: 550,
      response: `550 5.1.1 <${EMAIL}>: Recipient address rejected`,
      rejected: [EMAIL],
    },
  );
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

function prismaDouble() {
  return {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    emailVerification: { create: vi.fn() },
    passwordResetRequest: { deleteMany: vi.fn(), create: vi.fn() },
    refreshToken: { create: vi.fn() },
  };
}

describe('authentication logs hold no email addresses', () => {
  let logs: ReturnType<typeof captureLogs>;
  let prisma: ReturnType<typeof prismaDouble>;
  let mail: {
    sendPasswordResetEmail: ReturnType<typeof vi.fn>;
    sendVerificationEmail: ReturnType<typeof vi.fn>;
  };
  let auth: AuthService;

  beforeEach(() => {
    logs = captureLogs();
    prisma = prismaDouble();
    mail = {
      sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
      sendVerificationEmail: vi.fn().mockResolvedValue(undefined),
    };
    const hasher = { hash: vi.fn().mockResolvedValue('$2b$12$hash') };
    auth = new AuthService(
      prisma as unknown as PrismaService,
      { sign: vi.fn().mockReturnValue('jwt') } as never,
      {} as never,
      mail as unknown as MailService,
      hasher as unknown as PasswordHasher,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('records a recovery request for an unknown email without the address', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await auth.requestPasswordReset(EMAIL);

    // One object: pino keeps its fields, and drops extra arguments.
    expect(logs.calls).toContainEqual([
      'debug',
      { msg: 'Solicitud de recuperación', accountFound: false },
    ]);
    expect(logs.text()).not.toContain(EMAIL);
  });

  it('records a recovery request for an existing account without the address', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: EMAIL,
      username: 'alguien',
    });

    await auth.requestPasswordReset(EMAIL);
    await flush();

    expect(logs.calls).toContainEqual([
      'debug',
      { msg: 'Solicitud de recuperación', accountFound: true },
    ]);
    expect(logs.text()).not.toContain(EMAIL);
  });

  it('logs a failed recovery email without its recipient', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: EMAIL,
      username: 'alguien',
    });
    mail.sendPasswordResetEmail.mockRejectedValue(smtpRefusal());

    await auth.requestPasswordReset(EMAIL);
    await flush();

    const errors = logs.calls.filter(([level]) => level === 'error');
    expect(errors).toEqual([
      [
        'error',
        {
          msg: 'Error enviando email de reset',
          mailError: { name: 'Error', code: 'EENVELOPE', responseCode: 550 },
        },
      ],
    ]);
    expect(logs.text()).not.toContain(EMAIL);
  });

  it('logs a failed verification email without its recipient', async () => {
    prisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ id: 'u1', email: EMAIL, username: 'alguien' });
    prisma.user.create.mockResolvedValue({
      id: 'u1',
      email: EMAIL,
      username: 'alguien',
      role: 'USER',
    });
    mail.sendVerificationEmail.mockRejectedValue(smtpRefusal());

    await auth.register({
      username: 'alguien',
      email: EMAIL,
      password: 'Clave123!',
    });
    await flush();

    const errors = logs.calls.filter(([level]) => level === 'error');
    expect(errors).toEqual([
      [
        'error',
        {
          msg: 'Error enviando email de verificación',
          mailError: { name: 'Error', code: 'EENVELOPE', responseCode: 550 },
        },
      ],
    ]);
    expect(logs.text()).not.toContain(EMAIL);
  });

  it('the development mail sink hides the recipient but keeps the links', async () => {
    const config = {
      get: vi.fn((key: string, fallback?: unknown) =>
        key === 'app.nodeEnv' ? 'development' : fallback,
      ),
    };
    const service = new MailService(config as never);

    await service.sendPasswordResetEmail(EMAIL, 'alguien', 'token-123');

    expect(logs.text()).toContain('<destinatario oculto>');
    expect(logs.text()).toContain('token=token-123');
    expect(logs.text()).not.toContain(EMAIL);
  });
});
