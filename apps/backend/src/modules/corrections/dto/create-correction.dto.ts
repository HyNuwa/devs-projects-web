import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { CorrectionField } from '../../../generated/prisma';

export class CreateCorrectionDto {
  @ApiProperty({ enum: CorrectionField })
  @IsEnum(CorrectionField)
  field: CorrectionField;

  /** Materia or profesor id, tipo name or year; null for «sin profesor» or «sin ciclo». */
  @ApiProperty({ nullable: true, type: String })
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(60)
  proposedValue: string | null;

  @ApiProperty({ required: false, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comment?: string;
}
