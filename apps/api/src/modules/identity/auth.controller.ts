import { Body, Controller, Get, HttpCode, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { IdentityService } from './identity.service';
import { SessionAuthGuard, type AuthenticatedRequest } from './session-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(@Inject(IdentityService) private readonly identity: IdentityService) {}

  @Post('register')
  register(@Body() body: unknown) {
    return this.identity.register(body);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() body: unknown) {
    return this.identity.login(body);
  }

  @Get('session')
  @UseGuards(SessionAuthGuard)
  session(@Req() request: AuthenticatedRequest) {
    return this.identity.readSession(request.userId!);
  }
}
