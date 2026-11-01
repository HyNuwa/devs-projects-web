import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser, hasPermissions, Permission } from './permissions';

const PERMISSIONS_KEY = 'action_permissions';
export function Permissions(...permissions: Permission[]) {
  return applyDecorators(
    SetMetadata(PERMISSIONS_KEY, permissions),
    UseGuards(PermissionsGuard),
  );
}
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required?.length) return true;
    const { user, method } = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUser; method: string }>();
    if (!user || !hasPermissions(user.role, required))
      throw new ForbiddenException('No tenés permisos para esta acción');
    if (
      user.mutedUntil &&
      user.mutedUntil > new Date() &&
      !['GET', 'HEAD', 'OPTIONS'].includes(method)
    ) {
      throw new ForbiddenException('Tu cuenta está silenciada temporalmente');
    }
    return true;
  }
}
