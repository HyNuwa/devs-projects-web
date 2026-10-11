import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PioneerBonus } from '../src/modules/ranking/pioneer-bonus';
import { rebuildPoints } from '../src/modules/ranking/rebuild-points';
import type { PrismaService } from '../src/prisma/prisma.service';
import { correctionFixtures } from './support/corrections-fixtures';
import {
  bearer,
  createE2eApp,
  createUser,
  type E2eUser,
} from './support/e2e-app';

type Listed = {
  id: string;
  field: string;
  current: string;
  proposed: string;
  comment: string | null;
  suggester?: string;
};

/** The author decides first (openspec academic-resources/corrections). */
describe('correction suggestions: the author decides (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let f: ReturnType<typeof correctionFixtures>;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    f = correctionFixtures(app, prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  const list = async (user: E2eUser) =>
    (
      await f
        .http()
        .get('/api/v1/users/me/correction-suggestions')
        .set('Authorization', bearer(app, user))
        .expect(200)
    ).body as Listed[];

  const decide = (user: E2eUser, id: string, action: 'accept' | 'reject') =>
    f
      .http()
      .post(`/api/v1/correction-suggestions/${id}/${action}`)
      .set('Authorization', bearer(app, user));

  async function suggested(field = 'RESOURCE_TYPE', proposedValue = 'PARCIAL') {
    const author = await createUser(prisma);
    const student = await f.privileged();
    const material = await f.material(author.id);
    const { body } = await f
      .suggest(student, material.id, {
        field,
        proposedValue,
        comment: 'Es un parcial.',
      })
      .expect(201);
    return { author, student, material, id: (body as { id: string }).id };
  }

  const points = (userId: string) =>
    prisma.pointTransaction.aggregate({
      where: { userId, reason: 'CORRECTION_ACCEPTED' },
      _sum: { amount: true },
    });

  it('lists the open suggestions with labels and without who made them', async () => {
    const { author, id } = await suggested();

    const rows = await list(author);

    expect(rows).toEqual([
      expect.objectContaining({
        id,
        field: 'RESOURCE_TYPE',
        current: 'Final',
        proposed: 'Parcial',
        comment: 'Es un parcial.',
      }),
    ]);
    expect(rows[0]).not.toHaveProperty('suggester');
    expect(JSON.stringify(rows)).not.toMatch(/suggesterId|username/);
  });

  it('applies the change and awards 2 points when the author accepts', async () => {
    const { author, student, material, id } = await suggested();

    await decide(author, id, 'accept').expect(200);

    expect(
      (await prisma.material.findUniqueOrThrow({ where: { id: material.id } }))
        .resourceType,
    ).toBe('PARCIAL');
    expect((await points(student.id))._sum.amount).toBe(2);
    expect(
      await prisma.correctionSuggestion.findUniqueOrThrow({ where: { id } }),
    ).toMatchObject({
      status: 'ACCEPTED',
      decidedBy: 'AUTHOR',
      closedReason: null,
    });
    expect(await list(author)).toEqual([]);
  });

  it('reverts and re-evaluates the pioneer bonus when the tipo changes', async () => {
    const author = await createUser(prisma);
    const student = await f.privileged();
    const material = await f.material(author.id);
    const tag = randomUUID().slice(0, 6);
    for (let i = 0; i < 3; i += 1) {
      const giver = await prisma.user.create({
        data: {
          username: `pg_${tag}_${i}`,
          email: `pg_${tag}_${i}@devsproject.test`,
          passwordHash: 'x',
          emailVerified: true,
        },
      });
      await prisma.materialHelpfulness.create({
        data: { userId: giver.id, materialId: material.id },
      });
    }
    const pioneer = app.get(PioneerBonus);
    await prisma.$transaction((tx) => pioneer.evaluate(tx, material.id));
    const { body } = await f
      .suggest(student, material.id, {
        field: 'RESOURCE_TYPE',
        proposedValue: 'PARCIAL',
      })
      .expect(201);

    await decide(author, (body as { id: string }).id, 'accept').expect(200);

    const movements = await prisma.pointTransaction.findMany({
      where: { userId: author.id, reason: 'MATERIAL_PIONEER' },
      select: { amount: true, referenceId: true },
    });
    expect(movements.filter((m) => m.amount < 0)).toHaveLength(1);
    // Still the first parcial of its materia: the bonus is earned again there.
    expect(
      movements.some((m) => m.amount > 0 && m.referenceId?.includes('PARCIAL')),
    ).toBe(true);
  });

  it('moves the materia and drops a profesor who does not teach the new one', async () => {
    const author = await createUser(prisma);
    const student = await f.privileged();
    const material = await f.material(author.id);
    const professor = await f.professorOf(material.subjectId);
    await prisma.material.update({
      where: { id: material.id },
      data: { professorId: professor.id },
    });
    const target = await f.material(author.id);
    const { body } = await f
      .suggest(student, material.id, {
        field: 'SUBJECT',
        proposedValue: target.subjectId,
      })
      .expect(201);

    await decide(author, (body as { id: string }).id, 'accept').expect(200);

    expect(
      await prisma.material.findUniqueOrThrow({
        where: { id: material.id },
        select: { subjectId: true, professorId: true },
      }),
    ).toEqual({ subjectId: target.subjectId, professorId: null });
  });

  it('closes the suggestion when the author rejects it', async () => {
    const { author, student, material, id } = await suggested();

    await decide(author, id, 'reject').expect(200);

    expect(
      await prisma.correctionSuggestion.findUniqueOrThrow({ where: { id } }),
    ).toMatchObject({ status: 'REJECTED', decidedBy: 'AUTHOR' });
    expect(
      (await prisma.material.findUniqueOrThrow({ where: { id: material.id } }))
        .resourceType,
    ).toBe('FINAL');
    expect((await points(student.id))._sum.amount).toBeNull();
  });

  it('hands the decision to moderation after 7 days', async () => {
    const { author, id } = await suggested();
    await f.age(id, 8);

    expect(await list(author)).toEqual([]);
    await decide(author, id, 'accept').expect(409);
  });

  it('lets only the author decide', async () => {
    const { student, id } = await suggested();
    const stranger = await createUser(prisma);

    await decide(stranger, id, 'accept').expect(404);
    await decide(student, id, 'accept').expect(404);
  });

  it('keeps correction points when points are rebuilt', async () => {
    const { author, student, id } = await suggested();
    await decide(author, id, 'accept').expect(200);

    await rebuildPoints(prisma, { userIds: [student.id], apply: true });

    expect((await points(student.id))._sum.amount).toBe(2);
  });
});
