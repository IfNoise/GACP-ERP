import 'reflect-metadata';
import { initTelemetry } from '@gacp-erp/shared-config';

initTelemetry({ serviceName: 'spatial-service' });

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { AppModule } from './app.module';

const UPLOADS_DIR = join(process.cwd(), 'uploads', 'models');

async function bootstrap(): Promise<void> {
  mkdirSync(UPLOADS_DIR, { recursive: true });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  // Enable CORS for web-portal (and other allowed origins)
  const allowedOrigins = (process.env['ALLOWED_ORIGINS'] ?? 'http://localhost:3000').split(',');
  app.enableCors({ origin: allowedOrigins });

  // Register fastify plugins on the underlying instance
  await app.register(fastifyMultipart, { limits: { fileSize: 500 * 1024 * 1024 } }); // 500 MB
  await app.register(fastifyStatic, {
    root: UPLOADS_DIR,
    prefix: '/static/models/',
    decorateReply: false,
  });

  app.setGlobalPrefix('internal');

  const port = parseInt(process.env['PORT'] ?? '3007', 10);
  await app.listen(port, '0.0.0.0');
  app.get(Logger).log(`Spatial Service running on port ${port}`);
}

void bootstrap();
