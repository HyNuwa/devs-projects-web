import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { DiscoveryModule } from './modules/discovery/discovery.module';
import { GuidesModule } from './modules/guides/guides.module';
import { InstitutionsModule } from './modules/institutions/institutions.module';
import { MailModule } from './modules/mail/mail.module';
import { MaterialsModule } from './modules/materials/materials.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { ProfessorsModule } from './modules/professors/professors.module';
import { RateLimitModule } from './modules/rate-limit/rate-limit.module';
import { RankingModule } from './modules/ranking/ranking.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { CorrectionsModule } from './modules/corrections/corrections.module';
import { TrustModule } from './modules/trust/trust.module';
import { UsersModule } from './modules/users/users.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { appConfig } from './config/app.config';
import { jwtConfig } from './config/jwt.config';
import { mailConfig } from './config/mail.config';
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, mailConfig],
      validate,
      envFilePath: '.env',
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isProduction =
          configService.get<string>('app.nodeEnv', 'development') ===
          'production';

        return {
          pinoHttp: {
            level: isProduction ? 'info' : 'debug',
            autoLogging: true,
            customLogLevel: (_req: any, res: any) => {
              if (res.statusCode >= 500) return 'error';
              if (res.statusCode >= 400) return 'warn';
              return 'info';
            },
            customSuccessMessage: (req: any, res: any) =>
              `${req.method} ${req.url} ${res.statusCode}`,
            customErrorMessage: (req: any, res: any, err: any) =>
              `${req.method} ${req.url} ${res.statusCode} - ${err.message}`,
            redact: ['req.headers.authorization', 'req.headers.cookie'],
            quietReqLogger: true,
            transport: isProduction
              ? undefined
              : {
                  target: 'pino-pretty',
                  options: {
                    colorize: true,
                    translateTime: 'SYS:HH:MM:ss',
                    ignore: 'pid,hostname',
                  },
                },
          },
        };
      },
    }),
    PrismaModule,
    AuthModule,
    AdminModule,
    DiscoveryModule,
    GuidesModule,
    InstitutionsModule,
    CatalogModule,
    MailModule,
    MaterialsModule,
    ModerationModule,
    ProfessorsModule,
    RateLimitModule,
    RankingModule,
    SubjectsModule,
    SubmissionsModule,
    TrustModule,
    CorrectionsModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
