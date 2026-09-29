import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { type AppealTarget, canAppeal } from './sanction-rules';

const EXPLANATION_MAX = 1000;

export type AppealInput =
  { kind: 'RETIRO'; caseId: string } | { kind: 'SANCTION'; sanctionId: string };

type ContentColumns = {
  targetType?: 'MATERIAL' | 'COURSE_REVIEW' | 'EXAM_EXPERIENCE';
  materialId?: string | null;
  courseReviewId?: string | null;
  examExperienceId?: string | null;
};

const contentSelect = {
  targetType: true,
  materialId: true,
  courseReviewId: true,
  examExperienceId: true,
} as const;

const REFUSAL = {
  ALREADY_APPEALED: 'Ya apelaste esta decisión',
  WINDOW_CLOSED: 'Pasaron más de 14 días desde la decisión',
  NOT_APPEALABLE: 'Esta decisión no se puede apelar',
} as const;

type Decision = {
  target: AppealTarget;
  ownerId: string | null;
  decidedById: string;
  appealed: boolean;
  caseId: string | null;
  content: ContentColumns;
};

/** Apelaciones (docs/README_MODERACION.md §7, openspec moderation/appeals). */
@Injectable()
export class AppealsService {
  constructor(private readonly prisma: PrismaService) {}

  async file(appellantId: string, input: AppealInput, rawExplanation: string) {
    const explanation = rawExplanation?.trim();
    if (!explanation || explanation.length > EXPLANATION_MAX) {
      throw new BadRequestException(
        `Contá por qué apelás (hasta ${EXPLANATION_MAX} caracteres)`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const decision = await this.loadDecision(tx, input);
      const permission = canAppeal(
        {
          target: decision.target,
          isOwner: decision.ownerId === appellantId,
          alreadyAppealed: decision.appealed,
        },
        new Date(),
      );
      if (!permission.allowed) {
        // Someone else's decision looks the same as one that does not exist.
        if (permission.reason === 'NOT_OWNER') {
          throw new NotFoundException('Decisión no encontrada');
        }
        const rejection =
          decision.target.kind === 'CASE' &&
          decision.target.decision === 'REJECT';
        throw new ConflictException({
          code: permission.reason,
          message: rejection
            ? 'Un rechazo en revisión previa no se apela: corregilo y volvé a reenviarlo desde Mis envíos'
            : REFUSAL[permission.reason],
        });
      }

      let appeal: { id: string };
      try {
        appeal = await tx.appeal.create({
          data: {
            appellantId,
            kind: input.kind,
            ...(input.kind === 'RETIRO'
              ? { caseId: input.caseId }
              : { sanctionId: input.sanctionId }),
            explanation,
            decidedById: decision.decidedById,
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictException({
            code: 'ALREADY_APPEALED',
            message: REFUSAL.ALREADY_APPEALED,
          });
        }
        throw error;
      }
      // The content columns let the history mask an anonymous appellant (2a rules).
      await tx.moderationEvent.create({
        data: {
          actorId: appellantId,
          action: 'APPEAL_FILED',
          targetUserId: appellantId,
          caseId: decision.caseId,
          ...decision.content,
          reason: explanation,
          metadata: { appealId: appeal.id, kind: input.kind },
        },
      });
      return appeal;
    });
  }

  private async loadDecision(
    tx: Prisma.TransactionClient,
    input: AppealInput,
  ): Promise<Decision> {
    if (input.kind === 'RETIRO') {
      const moderationCase = await tx.moderationCase.findUnique({
        where: { id: input.caseId },
        select: {
          id: true,
          decision: true,
          closedAt: true,
          revertedAt: true,
          targetAuthorId: true,
          decidedById: true,
          ...contentSelect,
          appeal: { select: { id: true } },
        },
      });
      if (!moderationCase?.closedAt) {
        throw new NotFoundException('Decisión no encontrada');
      }
      return {
        target: {
          kind: 'CASE',
          decision: moderationCase.decision,
          decidedAt: moderationCase.closedAt,
          revertedAt: moderationCase.revertedAt,
        },
        ownerId: moderationCase.targetAuthorId,
        decidedById: moderationCase.decidedById ?? '',
        appealed: moderationCase.appeal !== null,
        caseId: moderationCase.id,
        content: {
          targetType: moderationCase.targetType,
          materialId: moderationCase.materialId,
          courseReviewId: moderationCase.courseReviewId,
          examExperienceId: moderationCase.examExperienceId,
        },
      };
    }

    const sanction = await tx.sanction.findUnique({
      where: { id: input.sanctionId },
      select: {
        id: true,
        userId: true,
        startsAt: true,
        voidedAt: true,
        appliedById: true,
        caseId: true,
        case: { select: contentSelect },
        appeal: { select: { id: true } },
      },
    });
    if (!sanction) throw new NotFoundException('Decisión no encontrada');
    return {
      target: {
        kind: 'SANCTION',
        decidedAt: sanction.startsAt,
        voidedAt: sanction.voidedAt,
      },
      ownerId: sanction.userId,
      decidedById: sanction.appliedById,
      appealed: sanction.appeal !== null,
      caseId: sanction.caseId,
      content: sanction.case ?? {},
    };
  }
}
