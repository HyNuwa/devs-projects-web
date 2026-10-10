import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { InstitutionsService } from './institutions.service';

@ApiTags('Instituciones')
@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly institutions: InstitutionsService) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Universidades con sus facultades, carreras y planes',
  })
  catalog() {
    return this.institutions.catalog();
  }
}
