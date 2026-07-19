import { ApiProperty } from '@nestjs/swagger';

export enum Role {
  VISITOR = 'VISITOR',
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  SUPERADMIN = 'SUPERADMIN',
}

export class UserResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({ nullable: true })
  name: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
