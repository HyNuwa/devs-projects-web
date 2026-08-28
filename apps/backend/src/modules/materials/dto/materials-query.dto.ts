import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { MaterialResourceType } from '../../../generated/prisma';
import {
  MAX_ACADEMIC_YEAR,
  MIN_ACADEMIC_YEAR,
} from '../../../common/validation/academic-year';

export enum MaterialSort {
  RELEVANCE = 'RELEVANCE',
  RECENT = 'RECENT',
}

export class MaterialsQueryDto {
  @ApiPropertyOptional({ example: '3f2b1c4e-8a9d-4f6b-9c1e-2d3a4b5c6d7e' })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({ example: 'cálculo' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: MaterialResourceType, example: 'PARCIAL' })
  @IsOptional()
  @IsEnum(MaterialResourceType)
  resourceType?: MaterialResourceType;

  @ApiPropertyOptional({
    minimum: MIN_ACADEMIC_YEAR,
    maximum: MAX_ACADEMIC_YEAR,
    example: 2026,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_ACADEMIC_YEAR)
  @Max(MAX_ACADEMIC_YEAR)
  academicYear?: number;

  @ApiPropertyOptional({ example: '3f2b1c4e-8a9d-4f6b-9c1e-2d3a4b5c6d7e' })
  @IsOptional()
  @IsUUID()
  professorId?: string;

  @ApiPropertyOptional({ enum: MaterialSort, default: MaterialSort.RELEVANCE })
  @IsOptional()
  @IsEnum(MaterialSort)
  sort?: MaterialSort;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
