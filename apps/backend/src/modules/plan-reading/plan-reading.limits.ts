import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const DEFAULT_DAILY_LIMIT = 100;

/** Lecturas del plan all admins can run per day, `PLAN_READING_DAILY_LIMIT`. */
@Injectable()
export class PlanReadingLimits {
  readonly daily: number;

  constructor(config: ConfigService) {
    const limit = Number(config.get<string>('PLAN_READING_DAILY_LIMIT'));
    this.daily =
      Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_DAILY_LIMIT;
  }
}
