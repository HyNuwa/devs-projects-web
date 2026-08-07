import { IsString, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Juan Pérez', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  @ApiProperty({
    example: 'Estudiante de Ingeniería Informática',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
