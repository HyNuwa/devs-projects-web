import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ExceptionResponse {
  message?: string | string[];
  error?: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const isServerError = status >= HttpStatus.INTERNAL_SERVER_ERROR;

    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : exception,
    );

    const errorBody: Record<string, unknown> = {
      statusCode: status,
      message: isServerError
        ? 'Internal Server Error'
        : this.extractMessage(status, exceptionResponse),
      error: isServerError
        ? 'Internal Server Error'
        : this.extractError(status, exceptionResponse),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorBody);
  }

  private extractMessage(
    status: number,
    exceptionResponse: string | object | undefined,
  ): string | string[] {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }
    if (exceptionResponse && typeof exceptionResponse === 'object') {
      const response = exceptionResponse as ExceptionResponse;
      if (response.message !== undefined) {
        return response.message;
      }
    }
    return HttpStatus[status] || 'Internal Server Error';
  }

  private extractError(
    status: number,
    exceptionResponse: string | object | undefined,
  ): string {
    if (exceptionResponse && typeof exceptionResponse === 'object') {
      const response = exceptionResponse as ExceptionResponse;
      if (typeof response.error === 'string') {
        return response.error;
      }
    }
    return HttpStatus[status] || 'Internal Server Error';
  }
}
