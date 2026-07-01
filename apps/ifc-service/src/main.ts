import 'reflect-metadata';
import { initTelemetry } from '@gacp-erp/shared-config';

initTelemetry({ serviceName: 'ifc-service' });

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Transport, type MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app/app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.enableVersioning();
  app.setGlobalPrefix('api');

  const kafkaBrokers = process.env['KAFKA_BROKERS'] ?? 'localhost:9094';

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'ifc-service-consumer',
        brokers: [kafkaBrokers],
      },
      consumer: {
        groupId: 'ifc-service-group',
      },
      subscribe: {
        fromBeginning: false,
      },
    },
  });

  await app.startAllMicroservices();

  const port = parseInt(process.env['PORT'] ?? '3008', 10);
  await app.listen(port, '0.0.0.0');
  app.get(Logger).log(`IFC Service running on port ${port} (hybrid HTTP + Kafka)`);
}

bootstrap().catch((err: unknown) => {
  console.error('Failed to start IFC Service', err);
  process.exit(1);
});
