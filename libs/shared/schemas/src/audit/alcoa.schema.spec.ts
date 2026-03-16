import { validateAlcoa, computeObjectHash } from './alcoa.schema';
import type { AuditEvent } from './audit-event.schema';

// ─── FIXTURES ─────────────────────────────────────────────────────────────────

const NOW = new Date().toISOString();
const PAST_OK = new Date(Date.now() - 60_000).toISOString(); // 60 s ago — within 120 s window

function makeValidEvent(overrides: Partial<AuditEvent> = {}): AuditEvent {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    immudb_tx_id: null,
    immudb_proof: null,
    user_id: '00000000-0000-0000-0000-000000000002' as AuditEvent['user_id'],
    user_role: 'OPERATOR',
    user_name: 'Jane Operator',
    workstation_id: 'WS-001',
    ip_address: '10.0.0.1',
    session_id: '00000000-0000-0000-0000-000000000003',
    description: 'Plant stage transitioned',
    action: 'PLANT_STAGE_CHANGED',
    entity_type: 'plant',
    entity_id: '00000000-0000-0000-0000-000000000004',
    event_timestamp: PAST_OK,
    server_received_at: NOW,
    domain: 'CULTIVATION',
    is_critical_action: false,
    electronic_signature_id: null,
    before_state_hash: null,
    after_state_hash: null,
    changed_fields: null,
    sequence_number: 1,
    retention_class: '7_YEAR',
    storage_verified: false,
    ...overrides,
  } as AuditEvent;
}

// ─── validateAlcoa — happy path ───────────────────────────────────────────────

describe('validateAlcoa — valid event', () => {
  it('returns isValid: true with no violations for a fully compliant event', () => {
    const result = validateAlcoa(makeValidEvent());
    expect(result.isValid).toBe(true);
    expect(result.violations).toHaveLength(0);
    expect(result.auditEventId).toBe('00000000-0000-0000-0000-000000000001');
  });
});

// ─── A — Attributable ────────────────────────────────────────────────────────

describe('validateAlcoa — Attributable', () => {
  it('reports CRITICAL violation when user_id is missing', () => {
    const event = makeValidEvent({ user_id: null as unknown as AuditEvent['user_id'] });
    const result = validateAlcoa(event);
    expect(result.isValid).toBe(false);
    const v = result.violations.find(
      (x) => x.principle === 'Attributable' && x.field === 'user_id',
    );
    expect(v).toBeDefined();
    expect(v?.severity).toBe('CRITICAL');
  });

  it('reports MAJOR violation when workstation_id is missing', () => {
    const event = makeValidEvent({ workstation_id: '' });
    const result = validateAlcoa(event);
    const v = result.violations.find((x) => x.field === 'workstation_id');
    expect(v).toBeDefined();
    expect(v?.severity).toBe('MAJOR');
  });

  it('reports MAJOR violation when ip_address is missing', () => {
    const event = makeValidEvent({ ip_address: '' });
    const result = validateAlcoa(event);
    const v = result.violations.find((x) => x.field === 'ip_address');
    expect(v).toBeDefined();
    expect(v?.severity).toBe('MAJOR');
  });

  it('reports MAJOR violation when session_id is missing', () => {
    const event = makeValidEvent({ session_id: '' as unknown as AuditEvent['session_id'] });
    const result = validateAlcoa(event);
    const v = result.violations.find((x) => x.field === 'session_id');
    expect(v).toBeDefined();
    expect(v?.severity).toBe('MAJOR');
  });
});

// ─── L — Legible ─────────────────────────────────────────────────────────────

describe('validateAlcoa — Legible', () => {
  it('reports violation when description is empty', () => {
    const event = makeValidEvent({ description: '   ' });
    const result = validateAlcoa(event);
    const v = result.violations.find((x) => x.principle === 'Legible');
    expect(v).toBeDefined();
    expect(v?.severity).toBe('MAJOR');
  });
});

// ─── C — Contemporaneous ─────────────────────────────────────────────────────

describe('validateAlcoa — Contemporaneous', () => {
  it('reports CRITICAL violation when event_timestamp is >120 s from server_received_at', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000).toISOString();
    const event = makeValidEvent({
      event_timestamp: fiveMinutesAgo,
      server_received_at: NOW,
    });
    const result = validateAlcoa(event);
    const v = result.violations.find((x) => x.principle === 'Contemporaneous');
    expect(v).toBeDefined();
    expect(v?.severity).toBe('CRITICAL');
  });

  it('passes when delta is exactly within 120 s window', () => {
    const twoMinutesAgo = new Date(Date.now() - 119_000).toISOString();
    const event = makeValidEvent({
      event_timestamp: twoMinutesAgo,
      server_received_at: NOW,
    });
    const result = validateAlcoa(event);
    const cv = result.violations.find((x) => x.principle === 'Contemporaneous');
    expect(cv).toBeUndefined();
  });
});

// ─── O — Original ─────────────────────────────────────────────────────────────

describe('validateAlcoa — Original', () => {
  it('reports violation when changed_fields is set but after_state_hash is null', () => {
    const event = makeValidEvent({
      changed_fields: { status: { before: 'ACTIVE', after: 'HARVESTED' } },
      after_state_hash: null,
    });
    const result = validateAlcoa(event);
    const v = result.violations.find((x) => x.principle === 'Original');
    expect(v).toBeDefined();
    expect(v?.severity).toBe('MAJOR');
  });

  it('passes when changed_fields is set and after_state_hash is provided', () => {
    const event = makeValidEvent({
      changed_fields: { status: { before: 'ACTIVE', after: 'HARVESTED' } },
      after_state_hash: 'a'.repeat(64),
    });
    const result = validateAlcoa(event);
    const ov = result.violations.find((x) => x.principle === 'Original');
    expect(ov).toBeUndefined();
  });

  it('passes when changed_fields is null (no state change)', () => {
    const event = makeValidEvent({ changed_fields: null, after_state_hash: null });
    const result = validateAlcoa(event);
    const ov = result.violations.find((x) => x.principle === 'Original');
    expect(ov).toBeUndefined();
  });
});

// ─── A — Accurate ─────────────────────────────────────────────────────────────

describe('validateAlcoa — Accurate', () => {
  it('reports CRITICAL violation when is_critical_action=true but no electronic_signature_id', () => {
    const event = makeValidEvent({ is_critical_action: true, electronic_signature_id: null });
    const result = validateAlcoa(event);
    const v = result.violations.find((x) => x.principle === 'Accurate');
    expect(v).toBeDefined();
    expect(v?.severity).toBe('CRITICAL');
  });

  it('passes when is_critical_action=true and electronic_signature_id is present', () => {
    const event = makeValidEvent({
      is_critical_action: true,
      electronic_signature_id: '00000000-0000-0000-0000-000000000099',
    });
    const result = validateAlcoa(event);
    const av = result.violations.find((x) => x.principle === 'Accurate');
    expect(av).toBeUndefined();
  });

  it('passes when is_critical_action=false with no signature', () => {
    const event = makeValidEvent({ is_critical_action: false, electronic_signature_id: null });
    const result = validateAlcoa(event);
    const av = result.violations.find((x) => x.principle === 'Accurate');
    expect(av).toBeUndefined();
  });
});

// ─── + Complete ───────────────────────────────────────────────────────────────

describe('validateAlcoa — Complete', () => {
  it('reports violation when entity_type is null', () => {
    const event = makeValidEvent({ entity_type: null as unknown as string });
    const result = validateAlcoa(event);
    const v = result.violations.find(
      (x) => x.principle === 'Complete' && x.field === 'entity_type',
    );
    expect(v).toBeDefined();
  });

  it('reports violation when entity_id is null', () => {
    const event = makeValidEvent({ entity_id: null as unknown as AuditEvent['entity_id'] });
    const result = validateAlcoa(event);
    const v = result.violations.find((x) => x.principle === 'Complete' && x.field === 'entity_id');
    expect(v).toBeDefined();
  });
});

// ─── + Enduring ───────────────────────────────────────────────────────────────

describe('validateAlcoa — Enduring', () => {
  it('reports MAJOR violation when retention_class is empty/missing', () => {
    const event = makeValidEvent({
      retention_class: '' as unknown as AuditEvent['retention_class'],
    });
    const result = validateAlcoa(event);
    const v = result.violations.find((x) => x.principle === 'Enduring');
    expect(v).toBeDefined();
    expect(v?.severity).toBe('MAJOR');
  });
});

// ─── non-fail-fast: multiple violations collected ────────────────────────────

describe('validateAlcoa — multiple violations', () => {
  it('collects all violations from multiple principles at once', () => {
    const event = makeValidEvent({
      user_id: null as unknown as AuditEvent['user_id'],
      description: '',
      is_critical_action: true,
      electronic_signature_id: null,
    });
    const result = validateAlcoa(event);
    expect(result.isValid).toBe(false);
    const principles = result.violations.map((v) => v.principle);
    expect(principles).toContain('Attributable');
    expect(principles).toContain('Legible');
    expect(principles).toContain('Accurate');
  });
});

// ─── computeObjectHash ────────────────────────────────────────────────────────

describe('computeObjectHash', () => {
  it('returns a 64-char hex string (SHA-256)', () => {
    const hash = computeObjectHash({ foo: 'bar', baz: 42 });
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('returns the same hash for the same object (deterministic)', () => {
    const obj = { a: 1, b: 'two' };
    expect(computeObjectHash(obj)).toBe(computeObjectHash(obj));
  });

  it('returns different hashes for different objects', () => {
    expect(computeObjectHash({ a: 1 })).not.toBe(computeObjectHash({ a: 2 }));
  });
});
