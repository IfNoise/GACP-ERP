# ADR-001: Separate IFC Integration Service and Diff-with-Approval

Status: Accepted
Date: 2026-06-29
Deciders: Product, Architecture, Domain Leads (Spatial/Financial/IoT)

## Context

The project currently supports zone-to-IfcSpace binding in Spatial flows. The team decided to evolve IFC into a primary structured source for:

- Spatial geometry/topology
- Financial equipment/specification metadata
- IoT anchor/routing context

The previous approach (direct, domain-local parsing assumptions) is insufficient for revision control, cross-domain consistency, and compliance-grade traceability.

## Decision

1. Create a separate `ifc-integration-service` as dedicated bounded context.
2. Adopt `diff-with-approval` as the mandatory re-import strategy.
3. Require `psets` + `classification` as mandatory semantics for accepted IFC revisions.
4. Use IfcOpenShell as primary extraction technology (subject to PoC acceptance criteria).

## Rationale

- Service isolation avoids duplication of parse logic across domains.
- Diff-with-approval provides deterministic revision governance and controlled rollout.
- Mandatory psets/classification are needed for reliable Financial and IoT projections.
- IfcOpenShell provides mature IFC traversal and property extraction capabilities.

## Consequences

Positive:

- Unified canonical IFC source and projection governance.
- Audit-ready change history for approved model revisions.
- Consistent downstream payload for Spatial/Financial/IoT.

Trade-offs:

- Additional service and operational complexity.
- New approval workflow and governance overhead.
- Need for strict BIM authoring quality and provider contracts.

## Compliance Impact

- Improves ALCOA+ alignment via explicit lineage and approval records.
- Enables controlled change management for model-driven updates.
- Requires immutable revision evidence and sign-off metadata retention.

## References

- [IFC Integration Status 2026-06-29](../reports/IFC_INTEGRATION_STATUS_2026-06-29.md)
- [IFC Deep Integration RFC v0.3](../reports/IFC_DEEP_INTEGRATION_RFC_v0.3_2026-06-29.md)
