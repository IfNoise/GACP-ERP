import 'reflect-metadata';
import { initTelemetry, StructuredLogger } from '@gacp-erp/shared-config';

initTelemetry({ serviceName: 'quality-service' });

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new StructuredLogger('quality-service');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: process.env['NODE_ENV'] !== 'production' }),
    { logger },
  );

  app.setGlobalPrefix('internal');

  const port = parseInt(process.env['PORT'] ?? '3003', 10);
  await app.listen(port, '0.0.0.0');
  logger.log(`Quality Service running on port ${port}`);
}

void bootstrap();
