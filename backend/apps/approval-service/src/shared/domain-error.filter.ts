import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { DomainError } from './errors';

interface HttpResponse {
  status(code: number): HttpResponse;
  json(body: unknown): void;
}

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<HttpResponse>();
    response.status(exception.httpStatus).json({
      statusCode: exception.httpStatus,
      code: exception.code,
      message: exception.message,
    });
  }
}
