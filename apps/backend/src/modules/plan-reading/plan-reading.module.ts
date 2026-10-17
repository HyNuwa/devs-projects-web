import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CatalogModule } from '../catalog/catalog.module';
import { GeminiPlanModel } from './gemini-plan-model';
import { PlanFetcher, SafePlanFetcher } from './plan-fetcher';
import { PlanModel } from './plan-model';
import { PlanReadingController } from './plan-reading.controller';
import { PlanReadingLimits } from './plan-reading.limits';
import { PlanReadingService } from './plan-reading.service';

@Module({
  imports: [CatalogModule],
  controllers: [PlanReadingController],
  providers: [
    PlanReadingService,
    PlanReadingLimits,
    { provide: PlanFetcher, useClass: SafePlanFetcher },
    {
      provide: PlanModel,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new GeminiPlanModel({
          apiKey: config.get<string>('API_KEY_GEMINI'),
          model: config.get<string>('GEMINI_MODEL'),
        }),
    },
  ],
})
export class PlanReadingModule {}
