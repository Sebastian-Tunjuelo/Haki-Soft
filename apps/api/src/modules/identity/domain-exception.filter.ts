import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { DomainError } from './domain-error';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<{
      status(code: number): { json(body: unknown): void };
    }>();
    response.status(exception.status).json({ code: exception.code });
  }
}
