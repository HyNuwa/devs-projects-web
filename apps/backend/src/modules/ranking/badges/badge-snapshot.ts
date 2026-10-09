import type { Prisma } from '../../../generated/prisma';
import { helpfulGiverSelect, isValidHelpful } from '../helpful-validity';
import type { BadgeSnapshot } from './badge-catalog';

type Tx = Prisma.TransactionClient;

/**
 * Contributions that count: published, or hidden while moderation reviews them,
 * which keep their points too. A retiro or deletion is what takes them away.
 */
const COUNTED = ['PUBLISHED', 'HIDDEN'] as const;

/** Statuses a material had once it was published, for «Primera luz». */
const EVER_PUBLISHED = ['PUBLISHED', 'HIDDEN', 'REMOVED'] as const;

/**
 * Everything an account's insignias are computed from, read once: its published
 * materials with their valid «Me sirvió», its signed published reseñas and
 * experiencias, the pioneer bonuses it holds and its confirmed reportes.
 */
export async function loadBadgeSnapshot(
  tx: Tx,
  userId: string,
): Promise<BadgeSnapshot> {
  const now = new Date();
  const [account, materials, reviews, exams, pioneerBonuses, reports] =
    await Promise.all([
      tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { emailVerified: true, createdAt: true },
      }),
      tx.material.findMany({
        where: {
          authorId: userId,
          publicationStatus: { in: [...COUNTED] },
          isDeleted: false,
        },
        select: {
          id: true,
          subjectId: true,
          resourceType: true,
          academicYear: true,
          createdAt: true,
          publicationStatus: true,
          helpfulness: {
            select: {
              userId: true,
              user: {
                select: {
                  ...helpfulGiverSelect,
                  studyPlans: {
                    where: { status: 'ACTIVE' },
                    select: { studyPlan: { select: { careerId: true } } },
                  },
                },
              },
            },
          },
        },
      }),
      tx.courseReview.findMany({
        where: {
          userId,
          publicationStatus: { in: [...COUNTED] },
          isAnonymous: false,
        },
        select: {
          createdAt: true,
          academicYear: true,
          professorId: true,
          professorName: true,
          shift: true,
          condition: true,
          difficulty: true,
        },
      }),
      tx.examExperience.findMany({
        where: {
          userId,
          publicationStatus: { in: [...COUNTED] },
          isAnonymous: false,
        },
        select: { createdAt: true, session: true, year: true },
      }),
      tx.pointTransaction.count({
        where: {
          userId,
          reason: 'MATERIAL_PIONEER',
          amount: { gt: 0 },
          reversedBy: null,
        },
      }),
      tx.report.findMany({
        where: {
          reporterId: userId,
          status: 'CONFIRMED',
          case: { decision: 'REMOVE', revertedAt: null },
        },
        distinct: ['caseId'],
        select: { caseId: true },
      }),
    ]);

  // The first material ever published in each of the account's materias, in
  // one query: the first row of each subject in this order.
  const firsts = await tx.material.findMany({
    where: {
      subjectId: { in: [...new Set(materials.map((m) => m.subjectId))] },
      publicationStatus: { in: [...EVER_PUBLISHED] },
    },
    distinct: ['subjectId'],
    orderBy: [{ subjectId: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true },
  });
  const firstIds = new Set(firsts.map((first) => first.id));

  return {
    account,
    materials: materials.map((m) => ({
      subjectId: m.subjectId,
      resourceType: m.resourceType,
      academicYear: m.academicYear,
      createdAt: m.createdAt,
      firstInSubject: firstIds.has(m.id),
      // «Me sirvió» are valid only on a published material (§3.2).
      helpfulGiverCareers: (m.publicationStatus === 'PUBLISHED'
        ? m.helpfulness
        : []
      )
        .filter((mark) => isValidHelpful(mark.user, mark.userId, userId, now))
        .map((mark) =>
          mark.user.studyPlans.map((plan) => plan.studyPlan.careerId),
        ),
    })),
    reviews: reviews.map((r) => ({
      createdAt: r.createdAt,
      academicYear: r.academicYear,
      hasProfessor: Boolean(r.professorId || r.professorName?.trim()),
      shift: r.shift,
      condition: r.condition,
      difficulty: r.difficulty,
    })),
    exams,
    pioneerBonuses,
    confirmedReports: reports.length,
  };
}
