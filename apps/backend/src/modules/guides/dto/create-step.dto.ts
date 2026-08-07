import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateStepDto {
  @ApiProperty({
    example: 'Instalación del entorno',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @ApiProperty({ example: 'Paso a paso para instalar Node.js y TypeScript' })
  @IsString()
  content: string;

  @ApiPropertyOptional({
    example: 1,
    description: 'Posición del paso en la guía',
  })
  @IsInt()
  @IsOptional()
  stepOrder?: number;
}
