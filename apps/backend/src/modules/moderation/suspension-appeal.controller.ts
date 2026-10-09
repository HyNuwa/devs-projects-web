import {
  Body,
  ConflictException,
  Controller,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { PasswordHasher } from '../auth/password-hasher';
import { LoginAttempts } from '../rate-limit/login-attempts';
import { RateLimit, RateLimitGuard } from '../rate-limit/rate-limit.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { AppealsService } from './appeals.service';
import { SuspensionAppealDto } from './dto/appeal.dto';
import { suspensionNotice } from './suspension-notice';

/**
 * A suspended account cannot sign in, so it appeals from the sign-in screen by
 * entering its credentials again (openspec moderation/appeals). It never signs in.
 */
@ApiTags('Moderation')
@Controller('auth')
export class SuspensionAppealController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appeals: AppealsService,
    private readonly loginAttempts: LoginAttempts,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  @Public()
  @RateLimit('appeal')
  @UseGuards(RateLimitGuard)
  @Post('suspension-appeal')
  @ApiOperation({ summary: 'Apelar una suspensión desde el ingreso' })
  async appeal(@Body() dto: SuspensionAppealDto, @Req() req: { ip?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        passwordHash: true,
        isBanned: true,
        bannedUntil: true,
      },
    });
    // Same check and refusal as sign-in: never say whether the account exists.
    const passwordMatches = await this.passwordHasher.verify(
      dto.password,
      user?.passwordHash ?? null,
    );
    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    // It shares the sign-in cap per client; a right password is not a guess.
    await this.loginAttempts.forgiveClient(req.ip);
    const notice = await suspensionNotice(this.prisma, user);
    if (!notice?.sanctionId) {
      throw new ConflictException('La cuenta no está suspendida');
    }
    await this.appeals.file(
      user.id,
      { kind: 'SANCTION', sanctionId: notice.sanctionId },
      dto.explanation,
    );
    return { status: 'RECEIVED' as const };
  }
}
