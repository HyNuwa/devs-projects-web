import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { DecisionsService } from './decisions.service';
import { type AppealTarget, canAppeal, canReview } from './sanction-rules';
import { type Actor, SanctionsService } from './sanctions.service';

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
  constructor(
    private readonly prisma: PrismaService,
    private readonly decisions: DecisionsService,
    private readonly sanctions: SanctionsService,
  ) {}

  /**
   * Accepts or rejects an appeal with a final, written answer. Only someone other
   * than the decider and the appellant, with a role above the appellant's, answers;
   * suspensiones and retiros of anonymous content need an admin.
   */
  async answer(
    reviewer: Actor,
    appealId: string,
    input: { accept: boolean; answer: string },
  ) {
    const answer = input.answer?.trim();
    if (!answer || answer.length > EXPLANATION_MAX) {
      throw new BadRequestException(
        `Escribí la respuesta (hasta ${EXPLANATION_MAX} caracteres)`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const appeal = await tx.appeal.findUnique({
        where: { id: appealId },
        select: {
          id: true,
          kind: true,
          status: true,
          caseId: true,
          sanctionId: true,
          decidedById: true,
          appellant: { select: { id: true, role: true } },
          sanction: { select: { type: true, case: { select: contentSelect } } },
          case: {
            select: {
              ...contentSelect,
              courseReview: { select: { isAnonymous: true } },
              examExperience: { select: { isAnonymous: true } },
            },
          },
        },
      });
      if (!appeal) throw new NotFoundException('Apelación no encontrada');
      const { courseReview, examExperience, ...retiroContent } =
        appeal.case ?? {};
      const allowed = canReview(reviewer, {
        appellant: appeal.appellant,
        decidedById: appeal.decidedById,
        suspension: appeal.sanction?.type === 'SUSPENSION',
        anonymousContent:
          appeal.kind === 'RETIRO' &&
          Boolean(courseReview?.isAnonymous || examExperience?.isAnonymous),
      });
      if (!allowed) {
        throw new ForbiddenException('No podés resolver esta apelación');
      }

      // Conditional: the first answer wins and is final.
      const answered = await tx.appeal.updateMany({
        where: { id: appealId, status: 'PENDING' },
        data: {
          status: input.accept ? 'ACCEPTED' : 'REJECTED',
          reviewerId: reviewer.id,
          answer,
          answeredAt: new Date(),
        },
      });
      if (answered.count === 0) {
        throw new ConflictException('La apelación ya fue respondida');
      }

      if (input.accept && appeal.kind === 'RETIRO' && appeal.caseId) {
        await this.decisions.restoreFromAppeal(tx, {
          caseId: appeal.caseId,
          appealId,
          actorId: reviewer.id,
          reason: answer,
        });
      }
      if (input.accept && appeal.kind === 'SANCTION' && appeal.sanctionId) {
        await this.sanctions.voidByAppeal(tx, {
          sanctionId: appeal.sanctionId,
          appealId,
        });
      }

      await tx.moderationEvent.create({
        data: {
          actorId: reviewer.id,
          action: input.accept ? 'APPEAL_ACCEPTED' : 'APPEAL_REJECTED',
          targetUserId: appeal.appellant.id,
          caseId: appeal.caseId,
          ...(appeal.case ? retiroContent : (appeal.sanction?.case ?? {})),
          reason: answer,
          metadata: { appealId, kind: appeal.kind },
        },
      });
    });
  }

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
