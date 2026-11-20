import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PrismaService } from '../src/prisma/prisma.service';
import { FI_UNJU_FACULTY_ID } from '../src/modules/institutions/institutions.constants';
import { createE2eApp, createUser, type E2eUser } from './support/e2e-app';

type TopicsBody = { topics: { topic: string; count: number }[] };

/** Topic suggestions (openspec academic-community/experiences). */
describe('Experiencias: exam topics (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let author: E2eUser;
  const http = () => request(app.getHttpServer());
  const tag = randomUUID().slice(0, 6).toUpperCase();
  const code = `TOP-${tag}`;
  const manyCode = `TOP-M${tag}`;
  const emptyCode = `TOP-E${tag}`;
  const subjectIds: string[] = [];
  const examIds: string[] = [];

  const exam = async (subjectId: string, data: Record<string, unknown>) => {
    const row = await prisma.examExperience.create({
      data: {
        userId: author.id,
        subjectId,
        year: 2025,
        format: 'ESCRITO',
        ...data,
      },
      select: { id: true },
    });
    examIds.push(row.id);
  };

  const subject = async (subjectCode: string) => {
    const row = await prisma.subject.create({
      data: {
        facultyId: FI_UNJU_FACULTY_ID,
        code: subjectCode,
        name: `Materia temas ${subjectCode}`,
      },
      select: { id: true },
    });
    subjectIds.push(row.id);
    return row.id;
  };

  const topicsOf = async (subjectCode: string) =>
    (
      await http()
        .get(`/api/v1/discovery/subjects/${subjectCode}/exam-topics`)
        .expect(200)
    ).body as TopicsBody;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    author = await createUser(prisma, 'USER');
    const subjectId = await subject(code);
    const manyId = await subject(manyCode);
    await subject(emptyCode);

    // «Series de Fourier» in three finales (two spellings), «Teorema de Green»
    // and «Derivadas» in two, «Truco del profe» in one; «Retirado» counts one
    // public final plus a retired one, «Oculto» one plus a recently hidden one.
    await exam(subjectId, {
      topics: ['Series de Fourier', 'Teorema de Green', 'Truco del profe'],
    });
    await exam(subjectId, {
      topics: ['series de fourier', 'Teorema de Green', 'Derivadas'],
      isAnonymous: true,
    });
    await exam(subjectId, {
      topics: ['Series de Fourier', 'Derivadas', 'Retirado', 'Oculto'],
    });
    await exam(subjectId, {
      topics: ['Retirado'],
      publicationStatus: 'REMOVED',
    });
    await exam(subjectId, {
      topics: ['Oculto'],
      publicationStatus: 'HIDDEN',
      hiddenAt: new Date(),
    });
    await exam(subjectId, {
      topics: ['Pendiente', 'Truco del profe'],
      publicationStatus: 'PENDING_REVIEW',
    });

    // 22 temas, each in two public finales: only the first 20 by name.
    const names = Array.from(
      { length: 22 },
      (_, i) => `Tema ${String(i + 1).padStart(2, '0')}`,
    );
    for (const chunk of [
      names.slice(0, 10),
      names.slice(10, 20),
      names.slice(20),
    ]) {
      await exam(manyId, { topics: chunk });
      await exam(manyId, { topics: chunk });
    }
  });

  afterAll(async () => {
    await prisma.examExperience.deleteMany({ where: { id: { in: examIds } } });
    await prisma.subject.deleteMany({ where: { id: { in: subjectIds } } });
    await prisma.user.delete({ where: { id: author.id } });
    await app.close();
  });

  it('returns the temas of at least two public finales by count, then name', async () => {
    const body = await topicsOf(code);
    expect(
      body.topics.map(({ topic, count }) => [topic.toLowerCase(), count]),
    ).toEqual([
      ['series de fourier', 3],
      ['derivadas', 2],
      ['teorema de green', 2],
    ]);
  });

  it('never suggests a tema of a single final, or one kept alive only by hidden entries', async () => {
    const names = (await topicsOf(code)).topics.map((t) =>
      t.topic.toLowerCase(),
    );
    for (const absent of [
      'truco del profe',
      'retirado',
      'oculto',
      'pendiente',
    ]) {
      expect(names).not.toContain(absent);
    }
  });

  it('returns at most 20 temas', async () => {
    const body = await topicsOf(manyCode);
    expect(body.topics).toHaveLength(20);
    expect(body.topics[0]).toEqual({ topic: 'Tema 01', count: 2 });
    expect(body.topics[19]).toEqual({ topic: 'Tema 20', count: 2 });
  });

  it('returns an empty list for a materia without shared temas', async () => {
    expect(await topicsOf(emptyCode)).toEqual({ topics: [] });
  });

  it('answers 404 for an unknown code', async () => {
    const res = await http()
      .get('/api/v1/discovery/subjects/NOPE-000/exam-topics')
      .expect(404);
    expect(res.body.message).toBe('Materia no encontrada');
  });
});
