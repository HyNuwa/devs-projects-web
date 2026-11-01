import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IsBoolean, IsIn, Matches } from 'class-validator';
import { Request, Response } from 'express';
import { pipeline } from 'node:stream/promises';
import { OptionalField } from '../../common/validation/learning.dto';
import { AuthenticatedUser } from '../authorization/permissions';
import { Permissions } from '../authorization/permissions.guard';
import { MAX_COURSE_FILE_SIZE } from '../drive/drive.service';
import { CourseFilesService } from './course-files.service';

export class ImportCourseFileDto {
  @ApiProperty() @Matches(/^[A-Za-z0-9_-]{1,200}$/) driveFileId: string;
  @ApiPropertyOptional({ default: true })
  @OptionalField()
  @IsBoolean()
  allowDownload = true;
}
export class FileContentQueryDto {
  @ApiPropertyOptional({ enum: ['true', 'false'] })
  @OptionalField()
  @IsIn(['true', 'false'])
  download?: string;
}
@ApiTags('Archivos de cursos')
@ApiBearerAuth()
@ApiResponse({ status: 200, description: 'Archivo autorizado' })
@Controller('courses/:id/lessons/:lessonId/files')
export class CourseFilesController {
  constructor(private readonly files: CourseFilesService) {}
  @Post()
  @Permissions('courses:manage', 'drive:manage')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Subir un archivo privado a la clase (máximo 25 MiB)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_COURSE_FILE_SIZE, files: 1, fields: 0 },
    }),
  )
  upload(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: { user: AuthenticatedUser },
  ) {
    if (!file) throw new BadRequestException('Falta el archivo');
    return this.files.upload(id, lessonId, req.user.id, file);
  }
  @Post('import')
  @Permissions('courses:manage', 'drive:manage')
  @ApiOperation({
    summary: 'Vincular un archivo privado existente dentro de la raíz Drive',
  })
  import(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: ImportCourseFileDto,
    @Req() req: { user: AuthenticatedUser },
  ) {
    return this.files.import(
      id,
      lessonId,
      req.user.id,
      dto.driveFileId,
      dto.allowDownload,
    );
  }
  @Delete(':fileId')
  @Permissions('courses:manage', 'drive:manage')
  @ApiOperation({ summary: 'Desvincular un archivo y registrar su limpieza' })
  detach(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ) {
    return this.files.detach(id, lessonId, fileId);
  }
  @Get(':fileId/content')
  @ApiOperation({
    summary: 'Leer o descargar un archivo con autorización del curso',
  })
  async content(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Query() query: FileContentQueryDto,
    @Req() req: Request & { user: AuthenticatedUser },
    @Res() res: Response,
  ) {
    const { stream, file, range, size } = await this.files.content(
      id,
      lessonId,
      fileId,
      req.user,
      req.headers.range,
      query.download === 'true',
    );
    res.status(range ? 206 : 200);
    res.set({
      'Content-Type': file.mimeType,
      'Content-Length': String(range ? range.end - range.start + 1 : size),
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': `${query.download === 'true' ? 'attachment' : 'inline'}; filename="file"; filename*=UTF-8''${encodeURIComponent(file.originalName).replace(/['()*]/g, (c) => '%' + c.charCodeAt(0).toString(16))}`,
    });
    if (range)
      res.setHeader(
        'Content-Range',
        `bytes ${range.start}-${range.end}/${size}`,
      );
    const close = () => stream.destroy();
    res.once('close', close);
    try {
      await pipeline(stream, res);
    } catch {
      res.destroy();
    } finally {
      res.removeListener('close', close);
    }
  }
}
