---
title: "System Architecture Document (SAD)"
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

# 🏗️ Архитектура GACP-ERP системы

**Документ**: System Architecture Document (SAD)  
**Версия**: 1.0  
**Дата**: 14 сентября 2025  
**Статус**: CRITICAL - Основа для разработки

---

## 🎯 **1. ВВЕДЕНИЕ**

### 1.1 Назначение документа

Данный документ описывает техническую архитектуру GACP-ERP системы с детальным рассмотрением:

- Модульной структуры системы
- API спецификаций и интерфейсов
- Схем баз данных и моделей данных
- Интеграционных паттернов
- Patterns и best practices

### 1.2 Целевая аудитория

- **Разработчики**: @IfNoise + AI Assistant (GitHub Copilot + Claude)
- **Архитекторы**: Для понимания общей структуры
- **DevOps инженеры**: Для deployment и infrastructure
- **QA инженеры**: Для планирования тестирования

### 1.3 Связь с другими документами

- **Базируется на**: Technical Requirements Document
- **Реализует**: URS/FS/DS требования
- **Интегрируется с**: Mayan-EDMS, XeoKit, IoT системы

---

## 🏛️ **2. ОБЩАЯ АРХИТЕКТУРА СИСТЕМЫ**

### 2.1 High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                        │
├─────────────────────────────────────────────────────────────────────┤
│           Progressive Web Application (Next.js 15+)                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ Desktop UI  │ │ Mobile UI   │ │ Terminal UI │ │ 3D Viewer   │   │
│  │ (Workstns)  │ │ (Phones)    │ │ (TV Screens)│ │ (XeoKit)    │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                          HTTPS/WSS
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────────┤
│                    NestJS API Gateway                              │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                     MICROSERVICES                               ││
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ ││
│  │ │Plant        │ │Financial    │ │Workforce    │ │Spatial    │ ││
│  │ │Lifecycle    │ │Management   │ │Management   │ │Planning   │ ││
│  │ └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ ││
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ ││
│  │ │IoT &        │ │Training &   │ │Procurement  │ │Analytics  │ ││
│  │ │Monitoring   │ │Competency   │ │Management   │ │& Forecast │   ││
│  │ └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘   ││
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐   ││
│  │ │Authorization│ │Audit Trail  │ │Document Mgmt│ │PDF Report │   ││
│  │ │& Authz      │ │& Compliance │ │(Mayan EDMS) │ │Generator  │   ││
│  │ └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘   ││
│  │ ┌──────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  ││
│  │ │Internal      │ │Database     │ │Knowledge    │ │External   │  ││
│  │ │Communications│ │Replication  │ │Knowledge    │ │External   │  ││
│  │ │(Jitsi Stack) │ │& WORM       │ │Management   │ │Integration│  ││
│  │ └──────────────┘ └─────────────┘ └─────────────┘ └───────────┘  ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                              │
                      EVENT-DRIVEN MESSAGING
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│ │PostgreSQL   │ │MongoDB      │ │VictoriaMetrs│ │ImmuDB       │   │
│ │(Primary)    │ │(Documents)  │ │(TimeSeries) │ │(AuditTrail) │   │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│ │Redis        │ │Mayan-EDMS   │ │File Storage │ │Elasticsearch│   │
│ │(Cache)      │ │(Documents)  │ │(S3)         │ │(Search)     │   │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│ │PostgreSQL   │ │Prosody XMPP │ │Cloud        │ │WORM Storage │   │
│ │Replicas     │ │Server       │ │Database     │ │(Compliance) │   │
│ │(Multi-Cloud)│ │(Jitsi)      │ │Replicas     │ │             │   │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                        INFRASTRUCTURE
                              │
┌─────────────────────────────────────────────────────────────────────┐
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│ │Kubernetes   │ │Apache Kafka │ │MQTT Broker  │ │Keycloak     │   │
│ │(Container   │ │(Events)     │ │EMQX (IoT)   │ │(Auth)       │   │
│ │Orchestration│ │             │ │             │ │             │   │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│ │Prometheus   │ │Grafana      │ │Traefik      │ │Cert-Manager │   │
│ │(Monitoring) │ │(Dashboards) │ │(Load Bal.)  │ │(TLS)        │   │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│ │Jitsi Meet   │ │Jitsi        │ │Jicofo       │ │Jigasi       │   │
│ │(Video Conf) │ │Videobridge  │ │(Conference  │ │(SIP Gateway)│   │
│ │             │ │(Media SFU)  │ │ Management) │ │             │   │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Архитектурные принципы

#### 2.2.1 🏛️ ФУНДАМЕНТАЛЬНЫЙ ПРИНЦИП: Zod-First Development

> **КРИТИЧЕСКИ ВАЖНО**: Zod schemas являются единственным источником истины (Single Source of Truth) для всех типов, валидации и API контрактов

- **ЗАПРЕЩЕНО**: Использование TypeScript `interface` или `type` без Zod схемы
- **ОБЯЗАТЕЛЬНО**: Все типы выводятся через `z.infer<typeof Schema>`
- **ОБЯЗАТЕЛЬНО**: Runtime validation для всех входящих данных (API, Kafka, MQTT)
- **ОБЯЗАТЕЛЬНО**: Schema-first API design с ts-rest + Zod

#### 2.2.2 Schema-First API Design с ts-rest

- **API Contracts**: Определяются через ts-rest contracts с Zod валидацией
- **Type Safety**: Полная типобезопасность от backend до frontend
- **Validation**: Автоматическая валидация request/response через Zod
- **Documentation**: Auto-generated OpenAPI спецификация из Zod схем

#### 2.2.3 NX Monorepo Architecture

- **Project Structure**: NX Workspace для организации всех модулей и библиотек
- **Code Generation**: Автоматическое создание сервисов, библиотек и приложений
- **Affected Commands**: Интеллектуальная сборка только измененных проектов
- **Build Optimization**: Распределенная сборка и кэширование
- **Dependency Graph**: Визуализация и валидация зависимостей между проектами

#### 2.2.4 Domain-Driven Design (DDD)

- **Bounded Contexts**: Четкое разделение доменов
- **Aggregates**: Consistency boundaries с Zod validation
- **Domain Events**: Loose coupling между модулями через Kafka + Zod
- **Ubiquitous Language**: Единый язык предметной области

#### 2.2.5 Event-Driven Architecture (EDA)

- **Event Sourcing**: Для audit trail и compliance с Zod схемами событий
- **CQRS**: Разделение команд и запросов
- **Eventual Consistency**: Между microservices
- **Saga Pattern**: Для distributed transactions
- **Event Validation**: Все Kafka события валидируются через Zod

#### 2.2.6 Microservices Patterns

- **API Gateway**: Единая точка входа с ts-rest контрактами
- **Service Discovery**: Автоматическое обнаружение сервисов
- **Circuit Breaker**: Защита от каскадных отказов
- **Bulkhead**: Изоляция ресурсов

---

## 📦 **3. МОДУЛЬНАЯ АРХИТЕКТУРА**

### 3.1 Core Business Modules

#### 3.1.1 Plant Lifecycle Module

**Bounded Context**: Управление жизненным циклом растений

```typescript
// 🎯 Все схемы данных определены через Zod - ЕДИНСТВЕННЫЙ источник истины
// См. CONTRACT_SPECIFICATIONS.md для полных определений

import { z } from "zod";
import {
  PlantSchema,
  BatchSchema,
  PlantEventSchema,
  LocationSchema,
  PlantStageSchema,
} from "@gacp/shared/schemas";

// ✅ ПРАВИЛЬНО: Type inference из Zod схем
export type Plant = z.infer<typeof PlantSchema>;
export type Batch = z.infer<typeof BatchSchema>;
export type PlantEvent = z.infer<typeof PlantEventSchema>;
export type PlantStage = z.infer<typeof PlantStageSchema>;
export type Location = z.infer<typeof LocationSchema>;

// ❌ НЕПРАВИЛЬНО: НИКОГДА не используем interface без Zod схемы
// interface Plant { ... } // ЗАПРЕЩЕНО!

// Runtime validation для всех операций - ОБЯЗАТЕЛЬНО
export const validatePlant = (data: unknown): Plant => PlantSchema.parse(data);
export const validateBatch = (data: unknown): Batch => BatchSchema.parse(data);

// Domain Aggregates с Zod validation
export class PlantAggregate {
  constructor(private readonly plant: Plant) {
    // Валидация при создании
    PlantSchema.parse(plant);
  }

  transition(newStage: PlantStage): PlantEvent[] {
    // Валидация stage transition
    PlantStageSchema.parse(newStage);
    // ... logic
    return [];
  }

  move(newLocation: Location): PlantEvent[] {
    // Валидация location
    LocationSchema.parse(newLocation);
    // ... logic
    return [];
  }

  harvest(): PlantEvent[] {
    // ... logic
    return [];
  }
}

````

**API Endpoints с ts-rest + Zod**:

```typescript
// ✅ ПРАВИЛЬНО: Schema-first API Design с ts-rest
import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  PlantSchema,
  CreatePlantSchema,
  UpdatePlantSchema,
  PlantResponseSchema,
  BatchResponseSchema,
} from "@gacp/shared/schemas";

const c = initContract();

export const plantsContract = c.router(
  {
    createPlant: {
      method: "POST",
      path: "/plants",
      body: CreatePlantSchema,
      responses: {
        201: PlantResponseSchema,
        400: z.object({ message: z.string() }),
      },
      summary: "Create plant",
    },
    getPlant: {
      method: "GET",
      path: "/plants/:id",
      pathParams: z.object({ id: z.string().uuid() }),
      responses: {
        200: PlantResponseSchema,
        404: z.object({ message: z.string() }),
      },
      summary: "Get plant details",
    },
    updatePlant: {
      method: "PUT",
      path: "/plants/:id",
      pathParams: z.object({ id: z.string().uuid() }),
      body: UpdatePlantSchema,
      responses: {
        200: PlantResponseSchema,
        404: z.object({ message: z.string() }),
      },
      summary: "Update plant",
    },
    transitionPlantStage: {
      method: "POST",
      path: "/plants/:id/transition",
      pathParams: z.object({ id: z.string().uuid() }),
      body: z.object({ newStage: PlantStageSchema }),
      responses: {
        200: PlantResponseSchema,
        400: z.object({ message: z.string() }),
      },
      summary: "Transition plant stage",
    },
    listBatches: {
      method: "GET",
      path: "/batches",
      query: z.object({
        page: z.number().int().positive().optional(),
        limit: z.number().int().positive().max(100).optional(),
      }),
      responses: {
        200: z.object({
          data: z.array(BatchResponseSchema),
          pagination: z.object({
            page: z.number(),
            limit: z.number(),
            total: z.number(),
          }),
        }),
      },
      summary: "List batches",
    },
  },
  {
    pathPrefix: "/api/v1",
  }
);

// Type inference - автоматические типы для всего API
export type PlantsContract = typeof plantsContract;
````

**Database Schema**:

```sql
-- PostgreSQL Schema
CREATE TABLE plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id),
    genetics_id UUID NOT NULL REFERENCES genetics(id),
    stage plant_stage_enum NOT NULL,
    location_id UUID REFERENCES locations(id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE plant_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID NOT NULL REFERENCES plants(id),
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_plants_batch_id ON plants(batch_id);
CREATE INDEX idx_plants_stage ON plants(stage);
CREATE INDEX idx_plant_events_plant_id ON plant_events(plant_id);
```

#### 3.1.2 Financial Module

**Bounded Context**: Финансовый учет и биологические активы

```typescript
// ✅ ПРАВИЛЬНО: Zod schemas как Single Source of Truth
import { z } from "zod";

// Zod Schemas
export const AccountSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(255),
  type: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
  parentId: z.string().uuid().optional(),
  balance: z.object({
    amount: z.number(),
    currency: z.enum(["USD", "EUR", "RUB"]),
  }),
});

export const JournalEntrySchema = z.object({
  id: z.string().uuid(),
  date: z.string().datetime(),
  description: z.string().min(1),
  lines: z.array(
    z.object({
      accountId: z.string().uuid(),
      debit: z.number().nonnegative().optional(),
      credit: z.number().nonnegative().optional(),
    })
  ),
  reference: z.string().optional(),
  status: z.enum(["draft", "posted", "void"]),
});

export const BiologicalAssetSchema = z.object({
  id: z.string().uuid(),
  plantId: z.string().uuid(),
  acquisitionCost: z.object({
    amount: z.number().nonnegative(),
    currency: z.enum(["USD", "EUR", "RUB"]),
  }),
  currentValue: z.object({
    amount: z.number().nonnegative(),
    currency: z.enum(["USD", "EUR", "RUB"]),
  }),
  valuationDate: z.string().datetime(),
  method: z.enum(["cost", "fair_value", "net_realizable_value"]),
});

// Type inference - NO interfaces!
export type Account = z.infer<typeof AccountSchema>;
export type JournalEntry = z.infer<typeof JournalEntrySchema>;
export type BiologicalAsset = z.infer<typeof BiologicalAssetSchema>;

// ❌ НЕПРАВИЛЬНО: Не используем interface
// interface Account { ... } // ЗАПРЕЩЕНО!
```

**API Endpoints с ts-rest**:

```typescript
// ✅ ПРАВИЛЬНО: ts-rest contract для Financial API
import { initContract } from "@ts-rest/core";
import { z } from "zod";
import {
  AccountSchema,
  JournalEntrySchema,
  BiologicalAssetSchema,
} from "@gacp/shared/schemas";

const c = initContract();

export const financialContract = c.router(
  {
    getAccounts: {
      method: "GET",
      path: "/accounts",
      query: z.object({
        type: z.enum(["asset", "liability", "equity", "revenue", "expense"]).optional(),
      }),
      responses: {
        200: z.object({ data: z.array(AccountSchema) }),
      },
      summary: "Get chart of accounts",
    },
    createJournalEntry: {
      method: "POST",
      path: "/journal-entries",
      body: JournalEntrySchema.omit({ id: true, status: true }),
      responses: {
        201: JournalEntrySchema,
        400: z.object({ message: z.string() }),
      },
      summary: "Create journal entry",
    },
    listBiologicalAssets: {
      method: "GET",
      path: "/biological-assets",
      responses: {
        200: z.object({ data: z.array(BiologicalAssetSchema) }),
      },
      summary: "List biological assets",
    },
    valuateBiologicalAsset: {
      method: "POST",
      path: "/biological-assets/valuation",
      body: z.object({
        assetId: z.string().uuid(),
        method: z.enum(["cost", "fair_value", "net_realizable_value"]),
      }),
      responses: {
        200: BiologicalAssetSchema,
      },
      summary: "Valuation of biological asset",
    },
  },
  { pathPrefix: "/api/v1" }
);
```

#### 3.1.3 Document Management (Mayan-EDMS)

**Bounded Context**: Электронный документооборот

```typescript
// ✅ ПРАВИЛЬНО: Zod schemas для Document Management
import { z } from "zod";

// Zod Schemas
export const DocumentSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  documentType: z.enum(["sop", "batch_record", "training", "audit", "report"]),
  metadata: z.record(z.string(), z.unknown()),
  versions: z.array(
    z.object({
      versionId: z.string().uuid(),
      versionNumber: z.number().int().positive(),
      uploadedAt: z.string().datetime(),
      uploadedBy: z.string().uuid(),
      fileSize: z.number().positive(),
      checksum: z.string(),
    })
  ),
  workflow: z
    .object({
      id: z.string().uuid(),
      workflowId: z.string().uuid(),
      currentState: z.string(),
      tasks: z.array(
        z.object({
          taskId: z.string().uuid(),
          assignee: z.string().uuid(),
          status: z.enum(["pending", "in_progress", "completed", "rejected"]),
        })
      ),
      startedAt: z.string().datetime(),
      completedAt: z.string().datetime().optional(),
    })
    .optional(),
  permissions: z.array(
    z.object({
      userId: z.string().uuid(),
      role: z.enum(["owner", "editor", "viewer"]),
    })
  ),
});

export const ElectronicSignatureSchema = z.object({
  id: z.string().uuid(),
  documentId: z.string().uuid(),
  signerId: z.string().uuid(),
  signatureData: z.string(), // Base64 encoded signature
  timestamp: z.string().datetime(),
  certificate: z.object({
    issuer: z.string(),
    serialNumber: z.string(),
    validFrom: z.string().datetime(),
    validTo: z.string().datetime(),
  }),
});

// Type inference
export type Document = z.infer<typeof DocumentSchema>;
export type ElectronicSignature = z.infer<typeof ElectronicSignatureSchema>;
```

**Integration Points с Zod validation**:

```typescript
// ✅ ПРАВИЛЬНО: Service с Zod validation
import { Injectable } from "@nestjs/common";
import { z } from "zod";
import {
  DocumentSchema,
  ElectronicSignatureSchema,
} from "@gacp/shared/schemas";

// Input schemas для API методов
const UploadDocumentInputSchema = z.object({
  file: z.instanceof(File),
  metadata: z.record(z.string(), z.unknown()),
});

const SearchQuerySchema = z.object({
  query: z.string().min(1),
  documentType: z.enum(["sop", "batch_record", "training", "audit", "report"]).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

@Injectable()
export class MayanEdmsService {
  async uploadDocument(
    input: z.infer<typeof UploadDocumentInputSchema>
  ): Promise<z.infer<typeof DocumentSchema>> {
    // Runtime validation
    const validated = UploadDocumentInputSchema.parse(input);
    // ... implementation
    const document = await this.uploadToMayan(validated);
    return DocumentSchema.parse(document);
  }

  async getDocument(documentId: string): Promise<z.infer<typeof DocumentSchema>> {
    const document = await this.fetchFromMayan(documentId);
    // Runtime validation результата
    return DocumentSchema.parse(document);
  }

  async signDocument(
    documentId: string,
    signature: z.infer<typeof ElectronicSignatureSchema>
  ): Promise<void> {
    // Валидация signature
    ElectronicSignatureSchema.parse(signature);
    await this.applySignature(documentId, signature);
  }

  async searchDocuments(
    query: z.infer<typeof SearchQuerySchema>
  ): Promise<Array<z.infer<typeof DocumentSchema>>> {
    // Runtime validation
    const validated = SearchQuerySchema.parse(query);
    const results = await this.searchInMayan(validated);
    // Валидация результатов
    return z.array(DocumentSchema).parse(results);
  }
}
```

### 3.2 Support Modules

#### 3.2.1 IoT & Monitoring Module

**Bounded Context**: Сбор и анализ IoT данных

```typescript
// 🎯 Все IoT схемы определены через Zod
// См. CONTRACT_SPECIFICATIONS.md секция "2.3 IoT Sensors Schemas"

import {
  SensorSchema,
  SensorReadingSchema,
  SensorAlertTriggeredEventSchema,
} from "@gacp/shared/schemas";

// Type inference из Zod схем - NO TypeScript interfaces!
type Sensor = z.infer<typeof SensorSchema>;
type SensorReading = z.infer<typeof SensorReadingSchema>;
type SensorAlert = z.infer<typeof SensorAlertTriggeredEventSchema>;

// Runtime validation для всех MQTT сообщений
const validateSensorReading = (data: unknown): SensorReading =>
  SensorReadingSchema.parse(data);
```

**MQTT Integration с Zod валидацией**:

```typescript
// MQTT сообщения валидируются через Zod схемы
import { SensorReadingRecordedEventSchema } from "@gacp/shared/events";

class MqttHandler {
  @Subscribe("sensors/+/data")
  async handleSensorData(topic: string, payload: unknown) {
    // Runtime validation через Zod
    const validatedReading = SensorReadingRecordedEventSchema.parse(payload);

    // Process validated data
    await this.storageService.save(validatedReading);
    await this.alertService.checkThresholds(validatedReading);
  }
}
```

#### 3.2.2 Internal Communications Module (Jitsi Stack)

**Bounded Context**: Внутренние коммуникации и конференц-связь

```typescript
// ✅ ПРАВИЛЬНО: Zod schemas для Jitsi Communications
import { z } from "zod";

// Zod Schemas
export const ConferenceSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  roomId: z.string().min(1),
  participants: z.array(
    z.object({
      userId: z.string().uuid(),
      displayName: z.string().min(1),
      jid: z.string(), // XMPP Jabber ID
      role: z.enum(["moderator", "participant"]),
      joinTime: z.string().datetime(),
      leaveTime: z.string().datetime().optional(),
      status: z.enum(["active", "muted", "away"]),
    })
  ),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  recording: z
    .object({
      recordingId: z.string().uuid(),
      url: z.string().url(),
      duration: z.number().positive(),
    })
    .optional(),
  moderator: z.string().uuid(),
});

export const MessageSchema = z.object({
  id: z.string().uuid(),
  from: z.string().uuid(),
  to: z.string().uuid(), // userId or conferenceId
  content: z.string().min(1),
  type: z.enum(["chat", "notification", "alert"]),
  timestamp: z.string().datetime(),
  delivered: z.boolean(),
  read: z.boolean(),
});

export const CreateConferenceRequestSchema = z.object({
  name: z.string().min(1).max(255),
  moderatorId: z.string().uuid(),
  enableRecording: z.boolean().default(false),
  maxParticipants: z.number().int().positive().optional(),
});

// Type inference
export type Conference = z.infer<typeof ConferenceSchema>;
export type Message = z.infer<typeof MessageSchema>;
export type CreateConferenceRequest = z.infer<typeof CreateConferenceRequestSchema>;
```

**Jitsi Integration Architecture с Zod validation**:

```typescript
// ✅ ПРАВИЛЬНО: Service с Zod validation
import { Injectable } from "@nestjs/common";
import {
  ConferenceSchema,
  CreateConferenceRequestSchema,
  MessageSchema,
} from "@gacp/shared/schemas";
import { z } from "zod";

const JoinResponseSchema = z.object({
  conferenceId: z.string().uuid(),
  jwtToken: z.string(),
  roomUrl: z.string().url(),
  permissions: z.array(z.string()),
});

const MessageRequestSchema = z.object({
  from: z.string().uuid(),
  to: z.string().uuid(),
  content: z.string().min(1),
  type: z.enum(["chat", "notification", "alert"]),
});

@Injectable()
export class JitsiService {
  async createConference(
    request: z.infer<typeof CreateConferenceRequestSchema>
  ): Promise<z.infer<typeof ConferenceSchema>> {
    // Runtime validation
    const validated = CreateConferenceRequestSchema.parse(request);
    
    // Create room in Prosody XMPP
    // Configure Jicofo for media management
    // Setup recording if required
    // Generate JWT token for authentication
    
    const conference = await this.setupConference(validated);
    return ConferenceSchema.parse(conference);
  }

  async joinConference(
    conferenceId: string,
    userId: string
  ): Promise<z.infer<typeof JoinResponseSchema>> {
    // Authenticate user via Keycloak SSO
    // Generate secure conference JWT
    // Configure participant permissions
    // Log access for audit trail
    
    const response = await this.generateJoinResponse(conferenceId, userId);
    return JoinResponseSchema.parse(response);
  }

  async sendMessage(
    message: z.infer<typeof MessageRequestSchema>
  ): Promise<void> {
    // Runtime validation
    const validated = MessageRequestSchema.parse(message);
    
    // Send via Prosody XMPP server
    // Store in audit trail (immudb)
    // Push notification if user offline
    // Integrate with Kafka events
    
    await this.deliverMessage(validated);
  }
}
```

**XMPP/Prosody Configuration**:

```lua
-- prosody.cfg.lua configuration for GACP-ERP
VirtualHost "gacp-erp.local"
    authentication = "token"
    app_id = "gacp_erp"
    app_secret = "secure_secret_from_keycloak"
    allow_empty_token = false

    modules_enabled = {
        "bosh";
        "websocket";
        "smacks";
        "carbons";
        "mam"; -- Message Archive Management
        "token_verification";
        "presence";
        "roster";
        "audit_log"; -- Custom audit module
    }

Component "conference.gacp-erp.local" "muc"
    modules_enabled = {
        "muc_meeting_id";
        "muc_domain_mapper";
        "token_verification";
        "muc_rate_limit";
        "audit_conference"; -- Custom audit module
    }
```

#### 3.2.3 Database Replication Module

**Bounded Context**: Репликация данных и обеспечение непрерывности

```typescript
// ✅ ПРАВИЛЬНО: Zod schemas для Database Replication
import { z } from "zod";

// Zod Schemas
export const ReplicationStreamSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  sourceDatabase: z.object({
    host: z.string(),
    port: z.number().int().positive(),
    database: z.string(),
    ssl: z.boolean(),
  }),
  targetReplicas: z.array(
    z.object({
      id: z.string().uuid(),
      type: z.enum(["primary", "standby", "cloud"]),
      location: z.enum(["on-premise", "aws", "azure", "gcp"]),
      isWORM: z.boolean(), // Write Once Read Many
      retentionPolicy: z.object({
        days: z.number().int().positive(),
        deleteAfter: z.boolean(),
      }),
      encryptionConfig: z.object({
        enabled: z.boolean(),
        algorithm: z.enum(["AES-256", "AES-128"]),
        keyRotationDays: z.number().int().positive(),
      }),
    })
  ),
  status: z.enum(["active", "paused", "error", "stopped"]),
  lag: z.number().nonnegative(), // milliseconds
  lastSync: z.string().datetime(),
  configuration: z.record(z.string(), z.unknown()),
});

export const AuditReplicationEventSchema = z.object({
  eventId: z.string().uuid(),
  streamId: z.string().uuid(),
  eventType: z.enum(["sync_started", "sync_completed", "sync_failed", "lag_warning"]),
  timestamp: z.string().datetime(),
  sourceWAL: z.string(), // WAL position
  targetWAL: z.string(),
  latency: z.number().nonnegative(),
  checksum: z.string(),
});

export const DatabaseChangeEventSchema = z.object({
  operation: z.enum(["INSERT", "UPDATE", "DELETE"]),
  table: z.string(),
  schema: z.string(),
  oldData: z.record(z.string(), z.unknown()).optional(),
  newData: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.string().datetime(),
  transactionId: z.string(),
  userId: z.string(),
  checksum: z.string(),
});

// Type inference
export type ReplicationStream = z.infer<typeof ReplicationStreamSchema>;
export type AuditReplicationEvent = z.infer<typeof AuditReplicationEventSchema>;
export type DatabaseChangeEvent = z.infer<typeof DatabaseChangeEventSchema>;
```

**PostgreSQL Streaming Replication с Zod validation**:

```typescript
import { Injectable } from "@nestjs/common";
import { z } from "zod";
import {
  ReplicationStreamSchema,
  AuditReplicationEventSchema,
} from "@gacp/shared/schemas";

const ReplicationConfigSchema = z.object({
  streamName: z.string(),
  sourceDsn: z.string(),
  targets: z.array(
    z.object({
      dsn: z.string(),
      isWORM: z.boolean(),
    })
  ),
});

const ReplicationStatusSchema = z.object({
  streamId: z.string().uuid(),
  isHealthy: z.boolean(),
  currentLag: z.number().nonnegative(),
  lastSync: z.string().datetime(),
  errors: z.array(z.string()),
});

const IntegrityReportSchema = z.object({
  streamId: z.string().uuid(),
  checksumMatch: z.boolean(),
  alcoapCompliant: z.boolean(),
  wormIntact: z.boolean(),
  issues: z.array(z.string()),
});

@Injectable()
export class DatabaseReplicationService {
  async configureStreaming(
    config: z.infer<typeof ReplicationConfigSchema>
  ): Promise<void> {
    // Runtime validation
    const validated = ReplicationConfigSchema.parse(config);
    
    // Configure WAL streaming
    // Setup replication slots
    // Configure Kafka for change events
    // Initialize cloud replicas with WORM
  }

  async monitorReplicationLag(): Promise<z.infer<typeof ReplicationStatusSchema>> {
    // Check pg_stat_replication view
    // Verify Kafka consumer lag
    // Validate WORM integrity
    // Generate alerts if thresholds exceeded
    
    const status = await this.checkReplicationHealth();
    return ReplicationStatusSchema.parse(status);
  }

  async validateDataIntegrity(): Promise<z.infer<typeof IntegrityReportSchema>> {
    // Compare checksums between primary and replicas
    // Verify ALCOA+ compliance on audit tables
    // Check WORM policy enforcement
    // Generate compliance report
    
    const report = await this.performIntegrityCheck();
    return IntegrityReportSchema.parse(report);
  }
}
```

**Kafka Integration for Replication Events с Zod validation**:

```typescript
// ✅ ПРАВИЛЬНО: Kafka события с Zod валидацией
import { Injectable } from "@nestjs/common";
import { KafkaConsumer } from "@nestjs/microservices";
import { DatabaseChangeEventSchema } from "@gacp/shared/schemas";
import { z } from "zod";

@Injectable()
@KafkaConsumer("database-changes")
export class ReplicationConsumer {
  async processChange(payload: unknown): Promise<void> {
    // ОБЯЗАТЕЛЬНАЯ Runtime validation
    const event = DatabaseChangeEventSchema.parse(payload);
    
    // Stream to cloud replicas
    await this.streamToCloud(event);
    
    // Validate against WORM policies
    await this.validateWORMCompliance(event);
    
    // Store in immudb for audit
    await this.storeInAuditLog(event);
    
    // Update replication metrics
    await this.updateMetrics(event);
  }

  private async streamToCloud(event: z.infer<typeof DatabaseChangeEventSchema>) {
    // Implementation
  }

  private async validateWORMCompliance(event: z.infer<typeof DatabaseChangeEventSchema>) {
    // WORM validation logic
  }

  private async storeInAuditLog(event: z.infer<typeof DatabaseChangeEventSchema>) {
    // Audit trail storage
  }

  private async updateMetrics(event: z.infer<typeof DatabaseChangeEventSchema>) {
    // Metrics update
  }
}
```

**Cloud WORM Storage Implementation**:

```sql
-- WORM (Write Once, Read Many) enforcement
CREATE OR REPLACE FUNCTION enforce_worm_policy()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'WORM violation: % operation not allowed on table %',
                        TG_OP, TG_TABLE_NAME;
    END IF;

    -- Log to audit trail
    INSERT INTO audit.worm_access_log (
        table_name, operation, user_id, timestamp, checksum
    ) VALUES (
        TG_TABLE_NAME, TG_OP, current_user, NOW(),
        md5(row_to_json(NEW)::text)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all audit tables on cloud replicas
CREATE TRIGGER worm_enforcement
    BEFORE INSERT OR UPDATE OR DELETE
    ON audit.audit_trail_events
    FOR EACH ROW
    EXECUTE FUNCTION enforce_worm_policy();
```

#### 3.2.4 PDF Report Generator Module

**Bounded Context**: Автоматическая генерация PDF-отчетов для GACP-соответствия

```typescript
// ✅ ПРАВИЛЬНО: Zod schemas для PDF Generator
import { z } from "zod";

// Zod Schemas
export const PDFReportTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  version: z.string().regex(/^\d+\.\d+\.\d+$/), // Semver
  templateType: z.enum([
    "daily-plant-report",
    "weekly-summary",
    "batch-lifecycle",
    "audit-trail-export",
  ]),
  reactComponent: z.string(), // React component definition
  fields: z.array(
    z.object({
      fieldName: z.string(),
      fieldType: z.enum(["string", "number", "date", "array", "object"]),
      required: z.boolean(),
      validation: z.string().optional(),
    })
  ),
  gacpCompliant: z.boolean(),
  author: z.string(),
  createdAt: z.string().datetime(),
  isActive: z.boolean(),
});

export const PDFDocumentSchema = z.object({
  id: z.string().uuid(),
  templateId: z.string().uuid(),
  fileName: z.string(),
  hash: z.string(), // SHA-256 hash for integrity
  digitalSignature: z.string(), // OpenSSL signature
  qrCode: z.string(), // QR code for verification
  edmDocumentId: z.string(), // Mayan EDMS document ID
  backupUrl: z.string().url(), // S3/MinIO URL
  metadata: z.object({
    generatedBy: z.string().uuid(),
    generatedFor: z.string().uuid().optional(),
    period: z.string().optional(),
    tags: z.array(z.string()),
  }),
  generatedAt: z.string().datetime(),
  generatedBy: z.string(),
});

export const ReportGenerationEventSchema = z.object({
  eventId: z.string().uuid(),
  triggerEvent: z.string().uuid(), // Reference to audit event
  templateType: z.string(),
  documentId: z.string().uuid(),
  status: z.enum(["pending", "generating", "signing", "storing", "completed", "failed"]),
  metrics: z.object({
    generationTime: z.number().positive(),
    fileSize: z.number().positive(),
    pageCount: z.number().int().positive(),
  }),
});

// Type inference
export type PDFReportTemplate = z.infer<typeof PDFReportTemplateSchema>;
export type PDFDocument = z.infer<typeof PDFDocumentSchema>;
export type ReportGenerationEvent = z.infer<typeof ReportGenerationEventSchema>;
```

**PDF Generation Service с Zod validation**:

```typescript
import { Injectable } from "@nestjs/common";
import { z } from "zod";
import {
  PDFDocumentSchema,
  PDFReportTemplateSchema,
} from "@gacp/shared/schemas";

const ReportMetadataSchema = z.object({
  label: z.string(),
  edmUrl: z.string().url(),
  generatedBy: z.string().uuid(),
  period: z.string().optional(),
  tags: z.array(z.string()),
});

@Injectable()
export class PDFGeneratorService {
  constructor(
    private readonly templateEngine: TemplateEngine,
    private readonly signatureService: DigitalSignatureService,
    private readonly edmService: MayanEDMSService,
    private readonly storageService: StorageService
  ) {}

  async generateReport(
    templateName: string,
    data: unknown,
    metadata: z.infer<typeof ReportMetadataSchema>
  ): Promise<z.infer<typeof PDFDocumentSchema>> {
    // Runtime validation metadata
    const validatedMetadata = ReportMetadataSchema.parse(metadata);

    // 1. Generate PDF using React-PDF renderer
    const { filePath, hash } = await this.templateEngine.render(
      templateName,
      data
    );

    // 2. Create digital signature
    const signature = await this.signatureService.signWithOpenSSL(filePath);

    // 3. Generate QR code for verification
    const qrCode = await this.generateVerificationQR(hash, validatedMetadata.edmUrl);

    // 4. Store in Mayan EDMS
    const edmDocument = await this.edmService.upload(filePath, {
      label: validatedMetadata.label,
      hash,
      signature,
      template: templateName,
    });

    // 5. Backup to S3/MinIO
    const backupUrl = await this.storageService.upload(filePath);

    const document = {
      id: crypto.randomUUID(),
      templateId: templateName,
      fileName: path.basename(filePath),
      hash,
      digitalSignature: signature,
      qrCode,
      edmDocumentId: edmDocument.id,
      backupUrl,
      metadata: {
        generatedBy: validatedMetadata.generatedBy,
        period: validatedMetadata.period,
        tags: validatedMetadata.tags,
      },
      generatedAt: new Date().toISOString(),
      generatedBy: "pdf-service",
    };

    // Runtime validation результата
    return PDFDocumentSchema.parse(document);
  }

  private async generateVerificationQR(
    hash: string,
    edmUrl: string
  ): Promise<string> {
    const verificationUrl = `${edmUrl}/verify?hash=${hash}`;
    return await QRCode.toDataURL(verificationUrl);
  }
}
```

**Template Engine с React Components**:

```typescript
// libs/pdf-generator/templates/daily-plant-report.tsx
import React from "react";
import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import { Header, Table, Footer, QRCode } from "../components";

interface DailyPlantReportProps {
  period: string;
  userName: string;
  plantEvents: PlantEvent[];
  edmUrl: string;
  hash: string;
}

export const DailyPlantReport: React.FC<DailyPlantReportProps> = ({
  period,
  userName,
  plantEvents,
  edmUrl,
  hash,
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Header
        title="Daily Plant Activity Report"
        period={period}
        userName={userName}
      />

      <Table
        columns={["Plant ID", "Activity", "Timestamp", "Status"]}
        data={plantEvents.map((e) => [
          e.plantId,
          e.activity,
          e.timestamp,
          e.status,
        ])}
      />

      <Footer hash={hash} generatedAt={new Date()} />

      <QRCode value={`${edmUrl}/verify?hash=${hash}`} style={styles.qr} />
    </Page>
  </Document>
);
```

**Kafka Integration для автоматической генерации**:

```typescript
@KafkaConsumer("audit.events")
export class ReportGenerationConsumer {
  constructor(private readonly pdfService: PDFGeneratorService) {}

  @MessagePattern("daily_plant_activity")
  async handleDailyPlantActivity(event: AuditEvent): Promise<void> {
    await this.pdfService.generateReport(
      "daily-plant-report",
      {
        period: event.payload.period,
        userName: event.payload.userName,
        plantEvents: event.payload.events,
      },
      {
        label: `Daily Report ${event.payload.period}`,
        edmUrl: process.env.MAYAN_BASE_URL,
      }
    );
  }

  @MessagePattern("batch_completed")
  async handleBatchCompleted(event: AuditEvent): Promise<void> {
    await this.pdfService.generateReport("batch-lifecycle", event.payload, {
      label: `Batch Lifecycle ${event.payload.batchId}`,
      edmUrl: process.env.MAYAN_BASE_URL,
    });
  }
}

@KafkaProducer()
export class ReportEventPublisher {
  async publishReportGenerated(document: PDFDocument): Promise<void> {
    await this.emit("pdf.generated", {
      documentId: document.id,
      hash: document.hash,
      edmUrl: document.edmDocumentId,
      template: document.templateId,
      generatedAt: document.generatedAt,
    });
  }
}
```

**Digital Signature через OpenSSL**:

```typescript
@Injectable()
export class DigitalSignatureService {
  private readonly privateKeyPath = process.env.PRIVATE_KEY_PATH;
  private readonly publicKeyPath = process.env.PUBLIC_KEY_PATH;

  async signWithOpenSSL(filePath: string): Promise<string> {
    const sigPath = `${filePath}.sig`;

    await execFileAsync("openssl", [
      "dgst",
      "-sha256",
      "-sign",
      this.privateKeyPath,
      "-out",
      sigPath,
      filePath,
    ]);

    // Return base64 encoded signature
    const signature = await fs.readFile(sigPath);
    return signature.toString("base64");
  }

  async verifySignature(filePath: string, signature: string): Promise<boolean> {
    try {
      const sigPath = `${filePath}.sig`;
      await fs.writeFile(sigPath, Buffer.from(signature, "base64"));

      await execFileAsync("openssl", [
        "dgst",
        "-sha256",
        "-verify",
        this.publicKeyPath,
        "-signature",
        sigPath,
        filePath,
      ]);

      return true;
    } catch {
      return false;
    }
  }
}
```

**GACP Compliance Integration**:

```typescript
interface GACPComplianceMetadata {
  documentType: "audit-report" | "batch-record" | "calibration-cert";
  gacpVersion: string;
  complianceLevel: "basic" | "enhanced" | "full";
  auditTrailHash: string;
  witnessSignatures: WitnessSignature[];
  regulatoryReferences: string[];
  retentionPeriod: number; // years
}

@Injectable()
export class GACPComplianceService {
  async validateCompliance(document: PDFDocument): Promise<ComplianceReport> {
    return {
      isCompliant: true,
      checks: {
        digitalSignature: await this.validateSignature(document),
        hashIntegrity: await this.validateHash(document),
        auditTrail: await this.validateAuditTrail(document),
        retention: await this.validateRetention(document),
      },
      validatedAt: new Date(),
      validatedBy: "gacp-compliance-service",
    };
  }
}
```

---

## 🔗 **4. API АРХИТЕКТУРА**

### 4.1 API Gateway Pattern

```typescript
// API Gateway Configuration
@Module({
  imports: [
    PlantModule,
    FinancialModule,
    WorkforceModule,
    IoTModule,
    DocumentModule,
    AuthModule,
  ],
})
export class ApiGatewayModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthenticationMiddleware)
      .forRoutes("*")
      .apply(RateLimitMiddleware)
      .forRoutes("*")
      .apply(LoggingMiddleware)
      .forRoutes("*");
  }
}
```

### 4.2 Zod-First API Development

**Все API контракты определены через Zod схемы**:

```typescript
// 🎯 НЕТ OpenAPI YAML! Всё генерируется из Zod схем
// См. CONTRACT_SPECIFICATIONS.md секция "4. HTTP API CONTRACTS"

import {
  PlantsApiContract,
  SensorsApiContract,
  UserApiContract
} from '@gacp/shared/api-contracts';

// Автоматическая генерация OpenAPI из Zod
import { generateOpenAPISpec } from '@gacp/tools/openapi-generator';

// Runtime validation для всех endpoints
import { validateSchema } from '@gacp/shared/validation';

@Controller('plants')
export class PlantsController {
  @Get()
  @UseInterceptors(validateSchema(PlantsApiContract.listPlants.request.query, 'query'))
  async getPlants(@Query() query: any) {
    // query автоматически валидирован через Zod
    const validatedQuery = PlantsApiContract.listPlants.request.query.parse(query);

    const plants = await this.plantsService.findMany(validatedQuery);

    // Response тоже валидируется через Zod
    return PlantsApiContract.listPlants.responses[200].parse({
      success: true,
      data: { items: plants, pagination: {...} },
      timestamp: new Date(),
      request_id: crypto.randomUUID(),
    });
  }
}
```

### 4.3 Type-Safe Client с полной Zod интеграцией

```typescript
// Клиент автоматически типизирован из Zod схем
import { createApiClient } from "@gacp/shared/api-client";
import { PlantsApiContract } from "@gacp/shared/api-contracts";

const apiClient = createApiClient({
  baseUrl: process.env.API_URL,
  contracts: { plants: PlantsApiContract },
});

// Полная type safety + runtime validation
const response = await apiClient.plants.listPlants({
  query: {
    stage: "FLOWERING", // Type-safe enum
    page: 1,
    limit: 20,
  },
});

// response.data автоматически типизирован через z.infer
if (response.success) {
  response.data.items.forEach((plant) => {
    // plant типизирован как z.infer<typeof PlantSchema>
    console.log(plant.plant_tag, plant.current_stage);
  });
}
```

---

## 🗄️ **5. DATABASE АРХИТЕКТУРА**

### 5.1 Multi-Database Strategy

#### 5.1.1 PostgreSQL (Primary Database)

**Schema Organization**:

```sql
-- Core Business Schemas
CREATE SCHEMA plant_lifecycle;
CREATE SCHEMA financial;
CREATE SCHEMA workforce;
CREATE SCHEMA spatial;
CREATE SCHEMA procurement;

-- Support Schemas
CREATE SCHEMA audit;
CREATE SCHEMA configuration;
CREATE SCHEMA notifications;

-- Plant Lifecycle Schema
CREATE TABLE plant_lifecycle.facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address JSONB,
    timezone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE plant_lifecycle.strains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    genetics JSONB NOT NULL,
    characteristics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE plant_lifecycle.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES plant_lifecycle.facilities(id),
    strain_id UUID NOT NULL REFERENCES plant_lifecycle.strains(id),
    batch_number VARCHAR(50) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    target_harvest_date DATE,
    actual_harvest_date DATE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'harvested', 'disposed')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE plant_lifecycle.plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES plant_lifecycle.batches(id),
    plant_tag VARCHAR(50) NOT NULL UNIQUE,
    mother_plant_id UUID REFERENCES plant_lifecycle.plants(id),
    stage VARCHAR(20) NOT NULL CHECK (stage IN ('seedling', 'vegetative', 'flowering', 'harvest', 'disposed')),
    location_id UUID REFERENCES spatial.locations(id),
    health_status VARCHAR(20) DEFAULT 'healthy',
    last_watered TIMESTAMP WITH TIME ZONE,
    last_fed TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Schema
CREATE TABLE financial.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    parent_id UUID REFERENCES financial.accounts(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE financial.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number VARCHAR(50) NOT NULL UNIQUE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    reference VARCHAR(255),
    total_debit DECIMAL(15,2) NOT NULL,
    total_credit DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE financial.journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES financial.journal_entries(id),
    account_id UUID NOT NULL REFERENCES financial.accounts(id),
    description TEXT,
    debit DECIMAL(15,2) DEFAULT 0,
    credit DECIMAL(15,2) DEFAULT 0,
    line_number INTEGER NOT NULL,
    CONSTRAINT check_debit_credit CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
);

CREATE TABLE financial.biological_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID NOT NULL REFERENCES plant_lifecycle.plants(id),
    acquisition_cost DECIMAL(15,2) NOT NULL,
    current_value DECIMAL(15,2) NOT NULL,
    valuation_date DATE NOT NULL,
    valuation_method VARCHAR(50) NOT NULL,
    accumulated_costs DECIMAL(15,2) DEFAULT 0,
    estimated_harvest_value DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_plants_batch_id ON plant_lifecycle.plants(batch_id);
CREATE INDEX idx_plants_stage ON plant_lifecycle.plants(stage);
CREATE INDEX idx_plants_location ON plant_lifecycle.plants(location_id);
CREATE INDEX idx_journal_lines_account ON financial.journal_lines(account_id);
CREATE INDEX idx_journal_lines_entry ON financial.journal_lines(journal_entry_id);
```

#### 5.1.2 MongoDB (Document Store)

**Collections Structure**:

```javascript
// Training Materials Collection
db.training_materials.insertOne({
  _id: ObjectId(),
  title: "Plant Care SOP",
  type: "sop",
  category: "cultivation",
  content: {
    sections: [
      {
        title: "Daily Care Routine",
        steps: [
          "Check soil moisture",
          "Monitor temperature",
          "Inspect for pests",
        ],
      },
    ],
  },
  metadata: {
    version: "1.2",
    approved_by: "supervisor_id",
    approved_at: ISODate(),
    tags: ["plant-care", "daily-routine"],
  },
  created_at: ISODate(),
  updated_at: ISODate(),
});

// Configuration Collection
db.system_configuration.insertOne({
  _id: "plant_stages_config",
  stages: {
    seedling: {
      duration_days: 14,
      temperature_range: { min: 18, max: 24 },
      humidity_range: { min: 65, max: 80 },
      light_schedule: "18/6",
    },
    vegetative: {
      duration_days: 30,
      temperature_range: { min: 20, max: 26 },
      humidity_range: { min: 60, max: 70 },
      light_schedule: "18/6",
    },
  },
  updated_at: ISODate(),
});

// Analytics Data Collection
db.business_metrics.insertOne({
  _id: ObjectId(),
  date: ISODate("2025-09-14"),
  facility_id: "facility_uuid",
  metrics: {
    active_plants: 1250,
    harvest_yield_kg: 45.2,
    revenue_daily: 15000.5,
    power_consumption_kwh: 340.5,
    water_usage_liters: 1200,
  },
  calculated_at: ISODate(),
});
```

#### 5.1.3 VictoriaMetrics (Time Series)

**Metrics Structure**:

```text
# Sensor Metrics
sensor_temperature{facility="facility_1",zone="veg_room_1",sensor_id="temp_001"} 23.5
sensor_humidity{facility="facility_1",zone="veg_room_1",sensor_id="hum_001"} 68.2
sensor_co2{facility="facility_1",zone="flower_room_2",sensor_id="co2_003"} 1200

# Business Metrics
plants_count{facility="facility_1",stage="vegetative"} 450
plants_count{facility="facility_1",stage="flowering"} 300
batch_progress{batch_id="batch_123",stage="flowering"} 0.75

# System Metrics
api_requests_total{method="GET",endpoint="/plants",status="200"} 1540
api_response_time{method="POST",endpoint="/plants",quantile="0.95"} 0.150
database_connections{pool="main",state="active"} 15
```

#### 5.1.4 ImmuDB (Audit Trail)

**Audit Schema**:

```sql
-- ImmuDB Schema for Audit Trail
CREATE TABLE audit_events (
    id INTEGER AUTO_INCREMENT,
    event_id VARCHAR[64] NOT NULL,
    entity_type VARCHAR[50] NOT NULL,
    entity_id VARCHAR[64] NOT NULL,
    action VARCHAR[20] NOT NULL,
    user_id VARCHAR[64] NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR[45],
    user_agent VARCHAR[255],
    PRIMARY KEY (id)
);

CREATE INDEX ON audit_events (entity_type, entity_id);
CREATE INDEX ON audit_events (user_id);
CREATE INDEX ON audit_events (timestamp);

-- Example Audit Record
INSERT INTO audit_events (
    event_id, entity_type, entity_id, action, user_id, timestamp,
    old_values, new_values, ip_address
) VALUES (
    'evt_123456', 'plant', 'plant_uuid', 'UPDATE', 'user_uuid', NOW(),
    '{"stage": "vegetative", "location": "zone_1"}',
    '{"stage": "flowering", "location": "zone_2"}',
    '192.168.1.100'
);
```

### 5.2 Data Access Patterns

#### 5.2.1 Repository Pattern

```typescript
// Generic Repository
interface Repository<T, ID> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: ID): Promise<void>;
}

// Plant Repository Implementation
@Injectable()
export class PlantRepository implements Repository<Plant, PlantId> {
  constructor(
    @InjectRepository(PlantEntity)
    private readonly plantRepo: Repository<PlantEntity>
  ) {}

  async findById(id: PlantId): Promise<Plant | null> {
    const entity = await this.plantRepo.findOne({
      where: { id: id.value },
      relations: ["batch", "genetics", "location"],
    });

    return entity ? this.toDomain(entity) : null;
  }

  async findByBatch(batchId: BatchId): Promise<Plant[]> {
    const entities = await this.plantRepo.find({
      where: { batchId: batchId.value },
      relations: ["genetics", "location"],
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  private toDomain(entity: PlantEntity): Plant {
    return new Plant({
      id: new PlantId(entity.id),
      batchId: new BatchId(entity.batchId),
      stage: entity.stage,
      genetics: entity.genetics,
      location: entity.location,
      metadata: entity.metadata,
    });
  }
}
```

---

## 🔄 **6. EVENT-DRIVEN АРХИТЕКТУРА**

### 6.1 Domain Events

```typescript
// Base Domain Event
abstract class DomainEvent {
  public readonly eventId: string;
  public readonly timestamp: Date;
  public readonly version: number;

  constructor() {
    this.eventId = uuid();
    this.timestamp = new Date();
    this.version = 1;
  }
}

// Plant Domain Events
export class PlantStageTransitionedEvent extends DomainEvent {
  constructor(
    public readonly plantId: PlantId,
    public readonly fromStage: PlantStage,
    public readonly toStage: PlantStage,
    public readonly userId: UserId,
    public readonly reason?: string
  ) {
    super();
  }
}

export class PlantHarvestedEvent extends DomainEvent {
  constructor(
    public readonly plantId: PlantId,
    public readonly batchId: BatchId,
    public readonly harvestWeight: Weight,
    public readonly quality: QualityGrade,
    public readonly userId: UserId
  ) {
    super();
  }
}
```

### 6.2 Event Bus Implementation

```typescript
// Event Bus using Kafka
@Injectable()
export class EventBus {
  constructor(private readonly kafkaClient: KafkaService) {}

  async publish(event: DomainEvent): Promise<void> {
    const topic = this.getTopicForEvent(event);
    const message = {
      key: event.eventId,
      value: JSON.stringify({
        eventType: event.constructor.name,
        data: event,
        metadata: {
          version: event.version,
          timestamp: event.timestamp,
        },
      }),
    };

    await this.kafkaClient.emit(topic, message);
  }

  private getTopicForEvent(event: DomainEvent): string {
    const eventName = event.constructor.name;
    return `gacp-erp.${eventName.toLowerCase()}`;
  }
}

// Event Handlers
@EventHandler(PlantStageTransitionedEvent)
export class PlantStageTransitionedHandler {
  constructor(
    private readonly biologicalAssetService: BiologicalAssetService,
    private readonly auditService: AuditService
  ) {}

  async handle(event: PlantStageTransitionedEvent): Promise<void> {
    // Update biological asset valuation
    await this.biologicalAssetService.updateValuation(
      event.plantId,
      event.toStage
    );

    // Create audit record
    await this.auditService.recordEvent({
      entityType: "plant",
      entityId: event.plantId.value,
      action: "stage_transition",
      details: {
        from: event.fromStage,
        to: event.toStage,
        reason: event.reason,
      },
      userId: event.userId.value,
      timestamp: event.timestamp,
    });
  }
}
```

### 6.3 Saga Pattern для Distributed Transactions

```typescript
// Harvest Process Saga
@Saga()
export class HarvestProcessSaga {
  @SagaStart()
  @EventHandler(PlantHarvestedEvent)
  async handlePlantHarvested(event: PlantHarvestedEvent): Promise<void> {
    // Step 1: Update plant status
    await this.plantService.updateStatus(event.plantId, PlantStatus.HARVESTED);

    // Step 2: Create inventory record
    const inventoryCommand = new CreateInventoryItemCommand({
      plantId: event.plantId,
      weight: event.harvestWeight,
      quality: event.quality,
    });
    await this.commandBus.execute(inventoryCommand);

    // Step 3: Calculate biological asset value
    const valuationCommand = new CalculateBiologicalAssetValueCommand({
      plantId: event.plantId,
      harvestWeight: event.harvestWeight,
      harvestDate: event.timestamp,
    });
    await this.commandBus.execute(valuationCommand);
  }

  @EventHandler(InventoryItemCreatedEvent)
  async handleInventoryItemCreated(
    event: InventoryItemCreatedEvent
  ): Promise<void> {
    // Step 4: Create journal entries for harvest
    const journalCommand = new CreateHarvestJournalEntryCommand({
      plantId: event.plantId,
      inventoryValue: event.value,
      harvestDate: event.timestamp,
    });
    await this.commandBus.execute(journalCommand);
  }

  @EventHandler(HarvestJournalEntryCreatedEvent)
  async handleJournalEntryCreated(
    event: HarvestJournalEntryCreatedEvent
  ): Promise<void> {
    // Step 5: Generate harvest report
    const reportCommand = new GenerateHarvestReportCommand({
      plantId: event.plantId,
      journalEntryId: event.journalEntryId,
    });
    await this.commandBus.execute(reportCommand);
  }
}
```

---

## 🔐 **7. БЕЗОПАСНОСТЬ И АУТЕНТИФИКАЦИЯ**

### 7.1 Authentication Flow

```typescript
// JWT Token Structure
interface JwtPayload {
  sub: string; // User ID
  email: string;
  roles: string[];
  permissions: string[];
  facilities: string[]; // Facilities user has access to
  iat: number;
  exp: number;
}

// Keycloak Integration
@Injectable()
export class AuthService {
  constructor(private readonly keycloakService: KeycloakService) {}

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const decoded = await this.keycloakService.verifyToken(token);
      return {
        sub: decoded.sub,
        email: decoded.email,
        roles: decoded.realm_access?.roles || [],
        permissions: decoded.resource_access?.["gacp-erp"]?.roles || [],
        facilities: decoded.facilities || [],
        iat: decoded.iat,
        exp: decoded.exp,
      };
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }
}

// Role-Based Access Control
@Injectable()
export class AuthorizationService {
  checkPermission(user: JwtPayload, resource: string, action: string): boolean {
    const requiredPermission = `${resource}:${action}`;
    return (
      user.permissions.includes(requiredPermission) ||
      user.roles.includes("admin")
    );
  }

  checkFacilityAccess(user: JwtPayload, facilityId: string): boolean {
    return user.facilities.includes(facilityId) || user.roles.includes("admin");
  }
}

// Authorization Guards
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthorizationService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const permissions = this.reflector.get<string[]>(
      "permissions",
      context.getHandler()
    );
    if (!permissions) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return permissions.some((permission) => {
      const [resource, action] = permission.split(":");
      return this.authService.checkPermission(user, resource, action);
    });
  }
}

// Usage Example
@Controller("plants")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PlantsController {
  @Get()
  @Permissions("plants:read")
  async getPlants(@User() user: JwtPayload) {
    // Only users with plants:read permission can access
  }

  @Post()
  @Permissions("plants:write")
  async createPlant(@User() user: JwtPayload, @Body() dto: CreatePlantDto) {
    // Only users with plants:write permission can access
  }
}
```

### 7.2 Auditor Roles

Аудиторы - это обычные пользователи с расширенными правами на чтение:

```typescript
// Аудиторские роли в системе RBAC
const AUDITOR_ROLES = {
  EXTERNAL_AUDITOR: "external_auditor", // Регулятивные органы
  INTERNAL_AUDITOR: "internal_auditor", // Внутренний QA
  THIRD_PARTY_AUDITOR: "third_party_auditor", // Сертификационные органы
};

// Права аудиторов - только чтение + просмотр audit trail
const AUDITOR_PERMISSIONS = [
  "plants:read",
  "facilities:read",
  "documents:read",
  "audit_trail:read",
  "compliance:read",
  "reports:generate", // Могут генерировать отчеты для экспорта
];

// Ограничения для аудиторов
const AUDITOR_RESTRICTIONS = {
  readOnly: true, // Никаких прав на запись
  temporaryAccess: true, // Временные учетные записи
  auditActivity: true, // Вся активность логируется
  watermarkedExports: true, // Экспорты с водяными знаками
};
```

---

## 📚 **СВЯЗАННАЯ ДОКУМЕНТАЦИЯ**

### Infrastructure & Operations

- **[Data Replication Architecture](./infrastructure/DATA_REPLICATION_ARCHITECTURE.md)** - Критическая документация по репликации данных для GACP compliance
- **[Infrastructure Overview](./infrastructure/README.md)** - Обзор инфраструктурной документации

### API & Contract Specifications

- **[Contract Specifications](./CONTRACT_SPECIFICATIONS.md)** - **🎯 ГЛАВНЫЙ ДОКУМЕНТ** по всем Zod схемам, API контрактам, Kafka событиям и интеграциям
- **[PDF Report Generator](./services/pdf-report-generator.md)** - Спецификация сервиса генерации PDF отчетов с цифровыми подписями

### Validation Documentation

- **[Design Specification (DS)](./validation/DS.md)** - Техническая спецификация системы
- **[Functional Specification (FS)](./validation/FS.md)** - Функциональные требования
- **[Validation Master Plan](./validation/VMP.md)** - План валидации системы

### Standard Operating Procedures

- **[Database Replication SOP](./sop/SOP_DatabaseReplication.md)** - Операционные процедуры репликации
- **[Data Backup SOP](./sop/SOP_DataBackup.md)** - Процедуры резервного копирования

---

## 🎯 **ЗАКЛЮЧЕНИЕ**

Этот документ представляет собой comprehensive архитектурную основу для GACP-ERP системы. Он включает все ключевые компоненты: модульную структуру, API спецификации, схемы баз данных, event-driven patterns, и интеграции с Mayan-EDMS.

**Следующие шаги**:

1. Использовать эту архитектуру как основу для implementation
2. Детализировать оставшиеся модули (Workforce, Spatial Planning, etc.)
3. Создать Development Roadmap на основе модульных зависимостей
4. Установить Coding Standards и Best Practices

**Ключевые преимущества архитектуры**:

- **Modularity**: Четкое разделение ответственности
- **Scalability**: Microservices + Event-driven design
- **Maintainability**: Domain-driven design + Type safety
- **Compliance**: Audit trail + Event sourcing
- **Integration**: Mayan-EDMS + IoT + 3D visualization
