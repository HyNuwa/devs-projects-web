import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { MaterialResourceType, Shift } from '../../../generated/prisma';
import {
  MAX_ACADEMIC_YEAR,
  MIN_ACADEMIC_YEAR,
} from '../../../common/validation/academic-year';

export {
  MAX_ACADEMIC_YEAR,
  MIN_ACADEMIC_YEAR,
} from '../../../common/validation/academic-year';

export class CreateMaterialDto {
  @ApiProperty({ example: 'Apuntes de Cálculo I', minLength: 3 })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiPropertyOptional({
    example: 'Apuntes completos del primer parcial con ejercicios resueltos',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '3f2b1c4e-8a9d-4f6b-9c1e-2d3a4b5c6d7e' })
  @IsUUID()
  subjectId: string;

  @ApiProperty({ enum: MaterialResourceType, example: 'APUNTE' })
  @IsEnum(MaterialResourceType)
  resourceType: MaterialResourceType;

  @ApiPropertyOptional({
    example: 2026,
    minimum: MIN_ACADEMIC_YEAR,
    maximum: MAX_ACADEMIC_YEAR,
    nullable: true,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_ACADEMIC_YEAR)
  @Max(MAX_ACADEMIC_YEAR)
  academicYear?: number | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID('4')
  professorId?: string | null;

  @ApiPropertyOptional({ enum: Shift, nullable: true })
  @IsOptional()
  @IsEnum(Shift)
  shift?: Shift | null;
}
