import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { AuthController } from './auth.controller';
import { DomainExceptionFilter } from './domain-exception.filter';
import { MeController } from './identity.controller';
import { IdentityService } from './identity.service';
import { CLOCK, IDENTITY_REPOSITORY, WALLET_OWNERSHIP_GATEWAY } from './identity.tokens';
import { OpenPaymentsService, SdkOpenPaymentsClientFactory, OPEN_PAYMENTS_CLIENT_FACTORY } from '../open-payments/open-payments.service';
import { PrismaIdentityRepository } from './prisma-identity.repository';
import { SessionAuthGuard } from './session-auth.guard';
import { SystemClock } from './system-clock';
import { WalletCallbackController, WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletVerifiedGuard } from './wallet-verified.guard';

@Module({
  controllers: [AuthController, MeController, WalletController, WalletCallbackController],
  providers: [
    IdentityService,
    WalletService,
    SystemClock,
    { provide: CLOCK, useExisting: SystemClock },
    PrismaIdentityRepository,
    { provide: IDENTITY_REPOSITORY, useExisting: PrismaIdentityRepository },
    SdkOpenPaymentsClientFactory,
    { provide: OPEN_PAYMENTS_CLIENT_FACTORY, useExisting: SdkOpenPaymentsClientFactory },
    OpenPaymentsService,
    { provide: WALLET_OWNERSHIP_GATEWAY, useExisting: OpenPaymentsService },
    SessionAuthGuard,
    WalletVerifiedGuard,
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
  exports: [SessionAuthGuard, WalletVerifiedGuard, IDENTITY_REPOSITORY],
})
export class IdentityModule {}
