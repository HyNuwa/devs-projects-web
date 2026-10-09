import { Module } from '@nestjs/common';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';
import { RankingModule } from '../ranking/ranking.module';
import { ModerationCoreModule } from '../moderation/moderation-core.module';

@Module({
  imports: [RankingModule, ModerationCoreModule],
  controllers: [SubjectsController],
  providers: [SubjectsService, RolesGuard],
  exports: [SubjectsService],
})
export class SubjectsModule {}
