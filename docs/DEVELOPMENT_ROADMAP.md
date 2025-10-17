# 🚀 GACP-ERP Enterprise Development Roadmap

**Документ**: Development Roadmap  
**Версия**: 3.0  
**Дата**: 17 октября 2025  
**Статус**: UPDATED - DS v2.0 Compliance Modules Integrated  
**Автор**: IfNoise + GitHub Copilot  
**Цель**: Schema-First, NX Monorepo, Multi-language Enterprise ERP

**Изменения v3.0**:
- Added DS v2.0 compliance modules (Change Control, CAPA, Deviation, Validation, Quality Events, Training, Documents, Analytics)
- Updated implementation timeline with 8 new EPICs
- Integrated 31 new Kafka topics and 83 event schemas
- Added training and competency management requirements
- Updated resource allocation for compliance features (estimated 40-60 dev-days)

---

## 🎯 EXECUTIVE SUMMARY

### Стратегический подход

**SCHEMA-FIRST DEVELOPMENT** - основополагающий принцип всей разработки:

- Contracts define everything (API, Events, Data structures)
- Types generated from schemas (Zod → TypeScript)
- Multi-language type safety (TypeScript, Go, Java)
- Event schemas for Kafka topics
- Database schemas with migrations

**NX MONOREPO FOUNDATION** - единая кодовая база для всех компонентов:

- TypeScript/JavaScript (NestJS, Next.js, Libraries)
- Go services (Audit Consumer, Performance-critical services)
- Java Maven (Keycloak custom handlers)
- Shared contracts, types, and configurations
- CommonJS/ESM compatibility resolved at architecture level

**EPIC-DRIVEN DEVELOPMENT** - структурированное планирование:

- Каждый EPIC = автономная бизнес-функциональность
- Context-preserving documentation for GitHub Copilot
- Commit strategy aligned with GCP regulatory requirements
- Traceability from requirements to implementation

---

## � DS v2.0 COMPLIANCE MODULES INTEGRATION

### Overview

DS v2.0 introduces 8 new compliance modules essential for pharmaceutical-grade cannabis cultivation. These modules extend the GACP-ERP system with comprehensive quality management and regulatory compliance capabilities.

### New Modules Summary

| Module | Complexity | Dev-Days | Kafka Topics | Event Schemas | REST APIs | Key Features |
|--------|-----------|----------|--------------|---------------|-----------|--------------|
| **Change Control** | High | 10-12 | 8 | 15 | 6 | Workflow management, impact assessment, multi-level approval |
| **CAPA** | High | 10-12 | 6 | 12 | 5 | Root cause analysis, effectiveness checks, trend analysis |
| **Deviation** | Medium | 5-7 | 5 | 10 | 4 | Classification, investigation, impact assessment |
| **Validation** | High | 8-10 | 4 | 8 | 4 | GAMP 5, IQ/OQ/PQ, protocol management |
| **Quality Events** | Medium | 3-5 | 3 | 6 | 3 | Event tracking, investigation, reporting |
| **Training** | Medium | 5-7 | 2 | 4 | 3 | Competency management, curriculum, certifications |
| **Documents** | Low | 2-4 | 1 | 3 | 2 | Document lifecycle, version control, approval |
| **Analytics** | Medium | 5-7 | 2 | 5 | 3 | Compliance metrics, trend analysis, dashboards |
| **TOTAL** | - | **48-64** | **31** | **83** | **30** | - |

### Impact on Architecture

**New Event Architecture**:
- 31 new Kafka topics across 8 compliance domains
- 83 event schemas with full Zod validation
- All events include 21 CFR Part 11 electronic signatures
- ALCOA+ audit trail metadata on every event

**API Extensions**:
- 26 new ts-rest contracts (30 total including enhancements)
- Full CRUD operations for all compliance entities
- Complex workflows (multi-step approvals, investigations)
- Advanced search and filtering capabilities

**Training Requirements**:
- 7 new training courses (CUR-009 through CUR-015)
- Position-specific competency requirements
- Annual recertification for all compliance roles
- GxP training documentation and tracking

### Implementation Strategy

**Phase 1: Foundation (Weeks 1-2)**
- Set up database schemas for all 8 modules
- Implement base entity models with GxPValidationFieldsSchema mixin
- Create Kafka topic infrastructure
- Set up audit trail integration

**Phase 2: Core Workflows (Weeks 3-5)**
- Implement Change Control workflow engine
- Develop CAPA investigation and root cause analysis
- Build Deviation classification and management
- Create Validation protocol management

**Phase 3: Integration (Weeks 6-7)**
- Integrate Quality Events with other modules
- Implement Training management and competency tracking
- Connect Document Control with Mayan-EDMS
- Build Analytics dashboards and reporting

**Phase 4: Validation & Documentation (Week 8)**
- Complete SOPs for all compliance modules
- Perform end-to-end workflow testing
- Update regulatory traceability matrices
- Finalize training materials

### Resource Allocation

**Backend Development**: 3 developers × 4 weeks = 48 dev-days  
**Frontend Development**: 2 developers × 3 weeks = 30 dev-days  
**QA & Validation**: 2 QA engineers × 2 weeks = 20 dev-days  
**Documentation**: 1 technical writer × 2 weeks = 10 dev-days

**Total Estimated Effort**: **108 dev-days** (approximately 5-6 calendar months with 4-person team)

---

## �🏗️ FOUNDATION ARCHITECTURE

### NX Monorepo Structure

```text
gacp-erp/
├── apps/
│   ├── web-portal/              # Next.js frontend
│   ├── api-gateway/             # NestJS API gateway
│   ├── cultivation-service/     # NestJS microservice
│   ├── quality-service/         # NestJS microservice
│   ├── audit-consumer/          # Go service
│   └── keycloak-handlers/       # Java Maven project
├── libs/
│   ├── shared/
│   │   ├── contracts/           # API contracts (ts-rest + Zod)
│   │   ├── types/               # Generated types
│   │   ├── events/              # Kafka event schemas
│   │   ├── database/            # Database schemas & migrations
│   │   └── config/              # Shared configurations
│   ├── ui-components/           # React component library
│   ├── business-logic/          # Domain logic libraries
│   └── integrations/            # External service integrations
├── tools/
│   ├── nx-generators/           # Custom NX generators
│   ├── schema-generators/       # Schema-to-code generators
│   └── deployment/              # Deployment utilities
└── docs/                        # Comprehensive documentation
```

### CommonJS/ESM Compatibility Strategy

**Problem**: Mixed module systems in enterprise monorepo  
**Solution**: Architectural-level resolution

```json
{
  "cli": {
    "packageManager": "pnpm"
  },
  "defaultBase": "main",
  "targetDefaults": {
    "build": {
      "executor": "@nx/esbuild:esbuild",
      "options": {
        "format": ["esm"],
        "platform": "node",
        "target": "node18"
      }
    }
  },
  "plugins": ["@nx/js", "@nx/node", "@nx/react", "@nx-go/nx-go"]
}
```

---

## 📋 EPIC STRUCTURE & DEVELOPMENT PHASES

### EPIC 0: Foundation Infrastructure (4-6 weeks)

**Цель**: Создать bulletproof основу для всей разработки

#### 0.1 NX Monorepo Setup & Generators

**Приоритет**: CRITICAL  
**Зависимости**: None  
**Результат**: Production-ready development environment

**Детальные задачи**:

1. **NX Workspace Configuration**

   ```bash
   # Initial setup with all required plugins
   npx create-nx-workspace@latest gacp-erp --preset=empty
   cd gacp-erp

   # Core plugins
   nx add @nx/node @nx/react @nx/next @nx/nest
   nx add @nx-go/nx-go @nx/esbuild @nx/jest

   # Custom configuration
   nx add @nx/cypress @nx/storybook @nx/linter
   ```

2. **Custom NX Generators Development**

   **a) Library Generator**

   ```typescript
   // tools/nx-generators/library/schema.json
   {
     "$schema": "http://json-schema.org/schema",
     "cli": "nx",
     "id": "library",
     "type": "object",
     "properties": {
       "name": {"type": "string"},
       "directory": {"type": "string"},
       "type": {
         "type": "string",
         "enum": ["data-access", "ui", "business-logic", "utility"]
       },
       "withContracts": {"type": "boolean", "default": false},
       "withValidation": {"type": "boolean", "default": true}
     }
   }
   ```

   **b) Microservice Generator**

   ```typescript
   // tools/nx-generators/microservice/schema.json
   {
     "properties": {
       "name": {"type": "string"},
       "database": {"type": "boolean", "default": true},
       "withAuditTrail": {"type": "boolean", "default": true},
       "withObservability": {"type": "boolean", "default": true},
       "complianceLevel": {
         "type": "string",
         "enum": ["HIGH", "MEDIUM", "LOW"],
         "default": "MEDIUM"
       }
     }
   }
   ```

   **c) API Module Generator**

   ```typescript
   // tools/nx-generators/api-module/schema.json
   {
     "properties": {
       "name": {"type": "string"},
       "withCrud": {"type": "boolean", "default": true},
       "authRequired": {"type": "boolean", "default": true},
       "auditLevel": {
         "type": "string",
         "enum": ["FULL", "MINIMAL", "NONE"]
       }
     }
   }
   ```

3. **Schema-First Infrastructure**

   **Contract Definition Template**:

   ```typescript
   // libs/shared/contracts/src/lib/cultivation/plant.contract.ts
   import { z } from "zod";
   import { contract } from "@ts-rest/core";

   // Base schemas
   export const PlantSchema = z.object({
     id: z.string().uuid(),
     strain: z.string().min(1),
     plantingDate: z.date(),
     currentStage: z.enum(["SEED", "VEGETATIVE", "FLOWERING", "HARVEST"]),
     location: z.string(),
     batchId: z.string().uuid(),
     // Compliance fields
     createdBy: z.string().uuid(),
     lastModifiedBy: z.string().uuid(),
     complianceStatus: z.enum(["COMPLIANT", "PENDING", "NON_COMPLIANT"]),
   });

   // API contract
   export const plantContract = contract.router({
     createPlant: procedure
       .method("POST")
       .path("/plants")
       .body(PlantSchema.omit({ id: true }))
       .response(PlantSchema)
       .metadata({
         auditRequired: true,
         complianceLevel: "HIGH",
         regulations: ["GACP", "FDA_21CFR_Part11"],
       }),

     // ... other endpoints
   });
   ```

---

## 📝 COMMIT STRATEGY & GCP COMPLIANCE

### Commit Message Standards

**Format aligned with GCP documentation requirements**:

```text
<type>(<scope>): <subject>

<body>

<footer>
```

**Types for regulatory compliance**:

- `feat`: New feature (maps to URS requirement)
- `fix`: Bug fix (maps to CAPA)
- `docs`: Documentation (maps to SOP updates)
- `test`: Testing (maps to IQ/OQ/PQ)
- `refactor`: Code improvement (maps to change control)
- `compliance`: Regulatory changes (maps to audit requirements)

**Example commits per EPIC**:

```bash
# EPIC 0 commits
git commit -m "feat(foundation): initialize NX monorepo with multi-language support

- Configure NX workspace with TypeScript, Go, Java
- Setup ESM/CommonJS compatibility
- Add custom generators for microservices and libraries
- Configure development environment standards

Closes: URS-001, URS-002
Compliance: GAMP5 infrastructure requirements
IQ-Test: IQ-001-NX-Setup"
```

---

### EPIC DS2-1: Change Control Management Module (2-3 weeks)

**Приоритет**: HIGH  
**Зависимости**: EPIC 0 (Foundation)  
**Dev-Days**: 10-12  
**Regulatory Impact**: 21 CFR Part 11, EU GMP Annex 11

**Scope**:

1. **Change Request Management**
   - Create/Edit/Approve change requests
   - Change classification (Major/Minor/Critical)
   - Impact assessment workflow
   - Multi-level approval chains

2. **Kafka Integration**
   - 8 Kafka topics: `change_control.requests`, `change_control.assessments`, `change_control.reviews`, `change_control.approvals`, `change_control.implementation`, `change_control.verification`, `change_control.closure`, `change_control.notifications`
   - 15 event schemas with electronic signatures
   - ALCOA+ audit trail metadata

3. **REST API**
   - 6 ts-rest contracts
   - CRUD operations + workflow actions
   - Advanced search and filtering
   - Document attachment support

4. **Frontend Components**
   - Change request creation wizard
   - Approval workflow dashboard
   - Impact assessment forms
   - Change history timeline

**Deliverables**:
- ✅ ChangeControl entity with GxPValidationFieldsSchema
- ✅ 8 Kafka topics configured
- ✅ 15 event schemas implemented
- ✅ 6 REST API endpoints
- ✅ React components for change management
- ✅ SOP_ChangeControl.md documentation

---

### EPIC DS2-2: CAPA Management Module (2-3 weeks)

**Приоритет**: HIGH  
**Зависимости**: EPIC 0, EPIC DS2-1  
**Dev-Days**: 10-12  
**Regulatory Impact**: WHO GACP, GAMP 5

**Scope**:

1. **CAPA Workflow**
   - CAPA request creation and investigation
   - Root cause analysis (5 Whys, Fishbone diagrams)
   - Corrective/Preventive action planning
   - Effectiveness check scheduling
   - CAPA closure workflow

2. **Kafka Integration**
   - 6 Kafka topics: `capa.requests`, `capa.investigations`, `capa.root_causes`, `capa.actions`, `capa.effectiveness_checks`, `capa.notifications`
   - 12 event schemas with full validation
   - Integration with Deviation and Quality Events

3. **REST API**
   - 5 ts-rest contracts
   - Root cause analysis templates
   - Action tracking and assignment
   - Effectiveness check management

4. **Analytics & Reporting**
   - CAPA trend analysis
   - Root cause category distribution
   - Effectiveness metrics
   - Overdue action tracking

**Deliverables**:
- ✅ CAPA entity with investigation workflow
- ✅ 6 Kafka topics configured
- ✅ 12 event schemas implemented
- ✅ 5 REST API endpoints
- ✅ Root cause analysis UI components
- ✅ SOP_CAPA.md documentation

---

### EPIC DS2-3: Deviation Management Module (1-2 weeks)

**Приоритет**: MEDIUM  
**Зависимости**: EPIC 0, EPIC DS2-2  
**Dev-Days**: 5-7  
**Regulatory Impact**: EU GMP Annex 11, ALCOA+

**Scope**:

1. **Deviation Lifecycle**
   - Deviation reporting and classification
   - Investigation workflow
   - Impact assessment (critical/major/minor)
   - CAPA linkage
   - Deviation closure

2. **Kafka Integration**
   - 5 Kafka topics: `deviation.reports`, `deviation.classifications`, `deviation.investigations`, `deviation.impact_assessments`, `deviation.notifications`
   - 10 event schemas
   - Auto-trigger CAPA based on classification

3. **REST API**
   - 4 ts-rest contracts
   - Classification workflow
   - Investigation documentation
   - Trend analysis endpoints

4. **Frontend Components**
   - Deviation reporting form
   - Classification wizard
   - Investigation dashboard
   - Impact assessment matrix

**Deliverables**:
- ✅ Deviation entity with classification
- ✅ 5 Kafka topics configured
- ✅ 10 event schemas implemented
- ✅ 4 REST API endpoints
- ✅ Deviation management UI
- ✅ SOP_DeviationManagement.md documentation

---

### EPIC DS2-4: Validation Lifecycle Module (2 weeks)

**Приоритет**: HIGH  
**Зависимости**: EPIC 0, EPIC DS2-1  
**Dev-Days**: 8-10  
**Regulatory Impact**: GAMP 5, 21 CFR Part 11

**Scope**:

1. **Validation Protocol Management**
   - Protocol creation (IQ/OQ/PQ)
   - Test case management
   - Execution tracking
   - Report generation
   - Re-validation scheduling

2. **Kafka Integration**
   - 4 Kafka topics: `validation.protocols`, `validation.executions`, `validation.test_cases`, `validation.notifications`
   - 8 event schemas
   - Integration with Change Control

3. **REST API**
   - 4 ts-rest contracts
   - Protocol CRUD operations
   - Test case execution
   - Report generation endpoints

4. **GAMP 5 Compliance**
   - Risk-based validation approach
   - Software category assessment
   - Traceability matrix generation
   - CSV documentation templates

**Deliverables**:
- ✅ Validation entity with protocol types
- ✅ 4 Kafka topics configured
- ✅ 8 event schemas implemented
- ✅ 4 REST API endpoints
- ✅ Validation protocol UI
- ✅ SOP_Validation.md documentation

---

### EPIC DS2-5: Quality Events Management Module (1 week)

**Приоритет**: MEDIUM  
**Зависимости**: EPIC 0, EPIC DS2-2, EPIC DS2-3  
**Dev-Days**: 3-5  
**Regulatory Impact**: WHO GACP

**Scope**:

1. **Event Tracking**
   - Quality event creation
   - Event categorization
   - Investigation workflow
   - Resolution tracking

2. **Kafka Integration**
   - 3 Kafka topics: `quality_events.reports`, `quality_events.investigations`, `quality_events.notifications`
   - 6 event schemas
   - Integration with CAPA and Deviation

3. **REST API**
   - 3 ts-rest contracts
   - Event CRUD operations
   - Investigation tracking
   - Trend analysis

4. **Dashboard & Reporting**
   - Real-time event dashboard
   - Category distribution
   - Resolution time metrics

**Deliverables**:
- ✅ QualityEvent entity
- ✅ 3 Kafka topics configured
- ✅ 6 event schemas implemented
- ✅ 3 REST API endpoints
- ✅ Quality events dashboard UI
- ✅ SOP_QualityEvents.md documentation

---

### EPIC DS2-6: Training Management Module (1-2 weeks)

**Приоритет**: MEDIUM  
**Зависимости**: EPIC 0  
**Dev-Days**: 5-7  
**Regulatory Impact**: 21 CFR Part 11, GxP

**Scope**:

1. **Competency Management**
   - Training curriculum management
   - Course enrollment and completion tracking
   - Examination and certification
   - Annual recertification scheduling
   - Position-based training requirements

2. **Kafka Integration**
   - 2 Kafka topics: `training.enrollments`, `training.completions`
   - 4 event schemas
   - Integration with HR systems

3. **REST API**
   - 3 ts-rest contracts
   - Course CRUD operations
   - Enrollment management
   - Competency reporting

4. **Training Dashboard**
   - Individual training status
   - Organizational competency metrics
   - Overdue training alerts
   - Certification tracking

**Deliverables**:
- ✅ Training entity with curriculum structure
- ✅ 2 Kafka topics configured
- ✅ 4 event schemas implemented
- ✅ 3 REST API endpoints
- ✅ Training management UI
- ✅ Curriculum.md v2.0 and PositionMatrix.md v2.0

---

### EPIC DS2-7: Document Control Module (1 week)

**Приоритет**: LOW  
**Зависимости**: EPIC 0, Mayan-EDMS integration  
**Dev-Days**: 2-4  
**Regulatory Impact**: 21 CFR Part 11, EU GMP Annex 11

**Scope**:

1. **Document Lifecycle**
   - Document creation and versioning
   - Approval workflow
   - Controlled distribution
   - Archival and retention
   - Integration with Mayan-EDMS

2. **Kafka Integration**
   - 1 Kafka topic: `documents.lifecycle`
   - 3 event schemas (created, approved, archived)
   - Audit trail for all document actions

3. **REST API**
   - 2 ts-rest contracts
   - Document metadata management
   - Version control
   - Access control

4. **Mayan-EDMS Integration**
   - API connector for document storage
   - Metadata synchronization
   - Full-text search integration
   - Document preview and download

**Deliverables**:
- ✅ Document entity with version control
- ✅ 1 Kafka topic configured
- ✅ 3 event schemas implemented
- ✅ 2 REST API endpoints
- ✅ Mayan-EDMS integration layer
- ✅ SOP_DocumentControl.md documentation

---

### EPIC DS2-8: Analytics & Reporting Module (1-2 weeks)

**Приоритет**: MEDIUM  
**Зависимости**: All previous DS2 EPICs  
**Dev-Days**: 5-7  
**Regulatory Impact**: WHO GACP, ALCOA+

**Scope**:

1. **Compliance Analytics**
   - KPI dashboards for all compliance modules
   - Trend analysis and forecasting
   - Risk heat maps
   - Regulatory reporting templates

2. **Kafka Integration**
   - 2 Kafka topics: `analytics.metrics`, `analytics.reports`
   - 5 event schemas
   - Real-time data aggregation

3. **REST API**
   - 3 ts-rest contracts
   - Metric retrieval endpoints
   - Report generation
   - Data export (Excel, PDF)

4. **Dashboard Components**
   - Executive compliance dashboard
   - Module-specific analytics pages
   - Customizable KPI widgets
   - Drill-down capabilities

**Deliverables**:
- ✅ Analytics entity with metric definitions
- ✅ 2 Kafka topics configured
- ✅ 5 event schemas implemented
- ✅ 3 REST API endpoints
- ✅ Compliance analytics dashboard
- ✅ Reporting templates

---

## 🎯 SUCCESS METRICS & VALIDATION

### EPIC Completion Criteria

**Each EPIC must complete**:

1. ✅ All URS requirements implemented
2. ✅ IQ/OQ/PQ tests passed
3. ✅ Compliance validation completed
4. ✅ Documentation updated
5. ✅ GitHub Copilot context preserved

### Quality Gates

**Before EPIC completion**:

```bash
# Code quality
nx run-many --target=lint --all
nx run-many --target=test --all

# Type safety
nx run-many --target=type-check --all

# Security scanning
nx run-many --target=security-scan --all

# Compliance validation
nx run shared-contracts:validate-compliance
```

---

## 📚 COPILOT CONTEXT MANAGEMENT

### EPIC Handoff Protocol

**Before starting new EPIC**:

1. **Read EPIC Context File**

   ```bash
   # Example for EPIC 2
   cat docs/epics/EPIC-2-CONTEXT.md
   ```

2. **Review Current Architecture**

   ```bash
   # Check current project structure
   nx graph

   # Review contracts
   cat libs/shared/contracts/src/index.ts
   ```

3. **Validate Environment**

   ```bash
   # Ensure environment is ready
   nx run-many --target=build --all
   nx run-many --target=test --all
   ```

### Context Preservation Files

**Essential files for Copilot context**:

- `docs/epics/EPIC-{N}-CONTEXT.md` - Current EPIC status
- `docs/ADR/` - Architectural decisions
- `docs/DEVELOPMENT_WORKFLOW_GUIDE.md` - Development patterns
- `.github/instructions/copilot.instructions.md` - Core instructions
- `libs/shared/contracts/README.md` - Schema documentation

---

**Roadmap Status**: Ready for Implementation  
**Next Action**: Begin EPIC 0 - Foundation Infrastructure  
**Estimated Timeline**: 6-8 months for full system  
**Team**: IfNoise + GitHub Copilot + AI Assistants
