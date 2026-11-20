import { ApiProperty } from '@nestjs/swagger';

export class DiscoveryUniversityDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  shortName: string;
}

/** A materia's facultad with its universidad (ADR 0002). */
export class DiscoveryFacultyDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  shortName: string;

  @ApiProperty({ type: DiscoveryUniversityDto })
  university: DiscoveryUniversityDto;
}
