import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../auth/dto/auth-response.dto';
import { CorrectionsService } from '../corrections/corrections.service';
import { AppealsQueryService } from './appeals-query.service';
import { CasesService } from './cases.service';
import { ScopeFilterQueryDto } from './dto/scope-filter.dto';
import type { Actor } from './sanctions.service';
import { scopeOf } from './scope';

const ADMIN_ROLES = new Set<string>([Role.ADMIN, Role.SUPERADMIN]);

/**
 * Counts for the panel tabs and the admins' overdue notice, within the viewer's
 * facultades, and the viewer's alcance de moderación for the «Tu rol» label.
 */
@ApiTags('Moderation')
@ApiBearerAuth()
@Controller('moderation')
@UseGuards(RolesGuard)
@Roles(Role.MODERATOR, Role.ADMIN, Role.SUPERADMIN)
export class ModerationSummaryController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cases: CasesService,
    private readonly appeals: AppealsQueryService,
    private readonly corrections: CorrectionsService,
  ) {}

  @Get('summary')
  @ApiOperation({
    summary:
      'Casos abiertos y vencidos, correcciones, apelaciones y propuestas pendientes',
  })
  async summary(
    @Request() req: { user: Actor },
    @Query() query: ScopeFilterQueryDto,
  ) {
    const viewer = { id: req.user.id, role: req.user.role };
    const isAdmin = ADMIN_ROLES.has(viewer.role);
    const { facultyId } = query;
    const [queue, appeals, proposals, corrections, scope] = await Promise.all([
      this.cases.queue(viewer, facultyId),
      this.appeals.list(viewer, facultyId),
      isAdmin
        ? this.prisma.suspensionProposal.count({ where: { status: 'PENDING' } })
        : null,
      this.corrections.countForModeration(viewer, facultyId),
      this.scope(viewer),
    ]);
    return {
      overdueCases: queue.vencidos.length,
      openCases:
        queue.vencidos.length +
        queue.hidden.length +
        queue.priorReview.length +
        queue.reported.length,
      pendingAppeals: appeals.length,
      pendingCorrections: corrections,
      pendingProposals: proposals,
      scope,
    };
  }

  private async scope(viewer: Actor) {
    const scope = await scopeOf(this.prisma, viewer);
    if (scope === 'ALL') return { all: true, faculties: [] };
    const faculties = await this.prisma.faculty.findMany({
      where: { id: { in: scope } },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        shortName: true,
        university: { select: { shortName: true } },
      },
    });
    return { all: false, faculties };
  }
}
