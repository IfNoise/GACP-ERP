import { type Params } from 'nestjs-pino';
import { trace, context } from '@opentelemetry/api';

/**
 * Returns nestjs-pino LoggerModule options for a given service.
 *
 * Transport strategy:
 *   - dev  (NODE_ENV !== 'production'): pino-pretty to stdout
 *   - prod (NODE_ENV === 'production'): JSON to stdout (default pino)
 *   - any  (LOKI_URL env set):          pino-loki transport added in parallel
 */
export function createLoggerOptions(serviceName: string): Params {
  const isProd = process.env['NODE_ENV'] === 'production';
  const lokiUrl = process.env['LOKI_URL'];
  const level = process.env['LOG_LEVEL'] ?? (isProd ? 'info' : 'debug');

  type Target = { target: string; options?: Record<string, unknown>; level?: string };
  const targets: Target[] = [];

  if (!isProd) {
    targets.push({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss',
        ignore: 'pid,hostname,service',
        messageFormat: '[{context}] {msg}',
      },
      level,
    });
  }

  if (lokiUrl) {
    targets.push({
      target: 'pino-loki',
      options: {
        host: lokiUrl,
        labels: { service: serviceName, env: process.env['NODE_ENV'] ?? 'development' },
        batching: true,
        interval: 5,
        timeout: 10_000,
      },
      level,
    });
  }

  return {
    pinoHttp: {
      level,
      base: { service: serviceName },
      ...(targets.length > 0 && { transport: { targets } }),
      mixin() {
        const span = trace.getSpan(context.active());
        const spanCtx = span?.spanContext();
        if (!spanCtx?.traceId) return {};
        return { trace_id: spanCtx.traceId, span_id: spanCtx.spanId };
      },
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    },
  };
}
