import type { NestExpressApplication } from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { FI_UNJU_FACULTY_ID } from '../src/modules/institutions/institutions.constants';
import { careersOf, materiaOf } from '../src/modules/ranking/attribution';
import type { PrismaService } from '../src/prisma/prisma.service';
import { createE2eApp, createSubject, createUser } from './support/e2e-app';

/** Attribution of movimientos to materias and carreras (openspec reputation/rankings). */
describe('ranking attribution (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
  });

  const careerIds: string[] = [];

  afterAll(async () => {
    await prisma.career.deleteMany({ where: { id: { in: careerIds } } });
    await app.close();
  });

  const material = (authorId: string, subjectId: string) =>
    prisma.material.create({
      data: {
        title: 'Resumen atribución',
        fileUrl: 'https://drive.example.com/e2e',
        fileType: 'pdf',
        fileSize: BigInt(1000),
        authorId,
        subjectId,
        resourceType: 'RESUMEN',
      },
      select: { id: true },
    });

  it('resolves each reason to the materia of its contribution', async () => {
    const author = await createUser(prisma);
    const reporter = await createUser(prisma);
    const [s1, s2, s3, s4, s5] = await Promise.all(
      Array.from({ length: 5 }, () => createSubject(prisma)),
    );
    const m1 = await material(author.id, s1.id);
    const review = await prisma.courseReview.create({
      data: { userId: author.id, subjectId: s2.id, recommendation: 4 },
      select: { id: true },
    });
    const exam = await prisma.examExperience.create({
      data: {
        userId: author.id,
        subjectId: s3.id,
        year: 2026,
        format: 'ESCRITO',
      },
      select: { id: true },
    });
    const reportedReview = await prisma.courseReview.create({
      data: { userId: author.id, subjectId: s4.id, recommendation: 2 },
      select: { id: true },
    });
    const reviewCase = await prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'COURSE_REVIEW',
        courseReviewId: reportedReview.id,
      },
      select: { id: true },
    });
    const m5 = await material(author.id, s5.id);
    const suggestion = await prisma.correctionSuggestion.create({
      data: {
        materialId: m5.id,
        suggesterId: reporter.id,
        field: 'ACADEMIC_YEAR',
        proposedValue: '2025',
      },
      select: { id: true },
    });

    const result = await materiaOf(prisma, [
      { reason: 'MATERIAL_PUBLISHED', referenceId: m1.id },
      { reason: 'HELPFUL_RECEIVED', referenceId: `${m1.id}:${reporter.id}` },
      {
        reason: 'MATERIAL_PIONEER',
        referenceId: `${s1.id}:RESUMEN:${m1.id}`,
      },
      { reason: 'COURSE_REVIEWED', referenceId: review.id },
      { reason: 'EXAM_EXPERIENCE_SHARED', referenceId: exam.id },
      {
        reason: 'REPORT_CONFIRMED',
        referenceId: `${reviewCase.id}:${reporter.id}`,
      },
      { reason: 'CORRECTION_ACCEPTED', referenceId: suggestion.id },
      { reason: 'GUIDE_CREATED', referenceId: randomUUID() },
      { reason: 'LEGACY_ADJUSTMENT', referenceId: null },
      { reason: 'MATERIAL_PUBLISHED', referenceId: randomUUID() },
    ]);

    expect(result).toEqual([
      s1.id,
      s1.id,
      s1.id,
      s2.id,
      s3.id,
      s4.id,
      s5.id,
      null,
      null,
      null,
    ]);
  });

  it('resolves a confirmed reporte on a material through its case', async () => {
    const author = await createUser(prisma);
    const subject = await createSubject(prisma);
    const { id: materialId } = await material(author.id, subject.id);
    const reportCase = await prisma.moderationCase.create({
      data: { kind: 'REPORTS', targetType: 'MATERIAL', materialId },
      select: { id: true },
    });
    expect(
      await materiaOf(prisma, [
        { reason: 'REPORT_CONFIRMED', referenceId: `${reportCase.id}:x` },
      ]),
    ).toEqual([subject.id]);
  });

  it('maps each materia to every carrera with a plan that includes it', async () => {
    const tag = randomUUID().slice(0, 6);
    const career = (code: string) =>
      prisma.career.create({
        data: {
          status: 'PUBLISHED',
          facultyId: FI_UNJU_FACULTY_ID,
          name: `Carrera atribución ${code}${tag}`,
          code: `${code}${tag}`,
          studyPlans: { create: [{ name: 'Plan', code: 'P', duration: 5 }] },
        },
        select: { id: true, studyPlans: { select: { id: true } } },
      });
    const informatica = await career('I');
    const industrial = await career('N');
    careerIds.push(informatica.id, industrial.id);
    const [shared, own, orphan] = await Promise.all(
      Array.from({ length: 3 }, () => createSubject(prisma)),
    );
    await prisma.studyPlanSubject.createMany({
      data: [
        {
          studyPlanId: informatica.studyPlans[0].id,
          subjectId: shared.id,
          year: 1,
          semester: 1,
        },
        {
          studyPlanId: industrial.studyPlans[0].id,
          subjectId: shared.id,
          year: 2,
          semester: 1,
        },
        {
          studyPlanId: informatica.studyPlans[0].id,
          subjectId: own.id,
          year: 1,
          semester: 2,
        },
      ],
    });

    const careers = await careersOf(prisma, [shared.id, own.id, orphan.id]);
    expect([...(careers.get(shared.id) ?? [])].sort()).toEqual(
      [informatica.id, industrial.id].sort(),
    );
    expect([...(careers.get(own.id) ?? [])]).toEqual([informatica.id]);
    expect(careers.get(orphan.id)).toBeUndefined();
  });
});
