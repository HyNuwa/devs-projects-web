import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DiscoverySubjectLinkDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  code: string | null;

  @ApiProperty({
    description: 'Ruta canónica al hub público de la materia.',
    example: '/materias/S2-14',
  })
  href: string;
}

export class DiscoveryPublicAuthorDto {
  @ApiProperty({ example: 'luciana-g' })
  username: string;

  /** Present only when the entry was published under the author's name. */
  @ApiPropertyOptional({ format: 'uuid' })
  id?: string;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarCat?: string | null;
}

export class DiscoveryPaginationDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;
}
