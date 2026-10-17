import { Body, Controller, Get, Inject, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { DomainError } from './domain-error';
import { SessionAuthGuard, type AuthenticatedRequest } from './session-auth.guard';
import { WalletService } from './wallet.service';

interface RedirectResponse {
  redirect(status: number, url: string): void;
}

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

  /**
   * El AS redirige el navegador aquí. Nunca devolvemos JSON crudo:
   * siempre redirigimos al frontend con status/code.
   */
  @Get('callback')
  async complete(@Query() query: Record<string, unknown>, @Res() response: RedirectResponse): Promise<void> {
    const web = publicWebUrl();
    try {
      const result = await this.wallets.completeCallback(query);
      const target = new URL('/onboarding/wallet', web);
      target.searchParams.set('status', 'verified');
      target.searchParams.set('wallet', result.walletAddress);
      response.redirect(303, target.toString());
    } catch (error) {
      const code = error instanceof DomainError ? error.code : 'WALLET_CALLBACK_FAILED';
      const target = new URL('/onboarding/wallet', web);
      target.searchParams.set('status', 'error');
      target.searchParams.set('code', code);
      response.redirect(303, target.toString());
    }
  }
}

function publicWebUrl(): string {
  return (process.env.PUBLIC_WEB_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').replace(
    /\/$/,
    '',
  );
}
