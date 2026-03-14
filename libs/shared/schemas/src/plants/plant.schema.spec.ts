import {
  GrowthStageEnum,
  VALID_STAGE_TRANSITIONS,
  PlantSchema,
  PlantOperationTypeEnum,
  OPERATIONS_REQUIRING_AUTHORIZATION,
  OPERATIONS_REQUIRING_QA_REVIEW,
} from './plant.schema';

// ─── GrowthStageEnum ──────────────────────────────────────────────────────────

describe('GrowthStageEnum', () => {
  const validStages = [
    'SEED',
    'GERMINATION',
    'CLONING',
    'VEGETATIVE',
    'MOTHER_PLANT',
    'FLOWERING',
    'HARVESTING',
    'HARVESTED',
    'DESTROYED',
  ] as const;

  it.each(validStages)('accepts valid stage "%s"', (stage) => {
    expect(GrowthStageEnum.parse(stage)).toBe(stage);
  });

  it.each(['seed', 'vegetative', 'GROWING', 'CURED', ''])('rejects invalid stage "%s"', (stage) => {
    expect(() => GrowthStageEnum.parse(stage)).toThrow();
  });

  it('enum has exactly 9 values', () => {
    expect(GrowthStageEnum.options).toHaveLength(9);
  });
});

// ─── VALID_STAGE_TRANSITIONS ──────────────────────────────────────────────────

describe('VALID_STAGE_TRANSITIONS', () => {
  it('every GrowthStage has an entry', () => {
    for (const stage of GrowthStageEnum.options) {
      expect(VALID_STAGE_TRANSITIONS).toHaveProperty(stage);
    }
  });

  it('SEED can transition to GERMINATION and DESTROYED', () => {
    expect(VALID_STAGE_TRANSITIONS['SEED']).toContain('GERMINATION');
    expect(VALID_STAGE_TRANSITIONS['SEED']).toContain('DESTROYED');
  });

  it('GERMINATION can transition to CLONING, VEGETATIVE, DESTROYED', () => {
    expect(VALID_STAGE_TRANSITIONS['GERMINATION']).toContain('CLONING');
    expect(VALID_STAGE_TRANSITIONS['GERMINATION']).toContain('VEGETATIVE');
    expect(VALID_STAGE_TRANSITIONS['GERMINATION']).toContain('DESTROYED');
  });

  it('FLOWERING can transition to HARVESTING and DESTROYED', () => {
    expect(VALID_STAGE_TRANSITIONS['FLOWERING']).toContain('HARVESTING');
    expect(VALID_STAGE_TRANSITIONS['FLOWERING']).toContain('DESTROYED');
  });

  it('HARVESTED has no allowed next stages (terminal)', () => {
    expect(VALID_STAGE_TRANSITIONS['HARVESTED']).toHaveLength(0);
  });

  it('DESTROYED has no allowed next stages (terminal)', () => {
    expect(VALID_STAGE_TRANSITIONS['DESTROYED']).toHaveLength(0);
  });
});

// ─── PlantSchema ──────────────────────────────────────────────────────────────

describe('PlantSchema.plant_code', () => {
  const base = {
    id: '00000000-0000-0000-0000-000000000001',
    batch_id: '00000000-0000-0000-0000-000000000002',
    strain_id: '00000000-0000-0000-0000-000000000003',
    facility_id: '00000000-0000-0000-0000-000000000004',
    current_stage: 'SEED',
    created_at: '2026-01-01T00:00:00+00:00',
    updated_at: '2026-01-01T00:00:00+00:00',
    created_by: '00000000-0000-0000-0000-000000000010',
    updated_by: '00000000-0000-0000-0000-000000000010',
    is_deleted: false,
    deleted_at: null,
    deleted_by: null,
  };

  it.each(['PLANT-2026-001', 'P001', 'ABC-123', 'ZZZZ20260001'])(
    'accepts valid plant_code "%s"',
    (plant_code) => {
      expect(() => PlantSchema.parse({ ...base, plant_code })).not.toThrow();
    },
  );

  it('rejects plant_code with lowercase letters', () => {
    expect(() => PlantSchema.parse({ ...base, plant_code: 'plant-001' })).toThrow();
  });

  it('rejects plant_code with spaces', () => {
    expect(() => PlantSchema.parse({ ...base, plant_code: 'PLANT 001' })).toThrow();
  });

  it('rejects plant_code exceeding 20 chars', () => {
    expect(() => PlantSchema.parse({ ...base, plant_code: 'PLANT-2026-0000000001' })).toThrow();
  });

  it('rejects plant_code shorter than 3 chars', () => {
    expect(() => PlantSchema.parse({ ...base, plant_code: 'AB' })).toThrow();
  });
});

describe('PlantSchema.health_score', () => {
  const base = {
    id: '00000000-0000-0000-0000-000000000001',
    batch_id: '00000000-0000-0000-0000-000000000002',
    strain_id: '00000000-0000-0000-0000-000000000003',
    facility_id: '00000000-0000-0000-0000-000000000004',
    plant_code: 'PLANT-001',
    current_stage: 'SEED',
    created_at: '2026-01-01T00:00:00+00:00',
    updated_at: '2026-01-01T00:00:00+00:00',
    created_by: '00000000-0000-0000-0000-000000000010',
    updated_by: '00000000-0000-0000-0000-000000000010',
    is_deleted: false,
    deleted_at: null,
    deleted_by: null,
  };

  it('accepts 0 (critical)', () => {
    expect(() => PlantSchema.parse({ ...base, health_score: 0 })).not.toThrow();
  });

  it('accepts 100 (healthy)', () => {
    expect(() => PlantSchema.parse({ ...base, health_score: 100 })).not.toThrow();
  });

  it('accepts 50 (mid-range)', () => {
    expect(() => PlantSchema.parse({ ...base, health_score: 50 })).not.toThrow();
  });

  it('rejects 101 (above max)', () => {
    expect(() => PlantSchema.parse({ ...base, health_score: 101 })).toThrow();
  });

  it('rejects -1 (below min)', () => {
    expect(() => PlantSchema.parse({ ...base, health_score: -1 })).toThrow();
  });

  it('rejects non-integer (1.5)', () => {
    expect(() => PlantSchema.parse({ ...base, health_score: 1.5 })).toThrow();
  });

  it('is optional (absent = valid)', () => {
    expect(() => PlantSchema.parse(base)).not.toThrow();
  });
});

describe('PlantSchema.last_operation_at', () => {
  const base = {
    id: '00000000-0000-0000-0000-000000000001',
    batch_id: '00000000-0000-0000-0000-000000000002',
    strain_id: '00000000-0000-0000-0000-000000000003',
    facility_id: '00000000-0000-0000-0000-000000000004',
    plant_code: 'PLANT-001',
    current_stage: 'SEED',
    created_at: '2026-01-01T00:00:00+00:00',
    updated_at: '2026-01-01T00:00:00+00:00',
    created_by: '00000000-0000-0000-0000-000000000010',
    updated_by: '00000000-0000-0000-0000-000000000010',
    is_deleted: false,
    deleted_at: null,
    deleted_by: null,
  };

  it('accepts valid ISO 8601 offset datetime', () => {
    expect(() =>
      PlantSchema.parse({ ...base, last_operation_at: '2026-01-15T10:00:00+00:00' }),
    ).not.toThrow();
  });

  it('accepts UTC Z suffix', () => {
    expect(() =>
      PlantSchema.parse({ ...base, last_operation_at: '2026-01-15T10:00:00Z' }),
    ).not.toThrow();
  });

  it('rejects datetime without offset', () => {
    expect(() =>
      PlantSchema.parse({ ...base, last_operation_at: '2026-01-15T10:00:00' }),
    ).toThrow();
  });

  it('rejects date-only string', () => {
    expect(() => PlantSchema.parse({ ...base, last_operation_at: '2026-01-15' })).toThrow();
  });

  it('is optional (absent = valid)', () => {
    expect(() => PlantSchema.parse(base)).not.toThrow();
  });
});

// ─── PlantOperationTypeEnum ───────────────────────────────────────────────────

describe('PlantOperationTypeEnum', () => {
  const validTypes = [
    'stage_change',
    'transplant',
    'pruning',
    'watering',
    'fertilizing',
    'health_check',
    'pest_treatment',
    'harvest',
    'destruction',
    'observation',
  ] as const;

  it.each(validTypes)('accepts valid operation type "%s"', (opType) => {
    expect(PlantOperationTypeEnum.parse(opType)).toBe(opType);
  });

  it('rejects unknown operation type', () => {
    expect(() => PlantOperationTypeEnum.parse('spraying')).toThrow();
    expect(() => PlantOperationTypeEnum.parse('HARVEST')).toThrow();
  });
});

// ─── OPERATIONS_REQUIRING_AUTHORIZATION ──────────────────────────────────────

describe('OPERATIONS_REQUIRING_AUTHORIZATION', () => {
  it('contains exactly pest_treatment, destruction, harvest', () => {
    expect(OPERATIONS_REQUIRING_AUTHORIZATION.size).toBe(3);
    expect(OPERATIONS_REQUIRING_AUTHORIZATION.has('pest_treatment')).toBe(true);
    expect(OPERATIONS_REQUIRING_AUTHORIZATION.has('destruction')).toBe(true);
    expect(OPERATIONS_REQUIRING_AUTHORIZATION.has('harvest')).toBe(true);
  });

  it('does NOT contain routine operations', () => {
    expect(OPERATIONS_REQUIRING_AUTHORIZATION.has('watering')).toBe(false);
    expect(OPERATIONS_REQUIRING_AUTHORIZATION.has('observation')).toBe(false);
    expect(OPERATIONS_REQUIRING_AUTHORIZATION.has('pruning')).toBe(false);
    expect(OPERATIONS_REQUIRING_AUTHORIZATION.has('fertilizing')).toBe(false);
  });
});

// ─── OPERATIONS_REQUIRING_QA_REVIEW ──────────────────────────────────────────

describe('OPERATIONS_REQUIRING_QA_REVIEW', () => {
  it('contains exactly pest_treatment and destruction', () => {
    expect(OPERATIONS_REQUIRING_QA_REVIEW.size).toBe(2);
    expect(OPERATIONS_REQUIRING_QA_REVIEW.has('pest_treatment')).toBe(true);
    expect(OPERATIONS_REQUIRING_QA_REVIEW.has('destruction')).toBe(true);
  });

  it('does NOT contain harvest (harvest = authorization only, not QA review)', () => {
    expect(OPERATIONS_REQUIRING_QA_REVIEW.has('harvest')).toBe(false);
  });

  it('does NOT contain routine operations', () => {
    expect(OPERATIONS_REQUIRING_QA_REVIEW.has('watering')).toBe(false);
    expect(OPERATIONS_REQUIRING_QA_REVIEW.has('stage_change')).toBe(false);
  });

  it('is a strict subset of OPERATIONS_REQUIRING_AUTHORIZATION', () => {
    for (const op of OPERATIONS_REQUIRING_QA_REVIEW) {
      expect(OPERATIONS_REQUIRING_AUTHORIZATION.has(op)).toBe(true);
    }
  });
});
