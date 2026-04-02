---
description: 'Guided feature development for GACP-ERP NestJS microservices'
---

You are implementing a feature for GACP-ERP, a pharmaceutical-grade medical cannabis ERP system. Follow this workflow to ensure compliance with project architecture, coding standards, and regulatory requirements.

## Pre-Development Checklist

Before writing code:

1. **Identify the target service**: api-gateway (3001), cultivation-service (3002), quality-service (3003), financial-service (3004), workforce-service (3005), analytics-service (3006)
2. **Read relevant SOPs** from `docs/sop/` for the domain being implemented
3. **Check ALCOA+ requirements** at `docs/compliance/ALCOA+.md` for data integrity patterns
4. **Review existing patterns** in the target service's source code

## Implementation Sequence

Follow these steps in order. Each step references the canonical location and an example file.

### Step 1: Define Zod Schemas

Location: `libs/shared/schemas/src/<domain>/`

- Extend `BaseEntitySchema` or `SoftDeletableSchema` (from `libs/shared/schemas/src/common/base-entity.schema.ts`)
- Add branded IDs to `libs/shared/schemas/src/common/branded-ids.ts` if new entity type
- Export from `libs/shared/schemas/src/index.ts`
- Example: `libs/shared/schemas/src/plants/plant.schema.ts`

### Step 2: Define API Contract

Location: `libs/shared/contracts/src/<domain>.contract.ts`

- Use `initContract()` + `c.router()` from `@ts-rest/core`
- All request bodies and responses must be Zod schemas
- Include `ApiErrorSchema` in error responses
- Export from `libs/shared/contracts/src/index.ts`
- Example: `libs/shared/contracts/src/plants.contract.ts`

### Step 3: Define Kafka Events

Location: `libs/shared/events/src/<domain>.events.ts`

- Each event extends `EventHeaderSchema` (from `libs/shared/events/src/base.events.ts`)
- Combine events into a Zod `z.discriminatedUnion('eventType', [...])`
- Define topic constant
- Include `SopReferenceSchema` for regulated events
- Export from `libs/shared/events/src/index.ts`
- Example: `libs/shared/events/src/plant.events.ts`

### Step 4: Create Database Schema

Location: `libs/shared/database/src/schema/tables.ts`

- Use Drizzle ORM table definitions (`pgTable`, `pgEnum`)
- Include audit fields: `created_at`, `updated_at`, `created_by`, `updated_by`
- Include soft-delete fields for regulatory data: `deleted_at`, `deleted_by`, `is_deleted`
- Export from `libs/shared/database/src/schema/index.ts`

### Step 5: Build Repository

Location: `apps/<service>/src/<domain>/<domain>.repository.ts`

- `@Injectable()`, inject `@Inject(DATABASE_TOKEN) private readonly db: Database`
- Provide dual methods: `create()` (standalone) and `createWithTx(tx: DbContext)` (transactional)
- Always filter: `isNull(table.deleted_at)` in WHERE clauses
- Private `mapRowTo<Entity>()` method for DB row mapping
- Pagination: manual offset `(page - 1) * limit`, return `PaginatedResponse<T>`
- Example: `apps/cultivation-service/src/plants/plants.repository.ts`

### Step 6: Build Aggregate (if stateful entity)

Location: `apps/<service>/src/<domain>/<entity>.aggregate.ts`

- Pure class, no NestJS decorators
- State machine transitions return `Result<T, DomainError>` (from `@gacp-erp/shared-schemas`)
- Define domain error subclasses extending `DomainError` at top of file
- Define `SIGNATURE_REQUIRED_TRANSITIONS` if applicable
- Example: `apps/cultivation-service/src/plants/plant.aggregate.ts`

### Step 7: Build Use Case

Location: `apps/<service>/src/<domain>/use-cases/<verb>-<entity>.use-case.ts`

- `@Injectable()` class with single `async execute(dto, userId)` method
- Inject `@Inject(DATABASE_TOKEN) db: Database` + repositories
- Wrap DB writes + outbox event in `this.db.transaction(async (tx) => { ... })`
- Never publish directly to Kafka
- Example: `apps/cultivation-service/src/plants/use-cases/create-plant.use-case.ts`

### Step 8: Build Controller

Location: `apps/<service>/src/<domain>/<domain>.controller.ts`

- `@Controller({ path: '<entities>', version: '1' })`
- Use `@ZodBody(Schema)` for request validation
- User ID from `@Headers('x-user-id') userId: string`
- Delegate to use cases, not service methods
- Example: `apps/cultivation-service/src/plants/plants.controller.ts`

### Step 9: Build Module

Location: `apps/<service>/src/<domain>/<domain>.module.ts`

- Register all providers: repository, use cases, optional service
- Import into the service's `app.module.ts`
- Example: `apps/cultivation-service/src/plants/plants.module.ts`

### Step 10: Write Tests

- Co-located `.spec.ts` files for each class
- Mock all dependencies (repositories, DB, external services)
- DB transaction mock: `{ transaction: jest.fn().mockImplementation(async (cb) => cb(mockDb)) }`
- Test 4 paths: success, validation failure, domain error, transaction failure
- Example: `apps/cultivation-service/src/plants/use-cases/create-plant.use-case.spec.ts`

### Step 11: Verify

```sh
pnpm nx run <service>:lint
pnpm nx run <service>:test
pnpm nx run <service>:typecheck
pnpm format:check
```

## Compliance Reminders

- **Never hard-delete regulatory data** -- use `SoftDeletableSchema` pattern
- **Require e-signatures for critical transitions** -- see `SIGNATURE_REQUIRED_TRANSITIONS` in `plant.aggregate.ts`
- **All events must have `triggeredBy: UserId`** for audit traceability
- **Log significant operations** with `this.logger.log()` / `.warn()` (pino via `nestjs-pino`)
- **SOP references** in events: use `SopReferenceSchema` format (`sopId`, `sopVersion`, `sopStepId`)
