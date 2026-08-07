import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({ example: 'abc123-token' })
  @IsString()
  token: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'abc123-token' })
  @IsString()
  token: string;

  @ApiProperty({
    example: 'NewStrongP@ss1',
    description: 'Mínimo 8 caracteres, 1 mayúscula, 1 número, 1 especial',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9])/, {
    message:
      'Password must contain at least 1 uppercase, 1 lowercase, 1 number and 1 special character',
  })
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}
