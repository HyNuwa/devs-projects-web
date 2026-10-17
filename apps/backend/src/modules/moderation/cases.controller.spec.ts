import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../auth/dto/auth-response.dto';
import { CasesController } from './cases.controller';
import { HistoryController } from './history.controller';

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

  it.each(['queue', 'detail', 'file', 'decide', 'revealAuthor'] as const)(
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

describe('HistoryController authorization', () => {
  const guard = new RolesGuard(new Reflector());
  const handler = Object.getOwnPropertyDescriptor(
    HistoryController.prototype,
    'list',
  )!.value as (...args: never[]) => unknown;
  const context = (role?: Role) =>
    ({
      getHandler: () => handler,
      getClass: () => HistoryController,
      switchToHttp: () => ({
        getRequest: () => (role ? { user: { role } } : {}),
      }),
    }) as unknown as ExecutionContext;

  it('is only for moderators, admins and superadmins', () => {
    expect(guard.canActivate(context(Role.MODERATOR))).toBe(true);
    expect(() => guard.canActivate(context(Role.USER))).toThrow(
      ForbiddenException,
    );
  });

  it('offers no way to edit or delete records', () => {
    const methods = Object.getOwnPropertyNames(
      HistoryController.prototype,
    ).filter((name) => name !== 'constructor');
    expect(methods).toEqual(['list']);
  });
});
