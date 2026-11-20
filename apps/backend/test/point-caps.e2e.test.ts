import type { NestExpressApplication } from '@nestjs/platform-express';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PointLedger } from '../src/modules/ranking/point-ledger';
import type { PrismaService } from '../src/prisma/prisma.service';
import {
  createE2eApp,
  createSubject,
  createUser,
  type E2eUser,
} from './support/e2e-app';

/** Per-period caps on reseñas and experiencias (openspec reputation/points). */
describe('point caps for reseñas and experiencias (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let ledger: PointLedger;

  beforeAll(async () => {
    ({ app, prisma } = await createE2eApp());
    ledger = app.get(PointLedger);
  });

  afterAll(async () => {
    await app.close();
  });

  const review = (
    author: E2eUser,
    subjectId: string,
    academicYear: number | null,
  ) =>
    prisma.courseReview.create({
      data: { userId: author.id, subjectId, recommendation: 3, academicYear },
      select: { id: true },
    });
  const exam = (
    author: E2eUser,
    subjectId: string,
    session: 'DICIEMBRE' | 'NO_RECUERDO',
    year: number,
  ) =>
    prisma.examExperience.create({
      data: { userId: author.id, subjectId, session, year, format: 'ESCRITO' },
      select: { id: true },
    });

  const awardReview = (author: E2eUser, id: string) =>
    prisma.$transaction((tx) =>
      ledger.award(tx, {
        userId: author.id,
        reason: 'COURSE_REVIEWED',
        referenceId: id,
        amount: 5,
      }),
    );
  const awardExam = (author: E2eUser, id: string) =>
    prisma.$transaction((tx) =>
      ledger.award(tx, {
        userId: author.id,
        reason: 'EXAM_EXPERIENCE_SHARED',
        referenceId: id,
        amount: 5,
      }),
    );
  const points = async (user: E2eUser) =>
    (await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).points;

  it('awards one reseña per materia and ciclo lectivo', async () => {
    const author = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
    const { id: otherSubject } = await createSubject(prisma);
    const first = await review(author, subjectId, 2025);
    const sameCycle = await review(author, subjectId, 2025);
    const otherCycle = await review(author, subjectId, 2026);
    const otherMateria = await review(author, otherSubject, 2025);

    expect(await awardReview(author, first.id)).toBe(true);
    expect(await awardReview(author, sameCycle.id)).toBe(false);
    expect(await awardReview(author, otherCycle.id)).toBe(true);
    expect(await awardReview(author, otherMateria.id)).toBe(true);
    expect(await points(author)).toBe(15);
  });

  it('counts reseñas without a ciclo lectivo as one more ciclo', async () => {
    const author = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
    const a = await review(author, subjectId, null);
    const b = await review(author, subjectId, null);
    const dated = await review(author, subjectId, 2025);

    expect(await awardReview(author, a.id)).toBe(true);
    expect(await awardReview(author, b.id)).toBe(false);
    expect(await awardReview(author, dated.id)).toBe(true);
  });

  it('lets the next reseña of the period earn once the awarded one is reverted', async () => {
    const author = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
    const first = await review(author, subjectId, 2025);
    const second = await review(author, subjectId, 2025);
    await awardReview(author, first.id);
    await prisma.$transaction((tx) =>
      ledger.revert(tx, { reason: 'COURSE_REVIEWED', referenceId: first.id }),
    );

    expect(await awardReview(author, second.id)).toBe(true);
  });

  it('awards one experiencia per materia, período de examen and year', async () => {
    const author = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
    const december = await exam(author, subjectId, 'DICIEMBRE', 2025);
    const sameMesa = await exam(author, subjectId, 'DICIEMBRE', 2025);
    const otherYear = await exam(author, subjectId, 'DICIEMBRE', 2026);
    const forgotten = await exam(author, subjectId, 'NO_RECUERDO', 2025);
    const forgottenAgain = await exam(author, subjectId, 'NO_RECUERDO', 2025);

    expect(await awardExam(author, december.id)).toBe(true);
    expect(await awardExam(author, sameMesa.id)).toBe(false);
    expect(await awardExam(author, otherYear.id)).toBe(true);
    expect(await awardExam(author, forgotten.id)).toBe(true);
    expect(await awardExam(author, forgottenAgain.id)).toBe(false);
  });

  it('holds the cap when reseñas of the same period are awarded at the same time', async () => {
    const author = await createUser(prisma);
    const { id: subjectId } = await createSubject(prisma);
    const reviews = await Promise.all(
      Array.from({ length: 4 }, () => review(author, subjectId, 2025)),
    );

    const results = await Promise.all(
      reviews.map(({ id }) => awardReview(author, id)),
    );

    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await points(author)).toBe(5);
  });
});
