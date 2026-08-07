import { Module } from '@nestjs/common';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { MaterialStorageService } from './material-storage.service';
import { RankingModule } from '../ranking/ranking.module';

@Module({
  imports: [RankingModule],
  controllers: [MaterialsController],
  providers: [MaterialsService, MaterialStorageService],
  exports: [MaterialsService],
})
export class MaterialsModule {}
