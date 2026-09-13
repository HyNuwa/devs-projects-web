import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { MaterialResourceType } from '../../../generated/prisma';
import {
  MaterialPreviewDto,
  MaterialStarSummaryDto,
} from '../../materials/dto/material-response.dto';

export const DEFAULT_DISCOVERY_HIERARCHY_LIMIT = 50;
export const MAX_DISCOVERY_HIERARCHY_LIMIT = 50;

export class DiscoveryHierarchyQueryDto {
  @ApiPropertyOptional({
    default: DEFAULT_DISCOVERY_HIERARCHY_LIMIT,
    minimum: 1,
    maximum: MAX_DISCOVERY_HIERARCHY_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_DISCOVERY_HIERARCHY_LIMIT)
  limit?: number = DEFAULT_DISCOVERY_HIERARCHY_LIMIT;
}

export class DiscoveryCareerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  studyPlanCount: number;
}

export class DiscoveryCareerListDto {
  @ApiProperty({ type: [DiscoveryCareerDto] })
  careers: DiscoveryCareerDto[];

  @ApiProperty()
  hasMore: boolean;
}

export class DiscoveryStudyPlanDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;
}

export class DiscoveryCurriculumYearDto {
  @ApiProperty({
    description: 'Identificador estable compuesto por plan de estudio y año.',
  })
  id: string;

  @ApiProperty()
  year: number;

  @ApiProperty({ type: DiscoveryStudyPlanDto })
  studyPlan: DiscoveryStudyPlanDto;

  @ApiProperty()
  subjectCount: number;
}

export class DiscoveryCurriculumYearListDto {
  @ApiProperty({ type: DiscoveryCareerDto })
  career: DiscoveryCareerDto;

  @ApiProperty({ type: [DiscoveryCurriculumYearDto] })
  years: DiscoveryCurriculumYearDto[];

  @ApiProperty()
  hasMore: boolean;
}

export class DiscoverySubjectHierarchyDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  curriculumAssignmentId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  code: string | null;

  @ApiProperty()
  semester: number;

  @ApiPropertyOptional({ nullable: true })
  credits: number | null;

  @ApiProperty()
  approvedMaterialCount: number;
}

export class DiscoverySubjectListDto {
  @ApiProperty({ type: DiscoveryCareerDto })
  career: DiscoveryCareerDto;

  @ApiProperty({ type: DiscoveryStudyPlanDto })
  studyPlan: DiscoveryStudyPlanDto;

  @ApiProperty()
  year: number;

  @ApiProperty({ type: [DiscoverySubjectHierarchyDto] })
  subjects: DiscoverySubjectHierarchyDto[];

  @ApiProperty()
  hasMore: boolean;
}

export class DiscoverySubjectContextDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  code: string | null;
}

export class DiscoveryResourceCategoryDto {
  @ApiProperty({
    description:
      'Identificador estable de la categoría, igual al tipo de recurso.',
    enum: MaterialResourceType,
  })
  id: MaterialResourceType;

  @ApiProperty({ enum: MaterialResourceType })
  resourceType: MaterialResourceType;

  @ApiProperty()
  materialCount: number;
}

export class DiscoveryResourceCategoryListDto {
  @ApiProperty({ type: DiscoverySubjectContextDto })
  subject: DiscoverySubjectContextDto;

  @ApiProperty({ type: [DiscoveryResourceCategoryDto] })
  categories: DiscoveryResourceCategoryDto[];
}

export class DiscoveryMaterialFileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  fileType: string;

  @ApiProperty({ enum: MaterialResourceType })
  resourceType: MaterialResourceType;

  @ApiPropertyOptional({ nullable: true })
  academicYear: number | null;

  @ApiProperty()
  helpfulCount: number;

  @ApiProperty({ type: MaterialStarSummaryDto })
  starSummary: MaterialStarSummaryDto;

  @ApiProperty({ type: MaterialPreviewDto })
  preview: MaterialPreviewDto;

  @ApiProperty()
  createdAt: Date;
}

export class DiscoveryMaterialFileListDto {
  @ApiProperty({ type: DiscoverySubjectContextDto })
  subject: DiscoverySubjectContextDto;

  @ApiProperty({ enum: MaterialResourceType })
  resourceType: MaterialResourceType;

  @ApiProperty({ type: [DiscoveryMaterialFileDto] })
  files: DiscoveryMaterialFileDto[];

  @ApiProperty()
  hasMore: boolean;
}
