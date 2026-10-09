import { Injectable } from '@nestjs/common';

import type { MaterialResourceType, Prisma } from '../../generated/prisma';
import { isSanctioned, PointLedger } from './point-ledger';

type Tx = Prisma.TransactionClient;

const PIONEER_POINTS = 5;
const PIONEER_HELPFUL = 3;

/** Statuses a material had once it was published: a retired pioneer still counts. */
const EVER_PUBLISHED = ['PUBLISHED', 'HIDDEN', 'REMOVED'] as const;

export type PioneerOptions = { appeal?: boolean; replayAt?: Date };

/** The materia and type of the bonus; the reference appends the holding material. */
const slot = (subjectId: string, type: MaterialResourceType) =>
  `${subjectId}:${type}:`;

/**
 * «Primera huella» points (README_PUNTOS_E_INSIGNIAS §3.1): the first material
 * ever published of a type in a materia earns 5 once it has 3 valid «Me sirvió».
 * `OTRO` is excluded. The bonus is awarded once per materia and type: once a
 * material held it, no other material can earn it, so a retired or deleted
 * pioneer never passes it on. The reference names the holding material, so only
 * that material's retiro, deletion or edit takes it back.
 */
@Injectable()
export class PioneerBonus {
  constructor(private readonly ledger: PointLedger) {}

  /** Awards the bonus if `materialId` qualifies now. */
  async evaluate(tx: Tx, materialId: string, options: PioneerOptions = {}) {
    const material = await tx.material.findUnique({
      where: { id: materialId },
      select: {
        id: true,
        authorId: true,
        subjectId: true,
        resourceType: true,
        publicationStatus: true,
        isDeleted: true,
      },
    });
    if (
      !material ||
      material.isDeleted ||
      material.publicationStatus !== 'PUBLISHED' ||
      material.resourceType === 'OTRO' ||
      (await this.heldByAnother(tx, material)) ||
      !(await this.isFirst(tx, material)) ||
      (await this.validHelpful(tx, material)) < PIONEER_HELPFUL
    ) {
      return false;
    }
    return this.ledger.award(tx, {
      userId: material.authorId,
      reason: 'MATERIAL_PIONEER',
      referenceId:
        slot(material.subjectId, material.resourceType) + material.id,
      amount: PIONEER_POINTS,
      appeal: options.appeal,
      replayAt: options.replayAt,
    });
  }

  /**
   * Reverts the bonus this material holds under the given materia and type, if
   * any: on retiro, deletion, or before its materia or type changes.
   */
  async revoke(
    tx: Tx,
    material: {
      id: string;
      subjectId: string;
      resourceType: MaterialResourceType;
    },
  ) {
    return this.ledger.revert(tx, {
      reason: 'MATERIAL_PIONEER',
      referenceId:
        slot(material.subjectId, material.resourceType) + material.id,
    });
  }

  /** Whether another material of this materia and type ever held the bonus. */
  private async heldByAnother(
    tx: Tx,
    material: {
      id: string;
      subjectId: string;
      resourceType: MaterialResourceType;
    },
  ) {
    const prefix = slot(material.subjectId, material.resourceType);
    const other = await tx.pointTransaction.findFirst({
      where: {
        reason: 'MATERIAL_PIONEER',
        referenceId: { startsWith: prefix, not: prefix + material.id },
      },
      select: { id: true },
    });
    return other !== null;
  }

  private async isFirst(
    tx: Tx,
    material: {
      id: string;
      subjectId: string;
      resourceType: MaterialResourceType;
    },
  ) {
    const first = await tx.material.findFirst({
      where: {
        subjectId: material.subjectId,
        resourceType: material.resourceType,
        publicationStatus: { in: [...EVER_PUBLISHED] },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: { id: true },
    });
    return first?.id === material.id;
  }

  /** «Me sirvió» from verified, unsanctioned accounts other than the author. */
  private async validHelpful(
    tx: Tx,
    material: { id: string; authorId: string },
  ) {
    const marks = await tx.materialHelpfulness.findMany({
      where: {
        materialId: material.id,
        userId: { not: material.authorId },
        user: { emailVerified: true },
      },
      select: {
        user: {
          select: { mutedUntil: true, isBanned: true, bannedUntil: true },
        },
      },
    });
    const now = new Date();
    return marks.filter((mark) => !isSanctioned(mark.user, now)).length;
  }
}
