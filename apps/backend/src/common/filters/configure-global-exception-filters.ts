import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './all-exceptions.filter';
import { HttpExceptionFilter } from './http-exception.filter';

export function configureGlobalExceptionFilters(
  app: NestExpressApplication,
): void {
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());
}
