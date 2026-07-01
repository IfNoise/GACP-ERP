# IFC Integration Status Report

Date: 2026-06-29
Author: GitHub Copilot (GPT-5.3-Codex)
Scope: Current feature snapshot + transition to deep IFC integration design

## 1. Executive Summary

The current feature is in active implementation and already covers end-to-end binding of facility zones to IFC spaces for the Spatial domain. The codebase now contains:

- 3D viewer support for IfcSpace discovery, picking, and zone binding
- API endpoint and use case to persist IFC space binding on zones
- Contract/schema/database support for `ifc_space_id`
- Dev authentication path to speed up local integration workflows

Current branch status:

- Local branch is ahead of `origin/main` by 2 commits
- 13 tracked modified files and 3 untracked files are still in progress

## 2. Confirmed Implemented Baseline

### 2.1 UI/3D (Spatial)

- IfcSpace proxy mesh and geometry handling in
  [libs/ui-components/src/xeokit/facility-viewer.tsx](../../libs/ui-components/src/xeokit/facility-viewer.tsx)
- Space mapping flow in
  [apps/web-portal/src/app/spatial/3d/_components/facility-3d-viewer.tsx](../../apps/web-portal/src/app/spatial/3d/_components/facility-3d-viewer.tsx)
- New mutation hooks for zone bounds and space binding in
  [apps/web-portal/src/hooks/use-domain-queries.ts](../../apps/web-portal/src/hooks/use-domain-queries.ts)

### 2.2 API/Domain (Spatial Service)

- Zone-space binding endpoint (`PATCH /spatial/zones/:id/space`) in
  [apps/spatial-service/src/spatial/spatial.controller.ts](../../apps/spatial-service/src/spatial/spatial.controller.ts)
- Transactional domain action + outbox event in
  [apps/spatial-service/src/spatial/use-cases/update-zone-space-id.use-case.ts](../../apps/spatial-service/src/spatial/use-cases/update-zone-space-id.use-case.ts)
- Repository persistence in
  [apps/spatial-service/src/spatial/spatial.repository.ts](../../apps/spatial-service/src/spatial/spatial.repository.ts)

### 2.3 Shared Contracts/Schemas/Database

- Spatial contract expansion in
  [libs/shared/contracts/src/spatial.contract.ts](../../libs/shared/contracts/src/spatial.contract.ts)
- Spatial schema field in
  [libs/shared/schemas/src/spatial/spatial.schema.ts](../../libs/shared/schemas/src/spatial/spatial.schema.ts)
- DB table field in
  [libs/shared/database/src/schema/tables.ts](../../libs/shared/database/src/schema/tables.ts)
- Migration added in
  [libs/shared/database/src/migrations/030_zone_ifc_space_id.sql](../../libs/shared/database/src/migrations/030_zone_ifc_space_id.sql)

## 3. Decision Log (Current State)

The team has decided to move from "zone-to-room binding only" to a deeper IFC integration model where IFC becomes a structured source for:

- Spaces and geometry (Spatial)
- Coordinates and topology (Spatial + IoT)
- Specifications and equipment architecture (Financial + IoT + maintenance context)

This is now the primary direction for next architecture/design iteration.

## 4. What Is Not Yet Implemented

The following capabilities are not yet delivered as system-level features:

- Full IFC metadata extraction pipeline (properties/psets/classification)
- Domain mapping model for equipment and technical specifications
- Shared canonical IFC-derived data model for Spatial + Financial + IoT
- Versioned IFC ingestion/orchestration workflow with re-import diff strategy
- Cross-service events dedicated to IFC ingestion lifecycle and mapping status

## 5. Risks and Constraints Identified

- Security risk if dev auth mode is enabled outside local environments:
  [apps/web-portal/src/lib/auth.ts](../../apps/web-portal/src/lib/auth.ts)
- Strong dependency on IFC model quality and naming conventions for auto-mapping
- Need deterministic identity strategy for IFC entities across model revisions
- Compliance risk if extraction and transformation steps are not fully auditable
- Performance risk for very large IFC files without staged ingestion/indexing

## 6. Proposed Deep Integration Discussion Frame

### 6.1 Target Outcomes

- Create a single IFC integration architecture for Spatial, Financial, and IoT
- Define canonical entities and ownership boundaries by service
- Define ingestion, mapping, validation, and versioning workflow
- Define event contract set for ingestion and downstream synchronization

### 6.2 Candidate Workstreams

1. IFC Ingestion Core
- file intake, validation, parser selection, extraction stages, retries

2. Canonical Data Model
- spaces, coordinates, equipment hierarchy, specs, relations

3. Spatial Projection
- room/zone mapping, geometry sync, topology checks

4. Financial Projection
- asset/equipment register enrichment, spec-based categorization, valuation inputs

5. IoT Projection
- sensor placement binding, telemetry-to-space/equipment routing, context enrichment

6. Compliance + Auditability
- ALCOA+ evidence chain for source file, transform stages, approval history

### 6.3 Architectural Questions for Next Session

- What is the canonical key strategy for IFC objects (GUID, composite, revision-aware)?
- Which service owns parsed IFC artifacts versus projected domain views?
- How to model re-import: replace, merge, or diff-with-approval?
- What level of IFC semantics is mandatory in MVP (IfcSpace/IfcElement/psets)?
- Which events are mandatory for first integration increment?

## 7. Immediate Next Step (Agreed Transition)

Move from implementation-only mode to design mode:

- Run a focused architecture deep-dive for IFC integration across Spatial/Financial/IoT
- Produce an RFC/ADR with canonical model, ingestion flow, and service contracts
- Then split implementation into phased increments with explicit validation gates

---

Status: Snapshot fixed. Ready for deep IFC integration discussion.

Next artifact: [RFC v0.3 Deep IFC Integration](./IFC_DEEP_INTEGRATION_RFC_v0.3_2026-06-29.md)
