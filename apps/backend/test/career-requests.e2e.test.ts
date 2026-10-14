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

const PLAN = 'https://exactas.example.edu.ar/plan';

/** Solicitudes de carrera (openspec academic-structure/career-requests). */
describe('Solicitudes de carrera (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: E2eUser;
  const http = () => request(app.getHttpServer());
  const tag = randomUUID().slice(0, 6).toLowerCase();
  let universityId: string;
  let facultyId: string;

  const as = (user: E2eUser) => ({ Authorization: bearer(app, user) });
  const ask = (user: E2eUser, body: Record<string, unknown>) =>
    http()
      .post('/api/v1/career-requests')
      .set(as(user))
      .send({ facultyId, planUrl: PLAN, ...body });
  const support = (user: E2eUser, id: string) =>
    http().post(`/api/v1/career-requests/${id}/support`).set(as(user));
  const mine = async (user: E2eUser) =>
    (
      await http()
        .get('/api/v1/users/me/career-requests')
        .set(as(user))
        .expect(200)
    ).body as {
      id: string;
      status: string;
      count: number;
      rejectionReason: string | null;
      career: { path: string } | null;
    }[];

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    admin = await createUser(prisma, 'ADMIN');
    universityId = (
      await http()
        .post('/api/v1/admin/catalog/universities')
        .set(as(admin))
        .send({ name: `Solicitudes ${tag}`, shortName: `us${tag}` })
        .expect(201)
    ).body.id;
    facultyId = (
      await http()
        .post('/api/v1/admin/catalog/faculties')
        .set(as(admin))
        .send({ universityId, name: 'Exactas', shortName: 'FCE' })
        .expect(201)
    ).body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('asking', () => {
    it('accepts a catálogo facultad or free text', async () => {
      const student = await createUser(prisma, 'USER');
      const created = await ask(student, { careerName: 'Física' }).expect(201);
      expect(created.body.status).toBe('PENDING');
      await http()
        .post('/api/v1/career-requests')
        .set(as(student))
        .send({
          facultyText: 'Facultad de Química',
          universityText: 'Universidad del Norte',
          careerName: 'Bioquímica',
          planUrl: PLAN,
        })
        .expect(201);
      expect((await mine(student)).map((r) => r.status)).toEqual([
        'PENDING',
        'PENDING',
      ]);
    });

    it('refuses an http link, an unverified email and a silenced account', async () => {
      const student = await createUser(prisma, 'USER');
      await ask(student, {
        careerName: 'Física',
        planUrl: 'http://x.edu.ar',
      }).expect(400);

      const unverified = await createUser(prisma, 'USER', {
        emailVerified: false,
      });
      const refused = await ask(unverified, { careerName: 'Física' }).expect(
        403,
      );
      expect(refused.body.code).toBe('EMAIL_NOT_VERIFIED');

      const muted = await createUser(prisma, 'USER', {
        mutedUntil: new Date(Date.now() + 86_400_000),
      });
      await ask(muted, { careerName: 'Física' }).expect(403);
      expect(
        await prisma.careerRequest.count({
          where: { authorId: { in: [student.id, unverified.id, muted.id] } },
        }),
      ).toBe(0);
    });

    it('refuses a fourth pending solicitud', async () => {
      const student = await createUser(prisma, 'USER');
      for (const name of ['A', 'B', 'C']) {
        await ask(student, { careerName: `Carrera ${name}` }).expect(201);
      }
      const fourth = await ask(student, { careerName: 'Carrera D' }).expect(
        409,
      );
      expect(fourth.body.code).toBe('REQUEST_LIMIT');
    });

    it('needs a session', async () => {
      await http()
        .post('/api/v1/career-requests')
        .send({ facultyId, careerName: 'Física', planUrl: PLAN })
        .expect(401);
    });

    it('limits how often an account asks or joins', async () => {
      const student = await createUser(prisma, 'USER');
      const author = await createUser(prisma, 'USER');
      const { id } = (
        await ask(author, { careerName: `Ritmo ${tag}` }).expect(201)
      ).body;
      for (let i = 0; i < 5; i += 1) {
        await support(student, id).expect(204);
        await http()
          .delete(`/api/v1/career-requests/${id}/support`)
          .set(as(student))
          .expect(204);
      }
      for (let i = 0; i < 5; i += 1) {
        await support(student, id).expect((res) =>
          expect([204, 409]).toContain(res.status),
        );
      }
      await support(student, id).expect(429);
    });
  });

  describe('«Yo también» and withdrawal', () => {
    let author: E2eUser;
    let first: E2eUser;
    let second: E2eUser;
    let requestId: string;

    beforeAll(async () => {
      author = await createUser(prisma, 'USER');
      first = await createUser(prisma, 'USER');
      second = await createUser(prisma, 'USER');
      requestId = (
        await ask(author, { careerName: `Astronomía ${tag}` }).expect(201)
      ).body.id;
    });

    it('lists the pending ones of the facultad without identities', async () => {
      const response = await http()
        .get('/api/v1/career-requests')
        .query({ facultyId })
        .set(as(first))
        .expect(200);
      const rows = response.body as { id: string }[];
      const row = rows.find((r) => r.id === requestId);
      expect(row).toMatchObject({ count: 1, mine: false, supported: false });
      expect(JSON.stringify(row)).not.toContain(author.id);
    });

    it('joins once and never your own', async () => {
      await support(first, requestId).expect(204);
      await new Promise((resolve) => setTimeout(resolve, 5));
      await support(second, requestId).expect(204);
      expect((await support(first, requestId).expect(409)).body.code).toBe(
        'REQUEST_ALREADY_SUPPORTED',
      );
      expect((await support(author, requestId).expect(409)).body.code).toBe(
        'REQUEST_OWN',
      );
    });

    it('lets a supporter leave', async () => {
      await http()
        .delete(`/api/v1/career-requests/${requestId}/support`)
        .set(as(second))
        .expect(204);
      expect(
        (await mine(second)).find((r) => r.id === requestId),
      ).toBeUndefined();
      await support(second, requestId).expect(204);
    });

    it('hands it to the first who joined when the author withdraws', async () => {
      const response = await http()
        .delete(`/api/v1/career-requests/${requestId}`)
        .set(as(author))
        .expect(200);
      expect(response.body.status).toBe('PENDING');
      const row = await prisma.careerRequest.findUniqueOrThrow({
        where: { id: requestId },
      });
      expect(row.authorId).toBe(first.id);
      expect((await mine(first)).find((r) => r.id === requestId)?.count).toBe(
        2,
      );
      expect(
        (await mine(author)).find((r) => r.id === requestId),
      ).toBeUndefined();
    });

    it('closes it as withdrawn when nobody joined', async () => {
      const lonely = await createUser(prisma, 'USER');
      const { id } = (
        await ask(lonely, { careerName: `Sola ${tag}` }).expect(201)
      ).body;
      await http()
        .delete(`/api/v1/career-requests/${id}`)
        .set(as(lonely))
        .expect(200);
      expect((await mine(lonely)).find((r) => r.id === id)?.status).toBe(
        'WITHDRAWN',
      );
      await http()
        .delete(`/api/v1/career-requests/${id}`)
        .set(as(lonely))
        .expect(409);
    });

    it('does not offer free-text solicitudes for joining', async () => {
      const someone = await createUser(prisma, 'USER');
      const { id } = (
        await http()
          .post('/api/v1/career-requests')
          .set(as(someone))
          .send({ facultyText: 'Otra', careerName: 'Libre', planUrl: PLAN })
          .expect(201)
      ).body;
      expect((await support(first, id).expect(409)).body.code).toBe(
        'REQUEST_NOT_JOINABLE',
      );
    });
  });

  describe('resolution', () => {
    it('accepts into a carrera en borrador and publishes it', async () => {
      const student = await createUser(prisma, 'USER');
      const supporter = await createUser(prisma, 'USER');
      const { id } = (
        await ask(student, { careerName: `Geología ${tag}` }).expect(201)
      ).body;
      await support(supporter, id).expect(204);

      const count = await http()
        .get('/api/v1/admin/catalog/requests/count')
        .set(as(admin))
        .expect(200);
      expect(count.body.pending).toBeGreaterThan(0);

      const accepted = await http()
        .post(`/api/v1/admin/catalog/requests/${id}/accept`)
        .set(as(admin))
        .send({ career: { name: 'Licenciatura en Geología', code: 'LG' } })
        .expect(200);
      const career = await prisma.career.findUniqueOrThrow({
        where: { id: accepted.body.careerId },
      });
      expect(career).toMatchObject({
        status: 'DRAFT',
        planUrl: PLAN,
        facultyId,
      });
      expect((await mine(student)).find((r) => r.id === id)?.status).toBe(
        'ACCEPTED',
      );

      await http()
        .post(`/api/v1/admin/catalog/careers/${career.id}/publish`)
        .set(as(admin))
        .expect(200);
      const row = (await mine(supporter)).find((r) => r.id === id);
      expect(row?.status).toBe('PUBLISHED');
      expect(row?.career?.path).toBe(`/universidades/us${tag}/fce/lg`);
      expect(
        await prisma.userStudyPlan.count({ where: { userId: student.id } }),
      ).toBe(0);

      const event = await prisma.moderationEvent.findFirst({
        where: {
          action: 'CAREER_REQUEST_RESOLVED',
          metadata: { path: ['requestId'], equals: id },
        },
      });
      expect(event?.actorId).toBe(admin.id);
    });

    it('accepts a free-text facultad after the admin confirms it', async () => {
      const student = await createUser(prisma, 'USER');
      const { id } = (
        await http()
          .post('/api/v1/career-requests')
          .set(as(student))
          .send({
            facultyText: 'Facultad de Agronomía',
            careerName: 'Agronomía',
            planUrl: PLAN,
          })
          .expect(201)
      ).body;
      await http()
        .post(`/api/v1/admin/catalog/requests/${id}/accept`)
        .set(as(admin))
        .send({ career: { name: 'Agronomía', code: 'AG' } })
        .expect(400);
      const accepted = await http()
        .post(`/api/v1/admin/catalog/requests/${id}/accept`)
        .set(as(admin))
        .send({
          career: { name: 'Agronomía', code: 'AG' },
          faculty: {
            name: 'Facultad de Agronomía',
            shortName: 'FA',
            universityId,
          },
        })
        .expect(200);
      const career = await prisma.career.findUniqueOrThrow({
        where: { id: accepted.body.careerId },
        include: { faculty: true },
      });
      expect(career.faculty).toMatchObject({ universityId, shortName: 'FA' });
    });

    it('accepts a free-text solicitud into an existing facultad', async () => {
      const student = await createUser(prisma, 'USER');
      const { id } = (
        await http()
          .post('/api/v1/career-requests')
          .set(as(student))
          .send({
            facultyText: 'Exactas otra vez',
            careerName: 'Geofísica',
            planUrl: PLAN,
          })
          .expect(201)
      ).body;
      const accepted = await http()
        .post(`/api/v1/admin/catalog/requests/${id}/accept`)
        .set(as(admin))
        .send({ facultyId, career: { name: 'Geofísica', code: 'GF' } })
        .expect(200);
      const career = await prisma.career.findUniqueOrThrow({
        where: { id: accepted.body.careerId },
      });
      expect(career.facultyId).toBe(facultyId);
    });

    it('rejects with a required reason that the student sees', async () => {
      const student = await createUser(prisma, 'USER');
      const { id } = (
        await ask(student, { careerName: `Rechazada ${tag}` }).expect(201)
      ).body;
      await http()
        .post(`/api/v1/admin/catalog/requests/${id}/reject`)
        .set(as(admin))
        .send({ reason: '' })
        .expect(400);
      await http()
        .post(`/api/v1/admin/catalog/requests/${id}/reject`)
        .set(as(admin))
        .send({ reason: 'No es una carrera de grado' })
        .expect(204);
      expect((await mine(student)).find((r) => r.id === id)).toMatchObject({
        status: 'REJECTED',
        rejectionReason: 'No es una carrera de grado',
      });
    });

    it('marks as already loaded only with a published carrera', async () => {
      const student = await createUser(prisma, 'USER');
      const { id } = (
        await ask(student, { careerName: `Repetida ${tag}` }).expect(201)
      ).body;
      const draft = await http()
        .post('/api/v1/admin/catalog/careers')
        .set(as(admin))
        .send({ facultyId, name: 'Borrador', code: `BR${tag}` })
        .expect(201);
      await http()
        .post(`/api/v1/admin/catalog/requests/${id}/already-loaded`)
        .set(as(admin))
        .send({ careerId: draft.body.id })
        .expect(400);
      await http()
        .post(`/api/v1/admin/catalog/careers/${draft.body.id}/publish`)
        .set(as(admin))
        .expect(200);
      await http()
        .post(`/api/v1/admin/catalog/requests/${id}/already-loaded`)
        .set(as(admin))
        .send({ careerId: draft.body.id })
        .expect(204);
      expect((await mine(student)).find((r) => r.id === id)?.status).toBe(
        'ALREADY_LOADED',
      );
    });

    it('is for admins only', async () => {
      const moderator = await createUser(prisma, 'MODERATOR');
      await http()
        .get('/api/v1/admin/catalog/requests')
        .set(as(moderator))
        .expect(403);
    });
  });
});
