import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export const PIN_TYPES = [
  'MATERIAL',
  'COURSE_REVIEW',
  'EXAM_EXPERIENCE',
] as const;
export type PinType = (typeof PIN_TYPES)[number];

export class ProfilePinDto {
  @ApiProperty({ enum: PIN_TYPES })
  @IsIn(PIN_TYPES)
  type: PinType;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id: string;
}

/** Every choice at once: `PUT` replaces the whole perfil público. */
export class ReplaceProfileCustomizationDto {
  @ApiProperty({ nullable: true, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  avatarCat?: string | null;

  @ApiProperty({ nullable: true, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  accent?: string | null;

  @ApiProperty({ nullable: true, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  background?: string | null;

  @ApiProperty({ nullable: true, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  frame?: string | null;

  @ApiProperty({ nullable: true, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  banner?: string | null;

  @ApiProperty({ nullable: true, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  theme?: string | null;

  @ApiProperty({ nullable: true, required: false })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  titleBadge?: string | null;

  /** Bounded here only against abuse; the real limit is checked with a clear message. */
  @ApiProperty({ type: [String], maxItems: 10 })
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  featuredBadges: string[];

  @ApiProperty({ type: [ProfilePinDto], maxItems: 10 })
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ProfilePinDto)
  pinned: ProfilePinDto[];

  @ApiProperty()
  @IsBoolean()
  showLevelAndBadges: boolean;
}
