import { Body, Controller, Get, Put, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ReplaceDeclaredCareersDto } from './dto/replace-study-plans.dto';
import { InstitutionsService } from './institutions.service';

type AuthedRequest = { user: { id: string } };

/** «Mi carrera»: the signed-in student's own declared carreras (ADR 0003). */
@ApiTags('Instituciones')
@ApiBearerAuth()
@Controller('users/me/study-plans')
export class StudyPlansController {
  constructor(private readonly institutions: InstitutionsService) {}

  @Get()
  @ApiOperation({ summary: 'Mis carreras declaradas' })
  list(@Request() req: AuthedRequest) {
    return this.institutions.declaredPlans(req.user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Reemplazar mis carreras declaradas' })
  replace(
    @Request() req: AuthedRequest,
    @Body() body: ReplaceDeclaredCareersDto,
  ) {
    return this.institutions.replaceDeclaredCareers(req.user.id, body.careers);
  }
}
