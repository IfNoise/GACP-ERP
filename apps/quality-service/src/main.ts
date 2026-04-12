import 'reflect-metadata';
import { initTelemetry } from '@gacp-erp/shared-config';

initTelemetry({ serviceName: 'quality-service' });

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Transport, type MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { Kafka } from 'kafkajs';
import { PROCUREMENT_PO_TOPIC } from '@gacp-erp/shared-events';
import { AppModule } from './app.module';

/** Ensure consumed topics exist before NestJS subscribes. */
async function ensureTopics(brokers: string[]): Promise<void> {
  const admin = new Kafka({ clientId: 'quality-service-init', brokers }).admin();
  try {
    await admin.connect();
    await admin.createTopics({
      topics: [{ topic: PROCUREMENT_PO_TOPIC, numPartitions: 3, replicationFactor: 1 }],
    });
  } finally {
    await admin.disconnect();
  }
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('internal/quality');

  const kafkaBrokers = process.env['KAFKA_BROKERS'] ?? 'localhost:9094';

  await ensureTopics([kafkaBrokers]);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'quality-service-consumer',
        brokers: [kafkaBrokers],
      },
      consumer: {
        groupId: 'quality-service-group',
      },
      subscribe: {
        fromBeginning: false,
      },
    },
  });

  await app.startAllMicroservices();

  const port = parseInt(process.env['PORT'] ?? '3003', 10);
  await app.listen(port, '0.0.0.0');
  app.get(Logger).log(`Quality Service running on port ${port} (hybrid HTTP + Kafka)`);
}

void bootstrap();
