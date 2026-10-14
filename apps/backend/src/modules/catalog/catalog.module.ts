import { Module } from '@nestjs/common';

import { ModerationCoreModule } from '../moderation/moderation-core.module';
import {
  AdminCareerRequestsController,
  CareerRequestsController,
  MyCareerRequestsController,
} from './career-requests.controller';
import { CareerRequestsService } from './career-requests.service';
import { CatalogBulkService } from './catalog-bulk.service';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';

@Module({
  imports: [ModerationCoreModule],
  controllers: [
    CatalogController,
    CareerRequestsController,
    MyCareerRequestsController,
    AdminCareerRequestsController,
  ],
  providers: [CatalogService, CatalogBulkService, CareerRequestsService],
  exports: [CatalogService],
})
export class CatalogModule {}
