import { ApiProperty } from '@nestjs/swagger';

import { StrictBoolean } from '../../../common/validation/strict-boolean';

export class SetMaterialHelpfulnessDto {
  @ApiProperty()
  @StrictBoolean()
  isHelpful: boolean;
}

export class SetSavedMaterialDto {
  @ApiProperty()
  @StrictBoolean()
  isSaved: boolean;
}
