import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  FI_UNJU_FACULTY_ID,
  UNJU_UNIVERSITY_ID,
} from '../src/modules/institutions/institutions.constants';
import type { PrismaService } from '../src/prisma/prisma.service';
import { createE2eApp } from './support/e2e-app';

type PlanNode = { id: string; name: string; code: string };
type CareerNode = {
  id: string;
  name: string;
  code: string;
  studyPlans: PlanNode[];
};
type FacultyNode = {
  id: string;
  name: string;
  shortName: string;
  careers: CareerNode[];
};
type UniversityNode = {
  id: string;
  name: string;
  shortName: string;
  faculties: FacultyNode[];
};

/** Public institutional catalog (openspec academic-structure/institutions). */
describe('GET /institutions (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  const tag = randomUUID().slice(0, 6);
  const ids = {
    university: randomUUID(),
    agrarias: randomUUID(),
    economicas: randomUUID(),
    agronomia: randomUUID(),
    contador: randomUUID(),
    administracion: randomUUID(),
  };

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());

    // A universidad of its own, so other e2e data never changes what we assert.
    await prisma.university.create({
      data: {
        id: ids.university,
        name: `Universidad e2e ${tag}`,
        shortName: `U${tag}`,
      },
    });
    // Inserted out of order to prove the catalog sorts by name.
    await prisma.faculty.create({
      data: {
        id: ids.economicas,
        universityId: ids.university,
        name: 'Facultad de Ciencias Económicas',
        shortName: 'FCE',
      },
    });
    await prisma.faculty.create({
      data: {
        id: ids.agrarias,
        universityId: ids.university,
        name: 'Facultad de Ciencias Agrarias',
        shortName: 'FCA',
      },
    });
    await prisma.career.create({
      data: {
        id: ids.contador,
        facultyId: ids.economicas,
        name: 'Contador Público',
        code: 'CP',
        studyPlans: {
          create: [
            { name: 'Plan 2024', code: 'CP-2024', duration: 5 },
            { name: 'Plan 2012', code: 'CP-2012', duration: 5 },
          ],
        },
      },
    });
    await prisma.career.create({
      data: {
        id: ids.administracion,
        facultyId: ids.economicas,
        name: 'Administración',
        code: 'LA',
      },
    });
    // Same code as the FI carrera: unique only within its facultad.
    await prisma.career.create({
      data: {
        id: ids.agronomia,
        facultyId: ids.agrarias,
        name: 'Ingeniería Agronómica',
        code: 'II',
        studyPlans: {
          create: [{ name: 'Plan 2020', code: 'IA-2020', duration: 5 }],
        },
      },
    });
  });

  afterAll(async () => {
    const careerIds = [ids.contador, ids.administracion, ids.agronomia];
    await prisma.studyPlan.deleteMany({
      where: { careerId: { in: careerIds } },
    });
    await prisma.career.deleteMany({ where: { id: { in: careerIds } } });
    await prisma.faculty.deleteMany({
      where: { universityId: ids.university },
    });
    await prisma.university.delete({ where: { id: ids.university } });
    await app.close();
  });

  const catalog = async () => {
    const { body } = await request(app.getHttpServer())
      .get('/api/v1/institutions')
      .expect(200);
    return body as UniversityNode[];
  };

  it('is public and includes UNJU with its Facultad de Ingeniería', async () => {
    const universities = await catalog();
    const unju = universities.find((u) => u.id === UNJU_UNIVERSITY_ID);

    expect(unju).toMatchObject({
      name: 'Universidad Nacional de Jujuy',
      shortName: 'UNJU',
    });
    expect(unju?.faculties.map((f) => f.id)).toContain(FI_UNJU_FACULTY_ID);
  });

  it('nests facultades, carreras and plans, sorted by name at every level', async () => {
    const universities = await catalog();
    const names = universities.map((u) => u.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'es')));

    const mine = universities.find((u) => u.id === ids.university);
    expect(mine).toEqual({
      id: ids.university,
      name: `Universidad e2e ${tag}`,
      shortName: `U${tag}`,
      faculties: [
        {
          id: ids.agrarias,
          name: 'Facultad de Ciencias Agrarias',
          shortName: 'FCA',
          careers: [
            {
              id: ids.agronomia,
              name: 'Ingeniería Agronómica',
              code: 'II',
              studyPlans: [
                { id: expect.any(String), name: 'Plan 2020', code: 'IA-2020' },
              ],
            },
          ],
        },
        {
          id: ids.economicas,
          name: 'Facultad de Ciencias Económicas',
          shortName: 'FCE',
          careers: [
            {
              id: ids.administracion,
              name: 'Administración',
              code: 'LA',
              studyPlans: [],
            },
            {
              id: ids.contador,
              name: 'Contador Público',
              code: 'CP',
              studyPlans: [
                { id: expect.any(String), name: 'Plan 2012', code: 'CP-2012' },
                { id: expect.any(String), name: 'Plan 2024', code: 'CP-2024' },
              ],
            },
          ],
        },
      ],
    });
  });

  it('lists each carrera only under its own facultad', async () => {
    const universities = await catalog();
    const placements = universities.flatMap((u) =>
      u.faculties.flatMap((f) => f.careers.map((c) => [c.id, f.id])),
    );

    expect(placements.filter(([career]) => career === ids.agronomia)).toEqual([
      [ids.agronomia, ids.agrarias],
    ]);
    expect(placements.filter(([career]) => career === ids.contador)).toEqual([
      [ids.contador, ids.economicas],
    ]);
  });
});
