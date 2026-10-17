import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { IdentityModule } from './modules/identity/identity.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { NegotiationsModule } from './modules/negotiations/negotiations.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, HealthModule, IdentityModule, MarketplaceModule, NegotiationsModule],
})
export class AppModule {}
