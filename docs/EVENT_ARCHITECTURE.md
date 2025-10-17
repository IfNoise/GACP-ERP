---
title: "Event-Driven Architecture & Kafka Events"
version: "1.0"
status: "active"
last_updated: "2025-09-14"
type: "architecture"
# AI-Assisted Documentation Metadata (per AI_Assisted_Documentation_Policy.md)
ai_generated: true
author_verified: false
qa_approved: false
ai_status: draft
---

# 🎯 Event-Driven Architecture & Kafka Events

**Документ**: Event Architecture Specification  
**Версия**: 1.0  
**Дата**: 14 сентября 2025  
**Статус**: CRITICAL - Основа для событийной архитектуры

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

## 🔧 **9. EVENT PROCESSING PATTERNS**

### 9.1 Event Handlers

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

- [ ] Cultivation domain events (plant lifecycle)
- [ ] Quality domain events (testing, sampling)
- [ ] Financial domain events (transactions, assets)
- [ ] Audit domain events (access, compliance)

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

**Версия**: 1.0  
**Последнее обновление**: 14 сентября 2025  
**Статус**: Draft → Review → Approved

---

> **📌 Важно**: Этот документ является живым стандартом и должен обновляться при добавлении новых событий или изменении архитектуры.
