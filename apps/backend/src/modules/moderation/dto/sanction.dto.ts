import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export const SUSPENSION_DURATIONS = ['7_DAYS', '30_DAYS', 'PERMANENT'] as const;
export type SuspensionDuration = (typeof SUSPENSION_DURATIONS)[number];

export function durationDays(duration: SuspensionDuration): 7 | 30 | null {
  return duration === '7_DAYS' ? 7 : duration === '30_DAYS' ? 30 : null;
}

/**
 * Reason for a sanción or for lifting one; blank reasons are refused by the service.
 * It names no caso: the only sanción tied to one comes from deciding it, so a
 * request can never test who wrote a caso's content (openspec moderation/sanctions).
 */
export class SanctionReasonDto {
  @ApiProperty({
    maxLength: 1000,
    description: 'Razón (la ve la cuenta sancionada)',
  })
  @IsString()
  @MaxLength(1000)
  reason: string;
}

export class ProposeSuspensionDto extends SanctionReasonDto {
  @ApiProperty({ enum: SUSPENSION_DURATIONS })
  @IsIn(SUSPENSION_DURATIONS)
  duration: SuspensionDuration;
}

export class SuspendDto {
  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  reason: string;

  @ApiProperty({ enum: SUSPENSION_DURATIONS })
  @IsIn(SUSPENSION_DURATIONS)
  duration: SuspensionDuration;

  @ApiPropertyOptional({
    description: 'Retirar también sus aportes publicados (pensado para spam)',
  })
  @IsOptional()
  @IsBoolean()
  retireContributions?: boolean;
}

export class ConfirmProposalDto {
  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  reason: string;

  @ApiPropertyOptional({
    enum: SUSPENSION_DURATIONS,
    description: 'Cambia la duración propuesta',
  })
  @IsOptional()
  @IsIn(SUSPENSION_DURATIONS)
  duration?: SuspensionDuration;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  retireContributions?: boolean;
}

export class LiftDto {
  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  reason: string;
}
