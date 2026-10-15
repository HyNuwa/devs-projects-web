import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { assertCaseInScope, eventScopeSql, narrow, scopeOf } from './scope';
import type { Actor } from './sanctions.service';

import {
  Prisma,
  type ModerationEvent,
  type ModerationEventAction,
  type Role,
} from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { CasesService } from './cases.service';
import {
  type ModerationTarget,
  targetColumns,
} from './publication-policy.service';
import { loadTarget } from './targets';

const PAGE_SIZE = 50;
const REVEAL_REASON_MAX = 300;
const ADMIN_ROLES: ReadonlySet<Role> = new Set(['ADMIN', 'SUPERADMIN']);

/**
 * Events only admins see: «Ver autor», and role changes (who was made a
 * moderator follows from eligibility, which counts anonymous retiros).
 */
const ADMIN_ONLY_ACTIONS: ModerationEventAction[] = [
  'AUTHOR_REVEALED',
  'ROLE_CHANGED',
  'MODERATOR_SCOPE_CHANGED',
  // The catálogo belongs to no facultad's moderation (catalog-editing).
  'CATALOG_CREATED',
  'CATALOG_UPDATED',
  'CATALOG_DELETED',
  'CAREER_PUBLISHED',
  'CAREER_UNPUBLISHED',
  'CATALOG_PLACEMENT_CHANGED',
  'CATALOG_BULK_APPLIED',
  'CAREER_REQUEST_RESOLVED',
  'CATALOG_PLAN_READ',
];
const CATALOG_ACTIONS: ReadonlySet<ModerationEventAction> = new Set(
  ADMIN_ONLY_ACTIONS.filter(
    (action) => action.startsWith('CATALOG_') || action.startsWith('CAREER_'),
  ),
);
// Events about the account. Its file and the Apelaciones tab show the account
// with the same reason, text and time, so for a moderator an event from an
// anonymous caso keeps no reason, caso or content (README_MODERACION §9).
const SANCTION_ACTIONS: ReadonlySet<ModerationEventAction> = new Set([
  'WARNED',
  'MUTED',
  'SUSPENDED',
  'SANCTION_LIFTED',
  'SUSPENSION_PROPOSED',
  'SUSPENSION_REJECTED',
]);
const APPEAL_ACTIONS: ReadonlySet<ModerationEventAction> = new Set([
  'APPEAL_FILED',
  'APPEAL_ACCEPTED',
  'APPEAL_REJECTED',
]);

export type HistoryFilters = {
  action?: ModerationEventAction;
  actorId?: string;
  contentId?: string;
  from?: string;
  to?: string;
  cursor?: string;
  facultyId?: string;
};

/** The append-only moderation history and revelación de autor. */
@Injectable()
export class HistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cases: CasesService,
  ) {}

  async list(viewer: Actor, filters: HistoryFilters) {
    const isAdmin = ADMIN_ROLES.has(viewer.role);
    const filtered: Prisma.ModerationEventWhereInput = {
      ...(filters.action
        ? { action: filters.action }
        : isAdmin
          ? {}
          : { action: { notIn: ADMIN_ONLY_ACTIONS } }),
      ...(filters.actorId ? { actorId: filters.actorId } : {}),
      ...(filters.contentId
        ? {
            OR: [
              { materialId: filters.contentId },
              { courseReviewId: filters.contentId },
              { examExperienceId: filters.contentId },
            ],
          }
        : {}),
      ...(filters.from || filters.to
        ? {
            createdAt: {
              ...(filters.from ? { gte: new Date(filters.from) } : {}),
              ...(filters.to ? { lte: new Date(filters.to) } : {}),
            },
          }
        : {}),
    };
    if (
      !isAdmin &&
      filters.action &&
      ADMIN_ONLY_ACTIONS.includes(filters.action)
    ) {
      return { items: [], nextCursor: null };
    }
    const scope = narrow(await scopeOf(this.prisma, viewer), filters.facultyId);
    const events =
      scope === 'ALL'
        ? await this.prisma.moderationEvent.findMany({
            where: filtered,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            take: PAGE_SIZE,
            ...(filters.cursor
              ? { cursor: { id: filters.cursor }, skip: 1 }
              : {}),
          })
        : await this.scopedPage(scope, filters, isAdmin);

    const anonymous = await this.anonymousTargets(events);
    const userIds = [
      ...new Set(
        events.flatMap((event) =>
          [event.actorId, event.targetUserId].filter(
            (id): id is string => id !== null,
          ),
        ),
      ),
    ];
    const users = new Map(
      (
        await this.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, username: true },
        })
      ).map((user) => [user.id, user.username]),
    );

    const visible = events.map((event) => {
      const contentId =
        event.materialId ?? event.courseReviewId ?? event.examExperienceId;
      const hideAuthor =
        !isAdmin &&
        ((contentId !== null && anonymous.contents.has(contentId)) ||
          (event.caseId !== null && anonymous.cases.has(event.caseId)));
      // The author acting on their own anonymous entry (a resubmission) must
      // stay hidden too, or the actor column would reveal them.
      const actorIsHiddenAuthor =
        hideAuthor &&
        event.actorId !== null &&
        event.actorId === event.targetUserId;
      const metadata = event.metadata as {
        label?: string;
        kind?: string;
        from?: string;
        to?: string;
        id?: string;
        before?: unknown;
        after?: unknown;
      } | null;
      const label = metadata?.label ?? null;
      // A sanción, or an appeal of one, is about the account: unlinked from the
      // anonymous caso. An appeal of a retiro keeps its content but, as the
      // read-only appeal, not what the appellant wrote.
      const aboutAccount =
        hideAuthor &&
        (SANCTION_ACTIONS.has(event.action) ||
          (APPEAL_ACTIONS.has(event.action) && metadata?.kind !== 'RETIRO'));
      const hideReason =
        aboutAccount || (hideAuthor && APPEAL_ACTIONS.has(event.action));
      return {
        actorIsHiddenAuthor,
        aboutAccount,
        id: event.id,
        createdAt: event.createdAt,
        action: event.action,
        actor: actorIsHiddenAuthor
          ? { system: false, username: null, hidden: true }
          : event.actorId
            ? { system: false, username: users.get(event.actorId) ?? null }
            : { system: true },
        target:
          event.targetType && !aboutAccount
            ? { type: event.targetType, id: contentId, label }
            : null,
        targetUser:
          event.targetUserId && !hideAuthor
            ? { username: users.get(event.targetUserId) ?? null }
            : null,
        caseId: aboutAccount ? null : event.caseId,
        reason: hideReason ? null : event.reason,
        roleChange:
          event.action === 'ROLE_CHANGED' && metadata?.from && metadata.to
            ? { from: metadata.from, to: metadata.to }
            : null,
        catalog:
          CATALOG_ACTIONS.has(event.action) && metadata
            ? {
                kind: metadata.kind ?? null,
                id: metadata.id ?? null,
                label,
                before: metadata.before ?? null,
                after: metadata.after ?? null,
              }
            : null,
      };
    });
    // Filtering by that actor would link them to the entry just the same. An
    // account event from an anonymous caso is not listed at all: «Advertir
    // también» skips staff authors silently, so whether its WARNED row exists
    // would tell a moderator if the hidden author is staff.
    const items = visible
      .filter((item) => !(filters.actorId && item.actorIsHiddenAuthor))
      .filter((item) => !item.aboutAccount)
      .map(
        ({ actorIsHiddenAuthor: _hidden, aboutAccount: _account, ...item }) =>
          item,
      );

    return {
      items,
      nextCursor: events.length === PAGE_SIZE ? events.at(-1)!.id : null,
    };
  }

  /**
   * One page of the history within the facultades (openspec moderation/scope),
   * in SQL so the scope stays a subquery however large the facultad. The
   * filters mirror `filtered` in `list`, and the cursor its keyset order.
   */
  private async scopedPage(
    faculties: string[],
    filters: HistoryFilters,
    isAdmin: boolean,
  ): Promise<ModerationEvent[]> {
    if (faculties.length === 0) return [];
    const conditions = [eventScopeSql(faculties)];
    if (filters.action) {
      conditions.push(
        Prisma.sql`e."action" = ${filters.action}::"ModerationEventAction"`,
      );
    } else if (!isAdmin) {
      conditions.push(
        Prisma.sql`e."action" <> ALL(${ADMIN_ONLY_ACTIONS}::"ModerationEventAction"[])`,
      );
    }
    if (filters.actorId) {
      conditions.push(Prisma.sql`e."actor_id" = ${filters.actorId}::uuid`);
    }
    if (filters.contentId) {
      const id = Prisma.sql`${filters.contentId}::uuid`;
      conditions.push(
        Prisma.sql`(e."material_id" = ${id} OR e."course_review_id" = ${id} OR e."exam_experience_id" = ${id})`,
      );
    }
    if (filters.from) {
      conditions.push(
        Prisma.sql`e."created_at" >= (${new Date(filters.from).toISOString()}::timestamptz AT TIME ZONE 'UTC')`,
      );
    }
    if (filters.to) {
      conditions.push(
        Prisma.sql`e."created_at" <= (${new Date(filters.to).toISOString()}::timestamptz AT TIME ZONE 'UTC')`,
      );
    }
    if (filters.cursor) {
      conditions.push(
        Prisma.sql`(e."created_at", e."id") < (SELECT c."created_at", c."id" FROM "moderation_events" c WHERE c."id" = ${filters.cursor}::uuid)`,
      );
    }
    const page = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT e."id" FROM "moderation_events" e
      WHERE ${Prisma.join(conditions, ' AND ')}
      ORDER BY e."created_at" DESC, e."id" DESC
      LIMIT ${PAGE_SIZE}`;
    if (page.length === 0) return [];
    return this.prisma.moderationEvent.findMany({
      where: { id: { in: page.map((row) => row.id) } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });
  }

  async revealAuthor(caseId: string, moderator: Actor, reason: string) {
    const moderatorId = moderator.id;
    const trimmed = reason?.trim();
    if (!trimmed || trimmed.length > REVEAL_REASON_MAX) {
      throw new BadRequestException(
        `Escribí por qué necesitás ver al autor (hasta ${REVEAL_REASON_MAX} caracteres)`,
      );
    }

    await assertCaseInScope(this.prisma, moderator, caseId);
    const moderationCase = await this.prisma.moderationCase.findUnique({
      where: { id: caseId },
      select: {
        id: true,
        targetType: true,
        materialId: true,
        courseReviewId: true,
        examExperienceId: true,
      },
    });
    if (!moderationCase) throw new NotFoundException('Caso no encontrado');

    const target: ModerationTarget = {
      type: moderationCase.targetType,
      id: (moderationCase.materialId ??
        moderationCase.courseReviewId ??
        moderationCase.examExperienceId)!,
    };
    const snapshot = await loadTarget(this.prisma, target);
    if (!snapshot) throw new NotFoundException('El contenido ya no existe');
    if (!snapshot.isAnonymous) {
      throw new ConflictException('Esta publicación no es anónima');
    }

    const author = await this.cases.authorSummary(snapshot.authorId);
    await this.prisma.moderationEvent.create({
      data: {
        actorId: moderatorId,
        action: 'AUTHOR_REVEALED',
        ...targetColumns(target),
        targetUserId: snapshot.authorId,
        caseId: moderationCase.id,
        reason: trimmed,
        metadata: { label: snapshot.label },
      },
    });
    return author;
  }

  /**
   * Anonymous content among the events, and casos about anonymous content for
   * events that carry only their caso.
   */
  private async anonymousTargets(
    events: Array<{
      caseId: string | null;
      materialId: string | null;
      courseReviewId: string | null;
      examExperienceId: string | null;
    }>,
  ) {
    const caseIds = events
      .filter(
        (event) =>
          event.caseId !== null &&
          !event.materialId &&
          !event.courseReviewId &&
          !event.examExperienceId,
      )
      .map((event) => event.caseId as string);
    const reviewIds = events
      .map((event) => event.courseReviewId)
      .filter((id): id is string => id !== null);
    const examIds = events
      .map((event) => event.examExperienceId)
      .filter((id): id is string => id !== null);
    const [reviews, exams, cases] = await Promise.all([
      this.prisma.courseReview.findMany({
        where: { id: { in: reviewIds }, isAnonymous: true },
        select: { id: true },
      }),
      this.prisma.examExperience.findMany({
        where: { id: { in: examIds }, isAnonymous: true },
        select: { id: true },
      }),
      caseIds.length === 0
        ? []
        : this.prisma.moderationCase.findMany({
            where: {
              id: { in: caseIds },
              OR: [
                { courseReview: { isAnonymous: true } },
                { examExperience: { isAnonymous: true } },
              ],
            },
            select: { id: true },
          }),
    ]);
    return {
      contents: new Set([...reviews, ...exams].map((entry) => entry.id)),
      cases: new Set(cases.map((entry) => entry.id)),
    };
  }
}
