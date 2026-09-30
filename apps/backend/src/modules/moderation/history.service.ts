import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type {
  ModerationEventAction,
  Prisma,
  Role,
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
// Their reason is also in the account's file: matching it would link the
// account to an anonymous caso (README_MODERACION §9).
const SANCTION_ACTIONS: ReadonlySet<ModerationEventAction> = new Set([
  'WARNED',
  'MUTED',
  'SUSPENDED',
  'SUSPENSION_PROPOSED',
]);

export type HistoryFilters = {
  action?: ModerationEventAction;
  actorId?: string;
  contentId?: string;
  from?: string;
  to?: string;
  cursor?: string;
};

/** The append-only moderation history and revelación de autor. */
@Injectable()
export class HistoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cases: CasesService,
  ) {}

  async list(viewer: { role: Role }, filters: HistoryFilters) {
    const isAdmin = ADMIN_ROLES.has(viewer.role);
    const where: Prisma.ModerationEventWhereInput = {
      ...(filters.action
        ? { action: filters.action }
        : isAdmin
          ? {}
          : { action: { not: 'AUTHOR_REVEALED' } }),
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
    if (!isAdmin && filters.action === 'AUTHOR_REVEALED') {
      return { items: [], nextCursor: null };
    }

    const events = await this.prisma.moderationEvent.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: PAGE_SIZE,
      ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    });

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
      const label =
        (event.metadata as { label?: string } | null)?.label ?? null;
      return {
        actorIsHiddenAuthor,
        id: event.id,
        createdAt: event.createdAt,
        action: event.action,
        actor: actorIsHiddenAuthor
          ? { system: false, username: null, hidden: true }
          : event.actorId
            ? { system: false, username: users.get(event.actorId) ?? null }
            : { system: true },
        target: event.targetType
          ? { type: event.targetType, id: contentId, label }
          : null,
        targetUser:
          event.targetUserId && !hideAuthor
            ? { username: users.get(event.targetUserId) ?? null }
            : null,
        caseId: event.caseId,
        reason:
          hideAuthor && SANCTION_ACTIONS.has(event.action)
            ? null
            : event.reason,
      };
    });
    // Filtering by that actor would link them to the entry just the same.
    const items = visible
      .filter((item) => !(filters.actorId && item.actorIsHiddenAuthor))
      .map(({ actorIsHiddenAuthor: _hidden, ...item }) => item);

    return {
      items,
      nextCursor: events.length === PAGE_SIZE ? events.at(-1)!.id : null,
    };
  }

  async revealAuthor(caseId: string, moderatorId: string, reason: string) {
    const trimmed = reason?.trim();
    if (!trimmed || trimmed.length > REVEAL_REASON_MAX) {
      throw new BadRequestException(
        `Escribí por qué necesitás ver al autor (hasta ${REVEAL_REASON_MAX} caracteres)`,
      );
    }

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
