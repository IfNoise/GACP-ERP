# GACP-ERP — EPIC 0–4 Implementation Plan

## Context

- **Stack**: TypeScript (NestJS, Next.js, NX), Go (audit-consumer), PostgreSQL, Redis, Kafka, Keycloak, ImmuDB
- **Environment**: Local Docker Compose
- **Team**: AI + one developer
- **Scope**: EPIC 0–4 per Roadmap v3.0
- **Principles**: Zod-First, Schema-First API (ts-rest), NX monorepo, Compliance (FDA 21 CFR Part 11, EU GMP Annex 11, ALCOA+)

---

## EPIC 0 — Foundation Infrastructure

### Step 0.1 — NX Workspace Initialization

- Run `npx create-nx-workspace@latest gacp-erp --preset=empty --packageManager=pnpm` in repo root
- Install plugins: `@nx/node @nx/react @nx/next @nx/nest @nx-go/nx-go @nx/esbuild`
- Create `nx.json` with: build target ESM, node18, strict TS
- Create `tsconfig.base.json` with strict mode:
  - `strict: true`, `noImplicitAny`, `exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noImplicitReturns`, `noUnusedLocals`, `noUnusedParameters`
- Create `.eslintrc.base.json` with rules: `no-explicit-any: error`, `prefer-readonly: error`, strict import ordering
- Configure `pnpm-workspace.yaml`, Husky + lint-staged

### Step 0.2 — Custom NX Generators

- Create `tools/nx-generators/library/` — library generator
  - Types: `data-access | ui | business-logic | utility`
  - Outputs Zod-First template: schema → type → service
- Create `tools/nx-generators/microservice/` — microservice generator
  - Params: `database`, `withAuditTrail`, `withObservability`, `complianceLevel: HIGH | MEDIUM | LOW`
  - Generates NestJS app skeleton with compliance scaffolding
- Create `tools/nx-generators/api-module/` — API module generator
  - Params: `withCrud`, `authRequired`, `auditLevel: FULL | MINIMAL | NONE`
  - Generates controller/service/schema/contract files

### Step 0.3 — Docker Compose (Local Dev)

- Create `docker/docker-compose.yml` with services:
  - `postgres:15` (with PostGIS extension) — port 5432
  - `redis:7` — port 6379
  - `kafka` (bitnami/kafka) + `zookeeper` — port 9092
  - `keycloak:23` — port 8080, realm config from `docker/keycloak/realm-export.json`
  - `immudb:1.9` — port 3322
  - `mongodb:7` — port 27017
  - `victoriametrics` — port 8428
- Create `docker/docker-compose.dev.yml` (healthchecks, named volumes, override for dev)
- Create `docker/.env.example` with all service env vars

### Step 0.4 — CI/CD (GitHub Actions)

- Create `.github/workflows/ci.yml`:
  - Jobs: `lint` → `typecheck` → `test` → `build`
  - pnpm store cache
  - NX affected: only changed projects
  - Commit message compliance check: `feat|fix|docs|test|refactor|compliance(<scope>): <subject>`
- Create `.github/workflows/validate-dsl.yml`:
  - Runs `dsl/validate_schema.py --all` on PR to main

---

## EPIC 1 — Shared Contracts & Schemas

### Step 1.1 — Base Zod Schemas

- `libs/shared/schemas/src/common/base-entity.schema.ts`:
  - `BaseEntitySchema`: id (UUID v4 branded), created_at, updated_at, created_by, updated_by
  - `ElectronicSignatureSchema`: signed_by, signature_type (approval | review | verification | witnessed | authorization), authentication_method (password | biometric | token | two_factor | pki_certificate), digital_signature (RSA-SHA256 hex), ip_address
- `libs/shared/schemas/src/common/result.schema.ts`:
  - Result pattern: `{ success: true; data: T } | { success: false; error: E }`
- Branded types: `PlantId`, `BatchId`, `UserId`, `FacilityId` (string & { readonly brand: unique symbol })

### Step 1.2 — Domain Schemas

- `libs/shared/schemas/src/plants/`:
  - `PlantSchema`, `BatchSchema`, `GrowthStageSchema`, `HarvestSchema`
  - Growth stage enum: SEED | GERMINATION | VEGETATIVE | FLOWERING | HARVESTING | HARVESTED
- `libs/shared/schemas/src/auth/`:
  - `UserSchema`, `RoleSchema`, `PermissionSchema`, `JwtPayloadSchema`
  - Role enum: SUPER_ADMIN | QUALITY_MANAGER | CULTIVATION_MANAGER | OPERATOR | AUDITOR | READONLY
- `libs/shared/schemas/src/audit/`:
  - `AuditEventSchema` with ALCOA+ fields (Attributable, Legible, Contemporaneous, Original, Accurate + Complete, Consistent, Enduring, Available)
  - `AlcoaValidationSchema` — strict runtime validation
- `libs/shared/schemas/src/iot/`:
  - `SensorReadingSchema`, `EnvironmentDataSchema`

### Step 1.3 — API Contracts (ts-rest)

- Install: `@ts-rest/core`, `@ts-rest/nest`, `@ts-rest/open-api`
- `libs/shared/contracts/src/auth.contract.ts`:
  - `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh`, `GET /auth/me`
- `libs/shared/contracts/src/plants.contract.ts`:
  - CRUD plants & batches, `POST /plants/:id/transition`, `POST /batches/:id/harvest`
- `libs/shared/contracts/src/audit.contract.ts`:
  - `GET /audit/trail`, `GET /audit/verify/:txId`

### Step 1.4 — Kafka Event Schemas

- `libs/shared/events/src/plant.events.ts`:
  - `PlantCreatedEvent`, `PlantStageChangedEvent`, `HarvestCompletedEvent`
  - All as Zod discriminated union on `eventType`
- `libs/shared/events/src/audit.events.ts`:
  - `AuditTrailEntryEvent`, `SignatureRecordedEvent`
- Topic naming convention: `{domain}.{subdomain}.v{version}`
  - `cultivation.plants.v1`, `audit.trail.v1`

---

## EPIC 2 — Authentication & Authorization

### Step 2.1 — Keycloak Configuration

- Export Keycloak realm `gacp-erp` → `docker/keycloak/realm-export.json`:
  - Clients: `api-gateway` (confidential), `web-portal` (public PKCE)
  - Roles: SUPER_ADMIN, QUALITY_MANAGER, CULTIVATION_MANAGER, OPERATOR, AUDITOR, READONLY
  - Password policy: min 12 chars, MFA (TOTP required for CRITICAL roles: SUPER_ADMIN, QUALITY_MANAGER)
  - Composite role mappings
- Create `libs/shared/keycloak/` — typed Keycloak admin client wrapper

### Step 2.2 — NestJS API Gateway

- Create `apps/api-gateway/` via NX generator
- Install: `@nestjs/passport`, `passport-jwt`, `jwks-rsa`, `@nestjs/throttler`, `helmet`
- `JwtStrategy` — verify token via Keycloak JWKS endpoint
- `RolesGuard` + `@Roles()` decorator — RBAC from JWT `realm_access.roles`
- `PermissionsGuard` — fine-grained resource permissions
- `AuditInterceptor` — every mutating HTTP request publishes to `audit.trail.v1` Kafka topic
- Global pipes: `ZodValidationPipe` using ts-rest contracts
- Helmet, rate-limiting (100 req/min per IP), CORS policy

### Step 2.3 — Frontend Auth (Next.js)

- Create `apps/web-portal/` — Next.js 15 App Router
- Install: `next-auth` v5 + Keycloak provider
- `middleware.ts` — protect routes by role, refresh token rotation
- `AuthProvider` — Zod-validate `JwtPayloadSchema` on session
- Login/logout pages with shadcn/ui components

---

## EPIC 3 — Plant Lifecycle Module

### Step 3.1 — Database Schema (PostgreSQL)

- `libs/shared/database/src/migrations/001_plants.sql`:
  - `plants`: id UUID PK, batch_id FK, strain_id FK, current_stage ENUM, facility_zone_id FK, qr_code VARCHAR UNIQUE, planted_at TIMESTAMPTZ, notes TEXT, is_active BOOL
  - `plant_batches`: id UUID PK, batch_number VARCHAR UNIQUE, strain_id FK, initial_quantity INT, current_quantity INT, started_at, target_harvest_at
  - `growth_stages`: id UUID PK, plant_id FK, stage ENUM, started_at, completed_at, recorded_by UUID FK, electronic_signature JSONB
  - `harvest_records`: id UUID PK, batch_id FK, yield_weight DECIMAL, moisture_content DECIMAL, quality_grade VARCHAR, harvested_at, harvested_by UUID FK, electronic_signature JSONB
- Indexes: qr_code, batch_number, current_stage, facility_zone_id, batch_id

### Step 3.2 — Cultivation Service (NestJS)

- Create `apps/cultivation-service/` via NX generator (`complianceLevel: HIGH`, `withAuditTrail: true`)
- **Domain layer**:
  - `PlantAggregate` — immutable, readonly fields, `transitionTo(stage)` returns new object (no mutation)
  - `GrowthStageStateMachine` — allowed transitions: SEED → GERMINATION → VEGETATIVE → FLOWERING → HARVESTING → HARVESTED
  - `DomainError` hierarchy: `PlantNotFoundError`, `InvalidStageTransitionError`, `BatchCapacityExceededError`
- **Application layer**:
  - `CreatePlantUseCase`, `TransitionStageUseCase`, `HarvestBatchUseCase`
  - Each use case publishes domain event to Kafka after DB write (outbox pattern)
- **Infrastructure layer**:
  - Repository using DrizzleORM (preferred for ESM + Zod integration)
  - Kafka producer via `@nestjs/microservices`
- Publish `PlantStageChangedEvent` to `cultivation.plants.v1` on each state transition

### Step 3.3 — QR Code System

- Install: `qrcode`, `@zxing/library`
- `QrService` — generate QR with `plantId` + HMAC-SHA256 signature (prevents forgery)
- `GET /plants/:id/qr?format=png|svg` — stream QR image response
- QR payload format: `gacp://plants/{plantId}?sig={hmac}`

---

## EPIC 4 — Audit Trail & Data Integrity

### Step 4.1 — Go Audit Consumer

- Create `apps/audit-consumer/` (Go 1.21+)
- `go.mod` dependencies:
  - `github.com/codenotary/immudb/pkg/client` — ImmuDB gRPC client
  - `github.com/IBM/sarama` — Kafka consumer
  - `go.opentelemetry.io/otel` — distributed tracing
  - `github.com/prometheus/client_golang` — metrics
- Consumer group: `audit-consumer-group`, topic: `audit.trail.v1`
- Per-event processing: validate ALCOA+ fields → write to ImmuDB via `VerifiedSet` → store TX-id back to PostgreSQL `audit_references` table
- HTTP endpoint: `GET /audit/verify/:txId` — cryptographic proof verification via ImmuDB `VerifiedGet`
- OpenTelemetry traces + metrics exported to VictoriaMetrics

### Step 4.2 — ALCOA+ Validation

- `libs/shared/schemas/src/audit/alcoa.schema.ts`:
  - **Attributable**: `created_by` (UUID), `workstation_id`, `ip_address`, `session_id`
  - **Contemporaneous**: `event_timestamp` within δ ≤ 120s of `server_received_at`
  - **Original**: `source_hash` (SHA-256 of original object JSON)
  - **Accurate**: `electronic_signature` required when `critical_action: true`
  - **Complete**: all mandatory fields present
  - **Consistent**: sequence_number monotonically increasing per entity
  - **Enduring**: `retention_class: PERMANENT | 7_YEAR | 30_YEAR`
  - **Available**: `storage_verified: boolean`, `backup_confirmed_at`
- Mirror validation logic in Go for audit-consumer runtime checks

### Step 4.3 — Electronic Signatures

- `SignatureModule` in `apps/api-gateway/`:
  - `POST /signatures/create` — re-authenticate (JWT re-issue flow per 21 CFR §11.200), sign payload with RSA-SHA256, publish `SignatureRecordedEvent`
  - `POST /signatures/verify` — verify existing signature against ImmuDB record
- Signature record lifecycle:
  1. User submits critical action with `signature_intent`
  2. API Gateway re-challenges credentials
  3. `SignatureService` creates RSA-SHA256 signature
  4. Record published to `audit.trail.v1`
  5. `audit-consumer` writes to ImmuDB → returns TX-id
  6. TX-id stored in `electronic_signatures` PostgreSQL table

---

## Decisions Log

| Decision               | Choice                   | Rationale                                                          |
| ---------------------- | ------------------------ | ------------------------------------------------------------------ |
| ORM                    | DrizzleORM               | Better ESM compatibility, native Zod integration via `drizzle-zod` |
| Dev environment        | Local Docker Compose     | Lower entry barrier; migrate to K8s after MVP                      |
| NX generators first    | Yes                      | Structural consistency required before any app code                |
| EPIC 1 blocks EPIC 2+3 | Yes                      | Shared schemas must exist before services consume them             |
| Kafka in dev           | Docker Compose (bitnami) | No managed Kafka needed locally                                    |
| ImmuDB in dev          | Docker Compose           | `codenotary/immudb:latest` image available                         |

---

## Verification Commands

```bash
# Start all infrastructure
docker compose -f docker/docker-compose.yml up -d

# Type check all projects
nx run-many --target=typecheck --all

# Lint all projects
nx run-many --target=lint --all

# Run all tests
nx run-many --target=test --all

# E2E: create plant with audit trail
TOKEN=$(curl -s -X POST http://localhost:8080/realms/gacp-erp/protocol/openid-connect/token \
  -d 'client_id=api-gateway&grant_type=password&username=admin&password=admin' | jq -r .access_token)

curl -X POST http://localhost:3000/api/plants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"strainId":"...","zoneId":"...","batchId":"..."}'

# Verify audit record in ImmuDB
curl http://localhost:8089/audit/verify/{txId}
```

---

## File Structure (Target)

```
gacp-erp/
├── apps/
│   ├── web-portal/           # Next.js 15 (TypeScript)
│   ├── api-gateway/          # NestJS (TypeScript)
│   ├── cultivation-service/  # NestJS (TypeScript)
│   └── audit-consumer/       # Go 1.21
├── libs/
│   ├── shared/
│   │   ├── schemas/          # Zod schemas (single source of truth)
│   │   ├── contracts/        # ts-rest API contracts
│   │   ├── events/           # Kafka event schemas (Zod)
│   │   ├── database/         # DrizzleORM schema + migrations
│   │   ├── keycloak/         # Keycloak admin wrapper
│   │   └── config/           # Shared configurations
│   └── ui-components/        # React/shadcn components
├── tools/
│   └── nx-generators/
│       ├── library/
│       ├── microservice/
│       └── api-module/
├── docker/
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   ├── .env.example
│   └── keycloak/
│       └── realm-export.json
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── validate-dsl.yml
├── nx.json
├── tsconfig.base.json
├── .eslintrc.base.json
└── pnpm-workspace.yaml
```
