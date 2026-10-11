import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { Role } from '../../auth/dto/auth-response.dto';

export class UpdateRoleDto {
  @ApiProperty({ enum: Role })
  @IsEnum(Role)
  role: Role;
}
