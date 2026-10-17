import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { ModerationTargetType, ReportReason } from '../../../generated/prisma';

export class CreateReportDto {
  @ApiProperty({ enum: ModerationTargetType })
  @IsEnum(ModerationTargetType)
  targetType: ModerationTargetType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  targetId: string;

  @ApiProperty({ enum: ReportReason })
  @IsEnum(ReportReason)
  reason: ReportReason;

  @ApiPropertyOptional({
    maxLength: 1000,
    description: 'Obligatoria cuando el motivo es «Otro».',
  })
  @ValidateIf(
    (dto: CreateReportDto) =>
      dto.reason === ReportReason.OTRO || dto.explanation !== undefined,
  )
  @IsString()
  @IsNotEmpty({ message: 'Contá por qué lo reportás' })
  @MaxLength(1000)
  explanation?: string;
}
