import { Body, Controller, Get, Put, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { ReplaceStudyPlansDto } from './dto/replace-study-plans.dto';
import { InstitutionsService } from './institutions.service';

type AuthedRequest = { user: { id: string } };

/** «Mi carrera»: the signed-in student's own declared plans. */
@ApiTags('Instituciones')
@ApiBearerAuth()
@Controller('users/me/study-plans')
export class StudyPlansController {
  constructor(private readonly institutions: InstitutionsService) {}

  @Get()
  @ApiOperation({ summary: 'Mis planes de estudio declarados' })
  list(@Request() req: AuthedRequest) {
    return this.institutions.declaredPlans(req.user.id);
  }

  @Put()
  @ApiOperation({ summary: 'Reemplazar mis planes de estudio declarados' })
  replace(@Request() req: AuthedRequest, @Body() body: ReplaceStudyPlansDto) {
    return this.institutions.replaceDeclaredPlans(req.user.id, body.plans);
  }
}
