import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Shift, CourseCondition } from '../../../generated/prisma/index';

export class CreateCourseReviewDto {
  @ApiPropertyOptional({ enum: Shift, default: Shift.NO_INDICO })
  @IsOptional()
  @IsEnum(Shift)
  shift?: Shift;

  @ApiPropertyOptional({
    enum: CourseCondition,
    default: CourseCondition.PREFIERO_NO_RESPONDER,
  })
  @IsOptional()
  @IsEnum(CourseCondition)
  condition?: CourseCondition;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  recommendation: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
