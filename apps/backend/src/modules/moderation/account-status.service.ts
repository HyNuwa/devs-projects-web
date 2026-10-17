import { ForbiddenException, Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { isSuspended } from './sanctions.service';

const dateFormat = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'America/Argentina/Jujuy',
});

/**
 * Whether an account may write: publish, edit, resubmit, report or mark «Me sirvió»
 * (openspec moderation/sanctions). Reads the account from the database on every
 * call, so a suspensión applies even while an access token issued before it lasts.
 */
@Injectable()
export class AccountStatusService {
  constructor(private readonly prisma: PrismaService) {}

  async assertCanContribute(userId: string, now = new Date()) {
    const account = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isBanned: true, bannedUntil: true, mutedUntil: true },
    });
    if (!account) return;

    if (isSuspended(account, now)) {
      throw new ForbiddenException({
        code: 'ACCOUNT_SUSPENDED',
        until: account.bannedUntil?.toISOString() ?? null,
        message: 'Tu cuenta está suspendida',
      });
    }
    if (account.mutedUntil && account.mutedUntil.getTime() > now.getTime()) {
      throw new ForbiddenException({
        code: 'ACCOUNT_MUTED',
        until: account.mutedUntil.toISOString(),
        message: `Estás silenciado hasta el ${dateFormat.format(account.mutedUntil)}: no podés publicar, reportar ni marcar Me sirvió`,
      });
    }
  }
}
