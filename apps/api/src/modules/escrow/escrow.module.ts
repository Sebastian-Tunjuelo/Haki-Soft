import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IdentityModule } from '../identity/identity.module';
import { EscrowController } from './escrow.controller';
import { EscrowService } from './escrow.service';
import { ESCROW_PAYMENT_GATEWAY, ESCROW_REPOSITORY } from './escrow.tokens';
import { MemoryEscrowRepository } from './memory-escrow.repository';
import { PrismaEscrowRepository } from './prisma-escrow.repository';
import { EscrowPaymentService } from '../open-payments/escrow-payment.service';
import { SimulatedEscrowPaymentGateway } from './simulated-escrow-payment.gateway';
import { OrderWorkspaceService } from './order-workspace.service';
import { SellerConfirmationTimeoutJob } from './seller-confirmation-timeout.job';
import { SellerNotificationHub } from './seller-notification.hub';

@Module({
  imports: [IdentityModule],
  controllers: [EscrowController],
  providers: [
    EscrowService,
    EscrowPaymentService,
    OrderWorkspaceService,
    SellerConfirmationTimeoutJob,
    SellerNotificationHub,
    MemoryEscrowRepository,
    PrismaEscrowRepository,
    SimulatedEscrowPaymentGateway,
    {
      provide: ESCROW_REPOSITORY,
      useFactory: (prisma: PrismaService, memory: MemoryEscrowRepository, sql: PrismaEscrowRepository) =>
        prisma.client ? sql : memory,
      inject: [PrismaService, MemoryEscrowRepository, PrismaEscrowRepository],
    },
    {
      provide: ESCROW_PAYMENT_GATEWAY,
      useExisting: SimulatedEscrowPaymentGateway,
    },
  ],
  exports: [EscrowService, SellerNotificationHub],
})
export class EscrowModule {}
