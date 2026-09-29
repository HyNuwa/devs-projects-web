import {
  Body,
  ConflictException,
  Controller,
  Ip,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';

import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { AppealsService } from './appeals.service';
import { SuspensionAppealDto } from './dto/appeal.dto';
import { SuspensionAppealLimiter } from './suspension-appeal.limiter';
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
    private readonly limiter: SuspensionAppealLimiter,
  ) {}

  @Public()
  @Post('suspension-appeal')
  @ApiOperation({ summary: 'Apelar una suspensión desde el ingreso' })
  async appeal(@Body() dto: SuspensionAppealDto, @Ip() ip: string) {
    this.limiter.hit(ip ?? 'unknown');
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        passwordHash: true,
        isBanned: true,
        bannedUntil: true,
      },
    });
    // Same refusal as sign-in: never say whether the account exists.
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
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
