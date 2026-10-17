import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../auth/dto/auth-response.dto';
import { AppealsQueryService } from './appeals-query.service';
import { CasesService } from './cases.service';
import type { Actor } from './sanctions.service';

const ADMIN_ROLES = new Set<string>([Role.ADMIN, Role.SUPERADMIN]);

/** Counts for the panel tabs and the admins' overdue notice. */
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
  ) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Casos abiertos y vencidos, apelaciones y propuestas pendientes',
  })
  async summary(@Request() req: { user: Actor }) {
    const viewer = { id: req.user.id, role: req.user.role };
    const isAdmin = ADMIN_ROLES.has(viewer.role);
    const [queue, appeals, proposals] = await Promise.all([
      this.cases.queue(),
      this.appeals.list(viewer),
      isAdmin
        ? this.prisma.suspensionProposal.count({ where: { status: 'PENDING' } })
        : null,
    ]);
    return {
      overdueCases: queue.vencidos.length,
      openCases:
        queue.vencidos.length +
        queue.hidden.length +
        queue.priorReview.length +
        queue.reported.length,
      pendingAppeals: appeals.length,
      pendingProposals: proposals,
    };
  }
}
