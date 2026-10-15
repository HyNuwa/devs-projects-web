import { BadRequestException } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { CODE_MAX, SLUG_PATTERN } from '../catalog-codes';
import { CREDITS_MAX, YEAR_MAX } from '../bulk-parser';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;
const SLUG_MESSAGE = 'Usá solo letras sin acentos, números y guiones.';
const HTTPS = /^https:\/\/\S+$/;

export class CreateUniversityDto {
  @ApiProperty({ maxLength: 150 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({ maxLength: 20 })
  @Transform(trim)
  @IsString()
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  @MaxLength(20)
  shortName: string;
}

export class UpdateUniversityDto {
  @ApiPropertyOptional({ maxLength: 150 })
  // Absent leaves it as is; null is not a value.
  @ValidateIf((_dto: unknown, value: unknown) => value !== undefined)
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ maxLength: 20 })
  // Absent leaves it as is; null is not a value.
  @ValidateIf((_dto: unknown, value: unknown) => value !== undefined)
  @Transform(trim)
  @IsString()
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  @MaxLength(20)
  shortName?: string;
}

export class CreateFacultyDto extends CreateUniversityDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  universityId: string;
}

export class UpdateFacultyDto extends UpdateUniversityDto {}

export class CreateCareerDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  facultyId: string;

  @ApiProperty({ maxLength: 100 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ maxLength: 20 })
  @Transform(trim)
  @IsString()
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  @MaxLength(20)
  code: string;

  @ApiPropertyOptional({ maxLength: 500, nullable: true })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Matches(HTTPS, {
    message: 'El link al plan tiene que empezar con https://.',
  })
  @MaxLength(500)
  planUrl?: string | null;
}

export class UpdateCareerDto {
  @ApiPropertyOptional({ maxLength: 100 })
  // Absent leaves it as is; null is not a value.
  @ValidateIf((_dto: unknown, value: unknown) => value !== undefined)
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ maxLength: 20 })
  // Absent leaves it as is; null is not a value.
  @ValidateIf((_dto: unknown, value: unknown) => value !== undefined)
  @Transform(trim)
  @IsString()
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  @MaxLength(20)
  code?: string;

  /** null removes the link. */
  @ApiPropertyOptional({ maxLength: 500, nullable: true })
  @ValidateIf(
    (dto: UpdateCareerDto) => dto.planUrl !== null && dto.planUrl !== undefined,
  )
  @Transform(trim)
  @IsString()
  @Matches(HTTPS, {
    message: 'El link al plan tiene que empezar con https://.',
  })
  @MaxLength(500)
  planUrl?: string | null;
}

export class CodeProposalDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  facultyId: string;

  @ApiProperty({ maxLength: 150 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;
}

export class CreateSubjectDto extends CodeProposalDto {
  /** Defaults to the proposed code. */
  @ApiPropertyOptional({ maxLength: CODE_MAX })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  @MaxLength(CODE_MAX)
  code?: string;
}

export class UpdateSubjectDto {
  @ApiPropertyOptional({ maxLength: 150 })
  // Absent leaves it as is; null is not a value.
  @ValidateIf((_dto: unknown, value: unknown) => value !== undefined)
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ maxLength: CODE_MAX })
  // Absent leaves it as is; null is not a value.
  @ValidateIf((_dto: unknown, value: unknown) => value !== undefined)
  @Transform(trim)
  @IsString()
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  @MaxLength(CODE_MAX)
  code?: string;
}

const placed = (dto: PlacementDto) => dto.optativa !== true;

export class PlacementDto {
  /** An optativa has no año or cuatrimestre. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  optativa?: boolean;

  /** Required unless optativa; `placementValue` refuses it on an optativa. */
  @ApiPropertyOptional({ minimum: 1, maximum: YEAR_MAX })
  @ValidateIf(placed)
  @IsInt()
  @Min(1)
  @Max(YEAR_MAX)
  year?: number;

  /** 0 = anual. */
  @ApiPropertyOptional({ enum: [0, 1, 2] })
  @ValidateIf(placed)
  @IsIn([0, 1, 2])
  semester?: 0 | 1 | 2;

  @ApiPropertyOptional({ minimum: 0, maximum: CREDITS_MAX, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(CREDITS_MAX)
  credits?: number | null;
}

/** The stored año, cuatrimestre and créditos; an optativa has neither año nor cuatrimestre. */
export function placementValue(dto: PlacementDto) {
  if (dto.optativa) {
    if (dto.year != null || dto.semester != null) {
      throw new BadRequestException(
        'Una optativa no lleva año ni cuatrimestre.',
      );
    }
    return { year: null, semester: null, credits: dto.credits ?? null };
  }
  return {
    year: dto.year!,
    semester: dto.semester!,
    credits: dto.credits ?? null,
  };
}

export class SlugCheckQueryDto {
  @ApiProperty({ enum: ['UNIVERSITY', 'FACULTY', 'CAREER', 'SUBJECT'] })
  @IsIn(['UNIVERSITY', 'FACULTY', 'CAREER', 'SUBJECT'])
  kind: 'UNIVERSITY' | 'FACULTY' | 'CAREER' | 'SUBJECT';

  /** The universidad of a facultad, the facultad of a carrera. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiProperty({ maxLength: CODE_MAX })
  @IsString()
  @IsNotEmpty()
  @MaxLength(CODE_MAX)
  slug: string;
}

export class BulkPreviewDto {
  @ApiProperty({
    description: 'Una materia por línea: año;cuatrimestre;nombre[;créditos]',
  })
  @IsString()
  @MaxLength(50_000)
  text: string;
}

export class BulkRowDto extends PlacementDto {
  @ApiProperty({ enum: ['reuse', 'new'] })
  @IsIn(['reuse', 'new'])
  action: 'reuse' | 'new';

  @ApiPropertyOptional({ format: 'uuid' })
  @ValidateIf((row: BulkRowDto) => row.action === 'reuse')
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @ValidateIf((row: BulkRowDto) => row.action === 'new')
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ maxLength: CODE_MAX })
  @ValidateIf((row: BulkRowDto) => row.action === 'new')
  @Transform(trim)
  @IsString()
  @Matches(SLUG_PATTERN, { message: SLUG_MESSAGE })
  @MaxLength(CODE_MAX)
  code?: string;
}

export class BulkApplyDto {
  @ApiProperty({ type: [BulkRowDto], maxItems: 200 })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => BulkRowDto)
  rows: BulkRowDto[];
}
