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
  code?: string;
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
      ...this.extractCodedDetails(exceptionResponse),
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

  /**
   * Refusals thrown with a machine-readable `code` (e.g. DUPLICATE_MATERIAL)
   * keep it and their details so the client can react to them.
   */
  private extractCodedDetails(
    exceptionResponse: string | object,
  ): Record<string, unknown> {
    if (typeof exceptionResponse !== 'object') return {};
    const { code, ...details } = exceptionResponse as ExceptionResponse &
      Record<string, unknown>;
    if (typeof code !== 'string') return {};
    return { ...details, code };
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
