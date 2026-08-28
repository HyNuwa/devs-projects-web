import { Transform, Type } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
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
}
