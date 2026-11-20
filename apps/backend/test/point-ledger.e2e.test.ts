import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PointReason } from '../src/generated/prisma';
import { PointLedger } from '../src/modules/ranking/point-ledger';
import type { PrismaService } from '../src/prisma/prisma.service';
import { createE2eApp, createUser } from './support/e2e-app';

/** The ledger against the database: idempotency and reversals (openspec reputation/points). */
describe('PointLedger (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let ledger: PointLedger;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    ledger = app.get(PointLedger);
  });

  afterAll(async () => {
    await app.close();
  });

  const award = (
    userId: string,
    referenceId: string,
    amount = 10,
    reason: PointReason = 'MATERIAL_PUBLISHED',
  ) =>
    prisma.$transaction((tx) =>
      ledger.award(tx, { userId, reason, referenceId, amount }),
    );
  const revert = (
    referenceId: string,
    reason: PointReason = 'MATERIAL_PUBLISHED',
  ) => prisma.$transaction((tx) => ledger.revert(tx, { reason, referenceId }));

  async function account(userId: string) {
    const [user, movements] = await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { points: true, level: true },
      }),
      prisma.pointTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      }),
    ]);
    return { ...user, movements };
  }

  it('records an award once, even when it is retried', async () => {
    const user = await createUser(prisma);
    const ref = randomUUID();

    expect(await award(user.id, ref)).toBe(true);
    expect(await award(user.id, ref)).toBe(false);

    const { points, movements } = await account(user.id);
    expect(points).toBe(10);
    expect(movements).toHaveLength(1);
    expect(movements[0]).toEqual(
      expect.objectContaining({
        reason: 'MATERIAL_PUBLISHED',
        amount: 10,
        referenceId: ref,
        idempotencyKey: `MATERIAL_PUBLISHED:${ref}:0`,
        reversesId: null,
      }),
    );
  });

  it('records a reversal as a linked negative movement, once', async () => {
    const user = await createUser(prisma);
    const ref = randomUUID();
    await award(user.id, ref);

    expect(await revert(ref)).toBe(true);
    expect(await revert(ref)).toBe(false);

    const { points, movements } = await account(user.id);
    expect(points).toBe(0);
    expect(movements).toHaveLength(2);
    expect(movements[1]).toEqual(
      expect.objectContaining({
        amount: -10,
        reason: 'MATERIAL_PUBLISHED',
        referenceId: ref,
        reversesId: movements[0].id,
      }),
    );
  });

  it('awards again after a reversal with a new key, so a restoration earns its points', async () => {
    const user = await createUser(prisma);
    const ref = randomUUID();
    await award(user.id, ref);
    await revert(ref);

    expect(await award(user.id, ref)).toBe(true);
    expect(await award(user.id, ref)).toBe(false);

    const { points, movements } = await account(user.id);
    expect(points).toBe(10);
    expect(movements.map((m) => m.idempotencyKey)).toEqual([
      `MATERIAL_PUBLISHED:${ref}:0`,
      `reversal:${movements[0].id}`,
      `MATERIAL_PUBLISHED:${ref}:1`,
    ]);
  });

  it('keeps the total equal to the sum of movements and the level in step', async () => {
    const user = await createUser(prisma);
    const refs = [randomUUID(), randomUUID(), randomUUID()];
    for (const ref of refs) await award(user.id, ref);
    expect(await account(user.id)).toEqual(
      expect.objectContaining({ points: 30, level: 2 }),
    );

    await revert(refs[0]);
    const { points, level, movements } = await account(user.id);
    expect(points).toBe(movements.reduce((sum, m) => sum + m.amount, 0));
    expect(points).toBe(20);
    expect(level).toBe(1);
  });

  it('reverts every active award whose reference starts with a prefix', async () => {
    const user = await createUser(prisma);
    const material = randomUUID();
    for (const giver of [randomUUID(), randomUUID()]) {
      await award(user.id, `${material}:${giver}`, 1, 'HELPFUL_RECEIVED');
    }
    await award(
      user.id,
      `${randomUUID()}:${randomUUID()}`,
      1,
      'HELPFUL_RECEIVED',
    );

    const reverted = await prisma.$transaction((tx) =>
      ledger.revertMatching(tx, {
        reason: 'HELPFUL_RECEIVED',
        referencePrefix: `${material}:`,
      }),
    );

    expect(reverted).toBe(2);
    expect((await account(user.id)).points).toBe(1);
  });

  it('never lets concurrent retries record the same award twice', async () => {
    const user = await createUser(prisma);
    const ref = randomUUID();

    const results = await Promise.all(
      Array.from({ length: 5 }, () => award(user.id, ref)),
    );

    expect(results.filter(Boolean)).toHaveLength(1);
    expect((await account(user.id)).points).toBe(10);
  });

  describe('while the account has a sanción', () => {
    const inDays = (days: number) => new Date(Date.now() + days * 86_400_000);

    it('earns nothing while silenced, and nothing is kept for later', async () => {
      const user = await createUser(prisma, 'USER', {
        isMuted: true,
        mutedUntil: inDays(3),
      });

      expect(await award(user.id, randomUUID())).toBe(false);

      await prisma.user.update({
        where: { id: user.id },
        data: { isMuted: false, mutedUntil: null },
      });
      expect(await account(user.id)).toEqual(
        expect.objectContaining({ points: 0, movements: [] }),
      );
    });

    it('earns nothing while suspended', async () => {
      const user = await createUser(prisma, 'USER', {
        isBanned: true,
        bannedUntil: inDays(30),
      });

      expect(await award(user.id, randomUUID())).toBe(false);
    });

    it('earns again once a silenciamiento has ended', async () => {
      const user = await createUser(prisma, 'USER', {
        isMuted: true,
        mutedUntil: inDays(-1),
      });

      expect(await award(user.id, randomUUID())).toBe(true);
    });

    it('still gets back the points of an accepted appeal', async () => {
      const user = await createUser(prisma, 'USER', {
        isMuted: true,
        mutedUntil: inDays(3),
      });

      const awarded = await prisma.$transaction((tx) =>
        ledger.award(tx, {
          userId: user.id,
          reason: 'MATERIAL_PUBLISHED',
          referenceId: randomUUID(),
          amount: 10,
          appeal: true,
        }),
      );

      expect(awarded).toBe(true);
      expect((await account(user.id)).points).toBe(10);
    });
  });
});
