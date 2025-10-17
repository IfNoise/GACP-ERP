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
