import {
  Controller,
  Get,
  Patch,
  Param,
  ParseIntPipe,
  UseGuards,
  Body,
  Request,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role, UserResponseDto } from '../auth/dto/auth-response.dto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AssignRoleDto,
  RoleManagementService,
} from '../authorization/role-management.service';
import { roleCatalog } from '../authorization/permissions';
import { Permissions } from '../authorization/permissions.guard';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class AdminController {
  constructor(
    private prisma: PrismaService,
    private readonly roleManagement: RoleManagementService,
  ) {}

  @Get('roles')
  @Permissions('roles:read')
  @ApiOperation({ summary: 'Consultar catálogo de roles y permisos' })
  @ApiResponse({ status: 200, description: 'Catálogo de roles' })
  getRoles() {
    return roleCatalog();
  }

  @Get('users')
  @ApiOperation({ summary: 'Listar todos los usuarios' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  async getUsers() {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return users;
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async getUser(@Param('id', ParseIntPipe) id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  @Patch('users/:id/role')
  @Permissions('roles:assign')
  @ApiOperation({ summary: 'Cambiar rol de un usuario' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  async updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignRoleDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.roleManagement.assign(req.user.id, id, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas generales' })
  @ApiResponse({ status: 200, description: 'Estadísticas del sistema' })
  async getStats() {
    const [totalUsers, roleCounts] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
    ]);

    const byRole: Record<string, number> = {};
    for (const entry of roleCounts) {
      byRole[entry.role] = entry._count.role;
    }

    return {
      totalUsers,
      byRole,
    };
  }
}
