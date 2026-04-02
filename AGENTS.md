<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# GACP-ERP Project Guidelines

GACP-ERP is a pharmaceutical-grade medical cannabis ERP system. All code must comply with FDA 21 CFR Part 11, EU GMP Annex 11, and ALCOA+ data integrity principles.

## Before Implementing Domain Features

1. Read relevant SOPs from `docs/sop/` for the operational domain
2. Check `docs/compliance/ALCOA+.md` for data integrity requirements
3. Review existing patterns in the target service's source code
4. Consult `docs/CODING_STANDARDS.md` for project conventions

## Mandatory Patterns

- **Branded IDs**: Use typed UUID schemas from `libs/shared/schemas/src/common/branded-ids.ts`, never raw `string` for entity IDs
- **BaseEntitySchema / SoftDeletableSchema**: All entities extend these (`libs/shared/schemas/src/common/base-entity.schema.ts`). Hard deletes are forbidden per 21 CFR Part 11
- **Result<T, E>**: Domain logic returns `Result` (`libs/shared/schemas/src/common/result.schema.ts`), not exceptions. Domain errors extend `DomainError`
- **Use Cases**: One `@Injectable()` class per business action with single `execute()` method
- **Transactional Outbox**: DB writes + outbox event in same `db.transaction()`. Never publish directly to Kafka from use cases
- **Kafka Events**: Extend `EventHeaderSchema` (`libs/shared/events/src/base.events.ts`), use Zod discriminated unions per topic
- **ts-rest Contracts**: API contracts in `libs/shared/contracts/src/` using `initContract()` + `c.router()` with Zod
- **Logging**: `nestjs-pino` with `createLoggerOptions()` from `@gacp-erp/shared-config`. Bootstrap: `{ bufferLogs: true }` + `app.useLogger(app.get(Logger))`

## Code Style Rules

- `@typescript-eslint/no-explicit-any: error` -- no `any` types
- `consistent-type-imports: OFF` -- do NOT use `type` keyword on imported classes used in NestJS DI constructors (breaks `emitDecoratorMetadata`)
- `noUncheckedIndexedAccess` -- array access needs optional chaining (`rows[0]?`)
- Jest 29.7, co-located `.spec.ts`, 80% coverage threshold

## Service Ports

| Service             | Port |
| ------------------- | ---- |
| api-gateway         | 3001 |
| cultivation-service | 3002 |
| quality-service     | 3003 |
| financial-service   | 3004 |
| workforce-service   | 3005 |
| analytics-service   | 3006 |

## Shared Library Aliases

| Alias                        | Path                                 |
| ---------------------------- | ------------------------------------ |
| `@gacp-erp/shared-schemas`   | `libs/shared/schemas/src/index.ts`   |
| `@gacp-erp/shared-contracts` | `libs/shared/contracts/src/index.ts` |
| `@gacp-erp/shared-events`    | `libs/shared/events/src/index.ts`    |
| `@gacp-erp/shared-database`  | `libs/shared/database/src/index.ts`  |
| `@gacp-erp/shared-config`    | `libs/shared/config/src/index.ts`    |
| `@gacp-erp/shared-keycloak`  | `libs/shared/keycloak/src/index.ts`  |
| `@gacp-erp/ui-components`    | `libs/ui-components/src/index.ts`    |

## Key Documentation

| Topic            | File                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| Architecture     | `docs/SYSTEM_ARCHITECTURE.md`                                        |
| Coding Standards | `docs/CODING_STANDARDS.md`                                           |
| Event System     | `docs/EVENT_ARCHITECTURE.md`                                         |
| Contracts        | `docs/CONTRACT_SPECIFICATIONS.md`                                    |
| Compliance       | `docs/compliance/` (ALCOA+, FDA, EU GMP, WHO GACP)                   |
| Validation       | `docs/validation/` (URS, IQ, OQ, PQ, TraceabilityMatrix)             |
| DSL (SOPs)       | `dsl/` (YAML-based single source of truth for regulatory procedures) |
