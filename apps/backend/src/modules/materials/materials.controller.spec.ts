import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../auth/dto/auth-response.dto';
import { MaterialsController } from './materials.controller';

function contextFor(
  handler: (...args: never[]) => unknown,
  role?: Role,
): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => MaterialsController,
    switchToHttp: () => ({
      getRequest: () => (role ? { user: { role } } : {}),
    }),
  } as unknown as ExecutionContext;
}

describe('MaterialsController moderation authorization', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  it.each(['approve', 'reject', 'findPending'] as const)(
    'restringe %s a roles de moderación',
    (method) => {
      const handler = MaterialsController.prototype[method] as (
        ...args: never[]
      ) => unknown;
      expect(Reflect.getMetadata(ROLES_KEY, handler)).toEqual([
        Role.ADMIN,
        Role.MODERATOR,
        Role.SUPERADMIN,
      ]);
      expect(guard.canActivate(contextFor(handler, Role.MODERATOR))).toBe(true);
      expect(() => guard.canActivate(contextFor(handler, Role.USER))).toThrow(
        ForbiddenException,
      );
      expect(() => guard.canActivate(contextFor(handler))).toThrow(
        ForbiddenException,
      );
    },
  );
});
