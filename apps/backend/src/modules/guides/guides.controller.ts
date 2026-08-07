import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GuidesService } from './guides.service';
import { CreateGuideDto } from './dto/create-guide.dto';
import { UpdateGuideDto } from './dto/update-guide.dto';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { GuideResponseDto } from './dto/guide-response.dto';
import { Role } from '../auth/dto/auth-response.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Guides')
@ApiBearerAuth()
@Controller('guides')
export class GuidesController {
  constructor(private readonly guidesService: GuidesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva guía' })
  @ApiResponse({
    status: 201,
    description: 'Guía creada',
    type: GuideResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  create(
    @Body() dto: CreateGuideDto,
    @Request() req: { user: { id: string; role: string } },
  ) {
    return this.guidesService.create(dto, req.user.id);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar guías publicadas (paginado)' })
  @ApiResponse({ status: 200, description: 'Lista de guías' })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.guidesService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Obtener guía por slug' })
  @ApiResponse({
    status: 200,
    description: 'Guía encontrada',
    type: GuideResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Guía no encontrada' })
  findBySlug(@Param('slug') slug: string) {
    return this.guidesService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar guía (solo autor)' })
  @ApiResponse({
    status: 200,
    description: 'Guía actualizada',
    type: GuideResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 404, description: 'Guía no encontrada' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGuideDto,
    @Request() req: { user: { id: string; role: string } },
  ) {
    return this.guidesService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar guía (soft delete)' })
  @ApiResponse({ status: 200, description: 'Guía eliminada' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 404, description: 'Guía no encontrada' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string; role: string } },
  ) {
    return this.guidesService.remove(id, req.user.id, req.user.role as Role);
  }

  @Post(':id/steps')
  @ApiOperation({ summary: 'Agregar paso a una guía (solo autor)' })
  @ApiResponse({ status: 201, description: 'Paso creado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 404, description: 'Guía no encontrada' })
  addStep(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateStepDto,
    @Request() req: { user: { id: string; role: string } },
  ) {
    return this.guidesService.addStep(id, dto, req.user.id);
  }

  @Patch(':id/steps/:stepId')
  @ApiOperation({ summary: 'Actualizar paso (solo autor)' })
  @ApiResponse({ status: 200, description: 'Paso actualizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 404, description: 'Paso no encontrado' })
  updateStep(
    @Param('id', ParseUUIDPipe) _id: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Body() dto: UpdateStepDto,
    @Request() req: { user: { id: string; role: string } },
  ) {
    return this.guidesService.updateStep(stepId, dto, req.user.id);
  }

  @Delete(':id/steps/:stepId')
  @ApiOperation({ summary: 'Eliminar paso y reordenar (solo autor)' })
  @ApiResponse({ status: 200, description: 'Paso eliminado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 404, description: 'Paso no encontrado' })
  removeStep(
    @Param('id', ParseUUIDPipe) _id: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Request() req: { user: { id: string; role: string } },
  ) {
    return this.guidesService.removeStep(stepId, req.user.id);
  }
}
