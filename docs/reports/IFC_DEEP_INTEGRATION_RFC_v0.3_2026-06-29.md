# RFC: Deep IFC Integration (Spatial + Financial + IoT)

Status: Draft v0.3
Date: 2026-06-29
Decision owners: Product + Architecture
Related snapshot: [IFC Integration Status](./IFC_INTEGRATION_STATUS_2026-06-29.md)
Accepted ADR: [ADR-001 IFC Integration Service and Diff Approval](../ADR/ADR-001-ifc-integration-service-and-diff-approval.md)

## 1. Final Decisions Fixed in This RFC

1. Integration model: separate IFC service (dedicated bounded context)
2. Re-import strategy: diff-with-approval (mandatory)
3. Semantic scope for MVP+: psets + classification (mandatory), with a strict modeling guideline for IFC authoring
4. Parser/extraction engine: evaluate and integrate IfcOpenShell as core extraction component

## 2. Problem Statement

Current implementation supports zone-to-IfcSpace binding. The next target is to make IFC a trusted source for:

- Spatial: spaces, geometry, coordinates, topology
- Financial: equipment architecture, technical specifications, asset attributes
- IoT: sensor/equipment context mapping and telemetry routing

This requires canonical ingestion, deterministic identifiers across revisions, auditable change detection, and controlled approval of model changes before domain projection.

## 3. Scope

### In scope

- Dedicated IFC Integration Service architecture
- IfcOpenShell integration strategy
- Canonical data model and projection contracts
- Diff-with-approval workflow
- IFC modeling guideline (authoring requirements)
- Minimum compliance and auditability requirements

### Out of scope (this revision)

- Full UI implementation of approval workflow
- Full ERP process automation for every domain edge case
- Final performance tuning for very large portfolios (>10k assets/model)

## 4. Architecture Proposal

## 4.1 New Service: ifc-integration-service

Service responsibilities:

- Accept IFC files and metadata
- Parse and extract semantic content (IfcOpenShell)
- Build canonical graph/entities
- Compute diffs against previous approved revision
- Publish lifecycle and projection events
- Store immutable ingestion evidence and approval trail

Suggested implementation profile:

- Language/runtime: Python 3.12+ (IfcOpenShell-native ecosystem)
- API: FastAPI (internal service API)
- Async pipeline: worker queue + staged jobs
- Storage:
  - object storage for original IFC files
  - relational store for canonical metadata and diff snapshots
  - immutable audit records linked to revision IDs

## 4.2 Service Boundaries

1. ifc-integration-service (owner)
- IFC file lifecycle
- Canonical IFC entities
- Revision/diff/approval state machine

2. spatial-service (consumer/projection owner)
- Space/zone projection
- Geometry and topology projection status

3. financial-service (consumer/projection owner)
- Asset/equipment projection
- Classification/spec projection status

4. iot-domain (consumer/projection owner; currently distributed)
- Sensor-to-space/equipment binding context
- Telemetry routing metadata alignment

## 5. IfcOpenShell Integration Plan

## 5.1 Why IfcOpenShell

- Mature IFC parsing and geometry toolchain
- Deep support for property sets and entity traversal
- Strong Python integration for rapid iteration in extraction pipeline

## 5.2 Evaluation Checklist (must pass)

1. Correct extraction of IfcSpace, IfcBuildingElement, IfcDistributionElement
2. Stable access to GlobalId and relationship graph
3. Pset extraction completeness for required psets
4. Classification extraction completeness (Uniclass/OmniClass/custom)
5. Geometry extraction reliability for space/equipment envelopes
6. Acceptable performance on representative facility IFC samples

## 5.3 Minimal Extraction Contract (service-internal)

Each extracted entity must include:

- revision_id
- global_id
- ifc_type
- name
- parent_global_id (if exists)
- placement transform / coordinates (normalized)
- property_sets (normalized key-value)
- classifications (list)
- geometry_ref (where applicable)
- source_trace (lineage to source file + parse stage)

## 6. Canonical Data Model

Core canonical entities:

1. ifc_revision
- revision_id, source_file_hash, uploaded_by, uploaded_at, status

2. ifc_object
- global_id, ifc_type, name, hierarchy_path, placement, geometry_ref

3. ifc_property
- global_id, pset_name, property_name, value, unit, value_type

4. ifc_classification
- global_id, system, code, label

5. ifc_relation
- source_global_id, relation_type, target_global_id

6. ifc_diff
- revision_pair, global_id, change_type, field_path, old_value, new_value, severity

## 7. Diff-with-Approval Workflow (Mandatory)

State machine:

1. uploaded
2. parsed
3. diff_ready
4. pending_approval
5. approved | rejected
6. projected (per-domain projection states tracked independently)

Rules:

1. No domain projection to Spatial/Financial/IoT before approval
2. Every diff item has severity: low | medium | high | critical
3. High/critical diffs require explicit electronic approval with reason
4. Rejection keeps prior approved revision active
5. Full lineage must be queryable for every projected field

Approval packet must contain:

- revision metadata
- summary by change category
- critical object impact list
- compliance notes
- sign-off identities and timestamps

## 8. Event Contracts (Initial Set)

Mandatory events:

1. ifc.ingestion.started
2. ifc.ingestion.parsed
3. ifc.ingestion.diff_ready
4. ifc.ingestion.approval_requested
5. ifc.ingestion.approved
6. ifc.ingestion.rejected
7. ifc.projection.spatial.updated
8. ifc.projection.financial.updated
9. ifc.projection.iot.updated
10. ifc.ingestion.failed

Every event must include:

- event_id
- occurred_at
- revision_id
- correlation_id
- triggered_by
- event_version
- payload + validation status

## 9. IFC Authoring Guideline (Model Creation Requirements)

This section is mandatory for model providers (BIM team/contractors).

## 9.1 Identification and Structure

1. GlobalId must be present and stable for all relevant entities
2. Space hierarchy must be complete: Site -> Building -> Storey -> Space
3. Equipment must be connected to hierarchy through standard relations
4. Naming convention must be deterministic and environment-agnostic

## 9.2 Coordinates and Placement

1. Single agreed coordinate reference strategy per facility package
2. No mixed local/global placement ambiguity
3. Storey elevation and object placements must be consistent
4. Required tolerances for positioning must be documented in handover package

## 9.3 Required Property Sets (minimum)

For IfcSpace:

- Pset_SpaceCommon.Name
- Pset_SpaceCommon.Reference
- Area/Volume fields where available
- Functional type / usage category

For equipment-related entities (building/distribution elements):

- Manufacturer
- Model number
- Serial number (if known)
- Installation date (if known)
- Nominal power/capacity (if applicable)
- Maintenance class / criticality

Rule:

- Missing mandatory psets places model in pending remediation state

## 9.4 Classification Requirements

1. Each critical object must have at least one classification
2. Allowed systems: Uniclass, OmniClass, or approved enterprise taxonomy
3. Classification code and label must be provided together
4. Deprecated or free-text-only classification is not accepted for critical assets

## 9.5 Geometry Quality

1. Spaces must be closed enough for reliable envelope derivation
2. Critical equipment must have valid transform and non-degenerate geometry
3. Geometry simplification is allowed only if semantics and placement remain accurate

## 9.6 Delivery Package Requirements

Each IFC delivery must include:

1. IFC file
2. Model manifest (project, facility, revision metadata)
3. Coordinate and units statement
4. Validation report from authoring tool
5. Change summary against previous revision

## 10. Compliance and Audit Requirements

1. ALCOA+ traceability for all ingestion and projection steps
2. Immutable revision evidence storage
3. Approval actions with identity, reason, timestamp
4. Full reproducibility of extracted canonical records from source file hash
5. No silent overwrite of approved revision

## 11. Non-Functional Requirements

1. Parsing SLA for baseline model sizes must be defined and monitored
2. Retry-safe processing with idempotent revision ingest
3. Backpressure and queue observability required
4. Partial projection failures must not corrupt approved baseline

## 12. Phased Delivery Plan

Phase 1: Ingestion core

- Create ifc-integration-service skeleton
- Integrate IfcOpenShell parser pipeline
- Persist canonical revision/object/property/classification tables
- Emit ingestion lifecycle events

Phase 2: Diff and approval

- Implement diff engine and severity model
- Build approval API and immutable approval log
- Block projections until approval

Phase 3: Domain projections

- Spatial projection with topology checks
- Financial projection with classification/spec mapping
- IoT projection with sensor/equipment context mapping

## 13. Open Items Requiring Final Agreement

1. Final technology profile for the service runtime in production
2. Storage engine choice for canonical IFC graph (pure relational vs hybrid)
3. Severity rubric for diff categories
4. Final mandatory pset and classification matrix by domain

## 14. Acceptance Criteria for RFC v0.3 -> v1.0

1. Architecture board approves service boundary and ownership
2. IfcOpenShell PoC passes extraction checklist on real project IFC samples
3. Diff-with-approval workflow is validated by QA + Compliance
4. Modeling guideline is accepted by BIM/data providers and included in contracts
5. Event contracts are signed off by Spatial, Financial, and IoT owners

## 15. Domain Matrix: Mandatory Psets and Classification

This matrix defines the minimum semantic payload required to pass ingestion validation.

### 15.1 Spatial Domain (mandatory)

Entity classes:

- IfcSite
- IfcBuilding
- IfcBuildingStorey
- IfcSpace

Mandatory attributes/psets for IfcSpace:

- GlobalId
- Name
- LongName (if provided by authoring tool)
- Pset_SpaceCommon.Reference
- Area (net/gross where available)
- Volume (where available)
- OccupancyType or functional usage tag

Mandatory relationships:

- IfcRelAggregates chain Site -> Building -> Storey -> Space
- Placement resolvable to normalized coordinates

Classification requirement:

- At least one approved classification per IfcSpace category when space is marked critical

### 15.2 Financial Domain (mandatory)

Entity classes:

- IfcElement (general)
- IfcBuildingElement and key subtypes
- IfcDistributionElement and key subtypes

Mandatory attributes/psets:

- GlobalId
- Name
- Manufacturer
- ModelReference or ModelNumber
- SerialNumber (if available)
- InstallationDate (if available)
- ExpectedServiceLife (if available)
- NominalPower/NominalCapacity (if applicable)
- Criticality level (enterprise pset if not native)

Classification requirement:

- At least one classification code from approved system
- classification.system and classification.code are both mandatory

Financial projection mapping minimum:

- asset_external_id <- GlobalId
- asset_type <- IFC type + classification
- valuation_group <- classification map table
- maintenance_policy <- criticality + element family

### 15.3 IoT Domain (mandatory)

Entity classes:

- IfcSpace
- Equipment entities used as telemetry anchors

Mandatory attributes/psets:

- GlobalId
- Name
- Placement and local-to-global transform
- Equipment type/category tag for routing
- Sensor-ready flag (enterprise pset)

Mandatory relationships:

- Sensor anchor must resolve to either Space GlobalId or Equipment GlobalId
- Topology path to Storey/Building must be resolvable

Classification requirement:

- Required for all telemetry-critical anchors

## 16. Diff Severity Rubric (for diff-with-approval)

Severity is assigned per diff record and drives approval requirements.

low:

- Non-critical text metadata change
- Optional pset field added with no downstream mapping impact

medium:

- Change in non-critical classification
- Geometry update outside regulated/critical areas

high:

- Change in required pset used by at least one projection
- Space hierarchy relation changed for operational areas
- Equipment classification changed with financial mapping impact

critical:

- GlobalId change/removal on previously approved object
- Deletion or re-parenting of critical space/equipment
- Coordinate/placement change for telemetry-critical anchors
- Any change that impacts regulatory traceability or audit integrity

Approval policy:

- low/medium: one authorized approver
- high: dual approval (domain owner + QA/compliance)
- critical: dual approval + explicit risk note + change-control link

## 17. Event Payload Draft Schemas (v1 JSON Schema)

These payloads are provided as draft JSON Schema structures for contract-first implementation.

### 17.1 ifc.ingestion.diff_ready

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ifc.ingestion.diff_ready.payload",
  "type": "object",
  "required": [
    "revision_id",
    "baseline_revision_id",
    "model_id",
    "summary",
    "impacted_domains",
    "critical_objects",
    "diff_artifact_uri"
  ],
  "properties": {
    "revision_id": { "type": "string", "minLength": 1 },
    "baseline_revision_id": { "type": "string", "minLength": 1 },
    "model_id": { "type": "string", "minLength": 1 },
    "summary": {
      "type": "object",
      "required": ["added_count", "updated_count", "removed_count", "by_severity"],
      "properties": {
        "added_count": { "type": "integer", "minimum": 0 },
        "updated_count": { "type": "integer", "minimum": 0 },
        "removed_count": { "type": "integer", "minimum": 0 },
        "by_severity": {
          "type": "object",
          "required": ["low", "medium", "high", "critical"],
          "properties": {
            "low": { "type": "integer", "minimum": 0 },
            "medium": { "type": "integer", "minimum": 0 },
            "high": { "type": "integer", "minimum": 0 },
            "critical": { "type": "integer", "minimum": 0 }
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false
    },
    "impacted_domains": {
      "type": "array",
      "items": { "type": "string", "enum": ["spatial", "financial", "iot"] },
      "minItems": 1,
      "uniqueItems": true
    },
    "critical_objects": {
      "type": "array",
      "items": { "type": "string", "minLength": 1 }
    },
    "diff_artifact_uri": { "type": "string", "minLength": 1 }
  },
  "additionalProperties": false
}
```

### 17.2 ifc.ingestion.approved

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ifc.ingestion.approved.payload",
  "type": "object",
  "required": [
    "revision_id",
    "approved_by",
    "approved_at",
    "approval_reason",
    "change_control_id",
    "approved_domains",
    "baseline_switched"
  ],
  "properties": {
    "revision_id": { "type": "string", "minLength": 1 },
    "approved_by": {
      "type": "array",
      "items": { "type": "string", "minLength": 1 },
      "minItems": 1,
      "uniqueItems": true
    },
    "approved_at": { "type": "string", "format": "date-time" },
    "approval_reason": { "type": "string", "minLength": 1 },
    "change_control_id": { "type": "string", "minLength": 1 },
    "approved_domains": {
      "type": "array",
      "items": { "type": "string", "enum": ["spatial", "financial", "iot"] },
      "minItems": 1,
      "uniqueItems": true
    },
    "baseline_switched": { "type": "boolean" }
  },
  "additionalProperties": false
}
```

### 17.3 ifc.projection.financial.updated

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ifc.projection.financial.updated.payload",
  "type": "object",
  "required": [
    "revision_id",
    "projection_run_id",
    "upserted_assets",
    "archived_assets",
    "mapping_warnings",
    "status"
  ],
  "properties": {
    "revision_id": { "type": "string", "minLength": 1 },
    "projection_run_id": { "type": "string", "minLength": 1 },
    "upserted_assets": { "type": "integer", "minimum": 0 },
    "archived_assets": { "type": "integer", "minimum": 0 },
    "mapping_warnings": { "type": "integer", "minimum": 0 },
    "warnings_uri": { "type": ["string", "null"] },
    "status": { "type": "string", "enum": ["success", "partial", "failed"] }
  },
  "additionalProperties": false
}
```

### 17.4 ifc.projection.iot.updated

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ifc.projection.iot.updated.payload",
  "type": "object",
  "required": [
    "revision_id",
    "projection_run_id",
    "updated_anchors",
    "unresolved_anchors",
    "unresolved_anchor_ids",
    "status"
  ],
  "properties": {
    "revision_id": { "type": "string", "minLength": 1 },
    "projection_run_id": { "type": "string", "minLength": 1 },
    "updated_anchors": { "type": "integer", "minimum": 0 },
    "unresolved_anchors": { "type": "integer", "minimum": 0 },
    "unresolved_anchor_ids": {
      "type": "array",
      "items": { "type": "string", "minLength": 1 }
    },
    "status": { "type": "string", "enum": ["success", "partial", "failed"] }
  },
  "additionalProperties": false
}
```

## 18. IfcOpenShell PoC Plan and Pass/Fail Criteria

Goal: validate IfcOpenShell as extraction core before production commitment.

### 18.1 PoC dataset

Required samples:

- 3 real facility IFC files (small/medium/large)
- 1 synthetic regression file with known edge cases
- At least 1 revision pair for diff validation

### 18.2 PoC checks

1. Semantic extraction
- Parse Site/Building/Storey/Space and target equipment classes
- Extract required psets and classifications

2. Relationship graph
- Build parent/child and key adjacency links
- Detect orphan critical entities

3. Geometry/placement
- Resolve placements into normalized coordinates
- Build envelope references for spaces/equipment anchors

4. Diff engine readiness
- Produce deterministic diff output for revision pair
- Verify severity assignment reproducibility

### 18.3 Pass criteria

- >= 99% extraction completeness for mandatory entities
- >= 98% completeness for mandatory psets/classification
- 100% deterministic GlobalId recovery for unchanged objects
- Diff output identical across repeated runs on same inputs
- No critical parsing crash on baseline datasets

### 18.4 Fail criteria

- Non-deterministic extraction for unchanged files
- Missing mandatory semantics beyond threshold
- Inability to resolve topology for critical spaces
- Unrecoverable parser/runtime instability on medium dataset

## 19. IFC Model Authoring Checklist (Provider-Facing)

Use this checklist before model handover to GACP-ERP ingestion.

1. Identity
- All required entities have stable GlobalId
- No regenerated GlobalId for unchanged objects between revisions

2. Structure
- Site -> Building -> Storey -> Space hierarchy complete
- Critical equipment linked into hierarchy

3. Semantics
- Mandatory psets populated per domain matrix
- Classification system/code/label present on critical objects

4. Coordinates and geometry
- Units and coordinate reference declared in manifest
- Placements consistent and non-ambiguous
- Space/equipment geometry valid for envelope extraction

5. Delivery package
- IFC file + manifest + validation report + change summary provided
- Revision metadata and author information complete

6. Compliance package
- Mapping notes for high/critical model changes included
- Change-control reference provided for critical updates

## 20. Mapping Matrix: Pset to Target Fields

This matrix defines the contract-level mapping from IFC semantics to domain projection fields.

### 20.1 Spatial Projection Mapping

| IFC Source | Required | Spatial Target Field | Transform Rule |
|------|----------|--------|-----------|
| IfcSpace.GlobalId | yes | spatial_zone.ifc_space_id | direct |
| IfcSpace.Name | yes | spatial_zone.zone_name_candidate | trim |
| Pset_SpaceCommon.Reference | yes | spatial_zone.zone_code_candidate | uppercase + normalize separators |
| IfcSpace.ObjectPlacement | yes | spatial_zone.bounds_source_transform | local-to-global normalization |
| Space area metric | conditional | spatial_zone.area_sqm | unit normalization to m2 |
| Space usage category | conditional | spatial_zone.zone_type_candidate | mapping table by usage taxonomy |

### 20.2 Financial Projection Mapping

| IFC Source | Required | Financial Target Field | Transform Rule |
|------|----------|--------|-----------|
| Element.GlobalId | yes | asset.asset_external_id | direct |
| Element.IfcType | yes | asset.asset_family | direct enum mapping |
| Manufacturer | yes | asset.manufacturer | trim |
| ModelReference/ModelNumber | yes | asset.model_number | pick first non-empty |
| SerialNumber | conditional | asset.serial_number | trim |
| InstallationDate | conditional | asset.installation_date | ISO date normalization |
| ExpectedServiceLife | conditional | asset.service_life_years | numeric parse |
| NominalPower/NominalCapacity | conditional | asset.nominal_capacity | value+unit normalization |
| Classification.system+code | yes | asset.classification_code | concatenate system:code |
| Criticality | yes | asset.criticality_level | enum normalization |

### 20.3 IoT Projection Mapping

| IFC Source | Required | IoT Target Field | Transform Rule |
|------|----------|--------|-----------|
| Anchor GlobalId | yes | iot_anchor.anchor_external_id | direct |
| Anchor IfcType | yes | iot_anchor.anchor_type | enum mapping |
| ObjectPlacement | yes | iot_anchor.transform | local-to-global normalization |
| Parent Space GlobalId | conditional | iot_anchor.space_external_id | relation traversal |
| Parent Equipment GlobalId | conditional | iot_anchor.equipment_external_id | relation traversal |
| Sensor-ready flag | yes | iot_anchor.sensor_ready | boolean parse |
| Classification.system+code | yes | iot_anchor.routing_profile | mapping table by class |

Validation rules:

1. Every mapping row marked required must produce non-null target value.
2. Conditional fields may be null but must carry missing_reason in projection diagnostics.
3. Unit conversions must be logged in projection trace for auditability.

## 21. Implementation-Ready Next Steps

1. Create ts-rest/event contracts based on section 17 schemas.
2. Implement projection diagnostic artifact for mapping completeness and missing_reason.
3. Create canonical mapping tables for zone type, valuation group, routing profile.
4. Build conformance tests using section 20 mapping matrix as expected behavior.

## 22. Initial Contract Artifacts (already drafted)

The following draft artifacts are now present in the repository and can be used as the implementation baseline:

1. IFC Kafka event schemas:
- ../../libs/shared/events/src/ifc.events.ts

2. IFC event exports/topic registry:
- ../../libs/shared/events/src/index.ts

3. IFC ts-rest API contract:
- ../../libs/shared/contracts/src/ifc.contract.ts

4. IFC contract export:
- ../../libs/shared/contracts/src/index.ts
