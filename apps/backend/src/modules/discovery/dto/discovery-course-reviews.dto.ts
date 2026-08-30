import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import {
  CommunityDifficulty,
  CourseAttempt,
  CourseCondition,
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

export const DEFAULT_DISCOVERY_COURSE_REVIEW_LIMIT = 10;
export const MAX_DISCOVERY_COURSE_REVIEW_LIMIT = 100;
export const MAX_DISCOVERY_COURSE_REVIEW_EXCERPT_LENGTH = 360;

export enum DiscoveryCourseReviewSort {
  RECENT = 'RECENT',
  STARS_ASC = 'STARS_ASC',
  STARS_DESC = 'STARS_DESC',
}

export class DiscoveryCourseReviewsQueryDto {
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
  academicYear?: number;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  professorId?: string;

  @ApiPropertyOptional({ enum: CommunityDifficulty })
  @IsOptional()
  @IsEnum(CommunityDifficulty)
  difficulty?: CommunityDifficulty;

  @ApiPropertyOptional({ enum: CourseAttempt })
  @IsOptional()
  @IsEnum(CourseAttempt)
  attempt?: CourseAttempt;

  @ApiPropertyOptional({
    enum: DiscoveryCourseReviewSort,
    default: DiscoveryCourseReviewSort.RECENT,
  })
  @IsOptional()
  @IsEnum(DiscoveryCourseReviewSort)
  sort?: DiscoveryCourseReviewSort;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    example: DEFAULT_DISCOVERY_COURSE_REVIEW_LIMIT,
    minimum: 1,
    maximum: MAX_DISCOVERY_COURSE_REVIEW_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_DISCOVERY_COURSE_REVIEW_LIMIT)
  limit?: number;
}

export class DiscoveryCourseReviewProfessorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class DiscoveryCourseReviewDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: DiscoverySubjectLinkDto })
  subject: DiscoverySubjectLinkDto;

  @ApiProperty({ type: DiscoveryPublicAuthorDto })
  author: DiscoveryPublicAuthorDto;

  @ApiProperty()
  academicYear: number | null;

  @ApiProperty({ enum: Shift })
  shift: Shift;

  @ApiProperty({ enum: CourseCondition })
  condition: CourseCondition;

  @ApiPropertyOptional({ enum: CourseAttempt, nullable: true })
  attempt: CourseAttempt | null;

  @ApiPropertyOptional({ enum: CommunityDifficulty, nullable: true })
  difficulty: CommunityDifficulty | null;

  @ApiProperty({ minimum: 1, maximum: 5 })
  recommendation: number;

  @ApiPropertyOptional({
    type: DiscoveryCourseReviewProfessorDto,
    nullable: true,
  })
  professor: DiscoveryCourseReviewProfessorDto | null;

  @ApiPropertyOptional({
    nullable: true,
    description:
      'Nombre manual cuando no se seleccionó un profesor del catálogo.',
  })
  professorName: string | null;

  @ApiPropertyOptional({
    nullable: true,
    maxLength: MAX_DISCOVERY_COURSE_REVIEW_EXCERPT_LENGTH + 1,
  })
  excerpt: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class DiscoveryCourseReviewAggregateDto {
  @ApiPropertyOptional({ nullable: true, example: 4.3 })
  averageRecommendation: number | null;

  @ApiProperty({ example: 18 })
  reviewCount: number;
}

export class DiscoveryCourseReviewListDto {
  @ApiProperty({ type: [DiscoveryCourseReviewDto] })
  data: DiscoveryCourseReviewDto[];

  @ApiProperty({ type: DiscoveryCourseReviewAggregateDto })
  aggregate: DiscoveryCourseReviewAggregateDto;

  @ApiProperty({ type: DiscoveryPaginationDto })
  meta: DiscoveryPaginationDto;
}
