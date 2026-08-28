import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaterialResourceType, Shift } from '../../../generated/prisma';

export class MaterialAuthorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiPropertyOptional({ nullable: true })
  displayName: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl: string | null;
}

export class MaterialSubjectDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  code: string | null;
}

export class MaterialProfessorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export enum MaterialPreviewCapability {
  PDF = 'PDF',
  IMAGE = 'IMAGE',
  UNSUPPORTED = 'UNSUPPORTED',
  UNAVAILABLE = 'UNAVAILABLE',
}

export enum MaterialPreviewFallbackReason {
  PREVIEW_FAILED = 'PREVIEW_FAILED',
  UNSUPPORTED = 'UNSUPPORTED',
  UNAVAILABLE = 'UNAVAILABLE',
}

export class MaterialPreviewFallbackDto {
  @ApiProperty({ enum: MaterialPreviewFallbackReason })
  reason: MaterialPreviewFallbackReason;

  @ApiProperty()
  downloadUrl: string;
}

export class MaterialPreviewDto {
  @ApiProperty({ enum: MaterialPreviewCapability })
  capability: MaterialPreviewCapability;

  @ApiPropertyOptional({ nullable: true })
  url: string | null;

  @ApiProperty()
  canPreview: boolean;

  @ApiProperty()
  downloadUrl: string;

  @ApiProperty({ type: MaterialPreviewFallbackDto })
  fallback: MaterialPreviewFallbackDto;
}

export class MaterialStarSummaryDto {
  @ApiProperty({ description: 'Promedio de estrellas serializado' })
  average: string;

  @ApiProperty()
  count: number;
}

export class MaterialCommentSummaryDto {
  @ApiProperty()
  count: number;
}

export class MaterialViewerStateDto {
  @ApiProperty()
  isHelpful: boolean;

  @ApiProperty()
  isSaved: boolean;
}

export class MaterialHelpfulnessStateDto {
  @ApiProperty()
  isHelpful: boolean;

  @ApiProperty()
  helpfulCount: number;
}

export class SavedMaterialStateDto {
  @ApiProperty()
  isSaved: boolean;
}

export class MaterialResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  fileUrl: string;

  @ApiProperty()
  fileType: string;

  @ApiProperty({
    description: 'Tamaño del archivo en bytes (BigInt serializado)',
  })
  fileSize: string;

  @ApiPropertyOptional({ nullable: true })
  thumbnailUrl: string | null;

  @ApiProperty()
  authorId: string;

  @ApiProperty()
  subjectId: string;

  @ApiProperty({ enum: MaterialResourceType })
  resourceType: MaterialResourceType;

  @ApiPropertyOptional({ nullable: true })
  academicYear: number | null;

  @ApiPropertyOptional({ nullable: true })
  professorId: string | null;

  @ApiPropertyOptional({ enum: Shift, nullable: true })
  shift: Shift | null;

  @ApiProperty()
  downloadCount: number;

  @ApiProperty({ description: 'Calificación promedio (Decimal serializado)' })
  avgRating: string;

  @ApiProperty()
  ratingCount: number;

  @ApiProperty()
  helpfulCount: number;

  @ApiProperty()
  commentCount: number;

  @ApiProperty({ type: MaterialStarSummaryDto })
  starSummary: MaterialStarSummaryDto;

  @ApiProperty({ type: MaterialCommentSummaryDto })
  commentSummary: MaterialCommentSummaryDto;

  @ApiProperty({ type: MaterialPreviewDto })
  preview: MaterialPreviewDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: MaterialAuthorDto })
  author: MaterialAuthorDto;

  @ApiProperty({ type: MaterialSubjectDto })
  subject: MaterialSubjectDto;

  @ApiPropertyOptional({ type: MaterialProfessorDto, nullable: true })
  professor: MaterialProfessorDto | null;
}
