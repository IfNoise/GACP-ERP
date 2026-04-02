# GACP-ERP -- Claude Code Instructions

Medical cannabis ERP system with pharmaceutical-grade compliance (FDA 21 CFR Part 11, EU GMP Annex 11, GACP, ALCOA+). NX monorepo, NestJS + Fastify microservices, pnpm, Node >= 22, TypeScript strict.

## Commands

```sh
pnpm nx run <project>:build          # Build one project
pnpm nx run <project>:test           # Test one project
pnpm nx run <project>:lint           # Lint one project
pnpm nx run <project>:typecheck      # Typecheck one project
pnpm nx affected --target=test       # Test affected projects
pnpm nx run-many --target=build --all # Build everything
pnpm format:check                    # Prettier check
pnpm infra:up                        # Docker Compose (core infra)
pnpm infra:dev                       # Docker Compose (dev tools)
pnpm openapi:generate                # Regenerate OpenAPI spec
```

Always use `pnpm nx`, never global `nx`.

## Workspace Layout

```
apps/
  api-gateway/          (port 3001)  NestJS+Fastify -- auth, proxy, audit interceptor
  cultivation-service/  (port 3002)  Plants, batches, harvests, QR codes
  quality-service/      (port 3003)  CAPA, deviations, change control, validation protocols
  financial-service/    (port 3004)  Accounting, procurement, spatial planning
  workforce-service/    (port 3005)  HR, training, scheduling, time tracking
  analytics-service/    (port 3006)  Reporting, dashboards
  audit-consumer/                    Go service -- Kafka consumer -> ImmuDB (not TypeScript!)
  web-portal/                        Next.js 15 App Router frontend

libs/shared/
  schemas/    @gacp-erp/shared-schemas    Zod schemas, branded IDs, Result<T,E>, base entities
  contracts/  @gacp-erp/shared-contracts  ts-rest API contracts for all domains
  events/     @gacp-erp/shared-events     Kafka event schemas (Zod discriminated unions)
  database/   @gacp-erp/shared-database   Drizzle ORM schema, connection factory, migrations
  config/     @gacp-erp/shared-config     Logger config, telemetry, metrics modules
  keycloak/   @gacp-erp/shared-keycloak   Keycloak admin REST client
libs/ui-components/  @gacp-erp/ui-components  Shared React components

dsl/          YAML-based regulatory SOPs, forms, checklists (single source of truth)
docs/         126 files -- architecture, compliance, validation, SOPs, runbooks
```

## Architecture Patterns

### Branded IDs

All entity IDs use branded UUID schemas from `libs/shared/schemas/src/common/branded-ids.ts`. Never use raw `string` for entity IDs. To add a new entity type:

```typescript
export const SampleIdSchema = z.string().uuid().brand<'SampleId'>();
export type SampleId = z.infer<typeof SampleIdSchema>;
```

### Base Entities (ALCOA+ Compliance)

All entities extend `BaseEntitySchema` (`libs/shared/schemas/src/common/base-entity.schema.ts`):

- Fields: `id`, `created_at`, `updated_at`, `created_by` (UserIdSchema), `updated_by` (UserIdSchema)
- Regulatory entities use `SoftDeletableSchema` -- adds `deleted_at`, `deleted_by`, `is_deleted`
- **Hard deletes are forbidden** per 21 CFR Part 11 Section 11.10(e)

### Electronic Signatures

Critical transitions (harvest, batch approval, destruction, QC release) require `ElectronicSignatureSchema` (`libs/shared/schemas/src/common/base-entity.schema.ts:65-92`). Includes RSA-SHA256 digital signature, content hash, authentication method, signer identity.

### Result<T, E> Pattern

Domain logic returns `Result<T, E>` (`libs/shared/schemas/src/common/result.schema.ts`), never throws exceptions. Use `ok(data)` for success, `err(error)` for failures. Check `result.success` before accessing `.data` or `.error`.

```typescript
// Aggregate methods return Result
function transition(toStage: GrowthStage): Result<StageRecord, PlantTransitionError> {
  if (!allowed.includes(toStage)) return err(new InvalidTransitionError(from, toStage));
  return ok(record);
}
```

All domain errors extend `DomainError` (abstract, requires `code: string` and `statusCode: number`). Only use NestJS exceptions (`BadRequestException`, etc.) in controllers or use-case orchestration.

### Use Cases

One `@Injectable()` class per business action. File: `<verb>-<entity>.use-case.ts`. Single `async execute(dto, userId)` method. Reference: `apps/cultivation-service/src/plants/use-cases/create-plant.use-case.ts`.

### Aggregates

Rich domain model classes without NestJS decorators. Encapsulate state machines, return `Result<T, E>` from mutation methods. Reference: `apps/cultivation-service/src/plants/plant.aggregate.ts`.

### Repositories

Drizzle ORM, `@Injectable()`. Inject via `@Inject(DATABASE_TOKEN) db: Database`. Provide dual methods:

- `create(data)` -- standalone transaction
- `createWithTx(tx: DbContext, data)` -- caller-managed transaction (for outbox pattern)

Always filter soft-deleted records: `isNull(table.deleted_at)` in WHERE clauses.

### Transactional Outbox

All Kafka events go through the outbox pattern. Use cases wrap DB write + outbox insert in `db.transaction()`:

```typescript
await this.db.transaction(async (tx) => {
  await this.repository.createWithTx(tx, entity);
  await this.outboxRepository.createWithTx(tx, {
    topic: 'cultivation.plants.v1',
    key: entity.id,
    payload: { eventType: 'PlantCreated', ...eventData },
  });
});
```

`OutboxRelayService` polls every 5s, batch 50, publishes to Kafka. Never publish directly to Kafka from use cases. Reference: `apps/cultivation-service/src/outbox/`.

### Kafka Events

Events extend `EventHeaderSchema` (`libs/shared/events/src/base.events.ts`): `eventId`, `occurredAt`, `eventVersion`, `producerService`, `topic`, `correlationId`, `triggeredBy`. Each topic uses a Zod `discriminatedUnion('eventType', [...])`. Reference: `libs/shared/events/src/plant.events.ts`.

### ts-rest Contracts

API contracts use `initContract()` + `c.router()` with Zod schemas for body/query/pathParams/responses. All contracts live in `libs/shared/contracts/src/`. Reference: `libs/shared/contracts/src/plants.contract.ts`.

### Controllers

Use `@ZodBody(Schema)` decorator for request validation. Versioned routes: `@Controller({ path: 'entities', version: '1' })`. User ID from `@Headers('x-user-id')`.

### Auth

Keycloak JWT strategy (`apps/api-gateway/src/auth/jwt.strategy.ts`). Guards: `JwtAuthGuard`, `RolesGuard` (`apps/api-gateway/src/auth/guards/`). Roles: `SUPER_ADMIN`, `QUALITY_MANAGER`, `CULTIVATION_MANAGER`, `OPERATOR`, `AUDITOR`, `READONLY`. Audit interceptor logs all mutations to `audit.trail.v1` Kafka topic.

## Logging

All services use `nestjs-pino`. Config: `createLoggerOptions('service-name')` from `libs/shared/config/src/logging/pino-logger.config.ts`.

Bootstrap: `{ bufferLogs: true }` + `app.useLogger(app.get(Logger))`.
OTel correlation: `trace_id`/`span_id` auto-injected via mixin.
Redacted: `req.headers.authorization`, `req.headers.cookie`.

## Code Style

- **Prettier**: singleQuote, printWidth 100, tabWidth 2, trailingComma all, arrowParens always (see `.prettierrc`)
- **ESLint**: `@typescript-eslint/no-explicit-any: error`. `consistent-type-imports: OFF` -- breaks NestJS DI `emitDecoratorMetadata` (see `eslint.config.js`)
- **TypeScript**: strict, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `emitDecoratorMetadata` + `experimentalDecorators` (see `tsconfig.base.json`)

## Testing

Jest 29.7 via NX preset. Co-located `.spec.ts` files. 80% coverage threshold (branches/functions/lines/statements).

- Mock all dependencies -- no real DB/Kafka in unit tests
- DB transaction mock: `{ transaction: jest.fn().mockImplementation(async (cb) => cb(mockDb)) }`
- Test success path, validation failure, domain error, and transaction failure
- Reference: `apps/cultivation-service/src/plants/use-cases/create-plant.use-case.spec.ts`

## Compliance

Before implementing domain features:

1. Read relevant SOPs from `docs/sop/` (53 SOPs covering all operational domains)
2. Check `docs/compliance/ALCOA+.md` for data integrity requirements
3. Check `docs/compliance/FDA_21CFR_Part11.md` for electronic records/signatures
4. DSL definitions at `dsl/` are the single source of truth for regulatory procedures

## Documentation Pointers

| Topic            | File                                                             |
| ---------------- | ---------------------------------------------------------------- |
| Architecture     | `docs/SYSTEM_ARCHITECTURE.md`                                    |
| Coding Standards | `docs/CODING_STANDARDS.md`                                       |
| Event System     | `docs/EVENT_ARCHITECTURE.md`                                     |
| API Contracts    | `docs/CONTRACT_SPECIFICATIONS.md`                                |
| Data Dictionary  | `docs/data_dictionary/`                                          |
| Validation       | `docs/validation/` (URS, FS, DS, IQ, OQ, PQ, TraceabilityMatrix) |
| Compliance       | `docs/compliance/` (ALCOA+, FDA, EU GMP, WHO GACP, GAMP5)        |
| Dev Roadmap      | `docs/DEVELOPMENT_ROADMAP.md`                                    |

## Gotchas

- `apps/api-gateway/src/main.ts` has 2 pre-existing TS errors in proxy handler (body type + reply chain) -- don't "fix" without understanding the proxy logic
- **Never** use `type` keyword on imported classes used in NestJS DI constructor injection -- `emitDecoratorMetadata` erases type-only imports, causing runtime DI failures
- The `audit-consumer` is a **Go** service, not TypeScript. It reads from Kafka and writes to ImmuDB
- All query results from Drizzle with array access need optional chaining (`rows[0]?`) due to `noUncheckedIndexedAccess`
