import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { appConfig } from './config/app.config';
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
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
            customLogLevel: (_req: any, res: any, _err?: any) => {
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
