import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsOptional, IsUUID } from 'class-validator';

/** Sanity bound on the facultades one moderator covers. */
export const MAX_MODERATOR_FACULTIES = 50;

/** The facultades a moderator covers (openspec moderation/scope). */
export class ModeratorFacultiesDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMaxSize(MAX_MODERATOR_FACULTIES)
  @IsUUID('all', { each: true })
  facultyIds: string[];
}

/** Promotion: the facultades are required, checked by the service. */
export class PromoteDto {
  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_MODERATOR_FACULTIES)
  @IsUUID('all', { each: true })
  facultyIds?: string[];
}
