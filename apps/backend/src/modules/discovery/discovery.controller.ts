import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
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
import { SubjectExperiencesSummaryDto } from './dto/discovery-experiences-summary.dto';
import {
  DiscoveryExperiencesOverviewQueryDto,
  ExperiencesOverviewDto,
} from './dto/discovery-experiences-overview.dto';
import {
  CourseReviewRelatedDto,
  ExamExperienceRelatedDto,
} from './dto/discovery-experiences-related.dto';
import { DiscoveryService } from './discovery.service';

@ApiTags('Discovery')
@Controller('discovery')
export class DiscoveryController {
  constructor(private readonly discoveryService: DiscoveryService) {}

  @Get('experiences/overview')
  @Public()
  @ApiOperation({
    summary: 'Materias más comentadas y experiencias recién publicadas',
  })
  @ApiResponse({ status: 200, type: ExperiencesOverviewDto })
  @ApiResponse({ status: 400, description: 'Consulta de overview inválida' })
  getExperiencesOverview(@Query() query: DiscoveryExperiencesOverviewQueryDto) {
    return this.discoveryService.getExperiencesOverview(query);
  }

  @Get('subjects/:code/experiences-summary')
  @Public()
  @ApiOperation({
    summary: 'Resumen de experiencias públicas de una materia por código',
  })
  @ApiResponse({ status: 200, type: SubjectExperiencesSummaryDto })
  @ApiResponse({ status: 404, description: 'Materia no encontrada' })
  getSubjectExperiencesSummary(@Param('code') code: string) {
    return this.discoveryService.getSubjectExperiencesSummary(code);
  }

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

  @Get('course-reviews/:id/related')
  @Public()
  @ApiOperation({
    summary: 'Reseñas públicas de la materia que comparten el mismo contexto',
  })
  @ApiResponse({ status: 200, type: CourseReviewRelatedDto })
  @ApiResponse({ status: 404, description: 'Reseña no encontrada' })
  getCourseReviewRelated(@Param('id', ParseUUIDPipe) id: string) {
    return this.discoveryService.getCourseReviewRelated(id);
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

  @Get('exam-experiences/:id/related')
  @Public()
  @ApiOperation({
    summary: 'Finales públicos de la materia que comparten el mismo contexto',
  })
  @ApiResponse({ status: 200, type: ExamExperienceRelatedDto })
  @ApiResponse({
    status: 404,
    description: 'Experiencia de final no encontrada',
  })
  getExamExperienceRelated(@Param('id', ParseUUIDPipe) id: string) {
    return this.discoveryService.getExamExperienceRelated(id);
  }

  @Get('exam-experiences/:id')
  @Public()
  getExamExperienceDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.discoveryService.getExamExperienceDetail(id);
  }
}
