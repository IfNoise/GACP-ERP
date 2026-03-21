import {
  // result helpers
  ok,
  err,
  isOk,
  isErr,
  unwrap,
  DomainError,
  ApiErrorSchema,
  ApiResponseSchema,
  PaginatedResponseSchema,
  // common
  PaginationQuerySchema,
  OutboxEventSchema,
  GxpValidationFieldsSchema,
  brandedUuid,
  computeObjectHash,
  // financial
  JournalEntrySchema,
  AccountSchema,
  BiologicalAssetSchema,
  CreateAccountSchema,
  // procurement
  PurchaseOrderSchema,
  CreatePurchaseOrderSchema,
  SupplierSchema,
  // spatial
  ZoneSchema,
  CreateZoneSchema,
  // workforce
  EmployeeSchema,
  CreateEmployeeSchema,
  TaskSchema,
  CreateTaskSchema,
  TimeEntrySchema,
  CreateTimeEntrySchema,
  // training
  CourseSchema,
  TrainingExecutionSchema,
  CertificationSchema,
  // iot
  SensorReadingSchema,
  SensorSchema,
  AlertThresholdSchema,
  // quality
  DeviationSchema,
  CAPASchema,
  ChangeControlSchema,
  QualityEventSchema,
  ValidationProtocolSchema,
  // analytics
  AuditReadinessResultSchema,
  WorkforceSummaryResultSchema,
  // integrations
  MayanDocumentSchema,
  // auth
  LoginRequestSchema,
  JwtPayloadSchema,
  // audit
  AuditEventSchema,
  validateAlcoa,
  validateAuditEventInput,
} from '../index';

import { z } from 'zod';

// ─── result.schema.ts ──────────────────────────────────────────────────────────

describe('Result pattern', () => {
  it('ok() creates success result', () => {
    const r = ok(42);
    expect(r.success).toBe(true);
    expect((r as { data: number }).data).toBe(42);
  });

  it('err() creates failure result', () => {
    const r = err(new Error('fail'));
    expect(r.success).toBe(false);
    expect((r as { error: Error }).error.message).toBe('fail');
  });

  it('isOk/isErr narrows', () => {
    expect(isOk(ok('v'))).toBe(true);
    expect(isOk(err('e'))).toBe(false);
    expect(isErr(err('e'))).toBe(true);
    expect(isErr(ok('v'))).toBe(false);
  });

  it('unwrap() returns data on success', () => {
    expect(unwrap(ok(10))).toBe(10);
  });

  it('unwrap() throws on error', () => {
    expect(() => unwrap(err(new Error('boom')))).toThrow('boom');
  });
});

describe('DomainError', () => {
  class TestError extends DomainError {
    readonly code = 'TEST';
    readonly statusCode = 400;
  }
  it('serializes to JSON', () => {
    expect(new TestError('oops').toJSON()).toMatchObject({ code: 'TEST', statusCode: 400 });
  });
});

describe('ApiErrorSchema', () => {
  it('parses valid error', () => {
    expect(
      ApiErrorSchema.parse({
        statusCode: 400,
        error: 'Bad Request',
        message: 'invalid',
        timestamp: '2025-01-01T00:00:00.000Z',
      }),
    ).toBeDefined();
  });
});

describe('ApiResponseSchema / PaginatedResponseSchema', () => {
  it('wraps data', () => {
    const S = ApiResponseSchema(z.number());
    expect(S.parse({ success: true, data: 42 }).data).toBe(42);
  });
  it('paginates', () => {
    const S = PaginatedResponseSchema(z.string());
    expect(
      S.parse({
        success: true,
        data: ['a'],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      }).data,
    ).toEqual(['a']);
  });
});

// ─── common ────────────────────────────────────────────────────────────────────

describe('Common schemas', () => {
  it('PaginationQuerySchema defaults', () => {
    const r = PaginationQuerySchema.parse({});
    expect(r.page).toBe(1);
  });
  it('OutboxEventSchema parses', () => {
    expect(
      OutboxEventSchema.parse({
        id: '00000000-0000-0000-0000-000000000001',
        topic: 'test',
        key: 'k1',
        payload: { foo: 'bar' },
        retryCount: 0,
      }),
    ).toBeDefined();
  });
  it('GxpValidationFieldsSchema is defined', () => {
    expect(GxpValidationFieldsSchema).toBeDefined();
  });
  it('brandedUuid creates schema', () => {
    expect(brandedUuid()).toBeDefined();
  });
  it('computeObjectHash returns string', () => {
    expect(typeof computeObjectHash({ a: 1 })).toBe('string');
  });
});

// ─── domain schemas ────────────────────────────────────────────────────────────

describe('Financial', () => {
  it('schemas defined', () => {
    expect(JournalEntrySchema).toBeDefined();
    expect(AccountSchema).toBeDefined();
    expect(BiologicalAssetSchema).toBeDefined();
    expect(CreateAccountSchema).toBeDefined();
  });
});

describe('Procurement', () => {
  it('schemas defined', () => {
    expect(PurchaseOrderSchema).toBeDefined();
    expect(CreatePurchaseOrderSchema).toBeDefined();
    expect(SupplierSchema).toBeDefined();
  });
});

describe('Spatial', () => {
  it('schemas defined', () => {
    expect(ZoneSchema).toBeDefined();
    expect(CreateZoneSchema).toBeDefined();
  });
});

describe('Workforce', () => {
  it('schemas defined', () => {
    expect(EmployeeSchema).toBeDefined();
    expect(CreateEmployeeSchema).toBeDefined();
    expect(TaskSchema).toBeDefined();
    expect(CreateTaskSchema).toBeDefined();
    expect(TimeEntrySchema).toBeDefined();
    expect(CreateTimeEntrySchema).toBeDefined();
  });
});

describe('Training', () => {
  it('schemas defined', () => {
    expect(CourseSchema).toBeDefined();
    expect(TrainingExecutionSchema).toBeDefined();
    expect(CertificationSchema).toBeDefined();
  });
});

describe('IoT', () => {
  it('schemas defined', () => {
    expect(SensorReadingSchema).toBeDefined();
    expect(SensorSchema).toBeDefined();
    expect(AlertThresholdSchema).toBeDefined();
  });
});

describe('Quality', () => {
  it('schemas defined', () => {
    expect(DeviationSchema).toBeDefined();
    expect(CAPASchema).toBeDefined();
    expect(ChangeControlSchema).toBeDefined();
    expect(QualityEventSchema).toBeDefined();
    expect(ValidationProtocolSchema).toBeDefined();
  });
});

describe('Analytics', () => {
  it('schemas defined', () => {
    expect(AuditReadinessResultSchema).toBeDefined();
    expect(WorkforceSummaryResultSchema).toBeDefined();
  });
});

describe('Integrations', () => {
  it('MayanDocumentSchema defined', () => {
    expect(MayanDocumentSchema).toBeDefined();
  });
});

describe('Auth', () => {
  it('schemas defined', () => {
    expect(LoginRequestSchema).toBeDefined();
    expect(JwtPayloadSchema).toBeDefined();
  });
});

describe('Audit', () => {
  it('AuditEventSchema defined', () => {
    expect(AuditEventSchema).toBeDefined();
  });
  it('validateAlcoa is callable', () => {
    expect(typeof validateAlcoa).toBe('function');
  });
  it('validateAuditEventInput is callable', () => {
    expect(typeof validateAuditEventInput).toBe('function');
  });
});
