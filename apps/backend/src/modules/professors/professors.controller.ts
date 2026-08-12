import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProfessorsService } from './professors.service';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import { ProfessorsQueryDto } from './dto/professors-query.dto';
import { ProfessorResponseDto } from './dto/professor-response.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../auth/dto/auth-response.dto';

@ApiTags('Professors')
@ApiBearerAuth()
@Controller('professors')
export class ProfessorsController {
  constructor(private professorsService: ProfessorsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar profesores' })
  @ApiResponse({ status: 200, description: 'Lista paginada de profesores' })
  findAll(@Query() query: ProfessorsQueryDto) {
    return this.professorsService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener profesor por ID' })
  @ApiResponse({ status: 200, type: ProfessorResponseDto })
  @ApiResponse({ status: 404, description: 'Profesor no encontrado' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.professorsService.findById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Crear profesor (solo administradores)' })
  @ApiResponse({ status: 201, type: ProfessorResponseDto })
  create(@Body() dto: CreateProfessorDto) {
    return this.professorsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Actualizar profesor (solo administradores)' })
  @ApiResponse({ status: 200, type: ProfessorResponseDto })
  @ApiResponse({ status: 404, description: 'Profesor no encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProfessorDto,
  ) {
    return this.professorsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @ApiOperation({ summary: 'Eliminar profesor (solo administradores)' })
  @ApiResponse({ status: 200, description: 'Profesor eliminado' })
  @ApiResponse({ status: 404, description: 'Profesor no encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.professorsService.remove(id);
  }
}
