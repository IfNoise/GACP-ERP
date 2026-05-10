import 'reflect-metadata';
import { initTelemetry } from '@gacp-erp/shared-config';

initTelemetry({ serviceName: 'api-gateway' });

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyHelmet from '@fastify/helmet';
import { VersioningType } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { ZodValidationPipe } from './common/pipes/zod-validation.pipe';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { type Database, usersTable } from '@gacp-erp/shared-database';
import { eq } from 'drizzle-orm';
import { DATABASE_TOKEN } from './database/database.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);

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

  // ── Service Proxy ──────────────────────────────────────────────────────────
  // ts-rest clients send requests to http://gateway/api/{contract_path}
  // (e.g. POST /api/workforce/employees). These Fastify-level routes forward
  // them to the corresponding microservice at /internal/{contract_path}.
  const proxyRoutes: ReadonlyArray<[prefix: string, envVar: string, fallback: string]> = [
    ['workforce', 'WORKFORCE_SERVICE_URL', 'http://localhost:3005'],
    ['plants', 'CULTIVATION_SERVICE_URL', 'http://localhost:3002'],
    ['batches', 'CULTIVATION_SERVICE_URL', 'http://localhost:3002'],
    ['strains', 'CULTIVATION_SERVICE_URL', 'http://localhost:3002'],
    ['facilities', 'CULTIVATION_SERVICE_URL', 'http://localhost:3002'],
    ['rooms', 'CULTIVATION_SERVICE_URL', 'http://localhost:3002'],
    ['zones', 'CULTIVATION_SERVICE_URL', 'http://localhost:3002'],
    ['quality', 'QUALITY_SERVICE_URL', 'http://localhost:3003'],
    ['financial', 'FINANCIAL_SERVICE_URL', 'http://localhost:3004'],
    ['procurement', 'FINANCIAL_SERVICE_URL', 'http://localhost:3004'],
    ['spatial', 'SPATIAL_SERVICE_URL', 'http://localhost:3007'],
    ['buildings', 'SPATIAL_SERVICE_URL', 'http://localhost:3007'],
    ['analytics', 'ANALYTICS_SERVICE_URL', 'http://localhost:3006'],
  ];

  // In-memory cache: Zitadel sub → internal UUID
  const db = app.get<Database>(DATABASE_TOKEN);
  const subToUuid = new Map<string, string>();

  async function resolveUserId(zitadelSub: string): Promise<string> {
    const cached = subToUuid.get(zitadelSub);
    if (cached) return cached;
    const rows = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.keycloak_id, zitadelSub))
      .limit(1);
    const found = rows[0]?.id;
    if (found) {
      subToUuid.set(zitadelSub, found);
      return found;
    }
    // No mapping — return original (will fail on UUID columns but at least won't silently lose it)
    return zitadelSub;
  }

  for (const [prefix, envVar, fallback] of proxyRoutes) {
    const upstream = process.env[envVar] ?? fallback;

    const proxyHandler = async (
      request: {
        method: string;
        url: string;
        headers: Record<string, string | undefined>;
        body?: unknown;
      },
      reply: {
        status(code: number): { header(n: string, v: string): unknown; send(b: unknown): unknown };
        header(n: string, v: string): unknown;
        send(b: unknown): unknown;
      },
    ): Promise<void> => {
      // request.url is /api/workforce/employees → strip /api to get /workforce/employees
      const stripApi = request.url.replace(/^\/api/, '');
      const targetUrl = `${upstream}/internal${stripApi}`;
      try {
        const fwdHeaders: Record<string, string> = {};
        for (const h of ['authorization', 'content-type', 'traceparent'] as const) {
          const v = request.headers[h];
          if (v) fwdHeaders[h] = v;
        }

        // Extract user sub from JWT and resolve to internal UUID for downstream services
        const authHeader = request.headers['authorization'];
        if (authHeader?.startsWith('Bearer ')) {
          const parts = authHeader.slice(7).split('.');
          if (parts.length === 3) {
            try {
              const payload = JSON.parse(Buffer.from(parts[1]!, 'base64url').toString()) as {
                sub?: string;
              };
              if (payload.sub) {
                fwdHeaders['x-user-id'] = await resolveUserId(payload.sub);
              }
            } catch {
              // Malformed JWT payload — skip user ID injection
            }
          }
        }
        const ip = request.headers['x-forwarded-for'] ?? request.headers['x-real-ip'];
        if (ip) fwdHeaders['x-forwarded-for'] = ip;

        const hasBody =
          request.body != null && request.method !== 'GET' && request.method !== 'HEAD';
        if (hasBody && !fwdHeaders['content-type']) {
          fwdHeaders['content-type'] = 'application/json';
        }

        const res = await fetch(targetUrl, {
          method: request.method,
          headers: fwdHeaders,
          body: hasBody ? JSON.stringify(request.body) : undefined,
          signal: AbortSignal.timeout(30_000),
        });

        const r = reply.status(res.status);
        const ct = res.headers.get('content-type');
        if (ct) r.header('content-type', ct);
        r.send(res.status === 204 ? null : await res.text());
      } catch (err) {
        logger.error(`Proxy error → ${request.method} ${targetUrl}: ${err}`);
        reply
          .status(502)
          .header('content-type', 'application/json')
          .send(JSON.stringify({ statusCode: 502, message: 'Upstream service unavailable' }));
      }
    };

    // Register at /api/{prefix} and /api/{prefix}/* to match gateway global prefix
    for (const url of [`/api/${prefix}`, `/api/${prefix}/*`]) {
      fastify.route({
        method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const,
        url,
        handler: proxyHandler as never,
      });
    }
    logger.debug(`Proxy /api/${prefix}/* → ${upstream}/internal/${prefix}/*`);
  }

  const port = parseInt(process.env['PORT'] ?? '3001', 10);
  const host = process.env['HOST'] ?? '0.0.0.0';

  await app.listen(port, host);
  logger.log(`🚀 API Gateway listening at http://${host}:${port}/api`);
  logger.log(`Environment: ${process.env['NODE_ENV'] ?? 'development'}`);
}

void bootstrap();
