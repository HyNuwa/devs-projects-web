import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: number;
  email: string;
  role: string;
}

const cookieExtractor = (req: Request): string | null => {
  if (req?.cookies?.access_token) {
    return req.cookies.access_token as string;
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        cookieExtractor,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(
        'jwt.secret',
        'dev-secret-change-me',
      ),
    });
  }

  async validate(payload: JwtPayload) {
    if (!Number.isSafeInteger(payload.sub) || payload.sub < 1)
      throw new UnauthorizedException();
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isBanned: true,
        bannedUntil: true,
        mutedUntil: true,
      },
    });
    if (
      !user ||
      (user.isBanned && (!user.bannedUntil || user.bannedUntil > new Date()))
    )
      throw new UnauthorizedException('Sesión no válida');
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      mutedUntil: user.mutedUntil,
    };
  }
}
