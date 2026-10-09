import { Injectable } from '@nestjs/common';

import type { Prisma } from '../../generated/prisma';
import { PioneerBonus } from './pioneer-bonus';
import { helpfulGiverSelect, isValidHelpful } from './helpful-validity';
import { PointLedger } from './point-ledger';

type Tx = Prisma.TransactionClient;

export type HelpfulMark = { materialId: string; giverId: string };

const reference = (mark: HelpfulMark) => `${mark.materialId}:${mark.giverId}`;

/**
 * Points from «Me sirvió» (README_PUNTOS_E_INSIGNIAS §3.2). A mark is valid when
 * its giver has a verified email and no active sanción, is not the author, and
 * the material is `Publicado`. The ledger applies the caps.
 */
@Injectable()
export class HelpfulPoints {
  constructor(
    private readonly ledger: PointLedger,
    private readonly pioneer: PioneerBonus,
  ) {}

  async marked(
    tx: Tx,
    mark: HelpfulMark,
    options: { appeal?: boolean; replayAt?: Date } = {},
  ) {
    // The material row is locked, so a retiro or deletion committing meanwhile
    // cannot leave a point on a material that is no longer published. NO KEY
    // UPDATE, because the «Me sirvió» row just inserted holds a KEY SHARE lock
    // on it and FOR UPDATE would deadlock two concurrent marks.
    const [material] = await tx.$queryRaw<
      {
        authorId: string;
        publicationStatus: string;
        isDeleted: boolean;
      }[]
    >`SELECT "author_id" AS "authorId", "publication_status"::text AS "publicationStatus",
             "is_deleted" AS "isDeleted"
      FROM "materials" WHERE "id" = ${mark.materialId}::uuid FOR NO KEY UPDATE`;
    const giver = await tx.user.findUnique({
      where: { id: mark.giverId },
      select: helpfulGiverSelect,
    });
    if (
      !material ||
      !giver ||
      material.isDeleted ||
      material.publicationStatus !== 'PUBLISHED' ||
      !isValidHelpful(giver, mark.giverId, material.authorId, new Date(), {
        ignoreSanction: Boolean(options.replayAt),
      })
    ) {
      return false;
    }
    const awarded = await this.ledger.award(tx, {
      userId: material.authorId,
      reason: 'HELPFUL_RECEIVED',
      referenceId: reference(mark),
      amount: 1,
      appeal: options.appeal,
      replayAt: options.replayAt,
    });
    // The bonus counts valid marks, whether or not a cap stopped this point.
    await this.pioneer.evaluate(tx, mark.materialId, options);
    return awarded;
  }

  /** The mark was removed: the point it earned, if any, is reverted. */
  async unmarked(tx: Tx, mark: HelpfulMark) {
    return this.ledger.revert(tx, {
      reason: 'HELPFUL_RECEIVED',
      referenceId: reference(mark),
    });
  }
}
