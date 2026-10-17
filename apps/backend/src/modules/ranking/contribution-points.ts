import { Injectable } from '@nestjs/common';

import type {
  ModerationTargetType,
  PointReason,
  Prisma,
} from '../../generated/prisma';
import { HelpfulPoints } from './helpful-points';
import { PioneerBonus } from './pioneer-bonus';
import { PointLedger } from './point-ledger';

type Tx = Prisma.TransactionClient;

/** What each contribution earns when published (README_PUNTOS_E_INSIGNIAS §3.1). */
export const CONTRIBUTION_POINTS: Record<
  ModerationTargetType,
  { amount: number; reason: PointReason }
> = {
  MATERIAL: { amount: 10, reason: 'MATERIAL_PUBLISHED' },
  COURSE_REVIEW: { amount: 5, reason: 'COURSE_REVIEWED' },
  EXAM_EXPERIENCE: { amount: 5, reason: 'EXAM_EXPERIENCE_SHARED' },
};

export type Contribution = {
  type: ModerationTargetType;
  id: string;
  authorId: string;
  /** Anonymous reseñas and experiencias never earn or lose points. */
  isAnonymous: boolean;
};

/**
 * The points a contribution earns by being `Publicado`, for every path that
 * publishes, retires or restores one: upload, approval, retiro, restoration,
 * appeal, author deletion.
 */
@Injectable()
export class ContributionPoints {
  constructor(
    private readonly ledger: PointLedger,
    private readonly pioneer: PioneerBonus,
    private readonly helpful: HelpfulPoints,
  ) {}

  /** The contribution became `Publicado`; `appeal` awards even during a sanción. */
  async published(
    tx: Tx,
    contribution: Contribution,
    options: { appeal?: boolean; replayAt?: Date } = {},
  ) {
    if (contribution.isAnonymous) return;
    const { amount, reason } = CONTRIBUTION_POINTS[contribution.type];
    await this.ledger.award(tx, {
      userId: contribution.authorId,
      reason,
      referenceId: contribution.id,
      amount,
      appeal: options.appeal,
      replayAt: options.replayAt,
    });
    if (contribution.type === 'MATERIAL') {
      // Its «Me sirvió» count again, oldest first, within the caps; the last
      // one also evaluates the pioneer bonus.
      const marks = await tx.materialHelpfulness.findMany({
        where: { materialId: contribution.id },
        orderBy: { createdAt: 'asc' },
        select: { userId: true, createdAt: true },
      });
      for (const mark of marks) {
        await this.helpful.marked(
          tx,
          { materialId: contribution.id, giverId: mark.userId },
          options.replayAt
            ? { replayAt: mark.createdAt }
            : { appeal: options.appeal },
        );
      }
    }
  }

  /** The contribution stopped being `Publicado`: retired or deleted by its author. */
  async withdrawn(tx: Tx, contribution: Omit<Contribution, 'authorId'>) {
    if (contribution.isAnonymous) return;
    await this.ledger.revert(tx, {
      reason: CONTRIBUTION_POINTS[contribution.type].reason,
      referenceId: contribution.id,
    });
    if (contribution.type === 'MATERIAL') {
      await this.ledger.revertMatching(tx, {
        reason: 'HELPFUL_RECEIVED',
        referencePrefix: `${contribution.id}:`,
      });
      const material = await tx.material.findUnique({
        where: { id: contribution.id },
        select: {
          id: true,
          authorId: true,
          subjectId: true,
          resourceType: true,
        },
      });
      // A retired pioneer keeps its place, so the bonus never passes on.
      if (material) await this.pioneer.revoke(tx, material);
    }
  }
}
