import { type LoggerService, type LogLevel } from '@nestjs/common';
import { trace, context } from '@opentelemetry/api';

interface LogEntry {
  timestamp: string;
  level: string;
  service: string;
  context?: string;
  message: string;
  traceId?: string;
  spanId?: string;
  metadata?: unknown;
}

const LOG_LEVEL_PRIORITY: Record<string, number> = {
  error: 0,
  warn: 1,
  log: 2,
  debug: 3,
  verbose: 4,
};

/**
 * JSON structured logger with OpenTelemetry trace correlation.
 * Outputs one JSON line per log entry to stdout/stderr.
 */
export class StructuredLogger implements LoggerService {
  private readonly minLevel: number;

  constructor(
    private readonly serviceName: string,
    level: LogLevel = 'log',
  ) {
    this.minLevel = LOG_LEVEL_PRIORITY[level] ?? 2;
  }

  log(message: string, context?: string): void {
    this.write('log', message, context);
  }

  error(message: string, trace?: string, context?: string): void {
    this.write('error', message, context, trace ? { stack: trace } : undefined);
  }

  warn(message: string, context?: string): void {
    this.write('warn', message, context);
  }

  debug(message: string, context?: string): void {
    this.write('debug', message, context);
  }

  verbose(message: string, context?: string): void {
    this.write('verbose', message, context);
  }

  private write(level: string, message: string, ctx?: string, metadata?: unknown): void {
    if ((LOG_LEVEL_PRIORITY[level] ?? 2) > this.minLevel) return;

    const span = trace.getSpan(context.active());
    const spanCtx = span?.spanContext();

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      ...(ctx && { context: ctx }),
      message,
      ...(spanCtx?.traceId && { traceId: spanCtx.traceId }),
      ...(spanCtx?.spanId && { spanId: spanCtx.spanId }),
      ...(metadata !== undefined && { metadata }),
    };

    const output = JSON.stringify(entry);
    if (level === 'error') {
      process.stderr.write(output + '\n');
    } else {
      process.stdout.write(output + '\n');
    }
  }
}
