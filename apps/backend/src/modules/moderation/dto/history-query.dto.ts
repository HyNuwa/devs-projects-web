import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';

import { ModerationEventAction } from '../../../generated/prisma';

export class HistoryQueryDto {
  @ApiPropertyOptional({ enum: ModerationEventAction })
  @IsOptional()
  @IsEnum(ModerationEventAction)
  action?: ModerationEventAction;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Material, reseña o experiencia',
  })
  @IsOptional()
  @IsUUID()
  contentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  cursor?: string;
}
