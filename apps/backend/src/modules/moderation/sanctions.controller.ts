import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../auth/dto/auth-response.dto';
import {
  ConfirmProposalDto,
  durationDays,
  LiftDto,
  ProposeSuspensionDto,
  SanctionReasonDto,
  SuspendDto,
} from './dto/sanction.dto';
import { type Actor, SanctionsService } from './sanctions.service';
import { SuspensionProposalsService } from './suspension-proposals.service';

type AuthedRequest = { user: Actor };
const actorOf = (req: AuthedRequest): Actor => ({
  id: req.user.id,
  role: req.user.role,
});

/**
 * Sanciones on accounts (openspec moderation/sanctions). Role limits beyond
 * «moderation only» (who can sanction whom, admin-only suspensiones) are enforced
 * by the services.
 */
@ApiTags('Moderation')
@ApiBearerAuth()
@Controller('moderation')
@UseGuards(RolesGuard)
@Roles(Role.MODERATOR, Role.ADMIN, Role.SUPERADMIN)
export class SanctionsController {
  constructor(
    private readonly sanctions: SanctionsService,
    private readonly proposals: SuspensionProposalsService,
  ) {}

  @Post('users/:id/warn')
  @ApiOperation({ summary: 'Advertir a una cuenta' })
  warn(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthedRequest,
    @Body() dto: SanctionReasonDto,
  ) {
    return this.sanctions.warn(actorOf(req), id, dto.reason, {
      caseId: dto.caseId,
    });
  }

  @Post('users/:id/mute')
  @ApiOperation({ summary: 'Silenciar una cuenta 7 días' })
  mute(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthedRequest,
    @Body() dto: SanctionReasonDto,
  ) {
    return this.sanctions.mute(actorOf(req), id, dto.reason, {
      caseId: dto.caseId,
    });
  }

  @Post('users/:id/unmute')
  @ApiOperation({ summary: 'Quitar el silencio antes de tiempo' })
  unmute(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthedRequest,
    @Body() dto: LiftDto,
  ) {
    return this.sanctions.unmute(actorOf(req), id, dto.reason);
  }

  @Post('users/:id/suspension-proposals')
  @ApiOperation({ summary: 'Proponer una suspensión (la confirma un admin)' })
  propose(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthedRequest,
    @Body() dto: ProposeSuspensionDto,
  ) {
    return this.proposals.propose(
      actorOf(req),
      id,
      dto.reason,
      durationDays(dto.duration),
      { caseId: dto.caseId },
    );
  }

  @Post('users/:id/suspend')
  @ApiOperation({ summary: 'Suspender directamente (solo admin)' })
  suspend(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthedRequest,
    @Body() dto: SuspendDto,
  ) {
    return this.proposals.suspendDirectly(
      actorOf(req),
      id,
      dto.reason,
      durationDays(dto.duration),
      dto.retireContributions ?? false,
    );
  }

  @Post('users/:id/lift-suspension')
  @ApiOperation({ summary: 'Levantar una suspensión antes de tiempo (admin)' })
  liftSuspension(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthedRequest,
    @Body() dto: LiftDto,
  ) {
    return this.sanctions.liftSuspension(actorOf(req), id, dto.reason);
  }

  @Post('suspension-proposals/:id/confirm')
  @ApiOperation({ summary: 'Confirmar una propuesta de suspensión (admin)' })
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthedRequest,
    @Body() dto: ConfirmProposalDto,
  ) {
    return this.proposals.confirm(actorOf(req), id, {
      reason: dto.reason,
      durationDays: dto.duration ? durationDays(dto.duration) : undefined,
      retireContributions: dto.retireContributions,
    });
  }

  @Post('suspension-proposals/:id/reject')
  @ApiOperation({ summary: 'Rechazar una propuesta de suspensión (admin)' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthedRequest,
    @Body() dto: LiftDto,
  ) {
    return this.proposals.reject(actorOf(req), id, dto.reason);
  }
}
