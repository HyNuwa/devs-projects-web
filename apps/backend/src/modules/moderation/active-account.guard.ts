import {
  applyDecorators,
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UseGuards,
} from '@nestjs/common';

import { AccountStatusService } from './account-status.service';

@Injectable()
export class ActiveAccountGuard implements CanActivate {
  constructor(private readonly status: AccountStatusService) {}

  async canActivate(context: ExecutionContext) {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { id: string } }>();
    if (request.user) await this.status.assertCanContribute(request.user.id);
    return true;
  }
}

/**
 * Marks an endpoint that a silenced or suspended account must not use: publishing,
 * editing, resubmitting, reporting and «Me sirvió».
 */
export function RequiresActiveAccount() {
  return applyDecorators(UseGuards(ActiveAccountGuard));
}
