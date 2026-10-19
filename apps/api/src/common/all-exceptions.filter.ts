import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ErrorResponseDto } from './error-response.dto';

// The one exception to the unified error format: /health keeps its documented
// { status, db } body so monitors and the Docker healthcheck can rely on it.
export class HealthUnavailableException extends ServiceUnavailableException {}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    if (exception instanceof HealthUnavailableException) {
      response.status(exception.getStatus()).json(exception.getResponse());
      return;
    }

    const body =
      exception instanceof HttpException
        ? this.fromHttp(exception)
        : this.unknown(exception, request);
    const payload: ErrorResponseDto = {
      ...body,
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
    };
    response.status(payload.statusCode).json(payload);
  }

  private fromHttp(
    exception: HttpException,
  ): Pick<ErrorResponseDto, 'statusCode' | 'error' | 'message'> {
    const statusCode = exception.getStatus();
    const res = exception.getResponse();
    let message: string | string[] = exception.message;
    let error = httpStatusText(statusCode) ?? 'Error';
    if (typeof res === 'string') {
      message = res;
    } else if (res && typeof res === 'object') {
      const r = res as { message?: string | string[]; error?: string };
      message = r.message ?? message;
      error = r.error ?? error;
    }
    return { statusCode, error, message };
  }

  // Details go to the server log only; the client never sees a stack or the original message.
  private unknown(
    exception: unknown,
    request: Request,
  ): Pick<ErrorResponseDto, 'statusCode' | 'error' | 'message'> {
    const stack = exception instanceof Error ? exception.stack : String(exception);
    this.logger.error(`${request.method} ${request.originalUrl} failed`, stack);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      message: 'Internal server error',
    };
  }
}

function httpStatusText(status: number): string | undefined {
  const names: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    413: 'Payload Too Large',
    415: 'Unsupported Media Type',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    503: 'Service Unavailable',
  };
  return names[status];
}
