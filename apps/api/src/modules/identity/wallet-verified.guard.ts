import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { DomainError } from './domain-error';
import { IDENTITY_REPOSITORY } from './identity.tokens';
import type { IdentityRepository } from './identity.types';

interface AuthenticatedRequest {
  userId?: string;
}

@Injectable()
export class WalletVerifiedGuard implements CanActivate {
  constructor(@Inject(IDENTITY_REPOSITORY) private readonly repository: IdentityRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.userId;
    if (!userId) {
      throw new DomainError(401, 'UNAUTHENTICATED');
    }
    const user = await this.repository.findUserById(userId);
    if (!user) {
      throw new DomainError(403, 'WALLET_NOT_VERIFIED');
    }
    const verified = await this.repository.hasVerifiedActiveWallet(user.id);
    if (!verified) {
      throw new DomainError(403, 'WALLET_NOT_VERIFIED');
    }
    return true;
  }
}
