import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IdentityModule } from '../identity/identity.module';
import { IdempotencyStore } from '../marketplace/idempotency.store';
import { EscrowModule } from '../escrow/escrow.module';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { MARKETPLACE_REPOSITORY } from '../marketplace/marketplace.tokens';
import type { MarketplaceRepository } from '../marketplace/marketplace.types';
import { MemoryNegotiationsRepository } from './memory-negotiations.repository';
import { NegotiationsController } from './negotiations.controller';
import { NegotiationsService } from './negotiations.service';
import { NEGOTIATIONS_REPOSITORY } from './negotiations.tokens';
import { PrismaNegotiationsRepository } from './prisma-negotiations.repository';

@Module({
  imports: [IdentityModule, MarketplaceModule, EscrowModule],
  controllers: [NegotiationsController],
  providers: [
    NegotiationsService,
    IdempotencyStore,
    {
      provide: NEGOTIATIONS_REPOSITORY,
      useFactory: (prisma: PrismaService, marketplace: MarketplaceRepository) => {
        if (prisma.client) return new PrismaNegotiationsRepository(prisma);
        return new MemoryNegotiationsRepository(marketplace);
      },
      inject: [PrismaService, MARKETPLACE_REPOSITORY],
    },
  ],
  exports: [NegotiationsService],
})
export class NegotiationsModule {}
