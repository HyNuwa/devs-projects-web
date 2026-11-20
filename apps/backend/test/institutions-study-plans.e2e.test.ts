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

type DeclaredCareerBody = {
  careerId: string;
  status: string;
  faculty: { id: string };
};

/** Declared carreras (openspec academic-structure/institutions, ADR 0003). */
describe('/users/me/study-plans (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let badges: BadgeService;

  const tag = randomUUID().slice(0, 6);
  const otherUniversity = randomUUID();
  const otherFaculty = randomUUID();
  const careerIds: string[] = [];
  let fiCareer: string;
  let fiOtherCareer: string;
  let foreignCareer: string;

  async function career(facultyId: string, name: string, plan = true) {
    const created = await prisma.career.create({
      data: {
        status: 'PUBLISHED',
        facultyId,
        name: `${name} ${tag}`,
        code: `C${randomUUID().slice(0, 8)}`,
        ...(plan && {
          studyPlans: {
            create: [{ name: 'Plan 2023', code: 'P2023', duration: 5 }],
          },
        }),
      },
      select: { id: true },
    });
    careerIds.push(created.id);
    return created.id;
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
    fiCareer = await career(FI_UNJU_FACULTY_ID, 'Informática');
    fiOtherCareer = await career(FI_UNJU_FACULTY_ID, 'Industrial');
    foreignCareer = await career(otherFaculty, 'Letras');
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
  const replace = (user: E2eUser, careers: unknown[]) =>
    http()
      .put('/api/v1/users/me/study-plans')
      .set('Authorization', bearer(app, user))
      .send({ careers });

  it('starts empty and returns each declared carrera with its path and no plan', async () => {
    const student = await createUser(prisma);
    expect((await read(student).expect(200)).body).toEqual([]);

    const { body } = await replace(student, [
      { careerId: fiCareer, status: 'ACTIVE' },
    ]).expect(200);

    expect(body).toEqual([
      {
        careerId: fiCareer,
        status: 'ACTIVE',
        declaredAt: expect.any(String),
        career: expect.objectContaining({
          id: fiCareer,
          name: `Informática ${tag}`,
        }),
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
    expect(JSON.stringify(body)).not.toMatch(/studyPlan|Plan 2023/);
  });

  it('replaces the whole list and allows carreras of different facultades', async () => {
    const student = await createUser(prisma);
    await replace(student, [{ careerId: fiCareer, status: 'ACTIVE' }]).expect(
      200,
    );

    const { body } = await replace(student, [
      { careerId: fiCareer, status: 'COMPLETED' },
      { careerId: foreignCareer, status: 'ACTIVE' },
    ]).expect(200);

    expect(
      (body as DeclaredCareerBody[]).map((p) => [
        p.careerId,
        p.status,
        p.faculty.id,
      ]),
    ).toEqual(
      expect.arrayContaining([
        [fiCareer, 'COMPLETED', FI_UNJU_FACULTY_ID],
        [foreignCareer, 'ACTIVE', otherFaculty],
      ]),
    );
    expect(body).toHaveLength(2);

    await replace(student, [
      { careerId: fiOtherCareer, status: 'DROPPED' },
    ]).expect(200);
    const rows = await prisma.userStudyPlan.findMany({
      where: { userId: student.id },
      select: { studyPlan: { select: { careerId: true } }, status: true },
    });
    expect(rows).toEqual([
      { studyPlan: { careerId: fiOtherCareer }, status: 'DROPPED' },
    ]);
  });

  it('rejects duplicates, unknown carreras and carreras without a plan, keeping the previous list', async () => {
    const student = await createUser(prisma);
    await replace(student, [{ careerId: fiCareer, status: 'ACTIVE' }]).expect(
      200,
    );

    const duplicate = await replace(student, [
      { careerId: fiOtherCareer, status: 'ACTIVE' },
      { careerId: fiOtherCareer, status: 'COMPLETED' },
    ]).expect(400);
    expect(duplicate.body.code).toBe('DUPLICATE_CAREER');
    const unknown = await replace(student, [
      { careerId: randomUUID(), status: 'ACTIVE' },
    ]).expect(400);
    expect(unknown.body.code).toBe('UNKNOWN_CAREER');
    const withoutPlan = await career(FI_UNJU_FACULTY_ID, 'Sin plan', false);
    const planless = await replace(student, [
      { careerId: withoutPlan, status: 'ACTIVE' },
    ]).expect(400);
    expect(planless.body.code).toBe('UNKNOWN_CAREER');
    await replace(student, [
      { careerId: fiCareer, status: 'GRADUATED' },
    ]).expect(400);

    const { body } = await read(student).expect(200);
    expect(
      (body as DeclaredCareerBody[]).map((p) => [p.careerId, p.status]),
    ).toEqual([[fiCareer, 'ACTIVE']]);
  });

  it('accepts 10 carreras and rejects an 11th by validation', async () => {
    const ids: string[] = [];
    for (let i = 0; i < 11; i += 1) {
      ids.push(await career(FI_UNJU_FACULTY_ID, `Muchas ${i}`));
    }
    const choices = ids.map((careerId) => ({ careerId, status: 'ACTIVE' }));
    const student = await createUser(prisma);

    const ten = await replace(student, choices.slice(0, 10)).expect(200);
    expect(ten.body).toHaveLength(10);

    const eleven = await replace(student, choices).expect(400);
    expect(JSON.stringify(eleven.body.message)).toMatch(/10/);
    expect(
      await prisma.userStudyPlan.count({ where: { userId: student.id } }),
    ).toBe(10);
  });

  it('returns declarations made before this change with their carrera and status', async () => {
    const student = await createUser(prisma);
    const plan = await prisma.studyPlan.findFirstOrThrow({
      where: { careerId: fiCareer },
      select: { id: true },
    });
    await prisma.userStudyPlan.create({
      data: { userId: student.id, studyPlanId: plan.id, status: 'COMPLETED' },
    });

    const { body } = await read(student).expect(200);
    expect(
      (body as DeclaredCareerBody[]).map((p) => [p.careerId, p.status]),
    ).toEqual([[fiCareer, 'COMPLETED']]);
  });

  it('answers a concurrent save of the same list without a server error', async () => {
    const student = await createUser(prisma);
    const careers = [{ careerId: fiCareer, status: 'ACTIVE' }];

    const responses = await Promise.all([
      replace(student, careers),
      replace(student, careers),
      replace(student, careers),
    ]);

    for (const response of responses) {
      expect([200, 409]).toContain(response.status);
    }
    expect(
      await prisma.userStudyPlan.count({ where: { userId: student.id } }),
    ).toBe(1);
  });

  it('keeps the order of declaration across saves', async () => {
    const student = await createUser(prisma);
    await replace(student, [
      { careerId: foreignCareer, status: 'ACTIVE' },
    ]).expect(200);
    await replace(student, [
      { careerId: fiCareer, status: 'ACTIVE' },
      { careerId: foreignCareer, status: 'COMPLETED' },
    ]).expect(200);

    const { body } = await read(student).expect(200);
    const byDeclaration = [
      ...(body as (DeclaredCareerBody & { declaredAt: string })[]),
    ]
      .sort((a, b) => a.declaredAt.localeCompare(b.declaredAt))
      .map((p) => [p.careerId, p.status]);
    expect(byDeclaration).toEqual([
      [foreignCareer, 'COMPLETED'],
      [fiCareer, 'ACTIVE'],
    ]);
  });

  it('requires a session', async () => {
    await http().get('/api/v1/users/me/study-plans').expect(401);
    await http()
      .put('/api/v1/users/me/study-plans')
      .send({ careers: [] })
      .expect(401);
  });

  it('never exposes declared carreras on the public profile', async () => {
    const student = await createUser(prisma);
    await replace(student, [{ careerId: fiCareer, status: 'ACTIVE' }]).expect(
      200,
    );
    const viewer = await createUser(prisma);

    const { body } = await http()
      .get(`/api/v1/users/${student.id}`)
      .set('Authorization', bearer(app, viewer))
      .expect(200);

    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain(fiCareer);
    expect(serialized).not.toContain(`Informática ${tag}`);
    expect(body).not.toHaveProperty('studyPlans');
  });

  it('drops a removed carrera from the carreras behind Puente', async () => {
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
    for (const careerId of [fiCareer, fiOtherCareer, foreignCareer]) {
      const giver = await createUser(prisma);
      await replace(giver, [{ careerId, status: 'ACTIVE' }]).expect(200);
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
