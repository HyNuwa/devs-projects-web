import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  Shift,
  ExamFormat,
  ExamSession,
} from '../../../generated/prisma/index';

export class CreateExamExperienceDto {
  @ApiPropertyOptional({ enum: Shift })
  @IsOptional()
  @IsEnum(Shift)
  shift?: Shift;

  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiPropertyOptional({ enum: ExamSession, default: ExamSession.NO_RECUERDO })
  @IsOptional()
  @IsEnum(ExamSession)
  session?: ExamSession;

  @ApiProperty({ enum: ExamFormat })
  @IsEnum(ExamFormat)
  format: ExamFormat;

  @ApiPropertyOptional({ description: 'ID de profesor registrado (opcional)' })
  @IsOptional()
  @IsUUID()
  professorId?: string;

  @ApiPropertyOptional({ description: 'Nombre del docente que tomó el final' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  examinerName?: string;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  difficultyTheory: number;

  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  difficultyPractice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
