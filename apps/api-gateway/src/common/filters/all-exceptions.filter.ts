import {
  Catch,
  type ExceptionFilter,
  type ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';
import { ZodError } from 'zod';

interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    status: number;
    details?: unknown;
    timestamp: string;
    path: string;
  };
}

/**
 * Catches ALL exceptions.
 * - HttpException → maps status code + message
 * - ZodError → 422 Unprocessable Entity with field details
 * - Unknown errors → 500 Internal Server Error
 *
 * Returns a standardised ApiErrorSchema-compatible JSON body.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<{ url: string }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'string') {
        message = response;
        code = this.statusToCode(status);
      } else if (typeof response === 'object' && response !== null) {
        const r = response as Record<string, unknown>;
        message = (r['message'] as string | undefined) ?? message;
        code = (r['code'] as string | undefined) ?? this.statusToCode(status);
        details = r['details'];
      }
    } else if (exception instanceof ZodError) {
      status = HttpStatus.UNPROCESSABLE_ENTITY;
      code = 'VALIDATION_ERROR';
      message = 'Payload validation failed';
      details = exception.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
    } else {
      this.logger.error('Unhandled exception', exception as Error);
    }

    const body: ApiErrorBody = {
      success: false,
      error: {
        code,
        message,
        status,
        details,
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    };

    void reply.status(status).send(body);
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return map[status] ?? 'HTTP_ERROR';
  }
}
