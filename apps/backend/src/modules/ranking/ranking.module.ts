import { Module } from '@nestjs/common';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';
import { ContributionPoints } from './contribution-points';
import { HelpfulPoints } from './helpful-points';
import { PioneerBonus } from './pioneer-bonus';
import { PointLedger } from './point-ledger';
import { ProgressController, ProgressService } from './progress.controller';
import { ReportPoints } from './report-points';

@Module({
  controllers: [RankingController, ProgressController],
  providers: [
    RankingService,
    ProgressService,
    PointLedger,
    ContributionPoints,
    HelpfulPoints,
    PioneerBonus,
    ReportPoints,
  ],
  exports: [
    PointLedger,
    ContributionPoints,
    HelpfulPoints,
    PioneerBonus,
    ReportPoints,
    RankingService,
  ],
})
export class RankingModule {}
