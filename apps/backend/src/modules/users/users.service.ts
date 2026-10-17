import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { excludePassword } from '../auth/exclude-password';
import { PublicProfileService } from './public-profile.service';
import { effectiveAvatarCat } from './profile-options';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private profiles: PublicProfileService,
  ) {}

  /** Another account's profile: the same projection as the perfil público. */
  publicProfile(id: string) {
    return this.profiles.byId(id);
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profileCustomization: { select: { avatarCat: true } } },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // The chosen cat lets the account menu show the chosen avatar.
    const { profileCustomization, ...account } = user;
    return {
      ...excludePassword(account),
      avatarCat: effectiveAvatarCat(
        profileCustomization?.avatarCat ?? null,
        account.maxLevel,
      ),
    };
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
