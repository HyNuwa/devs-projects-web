import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import {
  CreateCourseDto,
  CoursesQueryDto,
  EnrollmentDto,
  LessonDto,
  SectionDto,
  UpdateCourseDto,
  UpdateLessonDto,
  UpdateSectionDto,
} from '../../common/validation/learning.dto';
import { AuthenticatedUser } from '../authorization/permissions';
import { Permissions } from '../authorization/permissions.guard';
import { CoursesService } from './courses.service';
type UserRequest = { user: AuthenticatedUser };

@ApiTags('Cursos')
@ApiBearerAuth()
@ApiResponse({ status: 200, description: 'Operación sobre cursos' })
@Controller('courses')
export class CoursesController {
  constructor(private readonly service: CoursesService) {}
  @Get()
  @Public()
  @ApiOperation({ summary: 'Consultar catálogo de cursos publicados' })
  list(@Query() query: CoursesQueryDto) {
    return this.service.list(query);
  }
  @Get('management')
  @Permissions('courses:manage')
  @ApiOperation({ summary: 'Listar cursos de todos los estados' })
  managementList(@Query() query: CoursesQueryDto) {
    return this.service.list(query, true);
  }
  @Get(':id/management')
  @Permissions('courses:manage')
  @ApiOperation({ summary: 'Consultar estructura completa del curso' })
  management(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.management(id);
  }
  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Consultar resumen público del curso' })
  summary(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.summary(id);
  }
  @Post()
  @Permissions('courses:manage')
  @ApiOperation({ summary: 'Crear curso en borrador' })
  create(@Body() dto: CreateCourseDto, @Req() req: UserRequest) {
    return this.service.create(dto, req.user.id);
  }
  @Patch(':id')
  @Permissions('courses:manage')
  @ApiOperation({ summary: 'Editar metadatos del curso' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCourseDto) {
    return this.service.update(id, dto);
  }
  @Post(':id/publish')
  @HttpCode(200)
  @Permissions('courses:manage')
  @ApiOperation({ summary: 'Publicar curso válido' })
  publish(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.transition(id, 'PUBLISHED');
  }
  @Post(':id/archive')
  @HttpCode(200)
  @Permissions('courses:manage')
  @ApiOperation({ summary: 'Archivar curso' })
  archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.transition(id, 'ARCHIVED');
  }
  @Post(':id/draft')
  @HttpCode(200)
  @Permissions('courses:manage')
  @ApiOperation({ summary: 'Volver a borrador para editar la estructura' })
  draft(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.transition(id, 'DRAFT');
  }
  @Post(':id/sections')
  @Permissions('courses:manage')
  @ApiOperation({ summary: 'Agregar sección' })
  section(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SectionDto) {
    return this.service.addSection(id, dto);
  }
  @Patch(':id/sections/:sectionId')
  @Permissions('courses:manage')
  @ApiOperation({ summary: 'Editar sección' })
  updateSection(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.service.changeSection(id, sectionId, dto);
  }
  @Delete(':id/sections/:sectionId')
  @Permissions('courses:manage')
  @ApiOperation({ summary: 'Eliminar sección sin archivos' })
  deleteSection(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
  ) {
    return this.service.changeSection(id, sectionId);
  }
  @Post(':id/sections/:sectionId/lessons')
  @Permissions('courses:manage')
  @ApiOperation({ summary: 'Agregar clase' })
  addLesson(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @Body() dto: LessonDto,
  ) {
    return this.service.addLesson(id, sectionId, dto);
  }
  @Patch(':id/lessons/:lessonId')
  @Permissions('courses:manage')
  @ApiOperation({ summary: 'Editar clase' })
  updateLesson(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: UpdateLessonDto,
  ) {
    return this.service.changeLesson(id, lessonId, dto);
  }
  @Delete(':id/lessons/:lessonId')
  @Permissions('courses:manage')
  @ApiOperation({ summary: 'Eliminar clase sin archivos' })
  deleteLesson(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ) {
    return this.service.changeLesson(id, lessonId);
  }
  @Put(':id/enrollment')
  @Permissions('courses:enroll')
  @ApiOperation({ summary: 'Inscribirme al curso' })
  enroll(@Param('id', ParseUUIDPipe) id: string, @Req() req: UserRequest) {
    return this.service.enroll(id, req.user.id);
  }
  @Delete(':id/enrollment')
  @ApiOperation({ summary: 'Desactivar mi inscripción' })
  unenroll(@Param('id', ParseUUIDPipe) id: string, @Req() req: UserRequest) {
    return this.service.unenroll(id, req.user.id);
  }
  @Patch(':id/enrollments/:userId')
  @Permissions('courses:manage')
  @ApiOperation({ summary: 'Activar o revocar una inscripción' })
  enrollment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() dto: EnrollmentDto,
  ) {
    return this.service.setEnrollment(id, userId, dto.active);
  }
  @Get(':id/lessons/:lessonId')
  @ApiOperation({
    summary: 'Leer clase con inscripción activa o permiso administrativo',
  })
  lesson(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Req() req: UserRequest,
  ) {
    return this.service.lesson(id, lessonId, req.user);
  }
}
