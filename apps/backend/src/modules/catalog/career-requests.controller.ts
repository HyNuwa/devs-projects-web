import {
  Body,
  Controller,
  Delete,
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

import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../auth/dto/auth-response.dto';
import { RequiresActiveAccount } from '../moderation/active-account.guard';
import { RateLimit, RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { CareerRequestsService } from './career-requests.service';
import {
  AcceptCareerRequestDto,
  AlreadyLoadedDto,
  CreateCareerRequestDto,
  PendingInFacultyQueryDto,
  RejectCareerRequestDto,
} from './dto/career-requests.dto';

type AuthedRequest = { user: { id: string; role: Role } };
const Uuid = ParseUUIDPipe;

/** A student asks for their carrera (openspec academic-structure/career-requests). */
@ApiTags('Solicitudes de carrera')
@ApiBearerAuth()
@Controller('career-requests')
export class CareerRequestsController {
  constructor(private readonly requests: CareerRequestsService) {}

  @Post()
  @RequiresActiveAccount()
  @RateLimit('careerRequest')
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: 'Pedir una carrera' })
  create(@Request() req: AuthedRequest, @Body() body: CreateCareerRequestDto) {
    return this.requests.create(req.user.id, body);
  }

  @Get()
  @ApiOperation({ summary: 'Solicitudes pendientes de una facultad' })
  pending(
    @Request() req: AuthedRequest,
    @Query() query: PendingInFacultyQueryDto,
  ) {
    return this.requests.pendingInFaculty(req.user.id, query.facultyId);
  }

  @Post(':id/support')
  @HttpCode(204)
  @RequiresActiveAccount()
  @RateLimit('careerRequest')
  @UseGuards(RateLimitGuard)
  @ApiOperation({ summary: '«Yo también»' })
  async support(@Request() req: AuthedRequest, @Param('id', Uuid) id: string) {
    await this.requests.support(req.user.id, id);
  }

  @Delete(':id/support')
  @HttpCode(204)
  @ApiOperation({ summary: 'Quitar mi «Yo también»' })
  async unsupport(
    @Request() req: AuthedRequest,
    @Param('id', Uuid) id: string,
  ) {
    await this.requests.unsupport(req.user.id, id);
  }

  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: 'Retirar mi solicitud' })
  withdraw(@Request() req: AuthedRequest, @Param('id', Uuid) id: string) {
    return this.requests.withdraw(req.user.id, id);
  }
}

/** «Mis solicitudes» in Mi perfil. */
@ApiTags('Solicitudes de carrera')
@ApiBearerAuth()
@Controller('users/me/career-requests')
export class MyCareerRequestsController {
  constructor(private readonly requests: CareerRequestsService) {}

  @Get()
  @ApiOperation({ summary: 'Mis solicitudes de carrera' })
  mine(@Request() req: AuthedRequest) {
    return this.requests.mine(req.user.id);
  }
}

/** The Solicitudes view of the Catálogo tab. */
@ApiTags('Catálogo')
@ApiBearerAuth()
@Controller('admin/catalog/requests')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class AdminCareerRequestsController {
  constructor(private readonly requests: CareerRequestsService) {}

  @Get()
  @ApiOperation({ summary: 'Solicitudes pendientes' })
  pending() {
    return this.requests.pending();
  }

  @Get('count')
  @ApiOperation({ summary: 'Cuántas solicitudes están pendientes' })
  count() {
    return this.requests.pendingCount();
  }

  @Post(':id/accept')
  @HttpCode(200)
  @ApiOperation({ summary: 'Aceptar: crea la carrera en borrador' })
  accept(
    @Request() req: AuthedRequest,
    @Param('id', Uuid) id: string,
    @Body() body: AcceptCareerRequestDto,
  ) {
    return this.requests.accept(req.user.id, id, body);
  }

  @Post(':id/reject')
  @HttpCode(204)
  @ApiOperation({ summary: 'Rechazar con un motivo' })
  async reject(
    @Request() req: AuthedRequest,
    @Param('id', Uuid) id: string,
    @Body() body: RejectCareerRequestDto,
  ) {
    await this.requests.reject(req.user.id, id, body.reason);
  }

  @Post(':id/already-loaded')
  @HttpCode(204)
  @ApiOperation({ summary: 'Marcar como ya cargada' })
  async alreadyLoaded(
    @Request() req: AuthedRequest,
    @Param('id', Uuid) id: string,
    @Body() body: AlreadyLoadedDto,
  ) {
    await this.requests.alreadyLoaded(req.user.id, id, body.careerId);
  }
}
