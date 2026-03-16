# GACP-ERP — EPIC 5–9 Implementation Plan

## Context

- **Stack**: TypeScript (NestJS, Next.js, NX), Go (audit-consumer), PostgreSQL, Redis, Kafka, Keycloak, ImmuDB, Telegraf, EMQX, VictoriaMetrics
- **Environment**: Local Docker Compose
- **Team**: AI + one developer
- **Scope**: EPIC 5–9 per Roadmap v3.0 (DS v2.0 Compliance Modules)
- **Principles**: Zod-First, Schema-First API (ts-rest), NX monorepo, Compliance (FDA 21 CFR Part 11, EU GMP Annex 11, ALCOA+, GAMP 5)
- **Prerequisites**: EPIC 0–4 completed (Foundation, Contracts, Auth, Plant Lifecycle, Audit Trail)

---

## EPIC 5 — IoT & Environmental Monitoring

> **No new microservice** — Telegraf replaces a custom Go IoT consumer via declarative config.

### Step 5.1 — Docker Compose Extensions

Add to `docker/docker-compose.yml`:

- `emqx/emqx:5` — MQTT broker (ports 1883 MQTT, 18083 dashboard)
- `telegraf:1.30` — IoT collector with bind-mount `docker/telegraf/telegraf.conf`
- `victoriametrics-iot` — separate VictoriaMetrics instance (port 8429)

### Step 5.2 — Telegraf Configuration

Create `docker/telegraf/telegraf.conf`:

```toml
[agent]
  interval = "10s"
  flush_interval = "10s"

[[inputs.mqtt_consumer]]
  servers = ["tcp://emqx:1883"]
  topics = ["gacp/sensors/#"]
  data_format = "json"
  # Tag extraction: gacp/sensors/{zone_id}/{sensor_type}
  topic_tag = "full_topic"

[[inputs.internal]]
  collect_memstats = false

[[outputs.http]]
  url = "http://victoriametrics-iot:8428/api/v1/write"
  data_format = "prometheusremotewrite"
```

### Step 5.3 — IoT Zod Schemas

`libs/shared/schemas/src/iot/`:

- `SensorReadingSchema` — `zone_id`, `sensor_id`, `sensor_type` (TEMPERATURE | HUMIDITY | CO2 | LIGHT | IRRIGATION), `value`, `unit`, `recorded_at`, `source_hash` (SHA-256)
- `EnvironmentDataSchema` — aggregated zone snapshot: `zone_id`, `readings[]`, `summary_at`
- `AlertThresholdSchema` — `zone_id`, `sensor_type`, `min_value`, `max_value`, `alert_level` (WARNING | CRITICAL), `created_by`, `active`

All schemas extend `BaseEntitySchema`, include ALCOA+ metadata fields.

### Step 5.4 — IoT Kafka Events

`libs/shared/events/src/iot.events.ts` (Zod discriminated union on `eventType`):

- `AlertTriggeredEvent` — `eventType: "iot.alert.triggered"`, `zone_id`, `sensor_type`, `value`, `threshold_id`, `alert_level`
- `ThresholdBreachedEvent` — `eventType: "iot.threshold.breached"`, details + ALCOA+ metadata

Topic: `iot.alerts.v1`

> Sensor readings flow directly via Telegraf → VictoriaMetrics IoT. Only alert events go to Kafka.

### Step 5.5 — IoT API Contract

`libs/shared/contracts/src/iot.contract.ts` (ts-rest):

- `GET /iot/zones/:zoneId/readings` — proxy to VictoriaMetrics instant query API
- `GET /iot/zones/:zoneId/history` — range query with `from` / `to` params
- `GET /iot/alerts` — paginated alert history from PostgreSQL
- `POST /iot/thresholds` — create threshold (AuditLevel: FULL)
- `GET /iot/thresholds` — list thresholds by zone
- `DELETE /iot/thresholds/:id` — deactivate threshold

### Step 5.6 — IotModule in api-gateway

Add `IotModule` to `apps/api-gateway/src/`:

- `ThresholdService` — CRUD for `alert_thresholds` PostgreSQL table (DrizzleORM)
- `AlertEvaluationService` — `@Cron('*/1 * * * *')` scheduled job:
  1. Fetch active thresholds from DB
  2. Query VictoriaMetrics IoT instant query per threshold
  3. On breach: publish `AlertTriggeredEvent` to `iot.alerts.v1` Kafka topic
  4. Store alert in `alert_history` table
- DB migration `002_iot.sql`: `alert_thresholds`, `alert_history`

### Step 5.7 — IoT Frontend Dashboard

`apps/web-portal/src/app/(protected)/iot/`:

- `page.tsx` — zone selector + real-time sensor cards (polling `/iot/zones/:id/readings` every 30s)
- `[zoneId]/page.tsx` — zone detail: time-series chart (recharts), threshold indicators, alert history table
- Roles: all authenticated users can view; only QUALITY_MANAGER+ can manage thresholds

### Step 5.8 — Verification

```bash
# Publish test sensor reading
mosquitto_pub -h localhost -p 1883 \
  -t "gacp/sensors/zone-1/temperature" \
  -m '{"value":32.5,"unit":"celsius","sensor_id":"s-001","recorded_at":"2026-03-16T10:00:00Z"}'

# Query VictoriaMetrics IoT
curl "http://localhost:8429/api/v1/query?query=gacp_sensors_value{sensor_type='temperature'}"

# Create threshold, trigger alert
curl -X POST http://localhost:3000/api/iot/thresholds \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"zone_id":"zone-1","sensor_type":"TEMPERATURE","max_value":30,"alert_level":"CRITICAL"}'
```

---

## EPIC 6 — Quality Management: Change Control, CAPA, Deviations

### Step 6.1 — quality-service Scaffold

Create `apps/quality-service/` via NX generator (`complianceLevel: HIGH`, `withAuditTrail: true`, `withObservability: true`):

```bash
nx g @nx/nest:application quality-service --directory=apps/quality-service
```

### Step 6.2 — GxP Validation Fields Mixin

`libs/shared/schemas/src/common/gxp-validation.schema.ts`:

```typescript
export const GxpValidationFieldsSchema = z.object({
  validation_status: z.enum(['unvalidated', 'validated', 'under_review', 'superseded']),
  validation_protocol_id: z.string().uuid().nullable(),
  last_validated_at: z.string().datetime().nullable(),
  next_review_date: z.string().date().nullable(),
  retention_class: z.enum(['PERMANENT', '7_YEAR', '30_YEAR']),
  audit_tx_id: z.string().nullable(), // ImmuDB TX-id
});
```

### Step 6.3 — Quality Domain Schemas

`libs/shared/schemas/src/quality/`:

- `ChangeControlSchema` — `id`, `ccn_number` (CCN-YYYY-NNNN), `title`, `description`, `change_type` (MINOR | MAJOR | EMERGENCY), `status` (DRAFT | SUBMITTED | IMPACT_ASSESSED | APPROVED | IMPLEMENTING | VERIFIED | CLOSED), `requestor_id`, `approvers[]`, `electronic_signature JSONB`, GxpValidationFieldsMixin
- `CAPASchema` — `id`, `capa_number` (CA-YYYY-NNNN), `type` (CORRECTIVE | PREVENTIVE), `source` (DEVIATION | AUDIT | COMPLAINT | TREND), `status` (OPEN | RCA_IN_PROGRESS | ACTION_PLAN | IMPLEMENTING | EFFECTIVENESS_CHECK | CLOSED), `root_cause_category`, GxpValidationFieldsMixin
- `DeviationSchema` — `id`, `deviation_number` (DEV-YYYY-NNNN), `classification` (MINOR | MAJOR | CRITICAL), `category` (PROCESS | EQUIPMENT | MATERIAL | ENVIRONMENTAL | DOCUMENTATION), `status` (REPORTED | UNDER_INVESTIGATION | IMPACT_ASSESSED | CAPA_INITIATED | CLOSED), GxpValidationFieldsMixin

### Step 6.4 — Database Migrations

`libs/shared/database/src/migrations/`:

**`003_change_controls.sql`**:

```sql
CREATE TYPE change_control_status AS ENUM (
  'DRAFT','SUBMITTED','IMPACT_ASSESSED','APPROVED','IMPLEMENTING','VERIFIED','CLOSED'
);
CREATE TABLE change_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ccn_number VARCHAR(20) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('MINOR','MAJOR','EMERGENCY')),
  status change_control_status NOT NULL DEFAULT 'DRAFT',
  requestor_id UUID NOT NULL REFERENCES users(id),
  electronic_signature JSONB,
  validation_status VARCHAR(20) NOT NULL DEFAULT 'unvalidated',
  validation_protocol_id UUID,
  retention_class VARCHAR(20) NOT NULL DEFAULT '7_YEAR',
  audit_tx_id VARCHAR(200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL
);
CREATE TABLE change_impacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_control_id UUID NOT NULL REFERENCES change_controls(id),
  area VARCHAR(100) NOT NULL,
  impact_description TEXT NOT NULL,
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  assessed_by UUID NOT NULL,
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE change_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_control_id UUID NOT NULL REFERENCES change_controls(id),
  approver_id UUID NOT NULL,
  approval_level INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('PENDING','APPROVED','REJECTED')),
  electronic_signature JSONB NOT NULL,
  decided_at TIMESTAMPTZ
);
```

**`004_capas.sql`** — `capas`, `rca_findings`, `effectiveness_checks` (analogous structure)

**`005_deviations.sql`** — `deviations`, `deviation_investigations` (analogous structure)

All tables include: `electronic_signature JSONB`, `audit_tx_id VARCHAR(200)`, `validation_status`, `retention_class`.

### Step 6.5 — Kafka Events

`libs/shared/events/src/quality.events.ts` (Zod discriminated union, 19 topics unified under 3):

| Topic                  | Events                                                                                                                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `quality.change.v1`    | `ChangeRequestedEvent`, `ChangeSubmittedEvent`, `ChangeImpactAssessedEvent`, `ChangeApprovedEvent`, `ChangeRejectedEvent`, `ChangeImplementedEvent`, `ChangeVerifiedEvent`, `ChangeClosedEvent` |
| `quality.capa.v1`      | `CapaInitiatedEvent`, `RcaCompletedEvent`, `ActionPlanCreatedEvent`, `CapaImplementedEvent`, `EffectivenessCheckCompletedEvent`, `CapaClosedEvent`                                              |
| `quality.deviation.v1` | `DeviationReportedEvent`, `DeviationInvestigatedEvent`, `DeviationImpactAssessedEvent`, `CapaLinkedEvent`, `DeviationClosedEvent`                                                               |

### Step 6.6 — API Contract

`libs/shared/contracts/src/quality.contract.ts` (ts-rest):

**Change Control**:

- `POST /quality/change-controls` — create (AuditLevel: FULL, roles: QUALITY_MANAGER+)
- `GET /quality/change-controls` — paginated list with filters
- `GET /quality/change-controls/:id`
- `POST /quality/change-controls/:id/submit`
- `POST /quality/change-controls/:id/assess-impact`
- `POST /quality/change-controls/:id/approve` — requires electronic signature re-challenge
- `POST /quality/change-controls/:id/implement`
- `POST /quality/change-controls/:id/verify`
- `POST /quality/change-controls/:id/close`

**CAPA** (analogous workflow endpoints)

**Deviations** (analogous workflow endpoints)

### Step 6.7 — Domain Implementation

`apps/quality-service/src/`:

- `ChangeControlWorkflowEngine` — state machine enforcing allowed transitions, throws `InvalidTransitionError` on illegal state changes; returns new immutable aggregate (no mutation)
- `CAPAAggregate` — immutable, `assignRCA(findings)`, `verifyEffectiveness(result)` each return new object
- `DeviationAggregate` — `classify()`, `investigate()`, `linkCapa()` — immutable pattern
- All use-cases: write to DB → publish domain event to Kafka (transactional outbox via `outbox_events` table + scheduled dispatcher)

### Step 6.8 — Electronic Signatures Integration

Reuse `SignatureModule` from `apps/api-gateway/`:

- Workflow endpoints that require signatures (`/approve`, `/implement`, `/verify`) call `POST /signatures/create` before state transition
- Signature TX-id stored in `electronic_signature JSONB` column
- Verified via `POST /signatures/verify` in audit flow

### Step 6.9 — Verification

```bash
# Create Change Control
curl -X POST http://localhost:3000/api/quality/change-controls \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Update irrigation SOP","change_type":"MINOR","description":"..."}'

# Submit → Assess → Approve (with e-signature re-challenge)
# Verify ImmuDB TX-id recorded
curl http://localhost:8089/audit/verify/{txId}
```

---

## EPIC 7 — Validation Protocols & Quality Events

> Extends `apps/quality-service/` (Part 2 — no new service needed).

### Step 7.1 — Domain Schemas

`libs/shared/schemas/src/quality/`:

- `ValidationProtocolSchema` — `id`, `protocol_number` (VAL-YYYY-NNNN), `type` (IQ | OQ | PQ), `status` (DRAFT | REVIEW | APPROVED | EXECUTING | COMPLETED | CLOSED | SUPERSEDED), `system_under_test`, `change_control_id` FK (optional), `test_steps[]`, GxpValidationFieldsMixin
- `ValidationTestSchema` — `step_number`, `description`, `expected_result`, `actual_result`, `status` (PENDING | PASS | FAIL | NOT_APPLICABLE), `exception_note`, `executed_by`, `executed_at`, `electronic_signature JSONB`
- `QualityEventSchema` — `id`, `event_number` (QE-YYYY-NNNN), `type` (COMPLAINT | AUDIT_FINDING | INSPECTION_OBSERVATION | QUALITY_ISSUE), `severity` (LOW | MEDIUM | HIGH | CRITICAL), `status` (OPEN | INVESTIGATING | CAPA_INITIATED | CLOSED), `linked_records[]` (FK to change_controls | capas | deviations), GxpValidationFieldsMixin

### Step 7.2 — Database Migrations

**`006_validation_protocols.sql`**:

```sql
CREATE TABLE validation_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_number VARCHAR(20) UNIQUE NOT NULL,
  type VARCHAR(5) NOT NULL CHECK (type IN ('IQ','OQ','PQ')),
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  system_under_test TEXT NOT NULL,
  change_control_id UUID REFERENCES change_controls(id),
  electronic_signature JSONB,
  validation_status VARCHAR(20) NOT NULL DEFAULT 'unvalidated',
  retention_class VARCHAR(20) NOT NULL DEFAULT 'PERMANENT',
  audit_tx_id VARCHAR(200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL
);
CREATE TABLE validation_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES validation_protocols(id),
  step_number INTEGER NOT NULL,
  description TEXT NOT NULL,
  expected_result TEXT NOT NULL,
  actual_result TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  exception_note TEXT,
  executed_by UUID,
  executed_at TIMESTAMPTZ,
  electronic_signature JSONB
);
```

**`007_quality_events.sql`** — `quality_events`, `event_investigations`, `linked_records` (polymorphic FK via `record_type` + `record_id`)

### Step 7.3 — Kafka Events

`libs/shared/events/src/quality.events.ts` additions:

| Topic                   | Events                                                                                                                     |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `quality.validation.v1` | `ValidationStartedEvent`, `TestExecutedEvent`, `ValidationCompletedEvent`, `ExceptionRaisedEvent`, `ValidationClosedEvent` |
| `quality.events.v1`     | `QualityEventReportedEvent`, `QualityEventInvestigatedEvent`, `CapaLinkedEvent`, `QualityEventClosedEvent`                 |

### Step 7.4 — API Contract Extensions

`libs/shared/contracts/src/quality.contract.ts` additions:

- `POST /quality/validation-protocols`
- `GET /quality/validation-protocols/:id`
- `POST /quality/validation-protocols/:id/approve` — e-signature required
- `POST /quality/validation-protocols/:id/execute-test` — body: `{ step_number, actual_result, status, electronic_signature }`
- `POST /quality/validation-protocols/:id/close`
- `GET /quality/validation-protocols/:id/summary`
- `POST /quality/quality-events`
- `POST /quality/quality-events/:id/investigate`
- `POST /quality/quality-events/:id/link-record` — body: `{ record_type, record_id }`
- `POST /quality/quality-events/:id/close`

### Step 7.5 — Cross-Module Linkage

All cross-module foreign keys resolved via a `linked_records` junction table:

```
quality_events ←→ change_controls
quality_events ←→ capas
quality_events ←→ deviations
validation_protocols → change_controls
```

### Step 7.6 — Verification

```bash
# Create IQ validation protocol, link to Change Control
curl -X POST http://localhost:3000/api/quality/validation-protocols \
  -d '{"type":"IQ","system_under_test":"HVAC-001","change_control_id":"..."}'

# Execute individual test steps with e-signature
# Close protocol → verify audit trail → check linked change control updated
```

---

## EPIC 8 — Financial Operations & Procurement

### Step 8.1 — financial-service Scaffold

```bash
nx g @nx/nest:application financial-service --directory=apps/financial-service
# complianceLevel: MEDIUM, withAuditTrail: true
```

### Step 8.2 — Financial Domain Schemas

`libs/shared/schemas/src/financial/`:

- `AccountSchema` — `id`, `account_code` (hierarchical: 1000-9999), `account_type` (ASSET | LIABILITY | EQUITY | REVENUE | EXPENSE), `parent_id`, `name`, `is_active`
- `JournalEntrySchema` — `id`, `entry_number`, `description`, `entry_date`, `status` (DRAFT | POSTED | REVERSED), `lines[]`
- `BiologicalAssetSchema` — IAS 41 compliance: `id`, `batch_id` FK → `plant_batches`, `valuation_method` (FAIR_VALUE | COST), `fair_value`, `cost_to_sell`, `net_realizable_value`, `valued_at`, `valued_by`, `electronic_signature JSONB`
- `CostAllocationSchema` — `batch_id`, `cost_type` (DIRECT_LABOR | OVERHEAD | MATERIAL | DEPRECIATION), `amount`, `period`, `allocation_basis`
- `PayrollRunSchema` — `id`, `pay_period_start`, `pay_period_end`, `status`, `total_gross`, `total_net`, `lines[]`

`libs/shared/schemas/src/procurement/`:

- `SupplierSchema` — `id`, `supplier_code`, `name`, `qualification_status` (QUALIFIED | PROVISIONAL | DISQUALIFIED), `qualification_expiry`, `contact_details`
- `PurchaseOrderSchema` — `id`, `po_number`, `supplier_id`, `status` (DRAFT | SUBMITTED | ACKNOWLEDGED | RECEIVING | CLOSED | CANCELLED), `lines[]`, `total_value`, `electronic_signature JSONB`
- `POLineSchema` — `id`, `po_id`, `item_description`, `quantity`, `unit_price`, `unit_of_measure`, `received_quantity`
- `ReceivingRecordSchema` — `id`, `po_id`, `received_at`, `received_by`, `lines[]`, `quality_check_passed`, `electronic_signature JSONB`

`libs/shared/schemas/src/spatial/`:

- `FacilityZoneSchema` — `id`, `zone_code`, `zone_type` (CULTIVATION | PROCESSING | STORAGE | UTILITY | OFFICE), `area_sqm`, `capacity`, `parent_zone_id`, `is_active`
- `ZoneAssignmentSchema` — `id`, `zone_id`, `batch_id` FK, `assigned_at`, `released_at`, `assigned_by`

### Step 8.3 — Database Migrations

**`008_financial.sql`** — `accounts`, `journal_entries`, `journal_lines`, `biological_assets`, `cost_allocations`

**`009_payroll.sql`** — `payroll_runs`, `payroll_lines`, `employee_compensation_rates`

**`010_procurement.sql`** — `suppliers`, `purchase_orders`, `po_lines`, `receiving_records`

**`011_spatial.sql`** — `facility_zones`, `zone_assignments`, `zone_capacity_history`

All financial tables require `electronic_signature JSONB` on mutating records; procurement tables on PO approval and receiving.

### Step 8.4 — Kafka Events

`libs/shared/events/src/financial.events.ts`:

- Topic `finance.transaction.v1`: `JournalEntryPostedEvent`, `BiologicalAssetValuedEvent`, `CostAllocationCreatedEvent`, `PayrollRunCompletedEvent`

`libs/shared/events/src/procurement.events.ts`:

- Topic `procurement.po.v1`: `POCreatedEvent`, `POSubmittedEvent`, `POAcknowledgedEvent`, `GoodsReceivedEvent`, `ThreeWayMatchCompletedEvent`

`libs/shared/events/src/spatial.events.ts`:

- Topic `spatial.zone.v1`: `ZoneCreatedEvent`, `BatchAssignedToZoneEvent`, `BatchReleasedFromZoneEvent`

### Step 8.5 — Domain Implementation

`apps/financial-service/src/`:

- `BiologicalAssetValuationService` — IAS 41 periodic revaluation: takes `plant_batch` current quantity × market price → creates `BiologicalAsset` record with e-signature
- `ProcurementWorkflow` — state machine: RFQ → PO Creation → Supplier Acknowledgement → Goods Receiving → 3-Way Match (PO vs GRN vs Invoice)
- `SpatialPlanningService` — occupancy tracking, zone capacity enforcement, conflict detection (double-assignment prevention)
- `CostAllocationService` — allocates batch costs from journal entries, calculates cost per gram

### Step 8.6 — Verification

```bash
# Supplier qualification flow
curl -X POST http://localhost:3000/api/procurement/suppliers \
  -d '{"name":"Supplier A","qualification_status":"PROVISIONAL"}'

# Create PO → receive goods → verify 3-way match
# Biological asset valuation → check journal entry created
# Assign batch to zone → verify capacity check
```

---

## EPIC 9 — Workforce, Training, Analytics & Document Control

### Step 9.1 — New Services Scaffold

```bash
nx g @nx/nest:application workforce-service --directory=apps/workforce-service
nx g @nx/nest:application analytics-service --directory=apps/analytics-service
```

### Step 9.2 — Workforce & Training Schemas

`libs/shared/schemas/src/workforce/`:

- `EmployeeSchema` — `id`, `employee_number`, `user_id` FK → Keycloak, `position`, `department`, `hire_date`, `competency_profile_id`, `is_active`
- `TaskSchema` — `id`, `task_number`, `title`, `assigned_to` UUID, `zone_id`, `batch_id` (optional), `priority` (LOW | MEDIUM | HIGH | URGENT), `status` (PENDING | IN_PROGRESS | COMPLETED | OVERDUE), `scheduled_start`, `scheduled_end`, `sop_reference`
- `TimeEntrySchema` — `id`, `employee_id`, `task_id`, `clock_in_at`, `clock_out_at`, `duration_minutes`, `recorded_via` (TERMINAL | WEB | API)

`libs/shared/schemas/src/training/`:

- `CourseSchema` — `id`, `course_id` (CUR-001..CUR-015), `title`, `type` (INITIAL | REFRESHER | ANNUAL_RECERTIFICATION), `duration_hours`, `passing_score`, `applicable_roles[]`, `sop_references[]`
- `TrainingExecutionSchema` — `id`, `course_id`, `trainee_id`, `trainer_id`, `status` (SCHEDULED | IN_PROGRESS | COMPLETED | FAILED | EXPIRED), `score`, `completed_at`, `electronic_signature JSONB`
- `CertificationSchema` — `id`, `employee_id`, `course_id`, `issued_at`, `valid_until`, `certificate_number`, `electronic_signature JSONB`
- `CompetencyProfileSchema` — `id`, `position`, `required_courses[]`, `minimum_scores{}`

### Step 9.3 — Database Migrations

**`012_workforce.sql`** — `employees`, `tasks`, `task_assignments`, `time_entries`, `shift_schedules`

**`013_training.sql`** — `training_courses`, `curriculum`, `training_executions`, `certifications`, `competency_profiles`

**`014_document_control.sql`**:

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_number VARCHAR(50) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,  -- SOP | FORM | REPORT | PROTOCOL | POLICY
  status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
  current_version VARCHAR(10) NOT NULL DEFAULT '1.0',
  mayan_document_id INTEGER,  -- Mayan-EDMS external ID
  retention_class VARCHAR(20) NOT NULL DEFAULT '7_YEAR',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL
);
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id),
  version VARCHAR(10) NOT NULL,
  change_summary TEXT NOT NULL,
  approved_by UUID,
  electronic_signature JSONB,
  effective_date DATE,
  superseded_at TIMESTAMPTZ,
  mayan_version_id INTEGER
);
```

### Step 9.4 — Kafka Events

`libs/shared/events/src/workforce.events.ts`:

- Topic `workforce.v1`: `TaskAssignedEvent`, `TaskCompletedEvent`, `TimeEntryRecordedEvent`

`libs/shared/events/src/training.events.ts`:

- Topic `training.v1`: `TrainingScheduledEvent`, `TrainingCompletedEvent`, `CertificationIssuedEvent`, `CertificationExpiringEvent` (30-day warning), `CertificationExpiredEvent`

`libs/shared/events/src/analytics.events.ts`:

- Topic `analytics.v1`: `ComplianceMetricsCalculatedEvent`, `ComplianceReportGeneratedEvent`

### Step 9.5 — Mayan-EDMS Integration

`libs/shared/integrations/mayan/`:

- `MayanClient` — typed REST client (Zod-validated responses)
- `MayanDocumentService` — `upload(buffer, metadata)`, `getVersions(docId)`, `lockVersion(versionId)`
- Add `mayan-edms:4` to `docker/docker-compose.yml` (port 8000)

### Step 9.6 — Mobile-Optimized Task Contract

`libs/shared/contracts/src/workforce.contract.ts` additions:

- `GET /workforce/tasks/mobile` — minimal payload optimized for Android terminals: `{ id, title, zone_id, priority, scheduled_start }` only (no relations, no audit fields)
- Pagination: cursor-based (not offset) for mobile performance

### Step 9.7 — Analytics Service

`apps/analytics-service/src/`:

- `ComplianceMetricsService` — aggregates from all DBs via read replicas:
  - Open CAPAs count, overdue CAPAs, average closure time
  - Open deviations by classification
  - Change controls by status
  - Training completion rates by department
  - Certifications expiring in 30/60/90 days
- `TrendAnalysisService` — rolling 12-month trend per module
- `ReportGeneratorService` — PDF compliance reports via `@nestjs/pdf` / puppeteer
- Schedule: `@Cron('0 0 * * *')` — nightly metrics recalculation, publishes `ComplianceMetricsCalculatedEvent`

### Step 9.8 — API Contracts

`libs/shared/contracts/src/analytics.contract.ts`:

- `GET /analytics/compliance-metrics` — current snapshot
- `GET /analytics/trends/:module` — `module`: capa | deviation | change-control | training
- `GET /analytics/training-compliance` — by department/role with expiry warnings
- `GET /reports/compliance?format=pdf|json` — full compliance report
- `GET /reports/audit-trail?from=&to=&entityType=` — audit trail export

### Step 9.9 — Compliance Dashboard (Frontend)

`apps/web-portal/src/app/(protected)/compliance/`:

- `page.tsx` — top-level KPI cards: open CAPAs, open deviations, pending change controls, training compliance %
- `training/page.tsx` — training matrix by department, expiring certification alerts
- `reports/page.tsx` — report generation UI with date range picker + PDF download
- All charts: recharts; role guard: AUDITOR | QUALITY_MANAGER | SUPER_ADMIN

### Step 9.10 — Verification

```bash
# Schedule and complete training
curl -X POST http://localhost:3000/api/training/executions \
  -d '{"course_id":"CUR-001","trainee_id":"..."}'

curl -X PATCH http://localhost:3000/api/training/executions/{id}/complete \
  -d '{"score":92,"electronic_signature":{...}}'

# Verify certification issued
# Check compliance dashboard reflects updated training completion rate
# Generate PDF compliance report
curl "http://localhost:3000/api/reports/compliance?format=pdf" \
  -H "Authorization: Bearer $TOKEN" --output compliance-report.pdf
```

---

## Decisions Log

| Decision              | Choice                              | Rationale                                                                                     |
| --------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------- |
| IoT Consumer          | Telegraf (no custom service)        | Declarative config replaces ~300 lines of Go; MQTT input + remote_write output built-in       |
| Alert Evaluation      | Scheduled cron in api-gateway       | Telegraf lacks stateful threshold comparison; NestJS cron is lightweight and auditable        |
| quality-service scope | Single service for EPIC 6+7         | Transactional integrity: change_control ↔ deviation ↔ CAPA ↔ validation in one DB boundary |
| EPIC 8 timing         | Parallel with EPIC 7                | No direct dependency on quality workflows                                                     |
| EPIC 9 last           | Analytics aggregates all            | Cannot build meaningful dashboards without data from EPIC 5-8                                 |
| Document Control      | Mayan-EDMS + local table            | Mayan handles binary storage; PostgreSQL table tracks metadata + approval state               |
| Mobile tasks          | cursor pagination + minimal payload | Android terminals have limited bandwidth; offset pagination causes inconsistency under writes |
| PDF reports           | Puppeteer via headless Chromium     | Regulatory-grade PDF formatting; consistent rendering across environments                     |

---

## New File Structure (additions after EPIC 4)

```
gacp-erp/
├── apps/
│   ├── quality-service/      # NestJS — Change Control, CAPA, Deviations, Validation (EPIC 6+7)
│   ├── financial-service/    # NestJS — Financial, Procurement, Spatial (EPIC 8)
│   ├── workforce-service/    # NestJS — Workforce, Task, Time, Training (EPIC 9)
│   └── analytics-service/    # NestJS — Metrics, Trends, Reports (EPIC 9)
├── libs/
│   └── shared/
│       ├── schemas/
│       │   ├── src/iot/          # EPIC 5
│       │   ├── src/quality/      # EPIC 6+7
│       │   ├── src/financial/    # EPIC 8
│       │   ├── src/procurement/  # EPIC 8
│       │   ├── src/spatial/      # EPIC 8
│       │   ├── src/workforce/    # EPIC 9
│       │   └── src/training/     # EPIC 9
│       ├── contracts/
│       │   ├── src/iot.contract.ts       # EPIC 5
│       │   ├── src/quality.contract.ts   # EPIC 6+7
│       │   ├── src/financial.contract.ts # EPIC 8
│       │   ├── src/workforce.contract.ts # EPIC 9
│       │   └── src/analytics.contract.ts # EPIC 9
│       ├── events/
│       │   ├── src/iot.events.ts         # EPIC 5
│       │   ├── src/quality.events.ts     # EPIC 6+7
│       │   ├── src/financial.events.ts   # EPIC 8
│       │   ├── src/procurement.events.ts # EPIC 8
│       │   ├── src/spatial.events.ts     # EPIC 8
│       │   ├── src/workforce.events.ts   # EPIC 9
│       │   ├── src/training.events.ts    # EPIC 9
│       │   └── src/analytics.events.ts   # EPIC 9
│       ├── database/
│       │   └── src/migrations/
│       │       ├── 002_iot.sql           # EPIC 5
│       │       ├── 003_change_controls.sql  # EPIC 6
│       │       ├── 004_capas.sql            # EPIC 6
│       │       ├── 005_deviations.sql       # EPIC 6
│       │       ├── 006_validation_protocols.sql # EPIC 7
│       │       ├── 007_quality_events.sql       # EPIC 7
│       │       ├── 008_financial.sql        # EPIC 8
│       │       ├── 009_payroll.sql          # EPIC 8
│       │       ├── 010_procurement.sql      # EPIC 8
│       │       ├── 011_spatial.sql          # EPIC 8
│       │       ├── 012_workforce.sql        # EPIC 9
│       │       ├── 013_training.sql         # EPIC 9
│       │       └── 014_document_control.sql # EPIC 9
│       └── integrations/
│           └── mayan/                    # EPIC 9
├── docker/
│   ├── telegraf/
│   │   └── telegraf.conf                # EPIC 5
│   └── docker-compose.yml               # extended with emqx, telegraf, victoriametrics-iot, mayan-edms
└── apps/web-portal/src/app/(protected)/
    ├── iot/                              # EPIC 5
    ├── quality/                          # EPIC 6+7
    └── compliance/                       # EPIC 9
```

---

## Verification Commands (Full Stack)

```bash
# Start all infrastructure (after EPIC 5-9 additions)
docker compose -f docker/docker-compose.yml up -d

# Verify all services healthy
docker compose ps

# Type check all projects
nx run-many --target=typecheck --all

# Lint
nx run-many --target=lint --all

# Tests
nx run-many --target=test --all

# E2E: IoT sensor reading → alert
mosquitto_pub -h localhost -p 1883 \
  -t "gacp/sensors/zone-1/temperature" \
  -m '{"value":35.0,"unit":"celsius","sensor_id":"s-001","recorded_at":"2026-03-16T10:00:00Z"}'

# E2E: Change Control full lifecycle
TOKEN=$(curl -s -X POST http://localhost:8080/realms/gacp-erp/protocol/openid-connect/token \
  -d 'client_id=api-gateway&grant_type=password&username=quality_manager&password=admin' \
  | jq -r .access_token)

CC_ID=$(curl -sX POST http://localhost:3000/api/quality/change-controls \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Update cleaning SOP","change_type":"MINOR","description":"..."}' \
  | jq -r .id)

curl -X POST http://localhost:3000/api/quality/change-controls/$CC_ID/approve \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"electronic_signature":{"signature_intent":"APPROVE_CHANGE","authentication_method":"password"}}'

# Verify audit trail
curl http://localhost:8089/audit/verify/$(curl -s http://localhost:3000/api/quality/change-controls/$CC_ID | jq -r .audit_tx_id)

# E2E: Training completion → PDF report
curl -X POST http://localhost:3000/api/training/executions \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"course_id":"CUR-001","trainee_id":"..."}'

curl "http://localhost:3000/api/reports/compliance?format=pdf" \
  -H "Authorization: Bearer $TOKEN" \
  --output compliance-report.pdf
```
