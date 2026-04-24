import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  decimal,
  jsonb,
  index,
  uniqueIndex,
  inet,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ── Enums ──────────────────────────────────────────────────────────────────────

export const systemRoleEnum = pgEnum('system_role', [
  'SUPER_ADMIN',
  'QUALITY_MANAGER',
  'CULTIVATION_MANAGER',
  'OPERATOR',
  'AUDITOR',
  'READONLY',
]);

/** GrowthStage — uppercase canonical identifiers (GACP lifecycle) */
export const growthStageEnum = pgEnum('growth_stage', [
  'SEED',
  'GERMINATION',
  'CLONING',
  'VEGETATIVE',
  'MOTHER_PLANT',
  'FLOWERING',
  'HARVESTING',
  'HARVESTED',
  'DESTROYED',
]);

export const batchStatusEnum = pgEnum('batch_status', [
  'PLANNED',
  'ACTIVE',
  'HARVESTING',
  'COMPLETED',
  'DESTROYED',
  'ON_HOLD',
]);

/** Compliance review status for batches and key records (DS-PLM-003) */
export const complianceStatusEnum = pgEnum('compliance_status', [
  'pending',
  'approved',
  'rejected',
]);

export const qualityGradeEnum = pgEnum('quality_grade', ['AAA', 'AA', 'A', 'B', 'C', 'REJECTED']);

/** Zone types per DS-SP-001 */
export const zoneTypeEnum = pgEnum('zone_type', [
  'seedling',
  'germination',
  'vegetation',
  'flowering',
  'mother_room',
  'clone_room',
  'drying',
  'curing',
  'storage',
  'processing',
  'quarantine',
]);

/**
 * Plant operation types per DS-PLM-002.
 * These are physical actions/observations performed ON a plant
 * (≠ domain events published to Kafka).
 */
export const plantOperationTypeEnum = pgEnum('plant_operation_type', [
  'stage_change',
  'transplant',
  'pruning',
  'watering',
  'fertilizing',
  'health_check',
  'pest_treatment',
  'cloning',
  'harvest',
  'destruction',
  'observation',
]);

/** How the plant originated (seed, clone, tissue_culture) */
export const plantSourceTypeEnum = pgEnum('plant_source_type', ['seed', 'clone', 'tissue_culture']);

/** Batch origin — who/what provided the genetic material for this batch */
export const batchSourceTypeEnum = pgEnum('batch_source_type', [
  'external_purchase',
  'internal_clone',
  'seed_bank',
  'tissue_culture',
]);

/** Audit trail operations — INSERT only in production (DS-DI-002) */
export const auditOperationEnum = pgEnum('audit_operation', ['INSERT', 'UPDATE', 'DELETE']);

/** Building types — indoor, greenhouse, or open ground */
export const buildingTypeEnum = pgEnum('building_type', ['indoor', 'greenhouse', 'open_ground']);

// ── Facilities ─────────────────────────────────────────────────────────────────

export const facilitiesTable = pgTable(
  'facilities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    facility_code: varchar('facility_code', { length: 10 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    address: text('address').notNull(),
    coordinates: jsonb('coordinates'),
    dimensions: jsonb('dimensions'),
    license_number: varchar('license_number', { length: 100 }),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by').notNull(),
    updated_by: uuid('updated_by').notNull(),
  },
  (t) => ({
    facilityCodeIdx: uniqueIndex('facilities_code_idx').on(t.facility_code),
  }),
);

// ── Buildings ────────────────────────────────────────────────────────────────

export const buildingsTable = pgTable(
  'buildings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    facility_id: uuid('facility_id')
      .notNull()
      .references(() => facilitiesTable.id),
    building_code: varchar('building_code', { length: 20 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    building_type: buildingTypeEnum('building_type').notNull().default('indoor'),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by').notNull(),
    updated_by: uuid('updated_by').notNull(),
  },
  (t) => ({
    facilityBuildingCodeIdx: uniqueIndex('buildings_facility_code_idx').on(
      t.facility_id,
      t.building_code,
    ),
    facilityIdx: index('buildings_facility_idx').on(t.facility_id),
  }),
);

// ── Rooms ─────────────────────────────────────────────────────────────────────

export const roomsTable = pgTable(
  'rooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    building_id: uuid('building_id')
      .notNull()
      .references(() => buildingsTable.id),
    room_code: varchar('room_code', { length: 30 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    dimensions: jsonb('dimensions'),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by').notNull(),
    updated_by: uuid('updated_by').notNull(),
  },
  (t) => ({
    buildingRoomCodeIdx: uniqueIndex('rooms_building_code_idx').on(t.building_id, t.room_code),
    buildingIdx: index('rooms_building_idx').on(t.building_id),
  }),
);

// ── Zones (DS-SP-001) ─────────────────────────────────────────────────────────

export const zonesTable = pgTable(
  'zones',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    room_id: uuid('room_id')
      .notNull()
      .references(() => roomsTable.id),
    zone_code: varchar('zone_code', { length: 20 }).notNull(),
    zone_type: zoneTypeEnum('zone_type').notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    area_m2: decimal('area_m2', { precision: 8, scale: 2 }),
    environment_config: jsonb('environment_config'),
    coordinates: jsonb('coordinates'),
    max_plants: integer('max_plants'),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by').notNull(),
    updated_by: uuid('updated_by').notNull(),
  },
  (t) => ({
    roomZoneCodeIdx: uniqueIndex('zones_room_code_idx').on(t.room_id, t.zone_code),
    roomIdx: index('zones_room_idx').on(t.room_id),
    typeIdx: index('zones_type_idx').on(t.zone_type),
  }),
);

// ── Users ──────────────────────────────────────────────────────────────────────

export const usersTable = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    keycloak_id: varchar('keycloak_id', { length: 64 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    username: varchar('username', { length: 100 }).notNull(),
    first_name: varchar('first_name', { length: 100 }).notNull().default(''),
    last_name: varchar('last_name', { length: 100 }).notNull().default(''),
    role: systemRoleEnum('role').notNull().default('READONLY'),
    is_active: boolean('is_active').notNull().default(true),
    failed_login_count: integer('failed_login_count').notNull().default(0),
    last_login_at: timestamp('last_login_at', { withTimezone: true }),
    auditor_certification: varchar('auditor_certification', { length: 255 }),
    auditor_agency: varchar('auditor_agency', { length: 255 }),
    temporary_access_expires: timestamp('temporary_access_expires', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    keycloakIdIdx: uniqueIndex('users_keycloak_id_idx').on(t.keycloak_id),
    emailIdx: uniqueIndex('users_email_idx').on(t.email),
    usernameIdx: uniqueIndex('users_username_idx').on(t.username),
  }),
);

// ── Strains ────────────────────────────────────────────────────────────────────

export const strainSourceTypeEnum = pgEnum('strain_source_type', [
  'seed',
  'clone',
  'tissue_culture',
]);

export const strainsTable = pgTable(
  'strains',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    cultivar_code: varchar('cultivar_code', { length: 50 }).notNull(),
    species: varchar('species', { length: 50 }).notNull().default('hybrid'),
    genetics: varchar('genetics', { length: 255 }),
    /** Breeder or breeding company (backward traceability per SOP 8.1) */
    breeder: varchar('breeder', { length: 255 }),
    /** Seed bank source (WHO GACP seed banking) */
    seed_bank: varchar('seed_bank', { length: 255 }),
    /** How the genetics were obtained */
    source_type: strainSourceTypeEnum('source_type').notNull().default('seed'),
    thc_percentage_min: decimal('thc_percentage_min', { precision: 5, scale: 2 }),
    thc_percentage_max: decimal('thc_percentage_max', { precision: 5, scale: 2 }),
    cbd_percentage_min: decimal('cbd_percentage_min', { precision: 5, scale: 2 }),
    cbd_percentage_max: decimal('cbd_percentage_max', { precision: 5, scale: 2 }),
    flowering_time_days_min: integer('flowering_time_days_min'),
    flowering_time_days_max: integer('flowering_time_days_max'),
    expected_yield_grams_min: decimal('expected_yield_grams_min', { precision: 8, scale: 2 }),
    expected_yield_grams_max: decimal('expected_yield_grams_max', { precision: 8, scale: 2 }),
    /** Terpene analysis profile (JSON: { myrcene: 1.2, limonene: 0.8, ... }) */
    terpene_profile: jsonb('terpene_profile'),
    /** URL to DNA fingerprinting report (mandatory per SOP 9.1) */
    dna_profile_url: text('dna_profile_url'),
    /** Structured lineage (JSON: { mother: "...", father: "...", generation: 3 }) */
    lineage: jsonb('lineage'),
    /** Total acquisition cost for this genetics */
    acquisition_cost: decimal('acquisition_cost', { precision: 12, scale: 2 }),
    /** Currency for cost fields (ISO 4217) */
    currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
    /** Cost per seed or clone unit */
    cost_per_unit: decimal('cost_per_unit', { precision: 10, scale: 2 }),
    /** Unit type for cost_per_unit */
    unit_type: varchar('unit_type', { length: 20 }),
    /** Required quarantine period in days (seeds: 7-14, clones: 14-21) */
    quarantine_days: integer('quarantine_days'),
    /** Multi-generation consistency verified (SOP 4.1 stability testing) */
    stability_verified: boolean('stability_verified').notNull().default(false),
    /** EU regulatory registration number */
    registration_number: varchar('registration_number', { length: 100 }),
    notes: text('notes'),
    certificate_url: text('certificate_url'),
    supplier_id: uuid('supplier_id').references(() => suppliersTable.id),
    is_active: boolean('is_active').notNull().default(true),
    is_deleted: boolean('is_deleted').notNull().default(false),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
    deleted_by: uuid('deleted_by'),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by').notNull(),
    updated_by: uuid('updated_by').notNull(),
  },
  (t) => ({
    cultivarCodeIdx: uniqueIndex('strains_cultivar_code_idx').on(t.cultivar_code),
    supplierIdx: index('strains_supplier_idx').on(t.supplier_id),
    speciesIdx: index('strains_species_idx').on(t.species),
    sourceTypeIdx: index('strains_source_type_idx').on(t.source_type),
  }),
);

// ── Batches (DS-PLM-003) ───────────────────────────────────────────────────────

export const batchesTable = pgTable(
  'batches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    batch_number: varchar('batch_number', { length: 50 }).notNull(),
    parent_batch_id: uuid('parent_batch_id'),
    batch_source_type: batchSourceTypeEnum('batch_source_type').notNull().default('internal_clone'),
    source_batch_id: uuid('source_batch_id'), // FK enforced in migration 025 — self-ref causes TS inference loop
    source_grn_id: uuid('source_grn_id'), // FK enforced in migration 025 — forward-ref to receivingRecordsTable
    strain_id: uuid('strain_id')
      .notNull()
      .references(() => strainsTable.id),
    status: batchStatusEnum('status').notNull().default('PLANNED'),
    compliance_status: complianceStatusEnum('compliance_status').notNull().default('pending'),
    facility_id: uuid('facility_id')
      .notNull()
      .references(() => facilitiesTable.id),
    planned_plant_count: integer('planned_plant_count').notNull(),
    actual_plant_count: integer('actual_plant_count').notNull().default(0),
    notes: text('notes'),
    metadata: jsonb('metadata'),
    planned_start_date: timestamp('planned_start_date', { withTimezone: true }),
    actual_start_date: timestamp('actual_start_date', { withTimezone: true }),
    planned_harvest_date: timestamp('planned_harvest_date', { withTimezone: true }),
    actual_harvest_date: timestamp('actual_harvest_date', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by').notNull(),
    updated_by: uuid('updated_by').notNull(),
    is_deleted: boolean('is_deleted').notNull().default(false),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
    deleted_by: uuid('deleted_by'),
  },
  (t) => ({
    batchNumberIdx: uniqueIndex('batches_batch_number_idx').on(t.batch_number),
    strainIdx: index('batches_strain_idx').on(t.strain_id),
    statusIdx: index('batches_status_idx').on(t.status),
    facilityIdx: index('batches_facility_idx').on(t.facility_id),
    complianceIdx: index('batches_compliance_idx').on(t.compliance_status),
    parentIdx: index('batches_parent_idx').on(t.parent_batch_id),
    sourceTypeIdx: index('batches_source_type_idx').on(t.batch_source_type),
    sourceGrnIdx: index('batches_source_grn_idx').on(t.source_grn_id),
    sourceBatchIdx: index('batches_source_batch_idx').on(t.source_batch_id),
  }),
);

// ── Plants (DS-PLM-001) ────────────────────────────────────────────────────────

export const plantsTable = pgTable(
  'plants',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Structured plant code: PLANT-YYYY-NNN (up to 20 chars) */
    plant_code: varchar('plant_code', { length: 20 }).notNull(),
    batch_id: uuid('batch_id')
      .notNull()
      .references(() => batchesTable.id),
    strain_id: uuid('strain_id')
      .notNull()
      .references(() => strainsTable.id),
    current_stage: growthStageEnum('current_stage').notNull().default('SEED'),
    /** How this plant originated: seed, clone, or tissue_culture */
    source_type: plantSourceTypeEnum('source_type').notNull().default('seed'),
    /** ID of the mother plant this clone was taken from (null for seed-grown) */
    mother_plant_id: uuid('mother_plant_id'),
    /** Clone generation number (0 = seed-grown, 1 = first clone gen, etc.) */
    generation: integer('generation').notNull().default(0),
    /** Current zone — sole spatial reference (room/building/facility derive from hierarchy) */
    zone_id: uuid('zone_id')
      .notNull()
      .references(() => facilityZonesTable.id),
    /** Health score 0-100 per GACP cultivation standards */
    current_health_score: integer('current_health_score').default(100),
    /** Physical position (x, y, z) within zone */
    coordinates: jsonb('coordinates'),
    notes: text('notes'),
    metadata: jsonb('metadata'),
    last_stage_change_at: timestamp('last_stage_change_at', { withTimezone: true }),
    /**
     * Denormalized: timestamp of the most recent plant_operation for this plant.
     * Updated by the service layer on every insert into plant_operations.
     * Avoids aggregation queries when sorting/filtering plants by activity.
     */
    last_operation_at: timestamp('last_operation_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by').notNull(),
    updated_by: uuid('updated_by').notNull(),
    is_deleted: boolean('is_deleted').notNull().default(false),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
    deleted_by: uuid('deleted_by'),
  },
  (t) => ({
    plantCodeIdx: uniqueIndex('plants_code_idx').on(t.plant_code),
    batchIdx: index('plants_batch_idx').on(t.batch_id),
    strainIdx: index('plants_strain_idx').on(t.strain_id),
    stageIdx: index('plants_stage_idx').on(t.current_stage),
    sourceTypeIdx: index('plants_source_type_idx').on(t.source_type),
    motherPlantIdx: index('plants_mother_plant_idx').on(t.mother_plant_id),
    zoneIdx: index('plants_zone_idx').on(t.zone_id),
    healthIdx: index('plants_health_idx').on(t.current_health_score),
  }),
);

// ── Plant Operations (DS-PLM-002) ─────────────────────────────────────────────
//
// "Operations" = physical actions/observations performed ON a plant in real life:
//   watering, pruning, health_check, transplant, etc.
//
// NOT to be confused with domain events published to Kafka (libs/shared/events).

/**
 * Append-only journal of all physical operations performed on plants.
 * NO UPDATE or DELETE — feeds ALCOA+ audit trail.
 */
export const plantOperationsTable = pgTable(
  'plant_operations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    plant_id: uuid('plant_id')
      .notNull()
      .references(() => plantsTable.id),
    operation_type: plantOperationTypeEnum('operation_type').notNull(),
    operation_data: jsonb('operation_data')
      .notNull()
      .default(sql`'{}'::jsonb`),
    performed_by: uuid('performed_by')
      .notNull()
      .references(() => usersTable.id),
    performed_at: timestamp('performed_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    /**
     * Supervisor / shift-lead who authorized this operation.
     * REQUIRED for: pest_treatment, destruction, harvest.
     * Nullable for routine safe ops (watering, observation, health_check).
     * Chain of custody per SOP-COC-001 and ALCOA+ Attributable principle.
     */
    authorized_by: uuid('authorized_by').references(() => usersTable.id),
    authorized_at: timestamp('authorized_at', { withTimezone: true }),
    /** Electronic signature of the authorizing supervisor (21 CFR §11.50) */
    authorization_signature: jsonb('authorization_signature'),
    /**
     * QA personnel who reviewed and approved this operation.
     * REQUIRED for critical operations: pest_treatment, scheduled destruction.
     * EU GMP Annex 11 §12 — QA oversight for critical process steps.
     */
    qa_reviewed_by: uuid('qa_reviewed_by').references(() => usersTable.id),
    qa_reviewed_at: timestamp('qa_reviewed_at', { withTimezone: true }),
    /** QA electronic signature (21 CFR §11.50) */
    qa_signature: jsonb('qa_signature'),
    /** Optional cost fields — populated by financial service */
    labour_cost: decimal('labour_cost', { precision: 10, scale: 2 }),
    material_cost: decimal('material_cost', { precision: 10, scale: 2 }),
    equipment_cost: decimal('equipment_cost', { precision: 10, scale: 2 }),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    plantIdx: index('plant_operations_plant_idx').on(t.plant_id),
    typeIdx: index('plant_operations_type_idx').on(t.operation_type),
    performedAtIdx: index('plant_operations_performed_at_idx').on(t.performed_at),
    performedByIdx: index('plant_operations_performed_by_idx').on(t.performed_by),
    // Compliance queries: "pending QA review", "unauthorized critical ops"
    authorizedByIdx: index('plant_operations_authorized_by_idx').on(t.authorized_by),
    qaReviewedByIdx: index('plant_operations_qa_reviewed_by_idx').on(t.qa_reviewed_by),
  }),
);

// ── Stage Records ──────────────────────────────────────────────────────────────

export const stageRecordsTable = pgTable(
  'stage_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    plant_id: uuid('plant_id')
      .notNull()
      .references(() => plantsTable.id),
    from_stage: growthStageEnum('from_stage').notNull(),
    to_stage: growthStageEnum('to_stage').notNull(),
    transitioned_by: uuid('transitioned_by').notNull(),
    /**
     * Supervisor / manager who authorized the stage transition.
     * REQUIRED for transitions to HARVESTING, HARVESTED, DESTROYED.
     * Nullable for routine transitions (SEED → GERMINATION, GERMINATION → VEGETATIVE).
     */
    authorized_by: uuid('authorized_by').references(() => usersTable.id),
    authorized_at: timestamp('authorized_at', { withTimezone: true }),
    /** E-signature of the operator who performed the transition */
    electronic_signature: jsonb('electronic_signature'),
    /** E-signature of the supervisor who authorized (21 CFR §11.50) */
    authorization_signature: jsonb('authorization_signature'),
    notes: text('notes'),
    transitioned_at: timestamp('transitioned_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    plantIdx: index('stage_records_plant_idx').on(t.plant_id),
    transitionedAtIdx: index('stage_records_transitioned_at_idx').on(t.transitioned_at),
    authorizedByIdx: index('stage_records_authorized_by_idx').on(t.authorized_by),
  }),
);

// ── Harvest Records ────────────────────────────────────────────────────────────

export const harvestRecordsTable = pgTable(
  'harvest_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    batch_id: uuid('batch_id')
      .notNull()
      .references(() => batchesTable.id),
    plant_id: uuid('plant_id').references(() => plantsTable.id),
    fresh_weight_g: decimal('fresh_weight_g', { precision: 10, scale: 3 }).notNull(),
    dry_weight_g: decimal('dry_weight_g', { precision: 10, scale: 3 }),
    quality_grade: qualityGradeEnum('quality_grade'),
    lab_test_batch_id: varchar('lab_test_batch_id', { length: 100 }),
    thc_percentage: decimal('thc_percentage', { precision: 5, scale: 2 }),
    cbd_percentage: decimal('cbd_percentage', { precision: 5, scale: 2 }),
    harvested_by: uuid('harvested_by').notNull(),
    harvested_at: timestamp('harvested_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    harvest_signature: jsonb('harvest_signature').notNull(),
    qc_release_signature: jsonb('qc_release_signature'),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    batchIdx: index('harvest_records_batch_idx').on(t.batch_id),
    plantIdx: index('harvest_records_plant_idx').on(t.plant_id),
    harvestedAtIdx: index('harvest_records_harvested_at_idx').on(t.harvested_at),
    gradeIdx: index('harvest_records_grade_idx').on(t.quality_grade),
  }),
);

// ── Audit Trail (DS-DI-002) ────────────────────────────────────────────────────

/**
 * Immutable audit trail — INSERT ONLY.
 * No UPDATE, no DELETE. Replicated to immudb for cryptographic proof.
 * Compliant with 21 CFR Part 11 §11.10(e) and EU GMP Annex 11 clause 9.
 */
export const auditTrailTable = pgTable(
  'audit_trail',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    table_name: varchar('table_name', { length: 100 }).notNull(),
    record_id: varchar('record_id', { length: 100 }).notNull(),
    operation: auditOperationEnum('operation').notNull(),
    old_values: jsonb('old_values'),
    new_values: jsonb('new_values'),
    changed_by: uuid('changed_by').notNull(),
    changed_at: timestamp('changed_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    session_id: varchar('session_id', { length: 100 }).notNull(),
    ip_address: inet('ip_address').notNull(),
    user_agent: text('user_agent'),
  },
  (t) => ({
    tableRecordIdx: index('audit_trail_table_record_idx').on(t.table_name, t.record_id),
    changedByIdx: index('audit_trail_changed_by_idx').on(t.changed_by),
    changedAtIdx: index('audit_trail_changed_at_idx').on(t.changed_at),
    operationIdx: index('audit_trail_operation_idx').on(t.operation),
  }),
);

// ── Outbox Events (Transactional Outbox Pattern) ───────────────────────────────

/**
 * Transactional outbox table.
 *
 * Services write domain events here within the same DB transaction as the
 * domain entity mutation. The OutboxRelayService polls this table and publishes
 * events to Kafka, then marks them PUBLISHED.
 *
 * Guarantees AT-LEAST-ONCE delivery: if the service crashes after DB commit
 * but before Kafka publish, the relay will re-publish on restart.
 *
 * References: Microservices Patterns chapter 3 (Chris Richardson).
 */
export const outboxEventsStatusEnum = pgEnum('outbox_event_status', [
  'PENDING',
  'PUBLISHED',
  'FAILED',
  'DEAD',
]);

export const outboxEventsTable = pgTable(
  'outbox_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Kafka topic to publish to */
    topic: varchar('topic', { length: 255 }).notNull(),
    /** Kafka message key (usually the aggregate ID) */
    key: varchar('key', { length: 255 }).notNull(),
    /** Full event payload serialised as JSONB */
    payload: jsonb('payload').notNull(),
    status: outboxEventsStatusEnum('status').notNull().default('PENDING'),
    /** Number of publish attempts (incremented on each failure) */
    retry_count: integer('retry_count').notNull().default(0),
    /** Error message from the last failed publish attempt */
    last_error: text('last_error'),
    /** When the event was first published successfully */
    published_at: timestamp('published_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    statusIdx: index('outbox_events_status_idx').on(t.status),
    createdAtIdx: index('outbox_events_created_at_idx').on(t.created_at),
  }),
);

// ── IoT: Alert Thresholds (EPIC 5) ───────────────────────────────────────────

export const alertLevelEnum = pgEnum('alert_level', ['WARNING', 'CRITICAL']);

/**
 * Configurable alert thresholds per zone + sensor type.
 * Managed by QUALITY_MANAGER+. Changes are fully audited.
 */
export const alertThresholdsTable = pgTable(
  'alert_thresholds',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    zone_id: uuid('zone_id')
      .notNull()
      .references(() => zonesTable.id),
    sensor_type: varchar('sensor_type', { length: 50 }).notNull(),
    /** Lower bound — null = no lower limit */
    min_value: decimal('min_value', { precision: 10, scale: 4 }),
    /** Upper bound — null = no upper limit */
    max_value: decimal('max_value', { precision: 10, scale: 4 }),
    alert_level: alertLevelEnum('alert_level').notNull(),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by').notNull(),
    updated_by: uuid('updated_by').notNull(),
  },
  (t) => ({
    zoneIdx: index('alert_thresholds_zone_idx').on(t.zone_id),
    activeIdx: index('alert_thresholds_active_idx').on(t.is_active),
    zoneSensorTypeIdx: index('alert_thresholds_zone_sensor_idx').on(t.zone_id, t.sensor_type),
  }),
);

// ── IoT: Alert History (EPIC 5) ──────────────────────────────────────────────

/**
 * Immutable record of every triggered alert.
 * Written by AlertEvaluationService cron job.
 * Required for regulatory audit trail and trend analysis.
 */
export const alertHistoryTable = pgTable(
  'alert_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    threshold_id: uuid('threshold_id')
      .notNull()
      .references(() => alertThresholdsTable.id),
    zone_id: uuid('zone_id')
      .notNull()
      .references(() => zonesTable.id),
    sensor_type: varchar('sensor_type', { length: 50 }).notNull(),
    triggered_value: decimal('triggered_value', { precision: 10, scale: 4 }).notNull(),
    alert_level: alertLevelEnum('alert_level').notNull(),
    triggered_at: timestamp('triggered_at', { withTimezone: true }).notNull(),
    acknowledged: boolean('acknowledged').notNull().default(false),
    acknowledged_by: uuid('acknowledged_by'),
    acknowledged_at: timestamp('acknowledged_at', { withTimezone: true }),
    /** SHA-256 integrity hash: (threshold_id + triggered_value + triggered_at) */
    source_hash: varchar('source_hash', { length: 64 }).notNull(),
  },
  (t) => ({
    zoneIdx: index('alert_history_zone_idx').on(t.zone_id),
    triggeredAtIdx: index('alert_history_triggered_at_idx').on(t.triggered_at),
    acknowledgedIdx: index('alert_history_acknowledged_idx').on(t.acknowledged),
    thresholdIdx: index('alert_history_threshold_idx').on(t.threshold_id),
  }),
);

// ══════════════════════════════════════════════════════════════════════════════
// EPIC 6 — Quality Management: Change Control, CAPA, Deviations
// ══════════════════════════════════════════════════════════════════════════════

// ── Quality Enums ─────────────────────────────────────────────────────────────

export const changeControlStatusEnum = pgEnum('change_control_status', [
  'DRAFT',
  'SUBMITTED',
  'IMPACT_ASSESSED',
  'APPROVED',
  'REJECTED',
  'IMPLEMENTING',
  'VERIFIED',
  'CLOSED',
]);

export const changeTypeEnum = pgEnum('change_type', ['MINOR', 'MAJOR', 'EMERGENCY']);

export const impactRiskLevelEnum = pgEnum('impact_risk_level', [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]);

export const approvalStatusEnum = pgEnum('approval_status', ['PENDING', 'APPROVED', 'REJECTED']);

export const retentionClassEnum = pgEnum('retention_class', ['PERMANENT', '7_YEAR', '30_YEAR']);

export const qualityValidationStatusEnum = pgEnum('validation_status', [
  'unvalidated',
  'validated',
  'under_review',
  'superseded',
]);

export const capaTypeEnum = pgEnum('capa_type', ['CORRECTIVE', 'PREVENTIVE']);

export const capaSourceEnum = pgEnum('capa_source', [
  'DEVIATION',
  'AUDIT',
  'COMPLAINT',
  'TREND',
  'INSPECTION',
]);

export const capaStatusEnum = pgEnum('capa_status', [
  'OPEN',
  'RCA_IN_PROGRESS',
  'ACTION_PLAN',
  'IMPLEMENTING',
  'EFFECTIVENESS_CHECK',
  'CLOSED',
]);

export const rootCauseCategoryEnum = pgEnum('root_cause_category', [
  'HUMAN_ERROR',
  'PROCESS_FAILURE',
  'EQUIPMENT_FAILURE',
  'MATERIAL_DEFECT',
  'ENVIRONMENTAL',
  'DOCUMENTATION',
  'TRAINING_GAP',
  'SYSTEM_FAILURE',
  'UNKNOWN',
]);

export const effectivenessResultEnum = pgEnum('effectiveness_result', [
  'EFFECTIVE',
  'PARTIALLY_EFFECTIVE',
  'INEFFECTIVE',
]);

export const deviationClassificationEnum = pgEnum('deviation_classification', [
  'MINOR',
  'MAJOR',
  'CRITICAL',
]);

export const deviationCategoryEnum = pgEnum('deviation_category', [
  'PROCESS',
  'EQUIPMENT',
  'MATERIAL',
  'ENVIRONMENTAL',
  'DOCUMENTATION',
  'PERSONNEL',
  'UTILITY',
]);

export const deviationStatusEnum = pgEnum('deviation_status', [
  'REPORTED',
  'UNDER_INVESTIGATION',
  'IMPACT_ASSESSED',
  'CAPA_INITIATED',
  'CLOSED',
]);

// ── Change Controls ────────────────────────────────────────────────────────────

export const changeControlsTable = pgTable(
  'change_controls',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ccn_number: varchar('ccn_number', { length: 20 }).notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    change_type: changeTypeEnum('change_type').notNull(),
    status: changeControlStatusEnum('status').notNull().default('DRAFT'),
    requestor_id: uuid('requestor_id')
      .notNull()
      .references(() => usersTable.id),
    electronic_signature: jsonb('electronic_signature'),
    // GxP Validation Fields
    validation_status: qualityValidationStatusEnum('validation_status')
      .notNull()
      .default('unvalidated'),
    validation_protocol_id: uuid('validation_protocol_id'),
    last_validated_at: timestamp('last_validated_at', { withTimezone: true }),
    next_review_date: text('next_review_date'), // ISO 8601 date string
    retention_class: retentionClassEnum('retention_class').notNull().default('7_YEAR'),
    audit_tx_id: varchar('audit_tx_id', { length: 200 }),
    // Audit columns
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
    updated_by: uuid('updated_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    ccnNumberIdx: uniqueIndex('cc_ccn_number_idx').on(t.ccn_number),
    statusIdx: index('cc_status_idx').on(t.status),
    requestorIdx: index('cc_requestor_idx').on(t.requestor_id),
    typeIdx: index('cc_type_idx').on(t.change_type),
    createdAtIdx: index('cc_created_at_idx').on(t.created_at),
  }),
);

// ── Change Impacts ─────────────────────────────────────────────────────────────

export const changeImpactsTable = pgTable(
  'change_impacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    change_control_id: uuid('change_control_id')
      .notNull()
      .references(() => changeControlsTable.id, { onDelete: 'cascade' }),
    area: varchar('area', { length: 100 }).notNull(),
    impact_description: text('impact_description').notNull(),
    risk_level: impactRiskLevelEnum('risk_level').notNull(),
    assessed_by: uuid('assessed_by')
      .notNull()
      .references(() => usersTable.id),
    assessed_at: timestamp('assessed_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    changeControlIdx: index('ci_change_control_idx').on(t.change_control_id),
    riskLevelIdx: index('ci_risk_level_idx').on(t.risk_level),
  }),
);

// ── Change Approvals ───────────────────────────────────────────────────────────

export const changeApprovalsTable = pgTable(
  'change_approvals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    change_control_id: uuid('change_control_id')
      .notNull()
      .references(() => changeControlsTable.id, { onDelete: 'cascade' }),
    approver_id: uuid('approver_id')
      .notNull()
      .references(() => usersTable.id),
    approval_level: integer('approval_level').notNull(),
    status: approvalStatusEnum('status').notNull().default('PENDING'),
    electronic_signature: jsonb('electronic_signature'),
    decided_at: timestamp('decided_at', { withTimezone: true }),
    decision_notes: text('decision_notes'),
  },
  (t) => ({
    changeControlIdx: index('ca_change_control_idx').on(t.change_control_id),
    approverIdx: index('ca_approver_idx').on(t.approver_id),
    statusIdx: index('ca_status_idx').on(t.status),
    uniqueApprover: uniqueIndex('ca_unique_approver_idx').on(t.change_control_id, t.approver_id),
  }),
);

// ── CAPAs ──────────────────────────────────────────────────────────────────────

export const capasTable = pgTable(
  'capas',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    capa_number: varchar('capa_number', { length: 20 }).notNull(),
    type: capaTypeEnum('type').notNull(),
    source: capaSourceEnum('source').notNull(),
    status: capaStatusEnum('status').notNull().default('OPEN'),
    title: text('title').notNull(),
    description: text('description').notNull(),
    root_cause_category: rootCauseCategoryEnum('root_cause_category'),
    source_record_type: varchar('source_record_type', { length: 50 }),
    source_record_id: uuid('source_record_id'),
    due_date: text('due_date'), // ISO 8601 date string
    assigned_to: uuid('assigned_to').references(() => usersTable.id),
    electronic_signature: jsonb('electronic_signature'),
    // GxP Validation Fields
    validation_status: qualityValidationStatusEnum('validation_status')
      .notNull()
      .default('unvalidated'),
    validation_protocol_id: uuid('validation_protocol_id'),
    last_validated_at: timestamp('last_validated_at', { withTimezone: true }),
    next_review_date: text('next_review_date'),
    retention_class: retentionClassEnum('retention_class').notNull().default('7_YEAR'),
    audit_tx_id: varchar('audit_tx_id', { length: 200 }),
    // Audit columns
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
    updated_by: uuid('updated_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    capaNumberIdx: uniqueIndex('capa_number_idx').on(t.capa_number),
    statusIdx: index('capa_status_idx').on(t.status),
    typeIdx: index('capa_type_idx').on(t.type),
    assignedIdx: index('capa_assigned_idx').on(t.assigned_to),
    sourceRecIdx: index('capa_source_rec_idx').on(t.source_record_type, t.source_record_id),
  }),
);

// ── RCA Findings ───────────────────────────────────────────────────────────────

export const rcaFindingsTable = pgTable(
  'rca_findings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    capa_id: uuid('capa_id')
      .notNull()
      .references(() => capasTable.id, { onDelete: 'cascade' }),
    root_cause_category: rootCauseCategoryEnum('root_cause_category').notNull(),
    root_cause_description: text('root_cause_description').notNull(),
    contributing_factors: jsonb('contributing_factors')
      .notNull()
      .default(sql`'[]'::jsonb`),
    immediate_actions_taken: text('immediate_actions_taken'),
    investigated_by: uuid('investigated_by')
      .notNull()
      .references(() => usersTable.id),
    investigated_at: timestamp('investigated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    capaIdx: index('rca_capa_idx').on(t.capa_id),
  }),
);

// ── CAPA Action Plans ──────────────────────────────────────────────────────────

export const capaActionPlansTable = pgTable(
  'capa_action_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    capa_id: uuid('capa_id')
      .notNull()
      .references(() => capasTable.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    responsible_person: uuid('responsible_person')
      .notNull()
      .references(() => usersTable.id),
    target_date: text('target_date').notNull(), // ISO 8601 date
    completed_at: timestamp('completed_at', { withTimezone: true }),
    completion_notes: text('completion_notes'),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    capaIdx: index('cap_capa_idx').on(t.capa_id),
    responsibleIdx: index('cap_responsible_idx').on(t.responsible_person),
  }),
);

// ── Effectiveness Checks ───────────────────────────────────────────────────────

export const effectivenessChecksTable = pgTable(
  'effectiveness_checks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    capa_id: uuid('capa_id')
      .notNull()
      .references(() => capasTable.id, { onDelete: 'cascade' }),
    result: effectivenessResultEnum('result').notNull(),
    evidence_description: text('evidence_description').notNull(),
    check_date: text('check_date').notNull(), // ISO 8601 date
    checked_by: uuid('checked_by')
      .notNull()
      .references(() => usersTable.id),
    follow_up_capa_id: uuid('follow_up_capa_id').references(() => capasTable.id),
    electronic_signature: jsonb('electronic_signature').notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    capaIdx: index('ec_capa_idx').on(t.capa_id),
    checkedIdx: index('ec_checked_idx').on(t.checked_by),
  }),
);

// ── Deviations ─────────────────────────────────────────────────────────────────

export const deviationsTable = pgTable(
  'deviations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    deviation_number: varchar('deviation_number', { length: 20 }).notNull(),
    classification: deviationClassificationEnum('classification').notNull(),
    category: deviationCategoryEnum('category').notNull(),
    status: deviationStatusEnum('status').notNull().default('REPORTED'),
    title: text('title').notNull(),
    description: text('description').notNull(),
    location: varchar('location', { length: 300 }),
    batch_ids: jsonb('batch_ids')
      .notNull()
      .default(sql`'[]'::jsonb`),
    occurred_at: timestamp('occurred_at', { withTimezone: true }),
    reported_by: uuid('reported_by')
      .notNull()
      .references(() => usersTable.id),
    linked_capa_id: uuid('linked_capa_id').references(() => capasTable.id),
    product_impact: text('product_impact'),
    electronic_signature: jsonb('electronic_signature'),
    // GxP Validation Fields
    validation_status: qualityValidationStatusEnum('validation_status')
      .notNull()
      .default('unvalidated'),
    validation_protocol_id: uuid('validation_protocol_id'),
    last_validated_at: timestamp('last_validated_at', { withTimezone: true }),
    next_review_date: text('next_review_date'),
    retention_class: retentionClassEnum('retention_class').notNull().default('7_YEAR'),
    audit_tx_id: varchar('audit_tx_id', { length: 200 }),
    // Audit columns
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
    updated_by: uuid('updated_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    deviationNumberIdx: uniqueIndex('dev_number_idx').on(t.deviation_number),
    statusIdx: index('dev_status_idx').on(t.status),
    classificationIdx: index('dev_classification_idx').on(t.classification),
    categoryIdx: index('dev_category_idx').on(t.category),
    reportedByIdx: index('dev_reported_by_idx').on(t.reported_by),
    capaIdx: index('dev_capa_idx').on(t.linked_capa_id),
  }),
);

// ── Deviation Investigations ───────────────────────────────────────────────────

export const deviationInvestigationsTable = pgTable(
  'deviation_investigations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    deviation_id: uuid('deviation_id')
      .notNull()
      .references(() => deviationsTable.id, { onDelete: 'cascade' }),
    investigator_id: uuid('investigator_id')
      .notNull()
      .references(() => usersTable.id),
    investigation_summary: text('investigation_summary').notNull(),
    immediate_containment_actions: text('immediate_containment_actions').notNull(),
    product_impact_assessment: text('product_impact_assessment').notNull(),
    batches_affected: jsonb('batches_affected')
      .notNull()
      .default(sql`'[]'::jsonb`),
    investigated_at: timestamp('investigated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    electronic_signature: jsonb('electronic_signature'),
  },
  (t) => ({
    deviationIdx: index('di_deviation_idx').on(t.deviation_id),
    investigatorIdx: index('di_investigator_idx').on(t.investigator_id),
  }),
);

// ══════════════════════════════════════════════════════════════════════════════
// EPIC 7 — Validation Protocols & Quality Events
// ══════════════════════════════════════════════════════════════════════════════

export const validationProtocolStatusEnum = pgEnum('validation_protocol_status', [
  'DRAFT',
  'REVIEW',
  'APPROVED',
  'EXECUTING',
  'COMPLETED',
  'CLOSED',
  'SUPERSEDED',
]);

export const validationProtocolTypeEnum = pgEnum('validation_protocol_type', ['IQ', 'OQ', 'PQ']);

export const validationTestStatusEnum = pgEnum('validation_test_status', [
  'PENDING',
  'PASS',
  'FAIL',
  'NOT_APPLICABLE',
]);

export const qualityEventTypeEnum = pgEnum('quality_event_type', [
  'COMPLAINT',
  'AUDIT_FINDING',
  'INSPECTION_OBSERVATION',
  'QUALITY_ISSUE',
]);

export const qualityEventSeverityEnum = pgEnum('quality_event_severity', [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]);

export const qualityEventStatusEnum = pgEnum('quality_event_status', [
  'OPEN',
  'INVESTIGATING',
  'CAPA_INITIATED',
  'CLOSED',
]);

export const linkedRecordTypeEnum = pgEnum('linked_record_type', [
  'change_control',
  'capa',
  'deviation',
]);

// ── Validation Protocols ───────────────────────────────────────────────────────

export const validationProtocolsTable = pgTable(
  'validation_protocols',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    protocol_number: varchar('protocol_number', { length: 20 }).notNull(),
    type: validationProtocolTypeEnum('type').notNull(),
    status: validationProtocolStatusEnum('status').notNull().default('DRAFT'),
    system_under_test: text('system_under_test').notNull(),
    change_control_id: uuid('change_control_id').references(() => changeControlsTable.id, {
      onDelete: 'set null',
    }),
    electronic_signature: jsonb('electronic_signature'),
    // GxP Validation Fields
    validation_status: qualityValidationStatusEnum('validation_status')
      .notNull()
      .default('unvalidated'),
    validation_protocol_id: uuid('validation_protocol_id'),
    last_validated_at: timestamp('last_validated_at', { withTimezone: true }),
    next_review_date: text('next_review_date'),
    retention_class: retentionClassEnum('retention_class').notNull().default('PERMANENT'),
    audit_tx_id: varchar('audit_tx_id', { length: 200 }),
    // Audit columns
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
    updated_by: uuid('updated_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    vpNumberIdx: uniqueIndex('vp_number_idx').on(t.protocol_number),
    vpStatusIdx: index('vp_status_idx').on(t.status),
    vpTypeIdx: index('vp_type_idx').on(t.type),
    vpChangeControlIdx: index('vp_change_control_idx').on(t.change_control_id),
    vpCreatedAtIdx: index('vp_created_at_idx').on(t.created_at),
  }),
);

// ── Validation Tests ───────────────────────────────────────────────────────────

export const validationTestsTable = pgTable(
  'validation_tests',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    protocol_id: uuid('protocol_id')
      .notNull()
      .references(() => validationProtocolsTable.id, { onDelete: 'cascade' }),
    step_number: integer('step_number').notNull(),
    description: text('description').notNull(),
    expected_result: text('expected_result').notNull(),
    actual_result: text('actual_result'),
    status: validationTestStatusEnum('status').notNull().default('PENDING'),
    exception_note: text('exception_note'),
    executed_by: uuid('executed_by').references(() => usersTable.id),
    executed_at: timestamp('executed_at', { withTimezone: true }),
    electronic_signature: jsonb('electronic_signature'),
  },
  (t) => ({
    vtProtocolIdx: index('vt_protocol_idx').on(t.protocol_id),
    vtStatusIdx: index('vt_status_idx').on(t.status),
    vtExecutedByIdx: index('vt_executed_by_idx').on(t.executed_by),
    vtProtocolStepIdx: uniqueIndex('vt_protocol_step_idx').on(t.protocol_id, t.step_number),
  }),
);

// ── Quality Events ─────────────────────────────────────────────────────────────

export const qualityEventsTable = pgTable(
  'quality_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    event_number: varchar('event_number', { length: 20 }).notNull(),
    type: qualityEventTypeEnum('type').notNull(),
    severity: qualityEventSeverityEnum('severity').notNull(),
    status: qualityEventStatusEnum('status').notNull().default('OPEN'),
    title: text('title').notNull(),
    description: text('description').notNull(),
    capa_id: uuid('capa_id').references(() => capasTable.id, { onDelete: 'set null' }),
    electronic_signature: jsonb('electronic_signature'),
    // GxP Validation Fields
    validation_status: qualityValidationStatusEnum('validation_status')
      .notNull()
      .default('unvalidated'),
    validation_protocol_id: uuid('validation_protocol_id').references(
      () => validationProtocolsTable.id,
      { onDelete: 'set null' },
    ),
    last_validated_at: timestamp('last_validated_at', { withTimezone: true }),
    next_review_date: text('next_review_date'),
    retention_class: retentionClassEnum('retention_class').notNull().default('7_YEAR'),
    audit_tx_id: varchar('audit_tx_id', { length: 200 }),
    // Audit columns
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
    updated_by: uuid('updated_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    qeNumberIdx: uniqueIndex('qe_number_idx').on(t.event_number),
    qeStatusIdx: index('qe_status_idx').on(t.status),
    qeTypeIdx: index('qe_type_idx').on(t.type),
    qeSeverityIdx: index('qe_severity_idx').on(t.severity),
    qeCapaIdx: index('qe_capa_idx').on(t.capa_id),
    qeCreatedAtIdx: index('qe_created_at_idx').on(t.created_at),
  }),
);

// ── Linked Records (polymorphic junction) ─────────────────────────────────────

export const linkedRecordsTable = pgTable(
  'linked_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    quality_event_id: uuid('quality_event_id')
      .notNull()
      .references(() => qualityEventsTable.id, { onDelete: 'cascade' }),
    record_type: linkedRecordTypeEnum('record_type').notNull(),
    record_id: uuid('record_id').notNull(),
    linked_by: uuid('linked_by')
      .notNull()
      .references(() => usersTable.id),
    linked_at: timestamp('linked_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    lrEventIdx: index('lr_event_idx').on(t.quality_event_id),
    lrRecordTypeIdx: index('lr_record_type_idx').on(t.record_type, t.record_id),
    lrUniqueIdx: uniqueIndex('lr_unique_idx').on(t.quality_event_id, t.record_type, t.record_id),
  }),
);

// ═══════════════════════════════════════════════════════════════════════════════
// EPIC 8 — FINANCIAL OPERATIONS, PROCUREMENT & SPATIAL
// ═══════════════════════════════════════════════════════════════════════════════

// ── Financial Enums ───────────────────────────────────────────────────────────

export const accountTypeEnum = pgEnum('account_type', [
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'REVENUE',
  'EXPENSE',
]);

export const journalEntryStatusEnum = pgEnum('journal_entry_status', [
  'DRAFT',
  'POSTED',
  'REVERSED',
]);

export const valuationMethodEnum = pgEnum('valuation_method', ['FAIR_VALUE', 'COST']);

export const costTypeEnum = pgEnum('cost_type', [
  'DIRECT_LABOR',
  'OVERHEAD',
  'MATERIAL',
  'DEPRECIATION',
  'UTILITIES',
]);

export const payrollRunStatusEnum = pgEnum('payroll_run_status', [
  'DRAFT',
  'CALCULATED',
  'APPROVED',
  'PAID',
  'CANCELLED',
]);

// ── Procurement Enums ─────────────────────────────────────────────────────────

export const supplierQualificationStatusEnum = pgEnum('supplier_qualification_status', [
  'QUALIFIED',
  'PROVISIONAL',
  'DISQUALIFIED',
]);

export const purchaseOrderStatusEnum = pgEnum('purchase_order_status', [
  'DRAFT',
  'SUBMITTED',
  'ACKNOWLEDGED',
  'RECEIVING',
  'CLOSED',
  'CANCELLED',
]);

// ── Spatial Enums ─────────────────────────────────────────────────────────────

export const facilityZoneTypeEnum = pgEnum('facility_zone_type', [
  'CULTIVATION',
  'PROCESSING',
  'STORAGE',
  'UTILITY',
  'OFFICE',
  'QUARANTINE',
]);

// ── Financial Tables ──────────────────────────────────────────────────────────

export const accountsTable = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    account_code: varchar('account_code', { length: 4 }).notNull().unique(),
    account_type: accountTypeEnum('account_type').notNull(),
    parent_id: uuid('parent_id'),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
    updated_by: uuid('updated_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    acctCodeIdx: index('acct_code_idx').on(t.account_code),
    acctTypeIdx: index('acct_type_idx').on(t.account_type),
  }),
);

export const journalEntriesTable = pgTable(
  'journal_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entry_number: varchar('entry_number', { length: 20 }).notNull().unique(),
    description: text('description').notNull(),
    entry_date: timestamp('entry_date', { withTimezone: true }).notNull(),
    status: journalEntryStatusEnum('status').notNull().default('DRAFT'),
    reversal_of_id: uuid('reversal_of_id'),
    electronic_signature: jsonb('electronic_signature'),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
    updated_by: uuid('updated_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    jeNumberIdx: index('je_number_idx').on(t.entry_number),
    jeStatusIdx: index('je_status_idx').on(t.status),
    jeDateIdx: index('je_date_idx').on(t.entry_date),
  }),
);

export const journalLinesTable = pgTable(
  'journal_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entry_id: uuid('entry_id')
      .notNull()
      .references(() => journalEntriesTable.id, { onDelete: 'cascade' }),
    account_id: uuid('account_id')
      .notNull()
      .references(() => accountsTable.id),
    account_code: varchar('account_code', { length: 4 }).notNull(),
    description: text('description').notNull(),
    debit_amount: decimal('debit_amount', { precision: 18, scale: 2 }).notNull().default('0.00'),
    credit_amount: decimal('credit_amount', { precision: 18, scale: 2 }).notNull().default('0.00'),
    batch_id: uuid('batch_id'),
  },
  (t) => ({
    jlEntryIdx: index('jl_entry_idx').on(t.entry_id),
    jlAccountIdx: index('jl_account_idx').on(t.account_id),
  }),
);

export const biologicalAssetsTable = pgTable(
  'biological_assets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    batch_id: uuid('batch_id')
      .notNull()
      .references(() => batchesTable.id),
    valuation_method: valuationMethodEnum('valuation_method').notNull(),
    fair_value: decimal('fair_value', { precision: 18, scale: 2 }),
    cost_to_sell: decimal('cost_to_sell', { precision: 18, scale: 2 }),
    net_realizable_value: decimal('net_realizable_value', { precision: 18, scale: 2 }),
    cost_value: decimal('cost_value', { precision: 18, scale: 2 }),
    quantity_grams: decimal('quantity_grams', { precision: 18, scale: 3 }).notNull(),
    valued_at: timestamp('valued_at', { withTimezone: true }).notNull(),
    valued_by: uuid('valued_by')
      .notNull()
      .references(() => usersTable.id),
    electronic_signature: jsonb('electronic_signature'),
    journal_entry_id: uuid('journal_entry_id').references(() => journalEntriesTable.id),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
    updated_by: uuid('updated_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    baBatchIdx: index('ba_batch_idx').on(t.batch_id),
    baValuedAtIdx: index('ba_valued_at_idx').on(t.valued_at),
  }),
);

export const costAllocationsTable = pgTable(
  'cost_allocations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    batch_id: uuid('batch_id')
      .notNull()
      .references(() => batchesTable.id),
    cost_type: costTypeEnum('cost_type').notNull(),
    amount: decimal('amount', { precision: 18, scale: 2 }).notNull(),
    period: varchar('period', { length: 7 }).notNull(),
    allocation_basis: text('allocation_basis').notNull(),
    journal_entry_id: uuid('journal_entry_id').references(() => journalEntriesTable.id),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
    updated_by: uuid('updated_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    caBatchIdx: index('ca_batch_idx').on(t.batch_id),
    caPeriodIdx: index('ca_period_idx').on(t.period),
    caCostTypeIdx: index('ca_cost_type_idx').on(t.cost_type),
  }),
);

// ── Payroll Tables ────────────────────────────────────────────────────────────

export const payrollRunsTable = pgTable(
  'payroll_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    run_number: varchar('run_number', { length: 15 }).notNull().unique(),
    pay_period_start: timestamp('pay_period_start', { withTimezone: true }).notNull(),
    pay_period_end: timestamp('pay_period_end', { withTimezone: true }).notNull(),
    status: payrollRunStatusEnum('status').notNull().default('DRAFT'),
    total_gross: decimal('total_gross', { precision: 18, scale: 2 }).notNull().default('0.00'),
    total_deductions: decimal('total_deductions', { precision: 18, scale: 2 })
      .notNull()
      .default('0.00'),
    total_net: decimal('total_net', { precision: 18, scale: 2 }).notNull().default('0.00'),
    electronic_signature: jsonb('electronic_signature'),
    journal_entry_id: uuid('journal_entry_id').references(() => journalEntriesTable.id),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
    updated_by: uuid('updated_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    prRunNumberIdx: index('pr_run_number_idx').on(t.run_number),
    prStatusIdx: index('pr_status_idx').on(t.status),
  }),
);

export const payrollLinesTable = pgTable(
  'payroll_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    run_id: uuid('run_id')
      .notNull()
      .references(() => payrollRunsTable.id, { onDelete: 'cascade' }),
    employee_id: uuid('employee_id')
      .notNull()
      .references(() => usersTable.id),
    gross_pay: decimal('gross_pay', { precision: 18, scale: 2 }).notNull(),
    deductions: decimal('deductions', { precision: 18, scale: 2 }).notNull().default('0.00'),
    net_pay: decimal('net_pay', { precision: 18, scale: 2 }).notNull(),
    hours_worked: decimal('hours_worked', { precision: 8, scale: 2 }),
    notes: text('notes'),
  },
  (t) => ({
    plRunIdx: index('pl_run_idx').on(t.run_id),
    plEmployeeIdx: index('pl_employee_idx').on(t.employee_id),
  }),
);

// ── Procurement Tables ────────────────────────────────────────────────────────

export const suppliersTable = pgTable(
  'suppliers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    supplier_code: varchar('supplier_code', { length: 10 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    qualification_status: supplierQualificationStatusEnum('qualification_status')
      .notNull()
      .default('PROVISIONAL'),
    qualification_expiry: timestamp('qualification_expiry', { withTimezone: true }),
    contact_details: jsonb('contact_details').notNull().default('{}'),
    is_active: boolean('is_active').notNull().default(true),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
    updated_by: uuid('updated_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    supplierCodeIdx: index('supplier_code_idx').on(t.supplier_code),
    supplierQualIdx: index('supplier_qual_idx').on(t.qualification_status),
  }),
);

export const purchaseOrdersTable = pgTable(
  'purchase_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    po_number: varchar('po_number', { length: 20 }).notNull().unique(),
    supplier_id: uuid('supplier_id')
      .notNull()
      .references(() => suppliersTable.id),
    status: purchaseOrderStatusEnum('status').notNull().default('DRAFT'),
    total_value: decimal('total_value', { precision: 18, scale: 2 }).notNull().default('0.00'),
    currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
    expected_delivery_date: timestamp('expected_delivery_date', { withTimezone: true }),
    three_way_match_passed: boolean('three_way_match_passed'),
    electronic_signature: jsonb('electronic_signature'),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
    updated_by: uuid('updated_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    poNumberIdx: index('po_number_idx').on(t.po_number),
    poSupplierIdx: index('po_supplier_idx').on(t.supplier_id),
    poStatusIdx: index('po_status_idx').on(t.status),
  }),
);

export const poLinesTable = pgTable(
  'po_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    po_id: uuid('po_id')
      .notNull()
      .references(() => purchaseOrdersTable.id, { onDelete: 'cascade' }),
    line_number: integer('line_number').notNull(),
    item_description: text('item_description').notNull(),
    quantity: decimal('quantity', { precision: 18, scale: 3 }).notNull(),
    unit_price: decimal('unit_price', { precision: 18, scale: 2 }).notNull(),
    unit_of_measure: varchar('unit_of_measure', { length: 20 }).notNull(),
    received_quantity: decimal('received_quantity', { precision: 18, scale: 3 })
      .notNull()
      .default('0.000'),
    strain_id: uuid('strain_id').references(() => strainsTable.id),
  },
  (t) => ({
    polPoIdx: index('pol_po_idx').on(t.po_id),
    polUniqueLineIdx: uniqueIndex('pol_unique_line_idx').on(t.po_id, t.line_number),
    polStrainIdx: index('pol_strain_idx').on(t.strain_id),
  }),
);

export const receivingRecordsTable = pgTable(
  'receiving_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    grn_number: varchar('grn_number', { length: 20 }).notNull().unique(),
    po_id: uuid('po_id')
      .notNull()
      .references(() => purchaseOrdersTable.id),
    received_at: timestamp('received_at', { withTimezone: true }).notNull(),
    received_by: uuid('received_by')
      .notNull()
      .references(() => usersTable.id),
    quality_check_passed: boolean('quality_check_passed'),
    electronic_signature: jsonb('electronic_signature').notNull(),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
    updated_by: uuid('updated_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    grnNumberIdx: index('grn_number_idx').on(t.grn_number),
    grnPoIdx: index('grn_po_idx').on(t.po_id),
  }),
);

export const receivingLinesTable = pgTable(
  'receiving_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    grn_id: uuid('grn_id')
      .notNull()
      .references(() => receivingRecordsTable.id, { onDelete: 'cascade' }),
    po_line_id: uuid('po_line_id')
      .notNull()
      .references(() => poLinesTable.id),
    received_quantity: decimal('received_quantity', { precision: 18, scale: 3 }).notNull(),
    notes: text('notes'),
  },
  (t) => ({
    rlGrnIdx: index('rl_grn_idx').on(t.grn_id),
    rlPoLineIdx: index('rl_po_line_idx').on(t.po_line_id),
  }),
);

// ── Incoming Inspection Enums ─────────────────────────────────────────────────

export const incomingInspectionStatusEnum = pgEnum('incoming_inspection_status', [
  'PENDING',
  'IN_PROGRESS',
  'QUARANTINE',
  'RELEASED',
  'REJECTED',
]);

// ── Incoming Inspections Table ───────────────────────────────────────────────

export const incomingInspectionsTable = pgTable(
  'incoming_inspections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    inspection_number: varchar('inspection_number', { length: 20 }).notNull().unique(),
    grn_id: uuid('grn_id')
      .notNull()
      .references(() => receivingRecordsTable.id),
    po_id: uuid('po_id')
      .notNull()
      .references(() => purchaseOrdersTable.id),
    supplier_id: uuid('supplier_id')
      .notNull()
      .references(() => suppliersTable.id),
    strain_id: uuid('strain_id').references(() => strainsTable.id),
    status: incomingInspectionStatusEnum('status').notNull().default('PENDING'),
    // Visual & quantitative inspection
    visual_check_passed: boolean('visual_check_passed'),
    quantity_verified: boolean('quantity_verified'),
    quality_assessment_notes: text('quality_assessment_notes'),
    // Lab test results
    dna_fingerprint_passed: boolean('dna_fingerprint_passed'),
    cannabinoid_profile_passed: boolean('cannabinoid_profile_passed'),
    pathogen_screening_passed: boolean('pathogen_screening_passed'),
    germination_rate: decimal('germination_rate', { precision: 5, scale: 2 }),
    // Quarantine tracking
    quarantine_days_required: integer('quarantine_days_required').notNull().default(7),
    quarantine_start_date: timestamp('quarantine_start_date', { withTimezone: true }),
    quarantine_end_date: timestamp('quarantine_end_date', { withTimezone: true }),
    // Disposition
    disposition_decision: varchar('disposition_decision', { length: 20 }),
    disposition_reason: text('disposition_reason'),
    electronic_signature: jsonb('electronic_signature'),
    // GxP Validation fields
    validation_status: qualityValidationStatusEnum('validation_status')
      .notNull()
      .default('unvalidated'),
    validation_protocol_id: uuid('validation_protocol_id'),
    last_validated_at: timestamp('last_validated_at', { withTimezone: true }),
    next_review_date: text('next_review_date'),
    retention_class: retentionClassEnum('retention_class').notNull().default('7_YEAR'),
    audit_tx_id: varchar('audit_tx_id', { length: 200 }),
    // Audit
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
    updated_by: uuid('updated_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    iiStatusIdx: index('ii_status_idx').on(t.status),
    iiGrnIdx: index('ii_grn_idx').on(t.grn_id),
    iiPoIdx: index('ii_po_idx').on(t.po_id),
    iiSupplierIdx: index('ii_supplier_idx').on(t.supplier_id),
    iiStrainIdx: index('ii_strain_idx').on(t.strain_id),
  }),
);

// ── Spatial Tables ────────────────────────────────────────────────────────────

export const facilityZonesTable = pgTable(
  'facility_zones',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    zone_code: varchar('zone_code', { length: 20 }).notNull().unique(),
    zone_name: varchar('zone_name', { length: 255 }).notNull(),
    zone_type: facilityZoneTypeEnum('zone_type').notNull(),
    area_sqm: decimal('area_sqm', { precision: 10, scale: 2 }),
    capacity: integer('capacity'),
    parent_zone_id: uuid('parent_zone_id'),
    is_active: boolean('is_active').notNull().default(true),
    current_occupancy: integer('current_occupancy').notNull().default(0),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
    updated_by: uuid('updated_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    fzCodeIdx: index('fz_code_idx').on(t.zone_code),
    fzTypeIdx: index('fz_type_idx').on(t.zone_type),
  }),
);

export const zoneAssignmentsTable = pgTable(
  'zone_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    zone_id: uuid('zone_id')
      .notNull()
      .references(() => facilityZonesTable.id),
    batch_id: uuid('batch_id')
      .notNull()
      .references(() => batchesTable.id),
    assigned_at: timestamp('assigned_at', { withTimezone: true }).notNull(),
    assigned_by: uuid('assigned_by')
      .notNull()
      .references(() => usersTable.id),
    released_at: timestamp('released_at', { withTimezone: true }),
    released_by: uuid('released_by').references(() => usersTable.id),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
    updated_by: uuid('updated_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    zaZoneIdx: index('za_zone_idx').on(t.zone_id),
    zaBatchIdx: index('za_batch_idx').on(t.batch_id),
    zaActiveIdx: index('za_active_idx').on(t.batch_id, t.released_at),
  }),
);

// ─── Spatial Hierarchy Tables (Racks, Shelves, Trays) ────────────────────────

/** Rack type: physical shelf configuration */
export const rackTypeEnum = pgEnum('rack_type_enum', ['1-shelf', '2-shelf', '3-shelf', 'custom']);

/** Tray size for plants */
export const traySizeEnum = pgEnum('tray_size_enum', ['small', 'medium', 'large', 'custom']);

/** Spatial entity types for addressing */
export const spatialEntityTypeEnum = pgEnum('spatial_entity_type_enum', [
  'facility',
  'zone',
  'rack',
  'shelf',
  'tray',
  'plant',
]);

export const racksTable = pgTable(
  'racks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    zone_id: uuid('zone_id')
      .notNull()
      .references(() => facilityZonesTable.id, { onDelete: 'restrict' }),

    rack_code: varchar('rack_code', { length: 20 }).notNull(),
    rack_type: rackTypeEnum('rack_type').notNull(),
    shelf_count: integer('shelf_count').notNull(),

    // Position in zone (grid coordinates)
    row_position: integer('row_position'),
    column_position: integer('column_position'),

    // 3D coordinates
    coordinates: jsonb('coordinates'),

    max_tray_capacity: integer('max_tray_capacity'),
    supported_tray_sizes: text('supported_tray_sizes')
      .array()
      .default(sql`ARRAY['small', 'medium', 'large']`),

    qr_code: varchar('qr_code', { length: 255 }).unique(),

    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    rackZoneIdx: index('racks_zone_idx').on(t.zone_id),
    rackCodeIdx: index('racks_code_idx').on(t.rack_code),
    rackZonePositionIdx: index('racks_zone_position_idx').on(
      t.zone_id,
      t.row_position,
      t.column_position,
    ),
    rackZoneCodeUnique: uniqueIndex('racks_zone_code_unique').on(t.zone_id, t.rack_code),
  }),
);

export const shelvesTable = pgTable(
  'shelves',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    rack_id: uuid('rack_id')
      .notNull()
      .references(() => racksTable.id, { onDelete: 'cascade' }),

    shelf_index: integer('shelf_index').notNull(),
    height_from_floor: decimal('height_from_floor', { precision: 8, scale: 2 }),

    max_trays: integer('max_trays'),
    occupied_positions: integer('occupied_positions').notNull().default(0),

    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    shelfRackIdx: index('shelves_rack_idx').on(t.rack_id),
    shelfRackIndexUnique: uniqueIndex('shelves_rack_index_unique').on(t.rack_id, t.shelf_index),
  }),
);

export const traysTable = pgTable(
  'trays',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    rack_id: uuid('rack_id')
      .notNull()
      .references(() => racksTable.id, { onDelete: 'cascade' }),

    shelf_index: integer('shelf_index').notNull(),
    position_index: integer('position_index').notNull(),

    tray_code: varchar('tray_code', { length: 30 }).notNull(),
    tray_size: traySizeEnum('tray_size').notNull(),
    plant_capacity: integer('plant_capacity'),

    // Grid layout: {rows: number, cols: number, spacing: number, pattern: string}
    plant_layout: jsonb('plant_layout'),

    occupied_slots: integer('occupied_slots').notNull().default(0),
    qr_code: varchar('qr_code', { length: 255 }).unique(),

    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    trayRackIdx: index('trays_rack_idx').on(t.rack_id),
    trayCodeIdx: index('trays_code_idx').on(t.tray_code),
    trayRackShelfIdx: index('trays_rack_shelf_idx').on(t.rack_id, t.shelf_index),
    trayRackPositionUnique: uniqueIndex('trays_rack_position_unique').on(
      t.rack_id,
      t.shelf_index,
      t.position_index,
    ),
  }),
);

export const spatialAddressesTable = pgTable(
  'spatial_addresses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    entity_id: uuid('entity_id').notNull().unique(),
    entity_type: spatialEntityTypeEnum('entity_type').notNull(),

    // Hierarchical address components
    spatial_address: varchar('spatial_address', { length: 200 }).unique(),

    facility_code: varchar('facility_code', { length: 10 }),
    zone_code: varchar('zone_code', { length: 20 }),
    subzone_code: varchar('subzone_code', { length: 20 }),
    rack_code: varchar('rack_code', { length: 20 }),
    shelf_index: integer('shelf_index'),
    tray_position: integer('tray_position'),
    plant_slot: integer('plant_slot'),

    // 3D coordinates
    coordinates: jsonb('coordinates'),

    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    saEntityIdx: index('spatial_addresses_entity_idx').on(t.entity_type, t.entity_id),
    saHierarchicalIdx: index('spatial_addresses_hierarchical_idx').on(
      t.facility_code,
      t.zone_code,
      t.rack_code,
    ),
  }),
);

// ═══════════════════════════════════════════════════════════════════════════════
// EPIC 9 — WORKFORCE, TRAINING & DOCUMENT CONTROL
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Enums ────────────────────────────────────────────────────────────────────

export const taskPriorityEnum = pgEnum('task_priority', ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);

export const taskStatusEnum = pgEnum('task_status', [
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'OVERDUE',
]);

export const timeEntrySourceEnum = pgEnum('time_entry_source', [
  'MANUAL',
  'MOBILE',
  'SYSTEM',
  'BIOMETRIC',
]);

export const trainingTypeEnum = pgEnum('training_type', [
  'INITIAL',
  'REFRESHER',
  'GMP',
  'SAFETY',
  'ROLE_SPECIFIC',
  'COMPLIANCE',
  'SOP',
]);

export const trainingStatusEnum = pgEnum('training_status', [
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'EXPIRED',
]);

export const documentStatusEnum = pgEnum('document_status', [
  'DRAFT',
  'UNDER_REVIEW',
  'APPROVED',
  'ACTIVE',
  'SUPERSEDED',
  'DEPRECATED',
  'ARCHIVED',
]);

export const documentTypeEnum = pgEnum('document_type', [
  'SOP',
  'WORK_INSTRUCTION',
  'POLICY',
  'FORM',
  'REPORT',
  'CERTIFICATE',
  'BATCH_RECORD',
  'AUDIT_REPORT',
  'CAPA',
  'OTHER',
]);

// ─── Employees ────────────────────────────────────────────────────────────────

export const employeesTable = pgTable(
  'employees',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').references(() => usersTable.id),
    employee_number: varchar('employee_number', { length: 20 }).notNull().unique(),
    first_name: varchar('first_name', { length: 100 }).notNull(),
    last_name: varchar('last_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    phone: varchar('phone', { length: 30 }),
    department: varchar('department', { length: 100 }).notNull(),
    job_title: varchar('job_title', { length: 150 }).notNull(),
    role: varchar('role', { length: 100 }).notNull(),
    hire_date: varchar('hire_date', { length: 10 }).notNull(),
    is_active: boolean('is_active').notNull().default(true),
    competency_profile_id: uuid('competency_profile_id'),
    metadata: jsonb('metadata').default({}),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
    updated_by: uuid('updated_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    empNumberIdx: uniqueIndex('emp_number_idx').on(t.employee_number),
    empEmailIdx: uniqueIndex('emp_email_idx').on(t.email),
    empDeptIdx: index('emp_dept_idx').on(t.department),
    empActiveIdx: index('emp_active_idx').on(t.is_active),
  }),
);

// ─── Tasks ────────────────────────────────────────────────────────────────────

export const tasksTable = pgTable(
  'tasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    task_number: varchar('task_number', { length: 30 }).notNull().unique(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    task_type: varchar('task_type', { length: 100 }).notNull(),
    priority: taskPriorityEnum('priority').notNull().default('MEDIUM'),
    status: taskStatusEnum('status').notNull().default('PENDING'),
    zone_id: uuid('zone_id'),
    batch_id: uuid('batch_id').references(() => batchesTable.id),
    scheduled_date: varchar('scheduled_date', { length: 10 }).notNull(),
    scheduled_start: varchar('scheduled_start', { length: 5 }),
    scheduled_end: varchar('scheduled_end', { length: 5 }),
    actual_start: timestamp('actual_start', { withTimezone: true }),
    actual_end: timestamp('actual_end', { withTimezone: true }),
    estimated_minutes: integer('estimated_minutes'),
    sop_reference: varchar('sop_reference', { length: 50 }),
    instructions: text('instructions'),
    completion_notes: text('completion_notes'),
    photo_urls: jsonb('photo_urls').default([]),
    signature: jsonb('signature'),
    metadata: jsonb('metadata').default({}),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
    updated_by: uuid('updated_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    taskNumberIdx: uniqueIndex('task_number_idx').on(t.task_number),
    taskStatusIdx: index('task_status_idx').on(t.status),
    taskScheduledIdx: index('task_scheduled_idx').on(t.scheduled_date),
    taskPriorityIdx: index('task_priority_idx').on(t.priority),
    taskBatchIdx: index('task_batch_idx').on(t.batch_id),
    taskZoneIdx: index('task_zone_idx').on(t.zone_id),
  }),
);

// ─── Task Assignments ─────────────────────────────────────────────────────────

export const taskAssignmentsTable = pgTable(
  'task_assignments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    task_id: uuid('task_id')
      .notNull()
      .references(() => tasksTable.id),
    employee_id: uuid('employee_id')
      .notNull()
      .references(() => employeesTable.id),
    assigned_at: timestamp('assigned_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    assigned_by: uuid('assigned_by')
      .notNull()
      .references(() => usersTable.id),
    acknowledged_at: timestamp('acknowledged_at', { withTimezone: true }),
    is_lead: boolean('is_lead').notNull().default(false),
  },
  (t) => ({
    taTaskIdx: index('ta_task_idx').on(t.task_id),
    taEmployeeIdx: index('ta_employee_idx').on(t.employee_id),
    taUniqueIdx: uniqueIndex('ta_unique_idx').on(t.task_id, t.employee_id),
  }),
);

// ─── Time Entries ─────────────────────────────────────────────────────────────

export const timeEntriesTable = pgTable(
  'time_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    employee_id: uuid('employee_id')
      .notNull()
      .references(() => employeesTable.id),
    task_id: uuid('task_id').references(() => tasksTable.id),
    clock_in: timestamp('clock_in', { withTimezone: true }).notNull(),
    clock_out: timestamp('clock_out', { withTimezone: true }),
    duration_minutes: integer('duration_minutes').generatedAlwaysAs(
      sql`EXTRACT(EPOCH FROM (clock_out - clock_in)) / 60`,
    ),
    source: timeEntrySourceEnum('source').notNull().default('MANUAL'),
    notes: text('notes'),
    approved_by: uuid('approved_by').references(() => usersTable.id),
    approved_at: timestamp('approved_at', { withTimezone: true }),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
    updated_by: uuid('updated_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    teEmployeeIdx: index('te_employee_idx').on(t.employee_id),
    teTaskIdx: index('te_task_idx').on(t.task_id),
    teDateIdx: index('te_date_idx').on(t.clock_in),
  }),
);

// ─── Shift Schedules ──────────────────────────────────────────────────────────

export const shiftSchedulesTable = pgTable(
  'shift_schedules',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    employee_id: uuid('employee_id')
      .notNull()
      .references(() => employeesTable.id),
    shift_date: varchar('shift_date', { length: 10 }).notNull(),
    shift_start: varchar('shift_start', { length: 5 }).notNull(),
    shift_end: varchar('shift_end', { length: 5 }).notNull(),
    zone_id: uuid('zone_id'),
    notes: text('notes'),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    ssEmployeeIdx: index('ss_employee_idx').on(t.employee_id),
    ssDateIdx: index('ss_date_idx').on(t.shift_date),
  }),
);

// ─── Training Courses ─────────────────────────────────────────────────────────

export const trainingCoursesTable = pgTable(
  'training_courses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    course_id: varchar('course_id', { length: 20 }).notNull().unique(),
    title: varchar('title', { length: 255 }).notNull(),
    description: text('description'),
    training_type: trainingTypeEnum('training_type').notNull(),
    duration_minutes: integer('duration_minutes').notNull(),
    passing_score: integer('passing_score').notNull().default(80),
    validity_months: integer('validity_months'),
    is_mandatory: boolean('is_mandatory').notNull().default(false),
    applicable_roles: jsonb('applicable_roles').notNull().default([]),
    sop_references: jsonb('sop_references').notNull().default([]),
    regulatory_references: jsonb('regulatory_references').notNull().default([]),
    content_url: varchar('content_url', { length: 500 }),
    version: varchar('version', { length: 20 }).notNull().default('1.0'),
    is_active: boolean('is_active').notNull().default(true),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
    updated_by: uuid('updated_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    tcCourseIdIdx: uniqueIndex('tc_course_id_idx').on(t.course_id),
    tcTypeIdx: index('tc_type_idx').on(t.training_type),
    tcActiveIdx: index('tc_active_idx').on(t.is_active),
  }),
);

// ─── Curriculum ───────────────────────────────────────────────────────────────

export const curriculumTable = pgTable(
  'curriculum',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    role: varchar('role', { length: 100 }).notNull(),
    course_id: uuid('course_id')
      .notNull()
      .references(() => trainingCoursesTable.id),
    is_required: boolean('is_required').notNull().default(true),
    sequence_order: integer('sequence_order'),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    curRoleIdx: index('cur_role_idx').on(t.role),
    curCourseIdx: index('cur_course_idx').on(t.course_id),
    curUniqueIdx: uniqueIndex('cur_unique_idx').on(t.role, t.course_id),
  }),
);

// ─── Competency Profiles ──────────────────────────────────────────────────────

export const competencyProfilesTable = pgTable(
  'competency_profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    employee_id: uuid('employee_id')
      .notNull()
      .references(() => employeesTable.id)
      .unique(),
    overall_compliance: integer('overall_compliance').notNull().default(0),
    last_assessed: timestamp('last_assessed', { withTimezone: true }),
    competencies: jsonb('competencies').notNull().default([]),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
    updated_by: uuid('updated_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    cpEmployeeIdx: uniqueIndex('cp_employee_idx').on(t.employee_id),
    cpComplianceIdx: index('cp_compliance_idx').on(t.overall_compliance),
  }),
);

// ─── Training Executions ──────────────────────────────────────────────────────

export const trainingExecutionsTable = pgTable(
  'training_executions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    course_id: uuid('course_id')
      .notNull()
      .references(() => trainingCoursesTable.id),
    employee_id: uuid('employee_id')
      .notNull()
      .references(() => employeesTable.id),
    trainer_id: uuid('trainer_id').references(() => employeesTable.id),
    status: trainingStatusEnum('status').notNull().default('SCHEDULED'),
    scheduled_date: varchar('scheduled_date', { length: 10 }).notNull(),
    completed_date: varchar('completed_date', { length: 10 }),
    score: integer('score'),
    passed: boolean('passed'),
    expiry_date: varchar('expiry_date', { length: 10 }),
    attempts: integer('attempts').notNull().default(0),
    notes: text('notes'),
    signature: jsonb('signature'),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
    updated_by: uuid('updated_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    teExCourseIdx: index('tex_course_idx').on(t.course_id),
    teExEmployeeIdx: index('tex_employee_idx').on(t.employee_id),
    teExStatusIdx: index('tex_status_idx').on(t.status),
    teExScheduledIdx: index('tex_scheduled_idx').on(t.scheduled_date),
  }),
);

// ─── Certifications ───────────────────────────────────────────────────────────

export const certificationsTable = pgTable(
  'certifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    certificate_number: varchar('certificate_number', { length: 30 }).notNull().unique(),
    employee_id: uuid('employee_id')
      .notNull()
      .references(() => employeesTable.id),
    course_id: uuid('course_id')
      .notNull()
      .references(() => trainingCoursesTable.id),
    execution_id: uuid('execution_id')
      .notNull()
      .references(() => trainingExecutionsTable.id),
    issued_date: varchar('issued_date', { length: 10 }).notNull(),
    expiry_date: varchar('expiry_date', { length: 10 }),
    is_active: boolean('is_active').notNull().default(true),
    issued_by: uuid('issued_by')
      .notNull()
      .references(() => usersTable.id),
    revoked_at: timestamp('revoked_at', { withTimezone: true }),
    revoked_by: uuid('revoked_by').references(() => usersTable.id),
    revocation_reason: text('revocation_reason'),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    certNumberIdx: uniqueIndex('cert_number_idx').on(t.certificate_number),
    certEmployeeIdx: index('cert_employee_idx').on(t.employee_id),
    certCourseIdx: index('cert_course_idx').on(t.course_id),
    certActiveIdx: index('cert_active_idx').on(t.is_active),
    certExpiryIdx: index('cert_expiry_idx').on(t.expiry_date),
  }),
);

// ─── Documents ────────────────────────────────────────────────────────────────

export const documentsTable = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    document_number: varchar('document_number', { length: 30 }).notNull().unique(),
    title: varchar('title', { length: 255 }).notNull(),
    document_type: documentTypeEnum('document_type').notNull(),
    status: documentStatusEnum('status').notNull().default('DRAFT'),
    description: text('description'),
    tags: jsonb('tags').notNull().default([]),
    mayan_document_id: integer('mayan_document_id'),
    current_version_id: uuid('current_version_id'),
    owner_id: uuid('owner_id')
      .notNull()
      .references(() => usersTable.id),
    reviewer_id: uuid('reviewer_id').references(() => usersTable.id),
    approver_id: uuid('approver_id').references(() => usersTable.id),
    approved_at: timestamp('approved_at', { withTimezone: true }),
    next_review_date: varchar('next_review_date', { length: 10 }),
    metadata: jsonb('metadata').default({}),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    created_by: uuid('created_by')
      .notNull()
      .references(() => usersTable.id),
    updated_by: uuid('updated_by')
      .notNull()
      .references(() => usersTable.id),
  },
  (t) => ({
    docNumberIdx: uniqueIndex('doc_number_idx').on(t.document_number),
    docTypeIdx: index('doc_type_idx').on(t.document_type),
    docStatusIdx: index('doc_status_idx').on(t.status),
    docOwnerIdx: index('doc_owner_idx').on(t.owner_id),
    docMayanIdx: index('doc_mayan_idx').on(t.mayan_document_id),
  }),
);

// ─── Document Versions ────────────────────────────────────────────────────────

export const documentVersionsTable = pgTable(
  'document_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    document_id: uuid('document_id')
      .notNull()
      .references(() => documentsTable.id),
    version_number: varchar('version_number', { length: 20 }).notNull(),
    change_summary: text('change_summary').notNull(),
    file_path: varchar('file_path', { length: 500 }),
    file_hash: varchar('file_hash', { length: 128 }),
    mayan_version_id: integer('mayan_version_id'),
    authored_by: uuid('authored_by')
      .notNull()
      .references(() => usersTable.id),
    approved_by: uuid('approved_by').references(() => usersTable.id),
    approved_at: timestamp('approved_at', { withTimezone: true }),
    signature: jsonb('signature'),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    dvDocumentIdx: index('dv_document_idx').on(t.document_id),
    dvVersionIdx: index('dv_version_idx').on(t.document_id, t.version_number),
  }),
);
