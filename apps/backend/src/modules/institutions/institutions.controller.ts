import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { CatalogBrowseService } from './catalog-browse.service';
import { InstitutionsService } from './institutions.service';

@ApiTags('Instituciones')
@Controller('institutions')
export class InstitutionsController {
  constructor(
    private readonly institutions: InstitutionsService,
    private readonly browse: CatalogBrowseService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Universidades con sus facultades y carreras',
  })
  catalog() {
    return this.institutions.catalog();
  }

  @Get('browse')
  @Public()
  @ApiOperation({ summary: 'Universidades para recorrer, con sus cantidades' })
  universities() {
    return this.browse.universities();
  }

  @Get('browse/:uni')
  @Public()
  @ApiOperation({ summary: 'Una universidad con sus facultades' })
  university(@Param('uni') uni: string) {
    return this.browse.university(uni);
  }

  @Get('browse/:uni/:fac')
  @Public()
  @ApiOperation({ summary: 'Una facultad con sus carreras' })
  faculty(@Param('uni') uni: string, @Param('fac') fac: string) {
    return this.browse.faculty(uni, fac);
  }

  @Get('browse/:uni/:fac/:career')
  @Public()
  @ApiOperation({
    summary: 'Una carrera con sus materias por año y cuatrimestre',
  })
  career(
    @Param('uni') uni: string,
    @Param('fac') fac: string,
    @Param('career') career: string,
  ) {
    return this.browse.career(uni, fac, career);
  }
}
