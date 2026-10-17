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
}

export class SubjectExperiencesSummaryDto {
  @ApiProperty({ type: ExperiencesSubjectDto })
  subject: ExperiencesSubjectDto;

  @ApiProperty({ type: ReviewsSectionSummaryDto })
  reviews: ReviewsSectionSummaryDto;

  @ApiProperty({ type: ExamsSectionSummaryDto })
  exams: ExamsSectionSummaryDto;
}
