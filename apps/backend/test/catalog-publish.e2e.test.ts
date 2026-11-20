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

/** Carrera en borrador and publishing (openspec academic-structure/catalog-editing). */
describe('Catálogo: borrador and publishing (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: E2eUser;
  let student: E2eUser;
  const http = () => request(app.getHttpServer());
  const tag = randomUUID().slice(0, 6).toUpperCase();
  const uni = `UP${tag}`;
  let facultyId: string;
  let careerId: string;
  let subjectCode: string;

  const browse = (path = '') =>
    http().get(`/api/v1/institutions/browse/${uni.toLowerCase()}/fce${path}`);
  const declare = (user: E2eUser) =>
    http()
      .put('/api/v1/users/me/study-plans')
      .set('Authorization', bearer(app, user))
      .send({ careers: [{ careerId, status: 'ACTIVE' }] });
  const catalogCareers = async () => {
    const response = await http().get('/api/v1/institutions').expect(200);
    const tree = response.body as {
      shortName: string;
      faculties: { careers: { id: string }[] }[];
    }[];
    const university = tree.find((u) => u.shortName === uni)!;
    return university.faculties[0].careers.map((c) => c.id);
  };

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    admin = await createUser(prisma, 'ADMIN');
    student = await createUser(prisma, 'USER');
    const auth = { Authorization: bearer(app, admin) };

    const university = await http()
      .post('/api/v1/admin/catalog/universities')
      .set(auth)
      .send({ name: `Universidad Publicable ${tag}`, shortName: uni })
      .expect(201);
    const faculty = await http()
      .post('/api/v1/admin/catalog/faculties')
      .set(auth)
      .send({
        universityId: university.body.id,
        name: 'Facultad de Exactas',
        shortName: 'FCE',
      })
      .expect(201);
    facultyId = faculty.body.id;
    const career = await http()
      .post('/api/v1/admin/catalog/careers')
      .set(auth)
      .send({ facultyId, name: 'Licenciatura en Física', code: 'LF' })
      .expect(201);
    careerId = career.body.id;
    const subject = await http()
      .post('/api/v1/admin/catalog/subjects')
      .set(auth)
      .send({ facultyId, name: 'Mecánica' })
      .expect(201);
    subjectCode = subject.body.code;
    await http()
      .put(
        `/api/v1/admin/catalog/careers/${careerId}/placements/${subject.body.id}`,
      )
      .set(auth)
      .send({ year: 1, semester: 1 })
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  it('hides a carrera en borrador everywhere', async () => {
    const faculty = await browse().expect(200);
    expect(faculty.body.careers).toEqual([]);
    await browse('/lf').expect(404);
    expect(await catalogCareers()).toEqual([]);
    await declare(student).expect(400);

    const materia = await http()
      .get(`/api/v1/subjects/${subjectCode}`)
      .expect(200);
    expect(JSON.stringify(materia.body)).not.toContain(careerId);
  });

  it('shows it after publishing and records the event', async () => {
    await http()
      .post(`/api/v1/admin/catalog/careers/${careerId}/publish`)
      .set('Authorization', bearer(app, admin))
      .expect(200);

    const faculty = await browse().expect(200);
    expect(faculty.body.careers).toEqual([
      expect.objectContaining({ id: careerId }),
    ]);
    await browse('/lf').expect(200);
    expect(await catalogCareers()).toEqual([careerId]);

    const event = await prisma.moderationEvent.findFirst({
      where: {
        action: 'CAREER_PUBLISHED',
        metadata: { path: ['id'], equals: careerId },
      },
    });
    expect(event?.actorId).toBe(admin.id);
  });

  it('refuses to unpublish a declared carrera', async () => {
    await declare(student).expect(200);
    const response = await http()
      .post(`/api/v1/admin/catalog/careers/${careerId}/unpublish`)
      .set('Authorization', bearer(app, admin))
      .expect(409);
    expect(response.body.blockers).toEqual({ declarations: 1 });
    await browse('/lf').expect(200);
  });

  it('returns an undeclared carrera to borrador', async () => {
    await http()
      .put('/api/v1/users/me/study-plans')
      .set('Authorization', bearer(app, student))
      .send({ careers: [] })
      .expect(200);
    await http()
      .post(`/api/v1/admin/catalog/careers/${careerId}/unpublish`)
      .set('Authorization', bearer(app, admin))
      .expect(200);
    await browse('/lf').expect(404);
    const event = await prisma.moderationEvent.findFirst({
      where: {
        action: 'CAREER_UNPUBLISHED',
        metadata: { path: ['id'], equals: careerId },
      },
    });
    expect(event).not.toBeNull();
  });
});
