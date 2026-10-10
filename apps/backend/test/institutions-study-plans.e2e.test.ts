import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  FI_UNJU_FACULTY_ID,
  UNJU_UNIVERSITY_ID,
} from '../src/modules/institutions/institutions.constants';
import { BadgeService } from '../src/modules/ranking/badges/badge.service';
import type { PrismaService } from '../src/prisma/prisma.service';
import {
  bearer,
  createE2eApp,
  createSubject,
  createUser,
  type E2eUser,
} from './support/e2e-app';

type DeclaredPlanBody = {
  studyPlanId: string;
  status: string;
  faculty: { id: string };
};

/** Declared study plans (openspec academic-structure/institutions). */
describe('/users/me/study-plans (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let badges: BadgeService;

  const tag = randomUUID().slice(0, 6);
  const otherUniversity = randomUUID();
  const otherFaculty = randomUUID();
  const careerIds: string[] = [];
  let fiPlan: string;
  let fiOtherPlan: string;
  let foreignPlan: string;

  async function career(facultyId: string, name: string) {
    const created = await prisma.career.create({
      data: {
        facultyId,
        name: `${name} ${tag}`,
        code: `C${randomUUID().slice(0, 8)}`,
        studyPlans: {
          create: [{ name: 'Plan 2023', code: 'P2023', duration: 5 }],
        },
      },
      select: { id: true, studyPlans: { select: { id: true } } },
    });
    careerIds.push(created.id);
    return created.studyPlans[0].id;
  }

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    badges = app.get(BadgeService);
    await prisma.university.create({
      data: {
        id: otherUniversity,
        name: `Universidad e2e ${tag}`,
        shortName: `U${tag}`,
      },
    });
    await prisma.faculty.create({
      data: {
        id: otherFaculty,
        universityId: otherUniversity,
        name: 'Facultad de Humanidades',
        shortName: 'FH',
      },
    });
    fiPlan = await career(FI_UNJU_FACULTY_ID, 'Informática');
    fiOtherPlan = await career(FI_UNJU_FACULTY_ID, 'Industrial');
    foreignPlan = await career(otherFaculty, 'Letras');
  });

  afterAll(async () => {
    await prisma.userStudyPlan.deleteMany({
      where: { studyPlan: { careerId: { in: careerIds } } },
    });
    await prisma.studyPlan.deleteMany({
      where: { careerId: { in: careerIds } },
    });
    await prisma.career.deleteMany({ where: { id: { in: careerIds } } });
    await prisma.faculty.delete({ where: { id: otherFaculty } });
    await prisma.university.delete({ where: { id: otherUniversity } });
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const read = (user: E2eUser) =>
    http()
      .get('/api/v1/users/me/study-plans')
      .set('Authorization', bearer(app, user));
  const replace = (user: E2eUser, plans: unknown[]) =>
    http()
      .put('/api/v1/users/me/study-plans')
      .set('Authorization', bearer(app, user))
      .send({ plans });

  it('starts empty and returns each declared plan with its full path', async () => {
    const student = await createUser(prisma);
    expect((await read(student).expect(200)).body).toEqual([]);

    const { body } = await replace(student, [
      { studyPlanId: fiPlan, status: 'ACTIVE' },
    ]).expect(200);

    expect(body).toEqual([
      {
        studyPlanId: fiPlan,
        status: 'ACTIVE',
        studyPlan: { id: fiPlan, name: 'Plan 2023', code: 'P2023' },
        career: expect.objectContaining({ name: `Informática ${tag}` }),
        faculty: {
          id: FI_UNJU_FACULTY_ID,
          name: 'Facultad de Ingeniería',
          shortName: 'FI',
        },
        university: {
          id: UNJU_UNIVERSITY_ID,
          name: 'Universidad Nacional de Jujuy',
          shortName: 'UNJU',
        },
      },
    ]);
    expect((await read(student).expect(200)).body).toEqual(body);
  });

  it('replaces the whole list and allows plans of different facultades', async () => {
    const student = await createUser(prisma);
    await replace(student, [{ studyPlanId: fiPlan, status: 'ACTIVE' }]).expect(
      200,
    );

    const { body } = await replace(student, [
      { studyPlanId: fiPlan, status: 'COMPLETED' },
      { studyPlanId: foreignPlan, status: 'ACTIVE' },
    ]).expect(200);

    expect(
      (body as DeclaredPlanBody[]).map(
        (p: {
          studyPlanId: string;
          status: string;
          faculty: { id: string };
        }) => [p.studyPlanId, p.status, p.faculty.id],
      ),
    ).toEqual(
      expect.arrayContaining([
        [fiPlan, 'COMPLETED', FI_UNJU_FACULTY_ID],
        [foreignPlan, 'ACTIVE', otherFaculty],
      ]),
    );
    expect(body).toHaveLength(2);

    await replace(student, [
      { studyPlanId: fiOtherPlan, status: 'DROPPED' },
    ]).expect(200);
    const rows = await prisma.userStudyPlan.findMany({
      where: { userId: student.id },
      select: { studyPlanId: true, status: true },
    });
    expect(rows).toEqual([{ studyPlanId: fiOtherPlan, status: 'DROPPED' }]);
  });

  it('rejects duplicates and unknown plans, keeping the previous list', async () => {
    const student = await createUser(prisma);
    await replace(student, [{ studyPlanId: fiPlan, status: 'ACTIVE' }]).expect(
      200,
    );

    const duplicate = await replace(student, [
      { studyPlanId: fiOtherPlan, status: 'ACTIVE' },
      { studyPlanId: fiOtherPlan, status: 'COMPLETED' },
    ]).expect(400);
    expect(duplicate.body.code).toBe('DUPLICATE_STUDY_PLAN');
    const unknown = await replace(student, [
      { studyPlanId: randomUUID(), status: 'ACTIVE' },
    ]).expect(400);
    expect(unknown.body.code).toBe('UNKNOWN_STUDY_PLAN');
    await replace(student, [
      { studyPlanId: fiPlan, status: 'GRADUATED' },
    ]).expect(400);

    const { body } = await read(student).expect(200);
    expect(
      (body as DeclaredPlanBody[]).map((p) => [p.studyPlanId, p.status]),
    ).toEqual([[fiPlan, 'ACTIVE']]);
  });

  it('accepts 10 plans and rejects an 11th by validation', async () => {
    const career = await prisma.career.create({
      data: {
        facultyId: FI_UNJU_FACULTY_ID,
        name: `Muchos planes ${tag}`,
        code: `M${randomUUID().slice(0, 8)}`,
        studyPlans: {
          create: Array.from({ length: 11 }, (_, i) => ({
            name: `Plan ${i}`,
            code: `P${i}`,
            duration: 5,
          })),
        },
      },
      select: { id: true, studyPlans: { select: { id: true } } },
    });
    careerIds.push(career.id);
    const choices = career.studyPlans.map(({ id }) => ({
      studyPlanId: id,
      status: 'ACTIVE',
    }));
    const student = await createUser(prisma);

    const ten = await replace(student, choices.slice(0, 10)).expect(200);
    expect(ten.body).toHaveLength(10);

    const eleven = await replace(student, choices).expect(400);
    expect(JSON.stringify(eleven.body.message)).toMatch(/10/);
    expect(
      await prisma.userStudyPlan.count({ where: { userId: student.id } }),
    ).toBe(10);
  });

  it('answers a concurrent save of the same list without a server error', async () => {
    const student = await createUser(prisma);
    const plans = [{ studyPlanId: fiPlan, status: 'ACTIVE' }];

    const responses = await Promise.all([
      replace(student, plans),
      replace(student, plans),
      replace(student, plans),
    ]);

    for (const response of responses) {
      expect([200, 409]).toContain(response.status);
    }
    expect(
      await prisma.userStudyPlan.count({ where: { userId: student.id } }),
    ).toBe(1);
  });

  it('requires a session', async () => {
    await http().get('/api/v1/users/me/study-plans').expect(401);
    await http()
      .put('/api/v1/users/me/study-plans')
      .send({ plans: [] })
      .expect(401);
  });

  it('never exposes declared plans on the public profile', async () => {
    const student = await createUser(prisma);
    await replace(student, [{ studyPlanId: fiPlan, status: 'ACTIVE' }]).expect(
      200,
    );
    const viewer = await createUser(prisma);

    const { body } = await http()
      .get(`/api/v1/users/${student.id}`)
      .set('Authorization', bearer(app, viewer))
      .expect(200);

    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain(fiPlan);
    expect(serialized).not.toContain(`Informática ${tag}`);
    expect(body).not.toHaveProperty('studyPlans');
  });

  it('drops a removed plan from the carreras behind Puente', async () => {
    const author = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
    const material = await prisma.material.create({
      data: {
        title: 'Resumen',
        fileUrl: '/x.pdf',
        fileType: 'pdf',
        fileSize: 10,
        authorId: author.id,
        subjectId,
        resourceType: 'RESUMEN',
      },
      select: { id: true },
    });
    const givers: E2eUser[] = [];
    for (const plan of [fiPlan, fiOtherPlan, foreignPlan]) {
      const giver = await createUser(prisma);
      await replace(giver, [{ studyPlanId: plan, status: 'ACTIVE' }]).expect(
        200,
      );
      await prisma.materialHelpfulness.create({
        data: { userId: giver.id, materialId: material.id },
      });
      givers.push(giver);
    }
    const holdsPuente = async () => {
      await badges.evaluate(author.id);
      const held = await prisma.userBadge.findMany({
        where: { userId: author.id, badge: { slug: 'puente' } },
      });
      return held.length > 0;
    };

    expect(await holdsPuente()).toBe(true);

    await replace(givers[2], []).expect(200);

    expect(await holdsPuente()).toBe(false);
  });
});
