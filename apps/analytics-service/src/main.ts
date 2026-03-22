import 'reflect-metadata';
import { initTelemetry, StructuredLogger } from '@gacp-erp/shared-config';

initTelemetry({ serviceName: 'analytics-service' });

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const logger = new StructuredLogger('analytics-service');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: process.env['NODE_ENV'] !== 'production' }),
    { logger },
  );

  app.setGlobalPrefix('internal');
  app.enableVersioning();

  const port = parseInt(process.env['PORT'] ?? '3006', 10);
  await app.listen(port, '0.0.0.0');
  logger.log(`Analytics Service running on port ${port}`);
}

void bootstrap();
