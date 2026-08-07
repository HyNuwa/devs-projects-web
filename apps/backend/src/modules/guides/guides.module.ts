import { Module } from '@nestjs/common';
import { GuidesService } from './guides.service';
import { GuidesController } from './guides.controller';
import { RankingModule } from '../ranking/ranking.module';

@Module({
  imports: [RankingModule],
  controllers: [GuidesController],
  providers: [GuidesService],
  exports: [GuidesService],
})
export class GuidesModule {}
