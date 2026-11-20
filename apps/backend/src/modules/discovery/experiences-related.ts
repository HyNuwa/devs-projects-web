import {
  Prisma,
  type ExamFormat,
  type ExamSession,
  type Shift,
} from '../../generated/prisma';

/**
 * «Mismo contexto» (openspec academic-community/experiences): the facts an
 * entry declared — professor (by catálogo id, or a manual name compared
 * trimmed and case-insensitive) and franja other than NO_INDICO for a reseña;
 * período other than NO_RECUERDO and formato for a final. Only declared facts
 * appear in `sharedContext`, and all of them filter the related entries.
 */
export type ReviewSharedContext = {
  professor?: { id: string; name: string } | { name: string };
  shift?: Shift;
};

export function reviewSharedContext(review: {
  professorId: string | null;
  professorName: string | null;
  professor: { id: string; name: string } | null;
  shift: Shift;
}): ReviewSharedContext | null {
  const professor = review.professor
    ? { id: review.professor.id, name: review.professor.name }
    : review.professorName?.trim()
      ? { name: review.professorName.trim() }
      : undefined;
  const shift = review.shift !== 'NO_INDICO' ? review.shift : undefined;
  if (!professor && !shift) return null;
  return {
    ...(professor ? { professor } : {}),
    ...(shift ? { shift } : {}),
  };
}

export function relatedReviewWhere(review: {
  professorId: string | null;
  professorName: string | null;
  shift: Shift;
}): Prisma.CourseReviewWhereInput | null {
  const professor = review.professorId
    ? { professorId: review.professorId }
    : review.professorName?.trim()
      ? {
          professorName: {
            equals: review.professorName.trim(),
            mode: 'insensitive' as const,
          },
        }
      : null;
  const shift = review.shift !== 'NO_INDICO' ? { shift: review.shift } : null;
  if (!professor && !shift) return null;
  return { ...professor, ...shift };
}

export type ExamSharedContext = {
  session?: ExamSession;
  format: ExamFormat;
};

export function examSharedContext(exam: {
  session: ExamSession;
  format: ExamFormat;
}): ExamSharedContext {
  return {
    ...(exam.session !== 'NO_RECUERDO' ? { session: exam.session } : {}),
    format: exam.format,
  };
}

export function relatedExamWhere(exam: {
  session: ExamSession;
  format: ExamFormat;
}): Prisma.ExamExperienceWhereInput {
  return {
    format: exam.format,
    ...(exam.session !== 'NO_RECUERDO' ? { session: exam.session } : {}),
  };
}
