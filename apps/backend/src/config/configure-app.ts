import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import * as cookieParserModule from 'cookie-parser';

import { configureGlobalExceptionFilters } from '../common/filters/configure-global-exception-filters';
import { configureHttpMiddleware } from './http-security';

// cookie-parser is plain CommonJS: the Nest build calls the namespace, Vite's ESM
// interop exposes it as `default` (same pattern as `sharp` in file storage).
const cookieParser =
  (cookieParserModule as unknown as { default?: typeof cookieParserModule })
    .default ?? cookieParserModule;

// BigInt columns (file sizes) serialize as strings in JSON responses.
(BigInt.prototype as unknown as { toJSON: (this: bigint) => string }).toJSON =
  function (this: bigint) {
    return this.toString();
  };

/**
 * Everything the HTTP app needs besides listening: prefix, exception filters,
 * validation, cookies and security middleware. Shared by `main.ts` and the e2e
 * tests, so tests exercise the same pipeline as production.
 */
export function configureApp(app: NestExpressApplication) {
  const configService = app.get(ConfigService);
  // Behind Nginx (TRUST_PROXY=1) `req.ip` is the client from X-Forwarded-For;
  // unset, forwarded headers are ignored so clients cannot pick their own IP.
  const trustProxy = Number(configService.get('TRUST_PROXY', 0));
  if (trustProxy > 0) app.set('trust proxy', trustProxy);
  app.setGlobalPrefix(configService.get<string>('app.apiPrefix', 'api/v1'));
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
}
