import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../auth/dto/auth-response.dto';
import { CasesController } from './cases.controller';

function contextFor(
  handler: (...args: never[]) => unknown,
  role?: Role,
): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => CasesController,
    switchToHttp: () => ({
      getRequest: () => (role ? { user: { role } } : {}),
    }),
  } as unknown as ExecutionContext;
}

describe('CasesController authorization', () => {
  const guard = new RolesGuard(new Reflector());

  it.each(['queue', 'detail', 'file'] as const)(
    'restricts %s to moderators, admins and superadmins',
    (method) => {
      const handler = CasesController.prototype[method] as (
        ...args: never[]
      ) => unknown;

      for (const role of [Role.MODERATOR, Role.ADMIN, Role.SUPERADMIN]) {
        expect(guard.canActivate(contextFor(handler, role))).toBe(true);
      }
      expect(() => guard.canActivate(contextFor(handler, Role.USER))).toThrow(
        ForbiddenException,
      );
      expect(() => guard.canActivate(contextFor(handler))).toThrow(
        ForbiddenException,
      );
    },
  );
});
