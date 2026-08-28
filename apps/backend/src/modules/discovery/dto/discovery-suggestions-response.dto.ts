import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaterialResourceType } from '../../../generated/prisma';

export class DiscoverySubjectSuggestionDto {
  @ApiProperty({ enum: ['SUBJECT'] })
  kind: 'SUBJECT';

  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  code: string | null;
}

export class DiscoveryMaterialSubjectDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional({ nullable: true })
  code: string | null;
}

export class DiscoveryMaterialSuggestionDto {
  @ApiProperty({ enum: ['MATERIAL'] })
  kind: 'MATERIAL';

  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ enum: MaterialResourceType })
  resourceType: MaterialResourceType;

  @ApiProperty({ type: DiscoveryMaterialSubjectDto })
  subject: DiscoveryMaterialSubjectDto;
}

export class DiscoverySuggestionsResponseDto {
  @ApiProperty({ type: [DiscoverySubjectSuggestionDto] })
  subjects: DiscoverySubjectSuggestionDto[];

  @ApiProperty({ type: [DiscoveryMaterialSuggestionDto] })
  materials: DiscoveryMaterialSuggestionDto[];
}
