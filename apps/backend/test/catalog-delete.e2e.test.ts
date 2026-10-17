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

/** Deleting only what is empty (openspec academic-structure/catalog-editing). */
describe('Catálogo: deleting (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: E2eUser;
  const http = () => request(app.getHttpServer());
  const tag = randomUUID().slice(0, 6).toUpperCase();
  let auth: { Authorization: string };

  const post = async (path: string, body: object) =>
    (
      await http()
        .post(`/api/v1/admin/catalog/${path}`)
        .set(auth)
        .send(body)
        .expect(201)
    ).body as { id: string; code?: string };
  const remove = (path: string) =>
    http().delete(`/api/v1/admin/catalog/${path}`).set(auth);
  const place = (careerId: string, subjectId: string) =>
    http()
      .put(`/api/v1/admin/catalog/careers/${careerId}/placements/${subjectId}`)
      .set(auth)
      .send({ year: 1, semester: 1 })
      .expect(200);

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    admin = await createUser(prisma, 'ADMIN');
    auth = { Authorization: bearer(app, admin) };
  });

  afterAll(async () => {
    await app.close();
  });

  it('deletes each level when it is empty and records it', async () => {
    const university = await post('universities', {
      name: `Borrable ${tag}`,
      shortName: `BO${tag}`,
    });
    const faculty = await post('faculties', {
      universityId: university.id,
      name: 'Facultad',
      shortName: 'F',
    });
    const career = await post('careers', {
      facultyId: faculty.id,
      name: 'Carrera',
      code: 'C',
    });
    const subject = await post('subjects', {
      facultyId: faculty.id,
      name: 'Materia',
    });
    await place(career.id, subject.id);

    await remove(`subjects/${subject.id}`).expect(204);
    await remove(`careers/${career.id}`).expect(204);
    await remove(`faculties/${faculty.id}`).expect(204);
    await remove(`universities/${university.id}`).expect(204);

    expect(
      await prisma.university.findUnique({ where: { id: university.id } }),
    ).toBeNull();
    const events = await prisma.moderationEvent.count({
      where: {
        action: 'CATALOG_DELETED',
        metadata: { path: ['id'], equals: university.id },
      },
    });
    expect(events).toBe(1);
  });

  it('refuses what has content, naming the blockers', async () => {
    const university = await post('universities', {
      name: `Llena ${tag}`,
      shortName: `LL${tag}`,
    });
    const faculty = await post('faculties', {
      universityId: university.id,
      name: 'Facultad',
      shortName: 'F',
    });
    const career = await post('careers', {
      facultyId: faculty.id,
      name: 'Carrera',
      code: 'C',
    });
    const subject = await post('subjects', {
      facultyId: faculty.id,
      name: 'Materia',
    });
    await place(career.id, subject.id);
    const moderator = await createUser(
      prisma,
      'MODERATOR',
      {},
      { faculties: [faculty.id] },
    );
    const author = await createUser(prisma, 'USER');
    await prisma.material.create({
      data: {
        title: 'Parcial',
        fileUrl: 'https://drive.example.com/x',
        fileType: 'pdf',
        fileSize: 1,
        authorId: author.id,
        subjectId: subject.id,
        resourceType: 'PARCIAL',
      },
    });
    await http()
      .post(`/api/v1/admin/catalog/careers/${career.id}/publish`)
      .set(auth)
      .expect(200);
    await http()
      .put('/api/v1/users/me/study-plans')
      .set('Authorization', bearer(app, author))
      .send({ careers: [{ careerId: career.id, status: 'ACTIVE' }] })
      .expect(200);

    const uni = await remove(`universities/${university.id}`).expect(409);
    expect(uni.body.blockers).toEqual({ faculties: 1 });

    const fac = await remove(`faculties/${faculty.id}`).expect(409);
    expect(fac.body.blockers).toEqual({
      careers: 1,
      subjects: 1,
      moderators: 1,
    });
    expect(fac.body.message).toMatch(/moderadores/);

    const car = await remove(`careers/${career.id}`).expect(409);
    expect(car.body.blockers).toEqual({ declarations: 1 });

    const sub = await remove(`subjects/${subject.id}`).expect(409);
    expect(sub.body.blockers).toEqual({ materials: 1 });

    expect(
      await prisma.subject.findUnique({ where: { id: subject.id } }),
    ).not.toBeNull();
    expect(moderator.id).toBeTruthy();
  });

  it('removing a placement keeps the materia in its other carreras', async () => {
    const university = await post('universities', {
      name: `Compartida ${tag}`,
      shortName: `CO${tag}`,
    });
    const faculty = await post('faculties', {
      universityId: university.id,
      name: 'Facultad',
      shortName: 'F',
    });
    const a = await post('careers', {
      facultyId: faculty.id,
      name: 'A',
      code: 'A',
    });
    const b = await post('careers', {
      facultyId: faculty.id,
      name: 'B',
      code: 'B',
    });
    const subject = await post('subjects', {
      facultyId: faculty.id,
      name: 'Compartida',
    });
    await place(a.id, subject.id);
    await place(b.id, subject.id);

    await remove(`careers/${a.id}/placements/${subject.id}`).expect(204);
    const other = await http()
      .get(`/api/v1/admin/catalog/careers/${b.id}`)
      .set(auth)
      .expect(200);
    expect(other.body.placements).toEqual([
      expect.objectContaining({ subjectId: subject.id }),
    ]);
  });
});
