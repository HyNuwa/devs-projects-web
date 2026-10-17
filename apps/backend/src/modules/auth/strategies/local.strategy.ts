import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { LoginAttempts } from '../../rate-limit/login-attempts';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private loginAttempts: LoginAttempts,
  ) {
    super({ usernameField: 'email', passReqToCallback: true });
  }

  async validate(req: { ip?: string }, email: string, password: string) {
    let user: Awaited<ReturnType<AuthService['validateUser']>>;
    try {
      user = await this.authService.validateUser(email, password);
    } catch (error) {
      // Suspended: the password was correct, so it is not a failed guess.
      if (error instanceof ForbiddenException) {
        await this.loginAttempts.forgive(email, req.ip);
      }
      throw error;
    }

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.loginAttempts.forgive(email, req.ip);
    return user;
  }
}
