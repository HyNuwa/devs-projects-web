import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

type CommunityWriteRequest = {
  ip?: string;
  user?: { id?: string };
};

@Injectable()
export class CommunityWriteThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(request: CommunityWriteRequest): Promise<string> {
    if (request.user?.id) {
      return `user:${request.user.id}`;
    }

    return `ip:${request.ip ?? 'unknown'}`;
  }
}
