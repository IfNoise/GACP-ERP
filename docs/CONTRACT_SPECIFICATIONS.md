---
title: "Contract Specifications Document"
version: "1.0"
status: "active"
last_updated: "2025-09-14"
type: "specifications"
# AI-Assisted Documentation Metadata (per AI_Assisted_Documentation_Policy.md)
ai_generated: true
author_verified: false
qa_approved: false
ai_status: draft
---

# 📋 Contract Specifications

**Документ**: Contract Specifications Document  
**Версия**: 1.0  
**Дата**: 14 сентября 2025  
**Статус**: CRITICAL - Основа для type safety

---

## 🎯 **1. ВВЕДЕНИЕ**

### 1.1 Zod-First Architecture

Все контракты в GACP-ERP системе определяются через **Zod схемы** для обеспечения:

- **Runtime validation** всех данных
- **Type inference** без дублирования типов
- **OpenAPI generation** из схем
- **Единый источник истины** для frontend/backend
- **Автоматическое тестирование** контрактов

### 1.2 Принципы контрактов

```typescript
// ❌ НЕ ИСПОЛЬЗУЕМ: TypeScript интерфейсы
interface User {
  id: string;
  email: string;
}

// ✅ ИСПОЛЬЗУЕМ: Zod схемы с runtime validation
import { z } from "zod";

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
});

type User = z.infer<typeof UserSchema>; // Автоматический type inference
```

### 1.3 Структура контрактов

```text
libs/
├── shared/
│   ├── schemas/
│   │   ├── plants/           # Plant domain schemas
│   │   ├── iot/             # IoT sensors schemas
│   │   ├── workforce/       # Workforce schemas
│   │   ├── quality/         # Quality control schemas
│   │   ├── logistics/       # Logistics schemas
│   │   ├── compliance/      # Compliance schemas
│   │   ├── auth/            # Authentication schemas
│   │   └── common/          # Shared base schemas
│   ├── events/              # Kafka event schemas
│   └── api-contracts/       # HTTP API contracts
```

---

## 🌱 **2. CORE DOMAIN SCHEMAS**

### 2.1 Common Base Schemas

```typescript
// libs/shared/schemas/common/base.schema.ts
import { z } from "zod";

// Base entity schema
export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
  created_by: z.string().uuid(),
  updated_by: z.string().uuid().optional(),
});

// Audit trail schema
export const AuditTrailSchema = z.object({
  entity_id: z.string().uuid(),
  entity_type: z.string(),
  action: z.enum(["CREATE", "UPDATE", "DELETE", "VIEW"]),
  old_values: z.record(z.unknown()).optional(),
  new_values: z.record(z.unknown()).optional(),
  performed_at: z.coerce.date(),
  performed_by: z.string().uuid(),
  session_id: z.string().uuid(),
  ip_address: z.string().ip(),
  user_agent: z.string(),
  compliance_hash: z.string(),
});

// Location schema
export const LocationSchema = z.object({
  facility_id: z.string().uuid(),
  room_id: z.string().uuid(),
  area_id: z.string().uuid(),
  zone_id: z.string().uuid().optional(),
  coordinates: z
    .object({
      x: z.number().min(0),
      y: z.number().min(0),
      z: z.number().min(0).optional(),
    })
    .optional(),
});

// Measurement schema
export const MeasurementSchema = z.object({
  value: z.number(),
  unit: z.string(),
  timestamp: z.coerce.date(),
  sensor_id: z.string().uuid().optional(),
  precision: z.number().positive().optional(),
  confidence_level: z.number().min(0).max(1).optional(),
});

// File/Document schema
export const DocumentSchema = z.object({
  filename: z.string(),
  content_type: z.string(),
  size: z.number().positive(),
  checksum: z.string(),
  storage_path: z.string(),
  mayan_document_id: z.number().positive().optional(),
  signed: z.boolean().default(false),
  signature_hash: z.string().optional(),
});
```

### 2.2 Plants Domain Schemas

```typescript
// libs/shared/schemas/plants/plant.schema.ts
import { z } from "zod";
import {
  BaseEntitySchema,
  LocationSchema,
  DocumentSchema,
} from "../common/base.schema";

// Plant genetics schema
export const PlantGeneticsSchema = z.object({
  strain_name: z.string().min(1).max(100),
  genetics_type: z.enum(["INDICA", "SATIVA", "HYBRID"]),
  thc_percentage: z.number().min(0).max(100).optional(),
  cbd_percentage: z.number().min(0).max(100).optional(),
  terpene_profile: z.record(z.number().min(0)).optional(),
  breeder: z.string().optional(),
  seed_bank: z.string().optional(),
});

// Plant lifecycle stages
export const PlantStageSchema = z.enum([
  "SEED",
  "GERMINATION",
  "SEEDLING",
  "VEGETATIVE",
  "FLOWERING",
  "HARVEST",
  "DRYING",
  "CURING",
  "TESTING",
  "PACKAGED",
  "DESTROYED",
]);

// Plant schema
export const PlantSchema = BaseEntitySchema.extend({
  plant_tag: z.string().regex(/^P\d{8}$/), // P12345678 format
  batch_id: z.string().uuid(),
  genetics: PlantGeneticsSchema,
  current_stage: PlantStageSchema,
  location: LocationSchema,
  planted_date: z.coerce.date(),
  expected_harvest_date: z.coerce.date().optional(),
  actual_harvest_date: z.coerce.date().optional(),
  mother_plant_id: z.string().uuid().optional(),
  clone_generation: z.number().int().min(0).default(0),
  health_status: z.enum([
    "HEALTHY",
    "SICK",
    "PEST_DAMAGE",
    "NUTRIENT_DEFICIENCY",
    "DEAD",
  ]),
  photos: z.array(DocumentSchema).default([]),
  notes: z.string().optional(),
  destroyed: z.boolean().default(false),
  destruction_reason: z.string().optional(),
  destruction_date: z.coerce.date().optional(),
});

// Plant measurement schema
export const PlantMeasurementSchema = BaseEntitySchema.extend({
  plant_id: z.string().uuid(),
  measurement_type: z.enum([
    "HEIGHT",
    "WIDTH",
    "STEM_DIAMETER",
    "LEAF_COUNT",
    "BRANCH_COUNT",
    "BUD_WEIGHT",
    "TOTAL_WEIGHT",
  ]),
  value: z.number().positive(),
  unit: z.string(),
  measured_at: z.coerce.date(),
  measured_by: z.string().uuid(),
  notes: z.string().optional(),
});

// Batch schema
export const BatchSchema = BaseEntitySchema.extend({
  batch_number: z.string().regex(/^B\d{8}$/), // B12345678 format
  genetics: PlantGeneticsSchema,
  plant_count: z.number().int().positive(),
  planted_date: z.coerce.date(),
  expected_harvest_date: z.coerce.date(),
  actual_harvest_date: z.coerce.date().optional(),
  location: LocationSchema,
  status: z.enum(["ACTIVE", "HARVESTED", "DESTROYED"]),
  notes: z.string().optional(),
});

// Type inference for TypeScript
export type Plant = z.infer<typeof PlantSchema>;
export type PlantMeasurement = z.infer<typeof PlantMeasurementSchema>;
export type Batch = z.infer<typeof BatchSchema>;
export type PlantStage = z.infer<typeof PlantStageSchema>;
```

### 2.3 IoT Sensors Schemas

```typescript
// libs/shared/schemas/iot/sensor.schema.ts
import { z } from "zod";
import {
  BaseEntitySchema,
  LocationSchema,
  MeasurementSchema,
} from "../common/base.schema";

// Sensor types
export const SensorTypeSchema = z.enum([
  "TEMPERATURE",
  "HUMIDITY",
  "CO2",
  "PH",
  "EC", // Electrical Conductivity
  "LIGHT_INTENSITY",
  "SOIL_MOISTURE",
  "WATER_LEVEL",
  "PRESSURE",
  "MOTION",
  "DOOR_CONTACT",
  "CAMERA",
  "SCALE",
]);

// Sensor schema
export const SensorSchema = BaseEntitySchema.extend({
  sensor_tag: z.string().regex(/^S\d{8}$/), // S12345678 format
  sensor_type: SensorTypeSchema,
  manufacturer: z.string(),
  model: z.string(),
  serial_number: z.string(),
  firmware_version: z.string().optional(),
  location: LocationSchema,
  calibration_date: z.coerce.date(),
  next_calibration_date: z.coerce.date(),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE", "ERROR"]),
  measurement_interval: z.number().positive(), // seconds
  accuracy: z.number().positive().optional(),
  measurement_range: z.object({
    min: z.number(),
    max: z.number(),
    unit: z.string(),
  }),
  alert_thresholds: z
    .object({
      min_warning: z.number().optional(),
      max_warning: z.number().optional(),
      min_critical: z.number().optional(),
      max_critical: z.number().optional(),
    })
    .optional(),
});

// Sensor reading schema
export const SensorReadingSchema = BaseEntitySchema.extend({
  sensor_id: z.string().uuid(),
  measurement: MeasurementSchema,
  quality_score: z.number().min(0).max(1).default(1),
  alert_level: z.enum(["NORMAL", "WARNING", "CRITICAL"]).default("NORMAL"),
  processed: z.boolean().default(false),
  anomaly_detected: z.boolean().default(false),
});

// Sensor calibration schema
export const SensorCalibrationSchema = BaseEntitySchema.extend({
  sensor_id: z.string().uuid(),
  calibration_type: z.enum([
    "ROUTINE",
    "DRIFT_CORRECTION",
    "REPAIR",
    "INSTALLATION",
  ]),
  reference_value: z.number(),
  measured_value: z.number(),
  adjustment_applied: z.number(),
  calibration_date: z.coerce.date(),
  performed_by: z.string().uuid(),
  certificate_number: z.string().optional(),
  notes: z.string().optional(),
});

export type Sensor = z.infer<typeof SensorSchema>;
export type SensorReading = z.infer<typeof SensorReadingSchema>;
export type SensorCalibration = z.infer<typeof SensorCalibrationSchema>;
export type SensorType = z.infer<typeof SensorTypeSchema>;
```

### 2.4 Workforce Schemas

```typescript
// libs/shared/schemas/workforce/user.schema.ts
import { z } from "zod";
import { BaseEntitySchema } from "../common/base.schema";

// User roles
export const UserRoleSchema = z.enum([
  "ADMIN",
  "QA_MANAGER",
  "CULTIVATION_MANAGER",
  "GROWER",
  "HARVESTER",
  "PROCESSOR",
  "PACKAGER",
  "LOGISTICS_COORDINATOR",
  "COMPLIANCE_OFFICER",
  "VIEWER",
]);

// User schema
export const UserSchema = BaseEntitySchema.extend({
  employee_id: z.string().regex(/^E\d{6}$/), // E123456 format
  email: z.string().email(),
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  role: UserRoleSchema,
  department: z.string(),
  hire_date: z.coerce.date(),
  termination_date: z.coerce.date().optional(),
  active: z.boolean().default(true),
  two_factor_enabled: z.boolean().default(false),
  last_login: z.coerce.date().optional(),
  password_changed_at: z.coerce.date(),
  training_completed: z.array(z.string().uuid()).default([]),
  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string(),
        issued_date: z.coerce.date(),
        expiry_date: z.coerce.date().optional(),
        certificate_number: z.string(),
      })
    )
    .default([]),
});

// Training record schema
export const TrainingRecordSchema = BaseEntitySchema.extend({
  user_id: z.string().uuid(),
  training_module: z.string(),
  completion_date: z.coerce.date(),
  score: z.number().min(0).max(100).optional(),
  certificate_issued: z.boolean().default(false),
  certificate_number: z.string().optional(),
  valid_until: z.coerce.date().optional(),
  instructor: z.string().uuid().optional(),
});

// Work session schema
export const WorkSessionSchema = BaseEntitySchema.extend({
  user_id: z.string().uuid(),
  clock_in: z.coerce.date(),
  clock_out: z.coerce.date().optional(),
  location: z.string(),
  activities: z
    .array(
      z.object({
        activity_type: z.string(),
        start_time: z.coerce.date(),
        end_time: z.coerce.date().optional(),
        notes: z.string().optional(),
      })
    )
    .default([]),
  total_hours: z.number().min(0).optional(),
});

export type User = z.infer<typeof UserSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type TrainingRecord = z.infer<typeof TrainingRecordSchema>;
export type WorkSession = z.infer<typeof WorkSessionSchema>;
```

---

## 📡 **3. KAFKA EVENT SCHEMAS**

### 3.1 Base Event Schema

```typescript
// libs/shared/events/base-event.schema.ts
import { z } from "zod";

// Base event schema for all Kafka events
export const BaseEventSchema = z.object({
  event_id: z.string().uuid(),
  event_type: z.string(),
  event_version: z.string().default("1.0"),
  aggregate_id: z.string().uuid(),
  aggregate_type: z.string(),
  sequence_number: z.number().int().positive(),
  occurred_at: z.coerce.date(),
  correlation_id: z.string().uuid().optional(),
  causation_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  session_id: z.string().uuid().optional(),
  metadata: z.record(z.unknown()).default({}),
});

// Event envelope for Kafka messages
export const EventEnvelopeSchema = z.object({
  topic: z.string(),
  partition: z.number().int().min(0),
  offset: z.number().int().min(0),
  timestamp: z.coerce.date(),
  key: z.string(),
  headers: z.record(z.string()).default({}),
  payload: BaseEventSchema,
});

export type BaseEvent = z.infer<typeof BaseEventSchema>;
export type EventEnvelope = z.infer<typeof EventEnvelopeSchema>;
```

### 3.2 Plant Events

```typescript
// libs/shared/events/plant-events.schema.ts
import { z } from "zod";
import { BaseEventSchema } from "./base-event.schema";
import { PlantSchema, PlantStageSchema } from "../schemas/plants/plant.schema";

// Plant created event
export const PlantCreatedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("plant.created"),
  data: PlantSchema,
});

// Plant stage changed event
export const PlantStageChangedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("plant.stage_changed"),
  data: z.object({
    plant_id: z.string().uuid(),
    previous_stage: PlantStageSchema,
    new_stage: PlantStageSchema,
    changed_at: z.coerce.date(),
    reason: z.string().optional(),
  }),
});

// Plant measurement recorded event
export const PlantMeasurementRecordedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("plant.measurement_recorded"),
  data: z.object({
    plant_id: z.string().uuid(),
    measurement_type: z.string(),
    value: z.number(),
    unit: z.string(),
    measured_by: z.string().uuid(),
    measured_at: z.coerce.date(),
  }),
});

// Plant destroyed event
export const PlantDestroyedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("plant.destroyed"),
  data: z.object({
    plant_id: z.string().uuid(),
    reason: z.string(),
    destroyed_by: z.string().uuid(),
    destroyed_at: z.coerce.date(),
    witness: z.string().uuid().optional(),
    destruction_method: z.string(),
  }),
});

// Union of all plant events
export const PlantEventSchema = z.discriminatedUnion("event_type", [
  PlantCreatedEventSchema,
  PlantStageChangedEventSchema,
  PlantMeasurementRecordedEventSchema,
  PlantDestroyedEventSchema,
]);

export type PlantCreatedEvent = z.infer<typeof PlantCreatedEventSchema>;
export type PlantStageChangedEvent = z.infer<
  typeof PlantStageChangedEventSchema
>;
export type PlantEvent = z.infer<typeof PlantEventSchema>;
```

### 3.3 IoT Events

```typescript
// libs/shared/events/iot-events.schema.ts
import { z } from "zod";
import { BaseEventSchema } from "./base-event.schema";
import {
  SensorReadingSchema,
  SensorSchema,
} from "../schemas/iot/sensor.schema";

// Sensor reading recorded event
export const SensorReadingRecordedEventSchema = BaseEventSchema.extend({
  event_type: z.literal("sensor.reading_recorded"),
  data: SensorReadingSchema.pick({
    sensor_id: true,
    measurement: true,
    quality_score: true,
    alert_level: true,
  }),
});

// Sensor alert triggered event
export const SensorAlertTriggeredEventSchema = BaseEventSchema.extend({
  event_type: z.literal("sensor.alert_triggered"),
  data: z.object({
    sensor_id: z.string().uuid(),
    alert_level: z.enum(["WARNING", "CRITICAL"]),
    threshold_type: z.enum(["MIN", "MAX"]),
    threshold_value: z.number(),
    actual_value: z.number(),
    triggered_at: z.coerce.date(),
  }),
});

// Sensor offline event
export const SensorOfflineEventSchema = BaseEventSchema.extend({
  event_type: z.literal("sensor.offline"),
  data: z.object({
    sensor_id: z.string().uuid(),
    last_reading_at: z.coerce.date(),
    offline_detected_at: z.coerce.date(),
  }),
});

// Union of all IoT events
export const IoTEventSchema = z.discriminatedUnion("event_type", [
  SensorReadingRecordedEventSchema,
  SensorAlertTriggeredEventSchema,
  SensorOfflineEventSchema,
]);

export type SensorReadingRecordedEvent = z.infer<
  typeof SensorReadingRecordedEventSchema
>;
export type SensorAlertTriggeredEvent = z.infer<
  typeof SensorAlertTriggeredEventSchema
>;
export type IoTEvent = z.infer<typeof IoTEventSchema>;
```

---

## 🔌 **4. HTTP API CONTRACTS**

### 4.1 Request/Response Patterns

```typescript
// libs/shared/api-contracts/common/http.schema.ts
import { z } from "zod";

// Pagination schema
export const PaginationRequestSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
});

export const PaginationResponseSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
  total: z.number().int().min(0),
  total_pages: z.number().int().min(0),
  has_next: z.boolean(),
  has_prev: z.boolean(),
});

// Standard API response wrapper
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    message: z.string().optional(),
    timestamp: z.coerce.date(),
    request_id: z.string().uuid(),
  });

// Error response schema
export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
    validation_errors: z
      .array(
        z.object({
          field: z.string(),
          message: z.string(),
          value: z.unknown().optional(),
        })
      )
      .optional(),
  }),
  timestamp: z.coerce.date(),
  request_id: z.string().uuid(),
});

// Paginated response schema
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T
) =>
  z.object({
    success: z.literal(true),
    data: z.object({
      items: z.array(itemSchema),
      pagination: PaginationResponseSchema,
    }),
    timestamp: z.coerce.date(),
    request_id: z.string().uuid(),
  });

export type PaginationRequest = z.infer<typeof PaginationRequestSchema>;
export type PaginationResponse = z.infer<typeof PaginationResponseSchema>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
```

### 4.2 Plants API Contracts

```typescript
// libs/shared/api-contracts/plants/plants.contract.ts
import { z } from "zod";
import {
  PlantSchema,
  PlantMeasurementSchema,
  BatchSchema,
} from "../../schemas/plants/plant.schema";
import {
  PaginationRequestSchema,
  ApiResponseSchema,
  PaginatedResponseSchema,
  ApiErrorResponseSchema,
} from "../common/http.schema";

// GET /api/plants - List plants with filtering
export const ListPlantsRequestSchema = PaginationRequestSchema.extend({
  batch_id: z.string().uuid().optional(),
  stage: z.string().optional(),
  location_facility: z.string().uuid().optional(),
  health_status: z.string().optional(),
  created_after: z.coerce.date().optional(),
  created_before: z.coerce.date().optional(),
});

export const ListPlantsResponseSchema = PaginatedResponseSchema(PlantSchema);

// GET /api/plants/:id - Get single plant
export const GetPlantRequestSchema = z.object({
  id: z.string().uuid(),
});

export const GetPlantResponseSchema = ApiResponseSchema(PlantSchema);

// POST /api/plants - Create new plant
export const CreatePlantRequestSchema = PlantSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
  updated_by: true,
});

export const CreatePlantResponseSchema = ApiResponseSchema(PlantSchema);

// PUT /api/plants/:id - Update plant
export const UpdatePlantRequestSchema = z.object({
  id: z.string().uuid(),
  data: PlantSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    created_by: true,
    updated_by: true,
  }).partial(),
});

export const UpdatePlantResponseSchema = ApiResponseSchema(PlantSchema);

// POST /api/plants/:id/measurements - Record measurement
export const RecordPlantMeasurementRequestSchema = z.object({
  plant_id: z.string().uuid(),
  data: PlantMeasurementSchema.omit({
    id: true,
    plant_id: true,
    created_at: true,
    updated_at: true,
    created_by: true,
    updated_by: true,
  }),
});

export const RecordPlantMeasurementResponseSchema = ApiResponseSchema(
  PlantMeasurementSchema
);

// Plants API contract type
export const PlantsApiContract = {
  listPlants: {
    method: "GET" as const,
    path: "/api/plants" as const,
    request: {
      query: ListPlantsRequestSchema,
    },
    responses: {
      200: ListPlantsResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },
  getPlant: {
    method: "GET" as const,
    path: "/api/plants/:id" as const,
    request: {
      params: GetPlantRequestSchema,
    },
    responses: {
      200: GetPlantResponseSchema,
      404: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },
  createPlant: {
    method: "POST" as const,
    path: "/api/plants" as const,
    request: {
      body: CreatePlantRequestSchema,
    },
    responses: {
      201: CreatePlantResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },
  updatePlant: {
    method: "PUT" as const,
    path: "/api/plants/:id" as const,
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: UpdatePlantRequestSchema.shape.data,
    },
    responses: {
      200: UpdatePlantResponseSchema,
      404: ApiErrorResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },
  recordMeasurement: {
    method: "POST" as const,
    path: "/api/plants/:id/measurements" as const,
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: RecordPlantMeasurementRequestSchema.shape.data,
    },
    responses: {
      201: RecordPlantMeasurementResponseSchema,
      404: ApiErrorResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },
} as const;

export type PlantsApiContractType = typeof PlantsApiContract;
```

### 4.3 IoT API Contracts

```typescript
// libs/shared/api-contracts/iot/sensors.contract.ts
import { z } from "zod";
import {
  SensorSchema,
  SensorReadingSchema,
  SensorCalibrationSchema,
} from "../../schemas/iot/sensor.schema";
import {
  PaginationRequestSchema,
  ApiResponseSchema,
  PaginatedResponseSchema,
  ApiErrorResponseSchema,
} from "../common/http.schema";

// GET /api/sensors - List sensors
export const ListSensorsRequestSchema = PaginationRequestSchema.extend({
  sensor_type: z.string().optional(),
  location_facility: z.string().uuid().optional(),
  status: z.string().optional(),
});

export const ListSensorsResponseSchema = PaginatedResponseSchema(SensorSchema);

// GET /api/sensors/:id/readings - Get sensor readings
export const GetSensorReadingsRequestSchema = PaginationRequestSchema.extend({
  sensor_id: z.string().uuid(),
  from_date: z.coerce.date().optional(),
  to_date: z.coerce.date().optional(),
  alert_level: z.string().optional(),
});

export const GetSensorReadingsResponseSchema =
  PaginatedResponseSchema(SensorReadingSchema);

// POST /api/sensors/:id/readings - Record sensor reading (for manual entries)
export const RecordSensorReadingRequestSchema = z.object({
  sensor_id: z.string().uuid(),
  data: SensorReadingSchema.omit({
    id: true,
    sensor_id: true,
    created_at: true,
    updated_at: true,
    created_by: true,
    updated_by: true,
  }),
});

export const RecordSensorReadingResponseSchema =
  ApiResponseSchema(SensorReadingSchema);

// Sensors API contract
export const SensorsApiContract = {
  listSensors: {
    method: "GET" as const,
    path: "/api/sensors" as const,
    request: {
      query: ListSensorsRequestSchema,
    },
    responses: {
      200: ListSensorsResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },
  getSensorReadings: {
    method: "GET" as const,
    path: "/api/sensors/:id/readings" as const,
    request: {
      params: z.object({ id: z.string().uuid() }),
      query: GetSensorReadingsRequestSchema.omit({ sensor_id: true }),
    },
    responses: {
      200: GetSensorReadingsResponseSchema,
      404: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },
  recordReading: {
    method: "POST" as const,
    path: "/api/sensors/:id/readings" as const,
    request: {
      params: z.object({ id: z.string().uuid() }),
      body: RecordSensorReadingRequestSchema.shape.data,
    },
    responses: {
      201: RecordSensorReadingResponseSchema,
      404: ApiErrorResponseSchema,
      400: ApiErrorResponseSchema,
      500: ApiErrorResponseSchema,
    },
  },
} as const;

export type SensorsApiContractType = typeof SensorsApiContract;
```

---

## 🛡️ **5. INTEGRATION CONTRACTS**

### 5.1 Mayan EDMS Integration

```typescript
// libs/shared/integrations/mayan-edms.schema.ts
import { z } from "zod";

// Mayan document schema
export const MayanDocumentSchema = z.object({
  id: z.number().positive(),
  uuid: z.string().uuid(),
  label: z.string(),
  description: z.string().optional(),
  document_type: z.object({
    id: z.number().positive(),
    label: z.string(),
  }),
  file_latest: z.object({
    id: z.number().positive(),
    filename: z.string(),
    size: z.number().positive(),
    mimetype: z.string(),
    checksum: z.string(),
    encoding: z.string(),
    timestamp: z.coerce.date(),
  }),
  metadata: z
    .array(
      z.object({
        metadata_type: z.object({
          id: z.number().positive(),
          name: z.string(),
          label: z.string(),
        }),
        value: z.string(),
      })
    )
    .default([]),
});

// Document upload request
export const MayanUploadDocumentRequestSchema = z.object({
  document_type_id: z.number().positive(),
  label: z.string().min(1),
  description: z.string().optional(),
  file: z.object({
    filename: z.string(),
    content: z.string(), // base64 encoded
    content_type: z.string(),
  }),
  metadata: z.record(z.string()).optional(),
});

// Document search request
export const MayanSearchDocumentsRequestSchema = z.object({
  q: z.string().optional(),
  document_type_id: z.number().positive().optional(),
  metadata_filters: z.record(z.string()).optional(),
  page: z.number().int().min(1).default(1),
  page_size: z.number().int().min(1).max(100).default(20),
});

export const MayanSearchDocumentsResponseSchema = z.object({
  count: z.number().int().min(0),
  next: z.string().url().nullable(),
  previous: z.string().url().nullable(),
  results: z.array(MayanDocumentSchema),
});

export type MayanDocument = z.infer<typeof MayanDocumentSchema>;
export type MayanUploadDocumentRequest = z.infer<
  typeof MayanUploadDocumentRequestSchema
>;
export type MayanSearchDocumentsRequest = z.infer<
  typeof MayanSearchDocumentsRequestSchema
>;
```

### 5.2 XeoKit 3D Integration

```typescript
// libs/shared/integrations/xeokit.schema.ts
import { z } from "zod";

// 3D model schema
export const XeoKit3DModelSchema = z.object({
  model_id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  model_url: z.string().url(),
  thumbnail_url: z.string().url().optional(),
  metadata: z.object({
    facility_id: z.string().uuid(),
    room_ids: z.array(z.string().uuid()).default([]),
    last_updated: z.coerce.date(),
    version: z.string(),
    format: z.enum(["XKT", "IFC", "GLB", "GLTF"]),
    file_size: z.number().positive(),
  }),
});

// Object selection/highlighting request
export const XeoKitObjectSelectionSchema = z.object({
  model_id: z.string(),
  object_ids: z.array(z.string()),
  action: z.enum(["SELECT", "HIGHLIGHT", "HIDE", "SHOW", "COLOR"]),
  color: z
    .object({
      r: z.number().min(0).max(1),
      g: z.number().min(0).max(1),
      b: z.number().min(0).max(1),
      a: z.number().min(0).max(1).default(1),
    })
    .optional(),
});

// Plant location overlay
export const XeoKitPlantOverlaySchema = z.object({
  plant_id: z.string().uuid(),
  model_id: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  rotation: z
    .object({
      x: z.number().default(0),
      y: z.number().default(0),
      z: z.number().default(0),
    })
    .default({}),
  scale: z
    .object({
      x: z.number().positive().default(1),
      y: z.number().positive().default(1),
      z: z.number().positive().default(1),
    })
    .default({}),
  metadata: z.record(z.unknown()).default({}),
});

export type XeoKit3DModel = z.infer<typeof XeoKit3DModelSchema>;
export type XeoKitObjectSelection = z.infer<typeof XeoKitObjectSelectionSchema>;
export type XeoKitPlantOverlay = z.infer<typeof XeoKitPlantOverlaySchema>;
```

---

## 🔨 **6. RUNTIME VALIDATION & UTILITIES**

### 6.1 Validation Middleware

```typescript
// libs/shared/validation/middleware.ts
import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { ApiErrorResponseSchema } from "../api-contracts/common/http.schema";

// Generic validation middleware factory
export function validateSchema<T extends z.ZodTypeAny>(
  schema: T,
  target: "body" | "query" | "params" = "body"
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[target];
      const validated = schema.parse(data);
      req[target] = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorResponse: z.infer<typeof ApiErrorResponseSchema> = {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request validation failed",
            validation_errors: error.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
              value: err.input,
            })),
          },
          timestamp: new Date(),
          request_id:
            (req.headers["x-request-id"] as string) || crypto.randomUUID(),
        };
        return res.status(400).json(errorResponse);
      }
      next(error);
    }
  };
}

// Usage example
export const validateCreatePlant = validateSchema(
  CreatePlantRequestSchema,
  "body"
);
export const validatePlantQuery = validateSchema(
  ListPlantsRequestSchema,
  "query"
);
export const validatePlantParams = validateSchema(
  GetPlantRequestSchema,
  "params"
);
```

### 6.2 Event Validation Utilities

```typescript
// libs/shared/validation/events.ts
import { z } from "zod";
import { PlantEventSchema } from "../events/plant-events.schema";
import { IoTEventSchema } from "../events/iot-events.schema";

// Event validator factory
export function createEventValidator<T extends z.ZodTypeAny>(schema: T) {
  return {
    validate: (data: unknown): z.infer<T> => {
      return schema.parse(data);
    },
    safeParse: (data: unknown): z.SafeParseReturnType<unknown, z.infer<T>> => {
      return schema.safeParse(data);
    },
    is: (data: unknown): data is z.infer<T> => {
      return schema.safeParse(data).success;
    },
  };
}

// Pre-created validators for main event types
export const plantEventValidator = createEventValidator(PlantEventSchema);
export const iotEventValidator = createEventValidator(IoTEventSchema);

// Kafka message validator
export function validateKafkaMessage(topic: string, message: unknown) {
  switch (topic) {
    case "plants.events":
      return plantEventValidator.validate(message);
    case "iot.readings":
    case "iot.alerts":
      return iotEventValidator.validate(message);
    default:
      throw new Error(`Unknown topic: ${topic}`);
  }
}
```

### 6.3 OpenAPI Generation

```typescript
// tools/generate-openapi.ts
import { z } from "zod";
import { generateSchema } from "@anatine/zod-openapi";
import { PlantsApiContract } from "../libs/shared/api-contracts/plants/plants.contract";
import { SensorsApiContract } from "../libs/shared/api-contracts/iot/sensors.contract";

// Generate OpenAPI spec from Zod schemas
export function generateOpenAPISpec() {
  const spec = {
    openapi: "3.0.0",
    info: {
      title: "GACP-ERP API",
      version: "1.0.0",
      description: "Cannabis cultivation ERP system API",
    },
    servers: [
      {
        url: "https://api.gacp-erp.farm",
        description: "Production server",
      },
      {
        url: "https://staging-api.gacp-erp.farm",
        description: "Staging server",
      },
    ],
    paths: {},
    components: {
      schemas: {},
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  };

  // Generate paths from API contracts
  Object.entries(PlantsApiContract).forEach(([operationId, contract]) => {
    const path = contract.path.replace(/:(\w+)/g, "{$1}");

    if (!spec.paths[path]) {
      spec.paths[path] = {};
    }

    spec.paths[path][contract.method.toLowerCase()] = {
      operationId,
      summary: `${contract.method} ${path}`,
      parameters: contract.request?.params
        ? [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ]
        : [],
      requestBody: contract.request?.body
        ? {
            required: true,
            content: {
              "application/json": {
                schema: generateSchema(contract.request.body),
              },
            },
          }
        : undefined,
      responses: Object.fromEntries(
        Object.entries(contract.responses).map(([status, schema]) => [
          status,
          {
            description: status === "200" ? "Success" : "Error",
            content: {
              "application/json": {
                schema: generateSchema(schema),
              },
            },
          },
        ])
      ),
      security: [{ BearerAuth: [] }],
    };
  });

  return spec;
}

// CLI script to generate and save OpenAPI spec
if (require.main === module) {
  const spec = generateOpenAPISpec();
  require("fs").writeFileSync(
    "./docs/api/openapi.json",
    JSON.stringify(spec, null, 2)
  );
  console.log("OpenAPI spec generated at ./docs/api/openapi.json");
}
```

---

## 📋 **7. TYPE SAFETY & BEST PRACTICES**

### 7.1 Type Inference Patterns

```typescript
// Best practices for working with Zod schemas

// ✅ GOOD: Use type inference
const user = UserSchema.parse(userData);
type User = z.infer<typeof UserSchema>; // Automatic type generation

// ✅ GOOD: Create derived schemas
const PublicUserSchema = UserSchema.omit({
  password_changed_at: true,
  two_factor_enabled: true,
});
type PublicUser = z.infer<typeof PublicUserSchema>;

// ✅ GOOD: Extend base schemas
const AdminUserSchema = UserSchema.extend({
  admin_level: z.number().min(1).max(5),
  permissions: z.array(z.string()),
});

// ✅ GOOD: Use discriminated unions for polymorphism
const NotificationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("email"),
    email: z.string().email(),
    subject: z.string(),
    body: z.string(),
  }),
  z.object({
    type: z.literal("sms"),
    phone: z.string(),
    message: z.string(),
  }),
]);

// ❌ BAD: Don't duplicate interfaces
// interface User { ... } // This creates duplication!
```

### 7.2 Validation Patterns

```typescript
// Robust validation patterns

// ✅ GOOD: Use transforms for data normalization
const EmailSchema = z.string().trim().toLowerCase().email();

const PhoneSchema = z
  .string()
  .transform((phone) => phone.replace(/\D/g, ""))
  .refine((phone) => phone.length >= 10, {
    message: "Phone number must be at least 10 digits",
  });

// ✅ GOOD: Custom validation with context
const PlantTagSchema = z
  .string()
  .regex(/^P\d{8}$/, "Plant tag must be in format P12345678")
  .refine(
    async (tag) => {
      // Check uniqueness in database
      const exists = await checkPlantTagExists(tag);
      return !exists;
    },
    {
      message: "Plant tag already exists",
    }
  );

// ✅ GOOD: Conditional validation
const PlantSchema = z
  .object({
    stage: PlantStageSchema,
    harvest_date: z.coerce.date().optional(),
    destruction_date: z.coerce.date().optional(),
  })
  .refine(
    (data) => {
      if (data.stage === "HARVEST" && !data.harvest_date) {
        return false;
      }
      if (data.stage === "DESTROYED" && !data.destruction_date) {
        return false;
      }
      return true;
    },
    {
      message: "Required dates missing for current stage",
    }
  );
```

### 7.3 Error Handling

```typescript
// Comprehensive error handling with Zod

export class ValidationService {
  static validateAndTransform<T extends z.ZodTypeAny>(
    schema: T,
    data: unknown,
    context?: string
  ): z.infer<T> {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const validationError = new ValidationError(
          `Validation failed${context ? ` for ${context}` : ""}`,
          error.errors
        );
        throw validationError;
      }
      throw error;
    }
  }

  static async safeValidate<T extends z.ZodTypeAny>(
    schema: T,
    data: unknown
  ): Promise<
    { success: true; data: z.infer<T> } | { success: false; errors: z.ZodError }
  > {
    const result = await schema.safeParseAsync(data);
    if (result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, errors: result.error };
    }
  }
}

export class ValidationError extends Error {
  constructor(message: string, public readonly zodErrors: z.ZodIssue[]) {
    super(message);
    this.name = "ValidationError";
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      errors: this.zodErrors.map((err) => ({
        path: err.path.join("."),
        message: err.message,
        code: err.code,
      })),
    };
  }
}
```

---

## 🎯 **8. IMPLEMENTATION CHECKLIST**

### 8.1 Development Tasks

- [ ] **Create schema libraries structure**

  - [ ] `libs/shared/schemas/` - All domain schemas
  - [ ] `libs/shared/events/` - All Kafka event schemas
  - [ ] `libs/shared/api-contracts/` - All HTTP API contracts
  - [ ] `libs/shared/integrations/` - External service schemas

- [ ] **Implement validation middleware**

  - [ ] Generic validation middleware factory
  - [ ] Request/response validation
  - [ ] Error handling middleware
  - [ ] Custom validation functions

- [ ] **Generate OpenAPI documentation**

  - [ ] Automated OpenAPI spec generation
  - [ ] Swagger UI integration
  - [ ] API documentation website
  - [ ] Contract testing setup

- [ ] **Update existing code**
  - [ ] Replace TypeScript interfaces with Zod schemas
  - [ ] Add runtime validation to all APIs
  - [ ] Update Kafka event handling
  - [ ] Migrate integration contracts

### 8.2 Quality Assurance

- [ ] **Type safety verification**

  - [ ] Ensure all APIs use Zod validation
  - [ ] Verify type inference works correctly
  - [ ] Test schema composition and extension
  - [ ] Validate error handling

- [ ] **Performance testing**

  - [ ] Benchmark validation performance
  - [ ] Test large data set validation
  - [ ] Optimize schema parsing
  - [ ] Cache validation results where appropriate

- [ ] **Integration testing**
  - [ ] Test API contract compliance
  - [ ] Verify Kafka event validation
  - [ ] Test external service integrations
  - [ ] End-to-end contract testing

---

## 📚 **9. СВЯЗАННАЯ ДОКУМЕНТАЦИЯ**

### Архитектурные документы

- **[SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)** - Общая архитектура системы
- **[EVENT_ARCHITECTURE.md](./EVENT_ARCHITECTURE.md)** - Kafka события и паттерны

### Операционная документация

- **[API Documentation](./api/)** - Автогенерируемая OpenAPI документация
- **[Integration Guide](./integrations/)** - Руководства по интеграциям

### Валидационная документация

- **[Validation Standards](./validation/)** - Стандарты валидации данных
- **[Testing Procedures](./testing/)** - Процедуры тестирования контрактов

---

**Документация актуальна на**: 14 сентября 2025 г.  
**Следующий review**: 14 декабря 2025 г.
