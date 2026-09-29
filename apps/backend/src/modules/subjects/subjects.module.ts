import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CommunityWriteThrottlerGuard } from '../../common/guards/community-write-throttler.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';
import { RankingModule } from '../ranking/ranking.module';
import { ModerationCoreModule } from '../moderation/moderation-core.module';

@Module({
  imports: [
    RankingModule,
    ModerationCoreModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          name: 'communityWrite',
          limit: configService.get<number>('COMMUNITY_WRITE_RATE_LIMIT', 6),
          ttl: configService.get<number>('COMMUNITY_WRITE_RATE_TTL_MS', 60_000),
        },
      ],
    }),
  ],
  controllers: [SubjectsController],
  providers: [SubjectsService, CommunityWriteThrottlerGuard, RolesGuard],
})
export class SubjectsModule {}
