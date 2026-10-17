import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { clerkMiddleware } from '@clerk/express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function loadLocalEnv(): void {
  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), 'apps/api/.env'),
    resolve(process.cwd(), '../.env'),
    resolve(process.cwd(), '../../.env'),
  ];
  for (const file of candidates) {
    if (!existsSync(file)) continue;
    try {
      process.loadEnvFile(file);
    } catch {
      // Un .env ilegible no debe tumbar el arranque: siguen las variables del proceso.
    }
  }
}

async function bootstrap(): Promise<void> {
  loadLocalEnv();
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix('api/v1');
  if (process.env.CLERK_SECRET_KEY) {
    app.use(clerkMiddleware());
  }
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}

void bootstrap();
