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

type QueueItem = { caseId: string };
type Queue = Record<
  'vencidos' | 'hidden' | 'priorReview' | 'reported',
  QueueItem[]
>;

/**
 * Casos, revisión previa, panel counts and correcciones follow the alcance de
 * moderación (openspec moderation/scope).
 */
describe('Moderation limited to the moderator facultades (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());

  const tag = randomUUID().slice(0, 6).toUpperCase();
  let universityId: string;
  const faculties: Record<'A' | 'B', string> = { A: '', B: '' };
  const subjects: Record<'A' | 'B', string> = { A: '', B: '' };
  const cases: Record<string, string> = {};
  const suggestions: Record<'A' | 'B', string> = { A: '', B: '' };

  let modA: E2eUser;
  let unassigned: E2eUser;
  let admin: E2eUser;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    ({ id: universityId } = await prisma.university.create({
      data: { name: `Universidad alcance ${tag}`, shortName: `UA${tag}` },
      select: { id: true },
    }));
    const author = await createUser(prisma);
    const suggester = await createUser(prisma);
    for (const key of ['A', 'B'] as const) {
      const faculty = await prisma.faculty.create({
        data: {
          universityId,
          name: `Facultad ${key} ${tag}`,
          shortName: `F${key}`,
        },
        select: { id: true },
      });
      faculties[key] = faculty.id;
      const subject = await prisma.subject.create({
        data: { facultyId: faculty.id, name: `Materia ${key} ${tag}` },
        select: { id: true },
      });
      subjects[key] = subject.id;

      const material = (extra: Record<string, unknown> = {}) =>
        prisma.material.create({
          data: {
            title: `Material ${key}`,
            fileUrl: 'https://drive.example.com/scope',
            fileType: 'pdf',
            fileSize: 10,
            authorId: author.id,
            subjectId: subject.id,
            resourceType: 'PARCIAL',
            ...extra,
          },
          select: { id: true },
        });
      const reported = await material();
      cases[`reported${key}`] = (
        await prisma.moderationCase.create({
          data: {
            kind: 'REPORTS',
            targetType: 'MATERIAL',
            materialId: reported.id,
            targetAuthorId: author.id,
            reports: {
              create: [
                {
                  reporterId: suggester.id,
                  reason: 'OTRO',
                  targetType: 'MATERIAL',
                  materialId: reported.id,
                },
              ],
            },
          },
          select: { id: true },
        })
      ).id;
      const pending = await material({ publicationStatus: 'PENDING_REVIEW' });
      cases[`prior${key}`] = (
        await prisma.moderationCase.create({
          data: {
            kind: 'PRIOR_REVIEW',
            targetType: 'MATERIAL',
            materialId: pending.id,
            targetAuthorId: author.id,
          },
          select: { id: true },
        })
      ).id;

      const corrected = await material();
      suggestions[key] = (
        await prisma.correctionSuggestion.create({
          data: {
            materialId: corrected.id,
            suggesterId: suggester.id,
            field: 'RESOURCE_TYPE',
            currentValue: 'PARCIAL',
            proposedValue: 'FINAL',
            createdAt: new Date(Date.now() - 8 * 86_400_000),
          },
          select: { id: true },
        })
      ).id;
    }

    modA = await createUser(
      prisma,
      'MODERATOR',
      {},
      { faculties: [faculties.A] },
    );
    unassigned = await createUser(prisma, 'MODERATOR', {}, { faculties: [] });
    admin = await createUser(prisma, 'ADMIN');
  });

  afterAll(async () => {
    const subjectIds = Object.values(subjects);
    await prisma.moderationCase.deleteMany({
      where: { material: { subjectId: { in: subjectIds } } },
    });
    await prisma.material.deleteMany({
      where: { subjectId: { in: subjectIds } },
    });
    await prisma.subject.deleteMany({ where: { id: { in: subjectIds } } });
    await prisma.moderatorScope.deleteMany({
      where: { facultyId: { in: Object.values(faculties) } },
    });
    await prisma.faculty.deleteMany({ where: { universityId } });
    await prisma.university.delete({ where: { id: universityId } });
    await app.close();
  });

  const get = (user: E2eUser, path: string) =>
    http()
      .get(`/api/v1/moderation${path}`)
      .set('Authorization', bearer(app, user));
  const queueIds = (queue: Queue) =>
    Object.values(queue)
      .flat()
      .map((item) => item.caseId);
  const suggestionIds = (body: { id: string }[]) => body.map((row) => row.id);

  it('shows a moderator only the casos and revisiones previas of their facultades', async () => {
    const ids = queueIds((await get(modA, '/cases').expect(200)).body as Queue);
    expect(ids).toEqual(
      expect.arrayContaining([cases.reportedA, cases.priorA]),
    );
    expect(ids).not.toContain(cases.reportedB);
    expect(ids).not.toContain(cases.priorB);
  });

  it('answers a caso of another facultad like one that does not exist', async () => {
    const missing = await get(modA, `/cases/${randomUUID()}`).expect(404);
    const other = await get(modA, `/cases/${cases.reportedB}`).expect(404);
    const answer = ({
      statusCode,
      error,
      message,
    }: Record<string, unknown>) => ({
      statusCode,
      error,
      message,
    });
    expect(answer(other.body)).toEqual(answer(missing.body));
    await get(modA, `/cases/${cases.reportedB}/file`).expect(404);

    await http()
      .post(`/api/v1/moderation/cases/${cases.reportedB}/decision`)
      .set('Authorization', bearer(app, modA))
      .send({ decision: 'KEEP_VISIBLE', reason: 'Está bien.' })
      .expect(404);
    await http()
      .post(`/api/v1/moderation/cases/${cases.priorB}/decision`)
      .set('Authorization', bearer(app, modA))
      .send({ decision: 'APPROVE' })
      .expect(404);
    await http()
      .post(`/api/v1/moderation/cases/${cases.reportedB}/reveal-author`)
      .set('Authorization', bearer(app, modA))
      .send({ reason: 'Necesito ver el contexto.' })
      .expect(404);
    expect(
      await prisma.moderationCase.count({
        where: { id: { in: [cases.reportedB, cases.priorB] }, status: 'OPEN' },
      }),
    ).toBe(2);
  });

  it('limits correcciones to the facultad of the material', async () => {
    const ids = suggestionIds(
      (await get(modA, '/corrections').expect(200)).body,
    );
    expect(ids).toContain(suggestions.A);
    expect(ids).not.toContain(suggestions.B);
    await http()
      .post(`/api/v1/moderation/corrections/${suggestions.B}/accept`)
      .set('Authorization', bearer(app, modA))
      .expect(404);
  });

  it('gives a moderator without facultades nothing to do', async () => {
    expect(
      queueIds((await get(unassigned, '/cases').expect(200)).body),
    ).toEqual([]);
    expect((await get(unassigned, '/corrections').expect(200)).body).toEqual(
      [],
    );
    const summary = (await get(unassigned, '/summary').expect(200)).body;
    expect(summary).toMatchObject({
      openCases: 0,
      overdueCases: 0,
      pendingCorrections: 0,
      pendingAppeals: 0,
      scope: { all: false, faculties: [] },
    });
  });

  it('shows an admin every facultad and filters by one', async () => {
    const all = queueIds((await get(admin, '/cases').expect(200)).body);
    expect(all).toEqual(expect.arrayContaining(Object.values(cases)));

    const onlyB = queueIds(
      (await get(admin, `/cases?facultyId=${faculties.B}`).expect(200)).body,
    );
    expect(onlyB).toEqual(
      expect.arrayContaining([cases.reportedB, cases.priorB]),
    );
    expect(onlyB).not.toContain(cases.reportedA);

    const corrections = suggestionIds(
      (await get(admin, `/corrections?facultyId=${faculties.B}`).expect(200))
        .body,
    );
    expect(corrections).toContain(suggestions.B);
    expect(corrections).not.toContain(suggestions.A);

    const summary = (
      await get(admin, `/summary?facultyId=${faculties.B}`).expect(200)
    ).body;
    expect(summary.openCases).toBe(2);
    expect(summary.pendingCorrections).toBe(1);
  });

  it('counts only the moderator facultades in the summary', async () => {
    const mine = (await get(modA, '/summary').expect(200)).body;
    const theirs = (
      await get(admin, `/summary?facultyId=${faculties.A}`).expect(200)
    ).body;
    expect(mine.openCases).toBe(2);
    expect(theirs.openCases).toBe(2);
    expect(mine.scope.all).toBe(false);
    expect(mine.scope.faculties).toEqual([
      expect.objectContaining({ id: faculties.A, shortName: 'FA' }),
    ]);
  });
});
