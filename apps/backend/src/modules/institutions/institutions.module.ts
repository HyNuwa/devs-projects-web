import { Module } from '@nestjs/common';

import { CatalogBrowseService } from './catalog-browse.service';
import { InstitutionsController } from './institutions.controller';
import { InstitutionsService } from './institutions.service';
import { StudyPlansController } from './study-plans.controller';

@Module({
  controllers: [InstitutionsController, StudyPlansController],
  providers: [InstitutionsService, CatalogBrowseService],
  exports: [InstitutionsService],
})
export class InstitutionsModule {}
