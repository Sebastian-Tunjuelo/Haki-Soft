import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { getAuth } from '@clerk/express';
import { DomainError } from './domain-error';

interface AuthenticatedRequest {
  clerkUserId?: string;
}

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    let userId: string | null = null;
    try {
      userId = getAuth(request as never).userId ?? null;
    } catch {
      userId = null;
    }
    if (!userId) {
      throw new DomainError(401, 'UNAUTHENTICATED');
    }
    request.clerkUserId = userId;
    return true;
  }
}
