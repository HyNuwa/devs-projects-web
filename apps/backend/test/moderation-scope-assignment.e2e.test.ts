import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  createE2eApp,
  createUser,
  type E2eUser,
} from './support/e2e-app';

/** Assigning facultades to moderators (openspec moderation/scope, «Assigning facultades»). */
describe('Moderator facultades (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());

  const tag = randomUUID().slice(0, 6).toUpperCase();
  let universityId: string;
  let facultyA: string;
  let facultyB: string;
  let admin: E2eUser;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    ({ id: universityId } = await prisma.university.create({
      data: { name: `Universidad asignación ${tag}`, shortName: `UZ${tag}` },
      select: { id: true },
    }));
    facultyA = (
      await prisma.faculty.create({
        data: { universityId, name: `Facultad A ${tag}`, shortName: 'FA' },
        select: { id: true },
      })
    ).id;
    facultyB = (
      await prisma.faculty.create({
        data: { universityId, name: `Facultad B ${tag}`, shortName: 'FB' },
        select: { id: true },
      })
    ).id;
    admin = await createUser(prisma, 'ADMIN');
  });

  afterAll(async () => {
    await prisma.moderatorScope.deleteMany({
      where: { facultyId: { in: [facultyA, facultyB] } },
    });
    await prisma.faculty.deleteMany({ where: { universityId } });
    await prisma.university.delete({ where: { id: universityId } });
    await app.close();
  });

  const facultiesOf = async (userId: string) =>
    (
      await prisma.moderatorScope.findMany({
        where: { userId },
        select: { facultyId: true },
      })
    )
      .map((row) => row.facultyId)
      .sort();
  const roleOf = async (userId: string) =>
    (await prisma.user.findUniqueOrThrow({ where: { id: userId } })).role;
  const promote = (actor: E2eUser, userId: string, body: object) =>
    http()
      .post(`/api/v1/moderation/users/${userId}/promote`)
      .set('Authorization', bearer(app, actor))
      .send(body);
  const changeRole = (userId: string, body: object) =>
    http()
      .patch(`/api/v1/admin/users/${userId}/role`)
      .set('Authorization', bearer(app, admin))
      .send(body);
  const setFaculties = (actor: E2eUser, userId: string, facultyIds: string[]) =>
    http()
      .put(`/api/v1/moderation/users/${userId}/faculties`)
      .set('Authorization', bearer(app, actor))
      .send({ facultyIds });

  it('refuses promoting without facultades, keeping the account a student', async () => {
    const student = await createUser(prisma);
    await promote(admin, student.id, {}).expect(400);
    await promote(admin, student.id, { facultyIds: [] }).expect(400);
    await promote(admin, student.id, { facultyIds: [randomUUID()] }).expect(
      400,
    );
    expect(await roleOf(student.id)).toBe('USER');
    expect(await facultiesOf(student.id)).toEqual([]);
  });

  it('promotes with facultades and records the role and the facultades', async () => {
    const student = await createUser(prisma);
    await promote(admin, student.id, { facultyIds: [facultyA] }).expect(200);
    expect(await roleOf(student.id)).toBe('MODERATOR');
    expect(await facultiesOf(student.id)).toEqual([facultyA]);
    const scopeEvent = await prisma.moderationEvent.findFirstOrThrow({
      where: { action: 'MODERATOR_SCOPE_CHANGED', targetUserId: student.id },
    });
    expect(scopeEvent).toMatchObject({
      actorId: admin.id,
      metadata: { before: [], after: [facultyA] },
    });
    expect(
      await prisma.moderationEvent.count({
        where: { action: 'ROLE_CHANGED', targetUserId: student.id },
      }),
    ).toBe(1);
  });

  it('requires facultades when the admin route makes a moderator, and clears them on demotion', async () => {
    const student = await createUser(prisma);
    await changeRole(student.id, { role: 'MODERATOR' }).expect(400);
    expect(await roleOf(student.id)).toBe('USER');

    await changeRole(student.id, {
      role: 'MODERATOR',
      facultyIds: [facultyB],
    }).expect(200);
    expect(await facultiesOf(student.id)).toEqual([facultyB]);

    await changeRole(student.id, { role: 'USER' }).expect(200);
    expect(await facultiesOf(student.id)).toEqual([]);
    const last = await prisma.moderationEvent.findFirstOrThrow({
      where: { action: 'MODERATOR_SCOPE_CHANGED', targetUserId: student.id },
      orderBy: { createdAt: 'desc' },
    });
    expect(last.metadata).toEqual({ before: [facultyB], after: [] });

    await promote(admin, student.id, { facultyIds: [facultyA] }).expect(200);
    expect(await facultiesOf(student.id)).toEqual([facultyA]);
  });

  it('replaces a moderator facultades, for admins only', async () => {
    const moderator = await createUser(
      prisma,
      'MODERATOR',
      {},
      { faculties: [facultyA] },
    );
    const other = await createUser(
      prisma,
      'MODERATOR',
      {},
      { faculties: [facultyA] },
    );

    await setFaculties(other, moderator.id, [facultyB]).expect(403);
    await setFaculties(admin, moderator.id, [facultyA, facultyB]).expect(200);
    expect(await facultiesOf(moderator.id)).toEqual(
      [facultyA, facultyB].sort(),
    );
    const event = await prisma.moderationEvent.findFirstOrThrow({
      where: { action: 'MODERATOR_SCOPE_CHANGED', targetUserId: moderator.id },
    });
    expect(event.metadata).toEqual({
      before: [facultyA],
      after: [facultyA, facultyB].sort(),
    });

    const student = await createUser(prisma);
    await setFaculties(admin, student.id, [facultyA]).expect(409);
  });

  it('shows admins, in the account file, the facultades covered and those of its carreras', async () => {
    const career = await prisma.career.create({
      data: {
        status: 'PUBLISHED',
        facultyId: facultyB,
        name: `Carrera ${tag}`,
        code: 'CB',
        studyPlans: { create: [{ name: 'Plan', code: 'P', duration: 5 }] },
      },
      select: { studyPlans: { select: { id: true } } },
    });
    const student = await createUser(prisma);
    await prisma.userStudyPlan.create({
      data: { userId: student.id, studyPlanId: career.studyPlans[0].id },
    });
    const file = (viewer: E2eUser, id: string) =>
      http()
        .get(`/api/v1/moderation/users/${id}`)
        .set('Authorization', bearer(app, viewer))
        .expect(200);

    const studentFile = (await file(admin, student.id)).body;
    expect(studentFile.careerFacultyIds).toEqual([facultyB]);
    expect(studentFile.moderatorFaculties).toBeNull();

    const moderator = await createUser(
      prisma,
      'MODERATOR',
      {},
      { faculties: [facultyA] },
    );
    const moderatorFile = (await file(admin, moderator.id)).body;
    expect(moderatorFile.moderatorFaculties).toEqual([
      {
        id: facultyA,
        name: `Facultad A ${tag}`,
        shortName: 'FA',
        university: { shortName: `UZ${tag}` },
      },
    ]);

    // A moderator never sees these fields.
    const peer = await createUser(
      prisma,
      'MODERATOR',
      {},
      { faculties: [facultyB] },
    );
    const seen = (await file(peer, student.id)).body;
    expect(seen).not.toHaveProperty('careerFacultyIds');
    expect(seen).not.toHaveProperty('moderatorFaculties');

    await prisma.userStudyPlan.deleteMany({ where: { userId: student.id } });
    await prisma.career.deleteMany({ where: { facultyId: facultyB } });
  });

  it('tells each viewer their scope in the summary', async () => {
    const moderator = await createUser(
      prisma,
      'MODERATOR',
      {},
      { faculties: [facultyB] },
    );
    const mine = await http()
      .get('/api/v1/moderation/summary')
      .set('Authorization', bearer(app, moderator))
      .expect(200);
    expect(mine.body.scope).toEqual({
      all: false,
      faculties: [
        {
          id: facultyB,
          name: `Facultad B ${tag}`,
          shortName: 'FB',
          university: { shortName: `UZ${tag}` },
        },
      ],
    });
    const theirs = await http()
      .get('/api/v1/moderation/summary')
      .set('Authorization', bearer(app, admin))
      .expect(200);
    expect(theirs.body.scope).toEqual({ all: true, faculties: [] });
  });
});
