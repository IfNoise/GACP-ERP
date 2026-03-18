import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new Logger('FinancialService');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: process.env['NODE_ENV'] !== 'production' }),
  );

  app.setGlobalPrefix('internal');

  const port = parseInt(process.env['PORT'] ?? '3004', 10);
  await app.listen(port, '0.0.0.0');
  logger.log(`💰 Financial Service running on port ${port}`);
}

void bootstrap();
