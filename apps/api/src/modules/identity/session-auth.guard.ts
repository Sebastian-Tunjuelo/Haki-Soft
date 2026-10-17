import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { DomainError } from './domain-error';
import { readSessionUserId } from './session-token';

export interface AuthenticatedRequest {
  userId?: string;
  headers: Record<string, string | undefined>;
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization ?? '';
    const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
    const userId = token ? readSessionUserId(token) : null;
    if (!userId) {
      throw new DomainError(401, 'UNAUTHENTICATED');
    }
    request.userId = userId;
    return true;
  }
}
