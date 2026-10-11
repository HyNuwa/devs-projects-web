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

type Listed = { id: string; suggester: string; createdAt: string };

/** Moderation decides after 7 days (openspec academic-resources/corrections). */
describe('correction suggestions: moderation decides (e2e)', () => {
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
        .get('/api/v1/moderation/corrections')
        .set('Authorization', bearer(app, user))
        .expect(200)
    ).body as Listed[];

  const decide = (user: E2eUser, id: string, action: 'accept' | 'reject') =>
    f
      .http()
      .post(`/api/v1/moderation/corrections/${id}/${action}`)
      .set('Authorization', bearer(app, user));

  async function suggestion(
    options: { authorId?: string; suggester?: E2eUser; days?: number } = {},
  ) {
    const authorId = options.authorId ?? (await createUser(prisma)).id;
    const student = options.suggester ?? (await f.privileged());
    const material = await f.material(authorId);
    const { body } = await f
      .suggest(student, material.id, {
        field: 'RESOURCE_TYPE',
        proposedValue: 'PARCIAL',
      })
      .expect(201);
    const id = (body as { id: string }).id;
    if (options.days !== undefined) await f.age(id, options.days);
    return { id, student, material };
  }

  it('lists only suggestions past the author phase, oldest first; only admins see who suggested', async () => {
    const moderator = await createUser(prisma, 'MODERATOR');
    const admin = await createUser(prisma, 'ADMIN');
    const recent = await suggestion();
    const older = await suggestion({ days: 12 });
    const old = await suggestion({ days: 8 });

    const rows = await list(moderator);
    const ids = rows.map((row) => row.id);

    expect(ids).not.toContain(recent.id);
    expect(ids.indexOf(older.id)).toBeLessThan(ids.indexOf(old.id));
    // A suggestion proves good standing on its date: moderators never see who.
    expect(rows.every((row) => !('suggester' in row))).toBe(true);
    const { username } = await prisma.user.findUniqueOrThrow({
      where: { id: old.student.id },
      select: { username: true },
    });
    const adminRows = await list(admin);
    expect(adminRows.find((row) => row.id === old.id)?.suggester).toBe(
      username,
    );
  });

  it('never offers a moderator their own suggestion or material', async () => {
    const moderator = await createUser(prisma, 'MODERATOR', { maxLevel: 3 });
    const own = await suggestion({ suggester: moderator, days: 8 });
    const onMine = await suggestion({ authorId: moderator.id, days: 8 });

    const ids = (await list(moderator)).map((row) => row.id);

    expect(ids).not.toContain(own.id);
    expect(ids).not.toContain(onMine.id);
    await decide(moderator, own.id, 'accept').expect(403);
    await decide(moderator, onMine.id, 'reject').expect(403);
  });

  it('accepts with points, and rejects without them', async () => {
    const moderator = await createUser(prisma, 'MODERATOR');
    const accepted = await suggestion({ days: 8 });
    const rejected = await suggestion({ days: 8 });

    await decide(moderator, accepted.id, 'accept').expect(200);
    await decide(moderator, rejected.id, 'reject').expect(200);

    expect(
      await prisma.correctionSuggestion.findUniqueOrThrow({
        where: { id: accepted.id },
      }),
    ).toMatchObject({
      status: 'ACCEPTED',
      decidedBy: 'MODERATION',
      decidedById: moderator.id,
    });
    expect(
      (
        await prisma.material.findUniqueOrThrow({
          where: { id: accepted.material.id },
        })
      ).resourceType,
    ).toBe('PARCIAL');
    const earned = await prisma.pointTransaction.findMany({
      where: {
        userId: { in: [accepted.student.id, rejected.student.id] },
        reason: 'CORRECTION_ACCEPTED',
      },
      select: { userId: true, amount: true },
    });
    expect(earned).toEqual([{ userId: accepted.student.id, amount: 2 }]);
  });

  it('counts the corrections waiting for moderation in the panel summary', async () => {
    const moderator = await createUser(prisma, 'MODERATOR');
    const before = await f
      .http()
      .get('/api/v1/moderation/summary')
      .set('Authorization', bearer(app, moderator))
      .expect(200);
    await suggestion({ days: 9 });
    await suggestion();

    const { body } = await f
      .http()
      .get('/api/v1/moderation/summary')
      .set('Authorization', bearer(app, moderator))
      .expect(200);

    expect((body as { pendingCorrections: number }).pendingCorrections).toBe(
      (before.body as { pendingCorrections: number }).pendingCorrections + 1,
    );
  });

  it('waits while the author can still decide', async () => {
    const moderator = await createUser(prisma, 'MODERATOR');
    const { id } = await suggestion();

    await decide(moderator, id, 'accept').expect(409);
  });

  it('is only for moderation', async () => {
    const student = await createUser(prisma);
    const { id } = await suggestion({ days: 8 });

    await f
      .http()
      .get('/api/v1/moderation/corrections')
      .set('Authorization', bearer(app, student))
      .expect(403);
    await decide(student, id, 'accept').expect(403);
  });
});
