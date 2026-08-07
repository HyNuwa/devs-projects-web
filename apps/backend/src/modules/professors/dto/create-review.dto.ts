import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  Min,
  Max,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  value: number;

  @ApiPropertyOptional({
    example: 'Excelente profesor, muy claro',
    maxLength: 200,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;
}
