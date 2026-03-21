# GACP-ERP — EPIC 10–16 Production Readiness Plan

## Context

- **Stack**: TypeScript (NestJS, Next.js, NX), Go (audit-consumer), PostgreSQL, Redis, Kafka, Keycloak, ImmuDB, Telegraf, EMQX, VictoriaMetrics, Mayan-EDMS
- **Environment**: Local Docker Compose → On-premise Kubernetes
- **Team**: AI + one developer
- **Scope**: EPIC 10–16 — from current state to Production
- **Prerequisites**: EPIC 0–9 completed (Foundation, Contracts, Auth, Plant Lifecycle, Audit Trail, IoT, Quality, Validation, Financial, Workforce/Training/Analytics)
- **Principles**: Zod-First, Schema-First API (ts-rest), NX monorepo, Compliance (FDA 21 CFR Part 11, EU GMP Annex 11, ALCOA+, GAMP 5)
- **Deploy target**: On-premise Kubernetes
- **MVP scope**: Full (all modules including 3D XeoKit visualization)
- **Deferred**: Jitsi Meet (post-MVP), ML/Forecasting (post-MVP), React Native mobile (PWA first)
- **Validation**: Self-certification (internal validation, docs prepared for future external audit)

---

## Current State Assessment

### Backend (~80% complete)

| Service                  | Status           | Notes                                                                                        |
| ------------------------ | ---------------- | -------------------------------------------------------------------------------------------- |
| **api-gateway**          | Production-ready | Auth, validation pipes, audit interceptors, IoT module, signature module                     |
| **cultivation-service**  | Core implemented | Plant aggregates, batch management, harvest workflows, QR system                             |
| **quality-service**      | Advanced         | Change Control, CAPA, Deviation, Validation Protocol, Quality Event — all workflow engines   |
| **financial-service**    | Substantial      | Double-entry accounting, IAS 41 biological assets, procurement, spatial planning             |
| **workforce-service**    | Core implemented | Employee management, task assignment, time tracking, training execution                      |
| **analytics-service**    | Basic scaffold   | Reports service structure exists, needs full metrics aggregation                             |
| **audit-consumer (Go)**  | Core implemented | Kafka consumer → ImmuDB writer, ALCOA+ validation, HTTP verify endpoint                      |
| **web-portal (Next.js)** | ~20%             | Auth, IoT dashboard, compliance pages exist; plant/quality/financial/workforce/3D UI missing |

### Shared Libraries (~90% complete)

- **schemas/**: 14+ domain folders with full Zod schemas
- **contracts/**: 11 ts-rest API contracts
- **events/**: 13+ Kafka event topic schemas with Zod discriminated unions
- **database/**: 14 DrizzleORM migrations covering all domains

### Infrastructure (~40% complete)

- **Docker Compose**: 15+ services configured (Postgres, Redis, Kafka KRaft, Keycloak, ImmuDB, MongoDB, VictoriaMetrics ×2, EMQX, Telegraf, Mayan-EDMS)
- **CI/CD**: GitHub Actions (lint, typecheck, test, build-go, build)
- **Missing**: Kubernetes manifests, Helm charts, Dockerfiles (production), Istio, observability stack (Grafana/Tempo/Loki), secret management, backup automation

### Testing (~30% complete)

- 35 test files exist (workflow engines, use-cases, repositories, schemas)
- Coverage unknown — target >80%
- No integration/E2E tests
- No load tests (K6)

### Documentation (~85% complete)

- Full compliance docs (FDA 21 CFR Part 11, EU GMP Annex 11, WHO GACP, EMA GACP, ALCOA+, GAMP 5)
- Full validation docs (VMP, URS, FS, DS, RA, IQ, OQ, PQ, TraceabilityMatrix) — all marked `author_verified: false`
- 50+ SOPs covering all operational procedures
- Missing: production runbooks, DR drill results, validation execution reports

---

## EPIC 10 — Testing & Quality Gates

### Step 10.1 — Unit Test Coverage Enforcement

- Configure Jest coverage thresholds in `jest.preset.js`:
  - Global minimum: 80% branches, 80% functions, 80% lines, 80% statements
- Update `.github/workflows/ci.yml`: fail build if coverage < 80%
- Write unit tests per service:

**api-gateway** (`apps/api-gateway/src/`):

- `JwtStrategy`, `RolesGuard`, `PermissionsGuard` — mock Keycloak responses
- `AuditInterceptor` — verify Kafka publish on mutations
- `ZodValidationPipe` — valid/invalid payloads per contract
- `ThresholdService`, `AlertEvaluationService` — IoT module
- `SignatureService` — RSA-SHA256 creation and verification

**cultivation-service** (`apps/cultivation-service/src/`):

- `PlantAggregate` — all state transitions (valid + invalid)
- `GrowthStageStateMachine` — exhaustive transition matrix
- `CreatePlantUseCase`, `TransitionStageUseCase`, `HarvestBatchUseCase`
- `PlantRepository`, `BatchRepository` — DrizzleORM mock queries
- `QrService` — HMAC generation and verification

**quality-service** (`apps/quality-service/src/`):

- `ChangeControlWorkflowEngine` — all 7 states × allowed/denied transitions
- `CAPAAggregate` — RCA assignment, effectiveness verification
- `DeviationAggregate` — classification, investigation, CAPA linking
- `ValidationProtocol` — test step execution, pass/fail/exception handling
- `QualityEventAggregate` — event lifecycle

**financial-service** (`apps/financial-service/src/`):

- `BiologicalAssetValuationService` — IAS 41 fair value calculation
- `ProcurementWorkflow` — PO state machine, 3-way match logic
- `SpatialPlanningService` — capacity enforcement, double-assignment prevention
- `CostAllocationService` — cost per gram calculation
- `JournalEntryService` — double-entry balance validation

**workforce-service** (`apps/workforce-service/src/`):

- `TaskService` — assignment, completion, overdue detection
- `TimeEntryService` — clock-in/clock-out, duration calculation
- `TrainingExecutionService` — score evaluation, pass/fail, certification issuance
- `CertificationService` — expiry calculation, renewal logic

**analytics-service** (`apps/analytics-service/src/`):

- `ComplianceMetricsService` — aggregation queries, snapshot calculation
- `TrendAnalysisService` — rolling 12-month computation
- `ReportGeneratorService` — PDF output verification

**audit-consumer (Go)** (`apps/audit-consumer/`):

- `internal/kafka/consumer_test.go` — message deserialization, ALCOA+ validation
- `internal/immudb/client_test.go` — VerifiedSet/VerifiedGet mocks
- `internal/http/handler_test.go` — `/audit/verify/:txId` endpoint

**shared libs** (`libs/shared/`):

- `schemas/src/**/*.spec.ts` — Zod edge cases: invalid UUIDs, missing fields, enum boundaries, branded types
- `events/src/**/*.spec.ts` — discriminated union parsing, event serialization/deserialization
- `contracts/src/**/*.spec.ts` — contract type inference, path parameter validation

### Step 10.2 — Integration Tests (E2E Backend)

- Create `docker/docker-compose.test.yml` — ephemeral infrastructure:

  - PostgreSQL (fresh DB per test run)
  - Kafka (single broker, auto-topic-creation)
  - Redis
  - ImmuDB
  - No Keycloak (mock JWT in tests)

- Write integration test suites:

**Auth flow** (`apps/api-gateway/test/auth.e2e-spec.ts`):

1. Login with mock JWT → access protected endpoint → verify 200
2. Access without token → verify 401
3. Access with wrong role → verify 403
4. Audit event published to Kafka on mutation

**Plant lifecycle** (`apps/api-gateway/test/plants.e2e-spec.ts`):

1. Create plant → verify DB record + Kafka `PlantCreatedEvent`
2. Transition SEED → GERMINATION → VEGETATIVE → FLOWERING → HARVESTING → HARVESTED
3. Invalid transition (SEED → FLOWERING) → verify 400
4. Harvest batch → verify `HarvestCompletedEvent` + yield record
5. Verify audit trail entry in ImmuDB (via audit-consumer)

**Quality workflow** (`apps/api-gateway/test/quality.e2e-spec.ts`):

1. Create deviation → investigate → assess impact → link CAPA → close
2. Create change control → submit → assess → approve (with e-signature) → implement → verify → close
3. Create CAPA → assign RCA → action plan → implement → effectiveness check → close
4. Validation protocol: create → approve → execute test steps → close

**Financial** (`apps/api-gateway/test/financial.e2e-spec.ts`):

1. Create journal entry → post → verify GL balance
2. Biological asset valuation → verify journal entry created
3. Create PO → submit → receive goods → 3-way match
4. Assign batch to zone → verify capacity check

**IoT** (`apps/api-gateway/test/iot.e2e-spec.ts`):

1. Create threshold → simulate VictoriaMetrics response above threshold → verify alert triggered
2. Verify alert stored in `alert_history`

**E-signature** (`apps/api-gateway/test/signatures.e2e-spec.ts`):

1. Create signature → verify RSA-SHA256
2. Verify signature against ImmuDB record
3. Signature required for critical actions — verify rejection without signature

- Add `integration-test` job to `.github/workflows/ci.yml`:

  - Uses `docker compose -f docker/docker-compose.test.yml up -d`
  - Runs after unit tests pass
  - Tears down containers on completion

- Create seed data scripts: `tools/test-utils/seed.ts` — test users, zones, batches, training courses

### Step 10.3 — Contract Tests & API Documentation

- Generate OpenAPI 3.0 spec from ts-rest contracts:
  - `libs/shared/contracts/src/openapi.ts` — uses `@ts-rest/open-api` to generate spec
  - Output: `docs/generated/openapi.json`
- Add contract snapshot tests: serialize Zod schemas to JSON Schema → snapshot comparison
- Serve Swagger UI: `/api/docs` endpoint on api-gateway (dev/staging only, disabled in production)

---

## EPIC 11 — Kubernetes & Helm Charts

### Step 11.1 — Production Dockerfiles

Create multi-stage Dockerfiles for all services:

**NestJS services** (api-gateway, cultivation-service, quality-service, financial-service, workforce-service, analytics-service):

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN npx nx build <service-name> --configuration=production

# Stage 2: Production
FROM gcr.io/distroless/nodejs18-debian12
WORKDIR /app
COPY --from=builder /app/dist/apps/<service-name> .
COPY --from=builder /app/node_modules ./node_modules
ENV NODE_ENV=production
EXPOSE 3000
CMD ["main.js"]
```

**Next.js web-portal**:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
RUN corepack enable && pnpm install --frozen-lockfile
RUN npx nx build web-portal --configuration=production
# next.config.ts: output: 'standalone'

FROM gcr.io/distroless/nodejs18-debian12
WORKDIR /app
COPY --from=builder /app/apps/web-portal/.next/standalone ./
COPY --from=builder /app/apps/web-portal/.next/static ./.next/static
COPY --from=builder /app/apps/web-portal/public ./public
ENV NODE_ENV=production
EXPOSE 3000
CMD ["server.js"]
```

**Go audit-consumer** (update existing `apps/audit-consumer/Dockerfile`):

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o audit-consumer ./cmd/main.go

FROM gcr.io/distroless/static-debian12
COPY --from=builder /app/audit-consumer /
EXPOSE 8089
ENTRYPOINT ["/audit-consumer"]
```

Files:

- `apps/api-gateway/Dockerfile`
- `apps/cultivation-service/Dockerfile`
- `apps/quality-service/Dockerfile`
- `apps/financial-service/Dockerfile`
- `apps/workforce-service/Dockerfile`
- `apps/analytics-service/Dockerfile`
- `apps/audit-consumer/Dockerfile` (update)
- `apps/web-portal/Dockerfile`

### Step 11.2 — Kubernetes Namespace Strategy

Create `k8s/namespaces.yaml`:

- `gacp-erp` — application workloads (all NestJS services, Go service, Next.js frontend)
- `gacp-data` — stateful services (PostgreSQL, Kafka, Redis, ImmuDB, MongoDB, MinIO)
- `gacp-observability` — VictoriaMetrics, Grafana, Tempo, Loki, Promtail
- `gacp-iot` — EMQX, VictoriaMetrics IoT, Telegraf

### Step 11.3 — Kubernetes Base Manifests

For each application service create in `k8s/base/`:

```
k8s/base/
├── namespaces.yaml
├── api-gateway/
│   ├── deployment.yaml        # 2 replicas, readiness/liveness probes (/health), resource limits
│   ├── service.yaml           # ClusterIP, port 3000
│   ├── hpa.yaml               # min 2, max 6, target CPU 70%
│   ├── pdb.yaml               # minAvailable: 1
│   ├── configmap.yaml         # non-secret env vars
│   └── networkpolicy.yaml     # allow ingress from nginx-ingress, deny all else
├── cultivation-service/
│   ├── deployment.yaml        # 2 replicas
│   ├── service.yaml
│   ├── hpa.yaml               # min 2, max 4
│   ├── pdb.yaml
│   ├── configmap.yaml
│   └── networkpolicy.yaml     # allow only from api-gateway
├── quality-service/           # same pattern
├── financial-service/         # same pattern
├── workforce-service/         # same pattern
├── analytics-service/         # 1 replica (non-critical)
├── audit-consumer/
│   ├── deployment.yaml        # 2 replicas (Kafka consumer group)
│   ├── service.yaml           # port 8089
│   ├── hpa.yaml               # min 2, max 4 (scale with Kafka lag)
│   ├── pdb.yaml
│   └── networkpolicy.yaml     # allow Kafka egress, ImmuDB egress
├── web-portal/
│   ├── deployment.yaml        # 2 replicas
│   ├── service.yaml           # port 3000
│   ├── hpa.yaml               # min 2, max 8 (user-facing)
│   └── pdb.yaml
└── ingress/
    ├── ingress.yaml           # Nginx Ingress: /api/* → api-gateway, /* → web-portal
    └── cert-manager.yaml      # ClusterIssuer for TLS (internal CA or Let's Encrypt)
```

For stateful services in `k8s/base/`:

```
├── postgres/
│   └── cloudnativepg-cluster.yaml  # CloudNativePG operator: 1 primary + 1 replica, WAL archiving to S3
├── kafka/
│   └── strimzi-kafka.yaml          # Strimzi operator: 3 brokers, KRaft mode, 168h retention
├── redis/
│   └── statefulset.yaml            # Single instance with PVC, maxmemory-policy: allkeys-lru
├── immudb/
│   └── statefulset.yaml            # Single instance, 200GB PVC, anti-affinity
├── mongodb/
│   └── statefulset.yaml            # Single instance with PVC, auth enabled
└── minio/
    └── statefulset.yaml            # S3-compatible object storage for documents/backups
```

### Step 11.4 — Helm Umbrella Chart

```
helm/gacp-erp/
├── Chart.yaml                      # umbrella chart
├── values.yaml                     # defaults
├── values-staging.yaml             # 1 replica, smaller PVCs, relaxed resources
├── values-production.yaml          # HA replicas, large PVCs, strict resource limits
├── templates/
│   └── _helpers.tpl
└── charts/
    ├── api-gateway/
    │   ├── Chart.yaml
    │   ├── values.yaml
    │   └── templates/              # deployment, service, hpa, pdb, configmap, networkpolicy
    ├── cultivation-service/
    ├── quality-service/
    ├── financial-service/
    ├── workforce-service/
    ├── analytics-service/
    ├── audit-consumer/
    ├── web-portal/
    ├── postgres/                   # CloudNativePG cluster subchart
    ├── kafka/                      # Strimzi Kafka subchart
    ├── redis/
    ├── immudb/
    ├── mongodb/
    ├── minio/
    ├── keycloak/
    ├── emqx/
    ├── telegraf/
    ├── victoriametrics-app/
    ├── victoriametrics-iot/
    ├── mayan-edms/
    └── ingress/
```

Key `values-production.yaml` overrides:

```yaml
global:
  imageRegistry: harbor.internal.gacp-erp.local
  imagePullSecrets: [harbor-pull-secret]
  tlsEnabled: true

apiGateway:
  replicas: 2
  resources:
    requests: { cpu: 500m, memory: 512Mi }
    limits: { cpu: 2000m, memory: 2Gi }

postgres:
  instances: 2 # primary + 1 replica
  storage: 500Gi
  walArchiving:
    enabled: true
    s3Bucket: gacp-erp-wal-archive

kafka:
  replicas: 3
  storage: 200Gi
  retention: 168h

immudb:
  storage: 200Gi

victoriametricsApp:
  retention: 12months
  storage: 500Gi

victoriametricsIot:
  retention: 24months
  storage: 2000Gi
```

### Step 11.5 — CI/CD Pipeline Extensions

**Update `.github/workflows/ci.yml`**:

- Add Docker build + push to container registry (Harbor or GHCR)
- Add Trivy image scanning (fail on HIGH/CRITICAL)
- Tag images with `git sha` + `latest` on main

**Create `.github/workflows/deploy-staging.yml`**:

- Trigger: push to `develop` branch (or manual)
- Steps: build images → push → `helm upgrade --install gacp-erp ./helm/gacp-erp -f values-staging.yaml -n gacp-erp`
- Post-deploy: smoke test (health endpoints)

**Create `.github/workflows/deploy-production.yml`**:

- Trigger: `workflow_dispatch` (manual) + requires tag `v*`
- Requires: all CI checks pass + manual approval gate (GitHub Environments)
- Steps: build images → push → `helm upgrade --install gacp-erp ./helm/gacp-erp -f values-production.yaml -n gacp-erp`
- Post-deploy: smoke tests + Slack/Telegram notification
- Rollback command documented in workflow

**Create `.github/workflows/rollback.yml`**:

- Trigger: `workflow_dispatch` with `revision` input
- Steps: `helm rollback gacp-erp <revision> -n gacp-erp`

### Step 11.6 — Secret Management

- Install Sealed Secrets controller (Bitnami) in K8s cluster
- Create sealed secrets for:
  - `postgres-credentials` — DB user/password, connection string
  - `kafka-credentials` — SASL username/password
  - `keycloak-secrets` — admin password, client secrets
  - `immudb-credentials` — root password, API key
  - `redis-credentials` — password
  - `mongodb-credentials` — root password
  - `jwt-signing-keys` — RSA key pair for e-signatures
  - `hmac-keys` — QR code HMAC-SHA256 secret
  - `mayan-credentials` — Mayan-EDMS admin password
  - `harbor-pull-secret` — container registry credentials
- Document rotation procedure in `docs/sop/SOP_SecretManagement.md`

Files:

- `k8s/secrets/` — sealed secret templates (encrypted, safe to commit)
- `.github/workflows/deploy-staging.yml`
- `.github/workflows/deploy-production.yml`
- `.github/workflows/rollback.yml`

---

## EPIC 12 — Observability Stack

### Step 12.1 — OpenTelemetry Instrumentation (Application Services)

Create `libs/shared/config/src/telemetry/otel.module.ts`:

- Initialize OpenTelemetry SDK before NestJS bootstrap
- HTTP instrumentation (express/fastify)
- Kafka producer/consumer instrumentation
- DrizzleORM/pg instrumentation (database spans)
- Redis instrumentation
- Custom spans for business-critical operations (e-signature, workflow transitions)
- Export traces via OTLP to Tempo
- Export metrics via Prometheus scrape endpoint (`/metrics`)

Configure in each NestJS `main.ts`:

```typescript
import { initTelemetry } from '@gacp-erp/shared/config/telemetry';
initTelemetry({ serviceName: 'api-gateway' });
// then bootstrap NestJS
```

Go audit-consumer: verify existing OTel setup; add spans for:

- Kafka message processing
- ImmuDB write operations
- ALCOA+ validation

### Step 12.2 — Structured Logging

Create `libs/shared/config/src/logging/logger.factory.ts`:

- JSON-structured log output: `{ timestamp, level, service, traceId, spanId, userId, message, metadata }`
- Integration with NestJS Logger module
- Correlation ID propagation via async local storage
- Log levels per environment (debug in dev, info in staging, warn in production)

### Step 12.3 — VictoriaMetrics Cluster (Application Metrics)

Deploy via Helm subchart in `gacp-observability` namespace:

- VictoriaMetrics Operator
- VMCluster: vmselect (2), vminsert (2), vmstorage (3) — HA
- VMAgent: scrape all NestJS `/metrics` endpoints (ServiceMonitor CRDs)
- Retention: 12 months, 500GB SSD

Business metrics to expose:

- `gacp_cultivation_active_plants` (gauge)
- `gacp_cultivation_batch_progress` (gauge per stage)
- `gacp_quality_open_capas` (gauge)
- `gacp_quality_open_deviations` (gauge by classification)
- `gacp_quality_pending_change_controls` (gauge)
- `gacp_training_compliance_rate` (gauge by department)
- `gacp_training_expiring_certifications` (gauge, 30/60/90 day windows)
- `gacp_audit_events_total` (counter)
- `gacp_audit_immudb_write_latency` (histogram)
- `gacp_signatures_created_total` (counter)
- `gacp_signatures_verified_total` (counter)
- `gacp_iot_alerts_triggered_total` (counter by zone, sensor_type, alert_level)

### Step 12.4 — Grafana Dashboards

Deploy Grafana 10+ with datasources: VictoriaMetrics (app), VictoriaMetrics (IoT), Tempo, Loki.

Create dashboards (provisioned as ConfigMaps):

| Dashboard             | Key Panels                                                                                    |
| --------------------- | --------------------------------------------------------------------------------------------- |
| **System Overview**   | CPU/memory/network per pod; pod restarts; disk usage; node status                             |
| **API Gateway**       | Request rate, latency P50/P95/P99, error rate by endpoint, auth failure rate                  |
| **Cultivation**       | Active plants by stage, batch progress, harvest yields, QR scans/day                          |
| **Quality**           | Open CAPAs (by age), deviations (by classification), change controls (by status), trend lines |
| **IoT & Environment** | Temperature/humidity/CO2 per zone (live), alert count, threshold breaches                     |
| **Financial**         | GL balance check (debits = credits), biological asset valuations, PO status                   |
| **Audit Trail**       | Events/sec, ImmuDB write latency, verification success rate, signature count                  |
| **Training**          | Completion % by department, expiring certs (30/60/90d), overdue training                      |

### Step 12.5 — Distributed Tracing (Tempo)

Deploy Grafana Tempo in `gacp-observability`:

- OTLP gRPC receiver (port 4317)
- Retention: 30 days (traces), 7 days (service graph)
- Backend: S3 (MinIO) for long-term storage
- Integration with Grafana: trace ID → logs correlation

Trace context propagation:

- HTTP: `traceparent` header (W3C Trace Context)
- Kafka: `traceparent` in message headers — Go consumer extracts and continues trace

### Step 12.6 — Centralized Logging (Loki)

Deploy Grafana Loki + Promtail:

- Promtail DaemonSet: collect stdout/stderr from all pods via Kubernetes API
- Loki: label-based indexing (`service`, `namespace`, `level`)
- Retention: 90 days hot, 1 year warm, 7 years cold (compliance archive)
- Alert rules: `level=error` count > 10/min → warning; `level=fatal` → critical

### Step 12.7 — Alerting Rules

Configure in VMAlert / Grafana Alerting:

**CRITICAL** (immediate action, page on-call):

- Service pod CrashLoopBackOff > 2 min
- PostgreSQL primary unreachable > 30s
- Kafka consumer lag > 10,000 messages
- ImmuDB write failure
- E-signature service unavailable
- Audit trail ingestion stopped > 5 min
- Disk usage > 95%

**WARNING** (investigate within 4 hours):

- API P95 latency > 200ms for > 5 min
- Disk usage > 80%
- TLS certificate expiry < 30 days
- Training certification expiry < 30 days
- CAPA overdue (past effectiveness check date)
- Kafka consumer lag > 1,000 messages
- Pod memory usage > 80% of limit

**INFO** (daily review):

- Deployment completed
- Backup completed
- New user registered
- Training completed
- Change control approved

Notification channels:

- CRITICAL → Telegram bot + email
- WARNING → email
- INFO → Grafana annotation only

Files:

- `libs/shared/config/src/telemetry/` — OTel module
- `libs/shared/config/src/logging/` — structured logger
- `helm/gacp-erp/charts/victoriametrics-app/`
- `helm/gacp-erp/charts/grafana/`
- `helm/gacp-erp/charts/tempo/`
- `helm/gacp-erp/charts/loki/`
- `k8s/base/observability/` — alert rules, dashboard ConfigMaps

---

## EPIC 13 — Security Hardening

### Step 13.1 — Istio Service Mesh + mTLS

- Install Istio operator in K8s cluster
- Enable `PeerAuthentication` strict mTLS for `gacp-erp` namespace:
  ```yaml
  apiVersion: security.istio.io/v1
  kind: PeerAuthentication
  metadata:
    name: default
    namespace: gacp-erp
  spec:
    mtls:
      mode: STRICT
  ```
- `AuthorizationPolicy` per service:
  - `api-gateway`: allow from `istio-ingressgateway` (external traffic)
  - `cultivation-service`, `quality-service`, `financial-service`, `workforce-service`, `analytics-service`: allow only from `api-gateway`
  - `audit-consumer`: allow egress to Kafka, ImmuDB, PostgreSQL only
- Replace Nginx Ingress with Istio Gateway + VirtualService for TLS termination
- Rate limiting via `EnvoyFilter` at ingress: 100 req/min per IP (matches existing throttler)

### Step 13.2 — Kubernetes Security Policies

- Network Policies (deny-by-default per namespace):

  ```yaml
  # Default deny all in gacp-erp namespace
  apiVersion: networking.k8s.io/v1
  kind: NetworkPolicy
  metadata:
    name: default-deny-all
    namespace: gacp-erp
  spec:
    podSelector: {}
    policyTypes: [Ingress, Egress]
  ```

  Then explicit allow rules per service (see Step 11.3 networkpolicy.yaml files)

- Pod Security Standards: apply `restricted` profile via namespace labels
- Install Kyverno for policy enforcement:
  - Block `privileged` containers
  - Require resource limits on all containers
  - Block `latest` image tags
  - Require readiness/liveness probes
  - Require non-root user
  - Block host network/PID/IPC

### Step 13.3 — Application Security Audit

Verify existing security controls:

| Control                | Implementation                    | Action                                                                      |
| ---------------------- | --------------------------------- | --------------------------------------------------------------------------- |
| OWASP Security Headers | `helmet` in api-gateway           | Verify: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy |
| Rate Limiting          | `@nestjs/throttler` (100 req/min) | Verify configuration + test                                                 |
| Input Validation       | Zod schemas on all endpoints      | Verify no unvalidated endpoints exist                                       |
| SQL Injection          | DrizzleORM parameterized queries  | Verify no raw SQL anywhere                                                  |
| XSS Prevention         | React automatic escaping + CSP    | Verify CSP policy in Next.js                                                |
| CSRF Protection        | SameSite cookies + CSRF tokens    | Verify `next-auth` CSRF configuration                                       |
| CORS                   | Configured in api-gateway         | Verify allowed origins list                                                 |
| JWT Validation         | Keycloak JWKS endpoint            | Verify key rotation handling                                                |
| Session Management     | `next-auth` v5                    | Verify session timeout (30 min idle, 8 hours max)                           |
| Password Policy        | Keycloak realm                    | Verify: min 12 chars, complexity, MFA for critical roles                    |

### Step 13.4 — Vulnerability Scanning Pipeline

Create `.github/workflows/security-scan.yml`:

- **Trivy**: scan Docker images on every PR (block HIGH/CRITICAL)
- **npm audit / pnpm audit**: run on every PR
- **govulncheck**: scan Go dependencies on every PR
- **OWASP ZAP**: scheduled weekly scan against staging (baseline scan)
- Report results as PR comment (for PR-triggered scans)

Create `.github/dependabot.yml`:

- Auto-create PRs for dependency updates (npm, Go modules, Docker)
- Group minor/patch updates
- Require CI pass before merge

### Step 13.5 — Encryption & Certificate Management

- **cert-manager**: deploy in K8s, configure internal CA (or Let's Encrypt for public endpoints)
- **Kafka TLS**: enable TLS between Strimzi brokers and clients
- **PostgreSQL TLS**: enable `sslmode=verify-full` for all connections
- **Redis TLS**: enable TLS for Redis connections
- **ImmuDB TLS**: enable mTLS for gRPC client connections
- **Document encryption at rest**: PostgreSQL tablespace encryption via LUKS on PVCs
- **Key rotation**: document SOP, implement automated cert renewal via cert-manager

### Step 13.6 — Internal Penetration Test

- Define scope: API Gateway endpoints, Keycloak login, web-portal, audit-consumer HTTP
- Execute OWASP Top 10 checklist:
  1. Broken Access Control — test RBAC bypass, privilege escalation
  2. Cryptographic Failures — verify TLS, check for weak ciphers
  3. Injection — SQL, XSS, command injection attempts
  4. Insecure Design — review workflow state machine for bypass
  5. Security Misconfiguration — default credentials, verbose errors, open ports
  6. Vulnerable Components — Trivy scan results
  7. Authentication Failures — brute force, credential stuffing, session fixation
  8. Data Integrity — audit trail tampering attempts
  9. Logging Failures — verify all auth events logged
  10. SSRF — test all external URL inputs
- Document results in `docs/validation/results/SecurityAssessment_Report.md`
- Remediate all HIGH/CRITICAL findings before production

Files:

- `k8s/base/istio/` — PeerAuthentication, AuthorizationPolicy, Gateway, VirtualService
- `k8s/base/kyverno/` — ClusterPolicy resources
- `.github/workflows/security-scan.yml`
- `.github/dependabot.yml`
- `docs/sop/SOP_PenetrationTesting.md`
- `docs/validation/results/SecurityAssessment_Report.md`

---

## EPIC 14 — Frontend Full Implementation

### Step 14.1 — Design System & Shared Components

Complete shadcn/ui theme:

- Color palette: GACP-ERP brand colors (green primary for cultivation, blue for quality, amber for alerts)
- Typography: Inter font, consistent heading/body sizes
- Spacing: 4px grid system

Create shared components in `libs/ui-components/src/`:

| Component          | Purpose                                                                        |
| ------------------ | ------------------------------------------------------------------------------ |
| `DataTable`        | Generic table: sorting, filtering, pagination (TanStack Table + shadcn)        |
| `FormBuilder`      | Auto-generate form from Zod schema (react-hook-form + @hookform/resolvers/zod) |
| `WorkflowTimeline` | Horizontal step indicator for workflow states (CAPA, CC, Deviation, etc.)      |
| `SignatureDialog`  | Modal: re-authenticate → confirm intent → submit e-signature                   |
| `AuditTrailPanel`  | Collapsible timeline of audit events for any entity                            |
| `StatusBadge`      | Colored badge per entity status (DRAFT=gray, APPROVED=green, CLOSED=blue)      |
| `KPICard`          | Metric card with value, label, trend indicator, sparkline                      |
| `DateRangePicker`  | Date range selector for reports and filters                                    |
| `EntitySearch`     | Debounced search with autocomplete for any entity type                         |
| `ConfirmDialog`    | Confirmation dialog for destructive/critical actions                           |

Create React Query hooks in `apps/web-portal/src/hooks/`:

- `useApiClient()` — ts-rest client wrapper with auth token injection
- Per-contract hooks: `usePlants()`, `useBatches()`, `useChangeControls()`, etc.
- Mutation hooks with optimistic updates and audit event correlation

### Step 14.2 — Plant Lifecycle Module UI

`apps/web-portal/src/app/(protected)/plants/`:

- `page.tsx` — plant list: filterable by stage, zone, batch. DataTable with bulk actions
- `[id]/page.tsx` — plant detail: QR code display, growth stage timeline, stage history, audit trail panel
- `[id]/transition/page.tsx` — stage transition form with SignatureDialog (for critical stages)
- `new/page.tsx` — create plant form (select batch, zone, strain)

`apps/web-portal/src/app/(protected)/batches/`:

- `page.tsx` — batch list: progress bars per batch (% at each stage), status badges
- `[id]/page.tsx` — batch detail: plant list, harvest records, cost allocation, zone assignment
- `[id]/harvest/page.tsx` — harvest form: yield weight, moisture content, quality grade + e-signature
- `new/page.tsx` — create batch form

Roles: CULTIVATION_MANAGER, OPERATOR can create/transition; READONLY can view.

### Step 14.3 — Quality Management Module UI

`apps/web-portal/src/app/(protected)/quality/`:

**Change Controls**:

- `change-controls/page.tsx` — list with filters (status, type, date range)
- `change-controls/[id]/page.tsx` — workflow dashboard: WorkflowTimeline, impact assessment list, approval chain, linked CAPAs/deviations, AuditTrailPanel
- `change-controls/[id]/submit/page.tsx` — submit for review form
- `change-controls/[id]/assess/page.tsx` — impact assessment form (area, risk level, description)
- `change-controls/[id]/approve/page.tsx` — approval with SignatureDialog
- `change-controls/new/page.tsx` — create change control

**CAPAs**:

- `capas/page.tsx` — list with root cause category filters, overdue highlighting
- `capas/[id]/page.tsx` — CAPA detail: RCA findings, action plan, effectiveness checks, linked records
- `capas/[id]/rca/page.tsx` — root cause analysis form (5-why, fishbone template)
- `capas/new/page.tsx` — create CAPA (link from deviation or manual)

**Deviations**:

- `deviations/page.tsx` — list with classification badges (MINOR=yellow, MAJOR=orange, CRITICAL=red)
- `deviations/[id]/page.tsx` — investigation detail, impact assessment, linked CAPA
- `deviations/new/page.tsx` — report deviation form

**Validation Protocols**:

- `validation-protocols/page.tsx` — list with type filter (IQ/OQ/PQ)
- `validation-protocols/[id]/page.tsx` — protocol detail: test steps table, execute button per step
- `validation-protocols/[id]/execute/page.tsx` — test execution form: actual result, pass/fail, exception note + e-signature

**Quality Events**:

- `quality-events/page.tsx` — event list with severity filter
- `quality-events/[id]/page.tsx` — event detail, investigation findings, linked records

Roles: QUALITY_MANAGER can manage all; AUDITOR can view and create quality events.

### Step 14.4 — Financial & Procurement Module UI

`apps/web-portal/src/app/(protected)/financial/`:

- `accounts/page.tsx` — chart of accounts: tree view (expandable parent → children)
- `journal-entries/page.tsx` — journal entry list with status filter + date range
- `journal-entries/[id]/page.tsx` — entry detail: debit/credit lines, balance check (Σ debits = Σ credits)
- `journal-entries/new/page.tsx` — create journal entry form with dynamic line addition
- `biological-assets/page.tsx` — batch-by-batch valuation dashboard: current fair value, cost-to-sell, NRV
- `payroll/page.tsx` — payroll runs list, current period run

`apps/web-portal/src/app/(protected)/procurement/`:

- `suppliers/page.tsx` — supplier list with qualification status badge (QUALIFIED=green, PROVISIONAL=yellow, DISQUALIFIED=red)
- `suppliers/[id]/page.tsx` — supplier detail, qualification history, associated POs
- `purchase-orders/page.tsx` — PO list with lifecycle status filter
- `purchase-orders/[id]/page.tsx` — PO detail: lines, receiving records, 3-way match status
- `purchase-orders/[id]/approve/page.tsx` — PO approval with SignatureDialog
- `receiving/page.tsx` — goods receiving form: select PO, enter received quantities, quality check + e-signature

`apps/web-portal/src/app/(protected)/spatial/`:

- `zones/page.tsx` — zone list with occupancy % bars, type filter
- `zones/[id]/page.tsx` — zone detail: assigned batches, sensor readings, capacity history

Roles: FINANCIAL_MANAGER for journal entries, payroll; PROCUREMENT_MANAGER for POs; CULTIVATION_MANAGER for zone assignments.

### Step 14.5 — Workforce & Training Module UI

`apps/web-portal/src/app/(protected)/workforce/`:

- `employees/page.tsx` — employee directory: search, filter by department/position
- `employees/[id]/page.tsx` — employee detail: competency profile, assigned tasks, time entries, certifications
- `tasks/page.tsx` — Kanban board (PENDING | IN_PROGRESS | COMPLETED | OVERDUE columns), drag-and-drop
- `tasks/mobile/page.tsx` — mobile-optimized task list (minimal payload, large touch targets, PWA offline-capable)
- `time-entries/page.tsx` — time tracking: clock-in/clock-out, daily summary, weekly totals

`apps/web-portal/src/app/(protected)/training/`:

- `courses/page.tsx` — course catalog with applicable roles tags
- `executions/page.tsx` — training execution list, schedule new training session
- `executions/[id]/page.tsx` — execution detail: score entry, pass/fail, SignatureDialog for completion
- `certifications/page.tsx` — certification matrix: employees × required courses, color-coded (valid=green, expiring=yellow, expired=red)
- `compliance/page.tsx` — (already exists, extend) add per-department completion % and drill-down

### Step 14.6 — 3D Visualization (XeoKit)

Install XeoKit SDK: `@xeokit/xeokit-sdk`

Create `libs/ui-components/src/xeokit/`:

- `FacilityViewer.tsx` — main XeoKit viewer component:
  - Load IFC/glTF model of facility building
  - Color-code zones by type: cultivation (green), processing (blue), storage (amber), utility (gray), office (white)
  - Click zone → sidebar panel:
    - Current sensor readings (temperature, humidity, CO2, light)
    - Active batch assignments
    - Occupancy percentage
    - Active alerts
  - Toolbar: rotate, pan, zoom, reset view, toggle zone labels
- `ZoneHighlighter.tsx` — highlight zone on hover, glow on active alert
- `SensorOverlay.tsx` — floating sensor value badges above zones

`apps/web-portal/src/app/(protected)/spatial/3d/`:

- `page.tsx` — fullscreen 3D facility viewer with sidebar panels
- Integration: clicking zone in 3D navigates to `/spatial/zones/[id]` detail page

Model management:

- Upload IFC/glTF model via Mayan-EDMS or MinIO
- Store model reference in `facility_zones` table (`model_url`, `model_element_id` per zone)

### Step 14.7 — Document Management UI (Mayan-EDMS)

`apps/web-portal/src/app/(protected)/documents/`:

- `page.tsx` — document registry: list from PostgreSQL `documents` table, synced with Mayan-EDMS
- `[id]/page.tsx` — document detail: version history, approval workflow, PDF viewer (embedded iframe to Mayan or native viewer)
- `upload/page.tsx` — upload form: file, document type (SOP/FORM/REPORT/PROTOCOL/POLICY), classification, metadata
- `[id]/approve/page.tsx` — document approval with SignatureDialog (creates new `document_version`)

Integration approach: REST API calls to `libs/shared/integrations/mayan/` (already implemented), NOT iframe.

### Step 14.8 — Analytics & Reports Extension

`apps/web-portal/src/app/(protected)/analytics/`:

- `page.tsx` — overview: KPI cards for each module (plants, quality, financial, workforce, training)
- `trends/page.tsx` — 12-month trend charts (recharts): CAPAs opened/closed, deviations, training completions
- `trends/[module]/page.tsx` — module-specific deep-dive trend analysis

`apps/web-portal/src/app/(protected)/reports/`:

- `page.tsx` — report catalog: list available report types
- `generate/page.tsx` — report generation form: report type, date range, format (PDF/JSON), preview → download
- `audit-trail/page.tsx` — audit trail export: filter by entity type, date range, user → export as PDF/CSV

Extend existing `/compliance` pages:

- KPI cards: open CAPAs, open deviations, pending change controls, training compliance %
- Chart: compliance trend over 12 months

### Step 14.9 — Frontend Testing

**Component tests** (React Testing Library):

- All shared components: DataTable, FormBuilder, WorkflowTimeline, SignatureDialog
- Key page components: plant list, batch detail, CAPA form, training execution

**E2E tests** (Playwright — preferred for Next.js App Router):

- `apps/web-portal/e2e/`:
  - `auth.spec.ts` — login → dashboard → logout
  - `plants.spec.ts` — create plant → transition stages → view history
  - `quality.spec.ts` — create deviation → investigate → link CAPA → close
  - `financial.spec.ts` — create journal entry → post → verify balance
  - `training.spec.ts` — schedule training → complete → verify certification
  - `iot.spec.ts` — view IoT dashboard → create threshold → verify alert display

Add Playwright to CI:

```yaml
# .github/workflows/ci.yml addition
e2e:
  needs: [build]
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - run: docker compose -f docker/docker-compose.test.yml up -d
    - run: npx playwright install
    - run: npx nx e2e web-portal
```

Files:

- `libs/ui-components/src/` — all shared components
- `apps/web-portal/src/app/(protected)/` — all module pages
- `apps/web-portal/src/hooks/` — React Query hooks
- `apps/web-portal/e2e/` — Playwright E2E tests
- `libs/ui-components/src/xeokit/` — XeoKit components

---

## EPIC 15 — Disaster Recovery & Backup

### Step 15.1 — PostgreSQL Backup Pipeline

Using CloudNativePG operator built-in backup:

```yaml
# In postgres cluster spec
backup:
  barmanObjectStore:
    destinationPath: s3://gacp-erp-backups/postgres/
    endpointURL: http://minio.gacp-data:9000
    s3Credentials:
      accessKeyId:
        name: minio-credentials
        key: ACCESS_KEY_ID
      secretAccessKey:
        name: minio-credentials
        key: SECRET_ACCESS_KEY
    wal:
      compression: gzip
  retentionPolicy: '90d'

# Scheduled backups
scheduledBackups:
  - name: daily-backup
    schedule: '0 2 * * *' # Daily at 02:00 UTC
    backupOwnerReference: self
    method: barmanObjectStore
```

Additional backup CronJobs:

- `k8s/cronjobs/backup-immudb.yaml` — daily `immuadmin backup` → MinIO
- `k8s/cronjobs/backup-mongodb.yaml` — daily `mongodump` → MinIO
- `k8s/cronjobs/backup-archive.yaml` — monthly: copy full backups to cold storage (S3 Glacier class in MinIO policy or cloud sync)

Retention policy:

- **Incremental WAL**: continuous, 7-day window
- **Daily full**: 30 days
- **Weekly**: 52 weeks
- **Monthly**: 7 years (**regulatory requirement** — 21 CFR Part 11, EU GMP Annex 11 §7.1)

### Step 15.2 — Automated Backup Verification

Create `k8s/cronjobs/verify-backup.yaml`:

- Schedule: weekly (Sunday 04:00 UTC)
- Steps:
  1. Restore latest PostgreSQL backup to ephemeral pod
  2. Run integrity checks: `SELECT count(*) FROM plants`, `SELECT count(*) FROM audit_trail`
  3. Verify ImmuDB backup: restore to ephemeral instance, run `VerifiedGet` on known TX-id
  4. Report status to Grafana/VictoriaMetrics metric (`gacp_backup_verification_status`)
  5. Alert on failure → CRITICAL

### Step 15.3 — PostgreSQL High Availability

CloudNativePG handles HA natively:

- 1 primary + 1 synchronous replica (RPO = 0 for committed transactions)
- Automatic failover: replica promoted to primary within 30 seconds
- Read replicas for analytics-service queries (via `ro` service endpoint)

Application configuration:

- All write services: connect to `postgres-rw.gacp-data` service
- Analytics service: connect to `postgres-ro.gacp-data` service
- Connection failover: `targetSessionAttrs=primary` in connection string

### Step 15.4 — WORM Storage for Audit Data

- Configure MinIO bucket `gacp-erp-audit-worm` with Object Lock (Governance mode):
  - Retention: 7 years (2555 days)
  - Objects cannot be deleted or overwritten within retention period
- Export ImmuDB audit records to WORM bucket: daily CronJob exports new TX entries as signed JSON
- Additional: monthly export of full ImmuDB state to WORM storage

### Step 15.5 — Multi-Cloud DR Preparation (Scripts & Documentation)

Prepare but do not activate:

- `scripts/dr/setup-aws-replica.sh` — provisions AWS RDS PostgreSQL read replica
- `scripts/dr/setup-azure-replica.sh` — provisions Azure PostgreSQL Flexible Server
- `scripts/dr/sync-worm-s3.sh` — syncs MinIO WORM bucket to AWS S3 Object Lock
- `scripts/dr/sync-worm-azure.sh` — syncs MinIO WORM bucket to Azure Immutable Blob Storage
- Document in `docs/runbooks/DR_MULTICLOUD.md`

### Step 15.6 — DR Drill

Execute drill and document results:

1. **Scenario**: Primary PostgreSQL node failure

   - Stop primary pod
   - Verify automatic failover (CloudNativePG promotes replica)
   - **Target RTO**: < 15 minutes, **Target RPO**: < 5 minutes
   - Verify all services reconnect automatically
   - Verify no data loss in audit trail

2. **Scenario**: Kafka broker failure

   - Stop 1 of 3 Kafka brokers
   - Verify partition leadership transfer
   - Verify no message loss (check consumer lag)
   - **Target**: < 5 minutes recovery

3. **Scenario**: Full cluster recovery from backup

   - Restore PostgreSQL from daily backup
   - Restore ImmuDB from backup
   - Verify data consistency
   - **Target RTO**: < 30 minutes

4. Document results in `docs/validation/results/DR_Drill_Report.md`

Files:

- `k8s/cronjobs/backup-immudb.yaml`
- `k8s/cronjobs/backup-mongodb.yaml`
- `k8s/cronjobs/backup-archive.yaml`
- `k8s/cronjobs/verify-backup.yaml`
- `scripts/dr/` — DR scripts
- `docs/runbooks/DR_FAILOVER.md`
- `docs/runbooks/DR_FAILBACK.md`
- `docs/runbooks/DR_MULTICLOUD.md`
- `docs/validation/results/DR_Drill_Report.md`

---

## EPIC 16 — Validation & Self-Certification

### Step 16.1 — Installation Qualification (IQ) Execution

Execute per `docs/validation/IQ.md` checklist:

| Test ID | Verification                                 | Method                                              |
| ------- | -------------------------------------------- | --------------------------------------------------- |
| IQ-001  | All K8s namespaces created                   | `kubectl get ns`                                    |
| IQ-002  | All pods Running/Ready in gacp-erp           | `kubectl get pods -n gacp-erp` → all STATUS=Running |
| IQ-003  | PostgreSQL primary + replica healthy         | `kubectl cnpg status postgres -n gacp-data`         |
| IQ-004  | All 14 DB migrations applied                 | `SELECT * FROM drizzle.__drizzle_migrations`        |
| IQ-005  | Kafka topics created (all 31)                | `kafka-topics --list --bootstrap-server kafka:9092` |
| IQ-006  | ImmuDB accessible + ledger initialized       | `immuadmin status`                                  |
| IQ-007  | Keycloak realm `gacp-erp` loaded             | `curl http://keycloak:8080/realms/gacp-erp`         |
| IQ-008  | EMQX MQTT broker accepting connections       | `mosquitto_pub -h emqx -p 1883 -t test -m test`     |
| IQ-009  | VictoriaMetrics (app + IoT) accepting writes | `curl -X POST http://vm-app:8428/api/v1/write`      |
| IQ-010  | Grafana dashboards provisioned               | Access Grafana UI, verify 8 dashboards              |
| IQ-011  | Tempo receiving traces                       | Check Grafana Tempo datasource                      |
| IQ-012  | Loki receiving logs                          | Check Grafana Loki datasource                       |
| IQ-013  | TLS certificates valid                       | `openssl s_client -connect gacp-erp.local:443`      |
| IQ-014  | Istio mTLS enforced                          | `istioctl authn tls-check`                          |
| IQ-015  | Network policies active                      | `kubectl get networkpolicy -n gacp-erp`             |
| IQ-016  | Sealed Secrets operational                   | Verify sealed secret decryption                     |
| IQ-017  | Backup CronJobs scheduled                    | `kubectl get cronjobs -n gacp-data`                 |
| IQ-018  | Ingress controller routing correctly         | `curl https://gacp-erp.local/api/health` → 200      |
| IQ-019  | Mayan-EDMS accessible                        | `curl http://mayan:8000/api/v4/`                    |
| IQ-020  | MinIO S3 accessible                          | `mc admin info minio-local`                         |

Record results in `docs/validation/results/IQ_Report.md`, sign-off by developer.

### Step 16.2 — Operational Qualification (OQ) Execution

Execute per `docs/validation/OQ.md` — functional test protocol:

**Authentication & Authorization** (OQ-AUTH):

1. Login as each role → verify access to permitted pages only
2. MFA challenge for SUPER_ADMIN, QUALITY_MANAGER
3. Session timeout after 30 min idle
4. Account lockout after 5 failed attempts
5. Token refresh and rotation

**Plant Lifecycle** (OQ-PLANT):

1. Create batch → create plant → transition through all 6 stages → harvest
2. Invalid transition rejected with proper error
3. QR code generation → scan → plant detail retrieval
4. Batch capacity enforcement
5. Audit trail entry for every state change → verify in ImmuDB

**Quality Workflows** (OQ-QUALITY):

1. Change Control: DRAFT → SUBMITTED → IMPACT_ASSESSED → APPROVED (e-signature) → IMPLEMENTING → VERIFIED → CLOSED
2. CAPA: OPEN → RCA_IN_PROGRESS → ACTION_PLAN → IMPLEMENTING → EFFECTIVENESS_CHECK → CLOSED
3. Deviation: REPORTED → UNDER_INVESTIGATION → IMPACT_ASSESSED → CAPA_INITIATED → CLOSED
4. Validation Protocol: DRAFT → REVIEW → APPROVED (e-signature) → EXECUTING → COMPLETED → CLOSED
5. Quality Event: OPEN → INVESTIGATING → CAPA_INITIATED → CLOSED
6. Cross-module linking: deviation → CAPA → change control

**Financial** (OQ-FINANCIAL):

1. Create journal entry → post → verify GL balance (debits = credits)
2. Biological asset valuation → verify journal entry auto-created
3. PO lifecycle: create → submit → receive goods → 3-way match
4. Supplier qualification workflow
5. Spatial zone assignment → capacity enforcement

**IoT** (OQ-IOT):

1. MQTT publish → Telegraf → VictoriaMetrics IoT → API query returns data
2. Create threshold → publish breaching value → verify alert triggered → alert in history
3. Dashboard real-time update verification

**Audit Trail** (OQ-AUDIT):

1. Perform critical action → verify event in Kafka → verify ImmuDB write
2. Cryptographic proof verification via `/audit/verify/:txId`
3. ALCOA+ field completeness validation
4. Attempt audit trail tampering → verify rejection
5. 7-year retention configuration verified

**Electronic Signatures** (OQ-ESIG):

1. Create signature → re-authentication challenge → RSA-SHA256 → ImmuDB record
2. Verify signature against stored record → PASS
3. Tampered signature verification → FAIL
4. Signature bound to specific action permanently

**Training** (OQ-TRAINING):

1. Schedule training → assign trainee → complete with score → certification issued
2. Certification expiry calculation → warning at 30 days → expired status
3. Competency profile enforcement: employee missing required course → flagged

**Document Management** (OQ-DOCS):

1. Upload document → Mayan-EDMS sync → retrieve via API
2. Create new version → approve (e-signature) → supersede previous version
3. Version history integrity

Record results in `docs/validation/results/OQ_Report.md`, sign-off by developer.

### Step 16.3 — Performance Qualification (PQ) Execution

Create K6 load test scripts in `tests/load/`:

**API Load Test** (`tests/load/api-gateway.js`):

```javascript
// Target: 500 concurrent users, 10,000 req/min
export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 500 },
    { duration: '10m', target: 500 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200'], // P95 < 200ms
    http_req_failed: ['rate<0.01'], // <1% error rate
  },
};
```

**Database Load Test** (`tests/load/database.js`):

- Target: 1,000 transactions/second sustained for 10 minutes
- Mix: 70% reads, 30% writes
- Verify: avg query time < 100ms

**IoT Ingestion Test** (`tests/load/iot-ingestion.js`):

- Target: 100,000 data points/minute via MQTT
- Verify: VictoriaMetrics IoT query returns all points
- Verify: no data loss

**E-signature Throughput Test** (`tests/load/signatures.js`):

- Target: 1,000 signatures/hour
- Verify: each signature verified in ImmuDB
- Verify: response time < 2 seconds

**Page Load Test** (`tests/load/web-portal.js`):

- Target: page load < 2 seconds for all critical pages
- Test: dashboard, plant list, batch detail, compliance dashboard

**Stress Test** (`tests/load/stress.js`):

- 2x expected load (1,000 concurrent users, 20,000 req/min)
- Verify: graceful degradation (no crash, queue requests, return 503 under extreme load)
- Verify: recovery after load reduction

Record results in `docs/validation/results/PQ_Report.md`, sign-off by developer.

### Step 16.4 — Security Validation Summary

Compile security validation results:

- Trivy scan results: 0 HIGH/CRITICAL vulnerabilities in all Docker images
- OWASP ZAP scan results: 0 HIGH findings
- Dependency audit: all known vulnerabilities patched
- Penetration test: all HIGH/CRITICAL findings remediated
- Encryption verification: TLS 1.3 on all connections, AES-256 at rest

Record in `docs/validation/results/SecurityAssessment_Report.md`.

### Step 16.5 — Compliance Documentation Sign-off

1. Update all validation documents with execution results:

   - `docs/validation/VMP.md` — status: EXECUTED
   - `docs/validation/URS.md` — all requirements mapped to test results
   - `docs/validation/FS.md` — functional specs verified against OQ results
   - `docs/validation/DS.md` — design verified against IQ results
   - `docs/validation/RA.md` — risk mitigations verified
   - `docs/validation/IQ.md` — link to IQ_Report
   - `docs/validation/OQ.md` — link to OQ_Report
   - `docs/validation/PQ.md` — link to PQ_Report
   - `docs/validation/TraceabilityMatrix.md` — complete: URS → FS → DS → Test Case → Result

2. Change metadata: `author_verified: true`, `qa_approved: true` (self-certification)

3. Create `docs/validation/ValidationSummaryReport.md`:
   - Executive summary: system validated per GAMP 5 risk-based approach
   - Reference all IQ/OQ/PQ reports
   - Deviations from plan (if any) + justification
   - Conclusion: system suitable for intended use
   - Sign-off: developer name, date, electronic signature

### Step 16.6 — Production Runbooks

Create operational runbooks in `docs/runbooks/`:

| Runbook                   | Content                                                                                           |
| ------------------------- | ------------------------------------------------------------------------------------------------- |
| `DEPLOYMENT.md`           | Helm install/upgrade procedure, pre-deploy checklist, post-deploy smoke tests                     |
| `ROLLBACK.md`             | Helm rollback command, when to rollback, verification after rollback                              |
| `SCALING.md`              | HPA configuration, manual scaling, when to scale, resource monitoring                             |
| `INCIDENT_RESPONSE.md`    | Severity classification (P1-P4), escalation matrix, communication template, evidence preservation |
| `DATABASE_MAINTENANCE.md` | VACUUM schedule, REINDEX procedure, statistics update, dead tuple monitoring                      |
| `CERTIFICATE_RENEWAL.md`  | cert-manager auto-renewal verification, manual renewal procedure for external certs               |
| `SECRET_ROTATION.md`      | Sealed Secrets re-encryption, DB password rotation, JWT key rotation                              |
| `LOG_MANAGEMENT.md`       | Loki retention policies, log archival to cold storage, compliance log extraction                  |
| `BACKUP_RESTORE.md`       | CloudNativePG restore procedure, ImmuDB restore, MongoDB restore, point-in-time recovery          |
| `MONITORING_ALERTING.md`  | Alert rule inventory, on-call schedule, escalation procedures, false positive handling            |

---

## Dependency Graph

```
EPIC 10 (Tests) ←── no dependencies, start immediately
    ↓
EPIC 11 (K8s/Helm) ←── requires EPIC 10 (tests passing)
    ↓
EPIC 12 (Observability) ←── requires EPIC 11 (K8s cluster)
    ↓
EPIC 13 (Security) ←── requires EPIC 11 + EPIC 12
    ↓
EPIC 14 (Frontend) ←── steps 14.1-14.2 start parallel with EPIC 10
    ↓
EPIC 15 (DR/Backup) ←── requires EPIC 11 (K8s + DB running)
    ↓
EPIC 16 (Validation) ←── requires ALL above completed
```

### Parallelization Strategy

| Week Block  | Backend Track                             | Frontend Track                               | Infra Track                              |
| ----------- | ----------------------------------------- | -------------------------------------------- | ---------------------------------------- |
| **W1-W2**   | EPIC 10.1: Unit tests to 80%              | EPIC 14.1: Design system + shared components | —                                        |
| **W3-W4**   | EPIC 10.2: Integration tests              | EPIC 14.2: Plant Lifecycle UI                | EPIC 11.1: Dockerfiles                   |
| **W5-W6**   | EPIC 10.3: Contract tests                 | EPIC 14.3: Quality Management UI             | EPIC 11.2-11.3: K8s manifests + Helm     |
| **W7-W8**   | EPIC 11.4-11.6: CI/CD + Secrets           | EPIC 14.4: Financial/Procurement UI          | EPIC 12.1-12.3: VictoriaMetrics + OTel   |
| **W9-W10**  | EPIC 12.4-12.7: Grafana + Loki + Alerting | EPIC 14.5: Workforce/Training UI             | EPIC 13.1-13.2: Istio + Network Policies |
| **W11-W12** | EPIC 13.3-13.6: Security audit + scanning | EPIC 14.6: XeoKit 3D Visualization           | EPIC 15.1-15.3: Backup + HA              |
| **W13-W14** | EPIC 15.4-15.6: DR prep + drill           | EPIC 14.7-14.8: Documents + Analytics        | —                                        |
| **W15-W16** | EPIC 16.1-16.2: IQ + OQ execution         | EPIC 14.9: Frontend testing (Playwright)     | —                                        |
| **W17-W18** | EPIC 16.3-16.4: PQ + Security validation  | —                                            | —                                        |
| **W19-W20** | EPIC 16.5-16.6: Sign-off + Runbooks       | —                                            | Final review                             |

---

## Decisions Log

| Decision            | Choice                         | Rationale                                                               |
| ------------------- | ------------------------------ | ----------------------------------------------------------------------- |
| Deploy target       | On-premise Kubernetes          | Full control, data residency compliance, regulatory requirement         |
| MVP scope           | Full (all modules + 3D XeoKit) | User requirement: all modules for production                            |
| Jitsi Meet          | Post-MVP                       | Not compliance-critical; can use external video chat                    |
| ML/Forecasting      | Post-MVP                       | Analytics aggregation sufficient for first release                      |
| React Native mobile | Post-MVP, PWA first            | PWA with mobile-optimized pages covers initial needs                    |
| Regulatory audit    | Self-certification             | Internal validation with docs prepared for future external audit        |
| DB operator         | CloudNativePG                  | Simpler than Crunchy, built-in HA + backup to S3, active community      |
| Kafka operator      | Strimzi                        | Standard for K8s, KRaft mode, production-proven                         |
| Load testing        | K6                             | OSS, scriptable in JS, CI-friendly, supports distributed execution      |
| Service mesh        | Istio                          | mTLS required for compliance (21 CFR Part 11 data in transit)           |
| Container registry  | Harbor (on-prem)               | Compliance: control over image storage, vulnerability scanning built-in |
| GitOps              | ArgoCD (recommended, optional) | Deployment audit trail, automated sync, rollback capability             |
| Ingress             | Istio Gateway (replaces Nginx) | Single control plane for traffic + security                             |
| E2E testing         | Playwright                     | Better Next.js App Router support than Cypress, parallel execution      |
| Backup              | CloudNativePG barman + MinIO   | Native integration, S3-compatible, WORM via Object Lock                 |

---

## Verification Commands (Full Stack — Production)

```bash
# Deploy to staging
helm upgrade --install gacp-erp ./helm/gacp-erp \
  -f helm/gacp-erp/values-staging.yaml \
  -n gacp-erp --create-namespace

# Verify all pods
kubectl get pods -n gacp-erp -o wide
kubectl get pods -n gacp-data -o wide
kubectl get pods -n gacp-observability -o wide
kubectl get pods -n gacp-iot -o wide

# Health check all services
for svc in api-gateway cultivation-service quality-service financial-service workforce-service analytics-service; do
  kubectl exec -it deploy/$svc -n gacp-erp -- curl -s localhost:3000/health
done

# Run all tests
nx run-many --target=test --all --coverage

# Run integration tests
docker compose -f docker/docker-compose.test.yml up -d
nx run api-gateway:test:e2e
docker compose -f docker/docker-compose.test.yml down

# Run load tests (K6)
k6 run tests/load/api-gateway.js
k6 run tests/load/database.js
k6 run tests/load/iot-ingestion.js
k6 run tests/load/signatures.js

# Run Playwright E2E
npx nx e2e web-portal

# Security scans
trivy image harbor.internal/gacp-erp/api-gateway:latest
trivy image harbor.internal/gacp-erp/web-portal:latest
pnpm audit --audit-level=high
cd apps/audit-consumer && govulncheck ./...

# Verify Istio mTLS
istioctl authn tls-check deploy/api-gateway.gacp-erp

# Verify backup
kubectl get backups -n gacp-data
kubectl logs job/verify-backup -n gacp-data

# DR drill
kubectl delete pod postgres-1 -n gacp-data  # simulate node failure
# Verify automatic failover + no data loss
kubectl cnpg status postgres -n gacp-data

# Deploy to production (manual trigger)
helm upgrade --install gacp-erp ./helm/gacp-erp \
  -f helm/gacp-erp/values-production.yaml \
  -n gacp-erp

# Post-deploy smoke test
curl -s https://gacp-erp.local/api/health | jq .
curl -s https://gacp-erp.local/ | head -1  # verify web-portal
```

---

## Target File Structure (additions after EPIC 9)

```
gacp-erp/
├── k8s/
│   ├── namespaces.yaml
│   ├── base/
│   │   ├── api-gateway/         # deployment, service, hpa, pdb, configmap, networkpolicy
│   │   ├── cultivation-service/
│   │   ├── quality-service/
│   │   ├── financial-service/
│   │   ├── workforce-service/
│   │   ├── analytics-service/
│   │   ├── audit-consumer/
│   │   ├── web-portal/
│   │   ├── postgres/            # CloudNativePG cluster
│   │   ├── kafka/               # Strimzi Kafka
│   │   ├── redis/
│   │   ├── immudb/
│   │   ├── mongodb/
│   │   ├── minio/
│   │   ├── keycloak/
│   │   ├── emqx/
│   │   ├── telegraf/
│   │   ├── ingress/
│   │   ├── istio/               # PeerAuthentication, AuthorizationPolicy
│   │   ├── kyverno/             # ClusterPolicy
│   │   └── observability/       # alert rules, dashboard ConfigMaps
│   ├── cronjobs/
│   │   ├── backup-immudb.yaml
│   │   ├── backup-mongodb.yaml
│   │   ├── backup-archive.yaml
│   │   └── verify-backup.yaml
│   └── secrets/                 # sealed secret templates
├── helm/
│   └── gacp-erp/
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── values-staging.yaml
│       ├── values-production.yaml
│       └── charts/              # subcharts per service
├── apps/
│   ├── api-gateway/Dockerfile
│   ├── cultivation-service/Dockerfile
│   ├── quality-service/Dockerfile
│   ├── financial-service/Dockerfile
│   ├── workforce-service/Dockerfile
│   ├── analytics-service/Dockerfile
│   ├── audit-consumer/Dockerfile   # updated
│   └── web-portal/
│       ├── Dockerfile
│       ├── e2e/                    # Playwright E2E tests
│       └── src/app/(protected)/
│           ├── plants/             # EPIC 14.2
│           ├── batches/            # EPIC 14.2
│           ├── quality/            # EPIC 14.3
│           ├── financial/          # EPIC 14.4
│           ├── procurement/        # EPIC 14.4
│           ├── spatial/            # EPIC 14.4 + 14.6 (3D)
│           ├── workforce/          # EPIC 14.5
│           ├── training/           # EPIC 14.5
│           ├── documents/          # EPIC 14.7
│           ├── analytics/          # EPIC 14.8
│           └── reports/            # EPIC 14.8
├── libs/
│   ├── shared/config/src/
│   │   ├── telemetry/             # OpenTelemetry module
│   │   └── logging/               # Structured logger
│   └── ui-components/src/
│       ├── xeokit/                # XeoKit 3D components
│       ├── DataTable.tsx
│       ├── FormBuilder.tsx
│       ├── WorkflowTimeline.tsx
│       ├── SignatureDialog.tsx
│       ├── AuditTrailPanel.tsx
│       └── KPICard.tsx
├── tests/
│   └── load/
│       ├── api-gateway.js         # K6 API load test
│       ├── database.js            # K6 DB load test
│       ├── iot-ingestion.js       # K6 IoT test
│       ├── signatures.js          # K6 e-signature test
│       ├── web-portal.js          # K6 page load test
│       └── stress.js              # K6 stress test
├── scripts/
│   ├── backup/                    # backup helper scripts
│   └── dr/                        # DR failover/failback scripts
├── tools/
│   └── test-utils/
│       └── seed.ts                # test data seeding
├── docker/
│   └── docker-compose.test.yml    # ephemeral test infrastructure
├── docs/
│   ├── runbooks/
│   │   ├── DEPLOYMENT.md
│   │   ├── ROLLBACK.md
│   │   ├── SCALING.md
│   │   ├── INCIDENT_RESPONSE.md
│   │   ├── DATABASE_MAINTENANCE.md
│   │   ├── CERTIFICATE_RENEWAL.md
│   │   ├── SECRET_ROTATION.md
│   │   ├── LOG_MANAGEMENT.md
│   │   ├── BACKUP_RESTORE.md
│   │   ├── MONITORING_ALERTING.md
│   │   ├── DR_FAILOVER.md
│   │   ├── DR_FAILBACK.md
│   │   └── DR_MULTICLOUD.md
│   ├── validation/results/
│   │   ├── IQ_Report.md
│   │   ├── OQ_Report.md
│   │   ├── PQ_Report.md
│   │   ├── SecurityAssessment_Report.md
│   │   └── DR_Drill_Report.md
│   ├── validation/
│   │   └── ValidationSummaryReport.md
│   ├── generated/
│   │   └── openapi.json
│   └── sop/
│       ├── SOP_SecretManagement.md
│       └── SOP_PenetrationTesting.md
└── .github/
    ├── workflows/
    │   ├── ci.yml                 # extended: coverage gate, integration tests, Trivy, Playwright
    │   ├── deploy-staging.yml
    │   ├── deploy-production.yml
    │   ├── rollback.yml
    │   └── security-scan.yml
    └── dependabot.yml
```
