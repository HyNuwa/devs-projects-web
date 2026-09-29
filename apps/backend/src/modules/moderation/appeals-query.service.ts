import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { canReview } from './sanction-rules';
import type { Actor } from './sanctions.service';

const appealSelect = {
  id: true,
  kind: true,
  status: true,
  createdAt: true,
  explanation: true,
  answer: true,
  answeredAt: true,
  decidedById: true,
  appellant: { select: { id: true, role: true, username: true } },
  case: {
    select: {
      id: true,
      closedAt: true,
      decisionReason: true,
      targetType: true,
      materialId: true,
      courseReviewId: true,
      examExperienceId: true,
      material: { select: { title: true } },
      courseReview: { select: { isAnonymous: true, comment: true } },
      examExperience: { select: { isAnonymous: true, comment: true } },
    },
  },
  sanction: {
    select: {
      type: true,
      reason: true,
      startsAt: true,
      endsAt: true,
      case: {
        select: {
          courseReview: { select: { isAnonymous: true } },
          examExperience: { select: { isAnonymous: true } },
        },
      },
    },
  },
} satisfies Prisma.AppealSelect;

type AppealRow = Prisma.AppealGetPayload<{ select: typeof appealSelect }>;

const TARGET_LABEL = {
  MATERIAL: null,
  COURSE_REVIEW: 'Reseña de cursada',
  EXAM_EXPERIENCE: 'Experiencia de final',
} as const;

/**
 * The Apelaciones tab (openspec moderation/appeals): only appeals the viewer may
 * answer, and anonymous appellants stay «Autor oculto».
 */
@Injectable()
export class AppealsQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(viewer: Actor) {
    const rows = await this.prisma.appeal.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: 200,
      select: appealSelect,
    });
    const eligible = rows.filter((row) => reviewable(viewer, row));
    const deciders = await this.usernames(
      eligible.map((row) => row.decidedById),
    );
    return eligible.map((row) => summary(row, deciders));
  }

  async detail(viewer: Actor, appealId: string) {
    const row = await this.prisma.appeal.findUnique({
      where: { id: appealId },
      select: appealSelect,
    });
    if (!row) throw new NotFoundException('Apelación no encontrada');
    const allowed = reviewable(viewer, row);
    if (!allowed) {
      throw new ForbiddenException('No podés ver esta apelación');
    }
    const deciders = await this.usernames([row.decidedById]);
    const anonymous = isAnonymousRetiro(row);
    return {
      ...summary(row, deciders),
      status: row.status,
      explanation: row.explanation,
      answer: row.answer,
      answeredAt: row.answeredAt,
      canAnswer: row.status === 'PENDING',
      content:
        row.kind === 'RETIRO' && row.case
          ? {
              caseId: row.case.id,
              type: row.case.targetType,
              label: label(row),
              comment:
                row.case.courseReview?.comment ??
                row.case.examExperience?.comment ??
                null,
              anonymous,
            }
          : null,
    };
  }

  private async usernames(ids: string[]) {
    const users = await this.prisma.user.findMany({
      where: { id: { in: [...new Set(ids)] } },
      select: { id: true, username: true },
    });
    return new Map(users.map((user) => [user.id, user.username]));
  }
}

function reviewable(viewer: Actor, row: AppealRow) {
  return canReview(viewer, {
    appellant: row.appellant,
    decidedById: row.decidedById,
    suspension: row.sanction?.type === 'SUSPENSION',
  });
}

function isAnonymousRetiro(row: AppealRow) {
  return Boolean(
    row.case?.courseReview?.isAnonymous ||
    row.case?.examExperience?.isAnonymous,
  );
}

function label(row: AppealRow) {
  if (row.case) {
    return row.case.material?.title ?? TARGET_LABEL[row.case.targetType] ?? '';
  }
  return null;
}

function summary(row: AppealRow, deciders: Map<string, string>) {
  // The author of an anonymous retiro is never linked to it; a sanción is on an
  // account, so its appellant is shown but an anonymous caso stays unlinked.
  const hidden = row.kind === 'RETIRO' && isAnonymousRetiro(row);
  const anonymousCase = Boolean(
    row.sanction?.case?.courseReview?.isAnonymous ||
    row.sanction?.case?.examExperience?.isAnonymous,
  );
  return {
    id: row.id,
    kind: row.kind,
    createdAt: row.createdAt,
    appellant: hidden
      ? { hidden: true, username: null }
      : { hidden: false, username: row.appellant.username },
    decidedBy: { username: deciders.get(row.decidedById) ?? null },
    decision:
      row.kind === 'RETIRO' && row.case
        ? {
            kind: 'RETIRO' as const,
            label: label(row),
            reason: row.case.decisionReason,
            decidedAt: row.case.closedAt,
          }
        : {
            kind: 'SANCTION' as const,
            type: row.sanction?.type ?? null,
            reason: row.sanction?.reason ?? null,
            decidedAt: row.sanction?.startsAt ?? null,
            endsAt: row.sanction?.endsAt ?? null,
            anonymousCase,
          },
  };
}
