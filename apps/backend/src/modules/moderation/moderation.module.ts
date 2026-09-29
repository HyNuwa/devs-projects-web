import { Module } from '@nestjs/common';

import { CasesController } from './cases.controller';
import { CasesService } from './cases.service';
import { ModerationCoreModule } from './moderation-core.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

/** Reportes, casos de moderación, decisions and history (openspec moderation/cases). */
@Module({
  imports: [ModerationCoreModule],
  controllers: [ReportsController, CasesController],
  providers: [ReportsService, CasesService],
})
export class ModerationModule {}
