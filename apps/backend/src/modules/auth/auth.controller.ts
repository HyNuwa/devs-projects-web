import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserResponseDto } from './dto/auth-response.dto';
import {
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth-actions.dto';
import { Public } from '../../common/decorators/public.decorator';

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutos
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 días

function getRefreshTokenFromCookies(
  req: Request & { cookies?: Record<string, string> },
): string | undefined {
  return req.cookies?.refresh_token;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: ACCESS_TOKEN_MAX_AGE,
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: REFRESH_TOKEN_MAX_AGE,
      path: '/api/v1/auth/refresh',
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/v1/auth/refresh' });
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
  })
  @ApiResponse({ status: 409, description: 'Username o email ya existe' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } =
      await this.authService.register(dto);

    this.setAuthCookies(res, accessToken, refreshToken);

    return { user };
  }

  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(
    @Body() _dto: LoginDto,
    @Request() req: { user: UserResponseDto },
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken, user } = await this.authService.login(
      req.user,
    );

    this.setAuthCookies(res, accessToken, refreshToken);

    return { user };
  }

  @Public()
  @Post('verify-email')
  @ApiOperation({ summary: 'Verificar email con token' })
  @ApiResponse({ status: 200, description: 'Email verificado' })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Solicitar recuperación de contraseña' })
  @ApiResponse({ status: 200, description: 'Solicitud procesada' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Restablecer contraseña con token' })
  @ApiResponse({ status: 200, description: 'Contraseña actualizada' })
  @ApiResponse({ status: 400, description: 'Token inválido o expirado' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refrescar access token' })
  @ApiResponse({ status: 200, description: 'Tokens renovados' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refresh(
    @Request() req: Request & { cookies?: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = getRefreshTokenFromCookies(req);

    if (!refreshToken) {
      return { statusCode: 401, message: 'Refresh token no encontrado' };
    }

    const {
      accessToken,
      refreshToken: newRefreshToken,
      user,
    } = await this.authService.refreshTokens(refreshToken);

    this.setAuthCookies(res, accessToken, newRefreshToken);

    return { user };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Perfil del usuario',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'No autenticado' })
  async getProfile(@Request() req: { user: { id: string } }) {
    return this.authService.getProfile(req.user.id);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada' })
  async logout(
    @Request()
    req: Request & { user: { id: string }; cookies?: Record<string, string> },
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = getRefreshTokenFromCookies(req);

    if (refreshToken) {
      await this.authService.logout(req.user.id, refreshToken);
    }

    this.clearAuthCookies(res);

    return { message: 'Sesión cerrada exitosamente' };
  }
}
