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

/** Creating and editing the catálogo (openspec academic-structure/catalog-editing). */
describe('Catálogo: create and edit (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: E2eUser;
  let superadmin: E2eUser;
  let moderator: E2eUser;
  let student: E2eUser;
  const http = () => request(app.getHttpServer());
  const tag = randomUUID().slice(0, 6).toUpperCase();

  let universityId: string;
  let facultyId: string;
  let otherFacultyId: string;
  let careerId: string;
  let subjectId: string;

  const lastEvent = (id: string) =>
    prisma.moderationEvent.findFirst({
      where: { metadata: { path: ['id'], equals: id } },
      orderBy: { createdAt: 'desc' },
    });

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    admin = await createUser(prisma, 'ADMIN');
    superadmin = await createUser(prisma, 'SUPERADMIN');
    moderator = await createUser(prisma, 'MODERATOR');
    student = await createUser(prisma, 'USER');
  });

  afterAll(async () => {
    await app.close();
  });

  it('lets an admin create a universidad and records it', async () => {
    const response = await http()
      .post('/api/v1/admin/catalog/universities')
      .set('Authorization', bearer(app, admin))
      .send({ name: `Universidad Editable ${tag}`, shortName: `UE${tag}` })
      .expect(201);
    universityId = response.body.id;
    expect(response.body.shortName).toBe(`UE${tag}`);

    const event = await lastEvent(universityId);
    expect(event?.action).toBe('CATALOG_CREATED');
    expect(event?.actorId).toBe(admin.id);
    expect(event?.metadata).toMatchObject({
      kind: 'UNIVERSITY',
      before: null,
      after: { name: `Universidad Editable ${tag}`, shortName: `UE${tag}` },
    });
  });

  it('refuses catálogo writes to a moderator and a student', async () => {
    for (const user of [moderator, student]) {
      await http()
        .post('/api/v1/admin/catalog/universities')
        .set('Authorization', bearer(app, user))
        .send({ name: `No ${tag}`, shortName: `NO${tag}` })
        .expect(403);
    }
  });

  it('lets a superadmin create facultades', async () => {
    const response = await http()
      .post('/api/v1/admin/catalog/faculties')
      .set('Authorization', bearer(app, superadmin))
      .send({
        universityId,
        name: 'Facultad de Ciencias Exactas',
        shortName: 'FCEx',
      })
      .expect(201);
    facultyId = response.body.id;

    const other = await http()
      .post('/api/v1/admin/catalog/faculties')
      .set('Authorization', bearer(app, admin))
      .send({ universityId, name: 'Facultad de Ingeniería', shortName: 'FI' })
      .expect(201);
    otherFacultyId = other.body.id;
  });

  it('refuses a short name that repeats another in the universidad ignoring case', async () => {
    const response = await http()
      .post('/api/v1/admin/catalog/faculties')
      .set('Authorization', bearer(app, admin))
      .send({ universityId, name: 'Facultad de Informática', shortName: 'fi' })
      .expect(409);
    expect(response.body.field).toBe('shortName');
  });

  it('refuses a short name that is not slug-safe', async () => {
    await http()
      .post('/api/v1/admin/catalog/faculties')
      .set('Authorization', bearer(app, admin))
      .send({ universityId, name: 'Facultad de Química', shortName: 'F Q' })
      .expect(400);
  });

  it('renames a facultad and records before and after', async () => {
    await http()
      .patch(`/api/v1/admin/catalog/faculties/${facultyId}`)
      .set('Authorization', bearer(app, admin))
      .send({ shortName: 'FCE' })
      .expect(200);

    const event = await lastEvent(facultyId);
    expect(event?.action).toBe('CATALOG_UPDATED');
    expect(event?.metadata).toMatchObject({
      kind: 'FACULTY',
      before: { shortName: 'FCEx' },
      after: { shortName: 'FCE' },
    });
  });

  it('creates a carrera en borrador with its single plan', async () => {
    const response = await http()
      .post('/api/v1/admin/catalog/careers')
      .set('Authorization', bearer(app, admin))
      .send({
        facultyId,
        name: 'Licenciatura en Física',
        code: 'LF',
        planUrl: 'https://exactas.example.edu.ar/lf',
      })
      .expect(201);
    careerId = response.body.id;
    expect(response.body.status).toBe('DRAFT');

    const plans = await prisma.studyPlan.findMany({ where: { careerId } });
    expect(plans).toHaveLength(1);
  });

  it('refuses a plan link that is not https', async () => {
    await http()
      .patch(`/api/v1/admin/catalog/careers/${careerId}`)
      .set('Authorization', bearer(app, admin))
      .send({ planUrl: 'http://exactas.example.edu.ar/lf' })
      .expect(400);
  });

  it('creates a materia with the proposed code and places it as anual', async () => {
    const proposal = await http()
      .post('/api/v1/admin/catalog/subjects/code-proposal')
      .set('Authorization', bearer(app, admin))
      .send({ facultyId, name: 'Física General' })
      .expect(200);
    expect(proposal.body.code).toBe(
      `ue${tag.toLowerCase()}-fce-fisica-general`,
    );

    const created = await http()
      .post('/api/v1/admin/catalog/subjects')
      .set('Authorization', bearer(app, admin))
      .send({ facultyId, name: 'Física General' })
      .expect(201);
    subjectId = created.body.id;
    expect(created.body.code).toBe(proposal.body.code);

    await http()
      .put(`/api/v1/admin/catalog/careers/${careerId}/placements/${subjectId}`)
      .set('Authorization', bearer(app, admin))
      .send({ year: 1, semester: 0, credits: 10 })
      .expect(200);

    const career = await http()
      .get(`/api/v1/admin/catalog/careers/${careerId}`)
      .set('Authorization', bearer(app, admin))
      .expect(200);
    expect(career.body.placements).toEqual([
      expect.objectContaining({ subjectId, year: 1, semester: 0, credits: 10 }),
    ]);

    const event = await prisma.moderationEvent.findFirst({
      where: {
        action: 'CATALOG_PLACEMENT_CHANGED',
        metadata: { path: ['id'], equals: careerId },
      },
    });
    expect(event?.metadata).toMatchObject({
      before: null,
      after: { subjectId, year: 1, semester: 0, credits: 10 },
    });
  });

  it('refuses placing a materia of another facultad', async () => {
    const foreign = await prisma.subject.create({
      data: {
        facultyId: otherFacultyId,
        name: 'Ajena',
        code: `ajena-${tag.toLowerCase()}`,
      },
      select: { id: true },
    });
    const response = await http()
      .put(`/api/v1/admin/catalog/careers/${careerId}/placements/${foreign.id}`)
      .set('Authorization', bearer(app, admin))
      .send({ year: 1, semester: 1 })
      .expect(409);
    expect(response.body.message).toMatch(/facultad/i);
  });

  it('removes a placement without deleting the materia', async () => {
    await http()
      .delete(
        `/api/v1/admin/catalog/careers/${careerId}/placements/${subjectId}`,
      )
      .set('Authorization', bearer(app, admin))
      .expect(204);
    expect(
      await prisma.subject.findUnique({ where: { id: subjectId } }),
    ).not.toBeNull();
  });

  it('lists the tree level by level', async () => {
    const universities = await http()
      .get('/api/v1/admin/catalog/universities')
      .set('Authorization', bearer(app, admin))
      .expect(200);
    expect(universities.body).toContainEqual(
      expect.objectContaining({ id: universityId, facultyCount: 2 }),
    );

    const faculties = await http()
      .get(`/api/v1/admin/catalog/universities/${universityId}/faculties`)
      .set('Authorization', bearer(app, admin))
      .expect(200);
    const levels = faculties.body as { shortName: string }[];
    expect(levels.map((f) => f.shortName)).toEqual(['FCE', 'FI']);

    const careers = await http()
      .get(`/api/v1/admin/catalog/faculties/${facultyId}/careers`)
      .set('Authorization', bearer(app, admin))
      .expect(200);
    expect(careers.body).toEqual([
      expect.objectContaining({ id: careerId, status: 'DRAFT' }),
    ]);

    const subjects = await http()
      .get(`/api/v1/admin/catalog/faculties/${facultyId}/subjects`)
      .set('Authorization', bearer(app, admin))
      .expect(200);
    expect(subjects.body).toContainEqual(
      expect.objectContaining({ id: subjectId }),
    );
  });

  it('refuses null names and codes instead of clearing them', async () => {
    for (const [path, body] of [
      [`universities/${universityId}`, { name: null }],
      [`faculties/${facultyId}`, { shortName: null }],
      [`careers/${careerId}`, { code: null }],
      [`subjects/${subjectId}`, { code: null }],
    ] as const) {
      await http()
        .patch(`/api/v1/admin/catalog/${path}`)
        .set('Authorization', bearer(app, admin))
        .send(body)
        .expect(400);
    }
    const subject = await prisma.subject.findUniqueOrThrow({
      where: { id: subjectId },
    });
    expect(subject.code).not.toBeNull();
  });

  it('keeps the search key in step with name and code', async () => {
    await http()
      .patch(`/api/v1/admin/catalog/subjects/${subjectId}`)
      .set('Authorization', bearer(app, admin))
      .send({ name: 'Física Básica' })
      .expect(200);
    const subject = await prisma.subject.findUniqueOrThrow({
      where: { id: subjectId },
    });
    expect(subject.searchKey).toBe(`fisica basica ${subject.code}`);
  });

  it('proposes distinct codes for names that share a long prefix', async () => {
    const name =
      'Introducción a la Teoría General de los Sistemas Dinámicos No Lineales';
    const codes: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      const created = await http()
        .post('/api/v1/admin/catalog/subjects')
        .set('Authorization', bearer(app, admin))
        .send({ facultyId, name })
        .expect(201);
      codes.push(created.body.code);
    }
    expect(new Set(codes).size).toBe(3);
  });
});
