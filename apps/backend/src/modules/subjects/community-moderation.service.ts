import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CommunityModerationActionType } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../auth/dto/auth-response.dto';
import {
  CommunityModerationReasonDto,
  CreateCommunityReportDto,
} from './dto/community-moderation.dto';

type CommunityTargetType = 'COURSE_REVIEW' | 'EXAM_EXPERIENCE';

type CommunityViewer = {
  id: string;
  role: Role;
};

const MODERATION_ROLES = new Set<Role>([
  Role.MODERATOR,
  Role.ADMIN,
  Role.SUPERADMIN,
]);

const privateTargetSelect = {
  id: true,
  userId: true,
  subjectId: true,
  isAnonymous: true,
  isRemoved: true,
  removedReason: true,
  removedAt: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  },
} as const;

const reportTargetSelect = {
  id: true,
  isAnonymous: true,
  isRemoved: true,
  user: {
    select: {
      id: true,
      username: true,
      displayName: true,
      avatarUrl: true,
    },
  },
  subject: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
} as const;

@Injectable()
export class CommunityModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async reportReview(
    reviewId: string,
    reporterId: string,
    dto: CreateCommunityReportDto,
  ) {
    const review = await this.prisma.courseReview.findFirst({
      where: { id: reviewId, isRemoved: false },
      select: { id: true },
    });

    if (!review) {
      throw new NotFoundException('Reseña no encontrada');
    }

    return this.createReport(reporterId, dto, { courseReviewId: review.id });
  }

  async reportExam(
    examId: string,
    reporterId: string,
    dto: CreateCommunityReportDto,
  ) {
    const exam = await this.prisma.examExperience.findFirst({
      where: { id: examId, isRemoved: false },
      select: { id: true },
    });

    if (!exam) {
      throw new NotFoundException('Experiencia de final no encontrada');
    }

    return this.createReport(reporterId, dto, {
      examExperienceId: exam.id,
    });
  }

  private createReport(
    reporterId: string,
    dto: CreateCommunityReportDto,
    target:
      | { courseReviewId: string; examExperienceId?: never }
      | { courseReviewId?: never; examExperienceId: string },
  ) {
    return this.prisma.communityReport.create({
      data: {
        reporterId,
        reason: dto.reason,
        explanation: dto.explanation,
        ...target,
      },
      select: {
        id: true,
        reason: true,
        explanation: true,
        createdAt: true,
      },
    });
  }

  async getReviewManagementView(reviewId: string, viewer: CommunityViewer) {
    const review = await this.prisma.courseReview.findUnique({
      where: { id: reviewId },
      select: privateTargetSelect,
    });

    if (!review) {
      throw new NotFoundException('Reseña no encontrada');
    }

    this.assertManagementAccess(review.userId, viewer);
    return this.toManagementView('COURSE_REVIEW', review);
  }

  async getExamManagementView(examId: string, viewer: CommunityViewer) {
    const exam = await this.prisma.examExperience.findUnique({
      where: { id: examId },
      select: privateTargetSelect,
    });

    if (!exam) {
      throw new NotFoundException('Experiencia de final no encontrada');
    }

    this.assertManagementAccess(exam.userId, viewer);
    return this.toManagementView('EXAM_EXPERIENCE', exam);
  }

  async listReports() {
    const reports = await this.prisma.communityReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        reason: true,
        explanation: true,
        createdAt: true,
        courseReview: { select: reportTargetSelect },
        examExperience: { select: reportTargetSelect },
      },
    });

    return reports.map((report) => {
      if (report.courseReview) {
        const { user, ...target } = report.courseReview;
        return {
          id: report.id,
          reason: report.reason,
          explanation: report.explanation,
          createdAt: report.createdAt,
          target: {
            type: 'COURSE_REVIEW' as const,
            ...target,
            author: user,
          },
        };
      }

      if (!report.examExperience) {
        throw new InternalServerErrorException(
          'El reporte no tiene un objetivo válido',
        );
      }

      const { user, ...target } = report.examExperience;

      return {
        id: report.id,
        reason: report.reason,
        explanation: report.explanation,
        createdAt: report.createdAt,
        target: {
          type: 'EXAM_EXPERIENCE' as const,
          ...target,
          author: user,
        },
      };
    });
  }

  removeReview(
    reviewId: string,
    moderatorId: string,
    dto: CommunityModerationReasonDto,
  ) {
    return this.moderateTarget(
      'COURSE_REVIEW',
      reviewId,
      moderatorId,
      CommunityModerationActionType.REMOVE,
      dto.reason,
    );
  }

  restoreReview(
    reviewId: string,
    moderatorId: string,
    dto: CommunityModerationReasonDto,
  ) {
    return this.moderateTarget(
      'COURSE_REVIEW',
      reviewId,
      moderatorId,
      CommunityModerationActionType.RESTORE,
      dto.reason,
    );
  }

  removeExam(
    examId: string,
    moderatorId: string,
    dto: CommunityModerationReasonDto,
  ) {
    return this.moderateTarget(
      'EXAM_EXPERIENCE',
      examId,
      moderatorId,
      CommunityModerationActionType.REMOVE,
      dto.reason,
    );
  }

  restoreExam(
    examId: string,
    moderatorId: string,
    dto: CommunityModerationReasonDto,
  ) {
    return this.moderateTarget(
      'EXAM_EXPERIENCE',
      examId,
      moderatorId,
      CommunityModerationActionType.RESTORE,
      dto.reason,
    );
  }

  private async moderateTarget(
    targetType: CommunityTargetType,
    targetId: string,
    moderatorId: string,
    action: CommunityModerationActionType,
    reason: string,
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const target =
        targetType === 'COURSE_REVIEW'
          ? await transaction.courseReview.findUnique({
              where: { id: targetId },
              select: privateTargetSelect,
            })
          : await transaction.examExperience.findUnique({
              where: { id: targetId },
              select: privateTargetSelect,
            });

      if (!target) {
        throw new NotFoundException(
          targetType === 'COURSE_REVIEW'
            ? 'Reseña no encontrada'
            : 'Experiencia de final no encontrada',
        );
      }

      if (action === CommunityModerationActionType.REMOVE && target.isRemoved) {
        throw new ConflictException('La entrada ya está retirada');
      }

      if (
        action === CommunityModerationActionType.RESTORE &&
        !target.isRemoved
      ) {
        throw new ConflictException('La entrada ya está visible');
      }

      const removalDate = new Date();
      const removalData =
        action === CommunityModerationActionType.REMOVE
          ? {
              isRemoved: true,
              removedReason: reason,
              removedAt: removalDate,
              removedById: moderatorId,
            }
          : {
              isRemoved: false,
              removedReason: null,
              removedAt: null,
              removedById: null,
            };

      const updated =
        targetType === 'COURSE_REVIEW'
          ? await transaction.courseReview.update({
              where: { id: targetId },
              data: removalData,
              select: privateTargetSelect,
            })
          : await transaction.examExperience.update({
              where: { id: targetId },
              data: removalData,
              select: privateTargetSelect,
            });

      const targetReference =
        targetType === 'COURSE_REVIEW'
          ? { courseReviewId: targetId }
          : { examExperienceId: targetId };
      const moderationAction =
        await transaction.communityModerationAction.create({
          data: {
            moderatorId,
            authorId: target.userId,
            action,
            reason,
            ...targetReference,
          },
          select: {
            id: true,
            action: true,
            reason: true,
            createdAt: true,
          },
        });

      return {
        target: this.toManagementView(targetType, updated),
        action: moderationAction,
      };
    });
  }

  private assertManagementAccess(authorId: string, viewer: CommunityViewer) {
    if (authorId === viewer.id || MODERATION_ROLES.has(viewer.role)) {
      return;
    }

    throw new ForbiddenException('No tienes permisos para ver esta entrada');
  }

  private toManagementView(
    targetType: CommunityTargetType,
    target: {
      id: string;
      subjectId: string;
      isAnonymous: boolean;
      isRemoved: boolean;
      removedReason: string | null;
      removedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      user: {
        id: string;
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
      };
    },
  ) {
    return {
      type: targetType,
      id: target.id,
      subjectId: target.subjectId,
      isAnonymous: target.isAnonymous,
      author: target.user,
      createdAt: target.createdAt,
      updatedAt: target.updatedAt,
      moderation: {
        isRemoved: target.isRemoved,
        reason: target.isRemoved ? target.removedReason : null,
        date: target.isRemoved ? target.removedAt : null,
      },
    };
  }
}
