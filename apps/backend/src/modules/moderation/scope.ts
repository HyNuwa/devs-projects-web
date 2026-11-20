import { NotFoundException } from '@nestjs/common';

import { Prisma, type Role } from '../../generated/prisma';
import { SIGNED_CASE } from './escalera-history';

/**
 * Alcance de moderación (openspec moderation/scope): the facultades a viewer
 * covers. Every moderation query goes through one of these builders, so a new
 * surface cannot forget the scope. ADMIN and SUPERADMIN cover everything.
 */
export type Scope = 'ALL' | string[];

type Viewer = { id: string; role: Role };

/** A filter no row satisfies: a moderator without facultades sees nothing. */
export const NOTHING = { id: { in: [] as string[] } };

export async function scopeOf(
  db: Pick<Prisma.TransactionClient, 'moderatorScope'> | ScopeDb,
  viewer: Viewer,
): Promise<Scope> {
  if (viewer.role === 'ADMIN' || viewer.role === 'SUPERADMIN') return 'ALL';
  if (viewer.role !== 'MODERATOR') return [];
  const rows = await db.moderatorScope.findMany({
    where: { userId: viewer.id },
    select: { facultyId: true },
  });
  return rows.map((row: { facultyId: string }) => row.facultyId);
}

/** Narrow structural type so unit tests can pass a fake. */
type ScopeDb = {
  moderatorScope: {
    findMany(args: {
      where: { userId: string };
      select: { facultyId: true };
    }): Promise<{ facultyId: string }[]>;
  };
};

const inFaculties = (faculties: string[]) => ({
  subject: { facultyId: { in: faculties } },
});

/** Casos whose content belongs to a materia of the facultades; none without content. */
export function caseWhere(scope: Scope): Prisma.ModerationCaseWhereInput {
  if (scope === 'ALL') return {};
  if (scope.length === 0) return NOTHING;
  const subject = inFaculties(scope);
  return {
    OR: [
      { material: { is: subject } },
      { courseReview: { is: subject } },
      { examExperience: { is: subject } },
    ],
  };
}

/** Correction suggestions about a material of the facultades. */
export function correctionWhere(
  scope: Scope,
): Prisma.CorrectionSuggestionWhereInput {
  if (scope === 'ALL') return {};
  if (scope.length === 0) return NOTHING;
  return { material: inFaculties(scope) };
}

/**
 * Appeals by their caso; an appeal of a sanción from Usuarios (no caso) by
 * whether the viewer can see the sanctioned account (`account`, from
 * `accountWhere`).
 */
export function appealWhere(
  scope: Scope,
  account: Prisma.UserWhereInput,
): Prisma.AppealWhereInput {
  if (scope === 'ALL') return {};
  if (scope.length === 0) return NOTHING;
  const cases = caseWhere(scope);
  return {
    OR: [
      { case: { is: cases } },
      {
        caseId: null,
        sanction: {
          is: {
            OR: [
              { case: { is: cases } },
              { caseId: null, user: { is: account } },
            ],
          },
        },
      },
    ],
  };
}

/**
 * Accounts with a declared carrera in the facultades, or the named author of a
 * caso about signed content there. A caso about anonymous content never makes
 * its author visible.
 */
export async function accountWhere(
  db: Pick<Prisma.TransactionClient, 'moderationCase'> | AccountDb,
  scope: Scope,
): Promise<Prisma.UserWhereInput> {
  if (scope === 'ALL') return {};
  if (scope.length === 0) return NOTHING;
  const authors = await db.moderationCase.findMany({
    where: {
      AND: [caseWhere(scope), SIGNED_CASE],
      targetAuthorId: { not: null },
    },
    select: { targetAuthorId: true },
    distinct: ['targetAuthorId'],
  });
  return {
    OR: [
      {
        studyPlans: {
          some: { studyPlan: { career: { facultyId: { in: scope } } } },
        },
      },
      {
        id: {
          in: authors.flatMap((row: { targetAuthorId: string | null }) =>
            row.targetAuthorId ? [row.targetAuthorId] : [],
          ),
        },
      },
    ],
  };
}

type AccountDb = {
  moderationCase: {
    findMany(args: unknown): Promise<{ targetAuthorId: string | null }[]>;
  };
};

/**
 * History events (`moderation_events` AS `e`) in the facultades, as SQL: events
 * keep their targets without foreign keys, so Prisma cannot join them, and
 * listing every id of a large facultad would overflow one query. Content events
 * follow the facultad of their materia; events without content follow the
 * accounts the viewer sees, the same accounts as `accountWhere`. Keep both in
 * sync with `caseWhere` and `SIGNED_CASE`.
 */
export function eventScopeSql(faculties: string[]): Prisma.Sql {
  const ids = Prisma.sql`${faculties}::uuid[]`;
  const content = (table: string, column: string) =>
    Prisma.sql`e.${Prisma.raw(`"${column}"`)} IN (
      SELECT t."id" FROM ${Prisma.raw(`"${table}"`)} t
      JOIN "subjects" s ON s."id" = t."subject_id"
      WHERE s."faculty_id" = ANY(${ids}))`;
  return Prisma.sql`(
    ${content('materials', 'material_id')}
    OR ${content('course_reviews', 'course_review_id')}
    OR ${content('exam_experiences', 'exam_experience_id')}
    OR (
      e."material_id" IS NULL AND e."course_review_id" IS NULL AND e."exam_experience_id" IS NULL
      AND (
        EXISTS (
          SELECT 1 FROM "user_study_plans" usp
          JOIN "study_plans" sp ON sp."id" = usp."study_plan_id"
          JOIN "careers" c ON c."id" = sp."career_id"
          WHERE usp."user_id" = e."target_user_id" AND c."faculty_id" = ANY(${ids}))
        OR EXISTS (
          SELECT 1 FROM "moderation_cases" mc
          LEFT JOIN "materials" m ON m."id" = mc."material_id"
          LEFT JOIN "subjects" ms ON ms."id" = m."subject_id"
          LEFT JOIN "course_reviews" cr ON cr."id" = mc."course_review_id"
          LEFT JOIN "subjects" crs ON crs."id" = cr."subject_id"
          LEFT JOIN "exam_experiences" ex ON ex."id" = mc."exam_experience_id"
          LEFT JOIN "subjects" exs ON exs."id" = ex."subject_id"
          WHERE mc."target_author_id" = e."target_user_id"
            AND (ms."faculty_id" = ANY(${ids}) OR crs."faculty_id" = ANY(${ids}) OR exs."faculty_id" = ANY(${ids}))
            AND (mc."material_id" IS NOT NULL OR cr."is_anonymous" = false OR ex."is_anonymous" = false))
      )
    )
  )`;
}

/** The admin filter: one facultad, never wider than the viewer's own scope. */
export function narrow(scope: Scope, facultyId?: string): Scope {
  if (!facultyId) return scope;
  if (scope === 'ALL') return [facultyId];
  return scope.filter((id) => id === facultyId);
}

type ScopeCheckDb = Pick<
  Prisma.TransactionClient,
  | 'moderatorScope'
  | 'moderationCase'
  | 'correctionSuggestion'
  | 'user'
  | 'appeal'
>;

/**
 * Refuses a caso outside the viewer's facultades with the same answer as a caso
 * that does not exist, so the refusal says nothing about it.
 */
export async function assertCaseInScope(
  db: ScopeCheckDb,
  viewer: Viewer,
  caseId: string,
) {
  const scope = await scopeOf(db, viewer);
  if (scope === 'ALL') return;
  const found = await db.moderationCase.count({
    where: { id: caseId, ...caseWhere(scope) },
  });
  if (found === 0) throw new NotFoundException('Caso no encontrado');
}

export async function assertCorrectionInScope(
  db: ScopeCheckDb,
  viewer: Viewer,
  suggestionId: string,
) {
  const scope = await scopeOf(db, viewer);
  if (scope === 'ALL') return;
  const found = await db.correctionSuggestion.count({
    where: { id: suggestionId, ...correctionWhere(scope) },
  });
  if (found === 0) throw new NotFoundException('Sugerencia no encontrada');
}

/** Refuses an account the viewer cannot see like an account that does not exist. */
export async function assertAccountInScope(
  db: ScopeCheckDb,
  viewer: Viewer,
  userId: string,
) {
  const scope = await scopeOf(db, viewer);
  if (scope === 'ALL') return;
  const found = await db.user.count({
    where: { AND: [{ id: userId }, await accountWhere(db, scope)] },
  });
  if (found === 0) throw new NotFoundException('Cuenta no encontrada');
}

/** Refuses an appeal outside the viewer's facultades like a missing one. */
export async function assertAppealInScope(
  db: ScopeCheckDb,
  viewer: Viewer,
  appealId: string,
) {
  const scope = await scopeOf(db, viewer);
  if (scope === 'ALL') return;
  const found = await db.appeal.count({
    where: {
      id: appealId,
      ...appealWhere(scope, await accountWhere(db, scope)),
    },
  });
  if (found === 0) throw new NotFoundException('Apelación no encontrada');
}
