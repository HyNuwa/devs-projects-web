import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiProperty()
  downloadCount: number;

  @ApiProperty({ description: 'Calificación promedio (Decimal serializado)' })
  avgRating: string;

  @ApiProperty()
  ratingCount: number;

  @ApiProperty()
  isApproved: boolean;

  @ApiProperty()
  isDeleted: boolean;

  @ApiProperty()
  isRemoved: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: MaterialAuthorDto })
  author: MaterialAuthorDto;

  @ApiProperty({ type: MaterialSubjectDto })
  subject: MaterialSubjectDto;
}
