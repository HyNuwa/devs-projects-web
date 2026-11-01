import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from '../common/filters/all-exceptions.filter';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';

export function configureApp(app: NestExpressApplication) {
  const config = app.get(ConfigService);
  app.setGlobalPrefix(config.get<string>('app.apiPrefix', 'api/v1'));
  // Specific filter is registered last: Nest resolves filters in reverse order.
  app.useGlobalFilters(
    new AllExceptionsFilter(config),
    new HttpExceptionFilter(),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config
      .get<string>('app.corsOrigin', 'http://localhost:3000')
      .split(',')
      .map((value) => value.trim()),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
}
