import { Controller, Get, HttpCode, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { CLERK_WEBHOOK_VERIFIER } from './identity.tokens';
import type { ClerkWebhookVerifier } from './identity.types';
import { IdentityService } from './identity.service';

interface AuthenticatedRequest {
  clerkUserId: string;
}

@Controller('webhooks')
export class ClerkWebhookController {
  constructor(
    @Inject(CLERK_WEBHOOK_VERIFIER) private readonly verifier: ClerkWebhookVerifier,
    @Inject(IdentityService) private readonly identity: IdentityService,
  ) {}

  @Post('clerk')
  @HttpCode(200)
  receive(@Req() request: { rawBody?: Buffer; body?: unknown; headers: Record<string, unknown> }) {
    return this.verifier.verify(request).then((event) => this.identity.syncClerkEvent(event));
  }
}

@Controller('me')
@UseGuards(ClerkAuthGuard)
export class MeController {
  constructor(@Inject(IdentityService) private readonly identity: IdentityService) {}

  @Get('mode')
  readMode(@Req() request: AuthenticatedRequest) {
    return this.identity.readMode(request.clerkUserId);
  }

  @Post('mode')
  switchMode(@Req() request: AuthenticatedRequest & { body?: unknown }) {
    return this.identity.switchMode(request.clerkUserId, request.body);
  }
}
