import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from '../../prisma/prisma.service';
import { AccountStatusService } from './account-status.service';

const NOW = new Date('2026-09-30T12:00:00.000Z');
const inDays = (days: number) =>
  new Date(NOW.getTime() + days * 24 * 3_600_000);

describe('AccountStatusService.assertCanContribute', () => {
  const prisma = { user: { findUnique: vi.fn() } };
  let service: AccountStatusService;

  beforeEach(async () => {
    vi.useFakeTimers().setSystemTime(NOW);
    const moduleRef = await Test.createTestingModule({
      providers: [
        AccountStatusService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(AccountStatusService);
  });

  const account = (status: Record<string, unknown>) =>
    prisma.user.findUnique.mockResolvedValue({
      isBanned: false,
      bannedUntil: null,
      mutedUntil: null,
      ...status,
    });

  async function refusal() {
    const error = await service
      .assertCanContribute('user-1')
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ForbiddenException);
    return (error as ForbiddenException).getResponse();
  }

  it('lets an account without sanciones contribute', async () => {
    account({});

    await expect(
      service.assertCanContribute('user-1'),
    ).resolves.toBeUndefined();
  });

  it('refuses a silenced account with its end date', async () => {
    account({ mutedUntil: inDays(3) });

    expect(await refusal()).toEqual(
      expect.objectContaining({
        code: 'ACCOUNT_MUTED',
        until: inDays(3).toISOString(),
      }),
    );
  });

  it('lets the account contribute again once the silenciamiento is over', async () => {
    account({ mutedUntil: inDays(-1) });

    await expect(
      service.assertCanContribute('user-1'),
    ).resolves.toBeUndefined();
  });

  it('refuses a suspended account, permanent or temporary', async () => {
    account({ isBanned: true, bannedUntil: null });
    expect(await refusal()).toEqual(
      expect.objectContaining({ code: 'ACCOUNT_SUSPENDED', until: null }),
    );

    account({ isBanned: true, bannedUntil: inDays(10) });
    expect(await refusal()).toEqual(
      expect.objectContaining({
        code: 'ACCOUNT_SUSPENDED',
        until: inDays(10).toISOString(),
      }),
    );
  });

  it('lets a temporary suspensión end on its own', async () => {
    account({ isBanned: true, bannedUntil: inDays(-1) });

    await expect(
      service.assertCanContribute('user-1'),
    ).resolves.toBeUndefined();
  });
});
