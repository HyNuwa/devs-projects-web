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
 * The Apelaciones tab (openspec moderation/appeals): appeals the viewer may
 * answer, plus, read-only for a moderator, those only admins answer because the
 * appellant is staff or the content is anonymous (hiding them would reveal the
 * appellant's role). Anonymous appellants stay «Autor oculto».
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
    const visible = rows
      .map((row) => ({ row, access: access(viewer, row) }))
      .filter(({ access }) => access !== null);
    const deciders = await this.usernames(
      visible.map(({ row }) => row.decidedById),
    );
    return visible.map(({ row, access }) => ({
      ...summary(row, deciders),
      canAnswer: access === 'answer',
    }));
  }

  async detail(viewer: Actor, appealId: string) {
    const row = await this.prisma.appeal.findUnique({
      where: { id: appealId },
      select: appealSelect,
    });
    if (!row) throw new NotFoundException('Apelación no encontrada');
    const allowed = access(viewer, row);
    if (!allowed) {
      throw new ForbiddenException('No podés ver esta apelación');
    }
    const deciders = await this.usernames([row.decidedById]);
    if (allowed === 'read') {
      // «La resuelve un admin»: what was decided, not what the appellant wrote.
      return {
        ...summary(row, deciders),
        status: row.status,
        canAnswer: false,
      };
    }
    const anonymous = isAnonymousRetiro(row);
    return {
      ...summary(row, deciders),
      status: row.status,
      explanation: row.explanation,
      answer: row.answer,
      answeredAt: row.answeredAt,
      canAnswer: row.status === 'PENDING' && allowed === 'answer',
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

function access(viewer: Actor, row: AppealRow): 'answer' | 'read' | null {
  const appeal = {
    appellant: row.appellant,
    decidedById: row.decidedById,
    suspension: row.sanction?.type === 'SUSPENSION',
    anonymousContent: row.kind === 'RETIRO' && isAnonymousRetiro(row),
  };
  if (canReview(viewer, appeal)) return 'answer';
  // Refused only for the appellant's role or because the content is anonymous:
  // the same check as if a USER appealed signed content, so every such appeal
  // looks the same. Own decisions and suspensiones stay out, as for any appellant.
  if (
    viewer.role === 'MODERATOR' &&
    canReview(viewer, {
      ...appeal,
      appellant: { ...row.appellant, role: 'USER' },
      anonymousContent: false,
    })
  ) {
    return 'read';
  }
  return null;
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
