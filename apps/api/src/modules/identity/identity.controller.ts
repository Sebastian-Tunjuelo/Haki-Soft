import { Controller, Get, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { IdentityService } from './identity.service';
import { SessionAuthGuard, type AuthenticatedRequest } from './session-auth.guard';

@Controller('me')
@UseGuards(SessionAuthGuard)
export class MeController {
  constructor(@Inject(IdentityService) private readonly identity: IdentityService) {}

  @Get('mode')
  readMode(@Req() request: AuthenticatedRequest) {
    return this.identity.readMode(request.userId!);
  }

  @Post('mode')
  switchMode(@Req() request: AuthenticatedRequest & { body?: unknown }) {
    return this.identity.switchMode(request.userId!, request.body);
  }
}
