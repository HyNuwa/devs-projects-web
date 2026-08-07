import { Module } from '@nestjs/common';
import { RankingController } from './ranking.controller';
import { RankingService } from './ranking.service';
import { PointService } from './point.service';

@Module({
  controllers: [RankingController],
  providers: [RankingService, PointService],
  exports: [PointService, RankingService],
})
export class RankingModule {}
