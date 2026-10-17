import type { NestExpressApplication } from '@nestjs/platform-express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PrismaService } from '../src/prisma/prisma.service';
import { correctionFixtures } from './support/corrections-fixtures';
import {
  bearer,
  createE2eApp,
  createUser,
  type E2eUser,
} from './support/e2e-app';

/** Suggestions close on their own (openspec academic-resources/corrections). */
describe('correction suggestions close on their own (e2e)', () => {
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

  const authorList = async (user: E2eUser) =>
    (
      await f
        .http()
        .get('/api/v1/users/me/correction-suggestions')
        .set('Authorization', bearer(app, user))
        .expect(200)
    ).body as { id: string }[];

  const moderationList = async (user: E2eUser) =>
    (
      await f
        .http()
        .get('/api/v1/moderation/corrections')
        .set('Authorization', bearer(app, user))
        .expect(200)
    ).body as { id: string }[];

  const authorDecide = (user: E2eUser, id: string) =>
    f
      .http()
      .post(`/api/v1/correction-suggestions/${id}/accept`)
      .set('Authorization', bearer(app, user));

  const stored = (id: string) =>
    prisma.correctionSuggestion.findUniqueOrThrow({ where: { id } });

  async function setup(field = 'RESOURCE_TYPE', proposedValue = 'PARCIAL') {
    const author = await createUser(prisma);
    const student = await f.privileged();
    const material = await f.material(author.id);
    const { body } = await f
      .suggest(student, material.id, { field, proposedValue })
      .expect(201);
    return { author, student, material, id: (body as { id: string }).id };
  }

  it('closes when the author changes the field, and appears nowhere', async () => {
    const { author, material, id } = await setup();
    const moderator = await createUser(prisma, 'MODERATOR');

    await f
      .http()
      .patch(`/api/v1/materials/${material.id}`)
      .set('Authorization', bearer(app, author))
      .send({ resourceType: 'APUNTE' })
      .expect(200);

    expect(await stored(id)).toMatchObject({
      status: 'CLOSED',
      closedReason: 'FIELD_CHANGED',
    });
    expect((await authorList(author)).map((row) => row.id)).not.toContain(id);
    await f.age(id, 8);
    expect(
      (await moderationList(moderator)).map((row) => row.id),
    ).not.toContain(id);
  });

  it('refuses a decision on a suggestion whose field changed behind its back', async () => {
    const { author, material, id } = await setup();
    // Changed directly, as a script would: nothing closed it yet.
    await prisma.material.update({
      where: { id: material.id },
      data: { resourceType: 'APUNTE' },
    });

    await authorDecide(author, id).expect(409);

    expect(await stored(id)).toMatchObject({
      status: 'CLOSED',
      closedReason: 'FIELD_CHANGED',
    });
  });

  it('closes when the material is deleted or retired', async () => {
    const deleted = await setup();
    await f
      .http()
      .delete(`/api/v1/materials/${deleted.material.id}`)
      .set('Authorization', bearer(app, deleted.author))
      .expect(200);
    expect(await stored(deleted.id)).toMatchObject({
      status: 'CLOSED',
      closedReason: 'MATERIAL_GONE',
    });

    const retired = await setup();
    await prisma.material.update({
      where: { id: retired.material.id },
      data: { publicationStatus: 'REMOVED' },
    });
    await authorDecide(retired.author, retired.id).expect(409);
    expect(await stored(retired.id)).toMatchObject({
      status: 'CLOSED',
      closedReason: 'MATERIAL_GONE',
    });
  });

  it('waits, without closing, while the material is hidden for review', async () => {
    const { author, material, id } = await setup();
    await prisma.material.update({
      where: { id: material.id },
      data: { publicationStatus: 'HIDDEN' },
    });

    expect(await authorList(author)).toEqual([]);
    await authorDecide(author, id).expect(409);
    expect((await stored(id)).status).toBe('OPEN');

    await prisma.material.update({
      where: { id: material.id },
      data: { publicationStatus: 'PUBLISHED' },
    });
    expect((await authorList(author)).map((row) => row.id)).toEqual([id]);
  });

  it('closes when moderation retires the material', async () => {
    const { material, id } = await setup();
    const moderator = await createUser(prisma, 'MODERATOR');
    const caso = await prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'MATERIAL',
        materialId: material.id,
        targetAuthorId: material.authorId,
      },
    });

    await f
      .http()
      .post(`/api/v1/moderation/cases/${caso.id}/decision`)
      .set('Authorization', bearer(app, moderator))
      .send({ decision: 'REMOVE', reason: 'No es un final de la materia.' })
      .expect(201);

    expect(await stored(id)).toMatchObject({
      status: 'CLOSED',
      closedReason: 'MATERIAL_GONE',
    });
  });

  it('caps correction points at 10 a week', async () => {
    const author = await createUser(prisma);
    const student = await f.privileged();
    for (let i = 0; i < 6; i += 1) {
      const material = await f.material(author.id);
      const { body } = await f
        .suggest(student, material.id, {
          field: 'RESOURCE_TYPE',
          proposedValue: 'PARCIAL',
        })
        .expect(201);
      await authorDecide(author, (body as { id: string }).id).expect(200);
    }

    const { _sum } = await prisma.pointTransaction.aggregate({
      where: { userId: student.id, reason: 'CORRECTION_ACCEPTED' },
      _sum: { amount: true },
    });
    expect(_sum.amount).toBe(10);
  });

  it('accepts the suggestion of a now-sanctioned student without points', async () => {
    const { author, student, id } = await setup();
    await prisma.user.update({
      where: { id: student.id },
      data: { isMuted: true, mutedUntil: new Date(Date.now() + 86_400_000) },
    });

    await authorDecide(author, id).expect(200);

    expect((await stored(id)).status).toBe('ACCEPTED');
    expect(
      await prisma.pointTransaction.count({
        where: { userId: student.id, reason: 'CORRECTION_ACCEPTED' },
      }),
    ).toBe(0);
  });
});
