import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto } from './dto/auth-response.dto';

const SALT_ROUNDS = 12;
const REFRESH_TOKEN_BYTES = 64;
const EMAIL_VERIFICATION_TOKEN_BYTES = 32;
const PASSWORD_RESET_TOKEN_BYTES = 32;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hora
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateToken(bytes: number): string {
  return crypto.randomBytes(bytes).toString('hex');
}

function excludePassword(user: Record<string, unknown>): UserResponseDto {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe as unknown as UserResponseDto;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDto;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  private signAccessToken(user: { id: string; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }

  private async createRefreshToken(userId: string) {
    const token = generateToken(REFRESH_TOKEN_BYTES);
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  private async createTokenPair(user: {
    id: string;
    email: string;
    role: string;
  }): Promise<TokenPair> {
    const accessToken = this.signAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id);
    const fullUser = await this.prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!fullUser) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return {
      accessToken,
      refreshToken,
      user: excludePassword(fullUser),
    };
  }

  async register(dto: RegisterDto) {
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    if (existingUsername) {
      throw new ConflictException('El nombre de usuario ya está en uso');
    }

    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingEmail) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        passwordHash,
      },
    });

    const token = generateToken(EMAIL_VERIFICATION_TOKEN_BYTES);
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

    await this.prisma.emailVerification.create({
      data: {
        userId: user.id,
        email: user.email,
        token: tokenHash,
        expiresAt,
      },
    });

    this.mailService
      .sendVerificationEmail(user.email, user.username, token)
      .catch((err) => {
        this.logger.error('Error enviando email de verificación', err);
      });

    return this.createTokenPair(user);
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null;
    }

    return excludePassword(user);
  }

  async login(user: UserResponseDto) {
    return this.createTokenPair({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    return excludePassword(user);
  }

  async verifyEmail(token: string) {
    const tokenHash = hashToken(token);

    const verification = await this.prisma.emailVerification.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!verification) {
      throw new BadRequestException('Token de verificación inválido');
    }

    if (verification.expiresAt < new Date()) {
      throw new BadRequestException('Token de verificación expirado');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verification.userId },
        data: { emailVerified: true },
      }),
      this.prisma.emailVerification.delete({
        where: { id: verification.id },
      }),
    ]);

    return { message: 'Email verificado correctamente' };
  }

  async requestPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // No revelar si el email existe o no
      this.logger.log(`Solicitud de reset para email no registrado: ${email}`);
      return { message: 'Si el email existe, recibirás instrucciones' };
    }

    // Invalidar tokens anteriores del mismo usuario
    await this.prisma.passwordResetRequest.deleteMany({
      where: { userId: user.id },
    });

    const token = generateToken(PASSWORD_RESET_TOKEN_BYTES);
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

    await this.prisma.passwordResetRequest.create({
      data: {
        userId: user.id,
        token: tokenHash,
        expiresAt,
      },
    });

    this.mailService
      .sendPasswordResetEmail(user.email, user.username, token)
      .catch((err) => {
        this.logger.error('Error enviando email de reset', err);
      });

    return { message: 'Si el email existe, recibirás instrucciones' };
  }

  async resetPassword(token: string, newPassword: string) {
    const tokenHash = hashToken(token);

    const resetRequest = await this.prisma.passwordResetRequest.findUnique({
      where: { token: tokenHash },
      include: { user: true },
    });

    if (!resetRequest) {
      throw new BadRequestException('Token de recuperación inválido');
    }

    if (resetRequest.expiresAt < new Date()) {
      throw new BadRequestException('Token de recuperación expirado');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRequest.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetRequest.delete({
        where: { id: resetRequest.id },
      }),
      this.prisma.refreshToken.deleteMany({
        where: { userId: resetRequest.userId },
      }),
    ]);

    return { message: 'Contraseña actualizada correctamente' };
  }

  async refreshTokens(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (storedToken.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new UnauthorizedException('Refresh token expirado');
    }

    if (storedToken.revokedAt) {
      throw new UnauthorizedException('Refresh token revocado');
    }

    // Rotación: eliminar el usado y crear uno nuevo
    await this.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    return this.createTokenPair(storedToken.user);
  }

  async logout(userId: string, refreshToken: string) {
    const tokenHash = hashToken(refreshToken);

    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        tokenHash,
      },
    });

    return { message: 'Sesión cerrada correctamente' };
  }

  async logoutAll(userId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { message: 'Todas las sesiones cerradas correctamente' };
  }
}
