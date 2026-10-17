import { Body, Controller, Get, Inject, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { WalletService } from './wallet.service';

interface AuthenticatedRequest {
  clerkUserId: string;
}

@Controller('me/wallet')
@UseGuards(ClerkAuthGuard)
export class WalletController {
  constructor(@Inject(WalletService) private readonly wallets: WalletService) {}

  @Post('discovery')
  discover(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    return this.wallets.discover(request.clerkUserId, body);
  }

  @Post('challenges')
  startChallenge(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    return this.wallets.startChallenge(request.clerkUserId, body);
  }

  @Get()
  readActive(@Req() request: AuthenticatedRequest) {
    return this.wallets.readActive(request.clerkUserId);
  }
}

@Controller('auth/wallet')
export class WalletCallbackController {
  constructor(@Inject(WalletService) private readonly wallets: WalletService) {}

  @Get('callback')
  complete(@Query() query: Record<string, unknown>) {
    return this.wallets.completeCallback(query);
  }
}
