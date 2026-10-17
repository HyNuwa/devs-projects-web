import { Module } from '@nestjs/common';

import { AccountStatusService } from './account-status.service';
import { ActiveAccountGuard } from './active-account.guard';
import { PublicationPolicy } from './publication-policy.service';

/** Publication rules shared by every contribution type (materials, reseñas, experiencias). */
@Module({
  providers: [PublicationPolicy, AccountStatusService, ActiveAccountGuard],
  exports: [PublicationPolicy, AccountStatusService, ActiveAccountGuard],
})
export class ModerationCoreModule {}
