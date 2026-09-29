import {
  MaterialResourceType,
  PrismaClient,
  Role,
} from '../src/generated/prisma';

const DAY = 24 * 60 * 60 * 1000;

type SeedUsers = { adminId: string; moderatorId: string };

/**
 * Demo data for sanciones and apelaciones (openspec change moderacion-sanciones),
 * matching the Usuarios and Apelaciones canvases:
 * - `juan.p`: warned for a first retiro and with an open caso, so the next step is
 *   «Silenciar 7 días».
 * - `lu.rojas`: silenced after two retiros, and appealing it.
 * - `ofertas.fi`: a new spam-looking account with a pending suspension proposal.
 * - `fede.b`: suspended for 30 days.
 * - `sofi.c`: a retired material under appeal.
 *
 * Decisions that the demo moderator should review are made by the admin, since
 * nobody reviews an appeal of their own decision.
 */
export async function seedSanctions(
  prisma: PrismaClient,
  users: SeedUsers,
  subjectIds: string[],
  passwordHash: string,
) {
  const now = Date.now();
  const at = (days: number) => new Date(now + days * DAY);
  const [subjectA, subjectB] = subjectIds;

  const account = (
    username: string,
    ageDays: number,
    extra: Record<string, unknown> = {},
  ) =>
    prisma.user.create({
      data: {
        username,
        email: `${username}@devsproject.local`,
        passwordHash,
        role: Role.USER,
        emailVerified: true,
        createdAt: at(-ageDays),
        ...extra,
      },
    });

  const [juan, lu, ofertas, fede, sofi] = await Promise.all([
    account('juan.p', 240),
    account('lu.rojas', 730, { isMuted: true, mutedUntil: at(2) }),
    account('ofertas.fi', 1, { emailVerified: false }),
    account('fede.b', 500, { isBanned: true, bannedUntil: at(25) }),
    account('sofi.c', 300),
  ]);

  /** A contribution retired through a closed caso decided `daysAgo`, with its event. */
  const retire = async (
    authorId: string,
    title: string,
    daysAgo: number,
    reason: string,
    decidedById = users.adminId,
  ) => {
    const material = await prisma.material.create({
      data: {
        title,
        searchKey: title.toLowerCase(),
        fileUrl: `https://drive.example.com/${encodeURIComponent(title)}`,
        fileType: 'pdf',
        fileSize: BigInt(90_000),
        authorId,
        subjectId: subjectA,
        resourceType: MaterialResourceType.RESUMEN,
        academicYear: 2025,
        publicationStatus: 'REMOVED',
        statusChangedAt: at(-daysAgo),
        authorFacingReason: reason,
      },
    });
    const moderationCase = await prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'MATERIAL',
        materialId: material.id,
        targetAuthorId: authorId,
        status: 'CLOSED',
        openedAt: at(-daysAgo - 1),
        closedAt: at(-daysAgo),
        decision: 'REMOVE',
        decidedById,
        decisionReason: reason,
      },
    });
    await prisma.moderationEvent.create({
      data: {
        actorId: decidedById,
        action: 'REMOVED',
        targetType: 'MATERIAL',
        materialId: material.id,
        targetUserId: authorId,
        caseId: moderationCase.id,
        reason,
        metadata: { label: title },
        createdAt: at(-daysAgo),
      },
    });
    return moderationCase;
  };

  /** A sanción with its history event, applied `daysAgo`. */
  const sanction = async (
    userId: string,
    type: 'WARNING' | 'MUTE' | 'SUSPENSION',
    reason: string,
    daysAgo: number,
    endsAt: Date | null,
    caseId?: string,
  ) => {
    const row = await prisma.sanction.create({
      data: {
        userId,
        type,
        reason,
        startsAt: at(-daysAgo),
        endsAt,
        appliedById: users.adminId,
        caseId,
        seenAt: at(-daysAgo),
      },
    });
    await prisma.moderationEvent.create({
      data: {
        actorId: users.adminId,
        action:
          type === 'WARNING'
            ? 'WARNED'
            : type === 'MUTE'
              ? 'MUTED'
              : 'SUSPENDED',
        targetUserId: userId,
        caseId,
        reason,
        metadata: { endsAt: endsAt?.toISOString() ?? null },
        createdAt: at(-daysAgo),
      },
    });
    return row;
  };

  // juan.p: first retiro (warned) and a new open caso on a hidden reseña.
  const juanRetiro = await retire(
    juan.id,
    'Resumen con insultos',
    16,
    'Retiro de un resumen con insultos a una docente.',
  );
  await sanction(
    juan.id,
    'WARNING',
    'Retiro de un resumen con insultos a una docente.',
    16,
    null,
    juanRetiro.id,
  );
  const juanReview = await prisma.courseReview.create({
    data: {
      userId: juan.id,
      subjectId: subjectB,
      academicYear: 2025,
      recommendation: 1,
      isAnonymous: true,
      comment: 'La cátedra es un desastre y el JTP no sabe nada.',
      publicationStatus: 'HIDDEN',
      hiddenAt: at(-0.2),
    },
  });
  await prisma.moderationCase.create({
    data: {
      kind: 'REPORTS',
      targetType: 'COURSE_REVIEW',
      courseReviewId: juanReview.id,
      targetAuthorId: juan.id,
      openedAt: at(-0.2),
    },
  });

  // lu.rojas: two retiros, silenced 5 days ago by the admin, appealing it.
  await retire(lu.id, 'Guía copiada', 40, 'Material copiado de otra persona.');
  await retire(lu.id, 'Guía copiada 2', 5, 'Material copiado otra vez.');
  const luMute = await sanction(
    lu.id,
    'MUTE',
    'Segundo retiro por copiar material en 90 días.',
    5,
    at(2),
  );
  await prisma.appeal.create({
    data: {
      appellantId: lu.id,
      kind: 'SANCTION',
      sanctionId: luMute.id,
      explanation:
        'La segunda guía la hice yo: la otra persona copió mi versión del año pasado.',
      decidedById: users.adminId,
      createdAt: at(-3),
    },
  });

  // ofertas.fi: pending suspension proposal from the demo moderator.
  await prisma.suspensionProposal.create({
    data: {
      userId: ofertas.id,
      proposedById: users.moderatorId,
      reason:
        'Publica ofertas de cursos pagos en varias materias el primer día.',
      durationDays: null,
      createdAt: at(-0.1),
    },
  });
  await prisma.moderationEvent.create({
    data: {
      actorId: users.moderatorId,
      action: 'SUSPENSION_PROPOSED',
      targetUserId: ofertas.id,
      reason:
        'Publica ofertas de cursos pagos en varias materias el primer día.',
      metadata: { durationDays: null },
      createdAt: at(-0.1),
    },
  });

  // fede.b: suspended 30 days, 5 days ago.
  await retire(fede.id, 'Resumen ofensivo', 60, 'Insultos a compañeros.');
  await retire(fede.id, 'Resumen ofensivo 2', 20, 'Insultos a compañeros.');
  await retire(fede.id, 'Resumen ofensivo 3', 6, 'Insultos a compañeros.');
  await sanction(
    fede.id,
    'SUSPENSION',
    'Tercer retiro por insultos en 90 días.',
    5,
    at(25),
  );

  // sofi.c: retired material, appealed yesterday.
  const sofiRetiro = await retire(
    sofi.id,
    'Resumen de lógica',
    7,
    'Está duplicado con otro resumen de la misma materia.',
  );
  await prisma.appeal.create({
    data: {
      appellantId: sofi.id,
      kind: 'RETIRO',
      caseId: sofiRetiro.id,
      explanation:
        'No es el mismo: el otro resume la unidad 1 (conjuntos) y este la unidad 2 (lógica proposicional).',
      decidedById: users.adminId,
      createdAt: at(-1),
    },
  });
}
