import { Module } from '@nestjs/common';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { LocalFileStorageService } from './file-storage.service';
import { GoogleDriveStorageService } from './google-drive-storage.service';
import { RankingModule } from '../ranking/ranking.module';
import { ModerationCoreModule } from '../moderation/moderation-core.module';

@Module({
  imports: [RankingModule, ModerationCoreModule],
  controllers: [MaterialsController],
  providers: [
    MaterialsService,
    LocalFileStorageService,
    GoogleDriveStorageService,
    {
      provide: 'FILE_STORAGE',
      inject: [GoogleDriveStorageService],
      useFactory: (drive: GoogleDriveStorageService) =>
        drive.isConfigured ? drive : new LocalFileStorageService(),
    },
  ],
  exports: [MaterialsService],
})
export class MaterialsModule {}
