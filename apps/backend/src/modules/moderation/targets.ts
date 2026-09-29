import type { Prisma, PublicationStatus } from '../../generated/prisma';
import type { ModerationTarget } from './publication-policy.service';

export type TargetSnapshot = {
  authorId: string;
  publicationStatus: PublicationStatus;
  hiddenAt: Date | null;
  isAnonymous: boolean;
  label: string;
  subjectId: string;
};

type Client = Prisma.TransactionClient;

/** Loads what moderation needs to know about a material, reseña or experiencia. */
export async function loadTarget(
  client: Client,
  target: ModerationTarget,
): Promise<TargetSnapshot | null> {
  switch (target.type) {
    case 'MATERIAL': {
      const material = await client.material.findUnique({
        where: { id: target.id },
        select: {
          authorId: true,
          title: true,
          subjectId: true,
          isDeleted: true,
          publicationStatus: true,
          hiddenAt: true,
        },
      });
      if (!material || material.isDeleted) return null;
      return {
        authorId: material.authorId,
        publicationStatus: material.publicationStatus,
        hiddenAt: material.hiddenAt,
        isAnonymous: false,
        label: material.title,
        subjectId: material.subjectId,
      };
    }
    case 'COURSE_REVIEW': {
      const review = await client.courseReview.findUnique({
        where: { id: target.id },
        select: {
          userId: true,
          subjectId: true,
          isAnonymous: true,
          publicationStatus: true,
          hiddenAt: true,
        },
      });
      return review && { ...entrySnapshot(review), label: 'Reseña de cursada' };
    }
    case 'EXAM_EXPERIENCE': {
      const exam = await client.examExperience.findUnique({
        where: { id: target.id },
        select: {
          userId: true,
          subjectId: true,
          isAnonymous: true,
          publicationStatus: true,
          hiddenAt: true,
        },
      });
      return exam && { ...entrySnapshot(exam), label: 'Experiencia de final' };
    }
  }
}

function entrySnapshot(entry: {
  userId: string;
  subjectId: string;
  isAnonymous: boolean;
  publicationStatus: PublicationStatus;
  hiddenAt: Date | null;
}) {
  return {
    authorId: entry.userId,
    subjectId: entry.subjectId,
    isAnonymous: entry.isAnonymous,
    publicationStatus: entry.publicationStatus,
    hiddenAt: entry.hiddenAt,
  };
}

type StatusChange = {
  publicationStatus: PublicationStatus;
  statusChangedAt: Date;
  hiddenAt?: Date | null;
  authorFacingReason?: string | null;
};

/** Writes a publication status change on the right model. */
export async function updateTargetStatus(
  client: Client,
  target: ModerationTarget,
  data: StatusChange,
) {
  switch (target.type) {
    case 'MATERIAL':
      return client.material.update({ where: { id: target.id }, data });
    case 'COURSE_REVIEW':
      return client.courseReview.update({ where: { id: target.id }, data });
    case 'EXAM_EXPERIENCE':
      return client.examExperience.update({ where: { id: target.id }, data });
  }
}
