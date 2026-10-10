import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PointLedger } from '../src/modules/ranking/point-ledger';
import { rebuildPoints } from '../src/modules/ranking/rebuild-points';
import type { PrismaService } from '../src/prisma/prisma.service';
import { createE2eApp, createUser } from './support/e2e-app';

/** Nivel máximo alcanzado (openspec reputation/points, Levels). */
describe('nivel máximo alcanzado (e2e)', () => {
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

  const award = (userId: string, amount: number) => {
    const referenceId = randomUUID();
    return prisma.$transaction(async (tx) => {
      await ledger.award(tx, {
        userId,
        reason: 'MATERIAL_PUBLISHED',
        referenceId,
        amount,
      });
      return referenceId;
    });
  };

  const revert = (referenceId: string) =>
    prisma.$transaction((tx) =>
      ledger.revert(tx, { reason: 'MATERIAL_PUBLISHED', referenceId }),
    );

  const levels = (userId: string) =>
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { level: true, maxLevel: true },
    });

  it('rises with the nivel', async () => {
    const user = await createUser(prisma);
    await award(user.id, 100);

    expect(await levels(user.id)).toEqual({ level: 3, maxLevel: 3 });
  });

  it('stays when a reversal lowers the nivel', async () => {
    const user = await createUser(prisma);
    await award(user.id, 400);
    const material = await award(user.id, 100);
    expect(await levels(user.id)).toEqual({ level: 5, maxLevel: 5 });

    await revert(material);

    expect(await levels(user.id)).toEqual({ level: 4, maxLevel: 5 });
  });

  it('stays when a sanctioned account loses points', async () => {
    const user = await createUser(prisma);
    const material = await award(user.id, 500);
    await prisma.user.update({
      where: { id: user.id },
      data: { isMuted: true, mutedUntil: new Date(Date.now() + 86_400_000) },
    });

    await revert(material);

    expect(await levels(user.id)).toEqual({ level: 1, maxLevel: 5 });
  });

  it('is set to the rebuilt nivel by rebuild-points', async () => {
    const user = await createUser(prisma, 'USER', {
      points: 2000,
      level: 7,
      maxLevel: 7,
    });

    await rebuildPoints(prisma, { userIds: [user.id], apply: true });

    expect(await levels(user.id)).toEqual({ level: 1, maxLevel: 1 });
  });
});
