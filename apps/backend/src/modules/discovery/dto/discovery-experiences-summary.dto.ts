import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CommunityDifficulty,
  ExamFormat,
  ExamSession,
} from '../../../generated/prisma';

export class ExperiencesSubjectDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ nullable: true })
  code: string | null;

  @ApiProperty()
  name: string;
}

export class ExperienceAverageDto {
  @ApiPropertyOptional({ nullable: true, example: 4.2 })
  average: number | null;

  @ApiProperty()
  count: number;
}

export class ExperienceMedianDto {
  @ApiPropertyOptional({
    nullable: true,
    example: 3,
    description:
      'Mediana (el valor del medio inferior si la cantidad es par); null por debajo de 3 respuestas.',
  })
  median: number | null;

  @ApiProperty({ description: 'Respuestas que declararon el dato.' })
  count: number;
}

export class ReviewPromotionGradeDto {
  @ApiPropertyOptional({
    nullable: true,
    example: 8.2,
    description: 'Nota de promoción promedio; null por debajo de 5 notas.',
  })
  average: number | null;

  @ApiProperty({ description: 'Reseñas con Promoción que informaron la nota.' })
  informed: number;

  @ApiProperty({ description: 'Reseñas con resultado Promoción.' })
  promoted: number;
}

export class ExamTopicDto {
  @ApiProperty({ example: 'Integrales dobles' })
  topic: string;

  @ApiProperty({ description: 'Finales públicos distintos que lo mencionan.' })
  count: number;
}

export class SubjectExamTopicsDto {
  @ApiProperty({
    type: [ExamTopicDto],
    description:
      'Temas de al menos 2 finales públicos, por cantidad y luego por nombre (máximo 20).',
  })
  topics: ExamTopicDto[];
}

export class ExamPreparationSummaryDto {
  @ApiProperty({
    type: ExperienceMedianDto,
    description: 'Mediana de cuánto antes empezaron a estudiar, en días.',
  })
  leadDays: ExperienceMedianDto;

  @ApiProperty({
    type: ExperienceMedianDto,
    description: 'Mediana del tiempo de estudio por día, en minutos.',
  })
  dailyMinutes: ExperienceMedianDto;
}

export class ReviewResultsPercentsDto {
  @ApiProperty({ example: 60 })
  promo: number;

  @ApiProperty({ example: 30 })
  regular: number;

  @ApiProperty({ example: 10 })
  libre: number;
}

export class ReviewResultsSummaryDto {
  @ApiProperty({ description: 'Reseñas con resultado explícito.' })
  answered: number;

  @ApiProperty({ description: 'Reseñas que prefirieron no responder.' })
  unanswered: number;

  @ApiProperty()
  promo: number;

  @ApiProperty()
  regular: number;

  @ApiProperty()
  libre: number;

  @ApiPropertyOptional({
    type: ReviewResultsPercentsDto,
    nullable: true,
    description: 'Porcentajes; null por debajo del mínimo de muestra.',
  })
  percents: ReviewResultsPercentsDto | null;
}

export class ReviewDifficultySummaryDto {
  @ApiProperty()
  answered: number;

  @ApiProperty()
  unanswered: number;

  @ApiProperty({
    description: 'Conteo por nivel de dificultad declarado.',
    example: { MUY_BAJA: 0, BAJA: 1, MEDIA: 2, ALTA: 3, MUY_ALTA: 0 },
  })
  counts: Record<CommunityDifficulty, number>;

  @ApiPropertyOptional({ enum: CommunityDifficulty, nullable: true })
  top: CommunityDifficulty | null;
}

export class ReviewsSectionSummaryDto {
  @ApiProperty()
  count: number;

  @ApiProperty({ type: ExperienceAverageDto })
  recommendation: ExperienceAverageDto;

  @ApiProperty({ type: ReviewResultsSummaryDto })
  results: ReviewResultsSummaryDto;

  @ApiProperty({ type: ReviewDifficultySummaryDto })
  difficulty: ReviewDifficultySummaryDto;

  @ApiProperty({ type: ReviewPromotionGradeDto })
  promotionGrade: ReviewPromotionGradeDto;
}

export class ExamOutcomesSummaryDto {
  @ApiProperty({ description: 'Finales con outcome APROBADO o DESAPROBADO.' })
  answered: number;

  @ApiProperty({ description: 'Finales sin outcome explícito.' })
  undeclared: number;

  @ApiProperty()
  aprobado: number;

  @ApiProperty()
  desaprobado: number;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Porcentaje de aprobados; null por debajo del mínimo.',
  })
  percent: number | null;
}

export class ExamFormatsSummaryDto {
  @ApiProperty({
    example: { ESCRITO: 4, ORAL: 2, MIXTO: 1 },
  })
  counts: Record<ExamFormat, number>;

  @ApiPropertyOptional({ enum: ExamFormat, nullable: true })
  top: ExamFormat | null;
}

export class ExamTopSessionDto {
  @ApiProperty({ enum: ExamSession })
  session: ExamSession;

  @ApiProperty()
  count: number;

  @ApiProperty({
    type: ExperienceMedianDto,
    description: 'Profesores en la mesa de los finales de esta mesa.',
  })
  boardSize: ExperienceMedianDto;

  @ApiProperty({
    type: ExperienceMedianDto,
    description: 'Tiempo del examen, en minutos, de los finales de esta mesa.',
  })
  duration: ExperienceMedianDto;
}

export class ExamsSectionSummaryDto {
  @ApiProperty()
  count: number;

  @ApiProperty({ type: ExamOutcomesSummaryDto })
  outcomes: ExamOutcomesSummaryDto;

  @ApiProperty({ type: ExamFormatsSummaryDto })
  formats: ExamFormatsSummaryDto;

  @ApiProperty({ type: ExperienceAverageDto })
  theory: ExperienceAverageDto;

  @ApiProperty({ type: ExperienceAverageDto })
  practice: ExperienceAverageDto;

  @ApiPropertyOptional({ type: ExamTopSessionDto, nullable: true })
  topSession: ExamTopSessionDto | null;

  @ApiProperty({ type: ExperienceAverageDto })
  grade: ExperienceAverageDto;

  @ApiProperty({ type: ExamPreparationSummaryDto })
  preparation: ExamPreparationSummaryDto;

  @ApiProperty({
    type: [ExamTopicDto],
    description:
      'Temas que más toman: hasta 5, de al menos 2 finales públicos.',
  })
  topics: ExamTopicDto[];
}

export class SubjectExperiencesSummaryDto {
  @ApiProperty({ type: ExperiencesSubjectDto })
  subject: ExperiencesSubjectDto;

  @ApiProperty({ type: ReviewsSectionSummaryDto })
  reviews: ReviewsSectionSummaryDto;

  @ApiProperty({ type: ExamsSectionSummaryDto })
  exams: ExamsSectionSummaryDto;
}
