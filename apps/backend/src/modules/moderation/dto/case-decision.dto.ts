import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { ModerationDecision } from '../../../generated/prisma';

export class CaseDecisionDto {
  @ApiProperty({ enum: ModerationDecision })
  @IsEnum(ModerationDecision)
  decision: ModerationDecision;

  @ApiPropertyOptional({
    maxLength: 1000,
    description:
      'Obligatoria para retirar, rechazar y restaurar. En retiros y rechazos la ve el autor.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @ApiPropertyOptional({
    description:
      'Solo al retirar: advierte también al autor con la misma razón («Advertir también»).',
  })
  @IsOptional()
  @IsBoolean()
  warn?: boolean;
}
