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

/** Sanity bound on how many carreras one student can declare. */
export const MAX_DECLARED_CAREERS = 10;

export class DeclaredCareerDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  careerId: string;

  @ApiProperty({ enum: StudyPlanStatus })
  @IsEnum(StudyPlanStatus)
  status: StudyPlanStatus;
}

/** «Mi carrera»: the whole list of declared carreras (ADR 0003: no plans). */
export class ReplaceDeclaredCareersDto {
  @ApiProperty({ type: [DeclaredCareerDto], maxItems: MAX_DECLARED_CAREERS })
  @IsArray()
  @ArrayMaxSize(MAX_DECLARED_CAREERS)
  @ValidateNested({ each: true })
  @Type(() => DeclaredCareerDto)
  careers: DeclaredCareerDto[];
}
