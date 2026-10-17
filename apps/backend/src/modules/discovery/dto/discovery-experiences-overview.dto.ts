import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { CommunityDifficulty } from '../../../generated/prisma';
import { DiscoveryCourseReviewDto } from './discovery-course-reviews.dto';
import { DiscoveryExamExperienceDto } from './discovery-exam-experiences.dto';
import { ExperiencesSubjectDto } from './discovery-experiences-summary.dto';

export const EXPERIENCES_OVERVIEW_KINDS = ['reviews', 'exams'] as const;
export type ExperiencesOverviewKind =
  (typeof EXPERIENCES_OVERVIEW_KINDS)[number];

export class DiscoveryExperiencesOverviewQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  facultyId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  careerId?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 10, example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  year?: number;

  @ApiPropertyOptional({ enum: EXPERIENCES_OVERVIEW_KINDS })
  @IsOptional()
  @IsIn(EXPERIENCES_OVERVIEW_KINDS)
  kind?: ExperiencesOverviewKind;
}

export class ExperiencesOverviewScopeDto {
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  facultyId: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  careerId: string | null;

  @ApiPropertyOptional({ nullable: true })
  year: number | null;

  @ApiPropertyOptional({ enum: EXPERIENCES_OVERVIEW_KINDS, nullable: true })
  kind: ExperiencesOverviewKind | null;
}

export class MostCommentedPlacementDto {
  @ApiProperty({ format: 'uuid' })
  careerId: string;

  @ApiProperty()
  careerName: string;

  @ApiPropertyOptional({ nullable: true })
  year: number | null;

  @ApiPropertyOptional({ nullable: true })
  semester: number | null;
}

export class PromotionFigureDto {
  @ApiPropertyOptional({ nullable: true })
  percent: number | null;

  @ApiProperty()
  promoted: number;

  @ApiProperty()
  answered: number;
}

export class ApprovalFigureDto {
  @ApiPropertyOptional({ nullable: true })
  percent: number | null;

  @ApiProperty()
  approved: number;

  @ApiProperty()
  answered: number;
}

export class MostCommentedItemDto {
  @ApiProperty({ type: ExperiencesSubjectDto })
  subject: ExperiencesSubjectDto;

  @ApiPropertyOptional({ type: MostCommentedPlacementDto, nullable: true })
  placement: MostCommentedPlacementDto | null;

  @ApiProperty()
  total: number;

  @ApiProperty({ description: 'Experiencias publicadas en la ventana activa.' })
  recentCount: number;

  @ApiProperty({ format: 'date-time' })
  latestAt: Date;

  @ApiProperty({ type: PromotionFigureDto })
  promotion: PromotionFigureDto;

  @ApiProperty({ type: ApprovalFigureDto })
  approval: ApprovalFigureDto;

  @ApiPropertyOptional({ enum: CommunityDifficulty, nullable: true })
  topDifficulty: CommunityDifficulty | null;
}

export enum MostCommentedWindow {
  LAST_120_DAYS = 'LAST_120_DAYS',
  ALL_TIME = 'ALL_TIME',
}

export class MostCommentedDto {
  @ApiProperty({ enum: MostCommentedWindow })
  window: MostCommentedWindow;

  @ApiProperty({ type: [MostCommentedItemDto] })
  items: MostCommentedItemDto[];
}

export type ExperiencesRecentEntry =
  | { kind: 'review'; review: DiscoveryCourseReviewDto }
  | { kind: 'exam'; exam: DiscoveryExamExperienceDto };

export class ExperiencesOverviewDto {
  @ApiProperty({ type: ExperiencesOverviewScopeDto })
  scope: ExperiencesOverviewScopeDto;

  @ApiProperty({ type: MostCommentedDto })
  mostCommented: MostCommentedDto;

  @ApiProperty({
    description:
      'Últimas experiencias del contexto: { kind: "review", review } o { kind: "exam", exam }.',
    isArray: true,
  })
  recent: ExperiencesRecentEntry[];
}
