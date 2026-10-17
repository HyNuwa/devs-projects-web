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
 * - `juan.p`: warned for a first retiro and with an open caso hidden 3 days ago, so
 *   the next step is «Silenciar 7 días» and the caso is overdue («Vencidos»).
 * - `lu.rojas`: silenced after two retiros, and appealing it.
 * - `ofertas.fi`: a new spam-looking account with a pending suspension proposal.
 * - `fede.b`: suspended for 30 days.
 * - `sofi.c`: a retired material under appeal.
 * - `vale.mod` (a moderator) and `nico.r` (a student): each appealing the retiro of
 *   their anonymous reseña, decided by the moderator `caro.m`. Only admins answer
 *   those, so the demo moderator sees both read-only and identical («La resuelve
 *   un admin») and the demo admin answers them.
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
      hiddenAt: at(-3),
    },
  });
  await prisma.moderationCase.create({
    data: {
      kind: 'REPORTS',
      targetType: 'COURSE_REVIEW',
      courseReviewId: juanReview.id,
      targetAuthorId: juan.id,
      openedAt: at(-3),
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

  /** An anonymous reseña by `authorId`, retired by `deciderId` and appealed. */
  const appealAnonymousRetiro = async (
    deciderId: string,
    authorId: string,
    comment: string,
    reason: string,
    explanation: string,
    daysAgo: number,
  ) => {
    const review = await prisma.courseReview.create({
      data: {
        userId: authorId,
        subjectId: subjectB,
        recommendation: 1,
        isAnonymous: true,
        comment,
        publicationStatus: 'REMOVED',
        statusChangedAt: at(-daysAgo - 2),
        authorFacingReason: reason,
      },
    });
    const retiro = await prisma.moderationCase.create({
      data: {
        kind: 'REPORTS',
        targetType: 'COURSE_REVIEW',
        courseReviewId: review.id,
        targetAuthorId: authorId,
        status: 'CLOSED',
        openedAt: at(-daysAgo - 3),
        closedAt: at(-daysAgo - 2),
        decision: 'REMOVE',
        decidedById: deciderId,
        decisionReason: reason,
      },
    });
    await prisma.appeal.create({
      data: {
        appellantId: authorId,
        kind: 'RETIRO',
        caseId: retiro.id,
        explanation,
        decidedById: deciderId,
        createdAt: at(-daysAgo),
      },
    });
  };

  // vale.mod and nico.r: anonymous reseñas retired by caro.m and appealed. Only
  // admins answer appeals about anonymous content, so the demo moderator sees both
  // read-only and alike, whatever the appellant's role (moderacion-ajustes).
  const [caro, vale, nico] = await Promise.all([
    account('caro.m', 600, { role: Role.MODERATOR }),
    account('vale.mod', 400, { role: Role.MODERATOR }),
    account('nico.r', 200),
  ]);
  await appealAnonymousRetiro(
    caro.id,
    vale.id,
    'La cátedra no responde consultas y los parciales son injustos.',
    'Ataque a docentes sin datos concretos.',
    'Es mi experiencia de la cursada: las consultas quedaron sin respuesta todo el cuatrimestre.',
    2,
  );
  await appealAnonymousRetiro(
    caro.id,
    nico.id,
    'El docente de práctica es un desastre, no vayan a sus clases.',
    'Ataque a docentes sin datos concretos.',
    'Describo cómo fueron las clases, no quise atacar a nadie.',
    1,
  );
}
