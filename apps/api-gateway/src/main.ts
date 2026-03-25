import 'reflect-metadata';
import { initTelemetry, StructuredLogger } from '@gacp-erp/shared-config';

initTelemetry({ serviceName: 'api-gateway' });

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyHelmet from '@fastify/helmet';
import { VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { ZodValidationPipe } from './common/pipes/zod-validation.pipe';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const logger = new StructuredLogger('api-gateway');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: process.env['NODE_ENV'] !== 'production' }),
    { logger },
  );

  // Security headers (CSP managed separately — Helmet writes to reply.raw, not Fastify API)
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
    hsts: {
      maxAge: 31_536_000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  });

  // CSP: strict for all routes except /api/docs (which sets its own in DocsController)
  const fastify = app.getHttpAdapter().getInstance();
  const defaultCsp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "font-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  fastify.addHook(
    'onRequest',
    (
      _request: { url: string },
      reply: { header(h: string, v: string): void },
      done: () => void,
    ) => {
      if (!_request.url.startsWith('/api/docs')) {
        reply.header('content-security-policy', defaultCsp);
      }
      done();
    },
  );

  // CORS — allow web-portal origin
  app.enableCors({
    origin: process.env['WEB_PORTAL_URL'] ?? 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });

  // URI versioning (/v1/, /v2/)
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  // Global pipes & filters
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global prefix
  app.setGlobalPrefix('api');

  const port = parseInt(process.env['PORT'] ?? '3001', 10);
  const host = process.env['HOST'] ?? '0.0.0.0';

  await app.listen(port, host);
  logger.log(`🚀 API Gateway listening at http://${host}:${port}/api`);
  logger.log(`Environment: ${process.env['NODE_ENV'] ?? 'development'}`);
}

void bootstrap();
