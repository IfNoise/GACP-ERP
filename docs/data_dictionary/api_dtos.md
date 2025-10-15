0# API DTOs (Data Transfer Objects)

Объекты передачи данных для REST API в GACP-ERP системе.

> ⚡ **Zod-First Development**: Все DTO определены через Zod-схемы согласно [CODING_STANDARDS.md](../CODING_STANDARDS.md)  
> TypeScript типы выводятся через `z.infer<typeof Schema>`

## 📐 Принципы

1. **Schema-first API design** с ts-rest + Zod
2. **Zod single source of truth** для всех типов
3. **Type-safe** через `z.infer<>`
4. **Runtime validation** из коробки
5. **Нет голых `interface`** - только Zod-схемы

## 📡 Common Patterns

### Standard Response Wrapper

**Описание**: Обёртка для всех API ответов  
**Источник**: `docs/CONTRACT_SPECIFICATIONS.md`

```typescript
import { z } from 'zod';

// Схема для ошибки валидации
const ValidationErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  value: z.unknown().optional()
});

// Схема для успешного ответа
const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
  success: z.literal(true),
  data: dataSchema,
  message: z.string().optional(),
  timestamp: z.date(),
  request_id: z.string().uuid()
});

// Схема для ошибки
const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
    validation_errors: z.array(ValidationErrorSchema).optional()
  }),
  timestamp: z.date(),
  request_id: z.string().uuid()
});

// TypeScript типы из схем
export type ValidationError = z.infer<typeof ValidationErrorSchema>;
export type ApiResponse<T> = {
  success: true;
  data: T;
  message?: string;
  timestamp: Date;
  request_id: string;
};
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
```

### Pagination

**Описание**: Паттерн пагинации для списков  
**Источник**: `docs/CONTRACT_SPECIFICATIONS.md`

```typescript
import { z } from 'zod';

// Схема запроса с пагинацией
const PaginationRequestSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('asc')
});

// Схема ответа с пагинацией
const PaginationResponseSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  total_pages: z.number(),
  has_next: z.boolean(),
  has_prev: z.boolean()
});

// Схема обёртки для списков
const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) => z.object({
  success: z.literal(true),
  data: z.object({
    items: z.array(itemSchema),
    pagination: PaginationResponseSchema
  }),
  timestamp: z.date(),
  request_id: z.string().uuid()
});

// TypeScript типы из схем
export type PaginationRequest = z.infer<typeof PaginationRequestSchema>;
export type PaginationResponse = z.infer<typeof PaginationResponseSchema>;
export type PaginatedResponse<T> = {
  success: true;
  data: {
    items: T[];
    pagination: PaginationResponse;
  };
  timestamp: Date;
  request_id: string;
};
```

## 🌱 Plants API DTOs

### Plant DTO

**Описание**: Основной DTO для растений

```typescript
import { z } from "zod";

// Zod-схема для Plant API DTO
export const PlantDTOSchema = z.object({
  id: z.string().uuid().describe("Уникальный идентификатор растения"),
  plantCode: z.string().max(20).describe("Код растения"),
  strainId: z.string().uuid().describe("Сорт растения"),
  stage: z
    .enum(["seedling", "vegetative", "flowering", "harvest_ready", "harvested"])
    .describe("Стадия роста"),
  healthScore: z.number().min(0).max(100).describe("Оценка здоровья"),
  location: z
    .object({
      facilityId: z.string().uuid(),
      roomId: z.string().uuid(),
      zoneId: z.string().uuid(),
      coordinates: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      }),
    })
    .describe("Местоположение растения"),

  // Дополнительные API поля
  batchId: z.string().uuid().optional(),
  sourceType: z.enum(["seed", "clone"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript тип выводится из Zod-схемы
export type PlantDTO = z.infer<typeof PlantDTOSchema>;
```

### List Plants

**Эндпоинт**: `GET /api/plants`  
**Источник**: `docs/CONTRACT_SPECIFICATIONS.md`

```typescript
import { z } from 'zod';

// Схема запроса списка растений
const ListPlantsRequestSchema = PaginationRequestSchema.extend({
  strain: z.string().optional(),
  stage: z.enum(['seedling', 'vegetative', 'flowering', 'harvest_ready', 'harvested']).optional(),
  health_status: z.enum(['critical', 'poor', 'fair', 'good', 'excellent']).optional(),
  zone_id: z.string().uuid().optional(),
  batch_id: z.string().uuid().optional(),
  created_after: z.date().optional(),
  created_before: z.date().optional()
});

// Типы из схем
export type ListPlantsRequest = z.infer<typeof ListPlantsRequestSchema>;
export type ListPlantsResponse = PaginatedResponse<PlantDTO>;
```

### Get Plant

**Эндпоинт**: `GET /api/plants/:id`  
**Источник**: `docs/CONTRACT_SPECIFICATIONS.md`

```typescript
import { z } from 'zod';

// Схема параметров
const GetPlantParamsSchema = z.object({
  id: z.string().uuid()
});

// Типы из схем
export type GetPlantParams = z.infer<typeof GetPlantParamsSchema>;
export type GetPlantResponse = ApiResponse<PlantDTO>;
```

### Create Plant

**Эндпоинт**: `POST /api/plants`  
**Источник**: `docs/CONTRACT_SPECIFICATIONS.md`

```typescript
import { z } from 'zod';

// Схема запроса создания растения
const CreatePlantRequestSchema = z.object({
  batch_id: z.string().uuid(),
  source_type: z.enum(['seed', 'clone']),
  source_reference: z.string().uuid().optional(),
  strain: z.string(),
  genetics: z.string(),
  current_zone_id: z.string().uuid(),
  biological_asset_value: z.number().nonnegative().optional(),
  metadata: z.record(z.unknown()).optional()
});

// Типы из схем
export type CreatePlantRequest = z.infer<typeof CreatePlantRequestSchema>;
export type CreatePlantResponse = ApiResponse<PlantDTO>;
```

### Update Plant

**Эндпоинт**: `PUT /api/plants/:id`  
**Источник**: `docs/CONTRACT_SPECIFICATIONS.md`

```typescript
import { z } from 'zod';

// Схема параметров
const UpdatePlantParamsSchema = z.object({
  id: z.string().uuid()
});

// Схема запроса обновления (частичное)
const UpdatePlantRequestSchema = z.object({
  strain: z.string().optional(),
  stage: z.enum(['seedling', 'vegetative', 'flowering', 'harvest_ready', 'harvested']).optional(),
  current_health_score: z.number().min(0).max(100).optional(),
  current_zone_id: z.string().uuid().optional(),
  biological_asset_value: z.number().nonnegative().optional(),
  metadata: z.record(z.unknown()).optional()
});

// Типы из схем
export type UpdatePlantParams = z.infer<typeof UpdatePlantParamsSchema>;
export type UpdatePlantRequest = z.infer<typeof UpdatePlantRequestSchema>;
export type UpdatePlantResponse = ApiResponse<PlantDTO>;
```

### Record Plant Measurement

**Эндпоинт**: `POST /api/plants/:id/measurements`  
**Источник**: `docs/CONTRACT_SPECIFICATIONS.md`

```typescript
import { z } from 'zod';

// Схема параметров
const RecordMeasurementParamsSchema = z.object({
  id: z.string().uuid()
});

// Схема условий окружающей среды
const EnvironmentalConditionsSchema = z.object({
  temperature: z.number().optional(),
  humidity: z.number().min(0).max(100).optional(),
  ph: z.number().min(0).max(14).optional()
});

// Схема запроса записи измерения
const RecordPlantMeasurementRequestSchema = z.object({
  measurement_type: z.enum(['height', 'weight', 'health_score']),
  value: z.number(),
  unit: z.string(),
  notes: z.string().optional(),
  measured_at: z.date().optional(),
  equipment_used: z.string().optional(),
  environmental_conditions: EnvironmentalConditionsSchema.optional()
});

// Схема ответа измерения
const PlantMeasurementSchema = z.object({
  id: z.string().uuid(),
  plant_id: z.string().uuid(),
  measurement_type: z.string(),
  value: z.number(),
  unit: z.string(),
  notes: z.string().optional(),
  measured_at: z.date(),
  equipment_used: z.string().optional(),
  environmental_conditions: EnvironmentalConditionsSchema.optional(),
  created_at: z.date()
});

// Типы из схем
export type RecordMeasurementParams = z.infer<typeof RecordMeasurementParamsSchema>;
export type RecordPlantMeasurementRequest = z.infer<typeof RecordPlantMeasurementRequestSchema>;
export type PlantMeasurement = z.infer<typeof PlantMeasurementSchema>;
export type RecordPlantMeasurementResponse = ApiResponse<PlantMeasurement>;
```

## 📊 IoT & Sensors API DTOs

### List Sensors

**Эндпоинт**: `GET /api/sensors`  
**Источник**: `docs/CONTRACT_SPECIFICATIONS.md`

```typescript
import { z } from 'zod';

// Схема запроса списка сенсоров
const ListSensorsRequestSchema = PaginationRequestSchema.extend({
  sensor_type: z.enum(['temperature', 'humidity', 'co2', 'ph', 'ec', 'light']).optional(),
  location_facility: z.string().uuid().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).optional(),
  zone_id: z.string().uuid().optional()
});

// Схема сенсора
const SensorSchema = z.object({
  id: z.string().uuid(),
  sensor_type: z.enum(['temperature', 'humidity', 'co2', 'ph', 'ec', 'light']),
  location_facility: z.string().uuid(),
  zone_id: z.string().uuid().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']),
  created_at: z.date(),
  updated_at: z.date()
});

// Типы из схем
export type ListSensorsRequest = z.infer<typeof ListSensorsRequestSchema>;
export type Sensor = z.infer<typeof SensorSchema>;
export type ListSensorsResponse = PaginatedResponse<Sensor>;
```

### Get Sensor Readings

**Эндпоинт**: `GET /api/sensors/:id/readings`  
**Источник**: `docs/CONTRACT_SPECIFICATIONS.md`

```typescript
import { z } from 'zod';

// Схема параметров
const GetSensorReadingsParamsSchema = z.object({
  id: z.string().uuid()
});

// Схема запроса
const GetSensorReadingsRequestSchema = PaginationRequestSchema.extend({
  from_date: z.date().optional(),
  to_date: z.date().optional(),
  alert_level: z.enum(['normal', 'warning', 'critical']).optional(),
  quality_threshold: z.enum(['poor', 'fair', 'good', 'excellent']).optional()
});

// Схема чтения сенсора
const SensorReadingSchema = z.object({
  id: z.string().uuid(),
  sensor_id: z.string().uuid(),
  value: z.number(),
  unit: z.string(),
  timestamp: z.date(),
  quality: z.enum(['poor', 'fair', 'good', 'excellent']),
  threshold_status: z.enum(['normal', 'warning', 'critical']),
  notes: z.string().optional()
});

// Типы из схем
export type GetSensorReadingsParams = z.infer<typeof GetSensorReadingsParamsSchema>;
export type GetSensorReadingsRequest = z.infer<typeof GetSensorReadingsRequestSchema>;
export type SensorReading = z.infer<typeof SensorReadingSchema>;
export type GetSensorReadingsResponse = PaginatedResponse<SensorReading>;
```

### Record Sensor Reading

**Эндпоинт**: `POST /api/sensors/:id/readings`  
**Источник**: `docs/CONTRACT_SPECIFICATIONS.md`

```typescript
import { z } from 'zod';

// Схема параметров
const RecordSensorReadingParamsSchema = z.object({
  id: z.string().uuid()
});

// Схема запроса записи показаний
const RecordSensorReadingRequestSchema = z.object({
  value: z.number(),
  unit: z.string(),
  timestamp: z.date().optional(),
  quality: z.enum(['poor', 'fair', 'good', 'excellent']).default('good'),
  threshold_status: z.enum(['normal', 'warning', 'critical']).default('normal'),
  notes: z.string().optional(),
  calibration_offset: z.number().optional()
});

// Типы из схем
export type RecordSensorReadingParams = z.infer<typeof RecordSensorReadingParamsSchema>;
export type RecordSensorReadingRequest = z.infer<typeof RecordSensorReadingRequestSchema>;
export type RecordSensorReadingResponse = ApiResponse<SensorReading>;
```

## 🏭 Spatial & Facility API DTOs

### Create Rack

**Эндпоинт**: `POST /api/racks`  
**Источник**: `docs/services/spatial-addressing-service-v2.md`

```typescript
import { z } from 'zod';

// Схема спецификаций стеллажа
const RackSpecificationsSchema = z.object({
  power_supply: z.boolean().optional(),
  irrigation_support: z.boolean().optional(),
  weight_capacity: z.number().nonnegative().optional()
});

// Схема запроса создания стеллажа
const CreateRackRequestSchema = z.object({
  zone_id: z.string().uuid(),
  rack_code: z.string(),
  rack_type: z.enum(['standard', 'mobile', 'vertical', 'custom']),
  coordinates: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number()
  }),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    depth: z.number().positive()
  }),
  orientation: z.number().min(0).max(360).default(0),
  max_tray_capacity: z.number().int().positive(),
  supported_tray_sizes: z.array(z.enum(['small', 'medium', 'large', 'xlarge'])),
  installation_date: z.date(),
  specifications: RackSpecificationsSchema.optional()
});

// Схема сущности стеллажа
const RackEntitySchema = z.object({
  id: z.string().uuid(),
  zone_id: z.string().uuid(),
  rack_code: z.string(),
  rack_type: z.enum(['standard', 'mobile', 'vertical', 'custom']),
  coordinates: z.object({ x: z.number(), y: z.number(), z: z.number() }),
  dimensions: z.object({ width: z.number(), height: z.number(), depth: z.number() }),
  orientation: z.number(),
  max_tray_capacity: z.number(),
  current_capacity: z.number(),
  supported_tray_sizes: z.array(z.enum(['small', 'medium', 'large', 'xlarge'])),
  installation_date: z.date(),
  specifications: RackSpecificationsSchema.optional(),
  created_at: z.date(),
  updated_at: z.date()
});

// Типы из схем
export type CreateRackRequest = z.infer<typeof CreateRackRequestSchema>;
export type RackEntity = z.infer<typeof RackEntitySchema>;
export type CreateRackResponse = ApiResponse<RackEntity>;
```

### Get Rack Utilization

**Эндпоинт**: `GET /api/racks/:id/utilization`  
**Источник**: `docs/services/spatial-addressing-service-v2.md`

```typescript
import { z } from 'zod';

// Схема параметров
const GetRackUtilizationParamsSchema = z.object({
  id: z.string().uuid()
});

// Схема утилизации полки
const ShelfUtilizationSchema = z.object({
  shelf_index: z.number().int().positive(),
  capacity: z.number().int().nonnegative(),
  occupied: z.number().int().nonnegative(),
  utilization_rate: z.number().min(0).max(100)
});

// Схема метрик утилизации
const UtilizationMetricsSchema = z.object({
  rack_id: z.string().uuid(),
  total_capacity: z.number().int().nonnegative(),
  occupied_slots: z.number().int().nonnegative(),
  utilization_percentage: z.number().min(0).max(100),
  available_slots: z.number().int().nonnegative(),
  by_tray_size: z.record(z.enum(['small', 'medium', 'large', 'xlarge']), z.number()),
  by_shelf: z.array(ShelfUtilizationSchema)
});

// Типы из схем
export type GetRackUtilizationParams = z.infer<typeof GetRackUtilizationParamsSchema>;
export type ShelfUtilization = z.infer<typeof ShelfUtilizationSchema>;
export type UtilizationMetrics = z.infer<typeof UtilizationMetricsSchema>;
export type GetRackUtilizationResponse = ApiResponse<UtilizationMetrics>;
```

### Find Available Racks

**Эндпоинт**: `GET /api/racks/available`  
**Источник**: `docs/services/spatial-addressing-service-v2.md`

```typescript
import { z } from 'zod';

// Схема запроса поиска доступных стеллажей
const FindAvailableRacksRequestSchema = z.object({
  zone_id: z.string().uuid().optional(),
  rack_type: z.enum(['standard', 'mobile', 'vertical', 'custom']).optional(),
  min_available_space: z.number().int().nonnegative().optional(),
  supported_tray_sizes: z.array(z.enum(['small', 'medium', 'large', 'xlarge'])).optional(),
  exclude_occupied: z.boolean().default(false),
  max_utilization: z.number().min(0).max(100).default(90)
});

// Типы из схем
export type FindAvailableRacksRequest = z.infer<typeof FindAvailableRacksRequestSchema>;
export type FindAvailableRacksResponse = ApiResponse<RackEntity[]>;
```

### Tray Placement

**Эндпоинт**: `POST /api/trays/:id/placement`  
**Источник**: `docs/services/spatial-addressing-service-v2.md`

```typescript
import { z } from 'zod';

// Схема параметров
const TrayPlacementParamsSchema = z.object({
  id: z.string().uuid()
});

// Схема запроса размещения лотка
const TrayPlacementRequestSchema = z.object({
  rack_id: z.string().uuid(),
  shelf_index: z.number().int().min(1),
  position_index: z.number().int().min(1),
  validate_capacity: z.boolean().default(true),
  force_placement: z.boolean().default(false)
});

// Схема позиции лотка
const TrayPositionSchema = z.object({
  rack_id: z.string().uuid(),
  shelf_index: z.number().int(),
  position_index: z.number().int(),
  coordinates: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number()
  })
});

// Схема конфликта размещения
const PlacementConflictSchema = z.object({
  type: z.enum(['overlap', 'capacity', 'size_mismatch']),
  message: z.string(),
  conflicting_tray_id: z.string().uuid().optional()
});

// Схема результата размещения
const PlacementResultSchema = z.object({
  tray_id: z.string().uuid(),
  old_position: TrayPositionSchema.optional(),
  new_position: TrayPositionSchema,
  spatial_address: z.string(),
  conflicts: z.array(PlacementConflictSchema),
  success: z.boolean(),
  warnings: z.array(z.string())
});

// Типы из схем
export type TrayPlacementParams = z.infer<typeof TrayPlacementParamsSchema>;
export type TrayPlacementRequest = z.infer<typeof TrayPlacementRequestSchema>;
export type TrayPosition = z.infer<typeof TrayPositionSchema>;
export type PlacementConflict = z.infer<typeof PlacementConflictSchema>;
export type PlacementResult = z.infer<typeof PlacementResultSchema>;
export type TrayPlacementResponse = ApiResponse<PlacementResult>;
```

## 💰 Financial API DTOs

### Financial Transactions

**Эндпоинт**: `POST /api/financial/transactions`  
**Источник**: `docs/validation/DS.md`

```typescript
import { z } from 'zod';

// Схема запроса создания финансовой транзакции
const CreateFinancialTransactionRequestSchema = z.object({
  transaction_type: z.enum(['revenue', 'expense', 'asset_transfer', 'depreciation']),
  amount: z.number().multipleOf(0.01).describe('DECIMAL(15,2)'),
  currency: z.string().length(3).default('USD').describe('ISO 4217'),
  account_from: z.string().describe('Код счёта'),
  account_to: z.string().describe('Код счёта'),
  reference_id: z.string().uuid().optional(),
  reference_type: z.string().optional(),
  description: z.string(),
  batch_id: z.string().uuid().optional(),
  posted_at: z.date().optional()
});

// Схема финансовой транзакции
const FinancialTransactionSchema = z.object({
  id: z.string().uuid(),
  transaction_type: z.enum(['revenue', 'expense', 'asset_transfer', 'depreciation']),
  amount: z.number(),
  currency: z.string(),
  account_from: z.string(),
  account_to: z.string(),
  reference_id: z.string().uuid().optional(),
  reference_type: z.string().optional(),
  description: z.string(),
  batch_id: z.string().uuid().optional(),
  posted_at: z.date(),
  created_at: z.date(),
  created_by: z.string().uuid()
});

// Типы из схем
export type CreateFinancialTransactionRequest = z.infer<typeof CreateFinancialTransactionRequestSchema>;
export type FinancialTransaction = z.infer<typeof FinancialTransactionSchema>;
export type CreateFinancialTransactionResponse = ApiResponse<FinancialTransaction>;
```

### Biological Assets Valuation

**Эндпоинт**: `PUT /api/biological-assets/:id/valuation`  
**Источник**: `docs/validation/DS.md`

```typescript
import { z } from 'zod';

// Схема параметров
const BiologicalAssetValuationParamsSchema = z.object({
  id: z.string().uuid()
});

// Схема запроса оценки биологического актива
const BiologicalAssetValuationRequestSchema = z.object({
  fair_value: z.number().multipleOf(0.01).describe('DECIMAL(15,2)'),
  market_rate_per_gram: z.number().multipleOf(0.01).describe('DECIMAL(8,2)'),
  estimated_yield: z.number().nonnegative().describe('граммы'),
  valuation_method: z.enum(['market_approach', 'cost_approach', 'income_approach']),
  valuation_date: z.date().optional(),
  notes: z.string().optional(),
  impairment_indicators: z.array(z.string()).optional()
});

// Схема биологического актива
const BiologicalAssetSchema = z.object({
  id: z.string().uuid(),
  plant_id: z.string().uuid(),
  fair_value: z.number(),
  market_rate_per_gram: z.number(),
  estimated_yield: z.number(),
  valuation_method: z.enum(['market_approach', 'cost_approach', 'income_approach']),
  valuation_date: z.date(),
  notes: z.string().optional(),
  impairment_indicators: z.array(z.string()).optional(),
  created_at: z.date(),
  updated_at: z.date()
});

// Типы из схем
export type BiologicalAssetValuationParams = z.infer<typeof BiologicalAssetValuationParamsSchema>;
export type BiologicalAssetValuationRequest = z.infer<typeof BiologicalAssetValuationRequestSchema>;
export type BiologicalAsset = z.infer<typeof BiologicalAssetSchema>;
export type BiologicalAssetValuationResponse = ApiResponse<BiologicalAsset>;
```

## 👥 Workforce API DTOs

### Task Assignment

**Эндпоинт**: `POST /api/workforce/tasks`  
**Источник**: `docs/validation/DS.md`

```typescript
import { z } from 'zod';

// Схема запроса создания задачи
const CreateTaskRequestSchema = z.object({
  assigned_to: z.string().uuid(),
  task_type: z.enum(['cultivation', 'quality_control', 'maintenance', 'harvest']),
  sop_id: z.string().uuid().optional(),
  plant_ids: z.array(z.string().uuid()).optional(),
  batch_id: z.string().uuid().optional(),
  zone_id: z.string().uuid().optional(),
  estimated_duration: z.string().describe('ISO 8601 duration'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  description: z.string(),
  special_instructions: z.string().optional(),
  required_equipment: z.array(z.string()).optional(),
  scheduled_start: z.date().optional(),
  deadline: z.date().optional()
});

// Схема рабочей задачи
const WorkTaskSchema = z.object({
  id: z.string().uuid(),
  assigned_to: z.string().uuid(),
  task_type: z.enum(['cultivation', 'quality_control', 'maintenance', 'harvest']),
  sop_id: z.string().uuid().optional(),
  plant_ids: z.array(z.string().uuid()).optional(),
  batch_id: z.string().uuid().optional(),
  zone_id: z.string().uuid().optional(),
  estimated_duration: z.string(),
  actual_duration: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['assigned', 'in_progress', 'completed', 'cancelled']),
  description: z.string(),
  special_instructions: z.string().optional(),
  required_equipment: z.array(z.string()).optional(),
  scheduled_start: z.date().optional(),
  deadline: z.date().optional(),
  created_at: z.date(),
  updated_at: z.date()
});

// Типы из схем
export type CreateTaskRequest = z.infer<typeof CreateTaskRequestSchema>;
export type WorkTask = z.infer<typeof WorkTaskSchema>;
export type CreateTaskResponse = ApiResponse<WorkTask>;
```

### Task Update

**Эндпоинт**: `PUT /api/workforce/tasks/:id/status`  
**Источник**: `docs/validation/DS.md`

```typescript
import { z } from 'zod';

// Схема параметров
const UpdateTaskStatusParamsSchema = z.object({
  id: z.string().uuid()
});

// Схема материала
const MaterialUsageSchema = z.object({
  item: z.string(),
  quantity: z.number().positive(),
  unit: z.string()
});

// Схема результатов проверки качества
const QualityCheckResultsSchema = z.object({
  passed: z.boolean(),
  notes: z.string().optional(),
  photos: z.array(z.string().url()).optional()
});

// Схема использования ресурсов
const ResourceUsageSchema = z.object({
  materials: z.array(MaterialUsageSchema).optional(),
  equipment: z.array(z.string()).optional()
});

// Схема запроса обновления статуса задачи
const UpdateTaskStatusRequestSchema = z.object({
  status: z.enum(['assigned', 'in_progress', 'completed', 'cancelled']),
  actual_duration: z.string().describe('ISO 8601 duration').optional(),
  completion_notes: z.string().optional(),
  quality_check_results: QualityCheckResultsSchema.optional(),
  resource_usage: ResourceUsageSchema.optional()
});

// Типы из схем
export type UpdateTaskStatusParams = z.infer<typeof UpdateTaskStatusParamsSchema>;
export type MaterialUsage = z.infer<typeof MaterialUsageSchema>;
export type QualityCheckResults = z.infer<typeof QualityCheckResultsSchema>;
export type ResourceUsage = z.infer<typeof ResourceUsageSchema>;
export type UpdateTaskStatusRequest = z.infer<typeof UpdateTaskStatusRequestSchema>;
export type UpdateTaskStatusResponse = ApiResponse<WorkTask>;
```

## 🔍 Audit & Compliance DTOs

### Audit Trail Query

**Эндпоинт**: `GET /api/audit/trail`  
**Источник**: `docs/validation/DS.md`

```typescript
import { z } from 'zod';

// Схема запроса аудит-трейла (только для аудиторов)
const AuditTrailQueryRequestSchema = PaginationRequestSchema.extend({
  table_name: z.string().optional(),
  record_id: z.string().optional(),
  operation: z.enum(['INSERT', 'UPDATE', 'DELETE']).optional(),
  changed_by: z.string().uuid().optional(),
  from_date: z.date().optional(),
  to_date: z.date().optional(),
  session_id: z.string().optional(),
  include_sensitive: z.boolean().default(false)
});

// Схема записи аудит-трейла
const AuditTrailEntrySchema = z.object({
  audit_id: z.string().uuid(),
  table_name: z.string(),
  record_id: z.string(),
  operation: z.enum(['INSERT', 'UPDATE', 'DELETE']),
  old_values: z.record(z.unknown()).optional(),
  new_values: z.record(z.unknown()).optional(),
  changed_by: z.string().uuid(),
  changed_at: z.date(),
  session_id: z.string(),
  ip_address: z.string().ip(),
  user_agent: z.string().optional(),
  watermark: z.string().optional()
});

// Типы из схем
export type AuditTrailQueryRequest = z.infer<typeof AuditTrailQueryRequestSchema>;
export type AuditTrailEntry = z.infer<typeof AuditTrailEntrySchema>;
export type AuditTrailQueryResponse = PaginatedResponse<AuditTrailEntry>;
```

### Generate Compliance Report

**Эндпоинт**: `POST /api/compliance/reports`  
**Источник**: `docs/sop/SOP_ExternalIntegrations.md`

```typescript
import { z } from 'zod';

// Схема диапазона дат
const DateRangeSchema = z.object({
  from: z.date(),
  to: z.date()
});

// Схема области отчёта
const ReportScopeSchema = z.object({
  batch_ids: z.array(z.string().uuid()).optional(),
  zone_ids: z.array(z.string().uuid()).optional(),
  date_range: DateRangeSchema
});

// Схема информации о получателе
const RecipientInfoSchema = z.object({
  name: z.string(),
  organization: z.string(),
  purpose: z.string()
});

// Схема запроса генерации отчёта о соответствии
const ComplianceReportRequestSchema = z.object({
  report_type: z.enum(['batch_history', 'facility_audit', 'quality_control', 'full_compliance']),
  scope: ReportScopeSchema,
  format: z.enum(['pdf', 'excel', 'json']),
  include_photos: z.boolean().default(false),
  include_audit_trail: z.boolean().default(true),
  watermark_text: z.string().optional(),
  recipient_info: RecipientInfoSchema.optional()
});

// Схема задания отчёта
const ReportJobSchema = z.object({
  job_id: z.string().uuid(),
  status: z.enum(['queued', 'processing', 'completed', 'failed']),
  progress_percentage: z.number().min(0).max(100),
  estimated_completion: z.date().optional(),
  download_url: z.string().url().optional(),
  expires_at: z.date().optional()
});

// Типы из схем
export type DateRange = z.infer<typeof DateRangeSchema>;
export type ReportScope = z.infer<typeof ReportScopeSchema>;
export type RecipientInfo = z.infer<typeof RecipientInfoSchema>;
export type ComplianceReportRequest = z.infer<typeof ComplianceReportRequestSchema>;
export type ReportJob = z.infer<typeof ReportJobSchema>;
export type ComplianceReportResponse = ApiResponse<ReportJob>;
```

---

## 📝 Статус конвертации

✅ **Полная конвертация завершена (100% Zod)**:

- Common Patterns (ApiResponse, Pagination)
- Plants API (Plant CRUD, Measurements)
- IoT & Sensors API (List, Readings, Record)
- Spatial & Facility API (Racks, Trays, Placement)
- Financial API (Transactions, Biological Assets)
- Workforce API (Tasks, Assignments)
- Audit & Compliance (Audit Trail, Reports)

> ✅ **Все интерфейсы заменены на Zod-схемы**
> 🎯 **Schema-first API design** полностью внедрён
> 🛡️ **Runtime validation** из коробки для всех DTO

---

**Последнее обновление**: 2025-10-15  
**Источники**: docs/CONTRACT_SPECIFICATIONS.md, docs/validation/DS.md, docs/services/spatial-addressing-service-v2.md
