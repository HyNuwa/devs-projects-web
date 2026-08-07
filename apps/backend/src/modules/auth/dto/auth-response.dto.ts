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
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({ nullable: true })
  displayName: string | null;

  @ApiProperty({ nullable: true })
  avatarUrl: string | null;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ nullable: true })
  refreshToken: string | null;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
