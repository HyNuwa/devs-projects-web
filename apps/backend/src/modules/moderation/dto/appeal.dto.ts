import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsString,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

import { StrictBoolean } from '../../../common/validation/strict-boolean';

export class FileAppealDto {
  @ApiProperty({ enum: ['RETIRO', 'SANCTION'] })
  @IsIn(['RETIRO', 'SANCTION'])
  kind: 'RETIRO' | 'SANCTION';

  @ApiPropertyOptional({ description: 'Caso del retiro apelado' })
  @ValidateIf((dto: FileAppealDto) => dto.kind === 'RETIRO')
  @IsUUID()
  caseId?: string;

  @ApiPropertyOptional({ description: 'Sanción apelada' })
  @ValidateIf((dto: FileAppealDto) => dto.kind === 'SANCTION')
  @IsUUID()
  sanctionId?: string;

  @ApiProperty({ maxLength: 1000, description: 'Por qué apelás' })
  @IsString()
  @MaxLength(1000)
  explanation: string;
}

export class AnswerAppealDto {
  @ApiProperty({ description: 'true acepta la apelación; false la rechaza' })
  @StrictBoolean()
  accept: boolean;

  @ApiProperty({
    maxLength: 1000,
    description: 'Respuesta final, con su razón',
  })
  @IsString()
  @MaxLength(1000)
  answer: string;
}

export class SuspensionAppealDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MaxLength(200)
  password: string;

  @ApiProperty({ maxLength: 1000 })
  @IsString()
  @MaxLength(1000)
  explanation: string;
}
