import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GuideAuthorDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiPropertyOptional({ nullable: true })
  displayName: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl: string | null;
}

export class GuideStepResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  stepOrder: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class GuideResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  authorId: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  content: string;

  @ApiProperty()
  viewCount: number;

  @ApiProperty()
  isPublished: boolean;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: GuideAuthorDto })
  author: GuideAuthorDto;

  @ApiProperty({ type: [GuideStepResponseDto] })
  steps: GuideStepResponseDto[];
}
