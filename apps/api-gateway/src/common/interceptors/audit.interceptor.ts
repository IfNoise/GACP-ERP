import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
  Logger,
} from '@nestjs/common';
import { type Observable, tap } from 'rxjs';
import type { JwtPayload } from '@gacp-erp/shared-schemas';

/**
 * Intercepts mutating HTTP requests (POST/PUT/PATCH/DELETE) and
 * logs an audit entry to be consumed by the audit-consumer service via Kafka.
 *
 * Kafka publishing is fire-and-forget — failures are logged but do not
 * block the HTTP response.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);
  private readonly MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<{
      method: string;
      url: string;
      user?: JwtPayload;
      ip: string;
      hostname: string;
      headers: Record<string, string>;
    }>();

    if (!this.MUTATING_METHODS.has(request.method)) {
      return next.handle();
    }

    const startedAt = new Date();
    const user = request.user;

    return next.handle().pipe(
      tap({
        next: () => {
          if (user) {
            this.publishAuditEvent({
              userId: user.sub,
              username: user.preferred_username,
              roles: user.realm_access?.roles ?? [],
              method: request.method,
              url: request.url,
              ipAddress: request.ip,
              workstationId: request.hostname,
              occurredAt: startedAt.toISOString(),
              outcome: 'SUCCESS',
            });
          }
        },
        error: (err: unknown) => {
          if (user) {
            const statusCode = (err as { status?: number })?.status ?? 500;
            this.publishAuditEvent({
              userId: user.sub,
              username: user.preferred_username,
              roles: user.realm_access?.roles ?? [],
              method: request.method,
              url: request.url,
              ipAddress: request.ip,
              workstationId: request.hostname,
              occurredAt: startedAt.toISOString(),
              outcome: 'FAILURE',
              statusCode,
            });
          }
        },
      }),
    );
  }

  private publishAuditEvent(payload: {
    userId: string;
    username: string;
    roles: string[];
    method: string;
    url: string;
    ipAddress: string;
    workstationId: string;
    occurredAt: string;
    outcome: 'SUCCESS' | 'FAILURE';
    statusCode?: number;
  }): void {
    // TODO (EPIC 4): Wire KafkaProducer here and publish to audit.trail.v1
    this.logger.debug(
      `AUDIT: ${payload.outcome} ${payload.method} ${payload.url} by ${payload.username}`,
    );
    // Kafka publish will be added after audit-consumer bootstrap
    void payload;
  }
}
