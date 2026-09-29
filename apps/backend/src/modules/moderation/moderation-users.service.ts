import { Injectable, NotFoundException } from '@nestjs/common';

import type { Prisma, Role } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ESCALERA_WINDOW_DAYS,
  type SanctionHistory,
  suggestedStep,
} from './escalera';
import { canSanction, type SanctionAction } from './sanction-rules';
import { type Actor, isSuspended } from './sanctions.service';

const DAY_MS = 24 * 60 * 60 * 1000;
const LIST_LIMIT = 50;
const MIN_RESOLVED_REPORTS = 5;
const ADMIN_ROLES: ReadonlySet<Role> = new Set(['ADMIN', 'SUPERADMIN']);

export type UsersFilter = 'suggested' | 'sanctioned' | 'prior-review';

/**
 * Casos whose content is not anonymous. Casos about anonymous entries never appear
 * in an account's file: linking them requires «Ver autor» from the caso.
 */
const NOT_ANONYMOUS: Prisma.ModerationCaseWhereInput = {
  OR: [
    { materialId: { not: null } },
    { courseReview: { is: { isAnonymous: false } } },
    { examExperience: { is: { isAnonymous: false } } },
  ],
};

const accountSelect = {
  id: true,
  username: true,
  email: true,
  role: true,
  createdAt: true,
  emailVerified: true,
  isBanned: true,
  bannedUntil: true,
  mutedUntil: true,
  studyPlans: {
    where: { status: 'ACTIVE' },
    take: 1,
    select: { studyPlan: { select: { career: { select: { name: true } } } } },
  },
} satisfies Prisma.UserSelect;

type Account = Prisma.UserGetPayload<{ select: typeof accountSelect }>;
type History = SanctionHistory & { lastWarning: Date | null };

/** The Usuarios tab (openspec moderation/sanctions, «Usuarios tab»). */
@Injectable()
export class ModerationUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(viewer: Actor, input: { filter?: UsersFilter; q?: string }) {
    const now = new Date();
    const ids = await this.candidateIds(input, now);
    const accounts = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      select: accountSelect,
    });
    const histories = await this.histories(
      accounts.map((account) => account.id),
    );
    // Keep the candidates' order: most recent retiro or sanción first.
    const rank = new Map(ids.map((id, index) => [id, index]));
    accounts.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
    const users = accounts
      .map((account) => {
        const history = histories.get(account.id) ?? emptyHistory();
        return {
          ...basics(account, now),
          status: statusOf(account, history, now),
          suggestedStep: suggestedStep(history, now),
        };
      })
      .filter(
        (user) =>
          input.q?.trim() ||
          (input.filter !== undefined && input.filter !== 'suggested') ||
          user.suggestedStep !== 'NONE',
      )
      .slice(0, LIST_LIMIT);

    return {
      users,
      proposals: ADMIN_ROLES.has(viewer.role) ? await this.proposals() : null,
    };
  }

  async file(viewer: Actor, userId: string) {
    const now = new Date();
    const since = new Date(now.getTime() - ESCALERA_WINDOW_DAYS * DAY_MS);
    const account = await this.prisma.user.findUnique({
      where: { id: userId },
      select: accountSelect,
    });
    if (!account) throw new NotFoundException('Cuenta no encontrada');

    const [
      history,
      published,
      reports,
      openCases,
      closedCases,
      sanctions,
      dismissed,
      proposal,
    ] = await Promise.all([
      this.histories([userId]).then((map) => map.get(userId) ?? emptyHistory()),
      this.publishedCount(userId),
      this.prisma.report.groupBy({
        by: ['status'],
        where: {
          reporterId: userId,
          status: { in: ['CONFIRMED', 'DISMISSED'] },
        },
        _count: { _all: true },
      }),
      this.prisma.moderationCase.findMany({
        where: { targetAuthorId: userId, status: 'OPEN', ...NOT_ANONYMOUS },
        select: { id: true, kind: true, openedAt: true, ...caseLabelSelect },
      }),
      this.prisma.moderationCase.findMany({
        where: { targetAuthorId: userId, status: 'CLOSED', ...NOT_ANONYMOUS },
        orderBy: { closedAt: 'desc' },
        take: 30,
        select: {
          id: true,
          decision: true,
          closedAt: true,
          revertedAt: true,
          ...caseLabelSelect,
        },
      }),
      this.prisma.sanction.findMany({
        where: { userId },
        orderBy: { startsAt: 'desc' },
        take: 30,
        select: {
          type: true,
          reason: true,
          startsAt: true,
          endsAt: true,
          liftedAt: true,
          voidedAt: true,
          caseId: true,
          case: {
            select: {
              courseReview: { select: { isAnonymous: true } },
              examExperience: { select: { isAnonymous: true } },
            },
          },
        },
      }),
      this.prisma.report.findMany({
        where: { reporterId: userId, status: 'DISMISSED' },
        orderBy: { resolvedAt: 'desc' },
        take: 20,
        select: { reason: true, createdAt: true, resolvedAt: true },
      }),
      this.prisma.suspensionProposal.findFirst({
        where: { userId, status: 'PENDING' },
        select: { id: true, reason: true, durationDays: true, createdAt: true },
      }),
    ]);

    const confirmed =
      reports.find((row) => row.status === 'CONFIRMED')?._count._all ?? 0;
    const dismissedCount =
      reports.find((row) => row.status === 'DISMISSED')?._count._all ?? 0;
    const resolved = confirmed + dismissedCount;
    const reportedOpen = openCases.filter((c) => c.kind === 'REPORTS');

    const timeline = [
      ...closedCases.map((c) => ({
        type: 'CASE' as const,
        date: c.closedAt,
        decision: c.decision,
        reverted: c.revertedAt !== null,
        label: caseLabel(c),
        caseId: c.id,
      })),
      ...sanctions.map((s) => {
        const anonymousCase = Boolean(
          s.case?.courseReview?.isAnonymous ||
          s.case?.examExperience?.isAnonymous,
        );
        return {
          type: 'SANCTION' as const,
          kind: s.type,
          reason: s.reason,
          date: s.startsAt,
          until: s.endsAt,
          lifted: s.liftedAt !== null,
          voided: s.voidedAt !== null,
          ...(anonymousCase
            ? { anonymousCase: true }
            : s.caseId
              ? { caseId: s.caseId }
              : {}),
        };
      }),
      ...dismissed.map((r) => ({
        type: 'REPORT_DISMISSED' as const,
        date: r.resolvedAt ?? r.createdAt,
        reason: r.reason,
      })),
      {
        type: 'ACCOUNT_CREATED' as const,
        date: account.createdAt,
        emailVerified: account.emailVerified,
      },
    ].sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0));

    return {
      ...basics(account, now),
      role: account.role,
      emailMasked: maskEmail(account.email),
      status: statusOf(account, history, now),
      counts: {
        published,
        retiros90d: history.retiros.filter(
          (date) => date.getTime() >= since.getTime(),
        ).length,
      },
      resolvedReports: resolved,
      reportPrecision:
        resolved >= MIN_RESOLVED_REPORTS ? confirmed / resolved : null,
      suggestedStep: suggestedStep(history, now),
      // «Paso sugerido si se retira»: only for casos the viewer may link.
      nextStepIfRetired:
        reportedOpen.length > 0
          ? suggestedStep(
              { ...history, retiros: [...history.retiros, now] },
              now,
            )
          : null,
      openCases: openCases.map((c) => ({
        caseId: c.id,
        kind: c.kind,
        openedAt: c.openedAt,
        label: caseLabel(c),
      })),
      pendingProposal: proposal,
      timeline,
      actions: allowedActions(viewer, account, proposal !== null, now),
    };
  }

  private async candidateIds(
    input: { filter?: UsersFilter; q?: string },
    now: Date,
  ): Promise<string[]> {
    const since = new Date(now.getTime() - ESCALERA_WINDOW_DAYS * DAY_MS);
    const q = input.q?.trim();
    if (q) {
      const found = await this.prisma.user.findMany({
        where: { username: { contains: q, mode: 'insensitive' } },
        take: LIST_LIMIT,
        select: { id: true },
      });
      return found.map((user) => user.id);
    }
    if (input.filter === 'sanctioned') {
      const [restricted, recent] = await Promise.all([
        this.prisma.user.findMany({
          where: { OR: [{ isBanned: true }, { mutedUntil: { gt: now } }] },
          take: LIST_LIMIT,
          select: { id: true },
        }),
        this.prisma.sanction.findMany({
          where: { voidedAt: null, startsAt: { gte: since } },
          orderBy: { startsAt: 'desc' },
          distinct: ['userId'],
          take: LIST_LIMIT,
          select: { userId: true },
        }),
      ]);
      return [
        ...new Set([
          ...recent.map((row) => row.userId),
          ...restricted.map((user) => user.id),
        ]),
      ];
    }
    if (input.filter === 'prior-review') {
      const cases = await this.prisma.moderationCase.findMany({
        where: {
          kind: 'PRIOR_REVIEW',
          status: 'OPEN',
          targetAuthorId: { not: null },
          ...NOT_ANONYMOUS,
        },
        orderBy: { openedAt: 'desc' },
        distinct: ['targetAuthorId'],
        take: LIST_LIMIT,
        select: { targetAuthorId: true },
      });
      return cases.map((c) => c.targetAuthorId!);
    }
    // «Con sugerencias»: accounts with a recent retiro, filtered by their step.
    const cases = await this.prisma.moderationCase.findMany({
      where: {
        decision: 'REMOVE',
        revertedAt: null,
        closedAt: { gte: since },
        targetAuthorId: { not: null },
      },
      orderBy: { closedAt: 'desc' },
      distinct: ['targetAuthorId'],
      take: 200,
      select: { targetAuthorId: true },
    });
    return cases.map((c) => c.targetAuthorId!);
  }

  /** Escalera inputs for several accounts at once. */
  private async histories(userIds: string[]) {
    const [retiros, sanctions] = await Promise.all([
      this.prisma.moderationCase.findMany({
        where: {
          targetAuthorId: { in: userIds },
          decision: 'REMOVE',
          revertedAt: null,
          closedAt: { not: null },
        },
        select: { targetAuthorId: true, closedAt: true },
      }),
      this.prisma.sanction.findMany({
        where: { userId: { in: userIds }, voidedAt: null },
        select: { userId: true, type: true, startsAt: true },
      }),
    ]);
    const map = new Map<string, History>();
    const of = (id: string) => {
      if (!map.has(id)) map.set(id, emptyHistory());
      return map.get(id)!;
    };
    for (const retiro of retiros) {
      of(retiro.targetAuthorId!).retiros.push(retiro.closedAt!);
    }
    for (const sanction of sanctions) {
      const history = of(sanction.userId);
      if (sanction.type === 'WARNING') {
        history.warnings.push(sanction.startsAt);
        if (
          !history.lastWarning ||
          sanction.startsAt.getTime() > history.lastWarning.getTime()
        ) {
          history.lastWarning = sanction.startsAt;
        }
      }
      if (sanction.type === 'MUTE') history.mutes.push(sanction.startsAt);
      if (sanction.type === 'SUSPENSION') {
        history.suspensions.push(sanction.startsAt);
      }
    }
    return map;
  }

  private async publishedCount(userId: string) {
    const [materials, reviews, exams] = await Promise.all([
      this.prisma.material.count({
        where: {
          authorId: userId,
          publicationStatus: 'PUBLISHED',
          isDeleted: false,
        },
      }),
      this.prisma.courseReview.count({
        where: { userId, publicationStatus: 'PUBLISHED' },
      }),
      this.prisma.examExperience.count({
        where: { userId, publicationStatus: 'PUBLISHED' },
      }),
    ]);
    return materials + reviews + exams;
  }

  private async proposals() {
    const rows = await this.prisma.suspensionProposal.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
      take: LIST_LIMIT,
      select: {
        id: true,
        reason: true,
        durationDays: true,
        createdAt: true,
        proposedById: true,
        user: { select: { id: true, username: true } },
      },
    });
    const proposers = await this.prisma.user.findMany({
      where: { id: { in: rows.map((row) => row.proposedById) } },
      select: { id: true, username: true },
    });
    const names = new Map(proposers.map((user) => [user.id, user.username]));
    return rows.map(({ proposedById, ...row }) => ({
      ...row,
      proposedBy: { username: names.get(proposedById) ?? null },
    }));
  }
}

const caseLabelSelect = {
  targetType: true,
  material: { select: { title: true } },
} as const;

function caseLabel(c: {
  targetType: string;
  material: { title: string } | null;
}) {
  if (c.material) return c.material.title;
  return c.targetType === 'COURSE_REVIEW'
    ? 'Reseña de cursada'
    : 'Experiencia de final';
}

function emptyHistory(): History {
  return {
    retiros: [],
    warnings: [],
    mutes: [],
    suspensions: [],
    lastWarning: null,
  };
}

function basics(account: Account, now: Date) {
  return {
    id: account.id,
    username: account.username,
    career: account.studyPlans[0]?.studyPlan.career.name ?? null,
    createdAt: account.createdAt,
    accountAgeDays: Math.floor(
      (now.getTime() - account.createdAt.getTime()) / DAY_MS,
    ),
    emailVerified: account.emailVerified,
  };
}

function statusOf(account: Account, history: History, now: Date) {
  if (isSuspended(account, now)) {
    return { kind: 'SUSPENDED' as const, until: account.bannedUntil };
  }
  if (account.mutedUntil && account.mutedUntil.getTime() > now.getTime()) {
    return { kind: 'MUTED' as const, until: account.mutedUntil };
  }
  const warnedUntil = history.lastWarning
    ? new Date(history.lastWarning.getTime() + ESCALERA_WINDOW_DAYS * DAY_MS)
    : null;
  if (warnedUntil && warnedUntil.getTime() > now.getTime()) {
    return { kind: 'WARNED' as const, until: warnedUntil };
  }
  return { kind: 'ACTIVE' as const, until: null };
}

function allowedActions(
  viewer: Actor,
  account: Account,
  hasProposal: boolean,
  now: Date,
): SanctionAction[] {
  const suspended = isSuspended(account, now);
  const muted =
    account.mutedUntil !== null && account.mutedUntil.getTime() > now.getTime();
  const candidates: SanctionAction[] = [
    'WARN',
    ...(muted ? (['UNMUTE'] as const) : (['MUTE'] as const)),
    ...(suspended
      ? (['LIFT_SUSPENSION'] as const)
      : (['PROPOSE_SUSPENSION', 'SUSPEND'] as const)),
    ...(hasProposal ? (['DECIDE_PROPOSAL'] as const) : []),
  ];
  return candidates.filter(
    (action) => canSanction(viewer, account, action).allowed,
  );
}

/** `juan@gmail.com` → `j••••@gmail.com`. */
export function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  return `${local.slice(0, 1)}••••@${domain ?? ''}`;
}
