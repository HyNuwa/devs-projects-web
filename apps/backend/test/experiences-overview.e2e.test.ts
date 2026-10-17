import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PrismaService } from '../src/prisma/prisma.service';
import { createE2eApp, createUser, type E2eUser } from './support/e2e-app';

const DAY = 86_400_000;
const MIN = 60_000;

type OverviewItem = {
  subject: { id: string; code: string | null; name: string };
  placement: {
    careerId: string;
    careerName: string;
    year: number | null;
    semester: number | null;
  } | null;
  total: number;
  recentCount: number;
  latestAt: string;
  promotion: { percent: number | null; promoted: number; answered: number };
  approval: { percent: number | null; approved: number; answered: number };
  topDifficulty: string | null;
};

type Overview = {
  scope: {
    facultyId: string | null;
    careerId: string | null;
    year: number | null;
    kind: string | null;
  };
  mostCommented: { window: string; items: OverviewItem[] };
  recent: (
    | {
        kind: 'review';
        review: {
          id: string;
          subject: { id: string };
          author: { username: string };
        };
      }
    | { kind: 'exam'; exam: { id: string } }
  )[];
};

/** «Materias más comentadas» and «Recién publicadas» (openspec academic-community/experiences). */
describe('Experiencias: overview (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let author: E2eUser;
  const http = () => request(app.getHttpServer());
  const tag = randomUUID().slice(0, 6).toUpperCase();

  let universityId: string;
  let facultyId: string;
  let otherFacultyId: string;
  let quietFacultyId: string;
  let careerAId: string;
  let careerBId: string;
  let emptyCareerId: string;
  let draftCareerId: string;
  const s: Record<string, string> = {};
  const reviewIds: string[] = [];
  const examIds: string[] = [];
  const subjectIds: string[] = [];
  const careerIds: string[] = [];
  const facultyIds: string[] = [];

  const ago = (minutes: number) => new Date(Date.now() - minutes * MIN);
  const daysAgo = (days: number) => new Date(Date.now() - days * DAY);

  const review = async (
    subjectId: string,
    data: Record<string, unknown> = {},
  ) => {
    const row = await prisma.courseReview.create({
      data: { userId: author.id, subjectId, recommendation: 4, ...data },
      select: { id: true },
    });
    reviewIds.push(row.id);
    return row.id;
  };

  const exam = async (
    subjectId: string,
    data: Record<string, unknown> = {},
  ) => {
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
    return row.id;
  };

  const overview = async (query = '') =>
    (
      await http()
        .get(`/api/v1/discovery/experiences/overview${query}`)
        .expect(200)
    ).body as Overview;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    author = await createUser(prisma, 'USER');

    ({ id: universityId } = await prisma.university.create({
      data: { name: `Universidad exp ${tag}`, shortName: `UX${tag}` },
      select: { id: true },
    }));
    const [main, other, quiet] = await Promise.all([
      prisma.faculty.create({
        data: {
          universityId,
          name: `Principal ${tag}`,
          shortName: `PA${tag}`,
        },
        select: { id: true },
      }),
      prisma.faculty.create({
        data: {
          universityId,
          name: `Otra ${tag}`,
          shortName: `OB${tag}`,
        },
        select: { id: true },
      }),
      prisma.faculty.create({
        data: {
          universityId,
          name: `Quieta ${tag}`,
          shortName: `QC${tag}`,
        },
        select: { id: true },
      }),
    ]);
    facultyId = main.id;
    otherFacultyId = other.id;
    quietFacultyId = quiet.id;
    facultyIds.push(main.id, other.id, quiet.id);

    for (const [key, name] of [
      ['s1', `Algoritmos ${tag}`],
      ['s2', `Bases ${tag}`],
      ['s3', `Cálculo optativa ${tag}`],
      ['s4', `Dibujo ${tag}`],
      ['s5', `Estática vieja ${tag}`],
      ['s6', `Física ${tag}`],
      ['s7', `Geometría ${tag}`],
      ['s8', `Hidráulica ${tag}`],
    ] as const) {
      const subject = await prisma.subject.create({
        data: { facultyId, code: `${key.toUpperCase()}-${tag}`, name },
        select: { id: true },
      });
      s[key] = subject.id;
      subjectIds.push(subject.id);
    }
    const otherSubject = await prisma.subject.create({
      data: {
        facultyId: otherFacultyId,
        code: `OX-${tag}`,
        name: `Otra materia ${tag}`,
      },
      select: { id: true },
    });
    subjectIds.push(otherSubject.id);
    const quiet1 = await prisma.subject.create({
      data: {
        facultyId: quietFacultyId,
        code: `Q1-${tag}`,
        name: `Quieta chica ${tag}`,
      },
      select: { id: true },
    });
    const quiet2 = await prisma.subject.create({
      data: {
        facultyId: quietFacultyId,
        code: `Q2-${tag}`,
        name: `Quieta grande ${tag}`,
      },
      select: { id: true },
    });
    subjectIds.push(quiet1.id, quiet2.id);

    // Carrera A (alphabetically first) and B, each with one plan; carrera S/V
    // (empty) has no materias.
    const careers = await Promise.all([
      prisma.career.create({
        data: {
          status: 'PUBLISHED',
          facultyId,
          name: `A carrera ${tag}`,
          code: `CA${tag}`,
          studyPlans: {
            create: [{ name: 'Plan', code: `CA${tag}-1`, duration: 5 }],
          },
        },
        select: { id: true, studyPlans: { select: { id: true } } },
      }),
      prisma.career.create({
        data: {
          status: 'PUBLISHED',
          facultyId,
          name: `B carrera ${tag}`,
          code: `CB${tag}`,
          studyPlans: {
            create: [{ name: 'Plan', code: `CB${tag}-1`, duration: 5 }],
          },
        },
        select: { id: true, studyPlans: { select: { id: true } } },
      }),
      prisma.career.create({
        data: {
          status: 'PUBLISHED',
          facultyId,
          name: `Vacía carrera ${tag}`,
          code: `CV${tag}`,
          studyPlans: {
            create: [{ name: 'Plan', code: `CV${tag}-1`, duration: 5 }],
          },
        },
        select: { id: true },
      }),
    ]);
    careerAId = careers[0].id;
    careerBId = careers[1].id;
    emptyCareerId = careers[2].id;
    careerIds.push(...careers.map((c) => c.id));
    const planA = careers[0].studyPlans[0].id;
    const planB = careers[1].studyPlans[0].id;

    const draft = await prisma.career.create({
      data: {
        status: 'DRAFT',
        facultyId,
        name: `Borrador carrera ${tag}`,
        code: `CD${tag}`,
        studyPlans: {
          create: [{ name: 'Plan', code: `CD${tag}-1`, duration: 5 }],
        },
      },
      select: { id: true, studyPlans: { select: { id: true } } },
    });
    draftCareerId = draft.id;
    careerIds.push(draft.id);

    await prisma.studyPlanSubject.createMany({
      data: [
        // s1 is año 2 in carrera A and año 1 in carrera B.
        { studyPlanId: planA, subjectId: s.s1, year: 2, semester: 1 },
        { studyPlanId: planB, subjectId: s.s1, year: 1, semester: 2 },
        { studyPlanId: planA, subjectId: s.s2, year: 1, semester: 2 },
        {
          studyPlanId: draft.studyPlans[0].id,
          subjectId: s.s2,
          year: 2,
          semester: 1,
        },
        // s3 is an optativa: no año, no cuatrimestre.
        { studyPlanId: planA, subjectId: s.s3, year: null, semester: null },
        { studyPlanId: planB, subjectId: s.s4, year: 3, semester: 1 },
      ],
    });

    // s1: 5 recent reseñas (3 promo, 2 regular) + 3 recent finales + 1 old reseña.
    await review(s.s1, {
      createdAt: ago(10),
      condition: 'PROMO',
      difficulty: 'ALTA',
    });
    await review(s.s1, {
      createdAt: ago(20),
      condition: 'PROMO',
      difficulty: 'ALTA',
    });
    await review(s.s1, {
      createdAt: ago(30),
      condition: 'PROMO',
      difficulty: 'MEDIA',
    });
    await review(s.s1, {
      createdAt: ago(40),
      condition: 'REGULAR',
      difficulty: 'ALTA',
      isAnonymous: true,
    });
    await review(s.s1, {
      createdAt: ago(50),
      condition: 'REGULAR',
      difficulty: null,
    });
    await exam(s.s1, {
      createdAt: ago(15),
      outcome: 'APROBADO',
      difficulty: 'MEDIA',
    });
    await exam(s.s1, {
      createdAt: ago(25),
      outcome: 'APROBADO',
      difficulty: 'MEDIA',
    });
    await exam(s.s1, {
      createdAt: ago(35),
      outcome: 'DESAPROBADO',
      difficulty: 'MEDIA',
    });
    await review(s.s1, { createdAt: daysAgo(200), condition: 'PROMO' });
    // Out of public view: never counted, never listed.
    await review(s.s1, {
      createdAt: ago(5),
      publicationStatus: 'PENDING_REVIEW',
    });
    await exam(s.s1, {
      createdAt: ago(5),
      outcome: 'APROBADO',
      publicationStatus: 'REMOVED',
    });

    // s2: 3 recent reseñas. s3: 5 recent finales. s4: 3 recent reseñas.
    // s5: only old reseñas, so it never qualifies for the window.
    await review(s.s2, {
      createdAt: ago(60),
      condition: 'LIBRE',
      difficulty: 'ALTA',
    });
    await review(s.s2, {
      createdAt: ago(70),
      condition: 'LIBRE',
      difficulty: 'ALTA',
    });
    await review(s.s2, { createdAt: ago(80), condition: 'PROMO' });
    for (const [i, outcome] of (
      ['APROBADO', 'APROBADO', 'APROBADO', 'APROBADO', 'DESAPROBADO'] as const
    ).entries()) {
      await exam(s.s3, {
        createdAt: ago(100 + i * 10),
        outcome,
        format: 'ORAL',
      });
    }
    await review(s.s4, { createdAt: ago(90), condition: 'PROMO' });
    await review(s.s4, { createdAt: ago(110), condition: 'PROMO' });
    await review(s.s4, { createdAt: ago(120), condition: 'REGULAR' });
    await review(s.s5, { createdAt: daysAgo(200) });
    await review(s.s5, { createdAt: daysAgo(210) });
    await review(s.s5, { createdAt: daysAgo(220) });
    await review(s.s5, { createdAt: daysAgo(230) });

    await exam(s.s2, { createdAt: ago(200), difficulty: 'MEDIA' });

    await review(s.s4, { createdAt: daysAgo(200) });
    for (const subjectId of [s.s6, s.s7, s.s8]) {
      await review(subjectId, { createdAt: ago(300) });
      await review(subjectId, { createdAt: ago(310) });
      await review(subjectId, { createdAt: ago(320) });
    }

    // Another facultad: recent enough to qualify, but out of the F1 scope.
    await review(otherSubject.id, { createdAt: ago(10) });
    await review(otherSubject.id, { createdAt: ago(20) });
    await review(otherSubject.id, { createdAt: ago(30) });
    await review(otherSubject.id, { createdAt: ago(40) });

    // A quiet facultad where nothing is recent, for the ALL_TIME fallback.
    await review(quiet1.id, { createdAt: daysAgo(200) });
    await review(quiet1.id, { createdAt: daysAgo(210) });
    await review(quiet2.id, { createdAt: daysAgo(200) });
    await review(quiet2.id, { createdAt: daysAgo(210) });
    await review(quiet2.id, { createdAt: daysAgo(220) });
    await exam(quiet2.id, { createdAt: daysAgo(230) });
    await exam(quiet2.id, { createdAt: daysAgo(240) });
  });

  afterAll(async () => {
    await prisma.courseReview.deleteMany({ where: { id: { in: reviewIds } } });
    await prisma.examExperience.deleteMany({
      where: { id: { in: examIds } },
    });
    await prisma.studyPlanSubject.deleteMany({
      where: { subjectId: { in: subjectIds } },
    });
    await prisma.subject.deleteMany({ where: { id: { in: subjectIds } } });
    await prisma.career.deleteMany({ where: { id: { in: careerIds } } });
    await prisma.faculty.deleteMany({ where: { id: { in: facultyIds } } });
    await prisma.university.delete({ where: { id: universityId } });
    await prisma.user.delete({ where: { id: author.id } });
    await app.close();
  });

  it('ranks materias of the facultad by the 120-day count, then total, then name', async () => {
    const body = await overview(`?facultyId=${facultyId}`);

    expect(body.scope).toEqual({
      facultyId,
      careerId: null,
      year: null,
      kind: null,
    });
    expect(body.mostCommented.window).toBe('LAST_120_DAYS');
    expect(body.mostCommented.items.map((i) => i.subject.id)).toEqual([
      s.s1,
      s.s3,
      s.s2,
      s.s4,
      s.s6,
      s.s7,
    ]);
    expect(body.mostCommented.items).toHaveLength(6);
    expect(body.mostCommented.items[3]).toMatchObject({
      recentCount: 3,
      total: 4,
    });
    expect(body.mostCommented.items[4]).toMatchObject({
      recentCount: 3,
      total: 3,
    });
    const first = body.mostCommented.items[0];
    expect(first).toMatchObject({
      total: 9,
      recentCount: 8,
      promotion: { percent: 67, promoted: 4, answered: 6 },
      approval: { percent: null, approved: 2, answered: 3 },
      topDifficulty: 'ALTA',
    });
    // The label is the first carrera by name when no chip is active.
    expect(first.placement).toEqual({
      careerId: careerAId,
      careerName: `A carrera ${tag}`,
      year: 2,
      semester: 1,
    });
    expect(body.mostCommented.items[1].placement).toEqual({
      careerId: careerAId,
      careerName: `A carrera ${tag}`,
      year: null,
      semester: null,
    });
  });

  it('narrows by año in any carrera of the facultad and never matches optativas', async () => {
    const body = await overview(`?facultyId=${facultyId}&year=1`);

    expect(body.scope.year).toBe(1);
    // s1 matches through its carrera-B placement; s3 is an optativa and stays out.
    expect(body.mostCommented.items.map((i) => i.subject.id)).toEqual([
      s.s1,
      s.s2,
    ]);
  });

  it('excludes placements in carreras en borrador from año and carrera filters', async () => {
    const byYear = await overview(`?facultyId=${facultyId}&year=2`);
    expect(byYear.mostCommented.items.map((item) => item.subject.id)).toEqual([
      s.s1,
    ]);
    expect(
      byYear.recent.every(
        (entry) => entry.kind !== 'review' || entry.review.subject.id !== s.s2,
      ),
    ).toBe(true);

    const byDraft = await overview(
      `?facultyId=${facultyId}&careerId=${draftCareerId}`,
    );
    expect(byDraft.mostCommented.items).toEqual([]);
    expect(byDraft.recent).toEqual([]);
  });

  it('narrows by carrera, and by carrera plus año, and labels with the active carrera', async () => {
    const byCareer = await overview(
      `?facultyId=${facultyId}&careerId=${careerBId}`,
    );
    expect(byCareer.mostCommented.items.map((i) => i.subject.id)).toEqual([
      s.s1,
      s.s4,
    ]);
    expect(byCareer.mostCommented.items[0].placement).toEqual({
      careerId: careerBId,
      careerName: `B carrera ${tag}`,
      year: 1,
      semester: 2,
    });

    const byBoth = await overview(
      `?facultyId=${facultyId}&careerId=${careerAId}&year=2`,
    );
    expect(byBoth.mostCommented.items.map((i) => i.subject.id)).toEqual([s.s1]);
  });

  it('keeps difficulty separate by experience type and applies the sample minimum', async () => {
    const body = await overview(`?facultyId=${facultyId}`);
    expect(
      body.mostCommented.items.find((item) => item.subject.id === s.s1)
        ?.topDifficulty,
    ).toBe('ALTA');
    expect(
      body.mostCommented.items.find((item) => item.subject.id === s.s2)
        ?.topDifficulty,
    ).toBeNull();
    const exams = await overview(`?facultyId=${facultyId}&kind=exams`);
    expect(
      exams.mostCommented.items.find((item) => item.subject.id === s.s1)
        ?.topDifficulty,
    ).toBe('MEDIA');
    const reviews = await overview(`?facultyId=${facultyId}&kind=reviews`);
    expect(
      reviews.mostCommented.items.find((item) => item.subject.id === s.s1)
        ?.topDifficulty,
    ).toBe('ALTA');
  });

  it('drops reseñas from every figure with kind=exams', async () => {
    const body = await overview(`?facultyId=${facultyId}&kind=exams`);

    expect(body.scope.kind).toBe('exams');
    expect(body.mostCommented.items.map((i) => i.subject.id)).toEqual([
      s.s3,
      s.s1,
    ]);
    const top = body.mostCommented.items[0];
    expect(top.promotion).toEqual({ percent: null, promoted: 0, answered: 0 });
    expect(top.approval).toEqual({ percent: 80, approved: 4, answered: 5 });
    expect(top.recentCount).toBe(5);
    expect(body.recent.every((entry) => entry.kind === 'exam')).toBe(true);
  });

  it('drops finales with kind=reviews', async () => {
    const body = await overview(`?facultyId=${facultyId}&kind=reviews`);

    expect(body.mostCommented.items.map((i) => i.subject.id)).toEqual([
      s.s1,
      s.s4,
      s.s2,
      s.s6,
      s.s7,
      s.s8,
    ]);
    expect(body.mostCommented.items[0].approval).toEqual({
      percent: null,
      approved: 0,
      answered: 0,
    });
    expect(body.recent.every((entry) => entry.kind === 'review')).toBe(true);
  });

  it('falls back to ALL_TIME when no materia reaches three in the window', async () => {
    const body = await overview(`?facultyId=${quietFacultyId}`);

    expect(body.mostCommented.window).toBe('ALL_TIME');
    expect(body.mostCommented.items.map((i) => i.subject.name)).toEqual([
      `Quieta grande ${tag}`,
      `Quieta chica ${tag}`,
    ]);
    expect(body.mostCommented.items[0].total).toBe(5);
    // Seven old entries exist; recent still caps at six, oldest included.
    expect(body.recent).toHaveLength(6);
  });

  it('returns an empty section for a context without experiencias', async () => {
    const body = await overview(
      `?facultyId=${facultyId}&careerId=${emptyCareerId}`,
    );

    expect(body.mostCommented.window).toBe('ALL_TIME');
    expect(body.mostCommented.items).toEqual([]);
    expect(body.recent).toEqual([]);
  });

  it('interleaves reseñas and finales by publication date in recent', async () => {
    const body = await overview(`?facultyId=${facultyId}`);

    expect(body.recent.map((entry) => entry.kind)).toEqual([
      'review',
      'exam',
      'review',
      'exam',
      'review',
      'exam',
    ]);
    const first = body.recent[0];
    expect(first.kind).toBe('review');
    if (first.kind === 'review') {
      expect(first.review.subject.id).toBe(s.s1);
      expect(first.review.author.username).toBeDefined();
    }
  });

  it('keeps the same card figures as the materia summary endpoint', async () => {
    const summary = (
      await http()
        .get(`/api/v1/discovery/subjects/S1-${tag}/experiences-summary`)
        .expect(200)
    ).body as {
      reviews: {
        results: {
          answered: number;
          promo: number;
          percents: { promo: number } | null;
        };
      };
      exams: {
        outcomes: {
          answered: number;
          aprobado: number;
          percent: number | null;
        };
      };
    };
    const body = await overview(`?facultyId=${facultyId}`);
    const card = body.mostCommented.items[0];

    expect(card.promotion).toEqual({
      percent: summary.reviews.results.percents?.promo ?? null,
      promoted: summary.reviews.results.promo,
      answered: summary.reviews.results.answered,
    });
    expect(card.approval).toEqual({
      percent: summary.exams.outcomes.percent,
      approved: summary.exams.outcomes.aprobado,
      answered: summary.exams.outcomes.answered,
    });
  });

  it('includes materias from different facultades without a facultad scope', async () => {
    // The unscoped ranking sees the whole e2e database, so two materias of two
    // new facultades get more recent experiencias than any other fixture.
    const busiest: string[] = [];
    for (const [i, count] of [30, 29].entries()) {
      const faculty = await prisma.faculty.create({
        data: {
          universityId,
          name: `Concurrida ${i} ${tag}`,
          shortName: `CC${i}${tag}`,
        },
        select: { id: true },
      });
      facultyIds.push(faculty.id);
      const subject = await prisma.subject.create({
        data: {
          facultyId: faculty.id,
          code: `CC${i}-${tag}`,
          name: `Concurrida ${i} ${tag}`,
        },
        select: { id: true },
      });
      subjectIds.push(subject.id);
      busiest.push(subject.id);
      for (let n = 0; n < count; n += 1) {
        await review(subject.id, { createdAt: ago(400 + n) });
      }
    }

    const body = await overview();

    expect(body.scope).toEqual({
      facultyId: null,
      careerId: null,
      year: null,
      kind: null,
    });
    const ids = body.mostCommented.items.map((item) => item.subject.id);
    expect(ids.slice(0, 2)).toEqual(busiest);
    expect(body.mostCommented.window).toBe('LAST_120_DAYS');
    expect(body.mostCommented.items.length).toBeLessThanOrEqual(6);
    expect(body.recent.length).toBeLessThanOrEqual(6);
  });

  it('rejects invalid query values with 400', async () => {
    await http()
      .get('/api/v1/discovery/experiences/overview?kind=pepito')
      .expect(400);
    await http()
      .get('/api/v1/discovery/experiences/overview?year=abc')
      .expect(400);
    await http()
      .get('/api/v1/discovery/experiences/overview?year=0')
      .expect(400);
    await http()
      .get('/api/v1/discovery/experiences/overview?year=11')
      .expect(400);
    await http()
      .get('/api/v1/discovery/experiences/overview?facultyId=nope')
      .expect(400);
  });
});
