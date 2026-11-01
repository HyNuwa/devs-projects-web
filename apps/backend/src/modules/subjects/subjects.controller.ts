import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import {
  CareerDto,
  LinkStudyPlanDto,
  PageDto,
  StudyPlanDto,
  SubjectDto,
  UpdateSubjectDto,
} from '../../common/validation/learning.dto';
import { Permissions } from '../authorization/permissions.guard';
import { SubjectsService } from './subjects.service';

@ApiTags('Materias')
@ApiBearerAuth()
@ApiResponse({ status: 200, description: 'Contexto académico' })
@Controller()
export class SubjectsController {
  constructor(private readonly service: SubjectsService) {}
  @Get('subjects')
  @Public()
  @ApiOperation({ summary: 'Listar materias' })
  list(@Query() query: PageDto) {
    return this.service.list(query);
  }
  @Get('subjects/:id')
  @Public()
  @ApiOperation({ summary: 'Consultar materia por UUID' })
  find(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.find(id);
  }
  @Post('admin/subjects')
  @Permissions('subjects:manage')
  @ApiOperation({ summary: 'Crear materia' })
  create(@Body() dto: SubjectDto) {
    return this.service.create(dto);
  }
  @Patch('admin/subjects/:id')
  @Permissions('subjects:manage')
  @ApiOperation({ summary: 'Editar materia' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubjectDto,
  ) {
    return this.service.update(id, dto);
  }
  @Post('admin/subjects/:id/study-plans')
  @Permissions('subjects:manage')
  @ApiOperation({ summary: 'Asociar materia a un plan' })
  link(@Param('id', ParseUUIDPipe) id: string, @Body() dto: LinkStudyPlanDto) {
    return this.service.link(id, dto);
  }
  @Get('careers')
  @Public()
  @ApiOperation({ summary: 'Listar carreras' })
  careers(@Query() query: PageDto) {
    return this.service.careers(query);
  }
  @Get('study-plans')
  @Public()
  @ApiOperation({ summary: 'Listar planes de estudio' })
  plans(@Query() query: PageDto) {
    return this.service.plans(query);
  }
  @Post('admin/careers')
  @Permissions('subjects:manage')
  @ApiOperation({ summary: 'Crear carrera' })
  createCareer(@Body() dto: CareerDto) {
    return this.service.createCareer(dto);
  }
  @Post('admin/study-plans')
  @Permissions('subjects:manage')
  @ApiOperation({ summary: 'Crear plan de estudio' })
  createPlan(@Body() dto: StudyPlanDto) {
    return this.service.createPlan(dto);
  }
}
