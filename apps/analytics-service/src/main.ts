import 'reflect-metadata';
import { initTelemetry } from '@gacp-erp/shared-config';

initTelemetry({ serviceName: 'analytics-service' });

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('internal');
  app.enableVersioning();

  const port = parseInt(process.env['PORT'] ?? '3006', 10);
  await app.listen(port, '0.0.0.0');
  app.get(Logger).log(`Analytics Service running on port ${port}`);
}

void bootstrap();
