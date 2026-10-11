import {
  Controller,
  Get,
  Patch,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Body,
  ForbiddenException,
  NotFoundException,
  Request,
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
import { UpdateRoleDto } from './dto/update-role.dto';

const ADMIN_ROLES: Role[] = [Role.ADMIN, Role.SUPERADMIN];

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
export class AdminController {
  constructor(private prisma: PrismaService) {}

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
        displayName: true,
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
  async getUser(@Param('id', ParseUUIDPipe) id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        displayName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Cambiar rol de un usuario' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({
    status: 403,
    description:
      'Solo un SUPERADMIN otorga o quita ADMIN y SUPERADMIN; nadie cambia su propio rol',
  })
  async updateUserRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateRoleDto,
    @Request() req: { user: { id: string; role: Role } },
  ) {
    if (req.user.id === id) {
      throw new ForbiddenException('No podés cambiar tu propio rol.');
    }
    const select = {
      id: true,
      username: true,
      email: true,
      role: true,
      displayName: true,
      createdAt: true,
      updatedAt: true,
    } as const;

    return this.prisma.$transaction(async (tx) => {
      // Locked, so the role checked is the role changed.
      const [target] = await tx.$queryRaw<{ role: Role }[]>`
        SELECT "role"::text AS "role" FROM "users" WHERE "id" = ${id}::uuid FOR UPDATE`;
      if (!target) throw new NotFoundException('Usuario no encontrado');
      const touchesAdmins = [body.role, target.role].some((role) =>
        ADMIN_ROLES.includes(role),
      );
      if (touchesAdmins && req.user.role !== Role.SUPERADMIN) {
        throw new ForbiddenException(
          'Solo un SUPERADMIN puede otorgar o quitar los roles ADMIN y SUPERADMIN.',
        );
      }
      if (target.role === body.role) {
        return tx.user.findUniqueOrThrow({ where: { id }, select });
      }
      const user = await tx.user.update({
        where: { id },
        data: { role: body.role },
        select,
      });
      await tx.moderationEvent.create({
        data: {
          actorId: req.user.id,
          action: 'ROLE_CHANGED',
          targetUserId: id,
          metadata: { from: target.role, to: body.role },
        },
      });
      return user;
    });
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
