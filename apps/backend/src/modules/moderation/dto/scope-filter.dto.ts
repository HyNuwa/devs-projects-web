import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

/** The panel's facultad filter (openspec moderation/scope, «Panel label and admin filter»). */
export class ScopeFilterQueryDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Solo lo de esta facultad, dentro del alcance de quien mira.',
  })
  @IsOptional()
  @IsUUID()
  facultyId?: string;
}
