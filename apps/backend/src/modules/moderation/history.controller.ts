import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { Role as PrismaRole } from '../../generated/prisma';
import { Role } from '../auth/dto/auth-response.dto';
import { HistoryQueryDto } from './dto/history-query.dto';
import { HistoryService } from './history.service';

/** Read-only by design: the history has no update or delete routes. */
@ApiTags('Moderation')
@ApiBearerAuth()
@Controller('moderation/history')
@UseGuards(RolesGuard)
@Roles(Role.MODERATOR, Role.ADMIN, Role.SUPERADMIN)
export class HistoryController {
  constructor(private readonly history: HistoryService) {}

  @Get()
  @ApiOperation({ summary: 'Historial de moderación (solo lectura)' })
  list(
    @Request() req: { user: { role: PrismaRole } },
    @Query() query: HistoryQueryDto,
  ) {
    return this.history.list({ role: req.user.role }, query);
  }
}
