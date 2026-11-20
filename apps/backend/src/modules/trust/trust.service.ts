import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import {
  canSuggestCorrections,
  eligibleToModerate,
  priorityReporter,
  type TrustFacts,
} from './privileges';
import { GOOD_STANDING_DAYS, standing } from './standing';

type Db = PrismaService | Prisma.TransactionClient;

const WINDOW_MS = GOOD_STANDING_DAYS * 86_400_000;

/**
 * Privilegios de confianza (openspec reputation/trust-privileges): loads what
 * they are computed from. Sanciones and retiros of anonymous content count,
 * because privileges are private; callers never show why one is missing to
 * anyone but the account itself.
 */
@Injectable()
export class TrustService {
  constructor(private readonly prisma: PrismaService) {}

  async facts(userId: string, db: Db = this.prisma): Promise<TrustFacts> {
    const now = new Date();
    const since = new Date(now.getTime() - WINDOW_MS);
    const [
      user,
      sanctions,
      retiros,
      recent,
      confirmedReports,
      acceptedCorrections,
    ] = await Promise.all([
      db.user.findUniqueOrThrow({
        where: { id: userId },
        select: { role: true, maxLevel: true, createdAt: true },
      }),
      // Permanent or still running ones matter whenever they started.
      db.sanction.findMany({
        where: { userId, type: { not: 'WARNING' }, voidedAt: null },
        select: {
          type: true,
          startsAt: true,
          endsAt: true,
          liftedAt: true,
          voidedAt: true,
        },
      }),
      db.moderationCase.findMany({
        where: {
          targetAuthorId: userId,
          decision: 'REMOVE',
          revertedAt: null,
          closedAt: { gte: since },
        },
        select: { closedAt: true, revertedAt: true },
      }),
      db.report.groupBy({
        by: ['status'],
        where: {
          reporterId: userId,
          status: { in: ['CONFIRMED', 'DISMISSED'] },
          resolvedAt: { gte: since },
        },
        _count: { _all: true },
      }),
      db.report.count({ where: { reporterId: userId, status: 'CONFIRMED' } }),
      db.correctionSuggestion.count({
        where: { suggesterId: userId, status: 'ACCEPTED' },
      }),
    ]);
    const count = (status: string) =>
      recent.find((row) => row.status === status)?._count._all ?? 0;
    return {
      ...user,
      standing: standing({ sanctions, retiros, now }),
      recentReports: {
        confirmed: count('CONFIRMED'),
        dismissed: count('DISMISSED'),
      },
      confirmedReports,
      acceptedCorrections,
      now,
    };
  }

  /** «Tu progreso»: the two privileges the account may see, never eligibility. */
  async mine(userId: string) {
    const facts = await this.facts(userId);
    return {
      suggestCorrections: canSuggestCorrections(facts),
      priorityReports: priorityReporter(facts),
      standing: facts.standing,
    };
  }

  async canSuggestCorrections(userId: string, db?: Db) {
    return canSuggestCorrections(await this.facts(userId, db)).active;
  }

  async isPriorityReporter(userId: string, db?: Db) {
    return priorityReporter(await this.facts(userId, db)).active;
  }

  async isEligibleToModerate(userId: string, db?: Db) {
    return eligibleToModerate(await this.facts(userId, db));
  }
}
