import { Controller, Get, Injectable, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { PointReason } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { levelForPoints, nextLevel, RPG_LEVELS } from './rpg-levels';

const MOVEMENTS = 20;

type Movement = {
  id: string;
  reason: PointReason;
  amount: number;
  createdAt: Date;
  referenceId: string | null;
  reversesId: string | null;
};

/**
 * «Tu progreso» (openspec reputation/points): the account's own nivel, points
 * and latest movimientos. A movimiento names only the student's own
 * contribution: never who gave a «Me sirvió» nor what a reporte was about.
 */
@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async progress(userId: string) {
    const [account, movements] = await Promise.all([
      this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { points: true },
      }),
      this.prisma.pointTransaction.findMany({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: MOVEMENTS,
        select: {
          id: true,
          reason: true,
          amount: true,
          createdAt: true,
          referenceId: true,
          reversesId: true,
        },
      }),
    ]);
    const level = levelForPoints(account.points);
    const next = nextLevel(account.points);
    const subjects = await this.subjects(movements);
    return {
      level,
      levelName: RPG_LEVELS[level - 1].name,
      points: Math.max(0, account.points),
      next: next
        ? {
            level: next.level,
            name: next.name,
            threshold: next.points,
            missing: next.missing,
            unlocks: next.unlocks,
          }
        : null,
      levels: RPG_LEVELS.map(({ level: number, name, points }) => ({
        level: number,
        name,
        threshold: points,
      })),
      movements: movements.map((movement) => ({
        reason: movement.reason,
        amount: movement.amount,
        createdAt: movement.createdAt,
        reversal: movement.reversesId !== null,
        subject: subjects.get(movement.id) ?? null,
      })),
    };
  }

  /** The student's own contribution each movimiento refers to, if any. */
  private async subjects(movements: Movement[]) {
    const materialOf = (movement: Movement) =>
      movement.reason === 'MATERIAL_PUBLISHED' ||
      movement.reason === 'HELPFUL_RECEIVED'
        ? movement.referenceId?.split(':')[0]
        : undefined;
    const idsFor = (reason: PointReason) =>
      movements
        .filter((movement) => movement.reason === reason)
        .map((movement) => movement.referenceId!)
        .filter(Boolean);

    const [materials, reviews, exams] = await Promise.all([
      this.prisma.material.findMany({
        where: {
          id: {
            in: movements
              .map(materialOf)
              .filter((id): id is string => Boolean(id)),
          },
        },
        select: { id: true, title: true },
      }),
      this.prisma.courseReview.findMany({
        where: { id: { in: idsFor('COURSE_REVIEWED') } },
        select: { id: true, subject: { select: { name: true } } },
      }),
      this.prisma.examExperience.findMany({
        where: { id: { in: idsFor('EXAM_EXPERIENCE_SHARED') } },
        select: { id: true, subject: { select: { name: true } } },
      }),
    ]);
    const titles = new Map<string, { type: string; title: string }>([
      ...materials.map(
        (m) => [m.id, { type: 'MATERIAL', title: m.title }] as const,
      ),
      ...reviews.map(
        (r) =>
          [
            r.id,
            { type: 'COURSE_REVIEW', title: `Reseña de ${r.subject.name}` },
          ] as const,
      ),
      ...exams.map(
        (e) =>
          [
            e.id,
            {
              type: 'EXAM_EXPERIENCE',
              title: `Experiencia de final de ${e.subject.name}`,
            },
          ] as const,
      ),
    ]);

    const result = new Map<string, { type: string; title: string }>();
    for (const movement of movements) {
      const key =
        materialOf(movement) ??
        (movement.reason === 'COURSE_REVIEWED' ||
        movement.reason === 'EXAM_EXPERIENCE_SHARED'
          ? movement.referenceId
          : null);
      const subject = key ? titles.get(key) : undefined;
      if (subject) result.set(movement.id, subject);
    }
    return result;
  }
}

@ApiTags('Puntos')
@ApiBearerAuth()
@Controller('me')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get('progress')
  @ApiOperation({ summary: 'Tu progreso: nivel, puntos y últimos movimientos' })
  progress(@Request() req: { user: { id: string } }) {
    return this.progressService.progress(req.user.id);
  }
}
