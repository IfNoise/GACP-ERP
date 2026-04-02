---
description: 'Compliance-aware code review for GACP-ERP'
---

You are reviewing code for GACP-ERP, a pharmaceutical-grade medical cannabis ERP system. Code must comply with FDA 21 CFR Part 11, EU GMP Annex 11, and ALCOA+ data integrity principles.

Review the changed files against the following criteria. Reference specific file paths and line numbers in your findings.

## Architecture Compliance

- **Use Cases**: Each business action must be a separate `@Injectable()` class with a single `execute()` method. Reference pattern: `apps/cultivation-service/src/plants/use-cases/create-plant.use-case.ts`
- **Aggregates**: Must return `Result<T, E>` (from `@gacp-erp/shared-schemas`), not throw exceptions. Reference: `apps/cultivation-service/src/plants/plant.aggregate.ts`
- **Repositories**: Must provide dual methods `create()` and `createWithTx(tx: DbContext)` when used with the outbox pattern
- **Zod schemas**: Must be defined in `libs/shared/schemas/src/<domain>/`, not inline in service code
- **Kafka events**: Must extend `EventHeaderSchema` (`libs/shared/events/src/base.events.ts`) and be added to the domain's Zod discriminated union
- **API contracts**: Must use ts-rest `c.router()` with Zod schemas in `libs/shared/contracts/src/`

## Data Integrity (ALCOA+)

- **Attributable**: Every entity must have `created_by`/`updated_by` fields (via `BaseEntitySchema` from `libs/shared/schemas/src/common/base-entity.schema.ts`)
- **No hard deletes**: Regulatory data must use `SoftDeletableSchema` (adds `deleted_at`, `deleted_by`, `is_deleted`). Verify all queries filter with `isNull(table.deleted_at)`
- **Electronic signatures**: Required for critical stage transitions (HARVESTING, HARVESTED, DESTROYED, batch approval, QC release). Check for `ElectronicSignatureSchema` usage
- **Contemporaneous**: Timestamps must be ISO 8601 UTC with offset (`z.string().datetime({ offset: true })`)

## TypeScript Compliance

- No `any` types (ESLint rule `@typescript-eslint/no-explicit-any: error`)
- No `type` keyword on imported classes used in NestJS DI constructors (breaks `emitDecoratorMetadata`)
- Branded IDs used for all entity references (from `libs/shared/schemas/src/common/branded-ids.ts`), not raw `string`
- Array access respects `noUncheckedIndexedAccess` (use `rows[0]?` or guard)

## Testing

- Spec file co-located with source (`.spec.ts` next to `.ts`)
- All dependencies mocked (no real DB/Kafka in unit tests)
- DB transaction mock pattern: `mockDb.transaction.mockImplementation(async (cb) => cb(mockDb))`
- Tests cover: success path, validation failure, domain error, transaction failure

## Kafka / Events

- Outbox pattern used -- never direct Kafka publish from use cases. DB write + outbox insert must be in the same `db.transaction()`
- Event payload includes all necessary branded IDs and `triggeredBy: UserId`
- `eventVersion` is set (e.g., `'1.0'`)

## Output Format

Group findings by severity:

**BLOCKING** -- Must fix before merge (compliance violations, missing audit fields, broken patterns)

**WARNING** -- Should fix (missing tests, inconsistent naming, suboptimal patterns)

**SUGGESTION** -- Nice to have (style improvements, documentation additions)
