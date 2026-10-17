import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import * as fs from 'fs';

import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../auth/dto/auth-response.dto';
import { CasesService } from './cases.service';
import { DecisionsService } from './decisions.service';
import type { Actor } from './sanctions.service';
import { ScopeFilterQueryDto } from './dto/scope-filter.dto';
import { CaseDecisionDto } from './dto/case-decision.dto';
import { RevealAuthorDto } from './dto/reveal-author.dto';
import { HistoryService } from './history.service';

@ApiTags('Moderation')
@ApiBearerAuth()
@Controller('moderation/cases')
@UseGuards(RolesGuard)
@Roles(Role.MODERATOR, Role.ADMIN, Role.SUPERADMIN)
export class CasesController {
  constructor(
    private readonly cases: CasesService,
    private readonly decisions: DecisionsService,
    private readonly history: HistoryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Cola de casos abiertos, agrupada y ordenada' })
  queue(@Request() req: { user: Actor }, @Query() query: ScopeFilterQueryDto) {
    return this.cases.queue(
      { id: req.user.id, role: req.user.role },
      query.facultyId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un caso de moderación' })
  detail(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: Actor },
  ) {
    return this.cases.detail(id, req.user.id, req.user.role);
  }

  @Get(':id/file')
  @ApiOperation({
    summary:
      'Archivo del material del caso, incluido el que espera revisión previa',
  })
  async file(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: Actor },
    @Res() res: Response,
  ) {
    const file = await this.cases.materialFile(id, {
      id: req.user.id,
      role: req.user.role,
    });
    if (file.redirectUrl) return res.redirect(file.redirectUrl);
    if (!file.localPath || !fs.existsSync(file.localPath)) {
      throw new NotFoundException('Archivo no encontrado en el servidor');
    }
    return res.sendFile(file.localPath);
  }

  @Post(':id/decision')
  @ApiOperation({
    summary:
      'Decidir un caso: mantener, retirar, restaurar, aprobar o rechazar',
  })
  decide(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: Actor },
    @Body() dto: CaseDecisionDto,
  ) {
    return this.decisions.decide(
      id,
      { id: req.user.id, role: req.user.role },
      dto,
    );
  }

  @Post(':id/reveal-author')
  @ApiOperation({
    summary: 'Ver el autor de una publicación anónima (queda registrado)',
  })
  revealAuthor(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: Actor },
    @Body() dto: RevealAuthorDto,
  ) {
    return this.history.revealAuthor(
      id,
      { id: req.user.id, role: req.user.role },
      dto.reason,
    );
  }
}
