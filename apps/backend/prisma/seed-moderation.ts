import {
  MaterialResourceType,
  PrismaClient,
  Role,
} from '../src/generated/prisma';

const DAY = 24 * 60 * 60 * 1000;

type SeedUsers = { adminId: string; moderatorId: string; userId: string };

/**
 * Demo data for moderation (openspec change moderacion-casos): one material in each
 * publication status, a revisión previa caso, a reported caso, a hidden material and an
 * anonymous reseña hidden by three reportes.
 */
export async function seedModeration(
  prisma: PrismaClient,
  users: SeedUsers,
  subjectIds: string[],
  passwordHash: string,
) {
  const now = Date.now();
  const [subjectA, subjectB] = subjectIds;

  const [newcomer, reporterA, reporterB, reporterC] = await Promise.all(
    [
      {
        username: 'nueva.cuenta',
        createdAt: new Date(now - 2 * DAY),
        emailVerified: false,
      },
      {
        username: 'lucia.p',
        createdAt: new Date(now - 120 * DAY),
        emailVerified: true,
      },
      {
        username: 'tomi.g',
        createdAt: new Date(now - 200 * DAY),
        emailVerified: true,
      },
      {
        username: 'mica.v',
        createdAt: new Date(now - 400 * DAY),
        emailVerified: true,
      },
    ].map(({ username, createdAt, emailVerified }) =>
      prisma.user.create({
        data: {
          username,
          email: `${username}@devsproject.local`,
          passwordHash,
          role: Role.USER,
          emailVerified,
          createdAt,
        },
      }),
    ),
  );

  const material = (
    title: string,
    authorId: string,
    subjectId: string,
    extra: Record<string, unknown> = {},
  ) =>
    prisma.material.create({
      data: {
        title,
        searchKey: title.toLowerCase(),
        fileUrl: `https://drive.example.com/${encodeURIComponent(title)}`,
        fileType: 'pdf',
        fileSize: BigInt(120_000),
        authorId,
        subjectId,
        resourceType: MaterialResourceType.PARCIAL,
        academicYear: 2025,
        ...extra,
      },
    });

  await material('Parcial 1 resuelto', users.userId, subjectA);

  const pending = await material('Resumen unidad 1', newcomer.id, subjectB, {
    publicationStatus: 'PENDING_REVIEW',
    authorFacingReason: null,
  });
  const priorReview = await prisma.moderationCase.create({
    data: {
      kind: 'PRIOR_REVIEW',
      targetType: 'MATERIAL',
      materialId: pending.id,
    },
  });
  await prisma.moderationEvent.create({
    data: {
      action: 'PRIOR_REVIEW_OPENED',
      targetType: 'MATERIAL',
      materialId: pending.id,
      caseId: priorReview.id,
      reason: 'NEW_ACCOUNT',
      metadata: { label: pending.title },
    },
  });

  await material('Final sin tachar', newcomer.id, subjectA, {
    publicationStatus: 'REJECTED',
    authorFacingReason:
      'Se ven nombres y DNI en la primera hoja: tapalos y volvé a enviarlo.',
  });

  const hidden = await material('Parcial 1 escaneado', users.userId, subjectA, {
    publicationStatus: 'HIDDEN',
    hiddenAt: new Date(now - 5 * 60 * 60 * 1000),
  });
  const hiddenCase = await prisma.moderationCase.create({
    data: {
      kind: 'REPORTS',
      targetType: 'MATERIAL',
      materialId: hidden.id,
      highPriority: true,
      openedAt: new Date(now - 5 * 60 * 60 * 1000),
    },
  });
  await prisma.report.create({
    data: {
      caseId: hiddenCase.id,
      reporterId: reporterB.id,
      reason: 'DATOS_PERSONALES',
      explanation:
        'En la primera hoja se lee el nombre completo y el DNI de un compañero.',
      targetType: 'MATERIAL',
      materialId: hidden.id,
    },
  });
  await prisma.moderationEvent.create({
    data: {
      action: 'AUTO_HIDDEN',
      targetType: 'MATERIAL',
      materialId: hidden.id,
      caseId: hiddenCase.id,
      reason: '1 reporte por datos personales',
      metadata: { label: hidden.title },
    },
  });

  const reported = await material(
    'Guía 2 de cinemática',
    users.userId,
    subjectB,
  );
  const reportedCase = await prisma.moderationCase.create({
    data: { kind: 'REPORTS', targetType: 'MATERIAL', materialId: reported.id },
  });
  for (const reporter of [reporterA, reporterC]) {
    await prisma.report.create({
      data: {
        caseId: reportedCase.id,
        reporterId: reporter.id,
        reason: 'NO_RELACIONADO',
        targetType: 'MATERIAL',
        materialId: reported.id,
      },
    });
  }

  const review = await prisma.courseReview.create({
    data: {
      userId: users.userId,
      subjectId: subjectA,
      academicYear: 2025,
      recommendation: 1,
      isAnonymous: true,
      comment:
        'No la cursen con Gómez: no sabe explicar y aprueba a los que le caen bien.',
      publicationStatus: 'HIDDEN',
      hiddenAt: new Date(now - 8 * 60 * 60 * 1000),
    },
  });
  const reviewCase = await prisma.moderationCase.create({
    data: {
      kind: 'REPORTS',
      targetType: 'COURSE_REVIEW',
      courseReviewId: review.id,
    },
  });
  for (const reporter of [reporterA, reporterB, reporterC]) {
    await prisma.report.create({
      data: {
        caseId: reviewCase.id,
        reporterId: reporter.id,
        reason: 'INSULTOS_O_ACOSO',
        targetType: 'COURSE_REVIEW',
        courseReviewId: review.id,
      },
    });
  }
  await prisma.moderationEvent.create({
    data: {
      action: 'AUTO_HIDDEN',
      targetType: 'COURSE_REVIEW',
      courseReviewId: review.id,
      caseId: reviewCase.id,
      reason: '3 reportes en 48 h',
      metadata: { label: 'Reseña anónima' },
    },
  });

  return { priorReviewCaseId: priorReview.id, hiddenCaseId: hiddenCase.id };
}
