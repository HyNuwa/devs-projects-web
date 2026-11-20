import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { PrismaService } from '../src/prisma/prisma.service';
import { createE2eApp, createUser } from './support/e2e-app';

type Level = { id: string; name: string; shortName: string; slug: string };

/** Browsing by institution (openspec academic-structure/browsing). */
describe('Browse the catalog (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  const http = () => request(app.getHttpServer());

  const tag = randomUUID().slice(0, 6).toUpperCase();
  const uniShort = `UB${tag}`;
  let universityId: string;
  let fullFacultyId: string;
  let careerAId: string;
  const codes = [`B1${tag}`, `B2${tag}`, `B3${tag}`];
  const subjectIds: string[] = [];

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    const author = await createUser(prisma, 'USER');

    ({ id: universityId } = await prisma.university.create({
      data: { name: `Universidad browse ${tag}`, shortName: uniShort },
      select: { id: true },
    }));
    // «Vacía» has no carreras; «Llena» has two, one of them without materias.
    await prisma.faculty.create({
      data: { universityId, name: `A vacía ${tag}`, shortName: 'VAC' },
    });
    const full = await prisma.faculty.create({
      data: { universityId, name: `Z llena ${tag}`, shortName: 'LLE' },
      select: { id: true },
    });
    fullFacultyId = full.id;

    for (const [i, code] of codes.entries()) {
      const subject = await prisma.subject.create({
        data: { facultyId: full.id, code, name: `Materia ${i + 1} ${tag}` },
        select: { id: true },
      });
      subjectIds.push(subject.id);
    }
    const careerA = await prisma.career.create({
      data: {
        status: 'PUBLISHED',
        facultyId: full.id,
        name: 'Ingeniería A',
        code: 'IA',
        planUrl: 'https://plan.example.edu.ar/ia',
        studyPlans: {
          create: [
            {
              name: 'Plan',
              code: 'IA-1',
              duration: 5,
              subjects: {
                create: [
                  {
                    subjectId: subjectIds[2],
                    year: 2,
                    semester: 1,
                    credits: 6,
                  },
                  {
                    subjectId: subjectIds[1],
                    year: 1,
                    semester: 2,
                    credits: 8,
                  },
                  {
                    subjectId: subjectIds[0],
                    year: 1,
                    semester: 1,
                    credits: 8,
                  },
                ],
              },
            },
          ],
        },
      },
      select: { id: true },
    });
    careerAId = careerA.id;
    await prisma.career.create({
      data: {
        status: 'PUBLISHED',
        facultyId: full.id,
        name: 'Ingeniería B',
        code: 'IB',
        studyPlans: { create: [{ name: 'Plan', code: 'IB-1', duration: 3 }] },
      },
    });

    // Counted as the materia page lists them: two published and one hidden past
    // its review window; not a removed, a deleted nor a freshly hidden one.
    const material = (subjectId: string, extra: Record<string, unknown> = {}) =>
      prisma.material.create({
        data: {
          title: 'Parcial',
          fileUrl: 'https://drive.example.com/browse',
          fileType: 'pdf',
          fileSize: 10,
          authorId: author.id,
          subjectId,
          resourceType: 'PARCIAL',
          ...extra,
        },
      });
    await material(subjectIds[0]);
    await material(subjectIds[2]);
    await material(subjectIds[0], { publicationStatus: 'REMOVED' });
    await material(subjectIds[1], { isDeleted: true });
    const day = 86_400_000;
    await material(subjectIds[1], {
      publicationStatus: 'HIDDEN',
      hiddenAt: new Date(Date.now() - 8 * day),
    });
    await material(subjectIds[1], {
      publicationStatus: 'HIDDEN',
      hiddenAt: new Date(Date.now() - day),
    });
  });

  afterAll(async () => {
    await prisma.material.deleteMany({
      where: { subjectId: { in: subjectIds } },
    });
    await prisma.career.deleteMany({ where: { faculty: { universityId } } });
    await prisma.subject.deleteMany({ where: { id: { in: subjectIds } } });
    await prisma.faculty.deleteMany({ where: { universityId } });
    await prisma.university.delete({ where: { id: universityId } });
    await app.close();
  });

  it('lists universidades by name with slugs and counts, publicly', async () => {
    const res = await http().get('/api/v1/institutions/browse').expect(200);
    const list = res.body as (Level & {
      facultyCount: number;
      materialCount: number;
    })[];
    const mine = list.find((u) => u.id === universityId);
    expect(mine).toMatchObject({
      slug: uniShort.toLowerCase(),
      facultyCount: 2,
      materialCount: 3,
    });
    const names = list.map((u) => u.name);
    const collator = new Intl.Collator('es', {
      sensitivity: 'base',
      numeric: true,
    });
    expect(names).toEqual([...names].sort((a, b) => collator.compare(a, b)));
    expect(mine).not.toHaveProperty('studentCount');
  });

  it('opens a universidad by a case-insensitive slug, facultades with carreras first', async () => {
    const res = await http()
      .get(`/api/v1/institutions/browse/${uniShort.toUpperCase()}`)
      .expect(200);
    expect(res.body.university).toMatchObject({
      id: universityId,
      slug: uniShort.toLowerCase(),
    });
    expect(
      (
        res.body.faculties as (Level & {
          careerCount: number;
          materialCount: number;
        })[]
      ).map((f) => [f.slug, f.careerCount, f.materialCount]),
    ).toEqual([
      ['lle', 2, 3],
      ['vac', 0, 0],
    ]);
  });

  it('opens a facultad with its carreras by name, and an empty one', async () => {
    const res = await http()
      .get(`/api/v1/institutions/browse/${uniShort.toLowerCase()}/lle`)
      .expect(200);
    expect(res.body.faculty).toMatchObject({ id: fullFacultyId, slug: 'lle' });
    expect(
      (
        res.body.careers as {
          slug: string;
          subjectCount: number;
          materialCount: number;
          years: number | null;
        }[]
      ).map((c) => [c.slug, c.subjectCount, c.materialCount, c.years]),
    ).toEqual([
      // «años» is the highest placement year, not the plan's duration:
      // IA places materias up to 2° (duration 5), IB has no subjects (duration 3).
      ['ia', 3, 3, 2],
      ['ib', 0, 0, null],
    ]);

    const empty = await http()
      .get(`/api/v1/institutions/browse/${uniShort.toLowerCase()}/vac`)
      .expect(200);
    expect(empty.body.careers).toEqual([]);
  });

  it('reports null años for a carrera whose placements are all optativas', async () => {
    const subject = await prisma.subject.create({
      data: {
        facultyId: fullFacultyId,
        code: `OP${tag}`,
        name: `Optativa ${tag}`,
      },
      select: { id: true },
    });
    let careerId: string | null = null;

    try {
      ({ id: careerId } = await prisma.career.create({
        data: {
          status: 'PUBLISHED',
          facultyId: fullFacultyId,
          name: 'Ingeniería Optativa',
          code: 'OP',
          studyPlans: {
            create: [
              {
                name: 'Plan',
                code: 'OP-1',
                duration: 4,
                subjects: {
                  // Optativa: the CHECK requires year NULL iff semester NULL.
                  create: [
                    {
                      subjectId: subject.id,
                      year: null,
                      semester: null,
                      credits: 4,
                    },
                  ],
                },
              },
            ],
          },
        },
        select: { id: true },
      }));

      const res = await http()
        .get(`/api/v1/institutions/browse/${uniShort.toLowerCase()}/lle`)
        .expect(200);
      const found = (
        res.body.careers as { slug: string; years: number | null }[]
      ).find((c) => c.slug === 'op');
      expect(found).toBeDefined();
      expect(found?.years).toBeNull();
    } finally {
      if (careerId) await prisma.career.delete({ where: { id: careerId } });
      await prisma.subject.delete({ where: { id: subject.id } });
    }
  });

  it('opens a carrera with its materias by año and cuatrimestre, años, créditos and plan link', async () => {
    const res = await http()
      .get(`/api/v1/institutions/browse/${uniShort.toLowerCase()}/lle/IA`)
      .expect(200);
    expect(res.body.career).toMatchObject({
      id: careerAId,
      name: 'Ingeniería A',
      slug: 'ia',
      planUrl: 'https://plan.example.edu.ar/ia',
      years: 5,
      credits: 22,
    });
    expect(
      (
        res.body.subjects as {
          code: string;
          year: number;
          semester: number;
          materialCount: number;
        }[]
      ).map((s) => [s.code, s.year, s.semester, s.materialCount]),
    ).toEqual([
      [codes[0], 1, 1, 1],
      [codes[1], 1, 2, 1],
      [codes[2], 2, 1, 1],
    ]);
    expect(JSON.stringify(res.body)).not.toMatch(/studyPlan/);

    const empty = await http()
      .get(`/api/v1/institutions/browse/${uniShort.toLowerCase()}/lle/ib`)
      .expect(200);
    expect(empty.body.subjects).toEqual([]);
  });

  it('answers 404 for unknown slugs', async () => {
    await http().get('/api/v1/institutions/browse/nope-x').expect(404);
    await http()
      .get(`/api/v1/institutions/browse/${uniShort}/nope`)
      .expect(404);
    await http()
      .get(`/api/v1/institutions/browse/${uniShort}/lle/nope`)
      .expect(404);
  });

  it('adds the plan link to the catalog', async () => {
    const res = await http().get('/api/v1/institutions').expect(200);
    type Catalog = {
      id: string;
      faculties: { careers: { id: string; planUrl: string | null }[] }[];
    }[];
    const university = (res.body as Catalog).find((u) => u.id === universityId);
    const career = university?.faculties
      .flatMap((f) => f.careers)
      .find((c) => c.id === careerAId);
    expect(career?.planUrl).toBe('https://plan.example.edu.ar/ia');
  });
});
