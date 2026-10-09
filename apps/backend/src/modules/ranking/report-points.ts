import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../generated/prisma';
import { PointLedger } from './point-ledger';

type Tx = Prisma.TransactionClient;

const REPORT_POINTS = 2;

/**
 * Points for reportes that led to a retiro (README_PUNTOS_E_INSIGNIAS §3.1). They
 * go to the reporters, never to the author, so anonymous content counts too.
 */
@Injectable()
export class ReportPoints {
  constructor(private readonly ledger: PointLedger) {}

  /**
   * Locks the author and the reporters of a caso in a fixed order before a
   * retiro moves their points, so two retiros cannot deadlock on each other.
   */
  async lockParticipants(tx: Tx, caseId: string, authorId: string) {
    const reports = await tx.report.findMany({
      where: { caseId },
      select: { reporterId: true },
    });
    await this.ledger.lockAccounts(tx, [
      authorId,
      ...reports.map((report) => report.reporterId),
    ]);
  }

  /** The caso's content was retired: each distinct reporter earns 2. */
  async confirmed(tx: Tx, caseId: string) {
    const reports = await tx.report.findMany({
      where: { caseId, status: 'CONFIRMED' },
      distinct: ['reporterId'],
      orderBy: { createdAt: 'asc' },
      select: { reporterId: true },
    });
    for (const { reporterId } of reports) {
      await this.ledger.award(tx, {
        userId: reporterId,
        reason: 'REPORT_CONFIRMED',
        referenceId: `${caseId}:${reporterId}`,
        amount: REPORT_POINTS,
      });
    }
  }

  /** The retiro was undone, so the reportes were not confirmed after all. */
  async unconfirmed(tx: Tx, caseId: string) {
    await this.ledger.revertMatching(tx, {
      reason: 'REPORT_CONFIRMED',
      referencePrefix: `${caseId}:`,
    });
  }
}
