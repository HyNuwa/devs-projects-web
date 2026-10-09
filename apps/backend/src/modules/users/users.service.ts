import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { excludePassword } from '../auth/exclude-password';
import { levelForPoints } from '../ranking/rpg-levels';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Another account's profile: only what is public. Email, sanción state and
   * activity timestamps stay with the account and moderation, and so does the
   * exact points total: a jump of 2 when a reporte is confirmed would tell the
   * retired author who reported them (README_PUNTOS_E_INSIGNIAS §8).
   */
  async publicProfile(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        points: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const { points, ...profile } = user;
    return { ...profile, level: levelForPoints(points) };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return excludePassword(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        displayName: dto.displayName,
        bio: dto.bio,
      },
    });

    return excludePassword(user);
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    return excludePassword(user);
  }
}
