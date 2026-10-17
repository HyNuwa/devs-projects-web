import {
  Body,
  Controller,
  Get,
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
import { AppealsQueryService } from './appeals-query.service';
import { AppealsService } from './appeals.service';
import { AnswerAppealDto } from './dto/appeal.dto';
import type { Actor } from './sanctions.service';

type AuthedRequest = { user: Actor };

/** The Apelaciones tab (openspec moderation/appeals). */
@ApiTags('Moderation')
@ApiBearerAuth()
@Controller('moderation/appeals')
@UseGuards(RolesGuard)
@Roles(Role.MODERATOR, Role.ADMIN, Role.SUPERADMIN)
export class AppealsController {
  constructor(
    private readonly queries: AppealsQueryService,
    private readonly appeals: AppealsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Apelaciones pendientes que podés resolver' })
  list(@Request() req: AuthedRequest) {
    return this.queries.list({ id: req.user.id, role: req.user.role });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una apelación' })
  detail(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthedRequest,
  ) {
    return this.queries.detail({ id: req.user.id, role: req.user.role }, id);
  }

  @Post(':id/answer')
  @ApiOperation({ summary: 'Responder una apelación (la respuesta es final)' })
  answer(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthedRequest,
    @Body() dto: AnswerAppealDto,
  ) {
    return this.appeals.answer({ id: req.user.id, role: req.user.role }, id, {
      accept: dto.accept,
      answer: dto.answer,
    });
  }
}
