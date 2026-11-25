import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { fail } from './api-response';

type ErrorReply = { status: number; code: string; message: string; details?: string[] };

/** MySQL errors that are the caller's fault, not a server bug. */
const DB_ERRORS: Record<string, Omit<ErrorReply, 'details'>> = {
  ER_DUP_ENTRY: { status: 409, code: 'CONFLICT', message: 'A record with the same unique value already exists' },
  ER_DATA_TOO_LONG: { status: 400, code: 'INVALID_VALUE', message: 'A value is too long for its field' },
  ER_WARN_DATA_OUT_OF_RANGE: { status: 400, code: 'INVALID_VALUE', message: 'A number is out of range' },
  ER_TRUNCATED_WRONG_VALUE: { status: 400, code: 'INVALID_VALUE', message: 'A value has the wrong format' },
  ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: { status: 400, code: 'INVALID_VALUE', message: 'A value has the wrong format' },
  ER_LOCK_DEADLOCK: { status: 409, code: 'CONCURRENT_UPDATE', message: 'The record was being changed at the same time; please retry' },
  ER_LOCK_WAIT_TIMEOUT: { status: 409, code: 'CONCURRENT_UPDATE', message: 'The record was being changed at the same time; please retry' },
};

/**
 * Every error leaves the service as
 * `{ success: false, error: { code, message, details? } }`.
 *
 * Codes: VALIDATION_ERROR, BAD_REQUEST, NOT_FOUND, CONFLICT, CONCURRENT_UPDATE,
 * INVALID_VALUE, INTERNAL_ERROR. Unexpected errors are logged with their stack trace.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ApiExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const reply = this.toReply(exception);
    const response = host.switchToHttp().getResponse<Response>();
    response.status(reply.status).json(fail(reply.code, reply.message, reply.details));
  }

  toReply(exception: unknown): ErrorReply {
    if (exception instanceof HttpException) return this.fromHttpException(exception);

    const err = exception as { name?: string; code?: string; driverError?: { code?: string } };
    const dbCode = err?.driverError?.code ?? err?.code;
    if (dbCode && DB_ERRORS[dbCode]) {
      this.logger.warn(`${dbCode}: ${(exception as Error).message}`);
      return DB_ERRORS[dbCode];
    }
    if (err?.name === 'EntityNotFoundError') {
      return { status: 404, code: 'NOT_FOUND', message: 'Record not found' };
    }

    this.logger.error(
      exception instanceof Error ? exception.stack ?? exception.message : String(exception),
    );
    return { status: 500, code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' };
  }

  private fromHttpException(exception: HttpException): ErrorReply {
    const status = exception.getStatus();
    const reply: ErrorReply = {
      status,
      code: HttpStatus[status] ?? 'HTTP_ERROR', // e.g. BAD_REQUEST, NOT_FOUND
      message: exception.message,
    };

    const body = exception.getResponse();
    if (typeof body === 'object' && body !== null) {
      const b = body as { message?: unknown; details?: unknown };
      if (Array.isArray(b.message)) {
        // class-validator errors
        reply.code = 'VALIDATION_ERROR';
        reply.message = 'Validation failed';
        reply.details = b.message.map(String);
      } else if (typeof b.message === 'string') {
        reply.message = b.message;
      }
      // e.g. "Fill these first" + list of missing fields
      if (Array.isArray(b.details)) reply.details = b.details.map(String);
    }
    return reply;
  }
}
