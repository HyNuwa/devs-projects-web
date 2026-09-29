import { Injectable } from '@nestjs/common';

import type {
  ModerationTargetType,
  PublicationStatus,
} from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';

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
    const [materials, reviews, exams] = await Promise.all([
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
    ]);

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
