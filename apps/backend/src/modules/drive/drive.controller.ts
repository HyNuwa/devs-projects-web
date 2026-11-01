import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiPropertyOptional,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Length, Matches, Max, Min } from 'class-validator';
import { OptionalField } from '../../common/validation/learning.dto';
import { Permissions } from '../authorization/permissions.guard';
import { DriveService } from './drive.service';
export class DriveBrowseDto {
  @ApiPropertyOptional()
  @OptionalField()
  @Matches(/^[A-Za-z0-9_-]{1,200}$/)
  folderId?: string;
  @ApiPropertyOptional()
  @OptionalField()
  @IsString()
  @Length(1, 2048)
  pageToken?: string;
  @ApiPropertyOptional({ default: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 50;
}
@ApiTags('Drive')
@ApiBearerAuth()
@Controller('admin/drive')
export class DriveController {
  constructor(private readonly drive: DriveService) {}
  @Get('files')
  @Permissions('drive:manage')
  @ApiOperation({
    summary: 'Explorar archivos dentro de la raíz privada de Drive',
  })
  @ApiResponse({
    status: 200,
    description: 'Página de archivos y token de continuación',
  })
  browse(@Query() query: DriveBrowseDto) {
    return this.drive.browse(query.folderId, query.pageSize, query.pageToken);
  }
}
