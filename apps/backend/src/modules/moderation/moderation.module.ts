import { Module } from '@nestjs/common';

import { CasesController } from './cases.controller';
import { MaterialsModule } from '../materials/materials.module';
import { RankingModule } from '../ranking/ranking.module';
import { CasesService } from './cases.service';
import { DecisionsService } from './decisions.service';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { ModerationCoreModule } from './moderation-core.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { MeSanctionsController } from './me-sanctions.controller';
import { SanctionsController } from './sanctions.controller';
import { SanctionsService } from './sanctions.service';
import { SuspensionProposalsService } from './suspension-proposals.service';

/** Reportes, casos de moderación, decisions and history (openspec moderation/cases). */
@Module({
  imports: [ModerationCoreModule, MaterialsModule, RankingModule],
  controllers: [
    ReportsController,
    CasesController,
    HistoryController,
    SanctionsController,
    MeSanctionsController,
  ],
  providers: [
    ReportsService,
    CasesService,
    DecisionsService,
    HistoryService,
    SanctionsService,
    SuspensionProposalsService,
  ],
})
export class ModerationModule {}
