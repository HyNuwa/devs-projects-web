import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Response } from 'express';
import helmet from 'helmet';
import { join } from 'path';

type HttpMiddlewareOptions = {
  corsOrigin: string;
  publicDirectory?: string;
};

function parseCorsOrigins(corsOrigin: string): string[] {
  return corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function configureHttpMiddleware(
  app: NestExpressApplication,
  {
    corsOrigin,
    publicDirectory = join(process.cwd(), 'public'),
  }: HttpMiddlewareOptions,
): void {
  app.use(helmet());
  app.enableCors({
    origin: parseCorsOrigins(corsOrigin),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  app.useStaticAssets(join(publicDirectory, 'uploads'), {
    prefix: '/uploads',
    setHeaders: (response: Response) => {
      response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });
  app.useStaticAssets(publicDirectory);
}
