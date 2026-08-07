import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private configService: ConfigService) {
    const isProduction =
      this.configService.get<string>('app.nodeEnv', 'development') ===
      'production';

    if (isProduction) {
      this.transporter = nodemailer.createTransport({
        host: this.configService.get<string>('mail.smtpHost'),
        port: this.configService.get<number>('mail.smtpPort', 587),
        secure: false,
        auth: {
          user: this.configService.get<string>('mail.smtpUser'),
          pass: this.configService.get<string>('mail.smtpPass'),
        },
      });
    }
  }

  private get frontendUrl(): string {
    return this.configService.get<string>(
      'app.frontendUrl',
      'http://localhost:3000',
    );
  }

  private async send(to: string, subject: string, html: string) {
    const isProduction =
      this.configService.get<string>('app.nodeEnv', 'development') ===
      'production';

    const from = this.configService.get<string>(
      'mail.fromEmail',
      'noreply@devsproject.local',
    );

    if (!isProduction) {
      this.logger.log('====================================');
      this.logger.log(`📧 Email to: ${to}`);
      this.logger.log(`Subject: ${subject}`);
      this.logger.log(`From: ${from}`);
      this.logger.log(html);
      this.logger.log('====================================');
      return;
    }

    if (!this.transporter) {
      throw new Error('Mail transporter not configured');
    }

    await this.transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
  }

  async sendVerificationEmail(to: string, username: string, token: string) {
    const link = `${this.frontendUrl}/auth/verify-email?token=${token}`;

    await this.send(
      to,
      'Verifica tu cuenta en DEVs Project',
      `
        <h1>Bienvenido a DEVs Project, ${username}</h1>
        <p>Hacé clic en el siguiente enlace para verificar tu cuenta:</p>
        <p><a href="${link}">${link}</a></p>
        <p>Si no creaste esta cuenta, ignorá este mensaje.</p>
      `,
    );
  }

  async sendPasswordResetEmail(to: string, username: string, token: string) {
    const link = `${this.frontendUrl}/auth/reset-password?token=${token}`;

    await this.send(
      to,
      'Recuperación de contraseña - DEVs Project',
      `
        <h1>Hola, ${username}</h1>
        <p>Hacé clic en el siguiente enlace para restablecer tu contraseña:</p>
        <p><a href="${link}">${link}</a></p>
        <p>Este enlace expira en 1 hora. Si no solicitaste el cambio, ignorá este mensaje.</p>
      `,
    );
  }
}
