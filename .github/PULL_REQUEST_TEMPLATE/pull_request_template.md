## Summary

<!-- 1-3 sentences: what does this PR do and why? -->

## Type of Change

- [ ] Feature (new functionality)
- [ ] Bug fix (corrects existing behavior)
- [ ] Refactor (no behavior change)
- [ ] Infrastructure / CI
- [ ] Documentation
- [ ] Compliance / Regulatory

## Affected Services / Libs

<!-- List affected projects, e.g.: cultivation-service, shared-schemas -->

## Related Issues

<!-- Closes #123, Relates to #456 -->

## Compliance Checklist

- [ ] No hard deletes of regulatory data (soft delete via `SoftDeletableSchema`)
- [ ] Audit fields present (`created_by`, `updated_by` via `BaseEntitySchema`)
- [ ] Electronic signatures where required (harvest, batch approval, destruction, QC release)
- [ ] SOP references included in domain events (`SopReferenceSchema`) for regulated actions
- [ ] ALCOA+ data integrity principles maintained
- [ ] N/A -- no compliance-relevant changes

## Code Checklist

- [ ] Follows DDD patterns (use cases, aggregates, repositories)
- [ ] Zod schemas defined in `libs/shared/schemas/` (not inline in services)
- [ ] ts-rest contract updated if API surface changed
- [ ] Kafka event schema added to `libs/shared/events/` with discriminated union
- [ ] Outbox pattern used for Kafka events (no direct publish from use cases)
- [ ] `Result<T, E>` for domain errors (no thrown exceptions from aggregates)
- [ ] Branded IDs used for entity references (not raw strings)
- [ ] Tests added/updated (80% coverage threshold)
- [ ] No `any` types introduced
- [ ] No `type` imports on DI-injected classes

## Documentation

- [ ] N/A -- no documentation changes needed
- [ ] Updated relevant SOP in `docs/sop/`
- [ ] Updated `docs/validation/TraceabilityMatrix.md`
- [ ] Updated API contract / OpenAPI spec

## Test Plan

<!-- How to verify this change: steps, commands, expected results -->

## Screenshots / Logs

<!-- If UI or log output changes, show before/after -->
