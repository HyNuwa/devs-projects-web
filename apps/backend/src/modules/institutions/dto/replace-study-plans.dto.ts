import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { StudyPlanStatus } from '../../../generated/prisma';

/** Sanity bound on how many plans one student can declare. */
export const MAX_DECLARED_PLANS = 10;

export class DeclaredStudyPlanDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  studyPlanId: string;

  @ApiProperty({ enum: StudyPlanStatus })
  @IsEnum(StudyPlanStatus)
  status: StudyPlanStatus;
}

export class ReplaceStudyPlansDto {
  @ApiProperty({ type: [DeclaredStudyPlanDto], maxItems: MAX_DECLARED_PLANS })
  @IsArray()
  @ArrayMaxSize(MAX_DECLARED_PLANS)
  @ValidateNested({ each: true })
  @Type(() => DeclaredStudyPlanDto)
  plans: DeclaredStudyPlanDto[];
}
