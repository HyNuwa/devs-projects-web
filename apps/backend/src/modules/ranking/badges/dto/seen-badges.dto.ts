import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class SeenBadgeDto {
  @ApiProperty()
  @IsString()
  @MaxLength(60)
  slug: string;

  @ApiProperty({ description: '0 unless seasonal' })
  @IsInt()
  @Min(0)
  edition: number;
}

/** The insignias the page showed, so only those stop being new. */
export class SeenBadgesDto {
  @ApiProperty({ type: [SeenBadgeDto] })
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SeenBadgeDto)
  badges: SeenBadgeDto[];
}
