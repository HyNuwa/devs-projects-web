import { Body, Controller, HttpCode, Post, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CreateReportDto } from './dto/create-report.dto';
import { ReportsService } from './reports.service';

@ApiTags('Moderation')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post()
  @HttpCode(202)
  @ApiOperation({ summary: 'Reportar una publicación visible' })
  file(@Request() req: { user: { id: string } }, @Body() dto: CreateReportDto) {
    return this.reports.file(req.user.id, dto);
  }
}
