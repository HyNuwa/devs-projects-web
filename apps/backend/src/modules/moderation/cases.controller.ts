import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import * as fs from 'fs';

import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '../auth/dto/auth-response.dto';
import { CasesService } from './cases.service';

@ApiTags('Moderation')
@ApiBearerAuth()
@Controller('moderation/cases')
@UseGuards(RolesGuard)
@Roles(Role.MODERATOR, Role.ADMIN, Role.SUPERADMIN)
export class CasesController {
  constructor(private readonly cases: CasesService) {}

  @Get()
  @ApiOperation({ summary: 'Cola de casos abiertos, agrupada y ordenada' })
  queue() {
    return this.cases.queue();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un caso de moderación' })
  detail(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.cases.detail(id, req.user.id);
  }

  @Get(':id/file')
  @ApiOperation({
    summary:
      'Archivo del material del caso, incluido el que espera revisión previa',
  })
  async file(@Param('id', ParseUUIDPipe) id: string, @Res() res: Response) {
    const file = await this.cases.materialFile(id);
    if (file.redirectUrl) return res.redirect(file.redirectUrl);
    if (!file.localPath || !fs.existsSync(file.localPath)) {
      throw new NotFoundException('Archivo no encontrado en el servidor');
    }
    return res.sendFile(file.localPath);
  }
}
