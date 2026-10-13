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
}
