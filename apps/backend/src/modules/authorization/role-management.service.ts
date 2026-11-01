import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsEnum, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '../auth/dto/auth-response.dto';

export class AssignRoleDto {
  @ApiProperty({ enum: Role }) @IsEnum(Role) role: Role;
  @ApiProperty({ minLength: 10, maxLength: 500 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(10, 500)
  reason: string;
}
export const safeUserSelect = {
  id: true,
  username: true,
  email: true,
  role: true,
  name: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class RoleManagementService {
  constructor(private readonly prisma: PrismaService) {}
  async assign(actorId: number, targetId: number, dto: AssignRoleDto) {
    if (actorId === targetId)
      throw new ForbiddenException('No podés cambiar tu propio rol');
    return this.prisma.$transaction(async (tx) => {
      // All role assignments share one transaction-scoped exclusive lock.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(730011)`;
      const actor = await tx.user.findUnique({ where: { id: actorId } });
      const target = await tx.user.findUnique({ where: { id: targetId } });
      if (
        !actor ||
        (actor.role !== 'ADMIN' && actor.role !== 'SUPERADMIN') ||
        (actor.isBanned &&
          (!actor.bannedUntil || actor.bannedUntil > new Date()))
      ) {
        throw new ForbiddenException('No tenés permisos para asignar roles');
      }
      if (!target) throw new NotFoundException('Usuario no encontrado');
      if (
        actor.role === 'ADMIN' &&
        [target.role, dto.role].some((r) => r === 'ADMIN' || r === 'SUPERADMIN')
      ) {
        throw new ForbiddenException(
          'Solo SUPERADMIN puede administrar estos roles',
        );
      }
      if (target.role === dto.role)
        throw new ConflictException('El usuario ya tiene ese rol');
      if (
        target.role === 'SUPERADMIN' &&
        (await tx.user.count({ where: { role: 'SUPERADMIN' } })) <= 1
      ) {
        throw new ConflictException('Debe permanecer al menos un SUPERADMIN');
      }
      const user = await tx.user.update({
        where: { id: targetId },
        data: { role: dto.role },
        select: safeUserSelect,
      });
      await tx.roleChangeAudit.create({
        data: {
          actorId,
          targetId,
          oldRole: target.role,
          newRole: dto.role,
          reason: dto.reason,
        },
      });
      return user;
    });
  }
}
