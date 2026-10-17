import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AvatarService } from './avatar.service';
import { RankingModule } from '../ranking/ranking.module';
import { ProfileCustomizationController } from './profile-customization.controller';
import { ProfileCustomizationService } from './profile-customization.service';
import { ProfilesController } from './profiles.controller';
import { PublicProfileService } from './public-profile.service';

@Module({
  imports: [RankingModule],
  controllers: [
    UsersController,
    ProfileCustomizationController,
    ProfilesController,
  ],
  providers: [
    UsersService,
    AvatarService,
    ProfileCustomizationService,
    PublicProfileService,
  ],
  exports: [UsersService],
})
export class UsersModule {}
