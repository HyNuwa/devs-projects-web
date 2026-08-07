import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProfessorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  bio: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl: string | null;

  @ApiProperty({
    example: 4.5,
    nullable: true,
    description: 'Promedio de valoraciones (0-5)',
  })
  avgRating: number | null;

  @ApiProperty({ example: 3, description: 'Cantidad de valoraciones' })
  reviewCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
