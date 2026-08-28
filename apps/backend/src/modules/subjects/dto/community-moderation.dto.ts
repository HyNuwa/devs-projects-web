import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { CommunityReportReason } from '../../../generated/prisma';

const PLAIN_TEXT_PATTERN = /^[^<>]*$/u;

const trimText = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateCommunityReportDto {
  @ApiProperty({ enum: CommunityReportReason })
  @IsEnum(CommunityReportReason)
  reason: CommunityReportReason;

  @ApiPropertyOptional({
    minLength: 3,
    maxLength: 1000,
    description: 'Obligatoria cuando el motivo es OTRO',
  })
  @ValidateIf(
    (dto: CreateCommunityReportDto) =>
      dto.reason === CommunityReportReason.OTRO ||
      dto.explanation !== undefined,
  )
  @Transform(trimText)
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  @Matches(PLAIN_TEXT_PATTERN, {
    message: 'La explicación debe ser texto plano',
  })
  explanation?: string;
}

export class CommunityModerationReasonDto {
  @ApiProperty({ minLength: 3, maxLength: 1000 })
  @Transform(trimText)
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  @Matches(PLAIN_TEXT_PATTERN, {
    message: 'El motivo debe ser texto plano',
  })
  reason: string;
}
