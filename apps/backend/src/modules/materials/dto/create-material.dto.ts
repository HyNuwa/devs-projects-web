import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional, IsUUID } from 'class-validator';

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
}
