import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'dev-secret-change-me',
  expiration: parseInt(process.env.JWT_EXPIRATION || '900', 10),
}));
