import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Request,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { CreateCourseReviewDto } from './dto/create-course-review.dto';
import { CreateExamExperienceDto } from './dto/create-exam-experience.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CommunityWriteThrottlerGuard } from '../../common/guards/community-write-throttler.guard';

@ApiTags('Subjects')
@ApiBearerAuth()
@Controller('subjects')
export class SubjectsController {
  constructor(private subjectsService: SubjectsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar materias' })
  @ApiResponse({ status: 200, description: 'Lista de materias' })
  findAll() {
    return this.subjectsService.findAll();
  }

  @Public()
  @Get(':code')
  @ApiOperation({ summary: 'Obtener hub de una materia por código' })
  @ApiResponse({
    status: 200,
    description: 'Ficha de la materia con estadísticas',
  })
  @ApiResponse({ status: 404, description: 'Materia no encontrada' })
  findByCode(@Param('code') code: string) {
    return this.subjectsService.findByCode(code);
  }

  @Public()
  @Get(':code/reviews')
  @ApiOperation({ summary: 'Listar reseñas de cursada de una materia' })
  @ApiResponse({ status: 200, description: 'Reseñas y desglose por condición' })
  getReviews(@Param('code') code: string) {
    return this.subjectsService.getReviews(code);
  }

  @Post(':code/reviews')
  @UseGuards(CommunityWriteThrottlerGuard)
  @ApiOperation({ summary: 'Crear una reseña de cursada independiente' })
  @ApiResponse({ status: 201, description: 'Reseña creada' })
  createReview(
    @Param('code') code: string,
    @Request() req: { user: { id: string } },
    @Body() dto: CreateCourseReviewDto,
  ) {
    return this.subjectsService.createReview(code, req.user.id, dto);
  }

  @Put('reviews/:id')
  @UseGuards(CommunityWriteThrottlerGuard)
  @ApiOperation({ summary: 'Editar mi reseña de cursada' })
  @ApiResponse({ status: 200, description: 'Reseña actualizada' })
  updateReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: CreateCourseReviewDto,
  ) {
    return this.subjectsService.updateReview(id, req.user.id, dto);
  }

  @Delete('reviews/:id')
  @ApiOperation({ summary: 'Eliminar mi reseña de cursada' })
  @ApiResponse({ status: 200, description: 'Reseña eliminada' })
  deleteReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.subjectsService.deleteReview(id, req.user.id);
  }

  @Public()
  @Get(':code/exams')
  @ApiOperation({ summary: 'Listar experiencias de final de una materia' })
  @ApiResponse({ status: 200, description: 'Experiencias de final' })
  getExams(@Param('code') code: string) {
    return this.subjectsService.getExams(code);
  }

  @Post(':code/exams')
  @UseGuards(CommunityWriteThrottlerGuard)
  @ApiOperation({ summary: 'Crear una experiencia de final' })
  @ApiResponse({ status: 201, description: 'Experiencia creada' })
  createExam(
    @Param('code') code: string,
    @Request() req: { user: { id: string } },
    @Body() dto: CreateExamExperienceDto,
  ) {
    return this.subjectsService.createExam(code, req.user.id, dto);
  }

  @Put('exams/:id')
  @UseGuards(CommunityWriteThrottlerGuard)
  @ApiOperation({ summary: 'Editar mi experiencia de final' })
  @ApiResponse({ status: 200, description: 'Experiencia actualizada' })
  updateExam(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: CreateExamExperienceDto,
  ) {
    return this.subjectsService.updateExam(id, req.user.id, dto);
  }

  @Delete('exams/:id')
  @ApiOperation({ summary: 'Eliminar mi experiencia de final' })
  @ApiResponse({ status: 200, description: 'Experiencia eliminada' })
  deleteExam(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.subjectsService.deleteExam(id, req.user.id);
  }
}
