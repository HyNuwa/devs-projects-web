import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CommunityWriteThrottlerGuard } from '../../common/guards/community-write-throttler.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CommunityModerationController } from './community-moderation.controller';
import { CommunityModerationService } from './community-moderation.service';
import { SubjectsController } from './subjects.controller';
import { SubjectsService } from './subjects.service';
import { RankingModule } from '../ranking/ranking.module';

@Module({
  imports: [
    RankingModule,
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
  controllers: [CommunityModerationController, SubjectsController],
  providers: [
    SubjectsService,
    CommunityModerationService,
    CommunityWriteThrottlerGuard,
    RolesGuard,
  ],
})
export class SubjectsModule {}
