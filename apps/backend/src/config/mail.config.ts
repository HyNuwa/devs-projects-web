import { registerAs } from '@nestjs/config';

export const mailConfig = registerAs('mail', () => ({
  smtpHost: process.env.SMTP_HOST || 'localhost',
  smtpPort: parseInt(process.env.SMTP_PORT || '1025', 10),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  fromEmail: process.env.FROM_EMAIL || 'noreply@devsproject.local',
}));
