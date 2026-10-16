import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ClerkAuthGuard } from './clerk-auth.guard';
import { ClerkSvixWebhookVerifier } from './clerk-svix-webhook.verifier';
import { DomainExceptionFilter } from './domain-exception.filter';
import { ClerkWebhookController, MeController } from './identity.controller';
import { IdentityService } from './identity.service';
import { CLOCK, CLERK_WEBHOOK_VERIFIER, IDENTITY_REPOSITORY, WALLET_OWNERSHIP_GATEWAY } from './identity.tokens';
import { OpenPaymentsService, SdkOpenPaymentsClientFactory, OPEN_PAYMENTS_CLIENT_FACTORY } from '../open-payments/open-payments.service';
import { PrismaIdentityRepository } from './prisma-identity.repository';
import { SystemClock } from './system-clock';
import { WalletCallbackController, WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { WalletVerifiedGuard } from './wallet-verified.guard';

@Module({
  controllers: [ClerkWebhookController, MeController, WalletController, WalletCallbackController],
  providers: [
    IdentityService,
    WalletService,
    SystemClock,
    { provide: CLOCK, useExisting: SystemClock },
    ClerkSvixWebhookVerifier,
    { provide: CLERK_WEBHOOK_VERIFIER, useExisting: ClerkSvixWebhookVerifier },
    PrismaIdentityRepository,
    { provide: IDENTITY_REPOSITORY, useExisting: PrismaIdentityRepository },
    SdkOpenPaymentsClientFactory,
    { provide: OPEN_PAYMENTS_CLIENT_FACTORY, useExisting: SdkOpenPaymentsClientFactory },
    OpenPaymentsService,
    { provide: WALLET_OWNERSHIP_GATEWAY, useExisting: OpenPaymentsService },
    ClerkAuthGuard,
    WalletVerifiedGuard,
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
  exports: [ClerkAuthGuard, WalletVerifiedGuard, IDENTITY_REPOSITORY],
})
export class IdentityModule {}
