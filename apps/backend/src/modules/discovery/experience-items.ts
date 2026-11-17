import { Prisma } from '../../generated/prisma';
import { effectiveAvatarCat } from '../users/profile-options';
import {
  MAX_DISCOVERY_COURSE_REVIEW_EXCERPT_LENGTH,
  type DiscoveryCourseReviewDto,
} from './dto/discovery-course-reviews.dto';
import {
  MAX_DISCOVERY_EXAM_EXPERIENCE_EXCERPT_LENGTH,
  type DiscoveryExamExperienceDetailDto,
  type DiscoveryExamExperienceDto,
} from './dto/discovery-exam-experiences.dto';
import type { DiscoveryPublicAuthorDto } from './dto/discovery-public.dto';
import { estimatedStudyHours } from './experiences-summary';

const authorSelect = {
  id: true,
  username: true,
  avatarUrl: true,
  maxLevel: true,
  profileCustomization: { select: { avatarCat: true } },
} satisfies Prisma.UserSelect;

export const publicCourseReviewSelect = {
  id: true,
  academicYear: true,
  shift: true,
  condition: true,
  attempt: true,
  difficulty: true,
  promotionGrade: true,
  recommendation: true,
  professorName: true,
  comment: true,
  isAnonymous: true,
  createdAt: true,
  updatedAt: true,
  subject: {
    select: {
      id: true,
      code: true,
      name: true,
    },
  },
  professor: {
    select: {
      id: true,
      name: true,
    },
  },
  user: { select: authorSelect },
} satisfies Prisma.CourseReviewSelect;

export const publicExamExperienceSelect = {
  id: true,
  year: true,
  session: true,
  format: true,
  examDate: true,
  shift: true,
  examinerName: true,
  difficulty: true,
  difficultyTheory: true,
  difficultyPractice: true,
  outcome: true,
  grade: true,
  boardSize: true,
  durationMinutes: true,
  prepLeadDays: true,
  prepDailyMinutes: true,
  topics: true,
  comment: true,
  isAnonymous: true,
  createdAt: true,
  updatedAt: true,
  subject: { select: { id: true, code: true, name: true } },
  professor: { select: { id: true, name: true } },
  user: { select: authorSelect },
} satisfies Prisma.ExamExperienceSelect;

export type PublicCourseReviewRow = Prisma.CourseReviewGetPayload<{
  select: typeof publicCourseReviewSelect;
}>;

export type PublicExamExperienceRow = Prisma.ExamExperienceGetPayload<{
  select: typeof publicExamExperienceSelect;
}>;

type SelectedAuthor = PublicCourseReviewRow['user'];

/**
 * The public identity of an entry's author (openspec moderation/anonymity):
 * an anonymous entry only ever says «Anónimo» — no id, no avatar — so nothing
 * links it to an account; a named one carries the same facts the perfil
 * público exposes.
 */
export function discoveryPublicAuthor(entry: {
  isAnonymous: boolean;
  user: SelectedAuthor;
}): DiscoveryPublicAuthorDto {
  if (entry.isAnonymous) {
    return { username: 'Anónimo' };
  }
  return {
    id: entry.user.id,
    username: entry.user.username,
    avatarUrl: entry.user.avatarUrl,
    avatarCat: effectiveAvatarCat(
      entry.user.profileCustomization?.avatarCat ?? null,
      entry.user.maxLevel,
    ),
  };
}

function truncateCourseReviewExcerpt(comment: string | null): string | null {
  if (
    !comment ||
    comment.length <= MAX_DISCOVERY_COURSE_REVIEW_EXCERPT_LENGTH
  ) {
    return comment;
  }
  return `${comment.slice(0, MAX_DISCOVERY_COURSE_REVIEW_EXCERPT_LENGTH)}…`;
}

function truncateExamExperienceExcerpt(comment: string | null): string | null {
  if (
    !comment ||
    comment.length <= MAX_DISCOVERY_EXAM_EXPERIENCE_EXCERPT_LENGTH
  ) {
    return comment;
  }
  return `${comment.slice(0, MAX_DISCOVERY_EXAM_EXPERIENCE_EXCERPT_LENGTH)}…`;
}

function subjectLink(subject: {
  id: string;
  code: string | null;
  name: string;
}) {
  return {
    ...subject,
    href: `/materias/${subject.code ?? subject.id}`,
  };
}

const courseReviewBase = (review: PublicCourseReviewRow) => ({
  id: review.id,
  subject: subjectLink(review.subject),
  author: discoveryPublicAuthor(review),
  academicYear: review.academicYear,
  shift: review.shift,
  condition: review.condition,
  attempt: review.attempt,
  difficulty: review.difficulty,
  promotionGrade: review.promotionGrade ?? null,
  recommendation: review.recommendation,
  professor: review.professor,
  professorName: review.professorName,
  createdAt: review.createdAt,
  updatedAt: review.updatedAt,
});

export function toDiscoveryCourseReviewListItem(
  review: PublicCourseReviewRow,
): DiscoveryCourseReviewDto {
  return {
    ...courseReviewBase(review),
    excerpt: truncateCourseReviewExcerpt(review.comment),
  };
}

export function toDiscoveryCourseReviewDetail(review: PublicCourseReviewRow) {
  return {
    ...courseReviewBase(review),
    comment: review.comment,
  };
}

const examExperienceBase = (experience: PublicExamExperienceRow) => ({
  id: experience.id,
  subject: subjectLink(experience.subject),
  author: discoveryPublicAuthor(experience),
  year: experience.year,
  session: experience.session,
  format: experience.format,
  ...(experience.examDate ? { examDate: experience.examDate } : {}),
  ...(experience.shift ? { shift: experience.shift } : {}),
  ...(experience.professor ? { professor: experience.professor } : {}),
  ...(experience.examinerName ? { examinerName: experience.examinerName } : {}),
  ...(experience.difficulty ? { difficulty: experience.difficulty } : {}),
  ...declared('difficultyTheory', experience.difficultyTheory),
  ...declared('difficultyPractice', experience.difficultyPractice),
  ...(experience.outcome ? { outcome: experience.outcome } : {}),
  ...(experience.grade !== null ? { grade: experience.grade } : {}),
  ...declared('boardSize', experience.boardSize),
  ...declared('durationMinutes', experience.durationMinutes),
  createdAt: experience.createdAt,
  updatedAt: experience.updatedAt,
});

/** `{ [key]: value }` for a declared numeric fact, `{}` when it is unknown. */
function declared<K extends string>(
  key: K,
  value: number | null | undefined,
): Partial<Record<K, number>> {
  return value === null || value === undefined
    ? {}
    : ({ [key]: value } as Record<K, number>);
}

export function toDiscoveryExamExperienceListItem(
  experience: PublicExamExperienceRow,
): DiscoveryExamExperienceDto {
  const excerpt = truncateExamExperienceExcerpt(experience.comment);
  return {
    ...examExperienceBase(experience),
    ...(excerpt ? { excerpt } : {}),
  };
}

/** The detail adds the preparación and the temas, which cards never show. */
export function toDiscoveryExamExperienceDetail(
  experience: PublicExamExperienceRow,
): DiscoveryExamExperienceDetailDto {
  const leadDays = experience.prepLeadDays ?? null;
  const dailyMinutes = experience.prepDailyMinutes ?? null;
  return {
    ...examExperienceBase(experience),
    ...declared('prepLeadDays', leadDays),
    ...declared('prepDailyMinutes', dailyMinutes),
    ...declared(
      'estimatedStudyHours',
      estimatedStudyHours(leadDays, dailyMinutes),
    ),
    topics: experience.topics ?? [],
    comment: experience.comment,
  };
}
