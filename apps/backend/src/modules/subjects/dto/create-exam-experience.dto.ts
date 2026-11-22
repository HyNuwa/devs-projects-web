import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsDivisibleBy,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
  ValidateIf,
} from 'class-validator';
import {
  ExamFormat,
  ExamOutcome,
  ExamSession,
} from '../../../generated/prisma';
import {
  MAX_ACADEMIC_YEAR,
  MIN_ACADEMIC_YEAR,
} from '../../../common/validation/academic-year';
import { StrictBoolean } from '../../../common/validation/strict-boolean';
import {
  GradeMatchesOutcomeConstraint,
  normalizeTopics,
  outcomeRequiresGrade,
  SingleProfessorReferenceConstraint,
} from './community-write.validators';

const EXAM_OUTCOMES = Object.values(ExamOutcome);

/**
 * The exact date, the franja and the verbal dificultad are not part of the
 * contract: older finals keep them because the service never writes them.
 */
export class CreateExamExperienceDto {
  @ApiProperty({
    example: 2026,
    minimum: MIN_ACADEMIC_YEAR,
    maximum: MAX_ACADEMIC_YEAR,
  })
  @Type(() => Number)
  @IsInt()
  @Min(MIN_ACADEMIC_YEAR)
  @Max(MAX_ACADEMIC_YEAR)
  year: number;

  @ApiProperty({ enum: ExamSession })
  @IsEnum(ExamSession)
  session: ExamSession;

  @ApiProperty({ enum: ExamFormat })
  @IsEnum(ExamFormat)
  format: ExamFormat;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  @Validate(SingleProfessorReferenceConstraint)
  professorId?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  examinerName?: string;

  @ApiProperty({ enum: EXAM_OUTCOMES })
  @IsIn(EXAM_OUTCOMES)
  outcome: ExamOutcome;

  @ApiPropertyOptional({
    minimum: 0,
    maximum: 10,
    description:
      'Obligatoria con Aprobado o Desaprobado; no se acepta con Prefiero no decir',
  })
  @ValidateIf(
    (dto: CreateExamExperienceDto) =>
      outcomeRequiresGrade(dto.outcome) ||
      (dto.grade !== undefined && dto.grade !== null),
  )
  @Validate(GradeMatchesOutcomeConstraint)
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  grade?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  difficultyTheory?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  difficultyPractice?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  boardSize?: number;

  @ApiPropertyOptional({ minimum: 10, maximum: 480 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(10)
  @Max(480)
  durationMinutes?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 365 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  prepLeadDays?: number;

  @ApiPropertyOptional({ minimum: 30, maximum: 960, multipleOf: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsDivisibleBy(30)
  @Min(30)
  @Max(960)
  prepDailyMinutes?: number;

  @ApiPropertyOptional({
    type: [String],
    maxItems: 10,
    description:
      'Se recortan, se colapsan los espacios y se quitan repetidos sin distinguir mayúsculas antes de validar 2 a 60 caracteres',
  })
  @IsOptional()
  @Transform(({ value }) => normalizeTopics(value))
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MinLength(2, { each: true })
  @MaxLength(60, { each: true })
  topics?: string[];

  @ApiProperty({ minLength: 30, maxLength: 4000 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(30)
  @MaxLength(4000)
  comment: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @StrictBoolean()
  isAnonymous?: boolean;
}
