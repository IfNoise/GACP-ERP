import {
  BatchSchema,
  BatchStatusEnum,
  ComplianceStatusEnum,
  HarvestRecordSchema,
  QualityGradeEnum,
} from './batch.schema';

// ─── ComplianceStatusEnum ─────────────────────────────────────────────────────

describe('ComplianceStatusEnum', () => {
  it.each(['pending', 'approved', 'rejected'])('accepts valid value "%s"', (val) => {
    expect(ComplianceStatusEnum.parse(val)).toBe(val);
  });

  it.each(['PENDING', 'Approved', 'hold', ''])('rejects invalid value "%s"', (val) => {
    expect(() => ComplianceStatusEnum.parse(val)).toThrow();
  });
});

// ─── BatchStatusEnum ──────────────────────────────────────────────────────────

describe('BatchStatusEnum', () => {
  it.each(['PLANNED', 'ACTIVE', 'HARVESTING', 'COMPLETED', 'DESTROYED', 'ON_HOLD'])(
    'accepts valid status "%s"',
    (val) => {
      expect(BatchStatusEnum.parse(val)).toBe(val);
    },
  );

  it.each(['planned', 'active', 'FINISHED'])('rejects invalid status "%s"', (val) => {
    expect(() => BatchStatusEnum.parse(val)).toThrow();
  });
});

// ─── BatchSchema ──────────────────────────────────────────────────────────────

const validBase = {
  id: '00000000-0000-0000-0000-000000000001',
  batch_number: 'BATCH-2026-001',
  strain_id: '00000000-0000-0000-0000-000000000002',
  facility_id: '00000000-0000-0000-0000-000000000003',
  planned_plant_count: 100,
  created_at: '2026-01-01T00:00:00+00:00',
  updated_at: '2026-01-01T00:00:00+00:00',
  created_by: '00000000-0000-0000-0000-000000000010',
  updated_by: '00000000-0000-0000-0000-000000000010',
  is_deleted: false,
  deleted_at: null,
  deleted_by: null,
};

describe('BatchSchema.compliance_status', () => {
  it('defaults to "pending" when omitted', () => {
    const parsed = BatchSchema.parse(validBase);
    expect(parsed.compliance_status).toBe('pending');
  });

  it('accepts explicit "approved"', () => {
    const parsed = BatchSchema.parse({ ...validBase, compliance_status: 'approved' });
    expect(parsed.compliance_status).toBe('approved');
  });
});

describe('BatchSchema.status', () => {
  it('defaults to "PLANNED" when omitted', () => {
    const parsed = BatchSchema.parse(validBase);
    expect(parsed.status).toBe('PLANNED');
  });
});

describe('BatchSchema.batch_number', () => {
  it.each(['BATCH-2026-001', 'STRAIN_A_001', 'B001', 'ABC-123_XY'])(
    'accepts valid batch_number "%s"',
    (batch_number) => {
      expect(() => BatchSchema.parse({ ...validBase, batch_number })).not.toThrow();
    },
  );

  it('rejects lowercase letters', () => {
    expect(() => BatchSchema.parse({ ...validBase, batch_number: 'batch-001' })).toThrow();
  });

  it('rejects spaces', () => {
    expect(() => BatchSchema.parse({ ...validBase, batch_number: 'BATCH 001' })).toThrow();
  });

  it('rejects empty string', () => {
    expect(() => BatchSchema.parse({ ...validBase, batch_number: '' })).toThrow();
  });

  it('rejects string longer than 50 chars', () => {
    expect(() => BatchSchema.parse({ ...validBase, batch_number: 'A'.repeat(51) })).toThrow();
  });
});

describe('BatchSchema.parent_batch_id', () => {
  it('accepts null (root batch)', () => {
    const parsed = BatchSchema.parse({ ...validBase, parent_batch_id: null });
    expect(parsed.parent_batch_id).toBeNull();
  });

  it('accepts undefined (root batch)', () => {
    const parsed = BatchSchema.parse(validBase);
    expect(parsed.parent_batch_id).toBeUndefined();
  });

  it('accepts a valid UUID (child batch)', () => {
    const parentId = '00000000-0000-0000-0000-000000000099';
    const parsed = BatchSchema.parse({ ...validBase, parent_batch_id: parentId });
    expect(parsed.parent_batch_id).toBe(parentId);
  });

  it('rejects a non-UUID string', () => {
    expect(() => BatchSchema.parse({ ...validBase, parent_batch_id: 'not-a-uuid' })).toThrow();
  });
});

describe('BatchSchema.planned_plant_count', () => {
  it('accepts positive integer', () => {
    expect(() => BatchSchema.parse({ ...validBase, planned_plant_count: 1 })).not.toThrow();
    expect(() => BatchSchema.parse({ ...validBase, planned_plant_count: 500 })).not.toThrow();
  });

  it('rejects 0 (must be positive)', () => {
    expect(() => BatchSchema.parse({ ...validBase, planned_plant_count: 0 })).toThrow();
  });

  it('rejects negative values', () => {
    expect(() => BatchSchema.parse({ ...validBase, planned_plant_count: -1 })).toThrow();
  });

  it('rejects non-integer', () => {
    expect(() => BatchSchema.parse({ ...validBase, planned_plant_count: 10.5 })).toThrow();
  });
});

describe('BatchSchema.actual_plant_count', () => {
  it('defaults to 0 when omitted', () => {
    const parsed = BatchSchema.parse(validBase);
    expect(parsed.actual_plant_count).toBe(0);
  });

  it('accepts 0 (all plants destroyed)', () => {
    expect(() => BatchSchema.parse({ ...validBase, actual_plant_count: 0 })).not.toThrow();
  });

  it('accepts positive values', () => {
    expect(() => BatchSchema.parse({ ...validBase, actual_plant_count: 50 })).not.toThrow();
  });

  it('rejects negative values', () => {
    expect(() => BatchSchema.parse({ ...validBase, actual_plant_count: -1 })).toThrow();
  });
});

// ─── QualityGradeEnum ─────────────────────────────────────────────────────────

describe('QualityGradeEnum', () => {
  it.each(['AAA', 'AA', 'A', 'B', 'C', 'REJECTED'])('accepts valid grade "%s"', (val) => {
    expect(QualityGradeEnum.parse(val)).toBe(val);
  });

  it.each(['D', 'aaa', 'GRADE_A', ''])('rejects invalid grade "%s"', (val) => {
    expect(() => QualityGradeEnum.parse(val)).toThrow();
  });
});

// ─── HarvestRecordSchema ──────────────────────────────────────────────────────

describe('HarvestRecordSchema.wet_weight_grams', () => {
  const validSig = {
    signed_by: '00000000-0000-0000-0000-000000000001',
    signer_name: 'Jane Operator',
    signer_role: 'Cultivation Manager',
    signature_type: 'approval',
    authentication_method: 'two_factor',
    digital_signature: 'a'.repeat(256),
    content_hash: 'b'.repeat(64),
    ip_address: '10.0.0.1',
    workstation_id: 'WS-001',
    signature_meaning: 'I authorize this harvest record',
    signed_at: '2026-01-15T10:00:00+00:00',
  };

  const validHarvest = {
    id: '00000000-0000-0000-0000-000000000099',
    batch_id: '00000000-0000-0000-0000-000000000001',
    wet_weight_grams: 5000,
    dry_weight_grams: null,
    moisture_content_percent: 75,
    quality_grade: 'AA',
    harvested_by: '00000000-0000-0000-0000-000000000010',
    harvested_at: '2026-06-01T10:00:00+00:00',
    electronic_signature: validSig,
    qc_release_signature: null,
    qc_released_at: null,
    created_at: '2026-06-01T10:00:00+00:00',
    created_by: '00000000-0000-0000-0000-000000000010',
  };

  it('parses a valid harvest record', () => {
    expect(() => HarvestRecordSchema.parse(validHarvest)).not.toThrow();
  });

  it('rejects wet_weight_grams of 0 (must be positive)', () => {
    expect(() => HarvestRecordSchema.parse({ ...validHarvest, wet_weight_grams: 0 })).toThrow();
  });

  it('rejects negative wet_weight_grams', () => {
    expect(() => HarvestRecordSchema.parse({ ...validHarvest, wet_weight_grams: -100 })).toThrow();
  });

  it('accepts null dry_weight_grams (drying not yet complete)', () => {
    const parsed = HarvestRecordSchema.parse(validHarvest);
    expect(parsed.dry_weight_grams).toBeNull();
  });

  it('accepts null qc_release_signature (QC not yet released)', () => {
    const parsed = HarvestRecordSchema.parse(validHarvest);
    expect(parsed.qc_release_signature).toBeNull();
  });

  it('rejects moisture_content_percent > 100', () => {
    expect(() =>
      HarvestRecordSchema.parse({ ...validHarvest, moisture_content_percent: 101 }),
    ).toThrow();
  });
});
