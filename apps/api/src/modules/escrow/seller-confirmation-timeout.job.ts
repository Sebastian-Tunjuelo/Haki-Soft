import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { EscrowService } from './escrow.service';

/**
 * Cada minuto cancela solicitudes PENDING sin aceptación del emprendedor tras 24h.
 * El dinero no se envía (CANCELLED). SPEC-09 puede sustituir esto por BullMQ.
 */
@Injectable()
export class SellerConfirmationTimeoutJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SellerConfirmationTimeoutJob.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(@Inject(EscrowService) private readonly escrow: EscrowService) {}

  onModuleInit(): void {
    void this.tick();
    this.timer = setInterval(() => void this.tick(), 60_000);
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async tick(): Promise<void> {
    try {
      const n = await this.escrow.expireStaleSellerConfirmations();
      if (n > 0) this.logger.log(`Expiraron ${n} solicitud(es) sin respuesta en 24h`);
    } catch (error) {
      this.logger.warn(`Timeout 24h falló: ${error instanceof Error ? error.message : 'unknown'}`);
    }
  }
}
