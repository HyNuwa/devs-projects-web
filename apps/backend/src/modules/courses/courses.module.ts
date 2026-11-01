import { Module } from '@nestjs/common';
import { DriveModule } from '../drive/drive.module';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { CourseFilesController } from './course-files.controller';
import { CourseFilesService } from './course-files.service';
@Module({
  imports: [DriveModule],
  controllers: [CoursesController, CourseFilesController],
  providers: [CoursesService, CourseFilesService],
})
export class CoursesModule {}
