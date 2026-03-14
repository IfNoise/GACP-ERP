import {
  ElectronicSignatureSchema,
  BaseEntitySchema,
  SoftDeletableSchema,
  SignatureTypeSchema,
  AuthenticationMethodSchema,
} from './base-entity.schema';

// ─── FIXTURES ────────────────────────────────────────────────────────────────

function makeValidSignature(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    signed_by: '00000000-0000-0000-0000-000000000001',
    signer_name: 'Jane Operator',
    signer_role: 'Senior Cultivator',
    signature_type: 'approval',
    authentication_method: 'two_factor',
    digital_signature: 'a'.repeat(256),
    content_hash: 'b'.repeat(64),
    ip_address: '10.0.0.1',
    workstation_id: 'WS-001',
    signature_meaning: 'I confirm this action is accurate and authorized',
    signed_at: '2026-01-15T10:00:00+00:00',
    ...overrides,
  };
}

// ─── ElectronicSignatureSchema — full valid object ───────────────────────────

describe('ElectronicSignatureSchema — complete valid object', () => {
  it('parses a fully valid signature', () => {
    expect(() => ElectronicSignatureSchema.parse(makeValidSignature())).not.toThrow();
  });

  it('missing required field (signer_name) → ZodError', () => {
    const { signer_name: _removed, ...rest } = makeValidSignature() as {
      signer_name: string;
      [k: string]: unknown;
    };
    expect(() => ElectronicSignatureSchema.parse(rest)).toThrow();
  });

  it('missing required field (signed_by) → ZodError', () => {
    const { signed_by: _removed, ...rest } = makeValidSignature() as {
      signed_by: string;
      [k: string]: unknown;
    };
    expect(() => ElectronicSignatureSchema.parse(rest)).toThrow();
  });
});

// ─── digital_signature ────────────────────────────────────────────────────────

describe('ElectronicSignatureSchema.digital_signature', () => {
  it('accepts exactly 256 hex chars', () => {
    expect(() =>
      ElectronicSignatureSchema.parse(makeValidSignature({ digital_signature: 'a'.repeat(256) })),
    ).not.toThrow();
  });

  it('accepts more than 256 hex chars (e.g. 512)', () => {
    expect(() =>
      ElectronicSignatureSchema.parse(makeValidSignature({ digital_signature: 'f'.repeat(512) })),
    ).not.toThrow();
  });

  it('rejects 255 hex chars (below minimum)', () => {
    expect(() =>
      ElectronicSignatureSchema.parse(makeValidSignature({ digital_signature: 'a'.repeat(255) })),
    ).toThrow();
  });

  it('rejects non-hex characters', () => {
    // 256 chars but containing 'g' (not hex)
    const nonHex = 'g'.repeat(256);
    expect(() =>
      ElectronicSignatureSchema.parse(makeValidSignature({ digital_signature: nonHex })),
    ).toThrow();
  });

  it('rejects empty string', () => {
    expect(() =>
      ElectronicSignatureSchema.parse(makeValidSignature({ digital_signature: '' })),
    ).toThrow();
  });

  it('accepts mixed-case hex (case-insensitive)', () => {
    const mixedCase = 'aAbBcCdDeEfF'.repeat(22) + 'aAbB';
    // length = 12 * 22 + 4 = 268 > 256, all valid hex
    expect(() =>
      ElectronicSignatureSchema.parse(makeValidSignature({ digital_signature: mixedCase })),
    ).not.toThrow();
  });
});

// ─── content_hash ─────────────────────────────────────────────────────────────

describe('ElectronicSignatureSchema.content_hash', () => {
  it('accepts exactly 64 hex chars (SHA-256)', () => {
    expect(() =>
      ElectronicSignatureSchema.parse(makeValidSignature({ content_hash: 'b'.repeat(64) })),
    ).not.toThrow();
  });

  it('rejects 63 hex chars (below 64)', () => {
    expect(() =>
      ElectronicSignatureSchema.parse(makeValidSignature({ content_hash: 'b'.repeat(63) })),
    ).toThrow();
  });

  it('rejects 65 hex chars (above 64)', () => {
    expect(() =>
      ElectronicSignatureSchema.parse(makeValidSignature({ content_hash: 'b'.repeat(65) })),
    ).toThrow();
  });

  it('rejects non-hex characters', () => {
    expect(() =>
      ElectronicSignatureSchema.parse(makeValidSignature({ content_hash: 'z'.repeat(64) })),
    ).toThrow();
  });

  it('accepts uppercase hex', () => {
    expect(() =>
      ElectronicSignatureSchema.parse(makeValidSignature({ content_hash: 'B'.repeat(64) })),
    ).not.toThrow();
  });
});

// ─── ip_address ───────────────────────────────────────────────────────────────

describe('ElectronicSignatureSchema.ip_address', () => {
  it.each(['10.0.0.1', '192.168.1.100', '255.255.255.255', '0.0.0.0'])(
    'accepts valid IPv4 "%s"',
    (ip) => {
      expect(() =>
        ElectronicSignatureSchema.parse(makeValidSignature({ ip_address: ip })),
      ).not.toThrow();
    },
  );

  it.each(['::1', '2001:0db8:85a3:0000:0000:8a2e:0370:7334', 'fe80::1'])(
    'accepts valid IPv6 "%s"',
    (ip) => {
      expect(() =>
        ElectronicSignatureSchema.parse(makeValidSignature({ ip_address: ip })),
      ).not.toThrow();
    },
  );

  it('rejects non-IP string', () => {
    expect(() =>
      ElectronicSignatureSchema.parse(makeValidSignature({ ip_address: 'not-an-ip' })),
    ).toThrow();
  });

  it('rejects hostname', () => {
    expect(() =>
      ElectronicSignatureSchema.parse(makeValidSignature({ ip_address: 'workstation.local' })),
    ).toThrow();
  });
});

// ─── signature_type ───────────────────────────────────────────────────────────

describe('SignatureTypeSchema', () => {
  it.each(['approval', 'review', 'verification', 'witnessed', 'authorization'])(
    'accepts valid type "%s"',
    (type) => {
      expect(SignatureTypeSchema.parse(type)).toBe(type);
    },
  );

  it.each(['APPROVAL', 'sign', 'confirm', ''])('rejects invalid type "%s"', (type) => {
    expect(() => SignatureTypeSchema.parse(type)).toThrow();
  });
});

// ─── authentication_method ────────────────────────────────────────────────────

describe('AuthenticationMethodSchema', () => {
  it.each(['password', 'biometric', 'token', 'two_factor', 'pki_certificate'])(
    'accepts valid method "%s"',
    (method) => {
      expect(AuthenticationMethodSchema.parse(method)).toBe(method);
    },
  );

  it.each(['PASSWORD', 'sms', 'otp', ''])('rejects invalid method "%s"', (method) => {
    expect(() => AuthenticationMethodSchema.parse(method)).toThrow();
  });
});

// ─── signed_at ────────────────────────────────────────────────────────────────

describe('ElectronicSignatureSchema.signed_at', () => {
  it('accepts ISO 8601 with offset', () => {
    expect(() =>
      ElectronicSignatureSchema.parse(
        makeValidSignature({ signed_at: '2026-01-15T10:00:00+03:00' }),
      ),
    ).not.toThrow();
  });

  it('accepts UTC with Z suffix', () => {
    expect(() =>
      ElectronicSignatureSchema.parse(makeValidSignature({ signed_at: '2026-01-15T10:00:00Z' })),
    ).not.toThrow();
  });

  it('rejects datetime without offset', () => {
    expect(() =>
      ElectronicSignatureSchema.parse(makeValidSignature({ signed_at: '2026-01-15T10:00:00' })),
    ).toThrow();
  });

  it('rejects date-only string', () => {
    expect(() =>
      ElectronicSignatureSchema.parse(makeValidSignature({ signed_at: '2026-01-15' })),
    ).toThrow();
  });
});

// ─── signer_name / signer_role limits ────────────────────────────────────────

describe('ElectronicSignatureSchema string length constraints', () => {
  it('rejects signer_name longer than 200 chars', () => {
    expect(() =>
      ElectronicSignatureSchema.parse(makeValidSignature({ signer_name: 'A'.repeat(201) })),
    ).toThrow();
  });

  it('rejects empty signer_name', () => {
    expect(() =>
      ElectronicSignatureSchema.parse(makeValidSignature({ signer_name: '' })),
    ).toThrow();
  });

  it('rejects signer_role longer than 100 chars', () => {
    expect(() =>
      ElectronicSignatureSchema.parse(makeValidSignature({ signer_role: 'A'.repeat(101) })),
    ).toThrow();
  });

  it('rejects signature_meaning longer than 500 chars', () => {
    expect(() =>
      ElectronicSignatureSchema.parse(makeValidSignature({ signature_meaning: 'A'.repeat(501) })),
    ).toThrow();
  });
});

// ─── BaseEntitySchema ─────────────────────────────────────────────────────────

describe('BaseEntitySchema', () => {
  const validBase = {
    id: '00000000-0000-0000-0000-000000000001',
    created_at: '2026-01-01T00:00:00+00:00',
    updated_at: '2026-01-01T00:00:00+00:00',
    created_by: '00000000-0000-0000-0000-000000000010',
    updated_by: '00000000-0000-0000-0000-000000000010',
  };

  it('accepts a valid base entity', () => {
    expect(() => BaseEntitySchema.parse(validBase)).not.toThrow();
  });

  it('rejects non-UUID id', () => {
    expect(() => BaseEntitySchema.parse({ ...validBase, id: 'not-uuid' })).toThrow();
  });

  it('rejects created_at without timezone offset', () => {
    expect(() =>
      BaseEntitySchema.parse({ ...validBase, created_at: '2026-01-01T00:00:00' }),
    ).toThrow();
  });
});

// ─── SoftDeletableSchema ──────────────────────────────────────────────────────

describe('SoftDeletableSchema', () => {
  const validSoftDeletable = {
    id: '00000000-0000-0000-0000-000000000001',
    created_at: '2026-01-01T00:00:00+00:00',
    updated_at: '2026-01-01T00:00:00+00:00',
    created_by: '00000000-0000-0000-0000-000000000010',
    updated_by: '00000000-0000-0000-0000-000000000010',
    is_deleted: false,
    deleted_at: null,
    deleted_by: null,
  };

  it('accepts a valid non-deleted entity', () => {
    expect(() => SoftDeletableSchema.parse(validSoftDeletable)).not.toThrow();
  });

  it('accepts a soft-deleted entity', () => {
    expect(() =>
      SoftDeletableSchema.parse({
        ...validSoftDeletable,
        is_deleted: true,
        deleted_at: '2026-06-01T12:00:00+00:00',
        deleted_by: '00000000-0000-0000-0000-000000000010',
      }),
    ).not.toThrow();
  });

  it('is_deleted defaults to false when omitted', () => {
    const { is_deleted: _removed, ...rest } = validSoftDeletable;
    const parsed = SoftDeletableSchema.parse(rest);
    expect(parsed.is_deleted).toBe(false);
  });

  it('rejects deleted_at without offset', () => {
    expect(() =>
      SoftDeletableSchema.parse({
        ...validSoftDeletable,
        deleted_at: '2026-06-01T12:00:00',
      }),
    ).toThrow();
  });
});
