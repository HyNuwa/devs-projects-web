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

type ListedUser = { id: string; eligible?: boolean };

const DAY = 86_400_000;

/**
 * Elegible para moderar and role changes (openspec reputation/trust-privileges,
 * moderation/sanctions «Usuarios tab»).
 */
describe('eligibility to moderate and role changes (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  /** Nivel 6, a year old, 10 accepted corrections, no sanciones. */
  async function eligibleStudent(extra: Record<string, unknown> = {}) {
    const user = await createUser(prisma, 'USER', {
      maxLevel: 6,
      level: 6,
      createdAt: new Date(Date.now() - 365 * DAY),
      ...extra,
    });
    const author = await createUser(prisma);
    const { id: subjectId } = await prisma.subject.findFirstOrThrow({
      select: { id: true },
    });
    for (let i = 0; i < 10; i += 1) {
      const material = await prisma.material.create({
        data: {
          title: `M${i}`,
          fileUrl: 'https://x',
          fileType: 'pdf',
          fileSize: BigInt(1),
          authorId: author.id,
          subjectId,
          resourceType: 'FINAL',
        },
      });
      await prisma.correctionSuggestion.create({
        data: {
          materialId: material.id,
          suggesterId: user.id,
          field: 'RESOURCE_TYPE',
          currentValue: 'FINAL',
          proposedValue: 'PARCIAL',
          status: 'ACCEPTED',
          decidedBy: 'AUTHOR',
          decidedAt: new Date(),
        },
      });
    }
    return user;
  }

  const listEligible = (viewer: E2eUser) =>
    http()
      .get('/api/v1/moderation/users?filter=eligible')
      .set('Authorization', bearer(app, viewer));

  const file = async (viewer: E2eUser, id: string) =>
    (
      await http()
        .get(`/api/v1/moderation/users/${id}`)
        .set('Authorization', bearer(app, viewer))
        .expect(200)
    ).body as { eligible?: boolean; canPromote?: boolean };

  it('shows eligible accounts to an admin, with the mark', async () => {
    const admin = await createUser(prisma, 'ADMIN');
    const eligible = await eligibleStudent();
    const tooNew = await eligibleStudent({
      createdAt: new Date(Date.now() - 30 * DAY),
    });

    const { body } = await listEligible(admin).expect(200);
    const users = (body as { users: ListedUser[] }).users;

    expect(users.find((user) => user.id === eligible.id)?.eligible).toBe(true);
    expect(users.some((user) => user.id === tooNew.id)).toBe(false);
    expect(await file(admin, eligible.id)).toMatchObject({
      eligible: true,
      canPromote: true,
    });
    expect((await file(admin, tooNew.id)).eligible).toBe(false);
  });

  it('never shows eligibility to a moderator', async () => {
    const moderator = await createUser(prisma, 'MODERATOR');
    const eligible = await eligibleStudent();

    await listEligible(moderator).expect(403);
    const body = await file(moderator, eligible.id);
    expect(body).not.toHaveProperty('eligible');
    expect(body).not.toHaveProperty('canPromote');
    const { body: suggested } = await http()
      .get('/api/v1/moderation/users')
      .set('Authorization', bearer(app, moderator))
      .expect(200);
    expect(JSON.stringify(suggested)).not.toContain('"eligible"');
  });

  it('loses eligibility with a recent sanción', async () => {
    const admin = await createUser(prisma, 'ADMIN');
    const student = await eligibleStudent();
    await prisma.sanction.create({
      data: {
        userId: student.id,
        type: 'MUTE',
        reason: 'Insultos',
        startsAt: new Date(Date.now() - 20 * DAY),
        endsAt: new Date(Date.now() - 13 * DAY),
        appliedById: admin.id,
      },
    });

    expect((await file(admin, student.id)).eligible).toBe(false);
  });

  it('promotes only a USER to MODERATOR, for admins, and records it', async () => {
    const admin = await createUser(prisma, 'ADMIN');
    const moderator = await createUser(prisma, 'MODERATOR');
    const student = await eligibleStudent();

    await http()
      .post(`/api/v1/moderation/users/${student.id}/promote`)
      .set('Authorization', bearer(app, moderator))
      .expect(403);
    await http()
      .post(`/api/v1/moderation/users/${student.id}/promote`)
      .set('Authorization', bearer(app, admin))
      .expect(200);
    await http()
      .post(`/api/v1/moderation/users/${moderator.id}/promote`)
      .set('Authorization', bearer(app, admin))
      .expect(409);

    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: student.id } })).role,
    ).toBe('MODERATOR');
    expect(
      await prisma.moderationEvent.count({
        where: {
          action: 'ROLE_CHANGED',
          targetUserId: student.id,
          actorId: admin.id,
        },
      }),
    ).toBe(1);
  });

  it('shows role changes in Historial to admins only, with the roles', async () => {
    const admin = await createUser(prisma, 'ADMIN');
    const moderator = await createUser(prisma, 'MODERATOR');
    const student = await eligibleStudent();
    await http()
      .post(`/api/v1/moderation/users/${student.id}/promote`)
      .set('Authorization', bearer(app, admin))
      .expect(200);
    const history = (viewer: E2eUser) =>
      http()
        .get('/api/v1/moderation/history?action=ROLE_CHANGED')
        .set('Authorization', bearer(app, viewer))
        .expect(200);

    const { body } = await history(admin);
    const items = (body as { items: Array<Record<string, unknown>> }).items;
    const { username } = await prisma.user.findUniqueOrThrow({
      where: { id: student.id },
      select: { username: true },
    });
    expect(
      items.find(
        (item) =>
          (item.targetUser as { username: string } | null)?.username ===
          username,
      ),
    ).toMatchObject({
      action: 'ROLE_CHANGED',
      roleChange: { from: 'USER', to: 'MODERATOR' },
    });

    const { body: hidden } = await history(moderator);
    expect((hidden as { items: unknown[] }).items).toEqual([]);
    const { body: all } = await http()
      .get('/api/v1/moderation/history')
      .set('Authorization', bearer(app, moderator))
      .expect(200);
    expect(JSON.stringify(all)).not.toContain('ROLE_CHANGED');
  });

  describe('PATCH /admin/users/:id/role', () => {
    const change = (actor: E2eUser, id: string, role: unknown) =>
      http()
        .patch(`/api/v1/admin/users/${id}/role`)
        .set('Authorization', bearer(app, actor))
        .send({ role });

    it('rejects an unknown role', async () => {
      const superadmin = await createUser(prisma, 'SUPERADMIN');
      const user = await createUser(prisma);

      await change(superadmin, user.id, 'EMPERADOR').expect(400);
    });

    it('lets only a SUPERADMIN grant or remove ADMIN and SUPERADMIN', async () => {
      const admin = await createUser(prisma, 'ADMIN');
      const superadmin = await createUser(prisma, 'SUPERADMIN');
      const user = await createUser(prisma);
      const otherAdmin = await createUser(prisma, 'ADMIN');

      await change(admin, user.id, 'SUPERADMIN').expect(403);
      await change(admin, user.id, 'ADMIN').expect(403);
      await change(admin, otherAdmin.id, 'USER').expect(403);
      await change(admin, user.id, 'MODERATOR').expect(200);
      await change(superadmin, user.id, 'ADMIN').expect(200);

      expect(
        (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).role,
      ).toBe('ADMIN');
    });

    it('records nothing when the role does not change', async () => {
      const superadmin = await createUser(prisma, 'SUPERADMIN');
      const user = await createUser(prisma);

      await change(superadmin, user.id, 'USER').expect(200);

      expect(
        await prisma.moderationEvent.count({
          where: { action: 'ROLE_CHANGED', targetUserId: user.id },
        }),
      ).toBe(0);
    });

    it('refuses changing one’s own role', async () => {
      const superadmin = await createUser(prisma, 'SUPERADMIN');

      await change(superadmin, superadmin.id, 'USER').expect(403);
    });
  });
});
