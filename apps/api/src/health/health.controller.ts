import { Controller, Get } from '@nestjs/common';
import { splitSingleBlockEscrow } from '@taskstream/shared-schemas';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  getHealth(): {
    status: 'ok';
    service: 'taskstream-api';
    databaseConfigured: boolean;
    sampleSplit: { totalAmountUSDInCents: number; freelancerPayoutUSDInCents: number; platformFeeUSDInCents: number };
  } {
    const totalAmountUSDInCents = 10_000;
    const split = splitSingleBlockEscrow(totalAmountUSDInCents);
    return {
      status: 'ok',
      service: 'taskstream-api',
      databaseConfigured: this.prisma.client !== null,
      sampleSplit: { totalAmountUSDInCents, ...split },
    };
  }
}
