import {
  Controller,
  HttpCode,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { PrismaService } from '../../prisma/prisma.service';

/** The signed-in account's own sanciones. */
@ApiTags('Moderation')
@ApiBearerAuth()
@Controller('me')
export class MeSanctionsController {
  constructor(private readonly prisma: PrismaService) {}

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
