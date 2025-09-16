# 🚀 GACP-ERP Enterprise Development Roadmap

**Документ**: Development Roadmap  
**Версия**: 2.0  
**Дата**: 15 сентября 2025  
**Статус**: PRODUCTION READY - Comprehensive Enterprise Roadmap  
**Автор**: IfNoise + GitHub Copilot  
**Цель**: Schema-First, NX Monorepo, Multi-language Enterprise ERP

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

## 🏗️ FOUNDATION ARCHITECTURE

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
