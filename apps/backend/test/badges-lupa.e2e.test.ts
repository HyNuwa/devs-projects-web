import type { NestExpressApplication } from '@nestjs/platform-express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { BadgeService } from '../src/modules/ranking/badges/badge.service';
import type { PrismaService } from '../src/prisma/prisma.service';
import { correctionFixtures } from './support/corrections-fixtures';
import { createE2eApp, createUser } from './support/e2e-app';

/** Lupa (openspec reputation/badges, «Insignia catalog»). */
describe('Lupa (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let badges: BadgeService;
  let f: ReturnType<typeof correctionFixtures>;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    badges = app.get(BadgeService);
    f = correctionFixtures(app, prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  async function accepted(suggesterId: string, count: number) {
    const author = await createUser(prisma);
    const materials: { id: string }[] = [];
    for (let i = 0; i < count; i += 1) {
      const material = await f.material(author.id);
      await prisma.correctionSuggestion.create({
        data: {
          materialId: material.id,
          suggesterId,
          field: 'RESOURCE_TYPE',
          currentValue: 'FINAL',
          proposedValue: 'PARCIAL',
          status: 'ACCEPTED',
          decidedBy: 'AUTHOR',
          decidedAt: new Date(),
        },
      });
      materials.push(material);
    }
    return materials;
  }

  const holdsLupa = async (userId: string) =>
    (await badges.evaluate(userId)).some(
      (state) => state.slug === 'lupa' && state.earned.length > 0,
    );

  it('is earned with the tenth accepted correction', async () => {
    const student = await f.privileged();
    await accepted(student.id, 9);
    expect(await holdsLupa(student.id)).toBe(false);

    await accepted(student.id, 1);
    expect(await holdsLupa(student.id)).toBe(true);
  });

  it('is kept when one of those materials is retired later', async () => {
    const student = await f.privileged();
    const [first] = await accepted(student.id, 10);
    await prisma.material.update({
      where: { id: first.id },
      data: { publicationStatus: 'REMOVED' },
    });

    expect(await holdsLupa(student.id)).toBe(true);
  });
});
