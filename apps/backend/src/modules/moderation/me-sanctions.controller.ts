import {
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { PrismaService } from '../../prisma/prisma.service';
import { AppealsService } from './appeals.service';
import { describeSanction, noticeSelect } from './account-notices';
import { FileAppealDto } from './dto/appeal.dto';

/** The signed-in account's own sanciones. */
@ApiTags('Moderation')
@ApiBearerAuth()
@Controller('me')
export class MeSanctionsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly appeals: AppealsService,
  ) {}

  @Get('sanctions')
  @ApiOperation({ summary: 'Mis sanciones, con su razón, fechas y apelación' })
  async sanctions(@Request() req: { user: { id: string } }) {
    const now = new Date();
    const rows = await this.prisma.sanction.findMany({
      where: { userId: req.user.id },
      orderBy: { startsAt: 'desc' },
      select: { ...noticeSelect, liftedAt: true, voidedAt: true },
    });
    return rows.map((row) => ({
      ...describeSanction(row, now),
      lifted: row.liftedAt !== null,
      voided: row.voidedAt !== null,
      // A voided sanción was overturned; there is nothing left to appeal.
      ...(row.voidedAt ? { appealable: false, appealDeadline: null } : {}),
    }));
  }

  @Post('appeals')
  @ApiOperation({ summary: 'Apelar un retiro o una sanción propia' })
  fileAppeal(
    @Request() req: { user: { id: string } },
    @Body() dto: FileAppealDto,
  ) {
    return this.appeals.file(
      req.user.id,
      dto.kind === 'RETIRO'
        ? { kind: 'RETIRO', caseId: dto.caseId ?? '' }
        : { kind: 'SANCTION', sanctionId: dto.sanctionId ?? '' },
      dto.explanation,
    );
  }

  @Post('warnings/:id/seen')
  @HttpCode(204)
  @ApiOperation({ summary: 'Marcar una advertencia como vista' })
  async markWarningSeen(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    const { count } = await this.prisma.sanction.updateMany({
      where: { id, userId: req.user.id, type: 'WARNING', seenAt: null },
      data: { seenAt: new Date() },
    });
    if (count === 0) throw new NotFoundException('Advertencia no encontrada');
  }
}
