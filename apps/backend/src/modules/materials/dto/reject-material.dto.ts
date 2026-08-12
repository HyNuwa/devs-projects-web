import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class RejectMaterialDto {
  @ApiProperty({ description: 'Motivo del rechazo' })
  @IsString()
  @MinLength(3, { message: 'El motivo debe tener al menos 3 caracteres' })
  @MaxLength(500, { message: 'El motivo no puede superar 500 caracteres' })
  reason: string;
}
