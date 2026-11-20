import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  ModeratorFacultiesDto,
  PromoteDto,
} from './dto/moderator-faculties.dto';

import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../auth/dto/auth-response.dto';
import {
  ModerationUsersService,
  type UsersFilter,
} from './moderation-users.service';
import type { Actor } from './sanctions.service';

class UsersQueryDto {
  @IsOptional()
  @IsIn(['suggested', 'sanctioned', 'prior-review', 'eligible'])
  filter?: UsersFilter;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  q?: string;
}

/** The Usuarios tab (openspec moderation/sanctions). */
@ApiTags('Moderation')
@ApiBearerAuth()
@Controller('moderation/users')
@UseGuards(RolesGuard)
@Roles(Role.MODERATOR, Role.ADMIN, Role.SUPERADMIN)
export class ModerationUsersController {
  constructor(private readonly users: ModerationUsersService) {}

  @Get()
  @ApiOperation({
    summary:
      'Cuentas con sugerencias, sancionadas o en revisión previa, o por usuario',
  })
  list(@Request() req: { user: Actor }, @Query() query: UsersQueryDto) {
    return this.users.list({ id: req.user.id, role: req.user.role }, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ficha de una cuenta para moderación' })
  file(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: Actor },
  ) {
    return this.users.file({ id: req.user.id, role: req.user.role }, id);
  }

  @Post(':id/promote')
  @HttpCode(200)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Hacer moderadora a una cuenta de estudiante' })
  promote(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: Actor },
    @Body() body: PromoteDto,
  ) {
    return this.users.promote(
      { id: req.user.id, role: req.user.role },
      id,
      body.facultyIds,
    );
  }

  @Put(':id/faculties')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Cambiar las facultades que cubre una moderadora' })
  setFaculties(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: Actor },
    @Body() body: ModeratorFacultiesDto,
  ) {
    return this.users.setFaculties(
      { id: req.user.id, role: req.user.role },
      id,
      body.facultyIds,
    );
  }
}
