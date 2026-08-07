import { Module } from '@nestjs/common';
import { ProfessorsService } from './professors.service';
import { ProfessorsController } from './professors.controller';
import { RankingModule } from '../ranking/ranking.module';

@Module({
  imports: [RankingModule],
  controllers: [ProfessorsController],
  providers: [ProfessorsService],
  exports: [ProfessorsService],
})
export class ProfessorsModule {}
