import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);

  app.useLogger(app.get(Logger));

  const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new AllExceptionsFilter(configService),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.use(helmet());
  app.use(cookieParser());

  const corsOrigin = configService.get<string>(
    'app.corsOrigin',
    'http://localhost:3000',
  );
  app.enableCors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  const nodeEnv = configService.get<string>('app.nodeEnv', 'development');
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('DEVs Project API')
      .setDescription('API del foro universitario DEVs Project')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  const port = configService.get<number>('app.port', 3001);
  await app.listen(port);

  const logger = app.get(Logger);
  logger.log(`🚀 Server running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs: http://localhost:${port}/docs`);
}
bootstrap().catch((err) => {
  console.error('Failed to bootstrap application:', err);
  process.exit(1);
});
