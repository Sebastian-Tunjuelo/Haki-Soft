import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { IdempotencyStore } from './idempotency.store';
import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { MARKETPLACE_REPOSITORY } from './marketplace.tokens';
import { MemoryMarketplaceRepository } from './memory-marketplace.repository';
import { PrismaMarketplaceRepository } from './prisma-marketplace.repository';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [IdentityModule],
  controllers: [MarketplaceController],
  providers: [
    MarketplaceService,
    IdempotencyStore,
    MemoryMarketplaceRepository,
    PrismaMarketplaceRepository,
    {
      provide: MARKETPLACE_REPOSITORY,
      useFactory: (prisma: PrismaService, memory: MemoryMarketplaceRepository, sql: PrismaMarketplaceRepository) =>
        prisma.client ? sql : memory,
      inject: [PrismaService, MemoryMarketplaceRepository, PrismaMarketplaceRepository],
    },
  ],
  exports: [MarketplaceService, MARKETPLACE_REPOSITORY],
})
export class MarketplaceModule {}
