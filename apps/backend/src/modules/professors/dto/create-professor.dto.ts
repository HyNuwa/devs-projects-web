import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class CreateProfessorDto {
  @ApiProperty({ example: 'Dr. Juan Pérez', minLength: 3, maxLength: 150 })
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    example: 'Profesor de matemáticas con 10 años de experiencia',
  })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({
    example: '3f2b1c4a-...',
    description: 'ID de la materia a la que se vincula el profesor',
  })
  @IsUUID()
  @IsOptional()
  subjectId?: string;
}
