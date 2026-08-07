import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AvatarService } from './avatar.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, AvatarService],
  exports: [UsersService],
})
export class UsersModule {}
