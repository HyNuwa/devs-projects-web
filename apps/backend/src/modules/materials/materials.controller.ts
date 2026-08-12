import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  ParseUUIDPipe,
  Body,
  Query,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { RateMaterialDto } from './dto/rate-material.dto';
import { RejectMaterialDto } from './dto/reject-material.dto';
import { MaterialsQueryDto } from './dto/materials-query.dto';
import { MaterialResponseDto } from './dto/material-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../auth/dto/auth-response.dto';

const ALLOWED_MATERIAL_TYPES = [
  'pdf',
  'doc',
  'docx',
  'pptx',
  'xls',
  'txt',
  'md',
  'jpg',
  'png',
  'webp',
];

@ApiTags('Materials')
@ApiBearerAuth()
@Controller('materials')
export class MaterialsController {
  constructor(private materialsService: MaterialsService) {}

  @Post()
  @ApiOperation({ summary: 'Subir un nuevo material' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string' },
        description: { type: 'string' },
        subjectId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, type: MaterialResponseDto })
  @ApiResponse({ status: 400, description: 'Archivo inválido' })
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (_req, file, cb) => {
        const ext = path
          .extname(file.originalname)
          .toLowerCase()
          .replace('.', '');
        if (!ALLOWED_MATERIAL_TYPES.includes(ext)) {
          return cb(
            new BadRequestException(
              `Tipo de archivo no permitido. Extensiones válidas: ${ALLOWED_MATERIAL_TYPES.join(', ')}`,
            ),
            false,
          );
        }
        cb(null, true);
      },
      limits: {
        fileSize: 25 * 1024 * 1024, // 25MB
      },
    }),
  )
  async create(
    @Request() req: { user: { id: string; role: string } },
    @Body() dto: CreateMaterialDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }
    return this.materialsService.create(dto, file, req.user.id);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar materiales' })
  @ApiResponse({ status: 200, type: [MaterialResponseDto] })
  async findAll(@Query() query: MaterialsQueryDto) {
    return this.materialsService.findAll(query);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Mis subidas (autor)' })
  @ApiResponse({
    status: 200,
    description: 'Materiales del usuario autenticado',
  })
  async findMine(@Request() req: { user: { id: string } }) {
    return this.materialsService.findMine(req.user.id);
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Listar materiales pendientes de moderación' })
  @ApiResponse({ status: 200, description: 'Materiales en revisión' })
  async findPending() {
    return this.materialsService.findPending();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener material por ID' })
  @ApiResponse({ status: 200, type: MaterialResponseDto })
  @ApiResponse({ status: 404, description: 'Material no encontrado' })
  async findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.materialsService.findById(id);
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Aprobar material (moderador)' })
  @ApiResponse({ status: 200, type: MaterialResponseDto })
  @ApiResponse({ status: 404, description: 'Material no encontrado' })
  async approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.materialsService.approve(id, req.user.id);
  }

  @Post(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.MODERATOR, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Rechazar material (moderador)' })
  @ApiResponse({ status: 200, type: MaterialResponseDto })
  @ApiResponse({ status: 404, description: 'Material no encontrado' })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: RejectMaterialDto,
  ) {
    return this.materialsService.reject(id, req.user.id, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar material (solo autor)' })
  @ApiResponse({ status: 200, type: MaterialResponseDto })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 404, description: 'Material no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMaterialDto,
    @Request() req: { user: { id: string; role: string } },
  ) {
    return this.materialsService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar material (soft delete)' })
  @ApiResponse({ status: 200, description: 'Material eliminado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 404, description: 'Material no encontrado' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string; role: string } },
  ) {
    return this.materialsService.remove(id, req.user.id, req.user.role as Role);
  }

  @Get(':id/download')
  @Public()
  @ApiOperation({ summary: 'Descargar archivo de material' })
  @ApiResponse({ status: 200, description: 'Archivo del material' })
  @ApiResponse({ status: 404, description: 'Material o archivo no encontrado' })
  async download(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const material = await this.materialsService.download(id);

    // Si el archivo vive en Google Drive, redirigir a su URL de descarga.
    if (material.driveDownloadUrl) {
      return res.redirect(material.driveDownloadUrl);
    }

    const filePath = path.join(
      process.cwd(),
      'public',
      'uploads',
      'materials',
      path.basename(material.fileUrl),
    );

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Archivo no encontrado en el servidor');
    }

    res.sendFile(filePath);
  }

  @Post(':id/rate')
  @ApiOperation({ summary: 'Calificar un material' })
  @ApiResponse({ status: 200, type: MaterialResponseDto })
  @ApiResponse({ status: 404, description: 'Material no encontrado' })
  async rate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RateMaterialDto,
    @Request() req: { user: { id: string; role: string } },
  ) {
    return this.materialsService.rate(id, req.user.id, dto);
  }

  @Get(':id/ratings')
  @Public()
  @ApiOperation({ summary: 'Listar calificaciones de un material' })
  @ApiResponse({ status: 200, description: 'Lista de calificaciones' })
  async getRatings(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.materialsService.getRatings(id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
