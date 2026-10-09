import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

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
  @IsIn(['suggested', 'sanctioned', 'prior-review'])
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
}
