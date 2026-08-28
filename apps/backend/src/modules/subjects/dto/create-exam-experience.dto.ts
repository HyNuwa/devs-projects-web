import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  Validate,
} from 'class-validator';
import {
  CommunityDifficulty,
  ExamFormat,
  ExamOutcome,
  ExamSession,
  Shift,
} from '../../../generated/prisma';
import {
  MAX_ACADEMIC_YEAR,
  MIN_ACADEMIC_YEAR,
} from '../../../common/validation/academic-year';
import {
  GradeRequiresExplicitOutcomeConstraint,
  SingleProfessorReferenceConstraint,
} from './community-write.validators';

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

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  examDate?: Date;

  @ApiPropertyOptional({ enum: Shift })
  @IsOptional()
  @IsEnum(Shift)
  shift?: Shift;

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

  @ApiPropertyOptional({ enum: CommunityDifficulty })
  @IsOptional()
  @IsEnum(CommunityDifficulty)
  difficulty?: CommunityDifficulty;

  @ApiPropertyOptional({ enum: ExamOutcome })
  @IsOptional()
  @IsEnum(ExamOutcome)
  outcome?: ExamOutcome;

  @ApiPropertyOptional({ minimum: 0, maximum: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10)
  @Validate(GradeRequiresExplicitOutcomeConstraint)
  grade?: number;

  @ApiProperty({ minLength: 30, maxLength: 4000 })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(30)
  @MaxLength(4000)
  comment: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}
