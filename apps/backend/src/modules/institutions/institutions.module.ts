import { Module } from '@nestjs/common';

import { InstitutionsController } from './institutions.controller';
import { InstitutionsService } from './institutions.service';
import { StudyPlansController } from './study-plans.controller';

@Module({
  controllers: [InstitutionsController, StudyPlansController],
  providers: [InstitutionsService],
  exports: [InstitutionsService],
})
export class InstitutionsModule {}
