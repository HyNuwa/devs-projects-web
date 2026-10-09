import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RevealAuthorDto {
  @ApiProperty({
    maxLength: 300,
    description: 'Por qué necesitás ver al autor',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  reason: string;
}
