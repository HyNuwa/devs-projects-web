import {
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MaterialResourceType } from '../../generated/prisma';
import { Public } from '../../common/decorators/public.decorator';
import {
  DiscoveryCareerListDto,
  DiscoveryCurriculumYearListDto,
  DiscoveryHierarchyQueryDto,
  DiscoveryMaterialFileListDto,
  DiscoveryResourceCategoryListDto,
  DiscoverySubjectListDto,
} from './dto/discovery-hierarchy.dto';
import { DiscoverySuggestionsQueryDto } from './dto/discovery-suggestions-query.dto';
import { DiscoverySuggestionsResponseDto } from './dto/discovery-suggestions-response.dto';
import {
  DiscoveryCourseReviewListDto,
  DiscoveryCourseReviewsQueryDto,
} from './dto/discovery-course-reviews.dto';
import {
  DiscoveryExamExperienceListDto,
  DiscoveryExamExperiencesQueryDto,
} from './dto/discovery-exam-experiences.dto';
import { DiscoveryService } from './discovery.service';

@ApiTags('Discovery')
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('suggestions')
  @Public()
  @ApiOperation({
    summary: 'Sugerir materias y recursos académicos por búsqueda',
  })
  @ApiResponse({ status: 200, type: DiscoverySuggestionsResponseDto })
  @ApiResponse({ status: 400, description: 'Consulta de sugerencias inválida' })
  getSuggestions(@Query() query: DiscoverySuggestionsQueryDto) {
    return this.discoveryService.getSuggestions(query);
  }

  @Get('course-reviews')
  @Public()
  @ApiOperation({
    summary: 'Descubrir reseñas de cursada públicas con filtros y orden',
  })
  @ApiResponse({ status: 200, type: DiscoveryCourseReviewListDto })
  @ApiResponse({ status: 400, description: 'Consulta de reseñas inválida' })
  getCourseReviews(@Query() query: DiscoveryCourseReviewsQueryDto) {
    return this.discoveryService.getCourseReviews(query);
  }

  @Get('course-reviews/:id')
  @Public()
  getCourseReviewDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.discoveryService.getCourseReviewDetail(id);
  }

  @Get('exam-experiences')
  @Public()
  @ApiOperation({ summary: 'Descubrir experiencias de final públicas' })
  @ApiResponse({ status: 200, type: DiscoveryExamExperienceListDto })
  @ApiResponse({ status: 400, description: 'Consulta de finales inválida' })
  getExamExperiences(@Query() query: DiscoveryExamExperiencesQueryDto) {
    return this.discoveryService.getExamExperiences(query);
  }

  @Get('exam-experiences/:id')
  @Public()
  getExamExperienceDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.discoveryService.getExamExperienceDetail(id);
  }

  @Get('hierarchy/careers')
  @Public()
  @ApiOperation({ summary: 'Listar carreras disponibles para materiales' })
  @ApiResponse({ status: 200, type: DiscoveryCareerListDto })
  getCareers(@Query() query: DiscoveryHierarchyQueryDto) {
    return this.discoveryService.getCareers(query);
  }

  @Get('hierarchy/careers/:careerId/years')
  @Public()
  @ApiOperation({ summary: 'Listar años curriculares de una carrera' })
  @ApiParam({ name: 'careerId', format: 'uuid' })
  @ApiResponse({ status: 200, type: DiscoveryCurriculumYearListDto })
  getCurriculumYears(
    @Param('careerId', ParseUUIDPipe) careerId: string,
    @Query() query: DiscoveryHierarchyQueryDto,
  ) {
    return this.discoveryService.getCurriculumYears(careerId, query);
  }

  @Get(
    'hierarchy/careers/:careerId/study-plans/:studyPlanId/years/:year/subjects',
  )
  @Public()
  @ApiOperation({ summary: 'Listar materias de un año curricular' })
  @ApiParam({ name: 'careerId', format: 'uuid' })
  @ApiParam({ name: 'studyPlanId', format: 'uuid' })
  @ApiParam({ name: 'year', type: Number })
  @ApiResponse({ status: 200, type: DiscoverySubjectListDto })
  getSubjects(
    @Param('careerId', ParseUUIDPipe) careerId: string,
    @Param('studyPlanId', ParseUUIDPipe) studyPlanId: string,
    @Param('year', ParseIntPipe) year: number,
    @Query() query: DiscoveryHierarchyQueryDto,
  ) {
    return this.discoveryService.getSubjects(
      careerId,
      studyPlanId,
      year,
      query,
    );
  }

  @Get('hierarchy/subjects/:subjectId/resource-categories')
  @Public()
  @ApiOperation({ summary: 'Listar categorías con recursos aprobados' })
  @ApiParam({ name: 'subjectId', format: 'uuid' })
  @ApiResponse({ status: 200, type: DiscoveryResourceCategoryListDto })
  getResourceCategories(@Param('subjectId', ParseUUIDPipe) subjectId: string) {
    return this.discoveryService.getResourceCategories(subjectId);
  }

  @Get(
    'hierarchy/subjects/:subjectId/resource-categories/:resourceType/materials',
  )
  @Public()
  @ApiOperation({ summary: 'Listar archivos aprobados de una categoría' })
  @ApiParam({ name: 'subjectId', format: 'uuid' })
  @ApiParam({ name: 'resourceType', enum: MaterialResourceType })
  @ApiResponse({ status: 200, type: DiscoveryMaterialFileListDto })
  getMaterialFiles(
    @Param('subjectId', ParseUUIDPipe) subjectId: string,
    @Param('resourceType', new ParseEnumPipe(MaterialResourceType))
    resourceType: MaterialResourceType,
    @Query() query: DiscoveryHierarchyQueryDto,
  ) {
    return this.discoveryService.getMaterialFiles(
      subjectId,
      resourceType,
      query,
    );
  }
}
