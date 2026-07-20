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
  statusCode?: number;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorBody = {
      statusCode: status,
      message: this.extractMessage(status, exceptionResponse),
      error: this.extractError(status, exceptionResponse),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} ${status}`,
        exception.stack,
      );
    }

    response.status(status).json(errorBody);
  }

  private extractMessage(
    status: number,
    exceptionResponse: string | object,
  ): string | string[] {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }
    const res = exceptionResponse as ExceptionResponse;
    if (res.message !== undefined) {
      return res.message;
    }
    return HttpStatus[status] || 'Internal Server Error';
  }

  private extractError(
    status: number,
    exceptionResponse: string | object,
  ): string {
    if (typeof exceptionResponse === 'object') {
      const res = exceptionResponse as ExceptionResponse;
      if (typeof res.error === 'string') {
        return res.error;
      }
    }
    return HttpStatus[status] || 'Internal Server Error';
  }
}
