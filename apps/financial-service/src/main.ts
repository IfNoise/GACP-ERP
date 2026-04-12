import 'reflect-metadata';
import { initTelemetry } from '@gacp-erp/shared-config';

initTelemetry({ serviceName: 'financial-service' });

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { type MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('internal');

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'financial-service-consumer',
        brokers: [process.env['KAFKA_BROKERS'] ?? 'localhost:9094'],
      },
      consumer: { groupId: 'financial-service-group' },
    },
  });

  await app.startAllMicroservices();

  const port = parseInt(process.env['PORT'] ?? '3004', 10);
  await app.listen(port, '0.0.0.0');
  app.get(Logger).log(`Financial Service running on port ${port}`);
}

void bootstrap();
