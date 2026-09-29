import { Module } from '@nestjs/common';

import { PublicationPolicy } from './publication-policy.service';

/** Publication rules shared by every contribution type (materials, reseñas, experiencias). */
@Module({
  providers: [PublicationPolicy],
  exports: [PublicationPolicy],
})
export class ModerationCoreModule {}
