import { Module } from '@nestjs/common';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';
import { BadgeService } from './badges/badge.service';
import {
  MyBadgesController,
  MyBadgesService,
} from './badges/badges.controller';
import { ContributionPoints } from './contribution-points';
import { HelpfulPoints } from './helpful-points';
import { PioneerBonus } from './pioneer-bonus';
import { PointLedger } from './point-ledger';
import { ProgressController, ProgressService } from './progress.controller';
import { ReportPoints } from './report-points';

@Module({
  controllers: [RankingController, ProgressController, MyBadgesController],
  providers: [
    RankingService,
    ProgressService,
    PointLedger,
    ContributionPoints,
    HelpfulPoints,
    PioneerBonus,
    ReportPoints,
    BadgeService,
    MyBadgesService,
  ],
  exports: [
    PointLedger,
    ContributionPoints,
    HelpfulPoints,
    PioneerBonus,
    ReportPoints,
    BadgeService,
    RankingService,
  ],
})
export class RankingModule {}
