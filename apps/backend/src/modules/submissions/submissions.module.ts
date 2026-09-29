import { Module } from '@nestjs/common';

import { MaterialsModule } from '../materials/materials.module';
import { SubjectsModule } from '../subjects/subjects.module';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';

/** Mis envíos: what happened to each of the signed-in author's contributions. */
@Module({
  imports: [MaterialsModule, SubjectsModule],
  controllers: [SubmissionsController],
  providers: [SubmissionsService],
})
export class SubmissionsModule {}
