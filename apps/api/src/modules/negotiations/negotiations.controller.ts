import { Body, Controller, Get, Headers, HttpCode, Inject, Param, Post, Req, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../identity/session-auth.guard';
import { WalletVerifiedGuard } from '../identity/wallet-verified.guard';
import { NegotiationsService } from './negotiations.service';

type AuthenticatedRequest = { userId?: string };

@Controller('negotiations')
export class NegotiationsController {
  constructor(@Inject(NegotiationsService) private readonly negotiations: NegotiationsService) {}

  @Post('proposals')
  @UseGuards(SessionAuthGuard, WalletVerifiedGuard)
  createProposal(
    @Req() request: AuthenticatedRequest,
    @Body() body: unknown,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.negotiations.createProposal(request.userId!, body, idempotencyKey);
  }

  @Get('publications/:publicationId/proposals')
  @UseGuards(SessionAuthGuard)
  listInbox(@Req() request: AuthenticatedRequest, @Param('publicationId') publicationId: string) {
    return this.negotiations.listInbox(request.userId!, publicationId);
  }

  @Get('proposals/:proposalId')
  @UseGuards(SessionAuthGuard)
  getProposal(@Req() request: AuthenticatedRequest, @Param('proposalId') proposalId: string) {
    return this.negotiations.getProposal(request.userId!, proposalId);
  }

  @Post('proposals/:proposalId/messages')
  @UseGuards(SessionAuthGuard, WalletVerifiedGuard)
  sendMessage(
    @Req() request: AuthenticatedRequest,
    @Param('proposalId') proposalId: string,
    @Body() body: unknown,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.negotiations.sendMessage(request.userId!, proposalId, body, idempotencyKey);
  }

  @Post('proposals/:proposalId/accept')
  @UseGuards(SessionAuthGuard, WalletVerifiedGuard)
  acceptPath1(
    @Req() request: AuthenticatedRequest,
    @Param('proposalId') proposalId: string,
    @Body() body: unknown,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.negotiations.acceptPath1(request.userId!, proposalId, body, idempotencyKey);
  }

  @Post('proposals/:proposalId/close')
  @HttpCode(200)
  @UseGuards(SessionAuthGuard)
  closePath2(
    @Req() request: AuthenticatedRequest,
    @Param('proposalId') proposalId: string,
    @Body() body: unknown,
  ) {
    return this.negotiations.closePath2(request.userId!, proposalId, body);
  }

  @Post('gigs/:gigId/hire')
  @UseGuards(SessionAuthGuard, WalletVerifiedGuard)
  hireFixedGig(
    @Req() request: AuthenticatedRequest,
    @Param('gigId') gigId: string,
    @Body() body: unknown,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.negotiations.hireFixedGig(request.userId!, gigId, body, idempotencyKey);
  }
}
