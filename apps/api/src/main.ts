import 'reflect-metadata';
import { clerkMiddleware } from '@clerk/express';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.setGlobalPrefix('api/v1');
  if (process.env.CLERK_SECRET_KEY) {
    app.use(clerkMiddleware());
  }
  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}

void bootstrap();
