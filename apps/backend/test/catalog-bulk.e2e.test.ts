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
  year: number;
  semester: number;
  credits: number | null;
  errors: string[];
};

/** Carga masiva (openspec academic-structure/catalog-editing). */
describe('Catálogo: carga masiva (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let admin: E2eUser;
  let auth: { Authorization: string };
  const http = () => request(app.getHttpServer());
  const tag = randomUUID().slice(0, 6).toLowerCase();
  let facultyId: string;
  let careerId: string;
  let otherCareerId: string;
  let analysisId: string;
  let kept: string;

  const preview = async (text: string) =>
    (
      await http()
        .post(`/api/v1/admin/catalog/careers/${careerId}/bulk/preview`)
        .set(auth)
        .send({ text })
        .expect(200)
    ).body as Row[];
  const apply = (rows: Row[]) =>
    http()
      .post(`/api/v1/admin/catalog/careers/${careerId}/bulk/apply`)
      .set(auth)
      .send({
        rows: rows.map((row) => ({
          action: row.action,
          subjectId: row.action === 'reuse' ? row.subjectId : undefined,
          name: row.action === 'new' ? row.name : undefined,
          code: row.action === 'new' ? row.code : undefined,
          year: row.year,
          semester: row.semester,
          credits: row.credits,
        })),
      });
  const placements = async () =>
    (
      await http()
        .get(`/api/v1/admin/catalog/careers/${careerId}`)
        .set(auth)
        .expect(200)
    ).body.placements as {
      subjectId: string;
      name: string;
      year: number;
      semester: number;
    }[];

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    admin = await createUser(prisma, 'ADMIN');
    auth = { Authorization: bearer(app, admin) };
    const post = async (path: string, body: object) =>
      (
        await http()
          .post(`/api/v1/admin/catalog/${path}`)
          .set(auth)
          .send(body)
          .expect(201)
      ).body;

    const university = await post('universities', {
      name: `Masiva ${tag}`,
      shortName: `um${tag}`,
    });
    facultyId = (
      await post('faculties', {
        universityId: university.id,
        name: 'Exactas',
        shortName: 'FCE',
      })
    ).id;
    careerId = (
      await post('careers', { facultyId, name: 'Física', code: 'LF' })
    ).id;
    otherCareerId = (
      await post('careers', { facultyId, name: 'Matemática', code: 'LM' })
    ).id;
    analysisId = (
      await post('subjects', { facultyId, name: 'Análisis Matemático I' })
    ).id;
    kept = (await post('subjects', { facultyId, name: 'Química General' })).id;
    for (const id of [otherCareerId, careerId]) {
      await http()
        .put(`/api/v1/admin/catalog/careers/${id}/placements/${analysisId}`)
        .set(auth)
        .send({ year: 1, semester: 1 })
        .expect(200);
    }
    await http()
      .put(`/api/v1/admin/catalog/careers/${careerId}/placements/${kept}`)
      .set(auth)
      .send({ year: 1, semester: 2 })
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  it('previews reuse, new, update, unchanged and invalid rows without writing', async () => {
    const before = await prisma.subject.count({ where: { facultyId } });
    const rows = await preview(
      [
        '1;1;analisis matematico i',
        '1;2;Química General;6',
        '2;A;Mecánica Clásica',
        '2;1;Óptica',
        '7;3;Física',
      ].join('\n'),
    );
    expect(rows.map((r) => [r.line, r.action, r.placement])).toEqual([
      [1, 'reuse', 'unchanged'],
      [2, 'reuse', 'update'],
      [3, 'new', 'add'],
      [4, 'new', 'add'],
      [5, 'invalid', null],
    ]);
    expect(rows[0].subjectId).toBe(analysisId);
    expect(rows[2].code).toBe(`um${tag}-fce-mecanica-clasica`);
    expect(rows[4].errors.length).toBeGreaterThan(0);
    expect(await prisma.subject.count({ where: { facultyId } })).toBe(before);
  });

  it('applies every row at once and records one event', async () => {
    const rows = await preview(
      '1;1;Análisis Matemático I\n2;A;Mecánica Clásica;10\n2;1;Óptica',
    );
    const response = await apply(rows).expect(200);
    expect(response.body).toEqual({ created: 2, added: 2, updated: 1 });

    const now = await placements();
    expect(now).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'Mecánica Clásica',
          year: 2,
          semester: 0,
        }),
        expect.objectContaining({ name: 'Óptica', year: 2, semester: 1 }),
        // Missing from the text, still in the carrera.
        expect.objectContaining({ subjectId: kept }),
      ]),
    );
    const events = await prisma.moderationEvent.count({
      where: {
        action: 'CATALOG_BULK_APPLIED',
        metadata: { path: ['id'], equals: careerId },
      },
    });
    expect(events).toBe(1);

    const other = await http()
      .get(`/api/v1/admin/catalog/careers/${otherCareerId}`)
      .set(auth)
      .expect(200);
    expect(other.body.placements).toEqual([
      expect.objectContaining({ subjectId: analysisId }),
    ]);
  });

  it('writes nothing when one row is invalid', async () => {
    const before = await placements();
    const rows = await preview('3;1;Electromagnetismo\n3;2;Termodinámica');
    rows[1].code = rows[0].code;
    const response = await apply(rows).expect(400);
    expect(response.body.errors).toEqual([
      expect.objectContaining({ index: 1 }),
    ]);
    expect(await placements()).toEqual(before);
    expect(
      await prisma.subject.count({
        where: { facultyId, name: 'Electromagnetismo' },
      }),
    ).toBe(0);
  });

  it('refuses a materia of another facultad', async () => {
    const foreign = await prisma.subject.create({
      data: {
        facultyId: (
          await prisma.faculty.findFirstOrThrow({
            where: { NOT: { id: facultyId } },
          })
        ).id,
        name: 'Ajena',
      },
      select: { id: true },
    });
    await http()
      .post(`/api/v1/admin/catalog/careers/${careerId}/bulk/apply`)
      .set(auth)
      .send({
        rows: [
          { action: 'reuse', subjectId: foreign.id, year: 1, semester: 1 },
        ],
      })
      .expect(400);
  });

  it('refuses more than 200 lines', async () => {
    const text = Array.from({ length: 201 }, (_, i) => `1;1;Materia ${i}`).join(
      '\n',
    );
    const response = await http()
      .post(`/api/v1/admin/catalog/careers/${careerId}/bulk/preview`)
      .set(auth)
      .send({ text })
      .expect(400);
    expect(response.body.code).toBe('BULK_TOO_LONG');
  });
});
