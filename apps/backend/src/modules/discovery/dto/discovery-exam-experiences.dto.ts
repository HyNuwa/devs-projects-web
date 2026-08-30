import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import {
  CommunityDifficulty,
  ExamFormat,
  ExamOutcome,
  ExamSession,
  Shift,
} from '../../../generated/prisma';
import {
  MAX_ACADEMIC_YEAR,
  MIN_ACADEMIC_YEAR,
} from '../../../common/validation/academic-year';
import {
  DiscoveryPaginationDto,
  DiscoveryPublicAuthorDto,
  DiscoverySubjectLinkDto,
} from './discovery-public.dto';

export const DEFAULT_DISCOVERY_EXAM_EXPERIENCE_LIMIT = 10;
export const MAX_DISCOVERY_EXAM_EXPERIENCE_LIMIT = 100;
export const MAX_DISCOVERY_EXAM_EXPERIENCE_EXCERPT_LENGTH = 360;

export class DiscoveryExamExperiencesQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  subjectId?: string;

  @ApiPropertyOptional({
    minimum: MIN_ACADEMIC_YEAR,
    maximum: MAX_ACADEMIC_YEAR,
    example: 2026,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_ACADEMIC_YEAR)
  @Max(MAX_ACADEMIC_YEAR)
  year?: number;

  @ApiPropertyOptional({ enum: ExamSession })
  @IsOptional()
  @IsEnum(ExamSession)
  session?: ExamSession;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  professorId?: string;

  @ApiPropertyOptional({ enum: ExamFormat })
  @IsOptional()
  @IsEnum(ExamFormat)
  format?: ExamFormat;

  @ApiPropertyOptional({ enum: ExamOutcome })
  @IsOptional()
  @IsEnum(ExamOutcome)
  outcome?: ExamOutcome;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: DEFAULT_DISCOVERY_EXAM_EXPERIENCE_LIMIT,
    minimum: 1,
    maximum: MAX_DISCOVERY_EXAM_EXPERIENCE_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_DISCOVERY_EXAM_EXPERIENCE_LIMIT)
  limit?: number;
}

export class DiscoveryExamExperienceProfessorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class DiscoveryExamExperienceDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: DiscoverySubjectLinkDto })
  subject: DiscoverySubjectLinkDto;

  @ApiProperty({ type: DiscoveryPublicAuthorDto })
  author: DiscoveryPublicAuthorDto;

  @ApiProperty()
  year: number;

  @ApiProperty({ enum: ExamSession })
  session: ExamSession;

  @ApiProperty({ enum: ExamFormat })
  format: ExamFormat;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  examDate?: Date;

  @ApiPropertyOptional({ enum: Shift, nullable: true })
  shift?: Shift;

  @ApiPropertyOptional({
    type: DiscoveryExamExperienceProfessorDto,
    nullable: true,
  })
  professor?: DiscoveryExamExperienceProfessorDto;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Nombre manual cuando no se seleccionó un profesor del catálogo.',
  })
  examinerName?: string;

  @ApiPropertyOptional({ enum: CommunityDifficulty, nullable: true })
  difficulty?: CommunityDifficulty;

  @ApiPropertyOptional({ enum: ExamOutcome, nullable: true })
  outcome?: ExamOutcome;

  @ApiPropertyOptional({
    nullable: true,
    maxLength: MAX_DISCOVERY_EXAM_EXPERIENCE_EXCERPT_LENGTH + 1,
  })
  excerpt?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class DiscoveryExamExperienceListDto {
  @ApiProperty({ type: [DiscoveryExamExperienceDto] })
  data: DiscoveryExamExperienceDto[];

  @ApiProperty({ type: DiscoveryPaginationDto })
  meta: DiscoveryPaginationDto;
}
