import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  createE2eApp,
  createUser,
  type E2eUser,
} from './support/e2e-app';

describe('sanction endpoints (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let moderator: E2eUser;
  let admin: E2eUser;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    moderator = await createUser(prisma, 'MODERATOR');
    admin = await createUser(prisma, 'ADMIN');
  });

  afterAll(async () => {
    await app.close();
  });

  const post = (path: string, actor: E2eUser, body: object) =>
    request(app.getHttpServer())
      .post(`/api/v1/moderation${path}`)
      .set('Authorization', bearer(app, actor))
      .send(body);

  it('lets a moderator warn a student', async () => {
    const student = await createUser(prisma);

    await post(`/users/${student.id}/warn`, moderator, {
      reason: 'Insultos en una reseña.',
    }).expect(201);

    expect(
      await prisma.sanction.count({
        where: { userId: student.id, type: 'WARNING' },
      }),
    ).toBe(1);
  });

  it('lets a moderator silence a student for 7 days and lift it', async () => {
    const student = await createUser(prisma);

    await post(`/users/${student.id}/mute`, moderator, {
      reason: 'Segundo retiro en 90 días.',
    }).expect(201);
    const muted = await prisma.user.findUniqueOrThrow({
      where: { id: student.id },
    });
    expect(muted.mutedUntil!.getTime()).toBeGreaterThan(
      Date.now() + 6.9 * 24 * 3_600_000,
    );

    await post(`/users/${student.id}/unmute`, moderator, {
      reason: 'Se aclaró.',
    }).expect(201);
    const unmuted = await prisma.user.findUniqueOrThrow({
      where: { id: student.id },
    });
    expect(unmuted.mutedUntil).toBeNull();
  });

  it('refuses a moderator silencing another moderator', async () => {
    const otherModerator = await createUser(prisma, 'MODERATOR');

    await post(`/users/${otherModerator.id}/mute`, moderator, {
      reason: 'x',
    }).expect(403);
  });

  it('refuses students using the sanction endpoints', async () => {
    const student = await createUser(prisma);
    const other = await createUser(prisma);

    await post(`/users/${other.id}/warn`, student, { reason: 'x' }).expect(403);
  });

  it('refuses a sanción without a reason', async () => {
    const student = await createUser(prisma);

    await post(`/users/${student.id}/warn`, moderator, { reason: '' }).expect(
      400,
    );
  });

  it('keeps suspending for admins: a moderator proposes, only an admin confirms', async () => {
    const student = await createUser(prisma);

    const proposed = await post(
      `/users/${student.id}/suspension-proposals`,
      moderator,
      { reason: 'Tercer retiro en 90 días.', duration: '30_DAYS' },
    ).expect(201);
    const proposalId = (proposed.body as { id: string }).id;

    await post(`/suspension-proposals/${proposalId}/confirm`, moderator, {
      reason: 'Ok',
    }).expect(403);
    await post(`/users/${student.id}/suspend`, moderator, {
      reason: 'x',
      duration: 'PERMANENT',
    }).expect(403);

    await post(`/suspension-proposals/${proposalId}/confirm`, admin, {
      reason: 'Reincidencia confirmada.',
    }).expect(201);
    const suspended = await prisma.user.findUniqueOrThrow({
      where: { id: student.id },
    });
    expect(suspended.isBanned).toBe(true);
    expect(suspended.bannedUntil!.getTime()).toBeGreaterThan(
      Date.now() + 29 * 24 * 3_600_000,
    );
  });

  it('lets an admin reject a proposal with a reason', async () => {
    const student = await createUser(prisma);
    const proposed = await post(
      `/users/${student.id}/suspension-proposals`,
      moderator,
      { reason: 'Spam', duration: '7_DAYS' },
    ).expect(201);

    await post(
      `/suspension-proposals/${(proposed.body as { id: string }).id}/reject`,
      admin,
      { reason: 'No alcanza.' },
    ).expect(201);

    const student_ = await prisma.user.findUniqueOrThrow({
      where: { id: student.id },
    });
    expect(student_.isBanned).toBe(false);
  });

  it('lets an admin suspend directly, permanently, and lift it', async () => {
    const student = await createUser(prisma);

    await post(`/users/${student.id}/suspend`, admin, {
      reason: 'Cuenta falsa.',
      duration: 'PERMANENT',
      retireContributions: true,
    }).expect(201);
    const suspended = await prisma.user.findUniqueOrThrow({
      where: { id: student.id },
    });
    expect(suspended.isBanned).toBe(true);
    expect(suspended.bannedUntil).toBeNull();

    await post(`/users/${student.id}/lift-suspension`, admin, {
      reason: 'Era una cuenta real.',
    }).expect(201);
  });

  it('refuses an unknown duration', async () => {
    const student = await createUser(prisma);

    await post(`/users/${student.id}/suspension-proposals`, moderator, {
      reason: 'x',
      duration: '12_DAYS',
    }).expect(400);
  });
});
