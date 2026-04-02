import {
  GrowthStageEnum,
  VALID_STAGE_TRANSITIONS,
  type Plant,
  type ElectronicSignature,
} from '@gacp-erp/shared-schemas';

import { PlantAggregate } from './plant.aggregate';

// ─── FIXTURES ────────────────────────────────────────────────────────────────

function makeValidSignature(overrides: Partial<ElectronicSignature> = {}): ElectronicSignature {
  return {
    signed_by: '00000000-0000-0000-0000-000000000001' as ElectronicSignature['signed_by'],
    signer_name: 'Jane Operator',
    signer_role: 'Senior Cultivator',
    signature_type: 'approval',
    authentication_method: 'two_factor',
    digital_signature: 'a'.repeat(256),
    content_hash: 'b'.repeat(64),
    ip_address: '10.0.0.1',
    workstation_id: 'WS-001',
    signature_meaning: 'I confirm this stage transition is accurate and authorized',
    signed_at: '2026-01-15T10:00:00+00:00',
    ...overrides,
  };
}

function makePlant(overrides: Partial<Plant> = {}): Plant {
  const now = '2026-01-15T08:00:00+00:00';
  return {
    id: '00000000-0000-0000-0000-000000000010' as Plant['id'],
    batch_id: '00000000-0000-0000-0000-000000000020' as Plant['batch_id'],
    strain_id: '00000000-0000-0000-0000-000000000030' as Plant['strain_id'],
    facility_id: '00000000-0000-0000-0000-000000000040' as Plant['facility_id'],
    plant_code: 'PLANT-2026-001',
    current_stage: GrowthStageEnum.enum.SEED,
    created_at: now,
    updated_at: now,
    created_by: '00000000-0000-0000-0000-000000000001' as Plant['created_by'],
    updated_by: '00000000-0000-0000-0000-000000000001' as Plant['updated_by'],
    source_type: 'seed',
    mother_plant_id: null,
    generation: 0,
    is_deleted: false,
    deleted_at: null,
    deleted_by: null,
    ...overrides,
  };
}

const OPERATOR_ID = '00000000-0000-0000-0000-000000000099';

// ─── VALID TRANSITIONS ────────────────────────────────────────────────────────

describe('PlantAggregate.transition() — valid transitions', () => {
  it('SEED → GERMINATION (no signature required)', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'SEED' }));
    const result = agg.transition('GERMINATION', OPERATOR_ID);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.from_stage).toBe('SEED');
      expect(result.data.to_stage).toBe('GERMINATION');
      expect(result.data.transitioned_by).toBe(OPERATOR_ID);
    }
  });

  it('GERMINATION → VEGETATIVE (no signature required)', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'GERMINATION' }));
    const result = agg.transition('VEGETATIVE', OPERATOR_ID);
    expect(result.success).toBe(true);
  });

  it('GERMINATION → CLONING (no signature required)', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'GERMINATION' }));
    const result = agg.transition('CLONING', OPERATOR_ID, 'cloned for next cycle');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.notes).toBe('cloned for next cycle');
    }
  });

  it('CLONING → VEGETATIVE (no signature required)', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'CLONING' }));
    const result = agg.transition('VEGETATIVE', OPERATOR_ID);
    expect(result.success).toBe(true);
  });

  it('VEGETATIVE → FLOWERING (no signature required)', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'VEGETATIVE' }));
    const result = agg.transition('FLOWERING', OPERATOR_ID);
    expect(result.success).toBe(true);
  });

  it('MOTHER_PLANT → VEGETATIVE (no signature required)', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'MOTHER_PLANT' }));
    const result = agg.transition('VEGETATIVE', OPERATOR_ID);
    expect(result.success).toBe(true);
  });

  it('FLOWERING → HARVESTING (signature required — provided)', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'FLOWERING' }));
    const result = agg.transition('HARVESTING', OPERATOR_ID, undefined, makeValidSignature());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.electronic_signature).toBeDefined();
    }
  });

  it('HARVESTING → HARVESTED (signature required — provided)', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'HARVESTING' }));
    const result = agg.transition('HARVESTED', OPERATOR_ID, undefined, makeValidSignature());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.to_stage).toBe('HARVESTED');
    }
  });

  it('FLOWERING → DESTROYED (signature required — provided)', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'FLOWERING' }));
    const result = agg.transition('DESTROYED', OPERATOR_ID, 'Pest outbreak', makeValidSignature());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.to_stage).toBe('DESTROYED');
    }
  });

  it('SEED → DESTROYED is valid', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'SEED' }));
    const result = agg.transition('DESTROYED', OPERATOR_ID, undefined, makeValidSignature());
    expect(result.success).toBe(true);
  });
});

// ─── INTERNAL STATE MUTATION ──────────────────────────────────────────────────

describe('PlantAggregate state after successful transition', () => {
  it('updates currentStage after transition', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'SEED' }));
    agg.transition('GERMINATION', OPERATOR_ID);
    expect(agg.currentStage).toBe('GERMINATION');
  });

  it('appends to stageHistory', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'SEED' }));
    agg.transition('GERMINATION', OPERATOR_ID);
    expect(agg.stageHistory).toHaveLength(1);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(agg.stageHistory[0]!.from_stage).toBe('SEED');
  });

  it('preserves history across multiple transitions', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'SEED' }));
    agg.transition('GERMINATION', OPERATOR_ID);
    agg.transition('VEGETATIVE', OPERATOR_ID);
    expect(agg.stageHistory).toHaveLength(2);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(agg.stageHistory[1]!.from_stage).toBe('GERMINATION');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    expect(agg.stageHistory[1]!.to_stage).toBe('VEGETATIVE');
  });

  it('generated record has a valid UUID as id', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'SEED' }));
    const result = agg.transition('GERMINATION', OPERATOR_ID);
    if (!result.success) throw new Error('unexpected failure');
    expect(result.data.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });
});

// ─── INVALID TRANSITIONS ─────────────────────────────────────────────────────

describe('PlantAggregate.transition() — invalid transitions', () => {
  it('SEED → FLOWERING (skipping stages) → INVALID_TRANSITION', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'SEED' }));
    const result = agg.transition('FLOWERING', OPERATOR_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_TRANSITION');
      if (result.error.code === 'INVALID_TRANSITION') {
        expect(result.error.from).toBe('SEED');
        expect(result.error.to).toBe('FLOWERING');
      }
    }
  });

  it('VEGETATIVE → GERMINATION (reverse transition) → INVALID_TRANSITION', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'VEGETATIVE' }));
    const result = agg.transition('GERMINATION', OPERATOR_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_TRANSITION');
    }
  });

  it('HARVESTED → FLOWERING (any transition from terminal) → INVALID_TRANSITION', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'HARVESTED' }));
    const result = agg.transition('FLOWERING', OPERATOR_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_TRANSITION');
    }
  });

  it('SEED → SEED (self-transition) → INVALID_TRANSITION', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'SEED' }));
    const result = agg.transition('SEED', OPERATOR_ID);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_TRANSITION');
    }
  });
});

// ─── TERMINAL STATE ────────────────────────────────────────────────────────────

describe('PlantAggregate.transition() — terminal state (DESTROYED)', () => {
  it('any transition from DESTROYED → PLANT_DESTROYED', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'DESTROYED' }));
    const stages: (typeof GrowthStageEnum.enum)[keyof typeof GrowthStageEnum.enum][] = [
      'SEED',
      'GERMINATION',
      'VEGETATIVE',
      'FLOWERING',
      'HARVESTING',
      'HARVESTED',
    ];
    for (const stage of stages) {
      const result = agg.transition(stage, OPERATOR_ID, undefined, makeValidSignature());
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('PLANT_DESTROYED');
      }
    }
  });

  it('canTransitionTo() returns false for DESTROYED plant', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'DESTROYED' }));
    expect(agg.canTransitionTo('SEED')).toBe(false);
    expect(agg.canTransitionTo('HARVESTED')).toBe(false);
  });
});

describe('PlantAggregate — HARVESTED terminal state', () => {
  it('HARVESTED → anything → INVALID_TRANSITION (no allowed next stages)', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'HARVESTED' }));
    // VALID_STAGE_TRANSITIONS.HARVESTED = []
    expect(VALID_STAGE_TRANSITIONS['HARVESTED']).toHaveLength(0);
    const result = agg.transition('DESTROYED', OPERATOR_ID, undefined, makeValidSignature());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_TRANSITION');
    }
  });
});

// ─── SIGNATURE REQUIRED ────────────────────────────────────────────────────────

describe('PlantAggregate.transition() — signature required', () => {
  const sigRequiredCases: Array<{
    from: Plant['current_stage'];
    to: Plant['current_stage'];
  }> = [
    { from: 'FLOWERING', to: 'HARVESTING' },
    { from: 'HARVESTING', to: 'HARVESTED' },
    { from: 'VEGETATIVE', to: 'DESTROYED' },
    { from: 'SEED', to: 'DESTROYED' },
    { from: 'CLONING', to: 'DESTROYED' },
  ];

  it.each(sigRequiredCases)(
    '$from → $to without signature → SIGNATURE_REQUIRED',
    ({ from, to }) => {
      const agg = new PlantAggregate(makePlant({ current_stage: from }));
      const result = agg.transition(to, OPERATOR_ID);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('SIGNATURE_REQUIRED');
        if (result.error.code === 'SIGNATURE_REQUIRED') {
          expect(result.error.stage).toBe(to);
        }
      }
    },
  );

  it('GERMINATION → VEGETATIVE without signature → succeeds (no sig needed)', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'GERMINATION' }));
    const result = agg.transition('VEGETATIVE', OPERATOR_ID);
    expect(result.success).toBe(true);
  });

  it('VEGETATIVE → FLOWERING without signature → succeeds (no sig needed)', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'VEGETATIVE' }));
    const result = agg.transition('FLOWERING', OPERATOR_ID);
    expect(result.success).toBe(true);
  });
});

// ─── canTransitionTo() ─────────────────────────────────────────────────────────

describe('PlantAggregate.canTransitionTo()', () => {
  it('returns true for valid next stage', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'SEED' }));
    expect(agg.canTransitionTo('GERMINATION')).toBe(true);
    expect(agg.canTransitionTo('DESTROYED')).toBe(true);
  });

  it('returns false for invalid next stage', () => {
    const agg = new PlantAggregate(makePlant({ current_stage: 'SEED' }));
    expect(agg.canTransitionTo('FLOWERING')).toBe(false);
    expect(agg.canTransitionTo('HARVESTED')).toBe(false);
  });
});
