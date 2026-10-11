import { Module } from '@nestjs/common';

import { MaterialsModule } from '../materials/materials.module';
import { RankingModule } from '../ranking/ranking.module';
import { TrustModule } from '../trust/trust.module';
import {
  AuthorCorrectionsController,
  MaterialCorrectionsController,
  ModerationCorrectionsController,
} from './corrections.controller';
import { CorrectionsService } from './corrections.service';

@Module({
  imports: [MaterialsModule, RankingModule, TrustModule],
  controllers: [
    MaterialCorrectionsController,
    AuthorCorrectionsController,
    ModerationCorrectionsController,
  ],
  providers: [CorrectionsService],
  exports: [CorrectionsService],
})
export class CorrectionsModule {}
