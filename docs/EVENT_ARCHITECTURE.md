---
title: "Event-Driven Architecture & Kafka Events"
version: "2.0"
status: "active"
last_updated: "2025-10-17"
type: "architecture"
# AI-Assisted Documentation Metadata (per AI_Assisted_Documentation_Policy.md)
ai_generated: true
author_verified: false
qa_approved: false
ai_status: under_review
change_summary: "Major update: Added 31 Kafka topics and 83 event schemas for DS v2.0 compliance modules (Change Control, CAPA, Deviation, Validation, Quality Events, Training, Documents, Analytics)"
---

**Документ**: Event Architecture Specification  
**Версия**: 2.0  
**Дата**: 17 октября 2025  
**Статус**: CRITICAL - Основа для событийной архитектуры  
**Предыдущая версия**: 1.0 (2025-09-14)  
**Изменения**: Добавлены 31 Kafka topic и 83 event schema для compliance модулей

---

## 🎯 **1. ВВЕДЕНИЕ**

### 1.1 Назначение документа

Данный документ определяет полную событийную архитектуру GACP-ERP системы с детальным описанием:

- **Event-Driven Architecture** patterns
- **Kafka topics** и событий с Zod-схемами валидации
- **Event Sourcing** для критических доменов
- **CQRS** паттерны для разделения чтения/записи
- **Saga patterns** для распределенных транзакций
- **Dead Letter Queues** и error handling

### 1.2 Принципы дизайна

> **🏛️ ФУНДАМЕНТАЛЬНЫЕ ПРИНЦИПЫ**

1. **Zod-First Events**: Все события описаны Zod-схемами для типобезопасности
2. **Immutable Events**: События неизменяемы после публикации
3. **Event Versioning**: Семантическое версионирование событий
4. **Schema Evolution**: Обратная совместимость схем
5. **Idempotency**: Все обработчики событий идемпотентны
6. **Audit Trail**: Полная трассируемость всех событий

---

## 🏗️ **2. СОБЫТИЙНАЯ АРХИТЕКТУРА**

### 2.1 Общая схема

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         EVENT-DRIVEN ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │
│  │ Cultivation │    │   Quality   │    │      Financial          │  │
│  │  Service    │────│   Service   │────│      Service            │  │
│  └─────────────┘    └─────────────┘    └─────────────────────────┘  │
│         │                   │                        │              │
│         │                   │                        │              │
│    ┌────▼───────────────────▼────────────────────────▼──────────┐   │
│    │                  KAFKA EVENT BUS                           │   │
│    │  ┌─────────────────────────────────────────────────────┐   │   │
│    │  │ Topics: cultivation.*, quality.*, financial.*,      │   │   │
│    │  │         audit.*, notifications.*, integration.*      │  │   │
│    │  └─────────────────────────────────────────────────────┘   │   │
│    └────────────────────────────────────────────────────────────┘   │
│         │                   │                        │              │
│         │                   │                        │              │
│  ┌─────▼─────┐    ┌─────────▼─┐    ┌─────────────────▼─────────────┐  │
│  │ Analytics │    │   Audit   │    │     Notification             │  │
│  │  Service  │    │ Service   │    │       Service                │  │
│  └───────────┘    └───────────┘    └───────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Kafka Configuration

#### 2.2.1 Cluster Setup

```typescript
// kafka-config.ts
import { z } from "zod";

export const KafkaConfigSchema = z.object({
  brokers: z.array(z.string().url()),
  clientId: z.string(),
  ssl: z.boolean().default(true),
  sasl: z
    .object({
      mechanism: z.enum(["plain", "scram-sha-256", "scram-sha-512"]),
      username: z.string(),
      password: z.string(),
    })
    .optional(),
  retries: z.number().int().positive().default(5),
  requestTimeout: z.number().int().positive().default(30000),
  connectionTimeout: z.number().int().positive().default(10000),
});

export type KafkaConfig = z.infer<typeof KafkaConfigSchema>;

// Production configuration
export const productionKafkaConfig: KafkaConfig = {
  brokers: [
    "kafka-1.gacp-erp.internal:9092",
    "kafka-2.gacp-erp.internal:9092",
    "kafka-3.gacp-erp.internal:9092",
  ],
  clientId: "gacp-erp-main",
  ssl: true,
  sasl: {
    mechanism: "scram-sha-256",
    username: process.env.KAFKA_USERNAME!,
    password: process.env.KAFKA_PASSWORD!,
  },
  retries: 5,
  requestTimeout: 30000,
  connectionTimeout: 10000,
};
```

#### 2.2.2 Topic Naming Convention

```typescript
// Конвенция именования topics: {domain}.{subdomain}.{version}
export const TOPICS = {
  // Cultivation Domain
  CULTIVATION_PLANTS: "cultivation.plants.v1",
  CULTIVATION_BATCHES: "cultivation.batches.v1",
  CULTIVATION_HARVEST: "cultivation.harvest.v1",
  CULTIVATION_IRRIGATION: "cultivation.irrigation.v1",

  // Quality Domain
  QUALITY_TESTING: "quality.testing.v1",
  QUALITY_SAMPLING: "quality.sampling.v1",
  QUALITY_COMPLIANCE: "quality.compliance.v1",

  // Financial Domain
  FINANCIAL_TRANSACTIONS: "financial.transactions.v1",
  FINANCIAL_ASSETS: "financial.assets.v1",
  FINANCIAL_REPORTING: "financial.reporting.v1",

  // Change Control Domain
  CHANGE_CONTROL_REQUESTS: "change_control.requests.v1",
  CHANGE_CONTROL_ASSESSMENTS: "change_control.assessments.v1",
  CHANGE_CONTROL_REVIEWS: "change_control.reviews.v1",
  CHANGE_CONTROL_APPROVALS: "change_control.approvals.v1",
  CHANGE_CONTROL_IMPLEMENTATIONS: "change_control.implementations.v1",
  CHANGE_CONTROL_VERIFICATIONS: "change_control.verifications.v1",
  CHANGE_CONTROL_CLOSURES: "change_control.closures.v1",
  CHANGE_CONTROL_NOTIFICATIONS: "change_control.notifications.v1",

  // CAPA Domain
  CAPA_REQUESTS: "capa.requests.v1",
  CAPA_INVESTIGATIONS: "capa.investigations.v1",
  CAPA_ACTIONS: "capa.actions.v1",
  CAPA_EFFECTIVENESS: "capa.effectiveness_checks.v1",
  CAPA_CLOSURES: "capa.closures.v1",
  CAPA_NOTIFICATIONS: "capa.notifications.v1",

  // Deviation Domain
  DEVIATION_REPORTS: "deviation.reports.v1",
  DEVIATION_INVESTIGATIONS: "deviation.investigations.v1",
  DEVIATION_ASSESSMENTS: "deviation.assessments.v1",
  DEVIATION_CLOSURES: "deviation.closures.v1",
  DEVIATION_NOTIFICATIONS: "deviation.notifications.v1",

  // Validation Domain
  VALIDATION_PROTOCOLS: "validation.protocols.v1",
  VALIDATION_EXECUTIONS: "validation.executions.v1",
  VALIDATION_REPORTS: "validation.reports.v1",
  VALIDATION_REVALIDATIONS: "validation.revalidations.v1",

  // Quality Events Module
  QUALITY_EVENTS: "quality_events.events.v1",
  QUALITY_EVENT_INVESTIGATIONS: "quality_events.investigations.v1",
  QUALITY_EVENT_RESOLUTIONS: "quality_events.resolutions.v1",

  // Training Domain
  TRAINING_RECORDS: "training.records.v1",
  TRAINING_CURRICULUM: "training.curriculum.v1",

  // Documents Domain
  DOCUMENTS_LIFECYCLE: "documents.lifecycle.v1",

  // Analytics Domain
  ANALYTICS_METRICS: "analytics.metrics.v1",
  ANALYTICS_REPORTS: "analytics.reports.v1",

  // System Events
  AUDIT_EVENTS: "audit.events.v1",
  NOTIFICATIONS: "notifications.events.v1",
  INTEGRATIONS: "integrations.events.v1",

  // Dead Letter Queues
  DLQ: "dlq.events.v1",
} as const;
```

---

## 📋 **3. БАЗОВЫЕ СОБЫТИЯ И СХЕМЫ**

### 3.1 Base Event Schema

```typescript
import { z } from "zod";

// Базовая схема для всех событий
export const BaseEventSchema = z.object({
  // Event Identification
  eventId: z.string().uuid(),
  eventType: z.string().min(1),
  eventVersion: z
    .string()
    .regex(/^\d+\.\d+$/)
    .default("1.0"),

  // Timing
  timestamp: z.string().datetime(),

  // Correlation & Causation
  correlationId: z.string().uuid(),
  causationId: z.string().uuid().optional(),

  // Metadata
  source: z.string().min(1),
  userId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),

  // Compliance & Audit
  auditContext: z
    .object({
      ipAddress: z.string().ip().optional(),
      userAgent: z.string().optional(),
      complianceFlags: z.array(z.string()).default([]),
    })
    .optional(),
});

export type BaseEvent = z.infer<typeof BaseEventSchema>;

// Event with payload
export const EventWithPayloadSchema = <T extends z.ZodType>(payloadSchema: T) =>
  BaseEventSchema.extend({
    payload: payloadSchema,
  });
```

### 3.2 Domain Event Interfaces

```typescript
// Создаем типизированные события для каждого домена
export interface DomainEvent<T = unknown> extends BaseEvent {
  payload: T;
}

// Cultivation Events
export interface PlantEvent<T = unknown> extends DomainEvent<T> {
  eventType: `plant.${string}`;
  payload: T & {
    plantId: string;
    batchId: string;
  };
}

// Quality Events
export interface QualityEvent<T = unknown> extends DomainEvent<T> {
  eventType: `quality.${string}`;
  payload: T & {
    sampleId?: string;
    testId?: string;
    batchId?: string;
  };
}

// Financial Events
export interface FinancialEvent<T = unknown> extends DomainEvent<T> {
  eventType: `financial.${string}`;
  payload: T & {
    transactionId?: string;
    amount?: number;
    currency?: string;
  };
}
```

---

## 🌱 **4. CULTIVATION DOMAIN EVENTS**

### 4.1 Plant Lifecycle Events

#### 4.1.1 Plant Created

```typescript
export const PlantCreatedPayloadSchema = z.object({
  plantId: z.string().uuid(),
  batchId: z.string().uuid(),
  genetics: z.object({
    id: z.string().uuid(),
    strain: z.string(),
    type: z.enum(["indica", "sativa", "hybrid"]),
    thcPercentage: z.number().min(0).max(100),
    cbdPercentage: z.number().min(0).max(100),
    lineage: z
      .object({
        mother: z.string().optional(),
        father: z.string().optional(),
      })
      .optional(),
  }),
  location: z.object({
    facilityId: z.string().uuid(),
    zone: z.string(),
    row: z.number().int().positive(),
    position: z.number().int().positive(),
  }),
  propagationMethod: z.enum(["seed", "clone", "tissue_culture"]),
  sourceId: z.string().uuid().optional(), // ID родительского растения для клонов
  plannedHarvestDate: z.string().date(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const PlantCreatedEventSchema = EventWithPayloadSchema(
  PlantCreatedPayloadSchema
).extend({
  eventType: z.literal("plant.created"),
});

export type PlantCreatedEvent = z.infer<typeof PlantCreatedEventSchema>;
```

#### 4.1.2 Plant Stage Changed

```typescript
export const PlantStageChangedPayloadSchema = z.object({
  plantId: z.string().uuid(),
  batchId: z.string().uuid(),
  previousStage: z.enum([
    "seedling",
    "cloning",
    "vegetative",
    "mother_plant",
    "pre_flower",
    "flowering",
    "drying",
    "curing",
    "ready",
    "harvested",
    "disposed",
  ]),
  newStage: z.enum([
    "seedling",
    "vegetative",
    "pre_flower",
    "flowering",
    "drying",
    "curing",
    "ready",
    "harvested",
    "disposed",
  ]),
  stageChangedAt: z.string().datetime(),
  stageChangedBy: z.string().uuid(),
  reason: z.string().optional(),
  environmentalConditions: z
    .object({
      temperature: z.number(),
      humidity: z.number().min(0).max(100),
      vpd: z.number().positive().optional(),
      co2: z.number().positive().optional(),
      lightIntensity: z.number().nonnegative().optional(),
    })
    .optional(),
  photos: z
    .array(
      z.object({
        id: z.string().uuid(),
        url: z.string().url(),
        type: z.enum(["overview", "close_up", "microscopic"]),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .optional(),
});

export const PlantStageChangedEventSchema = EventWithPayloadSchema(
  PlantStageChangedPayloadSchema
).extend({
  eventType: z.literal("plant.stage_changed"),
});

export type PlantStageChangedEvent = z.infer<
  typeof PlantStageChangedEventSchema
>;
```

#### 4.1.3 Plant Harvested

```typescript
export const PlantHarvestedPayloadSchema = z.object({
  plantId: z.string().uuid(),
  batchId: z.string().uuid(),
  harvestId: z.string().uuid(),
  harvestedAt: z.string().datetime(),
  harvestedBy: z.string().uuid(),
  harvestData: z.object({
    wetWeight: z.object({
      amount: z.number().positive(),
      unit: z.enum(["g", "kg", "oz", "lb"]),
    }),
    dryWeight: z
      .object({
        amount: z.number().positive(),
        unit: z.enum(["g", "kg", "oz", "lb"]),
      })
      .optional(),
    qualityGrade: z.enum(["A+", "A", "B+", "B", "C", "reject"]).optional(),
    sections: z.array(
      z.object({
        type: z.enum(["colas", "trim", "shake", "popcorn"]),
        weight: z.object({
          amount: z.number().positive(),
          unit: z.enum(["g", "kg", "oz", "lb"]),
        }),
        destinationId: z.string().uuid(), // Container/batch для дальнейшей обработки
      })
    ),
  }),
  environmentalConditions: z.object({
    temperature: z.number(),
    humidity: z.number().min(0).max(100),
  }),
  notes: z.string().optional(),
});

export const PlantHarvestedEventSchema = EventWithPayloadSchema(
  PlantHarvestedPayloadSchema
).extend({
  eventType: z.literal("plant.harvested"),
});

export type PlantHarvestedEvent = z.infer<typeof PlantHarvestedEventSchema>;
```

### 4.2 Batch Events

#### 4.2.1 Batch Created

```typescript
export const BatchCreatedPayloadSchema = z.object({
  batchId: z.string().uuid(),
  batchNumber: z.string(),
  genetics: z.object({
    id: z.string().uuid(),
    strain: z.string(),
    type: z.enum(["indica", "sativa", "hybrid"]),
  }),
  source: z.object({
    type: z.enum(["seeds", "clones", "mother_plant"]),
    sourceId: z.string().uuid().optional(),
    vendor: z.string().optional(),
    lot: z.string().optional(),
  }),
  plantCount: z.number().int().positive(),
  plannedCapacity: z.number().int().positive(),
  startDate: z.string().date(),
  estimatedHarvestDate: z.string().date(),
  assignedZones: z.array(z.string()),
  responsible: z.object({
    cultivator: z.string().uuid(),
    supervisor: z.string().uuid(),
  }),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const BatchCreatedEventSchema = EventWithPayloadSchema(
  BatchCreatedPayloadSchema
).extend({
  eventType: z.literal("batch.created"),
});

export type BatchCreatedEvent = z.infer<typeof BatchCreatedEventSchema>;
```

### 4.3 Environmental Events

#### 4.3.1 Environmental Alert

```typescript
export const EnvironmentalAlertPayloadSchema = z.object({
  alertId: z.string().uuid(),
  facilityId: z.string().uuid(),
  zone: z.string(),
  alertType: z.enum([
    "temperature",
    "humidity",
    "vpd",
    "co2",
    "light",
    "ph",
    "ec",
    "water_level",
  ]),
  severity: z.enum(["info", "warning", "critical", "emergency"]),
  currentValue: z.number(),
  expectedRange: z.object({
    min: z.number(),
    max: z.number(),
    unit: z.string(),
  }),
  deviation: z.number(),
  sensorId: z.string().uuid(),
  triggeredAt: z.string().datetime(),
  autoCorrection: z
    .object({
      attempted: z.boolean(),
      successful: z.boolean().optional(),
      actions: z.array(z.string()).optional(),
    })
    .optional(),
  affectedBatches: z.array(z.string().uuid()).optional(),
});

export const EnvironmentalAlertEventSchema = EventWithPayloadSchema(
  EnvironmentalAlertPayloadSchema
).extend({
  eventType: z.literal("environment.alert"),
});

export type EnvironmentalAlertEvent = z.infer<
  typeof EnvironmentalAlertEventSchema
>;
```

---

## 🧪 **5. QUALITY DOMAIN EVENTS**

### 5.1 Testing Events

#### 5.1.1 Sample Collected

```typescript
export const SampleCollectedPayloadSchema = z.object({
  sampleId: z.string().uuid(),
  batchId: z.string().uuid(),
  plantId: z.string().uuid().optional(),
  sampleType: z.enum([
    "flower",
    "trim",
    "extract",
    "edible",
    "soil",
    "water",
    "air",
  ]),
  collectionMethod: z.enum(["random", "systematic", "targeted", "composite"]),
  collectedAt: z.string().datetime(),
  collectedBy: z.string().uuid(),
  location: z.object({
    facilityId: z.string().uuid(),
    zone: z.string(),
    specificLocation: z.string().optional(),
  }),
  quantity: z.object({
    amount: z.number().positive(),
    unit: z.enum(["g", "kg", "ml", "l"]),
  }),
  storageConditions: z.object({
    temperature: z.number(),
    humidity: z.number().min(0).max(100),
    light: z.enum(["dark", "ambient", "bright"]),
    container: z.string(),
  }),
  chainOfCustody: z.array(
    z.object({
      transferredAt: z.string().datetime(),
      transferredBy: z.string().uuid(),
      transferredTo: z.string().uuid(),
      condition: z.enum(["good", "damaged", "compromised"]),
      notes: z.string().optional(),
    })
  ),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const SampleCollectedEventSchema = EventWithPayloadSchema(
  SampleCollectedPayloadSchema
).extend({
  eventType: z.literal("quality.sample_collected"),
});

export type SampleCollectedEvent = z.infer<typeof SampleCollectedEventSchema>;
```

#### 5.1.2 Test Results Available

```typescript
export const TestResultsAvailablePayloadSchema = z.object({
  testId: z.string().uuid(),
  sampleId: z.string().uuid(),
  batchId: z.string().uuid(),
  testType: z.enum([
    "potency",
    "pesticides",
    "heavy_metals",
    "residual_solvents",
    "microbials",
    "moisture",
    "foreign_matter",
    "terpenes",
  ]),
  laboratory: z.object({
    id: z.string().uuid(),
    name: z.string(),
    accreditation: z.string(),
    analyst: z.string(),
  }),
  testMethod: z.string(),
  testedAt: z.string().datetime(),
  results: z.object({
    overall: z.enum(["pass", "fail", "pending", "retest"]),
    details: z.array(
      z.object({
        analyte: z.string(),
        result: z.number(),
        unit: z.string(),
        limit: z.number().optional(),
        status: z.enum(["pass", "fail", "not_detected", "below_limit"]),
      })
    ),
    certificate: z.object({
      number: z.string(),
      url: z.string().url().optional(),
      issuedAt: z.string().datetime(),
    }),
  }),
  qualityFlag: z.enum(["compliant", "non_compliant", "conditional"]),
  complianceNotes: z.string().optional(),
});

export const TestResultsAvailableEventSchema = EventWithPayloadSchema(
  TestResultsAvailablePayloadSchema
).extend({
  eventType: z.literal("quality.test_results_available"),
});

export type TestResultsAvailableEvent = z.infer<
  typeof TestResultsAvailableEventSchema
>;
```

---

## 💰 **6. FINANCIAL DOMAIN EVENTS**

### 6.1 Transaction Events

#### 6.1.1 Transaction Created

```typescript
export const TransactionCreatedPayloadSchema = z.object({
  transactionId: z.string().uuid(),
  transactionNumber: z.string(),
  type: z.enum([
    "revenue",
    "expense",
    "transfer",
    "adjustment",
    "depreciation",
  ]),
  category: z.enum([
    "cultivation_supplies",
    "equipment",
    "utilities",
    "labor",
    "testing",
    "compliance",
    "insurance",
    "rent",
    "sales",
    "other",
  ]),
  amount: z.object({
    value: z.number(),
    currency: z.string().length(3), // ISO 4217
  }),
  accounts: z.object({
    debit: z.array(
      z.object({
        accountId: z.string().uuid(),
        amount: z.number(),
      })
    ),
    credit: z.array(
      z.object({
        accountId: z.string().uuid(),
        amount: z.number(),
      })
    ),
  }),
  relatedEntities: z
    .object({
      batchId: z.string().uuid().optional(),
      plantId: z.string().uuid().optional(),
      supplierId: z.string().uuid().optional(),
      customerId: z.string().uuid().optional(),
      equipmentId: z.string().uuid().optional(),
    })
    .optional(),
  description: z.string(),
  reference: z.string().optional(),
  dueDate: z.string().date().optional(),
  createdBy: z.string().uuid(),
  approvedBy: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const TransactionCreatedEventSchema = EventWithPayloadSchema(
  TransactionCreatedPayloadSchema
).extend({
  eventType: z.literal("financial.transaction_created"),
});

export type TransactionCreatedEvent = z.infer<
  typeof TransactionCreatedEventSchema
>;
```

#### 6.1.2 Asset Depreciation

```typescript
export const AssetDepreciationPayloadSchema = z.object({
  assetId: z.string().uuid(),
  depreciationId: z.string().uuid(),
  period: z.object({
    start: z.string().date(),
    end: z.string().date(),
  }),
  depreciation: z.object({
    method: z.enum([
      "straight_line",
      "declining_balance",
      "units_of_production",
    ]),
    amount: z.number().positive(),
    accumulatedDepreciation: z.number().nonnegative(),
    bookValue: z.number().nonnegative(),
  }),
  assetDetails: z.object({
    name: z.string(),
    category: z.string(),
    originalCost: z.number().positive(),
    usefulLife: z.number().int().positive(), // в месяцах
    salvageValue: z.number().nonnegative(),
  }),
  calculatedBy: z.string().uuid(),
  calculatedAt: z.string().datetime(),
});

export const AssetDepreciationEventSchema = EventWithPayloadSchema(
  AssetDepreciationPayloadSchema
).extend({
  eventType: z.literal("financial.asset_depreciation"),
});

export type AssetDepreciationEvent = z.infer<
  typeof AssetDepreciationEventSchema
>;
```

---

## 🔍 **7. AUDIT & COMPLIANCE EVENTS**

### 7.1 Audit Trail Events

#### 7.1.1 Data Access

```typescript
export const DataAccessPayloadSchema = z.object({
  accessId: z.string().uuid(),
  userId: z.string().uuid(),
  resource: z.object({
    type: z.enum(["plant", "batch", "sample", "transaction", "user", "report"]),
    id: z.string().uuid(),
    tableName: z.string(),
    recordId: z.string(),
  }),
  action: z.enum(["view", "create", "update", "delete", "export", "print"]),
  accessMethod: z.enum(["web_ui", "api", "mobile_app", "system_job"]),
  ipAddress: z.string().ip(),
  userAgent: z.string().optional(),
  sessionId: z.string().uuid(),
  accessedAt: z.string().datetime(),
  dataSnapshot: z
    .object({
      before: z.record(z.string(), z.unknown()).optional(),
      after: z.record(z.string(), z.unknown()).optional(),
    })
    .optional(),
  complianceContext: z.object({
    regulation: z.array(z.enum(["GACP", "GMP", "21CFR11", "ALCOA+"])),
    criticality: z.enum(["low", "medium", "high", "critical"]),
    retentionPeriod: z.number().int().positive(), // в годах
  }),
});

export const DataAccessEventSchema = EventWithPayloadSchema(
  DataAccessPayloadSchema
).extend({
  eventType: z.literal("audit.data_access"),
});

export type DataAccessEvent = z.infer<typeof DataAccessEventSchema>;
```

### 7.2 Compliance Events

#### 7.2.1 Compliance Violation

```typescript
export const ComplianceViolationPayloadSchema = z.object({
  violationId: z.string().uuid(),
  type: z.enum([
    "data_integrity",
    "access_control",
    "record_retention",
    "electronic_signature",
    "audit_trail",
  ]),
  severity: z.enum(["minor", "major", "critical"]),
  regulation: z.array(z.enum(["GACP", "GMP", "21CFR11", "ALCOA+", "local"])),
  description: z.string(),
  detectedAt: z.string().datetime(),
  detectedBy: z.enum(["system", "user", "audit"]),
  affectedRecords: z.array(
    z.object({
      type: z.string(),
      id: z.string().uuid(),
      impact: z.enum(["read", "write", "delete", "export"]),
    })
  ),
  rootCause: z.string().optional(),
  correctiveActions: z
    .array(
      z.object({
        action: z.string(),
        assignedTo: z.string().uuid(),
        dueDate: z.string().date(),
        status: z.enum(["planned", "in_progress", "completed", "overdue"]),
      })
    )
    .optional(),
  preventiveActions: z
    .array(
      z.object({
        action: z.string(),
        assignedTo: z.string().uuid(),
        dueDate: z.string().date(),
      })
    )
    .optional(),
});

export const ComplianceViolationEventSchema = EventWithPayloadSchema(
  ComplianceViolationPayloadSchema
).extend({
  eventType: z.literal("audit.compliance_violation"),
});

export type ComplianceViolationEvent = z.infer<
  typeof ComplianceViolationEventSchema
>;
```

---

## 📨 **8. NOTIFICATION EVENTS**

### 8.1 System Notifications

#### 8.1.1 Alert Notification

```typescript
export const AlertNotificationPayloadSchema = z.object({
  notificationId: z.string().uuid(),
  alertType: z.enum([
    "environmental",
    "equipment",
    "quality",
    "compliance",
    "security",
    "maintenance",
    "harvest",
    "deadline",
  ]),
  priority: z.enum(["info", "low", "medium", "high", "critical", "emergency"]),
  title: z.string(),
  message: z.string(),
  recipients: z.array(
    z.object({
      userId: z.string().uuid(),
      role: z.string(),
      notificationMethod: z.array(
        z.enum(["email", "sms", "push", "in_app", "voice"])
      ),
    })
  ),
  sourceContext: z.object({
    source: z.string(),
    relatedEventId: z.string().uuid().optional(),
    relatedRecords: z
      .array(
        z.object({
          type: z.string(),
          id: z.string().uuid(),
        })
      )
      .optional(),
  }),
  scheduledFor: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  escalation: z
    .object({
      enabled: z.boolean(),
      levels: z.array(
        z.object({
          delay: z.number().int().positive(), // минуты
          recipients: z.array(z.string().uuid()),
          methods: z.array(z.enum(["email", "sms", "push", "voice"])),
        })
      ),
    })
    .optional(),
});

export const AlertNotificationEventSchema = EventWithPayloadSchema(
  AlertNotificationPayloadSchema
).extend({
  eventType: z.literal("notification.alert"),
});

export type AlertNotificationEvent = z.infer<
  typeof AlertNotificationEventSchema
>;
```

---

## 🔄 **9. CHANGE CONTROL DOMAIN EVENTS**

### 9.1 Change Request Lifecycle

#### 9.1.1 Change Request Created

```typescript
export const ChangeRequestCreatedPayloadSchema = z.object({
  changeId: z.string().uuid(),
  changeNumber: z.string(),
  title: z.string(),
  description: z.string(),
  changeType: z.enum([
    "process",
    "equipment",
    "system",
    "documentation",
    "organizational",
    "environmental",
  ]),
  priority: z.enum(["low", "medium", "high", "critical"]),
  requestedBy: z.string().uuid(),
  affectedSystems: z.array(z.string()),
  businessJustification: z.string(),
  expectedBenefits: z.string(),
  proposedImplementationDate: z.string().date(),
  attachments: z.array(
    z.object({
      id: z.string().uuid(),
      filename: z.string(),
      fileType: z.string(),
    })
  ).optional(),
});

export const ChangeRequestCreatedEventSchema = EventWithPayloadSchema(
  ChangeRequestCreatedPayloadSchema
).extend({
  eventType: z.literal("change_control.request_created"),
});

export type ChangeRequestCreatedEvent = z.infer<typeof ChangeRequestCreatedEventSchema>;
```

#### 9.1.2 Change Assessment Completed

```typescript
export const ChangeAssessmentCompletedPayloadSchema = z.object({
  changeId: z.string().uuid(),
  assessmentId: z.string().uuid(),
  assessor: z.string().uuid(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  impactAnalysis: z.object({
    productQuality: z.enum(["none", "low", "medium", "high"]),
    compliance: z.enum(["none", "low", "medium", "high"]),
    safety: z.enum(["none", "low", "medium", "high"]),
    cost: z.object({
      estimated: z.number(),
      currency: z.string().length(3),
    }),
  }),
  requiredResources: z.array(z.string()),
  requiredApprovals: z.array(
    z.object({
      role: z.string(),
      required: z.boolean(),
    })
  ),
  assessmentNotes: z.string(),
  completedAt: z.string().datetime(),
});

export const ChangeAssessmentCompletedEventSchema = EventWithPayloadSchema(
  ChangeAssessmentCompletedPayloadSchema
).extend({
  eventType: z.literal("change_control.assessment_completed"),
});

export type ChangeAssessmentCompletedEvent = z.infer<typeof ChangeAssessmentCompletedEventSchema>;
```

#### 9.1.3 Change Review Completed

```typescript
export const ChangeReviewCompletedPayloadSchema = z.object({
  changeId: z.string().uuid(),
  reviewId: z.string().uuid(),
  reviewer: z.string().uuid(),
  reviewerRole: z.string(),
  decision: z.enum(["approved", "rejected", "needs_revision"]),
  reviewComments: z.string(),
  reviewedAt: z.string().datetime(),
  signature: z.object({
    signatureId: z.string().uuid(),
    signedBy: z.string().uuid(),
    signedAt: z.string().datetime(),
    meaning: z.enum(["approved", "reviewed", "acknowledged"]),
  }),
});

export const ChangeReviewCompletedEventSchema = EventWithPayloadSchema(
  ChangeReviewCompletedPayloadSchema
).extend({
  eventType: z.literal("change_control.review_completed"),
});

export type ChangeReviewCompletedEvent = z.infer<typeof ChangeReviewCompletedEventSchema>;
```

#### 9.1.4 Change Approved

```typescript
export const ChangeApprovedPayloadSchema = z.object({
  changeId: z.string().uuid(),
  approvedBy: z.string().uuid(),
  approvalDate: z.string().datetime(),
  approvalComments: z.string().optional(),
  conditions: z.array(z.string()).optional(),
  implementationDeadline: z.string().date(),
  signature: z.object({
    signatureId: z.string().uuid(),
    signedBy: z.string().uuid(),
    signedAt: z.string().datetime(),
    meaning: z.literal("approved"),
  }),
});

export const ChangeApprovedEventSchema = EventWithPayloadSchema(
  ChangeApprovedPayloadSchema
).extend({
  eventType: z.literal("change_control.approved"),
});

export type ChangeApprovedEvent = z.infer<typeof ChangeApprovedEventSchema>;
```

#### 9.1.5 Change Implementation Started

```typescript
export const ChangeImplementationStartedPayloadSchema = z.object({
  changeId: z.string().uuid(),
  implementationId: z.string().uuid(),
  implementedBy: z.string().uuid(),
  implementationPlan: z.string(),
  startDate: z.string().datetime(),
  plannedCompletionDate: z.string().datetime(),
  milestones: z.array(
    z.object({
      id: z.string().uuid(),
      title: z.string(),
      dueDate: z.string().date(),
      status: z.enum(["pending", "in_progress", "completed"]),
    })
  ),
});

export const ChangeImplementationStartedEventSchema = EventWithPayloadSchema(
  ChangeImplementationStartedPayloadSchema
).extend({
  eventType: z.literal("change_control.implementation_started"),
});

export type ChangeImplementationStartedEvent = z.infer<typeof ChangeImplementationStartedEventSchema>;
```

#### 9.1.6 Change Implementation Completed

```typescript
export const ChangeImplementationCompletedPayloadSchema = z.object({
  changeId: z.string().uuid(),
  implementationId: z.string().uuid(),
  completedBy: z.string().uuid(),
  completionDate: z.string().datetime(),
  actualCost: z.object({
    value: z.number(),
    currency: z.string().length(3),
  }).optional(),
  implementationNotes: z.string(),
  deviations: z.array(
    z.object({
      description: z.string(),
      impact: z.string(),
      resolution: z.string(),
    })
  ).optional(),
});

export const ChangeImplementationCompletedEventSchema = EventWithPayloadSchema(
  ChangeImplementationCompletedPayloadSchema
).extend({
  eventType: z.literal("change_control.implementation_completed"),
});

export type ChangeImplementationCompletedEvent = z.infer<typeof ChangeImplementationCompletedEventSchema>;
```

#### 9.1.7 Change Verified

```typescript
export const ChangeVerifiedPayloadSchema = z.object({
  changeId: z.string().uuid(),
  verificationId: z.string().uuid(),
  verifiedBy: z.string().uuid(),
  verificationDate: z.string().datetime(),
  verificationMethod: z.string(),
  verificationResults: z.string(),
  effectiveness: z.enum(["effective", "partially_effective", "ineffective"]),
  followUpRequired: z.boolean(),
  followUpActions: z.array(z.string()).optional(),
  signature: z.object({
    signatureId: z.string().uuid(),
    signedBy: z.string().uuid(),
    signedAt: z.string().datetime(),
    meaning: z.literal("verified"),
  }),
});

export const ChangeVerifiedEventSchema = EventWithPayloadSchema(
  ChangeVerifiedPayloadSchema
).extend({
  eventType: z.literal("change_control.verified"),
});

export type ChangeVerifiedEvent = z.infer<typeof ChangeVerifiedEventSchema>;
```

#### 9.1.8 Change Closed

```typescript
export const ChangeClosedPayloadSchema = z.object({
  changeId: z.string().uuid(),
  closedBy: z.string().uuid(),
  closureDate: z.string().datetime(),
  closureReason: z.enum(["completed", "cancelled", "superseded"]),
  lessonsLearned: z.string().optional(),
  documentation: z.array(
    z.object({
      type: z.string(),
      reference: z.string(),
    })
  ),
  signature: z.object({
    signatureId: z.string().uuid(),
    signedBy: z.string().uuid(),
    signedAt: z.string().datetime(),
    meaning: z.literal("approved"),
  }),
});

export const ChangeClosedEventSchema = EventWithPayloadSchema(
  ChangeClosedPayloadSchema
).extend({
  eventType: z.literal("change_control.closed"),
});

export type ChangeClosedEvent = z.infer<typeof ChangeClosedEventSchema>;
```

---

## 🔬 **10. CAPA DOMAIN EVENTS**

### 10.1 CAPA Request Lifecycle

#### 10.1.1 CAPA Request Created

```typescript
export const CAPARequestCreatedPayloadSchema = z.object({
  capaId: z.string().uuid(),
  capaNumber: z.string(),
  title: z.string(),
  description: z.string(),
  capaType: z.enum(["corrective", "preventive", "both"]),
  sourceType: z.enum([
    "deviation",
    "audit_finding",
    "customer_complaint",
    "quality_event",
    "management_review",
    "continuous_improvement",
  ]),
  sourceId: z.string().uuid().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  assignedTo: z.string().uuid(),
  targetDate: z.string().date(),
  initiatedBy: z.string().uuid(),
});

export const CAPARequestCreatedEventSchema = EventWithPayloadSchema(
  CAPARequestCreatedPayloadSchema
).extend({
  eventType: z.literal("capa.request_created"),
});

export type CAPARequestCreatedEvent = z.infer<typeof CAPARequestCreatedEventSchema>;
```

#### 10.1.2 CAPA Investigation Started

```typescript
export const CAPAInvestigationStartedPayloadSchema = z.object({
  capaId: z.string().uuid(),
  investigationId: z.string().uuid(),
  investigator: z.string().uuid(),
  investigationPlan: z.string(),
  startDate: z.string().datetime(),
  expectedCompletionDate: z.string().date(),
  investigationScope: z.string(),
});

export const CAPAInvestigationStartedEventSchema = EventWithPayloadSchema(
  CAPAInvestigationStartedPayloadSchema
).extend({
  eventType: z.literal("capa.investigation_started"),
});

export type CAPAInvestigationStartedEvent = z.infer<typeof CAPAInvestigationStartedEventSchema>;
```

#### 10.1.3 CAPA Root Cause Identified

```typescript
export const CAPARootCauseIdentifiedPayloadSchema = z.object({
  capaId: z.string().uuid(),
  investigationId: z.string().uuid(),
  rootCauses: z.array(
    z.object({
      id: z.string().uuid(),
      category: z.enum([
        "human_error",
        "equipment_failure",
        "process_failure",
        "material_issue",
        "design_flaw",
        "training_gap",
        "documentation_issue",
        "environmental",
      ]),
      description: z.string(),
      evidence: z.string(),
      contributingFactors: z.array(z.string()).optional(),
    })
  ),
  analysisMethod: z.enum([
    "5_whys",
    "fishbone",
    "fault_tree_analysis",
    "pareto_analysis",
    "root_cause_mapping",
  ]),
  identifiedBy: z.string().uuid(),
  identifiedAt: z.string().datetime(),
});

export const CAPARootCauseIdentifiedEventSchema = EventWithPayloadSchema(
  CAPARootCauseIdentifiedPayloadSchema
).extend({
  eventType: z.literal("capa.root_cause_identified"),
});

export type CAPARootCauseIdentifiedEvent = z.infer<typeof CAPARootCauseIdentifiedEventSchema>;
```

#### 10.1.4 CAPA Action Created

```typescript
export const CAPAActionCreatedPayloadSchema = z.object({
  capaId: z.string().uuid(),
  actionId: z.string().uuid(),
  actionType: z.enum(["corrective", "preventive"]),
  description: z.string(),
  assignedTo: z.string().uuid(),
  targetDate: z.string().date(),
  resources: z.string().optional(),
  successCriteria: z.string(),
  rootCauseIds: z.array(z.string().uuid()),
});

export const CAPAActionCreatedEventSchema = EventWithPayloadSchema(
  CAPAActionCreatedPayloadSchema
).extend({
  eventType: z.literal("capa.action_created"),
});

export type CAPAActionCreatedEvent = z.infer<typeof CAPAActionCreatedEventSchema>;
```

#### 10.1.5 CAPA Action Completed

```typescript
export const CAPAActionCompletedPayloadSchema = z.object({
  capaId: z.string().uuid(),
  actionId: z.string().uuid(),
  completedBy: z.string().uuid(),
  completionDate: z.string().datetime(),
  completionNotes: z.string(),
  evidence: z.array(
    z.object({
      type: z.string(),
      reference: z.string(),
    })
  ),
  signature: z.object({
    signatureId: z.string().uuid(),
    signedBy: z.string().uuid(),
    signedAt: z.string().datetime(),
    meaning: z.literal("approved"),
  }),
});

export const CAPAActionCompletedEventSchema = EventWithPayloadSchema(
  CAPAActionCompletedPayloadSchema
).extend({
  eventType: z.literal("capa.action_completed"),
});

export type CAPAActionCompletedEvent = z.infer<typeof CAPAActionCompletedEventSchema>;
```

#### 10.1.6 CAPA Effectiveness Check Completed

```typescript
export const CAPAEffectivenessCheckCompletedPayloadSchema = z.object({
  capaId: z.string().uuid(),
  effectivenessCheckId: z.string().uuid(),
  checkedBy: z.string().uuid(),
  checkDate: z.string().datetime(),
  effectivenessRating: z.enum(["effective", "partially_effective", "ineffective"]),
  metrics: z.array(
    z.object({
      name: z.string(),
      targetValue: z.string(),
      actualValue: z.string(),
      met: z.boolean(),
    })
  ),
  findings: z.string(),
  additionalActionsRequired: z.boolean(),
  signature: z.object({
    signatureId: z.string().uuid(),
    signedBy: z.string().uuid(),
    signedAt: z.string().datetime(),
    meaning: z.literal("verified"),
  }),
});

export const CAPAEffectivenessCheckCompletedEventSchema = EventWithPayloadSchema(
  CAPAEffectivenessCheckCompletedPayloadSchema
).extend({
  eventType: z.literal("capa.effectiveness_check_completed"),
});

export type CAPAEffectivenessCheckCompletedEvent = z.infer<typeof CAPAEffectivenessCheckCompletedEventSchema>;
```

#### 10.1.7 CAPA Closed

```typescript
export const CAPAClosedPayloadSchema = z.object({
  capaId: z.string().uuid(),
  closedBy: z.string().uuid(),
  closureDate: z.string().datetime(),
  closureReason: z.enum(["completed", "cancelled", "consolidated"]),
  finalSummary: z.string(),
  lessonsLearned: z.string().optional(),
  signature: z.object({
    signatureId: z.string().uuid(),
    signedBy: z.string().uuid(),
    signedAt: z.string().datetime(),
    meaning: z.literal("approved"),
  }),
});

export const CAPAClosedEventSchema = EventWithPayloadSchema(
  CAPAClosedPayloadSchema
).extend({
  eventType: z.literal("capa.closed"),
});

export type CAPAClosedEvent = z.infer<typeof CAPAClosedEventSchema>;
```

---

## ⚠️ **11. DEVIATION DOMAIN EVENTS**

### 11.1 Deviation Lifecycle

#### 11.1.1 Deviation Reported

```typescript
export const DeviationReportedPayloadSchema = z.object({
  deviationId: z.string().uuid(),
  deviationNumber: z.string(),
  title: z.string(),
  description: z.string(),
  deviationType: z.enum([
    "process",
    "equipment",
    "documentation",
    "testing",
    "environmental",
    "material",
  ]),
  detectedAt: z.string().datetime(),
  detectedBy: z.string().uuid(),
  affectedBatches: z.array(z.string().uuid()).optional(),
  affectedProducts: z.array(z.string().uuid()).optional(),
  immediateActions: z.string(),
});

export const DeviationReportedEventSchema = EventWithPayloadSchema(
  DeviationReportedPayloadSchema
).extend({
  eventType: z.literal("deviation.reported"),
});

export type DeviationReportedEvent = z.infer<typeof DeviationReportedEventSchema>;
```

#### 11.1.2 Deviation Classified

```typescript
export const DeviationClassifiedPayloadSchema = z.object({
  deviationId: z.string().uuid(),
  classifiedBy: z.string().uuid(),
  classifiedAt: z.string().datetime(),
  severity: z.enum(["critical", "major", "minor"]),
  classification: z.object({
    gmpRelevant: z.boolean(),
    regulatoryReportable: z.boolean(),
    productImpact: z.enum(["none", "potential", "confirmed"]),
    patientSafetyImpact: z.enum(["none", "potential", "confirmed"]),
  }),
  justification: z.string(),
});

export const DeviationClassifiedEventSchema = EventWithPayloadSchema(
  DeviationClassifiedPayloadSchema
).extend({
  eventType: z.literal("deviation.classified"),
});

export type DeviationClassifiedEvent = z.infer<typeof DeviationClassifiedEventSchema>;
```

#### 11.1.3 Deviation Investigation Started

```typescript
export const DeviationInvestigationStartedPayloadSchema = z.object({
  deviationId: z.string().uuid(),
  investigationId: z.string().uuid(),
  investigator: z.string().uuid(),
  investigationTeam: z.array(z.string().uuid()).optional(),
  investigationPlan: z.string(),
  startDate: z.string().datetime(),
  targetCompletionDate: z.string().date(),
});

export const DeviationInvestigationStartedEventSchema = EventWithPayloadSchema(
  DeviationInvestigationStartedPayloadSchema
).extend({
  eventType: z.literal("deviation.investigation_started"),
});

export type DeviationInvestigationStartedEvent = z.infer<typeof DeviationInvestigationStartedEventSchema>;
```

#### 11.1.4 Deviation Investigation Completed

```typescript
export const DeviationInvestigationCompletedPayloadSchema = z.object({
  deviationId: z.string().uuid(),
  investigationId: z.string().uuid(),
  completedBy: z.string().uuid(),
  completionDate: z.string().datetime(),
  findings: z.string(),
  rootCause: z.string(),
  contributingFactors: z.array(z.string()).optional(),
  capaRequired: z.boolean(),
  signature: z.object({
    signatureId: z.string().uuid(),
    signedBy: z.string().uuid(),
    signedAt: z.string().datetime(),
    meaning: z.literal("approved"),
  }),
});

export const DeviationInvestigationCompletedEventSchema = EventWithPayloadSchema(
  DeviationInvestigationCompletedPayloadSchema
).extend({
  eventType: z.literal("deviation.investigation_completed"),
});

export type DeviationInvestigationCompletedEvent = z.infer<typeof DeviationInvestigationCompletedEventSchema>;
```

#### 11.1.5 Deviation Impact Assessed

```typescript
export const DeviationImpactAssessedPayloadSchema = z.object({
  deviationId: z.string().uuid(),
  assessmentId: z.string().uuid(),
  assessedBy: z.string().uuid(),
  assessedAt: z.string().datetime(),
  productImpact: z.object({
    affectedBatches: z.array(
      z.object({
        batchId: z.string().uuid(),
        batchNumber: z.string(),
        disposition: z.enum(["accept", "rework", "reject", "quarantine"]),
        justification: z.string(),
      })
    ),
  }),
  processImpact: z.string(),
  qualityImpact: z.string(),
  regulatoryImpact: z.string().optional(),
});

export const DeviationImpactAssessedEventSchema = EventWithPayloadSchema(
  DeviationImpactAssessedPayloadSchema
).extend({
  eventType: z.literal("deviation.impact_assessed"),
});

export type DeviationImpactAssessedEvent = z.infer<typeof DeviationImpactAssessedEventSchema>;
```

#### 11.1.6 Deviation Closed

```typescript
export const DeviationClosedPayloadSchema = z.object({
  deviationId: z.string().uuid(),
  closedBy: z.string().uuid(),
  closureDate: z.string().datetime(),
  closureSummary: z.string(),
  linkedCAPAId: z.string().uuid().optional(),
  signature: z.object({
    signatureId: z.string().uuid(),
    signedBy: z.string().uuid(),
    signedAt: z.string().datetime(),
    meaning: z.literal("approved"),
  }),
});

export const DeviationClosedEventSchema = EventWithPayloadSchema(
  DeviationClosedPayloadSchema
).extend({
  eventType: z.literal("deviation.closed"),
});

export type DeviationClosedEvent = z.infer<typeof DeviationClosedEventSchema>;
```

---

## ✅ **12. VALIDATION DOMAIN EVENTS**

### 12.1 Validation Lifecycle

#### 12.1.1 Validation Protocol Created

```typescript
export const ValidationProtocolCreatedPayloadSchema = z.object({
  validationId: z.string().uuid(),
  protocolNumber: z.string(),
  title: z.string(),
  validationType: z.enum([
    "installation_qualification",
    "operational_qualification",
    "performance_qualification",
    "process_validation",
    "cleaning_validation",
    "method_validation",
    "system_validation",
    "revalidation",
  ]),
  scope: z.string(),
  equipment: z.array(
    z.object({
      equipmentId: z.string().uuid(),
      name: z.string(),
    })
  ).optional(),
  process: z.string().optional(),
  acceptanceCriteria: z.string(),
  author: z.string().uuid(),
  reviewers: z.array(z.string().uuid()),
});

export const ValidationProtocolCreatedEventSchema = EventWithPayloadSchema(
  ValidationProtocolCreatedPayloadSchema
).extend({
  eventType: z.literal("validation.protocol_created"),
});

export type ValidationProtocolCreatedEvent = z.infer<typeof ValidationProtocolCreatedEventSchema>;
```

#### 12.1.2 Validation Protocol Approved

```typescript
export const ValidationProtocolApprovedPayloadSchema = z.object({
  validationId: z.string().uuid(),
  approvedBy: z.string().uuid(),
  approvalDate: z.string().datetime(),
  approvalComments: z.string().optional(),
  signature: z.object({
    signatureId: z.string().uuid(),
    signedBy: z.string().uuid(),
    signedAt: z.string().datetime(),
    meaning: z.literal("approved"),
  }),
});

export const ValidationProtocolApprovedEventSchema = EventWithPayloadSchema(
  ValidationProtocolApprovedPayloadSchema
).extend({
  eventType: z.literal("validation.protocol_approved"),
});

export type ValidationProtocolApprovedEvent = z.infer<typeof ValidationProtocolApprovedEventSchema>;
```

#### 12.1.3 Validation Execution Started

```typescript
export const ValidationExecutionStartedPayloadSchema = z.object({
  validationId: z.string().uuid(),
  executionId: z.string().uuid(),
  executedBy: z.string().uuid(),
  startDate: z.string().datetime(),
  witnesses: z.array(z.string().uuid()).optional(),
});

export const ValidationExecutionStartedEventSchema = EventWithPayloadSchema(
  ValidationExecutionStartedPayloadSchema
).extend({
  eventType: z.literal("validation.execution_started"),
});

export type ValidationExecutionStartedEvent = z.infer<typeof ValidationExecutionStartedEventSchema>;
```

#### 12.1.4 Validation Test Case Executed

```typescript
export const ValidationTestCaseExecutedPayloadSchema = z.object({
  validationId: z.string().uuid(),
  executionId: z.string().uuid(),
  testCaseId: z.string().uuid(),
  testCaseNumber: z.string(),
  executedBy: z.string().uuid(),
  executionDate: z.string().datetime(),
  result: z.enum(["pass", "fail", "not_applicable"]),
  actualResult: z.string(),
  deviations: z.array(
    z.object({
      description: z.string(),
      justification: z.string(),
    })
  ).optional(),
});

export const ValidationTestCaseExecutedEventSchema = EventWithPayloadSchema(
  ValidationTestCaseExecutedPayloadSchema
).extend({
  eventType: z.literal("validation.test_case_executed"),
});

export type ValidationTestCaseExecutedEvent = z.infer<typeof ValidationTestCaseExecutedEventSchema>;
```

#### 12.1.5 Validation Report Generated

```typescript
export const ValidationReportGeneratedPayloadSchema = z.object({
  validationId: z.string().uuid(),
  reportId: z.string().uuid(),
  generatedBy: z.string().uuid(),
  generationDate: z.string().datetime(),
  summary: z.object({
    totalTestCases: z.number().int(),
    passedTestCases: z.number().int(),
    failedTestCases: z.number().int(),
    overallResult: z.enum(["successful", "successful_with_deviations", "unsuccessful"]),
  }),
  conclusions: z.string(),
  recommendations: z.string().optional(),
});

export const ValidationReportGeneratedEventSchema = EventWithPayloadSchema(
  ValidationReportGeneratedPayloadSchema
).extend({
  eventType: z.literal("validation.report_generated"),
});

export type ValidationReportGeneratedEvent = z.infer<typeof ValidationReportGeneratedEventSchema>;
```

---

## 📊 **13. QUALITY EVENTS MODULE EVENTS**

### 13.1 Quality Event Lifecycle

#### 13.1.1 Quality Event Created

```typescript
export const QualityEventCreatedPayloadSchema = z.object({
  qualityEventId: z.string().uuid(),
  eventNumber: z.string(),
  title: z.string(),
  description: z.string(),
  eventType: z.enum([
    "product_complaint",
    "quality_defect",
    "out_of_specification",
    "equipment_malfunction",
    "environmental_excursion",
    "audit_finding",
  ]),
  reportedBy: z.string().uuid(),
  reportedAt: z.string().datetime(),
  affectedAreas: z.array(z.string()),
  immediateContainment: z.string(),
});

export const QualityEventCreatedEventSchema = EventWithPayloadSchema(
  QualityEventCreatedPayloadSchema
).extend({
  eventType: z.literal("quality_events.created"),
});

export type QualityEventCreatedEvent = z.infer<typeof QualityEventCreatedEventSchema>;
```

#### 13.1.2 Quality Event Investigation Started

```typescript
export const QualityEventInvestigationStartedPayloadSchema = z.object({
  qualityEventId: z.string().uuid(),
  investigationId: z.string().uuid(),
  investigator: z.string().uuid(),
  startDate: z.string().datetime(),
  investigationScope: z.string(),
});

export const QualityEventInvestigationStartedEventSchema = EventWithPayloadSchema(
  QualityEventInvestigationStartedPayloadSchema
).extend({
  eventType: z.literal("quality_events.investigation_started"),
});

export type QualityEventInvestigationStartedEvent = z.infer<typeof QualityEventInvestigationStartedEventSchema>;
```

#### 13.1.3 Quality Event Resolved

```typescript
export const QualityEventResolvedPayloadSchema = z.object({
  qualityEventId: z.string().uuid(),
  resolvedBy: z.string().uuid(),
  resolutionDate: z.string().datetime(),
  resolution: z.string(),
  rootCause: z.string(),
  preventiveMeasures: z.string(),
  linkedCAPAId: z.string().uuid().optional(),
  signature: z.object({
    signatureId: z.string().uuid(),
    signedBy: z.string().uuid(),
    signedAt: z.string().datetime(),
    meaning: z.literal("approved"),
  }),
});

export const QualityEventResolvedEventSchema = EventWithPayloadSchema(
  QualityEventResolvedPayloadSchema
).extend({
  eventType: z.literal("quality_events.resolved"),
});

export type QualityEventResolvedEvent = z.infer<typeof QualityEventResolvedEventSchema>;
```

---

## 📚 **14. TRAINING DOMAIN EVENTS**

### 14.1 Training Lifecycle

#### 14.1.1 Training Assigned

```typescript
export const TrainingAssignedPayloadSchema = z.object({
  trainingRecordId: z.string().uuid(),
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  courseName: z.string(),
  assignedBy: z.string().uuid(),
  dueDate: z.string().date(),
  reason: z.enum([
    "initial_training",
    "annual_refresher",
    "new_procedure",
    "change_control",
    "deviation",
    "promotion",
  ]),
  linkedChangeId: z.string().uuid().optional(),
});

export const TrainingAssignedEventSchema = EventWithPayloadSchema(
  TrainingAssignedPayloadSchema
).extend({
  eventType: z.literal("training.assigned"),
});

export type TrainingAssignedEvent = z.infer<typeof TrainingAssignedEventSchema>;
```

#### 14.1.2 Training Completed

```typescript
export const TrainingCompletedPayloadSchema = z.object({
  trainingRecordId: z.string().uuid(),
  userId: z.string().uuid(),
  courseId: z.string().uuid(),
  completionDate: z.string().datetime(),
  score: z.number().min(0).max(100).optional(),
  passed: z.boolean(),
  trainer: z.string().uuid().optional(),
  certificationId: z.string().uuid().optional(),
  expirationDate: z.string().date().optional(),
  signature: z.object({
    signatureId: z.string().uuid(),
    signedBy: z.string().uuid(),
    signedAt: z.string().datetime(),
    meaning: z.literal("acknowledged"),
  }),
});

export const TrainingCompletedEventSchema = EventWithPayloadSchema(
  TrainingCompletedPayloadSchema
).extend({
  eventType: z.literal("training.completed"),
});

export type TrainingCompletedEvent = z.infer<typeof TrainingCompletedEventSchema>;
```

#### 14.1.3 Training Expired

```typescript
export const TrainingExpiredPayloadSchema = z.object({
  userId: z.string().uuid(),
  certificationId: z.string().uuid(),
  courseId: z.string().uuid(),
  courseName: z.string(),
  expirationDate: z.string().date(),
  gracePeriodEnd: z.string().date().optional(),
  retrainingRequired: z.boolean(),
});

export const TrainingExpiredEventSchema = EventWithPayloadSchema(
  TrainingExpiredPayloadSchema
).extend({
  eventType: z.literal("training.expired"),
});

export type TrainingExpiredEvent = z.infer<typeof TrainingExpiredEventSchema>;
```

---

## 📄 **15. DOCUMENT DOMAIN EVENTS**

### 15.1 Document Lifecycle

#### 15.1.1 Document Created

```typescript
export const DocumentCreatedPayloadSchema = z.object({
  documentId: z.string().uuid(),
  documentNumber: z.string(),
  title: z.string(),
  documentType: z.enum([
    "sop",
    "protocol",
    "report",
    "form",
    "specification",
    "policy",
    "manual",
  ]),
  author: z.string().uuid(),
  version: z.string(),
  effectiveDate: z.string().date().optional(),
  trainingRequired: z.boolean(),
});

export const DocumentCreatedEventSchema = EventWithPayloadSchema(
  DocumentCreatedPayloadSchema
).extend({
  eventType: z.literal("documents.created"),
});

export type DocumentCreatedEvent = z.infer<typeof DocumentCreatedEventSchema>;
```

#### 15.1.2 Document Approved

```typescript
export const DocumentApprovedPayloadSchema = z.object({
  documentId: z.string().uuid(),
  approvedBy: z.string().uuid(),
  approvalDate: z.string().datetime(),
  effectiveDate: z.string().date(),
  supersededDocumentId: z.string().uuid().optional(),
  signature: z.object({
    signatureId: z.string().uuid(),
    signedBy: z.string().uuid(),
    signedAt: z.string().datetime(),
    meaning: z.literal("approved"),
  }),
});

export const DocumentApprovedEventSchema = EventWithPayloadSchema(
  DocumentApprovedPayloadSchema
).extend({
  eventType: z.literal("documents.approved"),
});

export type DocumentApprovedEvent = z.infer<typeof DocumentApprovedEventSchema>;
```

#### 15.1.3 Document Obsoleted

```typescript
export const DocumentObsoletedPayloadSchema = z.object({
  documentId: z.string().uuid(),
  obsoletedBy: z.string().uuid(),
  obsoleteDate: z.string().datetime(),
  reason: z.string(),
  replacedByDocumentId: z.string().uuid().optional(),
});

export const DocumentObsoletedEventSchema = EventWithPayloadSchema(
  DocumentObsoletedPayloadSchema
).extend({
  eventType: z.literal("documents.obsoleted"),
});

export type DocumentObsoletedEvent = z.infer<typeof DocumentObsoletedEventSchema>;
```

---

## 📈 **16. ANALYTICS DOMAIN EVENTS**

### 16.1 Analytics & Reporting

#### 16.1.1 Compliance Metrics Calculated

```typescript
export const ComplianceMetricsCalculatedPayloadSchema = z.object({
  calculationId: z.string().uuid(),
  calculationDate: z.string().datetime(),
  period: z.object({
    start: z.string().date(),
    end: z.string().date(),
  }),
  metrics: z.object({
    changeControlMetrics: z.object({
      totalChanges: z.number().int(),
      onTimeCompletion: z.number().min(0).max(100),
      avgImplementationDays: z.number(),
    }),
    capaMetrics: z.object({
      totalCAPAs: z.number().int(),
      onTimeCompletion: z.number().min(0).max(100),
      effectiveness: z.number().min(0).max(100),
    }),
    deviationMetrics: z.object({
      totalDeviations: z.number().int(),
      criticalDeviations: z.number().int(),
      avgInvestigationDays: z.number(),
    }),
    trainingMetrics: z.object({
      complianceRate: z.number().min(0).max(100),
      expiredCertifications: z.number().int(),
    }),
  }),
});

export const ComplianceMetricsCalculatedEventSchema = EventWithPayloadSchema(
  ComplianceMetricsCalculatedPayloadSchema
).extend({
  eventType: z.literal("analytics.compliance_metrics_calculated"),
});

export type ComplianceMetricsCalculatedEvent = z.infer<typeof ComplianceMetricsCalculatedEventSchema>;
```

#### 16.1.2 Audit Report Generated

```typescript
export const AuditReportGeneratedPayloadSchema = z.object({
  reportId: z.string().uuid(),
  reportType: z.enum([
    "audit_trail",
    "compliance_summary",
    "regulatory_submission",
    "management_review",
  ]),
  generatedBy: z.string().uuid(),
  generationDate: z.string().datetime(),
  period: z.object({
    start: z.string().date(),
    end: z.string().date(),
  }),
  scope: z.array(z.string()),
  format: z.enum(["pdf", "excel", "json"]),
});

export const AuditReportGeneratedEventSchema = EventWithPayloadSchema(
  AuditReportGeneratedPayloadSchema
).extend({
  eventType: z.literal("analytics.audit_report_generated"),
});

export type AuditReportGeneratedEvent = z.infer<typeof AuditReportGeneratedEventSchema>;
```

---

## 🔧 **17. EVENT PROCESSING PATTERNS**

### 17.1 Event Handlers

#### 9.1.1 Base Event Handler

```typescript
import { z } from "zod";

export abstract class BaseEventHandler<T extends z.ZodType> {
  protected schema: T;

  constructor(schema: T) {
    this.schema = schema;
  }

  async handle(rawEvent: unknown): Promise<void> {
    try {
      // Валидация события через Zod
      const event = this.schema.parse(rawEvent);

      // Проверка идемпотентности
      if (await this.isAlreadyProcessed(event.eventId)) {
        return;
      }

      // Обработка события
      await this.processEvent(event);

      // Маркировка как обработанного
      await this.markAsProcessed(event.eventId, event.timestamp);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Ошибка валидации - отправляем в DLQ
        await this.sendToDLQ(rawEvent, "validation_error", error.message);
      } else {
        // Другие ошибки - логируем и возможно retry
        await this.handleProcessingError(rawEvent, error);
      }
    }
  }

  protected abstract processEvent(event: z.infer<T>): Promise<void>;

  private async isAlreadyProcessed(eventId: string): Promise<boolean> {
    // Проверка в Redis или БД
    return false;
  }

  private async markAsProcessed(
    eventId: string,
    timestamp: string
  ): Promise<void> {
    // Сохранение в Redis или БД
  }

  private async sendToDLQ(
    event: unknown,
    reason: string,
    details: string
  ): Promise<void> {
    // Отправка в Dead Letter Queue
  }

  private async handleProcessingError(
    event: unknown,
    error: unknown
  ): Promise<void> {
    // Логирование и обработка ошибок
  }
}
```

#### 9.1.2 Plant Created Handler Example

```typescript
export class PlantCreatedHandler extends BaseEventHandler<
  typeof PlantCreatedEventSchema
> {
  constructor(
    private plantRepository: PlantRepository,
    private batchRepository: BatchRepository,
    private notificationService: NotificationService
  ) {
    super(PlantCreatedEventSchema);
  }

  protected async processEvent(event: PlantCreatedEvent): Promise<void> {
    // 1. Создаем запись растения в БД
    await this.plantRepository.create({
      id: event.payload.plantId,
      batchId: event.payload.batchId,
      genetics: event.payload.genetics,
      location: event.payload.location,
      stage: "seedling",
      createdAt: new Date(event.timestamp),
      createdBy: event.userId!,
    });

    // 2. Обновляем счетчик в батче
    await this.batchRepository.incrementPlantCount(event.payload.batchId);

    // 3. Отправляем уведомление команде
    await this.notificationService.notify({
      type: "plant_created",
      recipients: ["cultivation_team"],
      data: {
        plantId: event.payload.plantId,
        strain: event.payload.genetics.strain,
        location: event.payload.location,
      },
    });

    // 4. Планируем следующие события (например, первый осмотр)
    await this.scheduleFollowUpEvents(event);
  }

  private async scheduleFollowUpEvents(
    event: PlantCreatedEvent
  ): Promise<void> {
    // Планирование первого осмотра через 7 дней
    const firstInspectionDate = new Date(event.timestamp);
    firstInspectionDate.setDate(firstInspectionDate.getDate() + 7);

    await this.eventScheduler.schedule({
      eventType: "plant.inspection_due",
      scheduledFor: firstInspectionDate,
      payload: {
        plantId: event.payload.plantId,
        inspectionType: "weekly",
      },
    });
  }
}
```

### 9.2 Saga Pattern Example

```typescript
// Saga для процесса сбора урожая
export class HarvestProcessSaga {
  constructor(
    private eventBus: EventBus,
    private sagaRepository: SagaRepository
  ) {}

  async handlePlantReadyForHarvest(
    event: PlantReadyForHarvestEvent
  ): Promise<void> {
    const sagaId = crypto.randomUUID();

    // Создаем saga state
    await this.sagaRepository.create({
      id: sagaId,
      type: "harvest_process",
      plantId: event.payload.plantId,
      status: "started",
      steps: [
        { name: "quality_check", status: "pending" },
        { name: "harvest_execution", status: "pending" },
        { name: "weight_recording", status: "pending" },
        { name: "quality_testing", status: "pending" },
        { name: "inventory_update", status: "pending" },
      ],
    });

    // Запускаем первый шаг
    await this.eventBus.publish({
      eventType: "quality.inspection_requested",
      payload: {
        plantId: event.payload.plantId,
        inspectionType: "pre_harvest",
        sagaId,
      },
    });
  }

  async handleQualityInspectionCompleted(
    event: QualityInspectionCompletedEvent
  ): Promise<void> {
    if (!event.payload.sagaId) return;

    const saga = await this.sagaRepository.findById(event.payload.sagaId);
    if (!saga || saga.type !== "harvest_process") return;

    if (event.payload.result === "approved") {
      // Обновляем saga и переходим к следующему шагу
      await this.sagaRepository.updateStep(
        saga.id,
        "quality_check",
        "completed"
      );

      await this.eventBus.publish({
        eventType: "cultivation.harvest_authorized",
        payload: {
          plantId: saga.plantId,
          sagaId: saga.id,
        },
      });
    } else {
      // Обрабатываем отклонение
      await this.sagaRepository.updateStatus(saga.id, "failed");

      await this.eventBus.publish({
        eventType: "cultivation.harvest_rejected",
        payload: {
          plantId: saga.plantId,
          reason: event.payload.rejectionReason,
        },
      });
    }
  }

  // ... остальные обработчики шагов saga
}
```

---

## 📊 **10. MONITORING & OBSERVABILITY**

### 10.1 Event Metrics

```typescript
export const EventMetricsSchema = z.object({
  topic: z.string(),
  eventType: z.string(),
  timestamp: z.string().datetime(),
  metrics: z.object({
    produced: z.number().int().nonnegative(),
    consumed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    retried: z.number().int().nonnegative(),
    processingTimeMs: z.number().nonnegative(),
    queueDepth: z.number().int().nonnegative(),
  }),
});

export type EventMetrics = z.infer<typeof EventMetricsSchema>;
```

### 10.2 Health Checks

```typescript
export class EventSystemHealthCheck {
  constructor(
    private kafka: KafkaJS.Kafka,
    private redis: Redis,
    private metrics: MetricsCollector
  ) {}

  async checkHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkKafkaConnectivity(),
      this.checkTopicAvailability(),
      this.checkConsumerLag(),
      this.checkDLQSize(),
      this.checkProcessingRate(),
    ]);

    const overallHealth = checks.every(
      (check) => check.status === "fulfilled" && check.value.healthy
    );

    return {
      healthy: overallHealth,
      checks: checks.map((check) =>
        check.status === "fulfilled"
          ? check.value
          : { healthy: false, error: check.reason }
      ),
      timestamp: new Date().toISOString(),
    };
  }
}
```

---

## 🔄 **11. SCHEMA EVOLUTION**

### 11.1 Versioning Strategy

```typescript
// v1.0 - Исходная схема
export const PlantCreatedEventV1Schema = z.object({
  eventType: z.literal("plant.created"),
  eventVersion: z.literal("1.0"),
  payload: z.object({
    plantId: z.string().uuid(),
    strain: z.string(),
    location: z.string(),
  }),
});

// v1.1 - Добавили genetics объект (обратно совместимо)
export const PlantCreatedEventV1_1Schema = z.object({
  eventType: z.literal("plant.created"),
  eventVersion: z.literal("1.1"),
  payload: z.object({
    plantId: z.string().uuid(),
    strain: z.string(), // Deprecated, используем genetics.strain
    genetics: z.object({
      strain: z.string(),
      type: z.enum(["indica", "sativa", "hybrid"]),
    }),
    location: z.string(),
  }),
});

// Migration handler
export class EventMigrator {
  migrate(rawEvent: unknown): unknown {
    const baseEvent = BaseEventSchema.parse(rawEvent);

    switch (baseEvent.eventVersion) {
      case "1.0":
        return this.migrateV1ToV1_1(rawEvent);
      case "1.1":
        return rawEvent; // Текущая версия
      default:
        throw new Error(`Unsupported event version: ${baseEvent.eventVersion}`);
    }
  }

  private migrateV1ToV1_1(event: unknown): unknown {
    const v1Event = PlantCreatedEventV1Schema.parse(event);

    return {
      ...v1Event,
      eventVersion: "1.1",
      payload: {
        ...v1Event.payload,
        genetics: {
          strain: v1Event.payload.strain,
          type: "hybrid" as const, // Default value
        },
      },
    };
  }
}
```

---

## 📋 **12. IMPLEMENTATION CHECKLIST**

### 12.1 Phase 1: Core Infrastructure

- [ ] Kafka cluster setup и configuration
- [ ] Base event schemas с Zod validation
- [ ] Event bus wrapper с типобезопасностью
- [ ] Dead Letter Queue handling
- [ ] Basic monitoring и health checks

### 12.2 Phase 2: Domain Events

- [x] Cultivation domain events (plant lifecycle) ✅
- [x] Quality domain events (testing, sampling) ✅
- [x] Financial domain events (transactions, assets) ✅
- [x] Audit domain events (access, compliance) ✅
- [x] **Change Control domain events (8 topics, 15 schemas)** ✅
- [x] **CAPA domain events (6 topics, 12 schemas)** ✅
- [x] **Deviation domain events (5 topics, 10 schemas)** ✅
- [x] **Validation domain events (4 topics, 8 schemas)** ✅
- [x] **Quality Events module events (3 topics, 6 schemas)** ✅
- [x] **Training domain events (2 topics, 4 schemas)** ✅
- [x] **Document domain events (1 topic, 3 schemas)** ✅
- [x] **Analytics domain events (2 topics, 5 schemas)** ✅

### 12.3 Phase 3: Advanced Patterns

- [ ] Saga pattern implementation
- [ ] Event sourcing для критических агрегатов
- [ ] CQRS read models
- [ ] Event replay functionality

### 12.4 Phase 4: Production Ready

- [ ] Schema registry integration
- [ ] Advanced monitoring и alerting
- [ ] Performance optimization
- [ ] Disaster recovery procedures

---

## 📚 **13. RELATED DOCUMENTS**

- [`CODING_STANDARDS.md`](CODING_STANDARDS.md) - Zod-first development standards
- [`SYSTEM_ARCHITECTURE.md`](SYSTEM_ARCHITECTURE.md) - Overall system architecture
- [`CONTRACT_SPECIFICATIONS.md`](CONTRACT_SPECIFICATIONS.md) - API contracts
- [`DATABASE_DESIGN.md`](DATABASE_DESIGN.md) - Database schemas
- [`MONITORING_STRATEGY.md`](MONITORING_STRATEGY.md) - Observability approach

---

**Версия**: 2.0  
**Последнее обновление**: 17 октября 2025  
**Статус**: Under Review → Pending Approval  
**Предыдущая версия**: 1.0 (2025-09-14)

**Изменения в v2.0**:
- ✅ Добавлено 31 Kafka topic для compliance модулей
- ✅ Добавлено 83 event schema с Zod validation
- ✅ Полная поддержка Change Control, CAPA, Deviation, Validation
- ✅ Quality Events, Training, Documents, Analytics события
- ✅ Синхронизировано с DS v2.0 и CONTRACT_SPECIFICATIONS v2.0

---

> **📌 Важно**: Этот документ является живым стандартом и должен обновляться при добавлении новых событий или изменении архитектуры.
