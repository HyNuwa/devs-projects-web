import type { PointReason } from '../../generated/prisma';
import type { PrismaService } from '../../prisma/prisma.service';

type Db = Pick<
  PrismaService,
  | 'material'
  | 'courseReview'
  | 'examExperience'
  | 'moderationCase'
  | 'correctionSuggestion'
  | 'studyPlanSubject'
>;

export type Movement = { reason: PointReason; referenceId: string | null };

const firstSegment = (referenceId: string) => referenceId.split(':')[0];

/** Ids are uuid columns: anything else (a hand-made reference) resolves to null. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The materia each movimiento is about (openspec reputation/rankings), aligned
 * with `movements`, or null for guías, legacy adjustments and contributions
 * that no longer exist. Materials, reseñas and experiencias give their current
 * materia; a confirmed reporte gives its case target's, an accepted correction
 * its material's. The pioneer bonus names its materia in the reference.
 */
export async function materiaOf(db: Db, movements: Movement[]) {
  const ids = (reasons: PointReason[]) => [
    ...new Set(
      movements
        .filter((m) => reasons.includes(m.reason) && m.referenceId)
        .map((m) => firstSegment(m.referenceId!))
        .filter((id) => UUID.test(id)),
    ),
  ];

  const [cases, suggestions] = await Promise.all([
    db.moderationCase.findMany({
      where: { id: { in: ids(['REPORT_CONFIRMED']) } },
      select: {
        id: true,
        materialId: true,
        courseReviewId: true,
        examExperienceId: true,
      },
    }),
    db.correctionSuggestion.findMany({
      where: { id: { in: ids(['CORRECTION_ACCEPTED']) } },
      select: { id: true, materialId: true },
    }),
  ]);

  const materialIds = new Set([
    ...ids(['MATERIAL_PUBLISHED', 'HELPFUL_RECEIVED']),
    ...cases.flatMap((c) => (c.materialId ? [c.materialId] : [])),
    ...suggestions.map((s) => s.materialId),
  ]);
  const reviewIds = new Set([
    ...ids(['COURSE_REVIEWED']),
    ...cases.flatMap((c) => (c.courseReviewId ? [c.courseReviewId] : [])),
  ]);
  const examIds = new Set([
    ...ids(['EXAM_EXPERIENCE_SHARED']),
    ...cases.flatMap((c) => (c.examExperienceId ? [c.examExperienceId] : [])),
  ]);

  const select = { id: true, subjectId: true } as const;
  const [materials, reviews, exams] = await Promise.all([
    db.material.findMany({ where: { id: { in: [...materialIds] } }, select }),
    db.courseReview.findMany({ where: { id: { in: [...reviewIds] } }, select }),
    db.examExperience.findMany({ where: { id: { in: [...examIds] } }, select }),
  ]);
  const subjectOf = (rows: { id: string; subjectId: string }[]) =>
    new Map(rows.map((row) => [row.id, row.subjectId]));
  const material = subjectOf(materials);
  const review = subjectOf(reviews);
  const exam = subjectOf(exams);
  const caseSubject = new Map(
    cases.map((c) => [
      c.id,
      (c.materialId && material.get(c.materialId)) ||
        (c.courseReviewId && review.get(c.courseReviewId)) ||
        (c.examExperienceId && exam.get(c.examExperienceId)) ||
        null,
    ]),
  );
  const suggestionSubject = new Map(
    suggestions.map((s) => [s.id, material.get(s.materialId) ?? null]),
  );

  return movements.map(({ reason, referenceId }): string | null => {
    if (!referenceId) return null;
    const id = firstSegment(referenceId);
    switch (reason) {
      case 'MATERIAL_PUBLISHED':
      case 'HELPFUL_RECEIVED':
        return material.get(id) ?? null;
      case 'MATERIAL_PIONEER':
        return UUID.test(id) ? id : null;
      case 'COURSE_REVIEWED':
        return review.get(id) ?? null;
      case 'EXAM_EXPERIENCE_SHARED':
        return exam.get(id) ?? null;
      case 'REPORT_CONFIRMED':
        return caseSubject.get(id) ?? null;
      case 'CORRECTION_ACCEPTED':
        return suggestionSubject.get(id) ?? null;
      default:
        return null;
    }
  });
}

/** Each materia's carreras: those with a plan that includes it. */
export async function careersOf(db: Db, subjectIds: string[]) {
  const rows = await db.studyPlanSubject.findMany({
    where: {
      subjectId: { in: [...new Set(subjectIds)].filter((id) => UUID.test(id)) },
    },
    select: { subjectId: true, studyPlan: { select: { careerId: true } } },
  });
  const careers = new Map<string, Set<string>>();
  for (const { subjectId, studyPlan } of rows) {
    const set = careers.get(subjectId) ?? new Set<string>();
    set.add(studyPlan.careerId);
    careers.set(subjectId, set);
  }
  return careers;
}
