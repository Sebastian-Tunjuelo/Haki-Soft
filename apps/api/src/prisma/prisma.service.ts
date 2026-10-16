import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly client: PrismaClient | null;

  constructor() {
    this.client = process.env.DATABASE_URL ? new PrismaClient() : null;
  }

  async onModuleDestroy(): Promise<void> {
    await this.client?.$disconnect();
  }
}
