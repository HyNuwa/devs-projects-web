import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

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
}
