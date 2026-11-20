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

type Row = {
  line: number;
  name: string;
  action: string;
  subjectId: string | null;
  code: string | null;
  placement: string | null;
  year: number | null;
  semester: number | null;
  credits: number | null;
  optativa: boolean;
  errors: string[];
};

/** Optativas (openspec academic-structure/catalog-editing, institutions). */
describe('Catálogo: optativas (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: E2eUser;
  let auth: { Authorization: string };
  const http = () => request(app.getHttpServer());
  const tag = randomUUID().slice(0, 6).toLowerCase();
  let facultyId: string;
  let careerId: string;
  let algebra: string;
  let robotics: string;
  let ai: string;

  const post = async (path: string, body: object) =>
    (
      await http()
        .post(`/api/v1/admin/catalog/${path}`)
        .set(auth)
        .send(body)
        .expect(201)
    ).body as { id: string };
  const place = (subjectId: string, body: object) =>
    http()
      .put(`/api/v1/admin/catalog/careers/${careerId}/placements/${subjectId}`)
      .set(auth)
      .send(body);
  const detail = async () =>
    (
      await http()
        .get(`/api/v1/admin/catalog/careers/${careerId}`)
        .set(auth)
        .expect(200)
    ).body as {
      placements: {
        subjectId: string;
        name: string;
        year: number | null;
        semester: number | null;
        credits: number | null;
      }[];
    };
  const duration = async () =>
    (await prisma.studyPlan.findFirstOrThrow({ where: { careerId } })).duration;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    admin = await createUser(prisma, 'ADMIN');
    auth = { Authorization: bearer(app, admin) };
    const university = await post('universities', {
      name: `Optativas ${tag}`,
      shortName: `uo${tag}`,
    });
    facultyId = (
      await post('faculties', {
        universityId: university.id,
        name: 'Ingeniería',
        shortName: 'FI',
      })
    ).id;
    careerId = (
      await post('careers', { facultyId, name: 'Informática', code: 'II' })
    ).id;
    algebra = (await post('subjects', { facultyId, name: 'Álgebra' })).id;
    robotics = (await post('subjects', { facultyId, name: 'Robótica' })).id;
    ai = (
      await post('subjects', { facultyId, name: 'Inteligencia Artificial' })
    ).id;
    await place(algebra, { year: 2, semester: 1 }).expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  it('places a materia as an optativa, with no año or cuatrimestre', async () => {
    const response = await place(robotics, { optativa: true, credits: 6 });
    expect(response.status).toBe(200);
    const row = await prisma.studyPlanSubject.findFirstOrThrow({
      where: { subjectId: robotics },
    });
    expect([row.year, row.semester, row.credits]).toEqual([null, null, 6]);
    expect(await duration()).toBe(2);
  });

  it('refuses an optativa with an año, and a placement without one', async () => {
    await place(robotics, { optativa: true, year: 3, semester: 1 }).expect(400);
    await place(robotics, { semester: 1 }).expect(400);
  });

  it('lists optativas last, by name', async () => {
    await place(ai, { optativa: true }).expect(200);
    const { placements } = await detail();
    expect(placements.map((p) => p.name)).toEqual([
      'Álgebra',
      'Inteligencia Artificial',
      'Robótica',
    ]);
  });

  it('moves an optativa to an año keeping one placement', async () => {
    await place(robotics, { year: 4, semester: 2 }).expect(200);
    const rows = await prisma.studyPlanSubject.findMany({
      where: { subjectId: robotics },
    });
    expect(rows.map((r) => [r.year, r.semester])).toEqual([[4, 2]]);
    expect(await duration()).toBe(4);
  });

  it('previews and applies optativa lines in the carga masiva', async () => {
    const rows = (
      await http()
        .post(`/api/v1/admin/catalog/careers/${careerId}/bulk/preview`)
        .set(auth)
        .send({ text: 'O;;Robótica;6\nO;;Visión por Computadora' })
        .expect(200)
    ).body as Row[];
    expect(
      rows.map((r) => [r.name, r.optativa, r.year, r.semester, r.placement]),
    ).toEqual([
      ['Robótica', true, null, null, 'update'],
      ['Visión por Computadora', true, null, null, 'add'],
    ]);

    const response = await http()
      .post(`/api/v1/admin/catalog/careers/${careerId}/bulk/apply`)
      .set(auth)
      .send({
        rows: rows.map((row) => ({
          action: row.action,
          subjectId: row.action === 'reuse' ? row.subjectId : undefined,
          name: row.action === 'new' ? row.name : undefined,
          code: row.action === 'new' ? row.code : undefined,
          optativa: true,
          credits: row.credits,
        })),
      });
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ created: 1, added: 1, updated: 1 });
    const { placements } = await detail();
    expect(
      placements.filter((p) => p.year === null).map((p) => [p.name, p.credits]),
    ).toEqual([
      ['Inteligencia Artificial', null],
      ['Robótica', 6],
      ['Visión por Computadora', null],
    ]);
    expect(await duration()).toBe(2);
  });

  describe('public pages', () => {
    beforeAll(async () => {
      await place(algebra, { year: 2, semester: 1, credits: 8 }).expect(200);
      await http()
        .post(`/api/v1/admin/catalog/careers/${careerId}/publish`)
        .set(auth)
        .expect(200);
    });

    it('lists optativas apart, after the años, and counts them as materias only', async () => {
      const page = (
        await http()
          .get(`/api/v1/institutions/browse/uo${tag}/fi/ii`)
          .expect(200)
      ).body as {
        career: { years: number; credits: number; subjectCount: number };
        subjects: { name: string }[];
        optativas: { name: string; credits: number | null; code: string }[];
      };
      expect(page.subjects.map((s) => s.name)).toEqual(['Álgebra']);
      expect(page.optativas.map((s) => [s.name, s.credits])).toEqual([
        ['Inteligencia Artificial', null],
        ['Robótica', 6],
        ['Visión por Computadora', null],
      ]);
      expect(page.career).toMatchObject({
        years: 2,
        credits: 8,
        subjectCount: 4,
      });
    });

    it('shows an optativa placement on the materia page', async () => {
      const { code } = await prisma.subject.findUniqueOrThrow({
        where: { id: robotics },
      });
      const subject = (await http().get(`/api/v1/subjects/${code}`).expect(200))
        .body as {
        studyPlans: {
          year: number | null;
          semester: number | null;
          studyPlan: { career: { name: string } };
        }[];
      };
      expect(
        subject.studyPlans.map((p) => [
          p.studyPlan.career.name,
          p.year,
          p.semester,
        ]),
      ).toEqual([['Informática', null, null]]);
    });
  });
});
