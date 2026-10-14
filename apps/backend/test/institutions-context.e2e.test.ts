import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { normalizeSearchKey } from '../src/common/search/search-key';
import {
  FI_UNJU_FACULTY_ID,
  UNJU_UNIVERSITY_ID,
} from '../src/modules/institutions/institutions.constants';
import type { PrismaService } from '../src/prisma/prisma.service';
import { bearer, createE2eApp, createUser } from './support/e2e-app';

const FI = {
  id: FI_UNJU_FACULTY_ID,
  name: 'Facultad de Ingeniería',
  shortName: 'FI',
  university: {
    id: UNJU_UNIVERSITY_ID,
    name: 'Universidad Nacional de Jujuy',
    shortName: 'UNJU',
  },
};

/** The facultad wherever a carrera is shown (openspec academic-resources/discovery). */
describe('facultad in discovery, materia context and moderation (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  const tag = randomUUID().slice(0, 6);
  let careerId: string;
  let planId: string;
  let subjectCode: string;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    const career = await prisma.career.create({
      data: {
        status: 'PUBLISHED',
        facultyId: FI_UNJU_FACULTY_ID,
        name: `Carrera contexto ${tag}`,
        code: `K${tag}`,
        studyPlans: {
          create: [{ name: 'Plan A', code: `A${tag}`, duration: 5 }],
        },
      },
      select: {
        id: true,
        studyPlans: { select: { id: true, name: true } },
      },
    });
    careerId = career.id;
    planId = career.studyPlans[0].id;
    subjectCode = `M${tag}`;
    await prisma.subject.create({
      data: {
        facultyId: FI_UNJU_FACULTY_ID,
        code: subjectCode,
        name: `Materia contexto ${tag}`,
        searchKey: normalizeSearchKey(`Materia contexto ${tag}`, subjectCode),
        studyPlans: {
          create: [{ studyPlanId: planId, year: 2, semester: 1 }],
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.userStudyPlan.deleteMany({
      where: { studyPlan: { careerId } },
    });
    await prisma.studyPlanSubject.deleteMany({
      where: { studyPlan: { careerId } },
    });
    await prisma.subject.deleteMany({ where: { code: subjectCode } });
    await prisma.studyPlan.deleteMany({ where: { careerId } });
    await prisma.career.delete({ where: { id: careerId } });
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  it('includes the facultad in a materia’s plan placements', async () => {
    const { body } = await http()
      .get(`/api/v1/subjects/${subjectCode}`)
      .expect(200);

    expect(body.faculty).toEqual(FI);
    expect(body.studyPlans).toEqual([
      expect.objectContaining({
        year: 2,
        semester: 1,
        studyPlan: expect.objectContaining({
          career: expect.objectContaining({
            name: `Carrera contexto ${tag}`,
            faculty: FI,
          }),
        }),
      }),
    ]);
  });

  it('names the facultad of a materia suggested by search', async () => {
    const { body } = await http()
      .get(
        `/api/v1/discovery/suggestions?q=${encodeURIComponent(`Materia contexto ${tag}`)}`,
      )
      .expect(200);

    expect(body.subjects).toEqual([
      expect.objectContaining({ code: subjectCode, faculty: FI }),
    ]);
  });

  it('shows moderators the carrera with its facultad, preferring an active plan', async () => {
    const moderator = await createUser(prisma, 'MODERATOR');
    const admin = await createUser(prisma, 'ADMIN');
    const student = await createUser(prisma);
    const file = async (viewer = moderator) =>
      (
        await http()
          .get(`/api/v1/moderation/users/${student.id}`)
          .set('Authorization', bearer(app, viewer))
          .expect(200)
      ).body;

    // Without a carrera only an admin can open the account (moderation/scope).
    expect((await file(admin)).career).toBeNull();

    await prisma.userStudyPlan.create({
      data: {
        userId: student.id,
        studyPlanId: planId,
        status: 'COMPLETED',
      },
    });
    expect((await file()).career).toBe(`Carrera contexto ${tag} · FI (UNJU)`);

    const other = await prisma.career.create({
      data: {
        status: 'PUBLISHED',
        facultyId: FI_UNJU_FACULTY_ID,
        name: `Carrera activa ${tag}`,
        code: `Z${tag}`,
        studyPlans: { create: [{ name: 'Plan', code: 'P', duration: 5 }] },
      },
      select: { id: true, studyPlans: { select: { id: true } } },
    });
    try {
      await prisma.userStudyPlan.create({
        data: {
          userId: student.id,
          studyPlanId: other.studyPlans[0].id,
          status: 'ACTIVE',
        },
      });
      expect((await file()).career).toBe(`Carrera activa ${tag} · FI (UNJU)`);
    } finally {
      await prisma.userStudyPlan.deleteMany({
        where: { studyPlan: { careerId: other.id } },
      });
      await prisma.studyPlan.deleteMany({ where: { careerId: other.id } });
      await prisma.career.delete({ where: { id: other.id } });
    }
  });
});
