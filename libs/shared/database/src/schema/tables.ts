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
  'harvest',
  'destruction',
  'observation',
]);

/** Audit trail operations — INSERT only in production (DS-DI-002) */
export const auditOperationEnum = pgEnum('audit_operation', ['INSERT', 'UPDATE', 'DELETE']);

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

// ── Rooms ─────────────────────────────────────────────────────────────────────

export const roomsTable = pgTable(
  'rooms',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    facility_id: uuid('facility_id')
      .notNull()
      .references(() => facilitiesTable.id),
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
    facilityRoomCodeIdx: uniqueIndex('rooms_facility_code_idx').on(t.facility_id, t.room_code),
    facilityIdx: index('rooms_facility_idx').on(t.facility_id),
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
    keycloak_id: varchar('keycloak_id', { length: 36 }).notNull(),
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

export const strainsTable = pgTable(
  'strains',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    code: varchar('code', { length: 50 }).notNull(),
    description: text('description'),
    genetics: varchar('genetics', { length: 255 }),
    thc_percentage_min: decimal('thc_percentage_min', { precision: 5, scale: 2 }),
    thc_percentage_max: decimal('thc_percentage_max', { precision: 5, scale: 2 }),
    cbd_percentage_min: decimal('cbd_percentage_min', { precision: 5, scale: 2 }),
    cbd_percentage_max: decimal('cbd_percentage_max', { precision: 5, scale: 2 }),
    flowering_time_days_min: integer('flowering_time_days_min'),
    flowering_time_days_max: integer('flowering_time_days_max'),
    expected_yield_g_per_plant: decimal('expected_yield_g_per_plant', { precision: 8, scale: 2 }),
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
    codeIdx: uniqueIndex('strains_code_idx').on(t.code),
  }),
);

// ── Batches (DS-PLM-003) ───────────────────────────────────────────────────────

export const batchesTable = pgTable(
  'batches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    batch_number: varchar('batch_number', { length: 50 }).notNull(),
    parent_batch_id: uuid('parent_batch_id'),
    strain_id: uuid('strain_id')
      .notNull()
      .references(() => strainsTable.id),
    status: batchStatusEnum('status').notNull().default('PLANNED'),
    compliance_status: complianceStatusEnum('compliance_status').notNull().default('pending'),
    facility_id: uuid('facility_id')
      .notNull()
      .references(() => facilitiesTable.id),
    zone_id: uuid('zone_id').references(() => zonesTable.id),
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
    facility_id: uuid('facility_id')
      .notNull()
      .references(() => facilitiesTable.id),
    room_id: uuid('room_id').references(() => roomsTable.id),
    zone_id: uuid('zone_id').references(() => zonesTable.id),
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
    facilityZoneIdx: index('plants_facility_zone_idx').on(t.facility_id, t.zone_id),
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
