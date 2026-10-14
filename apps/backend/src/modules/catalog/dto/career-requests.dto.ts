import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { CreateUniversityDto } from './catalog.dto';
import { SLUG_PATTERN } from '../catalog-codes';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateCareerRequestDto {
  /** A facultad of the catálogo, or none when it is written in free text. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  facultyId?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  facultyText?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  universityText?: string;

  @ApiProperty({ maxLength: 100 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  careerName: string;

  @ApiProperty({ maxLength: 500 })
  @Transform(trim)
  @IsString()
  @Matches(/^https:\/\/\S+$/, {
    message: 'El link al plan tiene que empezar con https://.',
  })
  @MaxLength(500)
  planUrl: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  comment?: string;
}

export class PendingInFacultyQueryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  facultyId: string;
}

class AcceptedCareerDto {
  @ApiProperty({ maxLength: 100 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ maxLength: 20 })
  @Transform(trim)
  @IsString()
  @Matches(SLUG_PATTERN, {
    message: 'Usá solo letras sin acentos, números y guiones.',
  })
  @MaxLength(20)
  code: string;
}

/** The facultad an admin confirms for a solicitud written in free text. */
class AcceptedFacultyDto extends CreateUniversityDto {
  /** An existing universidad, or `university` to create it. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  universityId?: string;

  @ApiPropertyOptional({ type: () => CreateUniversityDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateUniversityDto)
  university?: CreateUniversityDto;
}

export class AcceptCareerRequestDto {
  /**
   * For a solicitud whose facultad was free text: an existing facultad of the
   * catálogo (for example one created by an earlier solicitud), instead of
   * `faculty`.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  facultyId?: string;

  @ApiProperty({ type: () => AcceptedCareerDto })
  @ValidateNested()
  @Type(() => AcceptedCareerDto)
  career: AcceptedCareerDto;

  @ApiPropertyOptional({ type: () => AcceptedFacultyDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AcceptedFacultyDto)
  faculty?: AcceptedFacultyDto;
}

export class RejectCareerRequestDto {
  @ApiProperty({ maxLength: 500 })
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Escribí el motivo.' })
  @MaxLength(500)
  reason: string;
}

export class AlreadyLoadedDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  careerId: string;
}
