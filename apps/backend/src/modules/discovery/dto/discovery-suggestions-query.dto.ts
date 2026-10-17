import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
  IsUUID,
  IsOptional,
} from 'class-validator';

export const DEFAULT_DISCOVERY_SUGGESTION_LIMIT = 6;
export const MAX_DISCOVERY_SUGGESTION_LIMIT = 10;

export class DiscoverySuggestionsQueryDto {
  @ApiProperty({
    example: 'algoritmos',
    description: 'Texto actual de búsqueda de materias y recursos.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  q: string;

  @ApiPropertyOptional({
    example: DEFAULT_DISCOVERY_SUGGESTION_LIMIT,
    minimum: 1,
    maximum: MAX_DISCOVERY_SUGGESTION_LIMIT,
    default: DEFAULT_DISCOVERY_SUGGESTION_LIMIT,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_DISCOVERY_SUGGESTION_LIMIT)
  limit?: number = DEFAULT_DISCOVERY_SUGGESTION_LIMIT;

  @ApiPropertyOptional({
    example: '3f2b1c4e-8a9d-4f6b-9c1e-2d3a4b5c6d7e',
    description:
      'Solo materias de esta facultad (la ubicación de quien busca).',
  })
  @IsOptional()
  @IsUUID()
  facultyId?: string;
}
