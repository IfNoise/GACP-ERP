import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
  Logger,
} from '@nestjs/common';
import { type Observable, tap } from 'rxjs';
import { randomUUID } from 'crypto';
import {
  type JwtPayload,
  type SystemRole,
  type AuditAction,
  type UserId,
} from '@gacp-erp/shared-schemas';
import { AUDIT_TOPIC, type AuditTrailEntryEvent } from '@gacp-erp/shared-events';
import { KafkaProducerService } from '../../kafka/kafka-producer.service';

// UUID pattern — used to extract entity IDs from URL segments
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

const VALID_ROLES: SystemRole[] = [
  'SUPER_ADMIN',
  'QUALITY_MANAGER',
  'CULTIVATION_MANAGER',
  'OPERATOR',
  'AUDITOR',
  'READONLY',
];

function resolveRole(roles: string[]): SystemRole {
  for (const r of roles) {
    if (VALID_ROLES.includes(r as SystemRole)) return r as SystemRole;
  }
  return 'READONLY';
}

function resolveAction(method: string, url: string): AuditAction {
  const lower = url.toLowerCase();
  if (lower.includes('/auth/login')) return 'USER_LOGIN';
  if (lower.includes('/auth/logout')) return 'USER_LOGOUT';
  if (lower.includes('/signatures')) return 'ELECTRONIC_SIGNATURE_CREATED';
  if (lower.includes('/plants') && lower.includes('/transition')) return 'PLANT_STAGE_CHANGED';
  if (lower.includes('/plants') && method === 'DELETE') return 'PLANT_DESTROYED';
  if (lower.includes('/plants') && method === 'POST') return 'PLANT_CREATED';
  if (lower.includes('/plants')) return 'PLANT_STAGE_CHANGED';
  if (lower.includes('/batches') && lower.includes('/status')) return 'BATCH_STATUS_CHANGED';
  if (lower.includes('/batches') && method === 'POST') return 'BATCH_CREATED';
  if (lower.includes('/batches')) return 'BATCH_STATUS_CHANGED';
  return 'DATA_EXPORT';
}

function resolveDomain(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('/auth')) return 'AUTH';
  if (lower.includes('/signatures')) return 'QUALITY';
  if (lower.includes('/plants') || lower.includes('/batches')) return 'CULTIVATION';
  return 'SYSTEM';
}

function resolveEntityType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes('/plants')) return 'plant';
  if (lower.includes('/batches')) return 'batch';
  if (lower.includes('/signatures')) return 'signature';
  if (lower.includes('/users')) return 'user';
  return 'unknown';
}

function resolveEntityId(url: string, responseBody: unknown): string {
  // First try to extract UUID from URL
  const match = UUID_PATTERN.exec(url);
  if (match) return match[0];
  // For POST (create), try to get id from response
  if (responseBody !== null && typeof responseBody === 'object' && 'id' in responseBody) {
    const id = (responseBody as Record<string, unknown>).id;
    if (typeof id === 'string') return id;
  }
  return randomUUID();
}

/**
 * Intercepts mutating HTTP requests (POST/PUT/PATCH/DELETE) and publishes
 * an audit entry to the `audit.trail.v1` Kafka topic, consumed by the
 * Go audit-consumer which writes to ImmuDB for tamper-proof storage.
 *
 * Kafka publishing is fire-and-forget — failures are logged but never
 * block the HTTP response.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);
  private readonly MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  // Simple monotonic counter — good enough for IPC-level ordering within one process
  private sequenceCounter = 0;

  constructor(private readonly kafkaProducer: KafkaProducerService) {}

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
        next: (responseBody: unknown) => {
          if (user) {
            this.publishAuditEntry(request, user, startedAt, responseBody);
          }
        },
        error: () => {
          if (user) {
            this.publishAuditEntry(request, user, startedAt, null);
          }
        },
      }),
    );
  }

  private publishAuditEntry(
    request: {
      method: string;
      url: string;
      ip: string;
      hostname: string;
      headers: Record<string, string>;
    },
    user: JwtPayload,
    occurredAt: Date,
    responseBody: unknown,
  ): void {
    const auditEventId = randomUUID();
    const entityId = resolveEntityId(request.url, responseBody);

    const event: AuditTrailEntryEvent = {
      eventId: randomUUID(),
      occurredAt: occurredAt.toISOString(),
      eventVersion: '1.0',
      producerService: 'api-gateway',
      topic: AUDIT_TOPIC,
      correlationId: randomUUID(),
      triggeredBy: user.sub as UserId,
      eventType: 'AUDIT_TRAIL_ENTRY',
      payload: {
        auditEventId,
        userId: user.sub as UserId,
        userRole: resolveRole(user.realm_access?.roles ?? []),
        userName: user.name ?? user.preferred_username,
        workstationId: request.hostname || 'api-gateway',
        ipAddress: request.ip || '0.0.0.0',
        sessionId: user.jti ?? randomUUID(),
        action: resolveAction(request.method, request.url),
        description: `${request.method} ${request.url}`,
        domain: resolveDomain(request.url),
        entityType: resolveEntityType(request.url),
        entityId,
        eventTimestamp: occurredAt.toISOString(),
        serverReceivedAt: new Date().toISOString(),
        beforeStateHash: null,
        afterStateHash: null,
        changedFields: null,
        isCriticalAction: false,
        electronicSignatureId: null,
        retentionClass: '7_YEAR',
        sequenceNumber: ++this.sequenceCounter,
      },
    };

    this.kafkaProducer.publish(AUDIT_TOPIC, auditEventId, event);
    this.logger.debug(`AUDIT: ${request.method} ${request.url} by ${user.preferred_username}`);
  }
}
