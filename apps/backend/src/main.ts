import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { configureGlobalExceptionFilters } from './common/filters/configure-global-exception-filters';
import { configureHttpMiddleware } from './config/http-security';

// Serialize BigInt as string in JSON responses (Material.fileSize is BigInt)
(BigInt.prototype as unknown as { toJSON: (this: bigint) => string }).toJSON =
  function (this: bigint) {
    return this.toString();
  };

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const configService = app.get(ConfigService);

  app.useLogger(app.get(Logger));

  const apiPrefix = configService.get<string>('app.apiPrefix', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  configureGlobalExceptionFilters(app);

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

  app.use(cookieParser());
  configureHttpMiddleware(app, {
    corsOrigin: configService.get<string>(
      'app.corsOrigin',
      'http://localhost:3000',
    ),
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
