import { of, throwError } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';
import { type KafkaProducerService } from '../../kafka/kafka-producer.service';
import type { ExecutionContext, CallHandler } from '@nestjs/common';
import type { JwtPayload } from '@gacp-erp/shared-schemas';

function makeKafkaMock(): { publish: jest.Mock } {
  return { publish: jest.fn() };
}

function makeUser(overrides: Partial<JwtPayload> = {}): JwtPayload {
  return {
    sub: '00000000-0000-0000-0000-000000000001',
    preferred_username: 'operator1',
    realm_access: { roles: ['OPERATOR'] },
    iat: 1000000,
    exp: 2000000,
    iss: 'https://keycloak.local/realms/gacp-erp',
    ...overrides,
  } as JwtPayload;
}

function makeContext(method: string, url: string, user: JwtPayload | undefined): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method,
        url,
        user,
        ip: '10.0.0.1',
        hostname: 'api-gateway',
        headers: {},
      }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;
}

function makeCallHandler(responseBody: unknown = { id: 'resp-id' }): CallHandler {
  return { handle: () => of(responseBody) };
}

function makeErrorCallHandler(error: Error): CallHandler {
  return { handle: () => throwError(() => error) };
}

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let kafka: { publish: jest.Mock };

  beforeEach(() => {
    kafka = makeKafkaMock();
    interceptor = new AuditInterceptor(kafka as unknown as KafkaProducerService);
  });

  describe('non-mutating methods (GET, OPTIONS, HEAD)', () => {
    it.each(['GET', 'OPTIONS', 'HEAD'])('skips audit for %s', (method) => {
      const ctx = makeContext(method, '/api/plants', makeUser());
      const handler = makeCallHandler();

      interceptor.intercept(ctx, handler).subscribe();

      expect(kafka.publish).not.toHaveBeenCalled();
    });
  });

  describe('mutating methods (POST, PUT, PATCH, DELETE)', () => {
    it.each(['POST', 'PUT', 'PATCH', 'DELETE'])('publishes audit event for %s', (method) => {
      const ctx = makeContext(method, '/api/plants', makeUser());
      const handler = makeCallHandler();

      interceptor.intercept(ctx, handler).subscribe();

      expect(kafka.publish).toHaveBeenCalledTimes(1);
      const [topic] = kafka.publish.mock.calls[0] as [string, string, unknown];
      expect(topic).toBe('audit.trail.v1');
    });

    it('does not publish when user is not present', () => {
      const ctx = makeContext('POST', '/api/plants', undefined);
      const handler = makeCallHandler();

      interceptor.intercept(ctx, handler).subscribe();

      expect(kafka.publish).not.toHaveBeenCalled();
    });
  });

  describe('action resolution', () => {
    it('resolves PLANT_CREATED for POST /plants', () => {
      const ctx = makeContext('POST', '/api/plants', makeUser());
      interceptor.intercept(ctx, makeCallHandler()).subscribe();

      const [, , event] = kafka.publish.mock.calls[0] as [
        string,
        string,
        { payload: { action: string } },
      ];
      expect(event.payload.action).toBe('PLANT_CREATED');
    });

    it('resolves PLANT_STAGE_CHANGED for POST /plants/:id/transition', () => {
      const ctx = makeContext('POST', '/api/plants/uuid-1/transition', makeUser());
      interceptor.intercept(ctx, makeCallHandler()).subscribe();

      const [, , event] = kafka.publish.mock.calls[0] as [
        string,
        string,
        { payload: { action: string } },
      ];
      expect(event.payload.action).toBe('PLANT_STAGE_CHANGED');
    });

    it('resolves PLANT_DESTROYED for DELETE /plants/:id', () => {
      const ctx = makeContext('DELETE', '/api/plants/uuid-1', makeUser());
      interceptor.intercept(ctx, makeCallHandler()).subscribe();

      const [, , event] = kafka.publish.mock.calls[0] as [
        string,
        string,
        { payload: { action: string } },
      ];
      expect(event.payload.action).toBe('PLANT_DESTROYED');
    });

    it('resolves BATCH_CREATED for POST /batches', () => {
      const ctx = makeContext('POST', '/api/batches', makeUser());
      interceptor.intercept(ctx, makeCallHandler()).subscribe();

      const [, , event] = kafka.publish.mock.calls[0] as [
        string,
        string,
        { payload: { action: string } },
      ];
      expect(event.payload.action).toBe('BATCH_CREATED');
    });

    it('resolves ELECTRONIC_SIGNATURE_CREATED for POST /signatures', () => {
      const ctx = makeContext('POST', '/api/signatures', makeUser());
      interceptor.intercept(ctx, makeCallHandler()).subscribe();

      const [, , event] = kafka.publish.mock.calls[0] as [
        string,
        string,
        { payload: { action: string } },
      ];
      expect(event.payload.action).toBe('ELECTRONIC_SIGNATURE_CREATED');
    });
  });

  describe('domain resolution', () => {
    it('resolves CULTIVATION domain for /plants', () => {
      const ctx = makeContext('POST', '/api/plants', makeUser());
      interceptor.intercept(ctx, makeCallHandler()).subscribe();

      const [, , event] = kafka.publish.mock.calls[0] as [
        string,
        string,
        { payload: { domain: string } },
      ];
      expect(event.payload.domain).toBe('CULTIVATION');
    });

    it('resolves QUALITY domain for /signatures', () => {
      const ctx = makeContext('POST', '/api/signatures', makeUser());
      interceptor.intercept(ctx, makeCallHandler()).subscribe();

      const [, , event] = kafka.publish.mock.calls[0] as [
        string,
        string,
        { payload: { domain: string } },
      ];
      expect(event.payload.domain).toBe('QUALITY');
    });
  });

  describe('on error', () => {
    it('still publishes audit event on request error', () => {
      const ctx = makeContext('POST', '/api/plants', makeUser());
      const handler = makeErrorCallHandler(new Error('DB failure'));

      interceptor.intercept(ctx, handler).subscribe({
        error: () => {
          /* expected */
        },
      });

      expect(kafka.publish).toHaveBeenCalledTimes(1);
    });
  });

  describe('entity ID extraction', () => {
    it('extracts UUID from URL path', () => {
      const uuid = '12345678-1234-1234-1234-123456789012';
      const ctx = makeContext('PUT', `/api/plants/${uuid}`, makeUser());
      interceptor.intercept(ctx, makeCallHandler()).subscribe();

      const [, , event] = kafka.publish.mock.calls[0] as [
        string,
        string,
        { payload: { entityId: string } },
      ];
      expect(event.payload.entityId).toBe(uuid);
    });

    it('extracts ID from response body for POST without UUID in URL', () => {
      const ctx = makeContext('POST', '/api/plants', makeUser());
      interceptor.intercept(ctx, makeCallHandler({ id: 'new-plant-id' })).subscribe();

      const [, , event] = kafka.publish.mock.calls[0] as [
        string,
        string,
        { payload: { entityId: string } },
      ];
      expect(event.payload.entityId).toBe('new-plant-id');
    });
  });

  describe('audit event structure', () => {
    it('includes required ALCOA+ fields', () => {
      const ctx = makeContext('POST', '/api/plants', makeUser());
      interceptor.intercept(ctx, makeCallHandler()).subscribe();

      const [, , event] = kafka.publish.mock.calls[0] as [
        string,
        string,
        { payload: Record<string, unknown> },
      ];
      const p = event.payload;
      expect(p.userId).toBeDefined();
      expect(p.userRole).toBeDefined();
      expect(p.ipAddress).toBe('10.0.0.1');
      expect(p.workstationId).toBe('api-gateway');
      expect(p.eventTimestamp).toBeDefined();
      expect(p.retentionClass).toBe('7_YEAR');
      expect(p.sequenceNumber).toBeGreaterThan(0);
    });
  });
});
