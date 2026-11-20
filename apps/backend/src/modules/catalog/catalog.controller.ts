import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../auth/dto/auth-response.dto';
import { CareerRequestsService } from './career-requests.service';
import { CatalogBulkService } from './catalog-bulk.service';
import { CatalogService } from './catalog.service';
import {
  BulkApplyDto,
  BulkPreviewDto,
  CodeProposalDto,
  CreateCareerDto,
  CreateFacultyDto,
  CreateSubjectDto,
  CreateUniversityDto,
  PlacementDto,
  SlugCheckQueryDto,
  UpdateCareerDto,
  UpdateFacultyDto,
  UpdateSubjectDto,
  UpdateUniversityDto,
} from './dto/catalog.dto';

type AuthedRequest = { user: { id: string; role: Role } };
const Uuid = ParseUUIDPipe;

/** The panel's Catálogo tab (openspec academic-structure/catalog-editing). */
@ApiTags('Catálogo')
@ApiBearerAuth()
@Controller('admin/catalog')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class CatalogController {
  constructor(
    private readonly catalog: CatalogService,
    private readonly bulk: CatalogBulkService,
    private readonly requests: CareerRequestsService,
  ) {}

  @Get('universities')
  @ApiOperation({ summary: 'Universidades del catálogo' })
  universities() {
    return this.catalog.universities();
  }

  @Get('universities/:id/faculties')
  @ApiOperation({ summary: 'Facultades de una universidad' })
  faculties(@Param('id', Uuid) id: string) {
    return this.catalog.faculties(id);
  }

  @Get('faculties/:id/careers')
  @ApiOperation({ summary: 'Carreras de una facultad, borradores incluidos' })
  careers(@Param('id', Uuid) id: string) {
    return this.catalog.careers(id);
  }

  @Get('faculties/:id/subjects')
  @ApiOperation({ summary: 'Materias de una facultad' })
  subjects(@Param('id', Uuid) id: string) {
    return this.catalog.subjects(id);
  }

  @Get('slug-check')
  @ApiOperation({ summary: 'A qué apunta un slug viejo, antes de tomarlo' })
  slugCheck(@Query() query: SlugCheckQueryDto) {
    return this.catalog.slugCheck(
      query.kind,
      query.parentId ?? null,
      query.slug,
    );
  }

  @Get('careers/:id')
  @ApiOperation({ summary: 'Una carrera con sus materias' })
  career(@Param('id', Uuid) id: string) {
    return this.catalog.career(id);
  }

  @Post('universities')
  @ApiOperation({ summary: 'Crear una universidad' })
  createUniversity(
    @Request() req: AuthedRequest,
    @Body() body: CreateUniversityDto,
  ) {
    return this.catalog.createUniversity(req.user.id, body);
  }

  @Patch('universities/:id')
  @ApiOperation({ summary: 'Editar una universidad' })
  updateUniversity(
    @Request() req: AuthedRequest,
    @Param('id', Uuid) id: string,
    @Body() body: UpdateUniversityDto,
  ) {
    return this.catalog.updateUniversity(req.user.id, id, body);
  }

  @Post('faculties')
  @ApiOperation({ summary: 'Crear una facultad' })
  createFaculty(@Request() req: AuthedRequest, @Body() body: CreateFacultyDto) {
    return this.catalog.createFaculty(req.user.id, body);
  }

  @Patch('faculties/:id')
  @ApiOperation({ summary: 'Editar una facultad' })
  updateFaculty(
    @Request() req: AuthedRequest,
    @Param('id', Uuid) id: string,
    @Body() body: UpdateFacultyDto,
  ) {
    return this.catalog.updateFaculty(req.user.id, id, body);
  }

  @Post('careers')
  @ApiOperation({ summary: 'Crear una carrera en borrador' })
  createCareer(@Request() req: AuthedRequest, @Body() body: CreateCareerDto) {
    return this.catalog.createCareer(req.user.id, body);
  }

  @Patch('careers/:id')
  @ApiOperation({ summary: 'Editar una carrera' })
  updateCareer(
    @Request() req: AuthedRequest,
    @Param('id', Uuid) id: string,
    @Body() body: UpdateCareerDto,
  ) {
    return this.catalog.updateCareer(req.user.id, id, body);
  }

  @Post('careers/:id/publish')
  @HttpCode(200)
  @ApiOperation({ summary: 'Publicar una carrera en borrador' })
  async publish(@Request() req: AuthedRequest, @Param('id', Uuid) id: string) {
    const { publishedRequestIds, ...result } = await this.catalog.publish(
      req.user.id,
      id,
    );
    // After commit: the students who asked for it get an email.
    await this.requests.notifyPublished(publishedRequestIds);
    return result;
  }

  @Post('careers/:id/unpublish')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Volver una carrera a borrador (si nadie la declaró)',
  })
  unpublish(@Request() req: AuthedRequest, @Param('id', Uuid) id: string) {
    return this.catalog.unpublish(req.user.id, id);
  }

  @Post('subjects/code-proposal')
  @HttpCode(200)
  @ApiOperation({ summary: 'Código propuesto para una materia nueva' })
  async codeProposal(@Body() body: CodeProposalDto) {
    return { code: await this.catalog.proposeCode(body.facultyId, body.name) };
  }

  @Post('subjects')
  @ApiOperation({ summary: 'Crear una materia' })
  createSubject(@Request() req: AuthedRequest, @Body() body: CreateSubjectDto) {
    return this.catalog.createSubject(req.user.id, body);
  }

  @Patch('subjects/:id')
  @ApiOperation({ summary: 'Editar una materia' })
  updateSubject(
    @Request() req: AuthedRequest,
    @Param('id', Uuid) id: string,
    @Body() body: UpdateSubjectDto,
  ) {
    return this.catalog.updateSubject(req.user.id, id, body);
  }

  @Put('careers/:id/placements/:subjectId')
  @ApiOperation({
    summary: 'Ubicar una materia en la carrera (año, cuatrimestre, créditos)',
  })
  setPlacement(
    @Request() req: AuthedRequest,
    @Param('id', Uuid) id: string,
    @Param('subjectId', Uuid) subjectId: string,
    @Body() body: PlacementDto,
  ) {
    return this.catalog.setPlacement(req.user.id, id, subjectId, body);
  }

  @Delete('careers/:id/placements/:subjectId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Quitar una materia de la carrera (no la borra)' })
  async removePlacement(
    @Request() req: AuthedRequest,
    @Param('id', Uuid) id: string,
    @Param('subjectId', Uuid) subjectId: string,
  ) {
    await this.catalog.removePlacement(req.user.id, id, subjectId);
  }

  @Delete('universities/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Borrar una universidad sin facultades' })
  async deleteUniversity(
    @Request() req: AuthedRequest,
    @Param('id', Uuid) id: string,
  ) {
    await this.catalog.deleteUniversity(req.user.id, id);
  }

  @Delete('faculties/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Borrar una facultad vacía' })
  async deleteFaculty(
    @Request() req: AuthedRequest,
    @Param('id', Uuid) id: string,
  ) {
    await this.catalog.deleteFaculty(req.user.id, id);
  }

  @Delete('careers/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Borrar una carrera que nadie declaró' })
  async deleteCareer(
    @Request() req: AuthedRequest,
    @Param('id', Uuid) id: string,
  ) {
    await this.catalog.deleteCareer(req.user.id, id);
  }

  @Delete('subjects/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Borrar una materia sin contenido' })
  async deleteSubject(
    @Request() req: AuthedRequest,
    @Param('id', Uuid) id: string,
  ) {
    await this.catalog.deleteSubject(req.user.id, id);
  }

  @Post('careers/:id/bulk/preview')
  @HttpCode(200)
  @ApiOperation({ summary: 'Vista previa de la carga masiva (no guarda nada)' })
  bulkPreview(@Param('id', Uuid) id: string, @Body() body: BulkPreviewDto) {
    return this.bulk.preview(id, body.text);
  }

  @Post('careers/:id/bulk/apply')
  @HttpCode(200)
  @ApiOperation({ summary: 'Aplicar la carga masiva revisada (todo o nada)' })
  bulkApply(
    @Request() req: AuthedRequest,
    @Param('id', Uuid) id: string,
    @Body() body: BulkApplyDto,
  ) {
    return this.bulk.apply(req.user.id, id, body.rows);
  }
}
