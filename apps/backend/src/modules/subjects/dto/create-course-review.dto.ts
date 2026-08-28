import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
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
} from 'class-validator';
import {
  CommunityDifficulty,
  CourseAttempt,
  CourseCondition,
  Shift,
} from '../../../generated/prisma';
import {
  MAX_ACADEMIC_YEAR,
  MIN_ACADEMIC_YEAR,
} from '../../../common/validation/academic-year';
import { SingleProfessorReferenceConstraint } from './community-write.validators';

const COURSE_REVIEW_CONDITIONS = [
  CourseCondition.PROMO,
  CourseCondition.REGULAR,
  CourseCondition.LIBRE,
] as const;

export class CreateCourseReviewDto {
  @ApiProperty({
    example: 2026,
    minimum: MIN_ACADEMIC_YEAR,
    maximum: MAX_ACADEMIC_YEAR,
  })
  @Type(() => Number)
  @IsInt()
  @Min(MIN_ACADEMIC_YEAR)
  @Max(MAX_ACADEMIC_YEAR)
  academicYear: number;

  @ApiPropertyOptional({ enum: Shift })
  @IsOptional()
  @IsEnum(Shift)
  shift?: Shift;

  @ApiProperty({ enum: COURSE_REVIEW_CONDITIONS })
  @IsIn(COURSE_REVIEW_CONDITIONS)
  condition: CourseCondition;

  @ApiProperty({ enum: CourseAttempt })
  @IsEnum(CourseAttempt)
  attempt: CourseAttempt;

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
  professorName?: string;

  @ApiPropertyOptional({ enum: CommunityDifficulty })
  @IsOptional()
  @IsEnum(CommunityDifficulty)
  difficulty?: CommunityDifficulty;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  recommendation: number;

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

  @ApiPropertyOptional({
    default: false,
    description:
      'Confirma que una reseña parecida reciente representa otra cursada real',
  })
  @IsOptional()
  @IsBoolean()
  confirmProbableDuplicate?: boolean;
}
