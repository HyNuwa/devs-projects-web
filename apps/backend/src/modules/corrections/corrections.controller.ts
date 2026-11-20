import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ScopeFilterQueryDto } from '../moderation/dto/scope-filter.dto';

import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../auth/dto/auth-response.dto';
import { CorrectionsService } from './corrections.service';
import { CreateCorrectionDto } from './dto/create-correction.dto';

type AuthedRequest = { user: { id: string; role: Role } };

/** A trusted student suggests a correction to someone else's material. */
@ApiTags('Correcciones')
@ApiBearerAuth()
@Controller('materials/:id')
export class MaterialCorrectionsController {
  constructor(private readonly corrections: CorrectionsService) {}

  @Get('correction-options')
  @ApiOperation({ summary: 'Opciones para sugerir una corrección' })
  options(@Param('id', ParseUUIDPipe) materialId: string) {
    return this.corrections.options(materialId);
  }

  @Post('corrections')
  @ApiOperation({ summary: 'Sugerir una corrección a un material ajeno' })
  create(
    @Param('id', ParseUUIDPipe) materialId: string,
    @Request() req: AuthedRequest,
    @Body() body: CreateCorrectionDto,
  ) {
    return this.corrections.create(req.user.id, materialId, body);
  }
}

/** The author decides first, from «Mis envíos». */
@ApiTags('Correcciones')
@ApiBearerAuth()
@Controller()
export class AuthorCorrectionsController {
  constructor(private readonly corrections: CorrectionsService) {}

  @Get('users/me/correction-suggestions')
  @ApiOperation({ summary: 'Sugerencias abiertas para mis materiales' })
  mine(@Request() req: AuthedRequest) {
    return this.corrections.forAuthor(req.user.id);
  }

  @Post('correction-suggestions/:id/accept')
  @HttpCode(200)
  @ApiOperation({ summary: 'Aceptar una sugerencia para mi material' })
  accept(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthedRequest,
  ) {
    return this.corrections.decideAsAuthor(id, req.user.id, true);
  }

  @Post('correction-suggestions/:id/reject')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rechazar una sugerencia para mi material' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthedRequest,
  ) {
    return this.corrections.decideAsAuthor(id, req.user.id, false);
  }
}

/** The Correcciones tab: suggestions their authors left for 7 days. */
@ApiTags('Moderation')
@ApiBearerAuth()
@Controller('moderation/corrections')
@UseGuards(RolesGuard)
@Roles(Role.MODERATOR, Role.ADMIN, Role.SUPERADMIN)
export class ModerationCorrectionsController {
  constructor(private readonly corrections: CorrectionsService) {}

  @Get()
  @ApiOperation({ summary: 'Correcciones que decide moderación' })
  list(
    @Request() req: { user: { id: string; role: Role } },
    @Query() query: ScopeFilterQueryDto,
  ) {
    // Who suggested proves their good standing on that date: admins only.
    const admin =
      req.user.role === Role.ADMIN || req.user.role === Role.SUPERADMIN;
    return this.corrections.forModeration(
      { id: req.user.id, role: req.user.role },
      admin,
      query.facultyId,
    );
  }

  @Post(':id/accept')
  @HttpCode(200)
  @ApiOperation({ summary: 'Aceptar una corrección' })
  accept(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthedRequest,
  ) {
    return this.corrections.decideAsModeration(
      id,
      { id: req.user.id, role: req.user.role },
      true,
    );
  }

  @Post(':id/reject')
  @HttpCode(200)
  @ApiOperation({ summary: 'Rechazar una corrección' })
  reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: AuthedRequest,
  ) {
    return this.corrections.decideAsModeration(
      id,
      { id: req.user.id, role: req.user.role },
      false,
    );
  }
}
