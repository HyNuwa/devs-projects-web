import {
  Body,
  Controller,
  Get,
  HttpCode,
  Injectable,
  Post,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import type { BadgeTier } from '../../../generated/prisma';
import { PrismaService } from '../../../prisma/prisma.service';
import { BADGE_CATALOG, type BadgeState } from './badge-catalog';
import { BadgeService } from './badge.service';
import { type SeenBadgeDto, SeenBadgesDto } from './dto/seen-badges.dto';

const CLOSEST = 3;
const TIERS: BadgeTier[] = ['BRONCE', 'PLATA', 'ORO'];

/** Units whose singular is not the plural without the final s. */
const SINGULAR: Record<string, string> = {
  materias: 'materia',
  'bonos Primera huella': 'bono Primera huella',
  'tipos de material en una materia': 'tipo de material en una materia',
  'ciclos lectivos': 'ciclo lectivo',
  carreras: 'carrera',
  'cuatrimestres seguidos': 'cuatrimestre seguido',
  'reseñas con nombre': 'reseña con nombre',
  'reseñas con todo el contexto': 'reseña con todo el contexto',
  mesas: 'mesa',
  'reportes confirmados': 'reporte confirmado',
};

/** «Te faltan 12 "Me sirvió"», «Te falta 1 materia». */
function missingPhrase(missing: number, unit: string) {
  return missing === 1
    ? `Te falta 1 ${SINGULAR[unit] ?? unit}`
    : `Te faltan ${missing} ${unit}`;
}

/** The grado an insignia's progress leads to: the next one, or none. */
function nextTier(slug: string, state: BadgeState): BadgeTier | null {
  if (!BADGE_CATALOG.find((badge) => badge.slug === slug)?.tiered) return null;
  const current = state.earned[0]?.tier;
  return TIERS[current ? TIERS.indexOf(current) + 1 : 0] ?? null;
}

/**
 * The insignias of «Tu progreso» (openspec reputation/badges): what the account
 * earned, what is pending and the three closest, evaluated when read.
 */
@Injectable()
export class MyBadgesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly badges: BadgeService,
  ) {}

  async list(userId: string) {
    const states = await this.badges.evaluate(userId);
    const [catalog, rows] = await Promise.all([
      this.prisma.badge.findMany({
        where: { slug: { in: BADGE_CATALOG.map((badge) => badge.slug) } },
        orderBy: { sortOrder: 'asc' },
        select: { slug: true, name: true, rarity: true, description: true },
      }),
      this.prisma.userBadge.findMany({
        where: {
          userId,
          badge: { slug: { in: BADGE_CATALOG.map((b) => b.slug) } },
        },
        orderBy: [{ badge: { sortOrder: 'asc' } }, { edition: 'asc' }],
        select: {
          tier: true,
          edition: true,
          earnedAt: true,
          tierUpdatedAt: true,
          seenAt: true,
          badge: { select: { slug: true, name: true, rarity: true } },
        },
      }),
    ]);
    const earnedSlugs = new Set(rows.map((row) => row.badge.slug));
    const stateOf = new Map(states.map((state) => [state.slug, state]));

    const closest = states
      .filter((state) => state.progress !== null)
      .sort(
        (a, b) =>
          b.progress!.current / b.progress!.target -
          a.progress!.current / a.progress!.target,
      )
      .slice(0, CLOSEST)
      .map((state) => {
        const { current, target, unit } = state.progress!;
        return {
          slug: state.slug,
          name: catalog.find((badge) => badge.slug === state.slug)?.name ?? '',
          tier: nextTier(state.slug, stateOf.get(state.slug)!),
          current,
          target,
          missing: missingPhrase(target - current, unit),
        };
      });

    return {
      earned: rows.map((row) => ({
        slug: row.badge.slug,
        name: row.badge.name,
        rarity: row.badge.rarity,
        tier: row.tier,
        edition: row.edition,
        earnedAt: row.tierUpdatedAt ?? row.earnedAt,
        seen: row.seenAt !== null,
      })),
      pending: catalog.filter((badge) => !earnedSlugs.has(badge.slug)),
      closest,
    };
  }

  /** Marks as seen only the insignias the page showed (one could be new since). */
  async markSeen(userId: string, shown: SeenBadgeDto[]) {
    if (shown.length === 0) return;
    await this.prisma.userBadge.updateMany({
      where: {
        userId,
        seenAt: null,
        OR: shown.map(({ slug, edition }) => ({ edition, badge: { slug } })),
      },
      data: { seenAt: new Date() },
    });
  }
}

@ApiTags('Puntos')
@ApiBearerAuth()
@Controller('me')
export class MyBadgesController {
  constructor(private readonly myBadges: MyBadgesService) {}

  @Get('badges')
  @ApiOperation({
    summary: 'Tus insignias: ganadas, pendientes y las más cercanas',
  })
  list(@Request() req: { user: { id: string } }) {
    return this.myBadges.list(req.user.id);
  }

  @Post('badges/seen')
  @HttpCode(204)
  @ApiOperation({ summary: 'Marca tus insignias nuevas como vistas' })
  async seen(
    @Request() req: { user: { id: string } },
    @Body() dto: SeenBadgesDto,
  ) {
    await this.myBadges.markSeen(req.user.id, dto.badges);
  }
}
