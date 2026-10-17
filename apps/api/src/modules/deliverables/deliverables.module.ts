import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EscrowModule } from '../escrow/escrow.module';
import { IdentityModule } from '../identity/identity.module';
import { BuyerNotificationHub } from './buyer-notification.hub';
import { SellerAcceptanceHub } from './seller-acceptance.hub';
import { DeliverablesController } from './deliverables.controller';
import { DeliverablesService } from './deliverables.service';
import { DELIVERABLES_REPOSITORY } from './deliverables.tokens';
import { MemoryDeliverablesRepository } from './memory-deliverables.repository';
import { PrismaDeliverablesRepository } from './prisma-deliverables.repository';

@Module({
  imports: [IdentityModule, EscrowModule],
  controllers: [DeliverablesController],
  providers: [
    DeliverablesService,
    BuyerNotificationHub,
    SellerAcceptanceHub,
    MemoryDeliverablesRepository,
    PrismaDeliverablesRepository,
    {
      provide: DELIVERABLES_REPOSITORY,
      useFactory: (
        prisma: PrismaService,
        memory: MemoryDeliverablesRepository,
        sql: PrismaDeliverablesRepository,
      ) => (prisma.client ? sql : memory),
      inject: [PrismaService, MemoryDeliverablesRepository, PrismaDeliverablesRepository],
    },
  ],
  exports: [
    DeliverablesService,
    DELIVERABLES_REPOSITORY,
    MemoryDeliverablesRepository,
    BuyerNotificationHub,
    SellerAcceptanceHub,
  ],
})
export class DeliverablesModule {}
