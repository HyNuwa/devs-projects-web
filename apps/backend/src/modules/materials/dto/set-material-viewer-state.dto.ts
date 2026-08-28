import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class SetMaterialHelpfulnessDto {
  @ApiProperty()
  @IsBoolean()
  isHelpful: boolean;
}

export class SetSavedMaterialDto {
  @ApiProperty()
  @IsBoolean()
  isSaved: boolean;
}
