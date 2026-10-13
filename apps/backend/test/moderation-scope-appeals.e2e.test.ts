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

type Listed = { id: string; canAnswer: boolean };

/** Apelaciones go to someone covering their facultad (openspec moderation/appeals, moderation/scope). */
describe('Appeals within the alcance de moderación (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());

  const tag = randomUUID().slice(0, 6).toUpperCase();
  let universityId: string;
  const faculties: Record<'A' | 'B', string> = { A: '', B: '' };
  const subjects: Record<'A' | 'B', string> = { A: '', B: '' };
  let decider: E2eUser; // the only moderator covering A at first
  let modB: E2eUser;
  let admin: E2eUser;
  let retiroAppeal: string;
  let usuariosAppeal: string;
  const users: string[] = [];

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    ({ id: universityId } = await prisma.university.create({
      data: { name: `Universidad apelaciones ${tag}`, shortName: `UP${tag}` },
      select: { id: true },
    }));
    for (const key of ['A', 'B'] as const) {
      faculties[key] = (
        await prisma.faculty.create({
          data: {
            universityId,
            name: `Facultad ${key} ${tag}`,
            shortName: `F${key}`,
          },
          select: { id: true },
        })
      ).id;
      subjects[key] = (
        await prisma.subject.create({
          data: { facultyId: faculties[key], name: `Materia ${key} ${tag}` },
          select: { id: true },
        })
      ).id;
    }
    const career = await prisma.career.create({
      data: {
        facultyId: faculties.A,
        name: `Carrera ${tag}`,
        code: 'CA',
        studyPlans: { create: [{ name: 'Plan', code: 'P', duration: 5 }] },
      },
      select: { studyPlans: { select: { id: true } } },
    });

    decider = await createUser(
      prisma,
      'MODERATOR',
      {},
      { faculties: [faculties.A] },
    );
    modB = await createUser(
      prisma,
      'MODERATOR',
      {},
      { faculties: [faculties.B] },
    );
    admin = await createUser(prisma, 'ADMIN');
    const author = await createUser(prisma);
    const silenced = await createUser(prisma);
    users.push(author.id, silenced.id);
    await prisma.userStudyPlan.create({
      data: { userId: silenced.id, studyPlanId: career.studyPlans[0].id },
    });

    const material = await prisma.material.create({
      data: {
        title: 'Retirado',
        fileUrl: 'https://drive.example.com/appeals-scope',
        fileType: 'pdf',
        fileSize: 10,
        authorId: author.id,
        subjectId: subjects.A,
        resourceType: 'PARCIAL',
        publicationStatus: 'REMOVED',
      },
      select: { id: true },
    });
    const retiro = await prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'MATERIAL',
        materialId: material.id,
        targetAuthorId: author.id,
        status: 'CLOSED',
        decision: 'REMOVE',
        decidedById: decider.id,
        closedAt: new Date(),
      },
      select: { id: true },
    });
    retiroAppeal = (
      await prisma.appeal.create({
        data: {
          appellantId: author.id,
          kind: 'RETIRO',
          caseId: retiro.id,
          explanation: 'No correspondía.',
          decidedById: decider.id,
        },
        select: { id: true },
      })
    ).id;

    // A silenciamiento from Usuarios (no caso) of an account with a carrera in A.
    const mute = await prisma.sanction.create({
      data: {
        userId: silenced.id,
        type: 'MUTE',
        reason: 'Spam.',
        appliedById: decider.id,
        endsAt: new Date(Date.now() + 7 * 86_400_000),
      },
      select: { id: true },
    });
    usuariosAppeal = (
      await prisma.appeal.create({
        data: {
          appellantId: silenced.id,
          kind: 'SANCTION',
          sanctionId: mute.id,
          explanation: 'Fue un error.',
          decidedById: decider.id,
        },
        select: { id: true },
      })
    ).id;
  });

  afterAll(async () => {
    await prisma.appeal.deleteMany({ where: { appellantId: { in: users } } });
    await prisma.sanction.deleteMany({ where: { userId: { in: users } } });
    await prisma.moderationCase.deleteMany({
      where: { material: { subjectId: { in: Object.values(subjects) } } },
    });
    await prisma.material.deleteMany({
      where: { subjectId: { in: Object.values(subjects) } },
    });
    await prisma.subject.deleteMany({
      where: { id: { in: Object.values(subjects) } },
    });
    await prisma.userStudyPlan.deleteMany({ where: { userId: { in: users } } });
    await prisma.career.deleteMany({ where: { facultyId: faculties.A } });
    await prisma.moderatorScope.deleteMany({
      where: { facultyId: { in: Object.values(faculties) } },
    });
    await prisma.faculty.deleteMany({ where: { universityId } });
    await prisma.university.delete({ where: { id: universityId } });
    await app.close();
  });

  const list = async (user: E2eUser) =>
    (
      await http()
        .get('/api/v1/moderation/appeals')
        .set('Authorization', bearer(app, user))
        .expect(200)
    ).body as Listed[];
  const find = async (user: E2eUser, id: string) =>
    (await list(user)).find((row) => row.id === id);

  it('hides an appeal from a moderator of another facultad', async () => {
    expect(await find(modB, retiroAppeal)).toBeUndefined();
    await http()
      .get(`/api/v1/moderation/appeals/${retiroAppeal}`)
      .set('Authorization', bearer(app, modB))
      .expect(404);
    await http()
      .post(`/api/v1/moderation/appeals/${retiroAppeal}/answer`)
      .set('Authorization', bearer(app, modB))
      .send({ accept: false, answer: 'Se mantiene.' })
      .expect(404);
  });

  it('waits for an admin when only the decider covers the facultad', async () => {
    expect((await find(decider, retiroAppeal))?.canAnswer ?? false).toBe(false);
    expect((await find(admin, retiroAppeal))?.canAnswer).toBe(true);
  });

  it('lets a second moderator covering the facultad answer', async () => {
    const second = await createUser(
      prisma,
      'MODERATOR',
      {},
      { faculties: [faculties.A] },
    );
    expect((await find(second, retiroAppeal))?.canAnswer).toBe(true);
  });

  it('follows the account for an appeal of a sanción from Usuarios', async () => {
    const second = await createUser(
      prisma,
      'MODERATOR',
      {},
      { faculties: [faculties.A] },
    );
    expect((await find(second, usuariosAppeal))?.canAnswer).toBe(true);
    expect(await find(modB, usuariosAppeal)).toBeUndefined();
  });
});
