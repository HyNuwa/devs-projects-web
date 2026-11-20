import {
  Controller,
  HttpCode,
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
import { RateLimit, RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { PlanReadingService } from './plan-reading.service';

type AuthedRequest = { user: { id: string; role: Role } };

/** «Leer plan con IA» in the carrera editor (openspec academic-structure/plan-reading). */
@ApiTags('Catálogo')
@ApiBearerAuth()
@Controller('admin/catalog')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class PlanReadingController {
  constructor(private readonly readings: PlanReadingService) {}

  @Post('careers/:id/plan-reading')
  @HttpCode(200)
  @RateLimit('planReading')
  @UseGuards(RateLimitGuard)
  @ApiOperation({
    summary: 'Leer el plan de una carrera en borrador con IA',
  })
  read(@Request() req: AuthedRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.readings.read(req.user.id, id);
  }
}
