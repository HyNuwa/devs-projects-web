import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AvatarService } from './avatar.service';
import { RankingModule } from '../ranking/ranking.module';

@Module({
  imports: [RankingModule],
  controllers: [UsersController],
  providers: [UsersService, AvatarService],
  exports: [UsersService],
})
export class UsersModule {}
