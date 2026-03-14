import {
  type Plant,
  type GrowthStage,
  type ElectronicSignature,
  type PlantStageTransitionRecord,
  type UserId,
  type PlantId,
  VALID_STAGE_TRANSITIONS,
  GrowthStageEnum,
  err,
  ok,
  type Result,
} from '@gacp-erp/shared-schemas';

export type PlantTransitionError =
  | { code: 'INVALID_TRANSITION'; from: GrowthStage; to: GrowthStage }
  | { code: 'SIGNATURE_REQUIRED'; stage: GrowthStage }
  | { code: 'PLANT_DESTROYED' }
  | { code: 'PLANT_HARVESTED' };

/** Stages that REQUIRE an electronic signature per 21 CFR §11.50 */
const SIGNATURE_REQUIRED_TRANSITIONS = new Set<GrowthStage>([
  GrowthStageEnum.enum.HARVESTING,
  GrowthStageEnum.enum.HARVESTED,
  GrowthStageEnum.enum.DESTROYED,
]);

/**
 * PlantAggregate encapsulates all business rules for plant lifecycle management.
 * It enforces valid stage transitions and signature requirements.
 *
 * Conforms to GACP / EU GMP Annex 11 — every state change is traceable.
 */
export class PlantAggregate {
  private readonly _plant: Plant;
  private readonly _stageHistory: PlantStageTransitionRecord[];

  constructor(plant: Plant, stageHistory: PlantStageTransitionRecord[] = []) {
    this._plant = { ...plant };
    this._stageHistory = [...stageHistory];
  }

  get id(): string {
    return this._plant.id;
  }

  get currentStage(): GrowthStage {
    return this._plant.current_stage;
  }

  get plant(): Plant {
    return { ...this._plant };
  }

  get stageHistory(): readonly PlantStageTransitionRecord[] {
    return this._stageHistory;
  }

  /**
   * Attempts to transition the plant to a new growth stage.
   * Returns an error Result if the transition is invalid or a signature is missing
   * when required.
   */
  transition(
    toStage: GrowthStage,
    transitionedBy: string,
    notes?: string,
    signature?: ElectronicSignature,
  ): Result<PlantStageTransitionRecord, PlantTransitionError> {
    const fromStage = this._plant.current_stage;

    // Terminal stages — no more transitions
    if (fromStage === GrowthStageEnum.enum.DESTROYED) {
      return err({ code: 'PLANT_DESTROYED' });
    }

    // Validate transition is in the allowed adjacency map
    const allowed = VALID_STAGE_TRANSITIONS[fromStage] ?? [];
    if (!allowed.includes(toStage)) {
      return err({ code: 'INVALID_TRANSITION', from: fromStage, to: toStage });
    }

    // Require electronic signature for critical transitions
    if (SIGNATURE_REQUIRED_TRANSITIONS.has(toStage) && !signature) {
      return err({ code: 'SIGNATURE_REQUIRED', stage: toStage });
    }

    const now = new Date().toISOString();
    const record: PlantStageTransitionRecord = {
      id: crypto.randomUUID(),
      plant_id: this._plant.id as unknown as PlantId,
      from_stage: fromStage,
      to_stage: toStage,
      transitioned_by: transitionedBy as unknown as UserId,
      transitioned_at: now,
      created_at: now,
      notes,
      electronic_signature: signature,
    };

    // Mutate internal state
    (this._plant as { current_stage: GrowthStage }).current_stage = toStage;
    (this._plant as { last_stage_change_at?: string }).last_stage_change_at = now;
    this._stageHistory.push(record);

    return ok(record);
  }

  /**
   * Returns true if the plant can legally transition to the given stage.
   */
  canTransitionTo(toStage: GrowthStage): boolean {
    if (this._plant.current_stage === GrowthStageEnum.enum.DESTROYED) {
      return false;
    }
    const allowed = VALID_STAGE_TRANSITIONS[this._plant.current_stage] ?? [];
    return allowed.includes(toStage);
  }
}
