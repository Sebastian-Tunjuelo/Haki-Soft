import { Body, Controller, Get, Inject, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SessionAuthGuard, type AuthenticatedRequest } from './session-auth.guard';
import { WalletService } from './wallet.service';

@Controller('me/wallet')
@UseGuards(SessionAuthGuard)
export class WalletController {
  constructor(@Inject(WalletService) private readonly wallets: WalletService) {}

  @Post('discovery')
  discover(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    return this.wallets.discover(request.userId!, body);
  }

  @Post('challenges')
  startChallenge(@Req() request: AuthenticatedRequest, @Body() body: unknown) {
    return this.wallets.startChallenge(request.userId!, body);
  }

  @Get()
  readActive(@Req() request: AuthenticatedRequest) {
    return this.wallets.readActive(request.userId!);
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
