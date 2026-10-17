import { Injectable } from '@nestjs/common';

import type {
  ModerationTargetType,
  PublicationStatus,
} from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { canAppeal } from '../moderation/sanction-rules';

export type Submission = {
  type: ModerationTargetType;
  id: string;
  title: string;
  subject: { id: string; code: string | null; name: string };
  isAnonymous: boolean;
  status: PublicationStatus;
  /** The latest reason moderation wrote for the author; never who decided. */
  reason: string | null;
  statusChangedAt: Date;
  createdAt: Date;
  canResubmit: boolean;
  /** For `Retirado`: whether it can still be appealed, and the appeal's answer. */
  retiro: {
    caseId: string;
    decidedAt: Date;
    appealable: boolean;
    appealDeadline: Date | null;
    appeal: {
      status: string;
      answer: string | null;
      answeredAt: Date | null;
    } | null;
  } | null;
};

const subjectSelect = { select: { id: true, code: true, name: true } } as const;
const statusSelect = {
  publicationStatus: true,
  authorFacingReason: true,
  statusChangedAt: true,
  createdAt: true,
  subject: subjectSelect,
} as const;

/** What happened to each of the signed-in author's contributions (Mis envíos). */
@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<Submission[]> {
    const now = new Date();
    const [materials, reviews, exams, retiros] = await Promise.all([
      this.prisma.material.findMany({
        where: { authorId: userId, isDeleted: false },
        select: { id: true, title: true, ...statusSelect },
      }),
      this.prisma.courseReview.findMany({
        where: { userId },
        select: { id: true, isAnonymous: true, ...statusSelect },
      }),
      this.prisma.examExperience.findMany({
        where: { userId },
        select: { id: true, isAnonymous: true, ...statusSelect },
      }),
      this.prisma.moderationCase.findMany({
        where: {
          targetAuthorId: userId,
          decision: 'REMOVE',
          revertedAt: null,
        },
        orderBy: { closedAt: 'desc' },
        select: {
          id: true,
          closedAt: true,
          materialId: true,
          courseReviewId: true,
          examExperienceId: true,
          // Never the reviewer: authors do not see who answered.
          appeal: { select: { status: true, answer: true, answeredAt: true } },
        },
      }),
    ]);
    // The latest retiro of each contribution.
    const retiroByContent = new Map<string, (typeof retiros)[number]>();
    for (const retiro of retiros) {
      const contentId =
        retiro.materialId ?? retiro.courseReviewId ?? retiro.examExperienceId;
      if (contentId && !retiroByContent.has(contentId)) {
        retiroByContent.set(contentId, retiro);
      }
    }
    const retiroFor = (
      id: string,
      status: PublicationStatus,
    ): Submission['retiro'] => {
      const retiro = retiroByContent.get(id);
      if (status !== 'REMOVED' || !retiro?.closedAt) return null;
      const appeal = canAppeal(
        {
          target: {
            kind: 'CASE',
            decision: 'REMOVE',
            decidedAt: retiro.closedAt,
            revertedAt: null,
          },
          isOwner: true,
          alreadyAppealed: retiro.appeal !== null,
        },
        now,
      );
      return {
        caseId: retiro.id,
        decidedAt: retiro.closedAt,
        appealable: appeal.allowed,
        appealDeadline: appeal.allowed ? appeal.deadline : null,
        appeal: retiro.appeal,
      };
    };

    const toSubmission = (
      type: ModerationTargetType,
      entry: (typeof materials)[number] | (typeof reviews)[number],
      title: string,
      isAnonymous: boolean,
    ): Submission => ({
      type,
      id: entry.id,
      title,
      subject: entry.subject,
      isAnonymous,
      status: entry.publicationStatus,
      reason: entry.authorFacingReason,
      statusChangedAt: entry.statusChangedAt,
      createdAt: entry.createdAt,
      canResubmit: entry.publicationStatus === 'REJECTED',
      retiro: retiroFor(entry.id, entry.publicationStatus),
    });

    return [
      ...materials.map((material) =>
        toSubmission('MATERIAL', material, material.title, false),
      ),
      ...reviews.map((review) =>
        toSubmission(
          'COURSE_REVIEW',
          review,
          'Reseña de cursada',
          review.isAnonymous,
        ),
      ),
      ...exams.map((exam) =>
        toSubmission(
          'EXAM_EXPERIENCE',
          exam,
          'Experiencia de final',
          exam.isAnonymous,
        ),
      ),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
