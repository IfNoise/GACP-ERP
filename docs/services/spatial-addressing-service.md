# Спецификация Сервиса Пространственной Адресации (Spatial Addressing Service)

## Обзор

Сервис Пространственной Адресации обеспечивает единую систему идентификации, локализации и отслеживания всех сущностей на ферме каннабиса. Система поддерживает многоуровневую иерархию помещений, QR-кодовое отслеживание и полную историю перемещений для соответствия требованиям GACP/GMP.

## Цели Системы

- **Сквозная адресация**: Унифицированная система адресации для всех сущностей от растений до готовой продукции
- **Иерархическая структура**: Многоуровневая система зданий, этажей, комнат, зон и позиций
- **Отслеживание в реальном времени**: Мгновенное обновление позиций через QR-коды и ручной ввод
- **Соответствие требованиям**: Полная трассируемость для GACP/GMP соответствия
- **Интеграция с BMS**: Связь с системами мониторинга окружающей среды

## Архитектура Системы

### 1. Иерархическая Структура Адресации

```typescript
interface SpatialAddress {
  facility: string;      // Код объекта (F001)
  building?: string;     // Здание (B001)  
  floor?: string;        // Этаж (L01)
  room: string;          // Комната (R001)
  zone?: string;         // Зона (Z001)
  position?: string;     // Позиция (P001)
  entityType: string;    // Тип сущности (PLT, EQP, STG)
  entityId: string;      // ID сущности
}

// Формат адреса: F001.B001.L01.R001.Z001.P001.PLT.12345
```

### 2. Модель Сущности Фермы

```typescript
interface FarmEntity {
  id: string;                    // Уникальный UUID
  type: EntityType;              // Тип сущности
  spatialAddress: SpatialAddress; // Иерархический адрес
  qrCode?: string;               // QR-код для отслеживания
  coordinates: Coordinates3D;     // Локальные координаты
  metadata: EntityMetadata;       // Специфичные данные
  auditTrail: MovementHistory[];  // История перемещений
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
}

type EntityType = 
  | 'plant'           // Растение
  | 'equipment'       // Оборудование
  | 'storageUnit'     // Единица хранения
  | 'dryingUnit'      // Сушильная установка
  | 'finishedProduct' // Готовая продукция
  | 'operator'        // Оператор
  | 'drone'           // Дрон
  | 'sensor'          // Датчик
  | 'alert'           // Алерт
  | 'inventoryItem'   // Инвентарь
  | 'waste'           // Отходы
  | 'package'         // Упаковка
  | 'sample';         // Образец

interface Coordinates3D {
  x: number;          // Координата X (метры)
  y: number;          // Координата Y (метры) 
  z?: number;         // Координата Z (метры, опционально)
  rotation?: number;  // Поворот (градусы)
}

interface EntityMetadata {
  [key: string]: any;
  // Специфичные поля для разных типов:
  // - Растения: strain, plantDate, stage
  // - Оборудование: model, serialNumber, calibrationDate
  // - Продукция: batchId, weight, potency
}

interface MovementHistory {
  fromAddress?: SpatialAddress;
  toAddress: SpatialAddress;
  fromCoordinates?: Coordinates3D;
  toCoordinates: Coordinates3D;
  timestamp: Date;
  operatorId: string;
  reason: string;
  method: 'manual' | 'qr_scan' | 'system' | 'drone';
  notes?: string;
}
```

### 3. Модель Объекта

```typescript
interface Facility {
  id: string;
  code: string;           // F001
  name: string;
  address: PhysicalAddress;
  buildings: Building[];
  metadata: FacilityMetadata;
}

interface Building {
  id: string;
  code: string;           // B001
  name: string;
  facilityId: string;
  floors: Floor[];
  metadata: BuildingMetadata;
}

interface Floor {
  id: string;
  code: string;           // L01, L02, etc.
  level: number;          // 1, 2, -1 (подвал)
  buildingId: string;
  rooms: Room[];
  corridors: Corridor[];
  commonAreas: CommonArea[];
  metadata: FloorMetadata;
}

interface Room {
  id: string;
  code: string;           // R001
  name: string;
  type: RoomType;
  floorId: string;
  dimensions: RoomDimensions;
  zones: Zone[];
  positions: Position[];
  environmentalControls: EnvironmentalSystem[];
  metadata: RoomMetadata;
}

type RoomType = 
  | 'vegetation'      // Комната вегетации
  | 'flowering'       // Комната цветения
  | 'mother'          // Комната маточных растений
  | 'clone'           // Комната клонирования
  | 'drying'          // Комната сушки
  | 'curing'          // Комната пролечки
  | 'storage'         // Склад
  | 'processing'      // Обработка
  | 'packaging'       // Упаковка
  | 'qa_lab'          // Лаборатория QA
  | 'office'          // Офис
  | 'corridor'        // Коридор
  | 'utility'         // Подсобное помещение
  | 'security'        // Охрана
  | 'waste'           // Утилизация отходов
  | 'quarantine';     // Карантин

interface Zone {
  id: string;
  code: string;           // Z001
  name: string;
  type: ZoneType;
  roomId: string;
  boundaries: Polygon;    // Границы зоны
  capacity: ZoneCapacity;
  environmentalSettings: EnvironmentalSettings;
  metadata: ZoneMetadata;
}

type ZoneType = 
  | 'growing'         // Зона выращивания
  | 'storage'         // Зона хранения
  | 'processing'      // Зона обработки
  | 'quarantine'      // Карантинная зона
  | 'restricted'      // Ограниченная зона
  | 'maintenance'     // Техническая зона
  | 'access_control'; // Зона контроля доступа

interface Position {
  id: string;
  code: string;           // P001
  zoneId?: string;
  coordinates: Coordinates3D;
  capacity: PositionCapacity;
  occupiedBy?: string[];  // ID сущностей
  metadata: PositionMetadata;
}
```

## API Спецификация

### Основные Операции

#### 1. Управление Сущностями

```typescript
// Создание сущности
POST /api/spatial/entities
{
  type: EntityType;
  spatialAddress: SpatialAddress;
  coordinates: Coordinates3D;
  metadata: EntityMetadata;
  qrCode?: string;
}

// Получение сущности
GET /api/spatial/entities/{id}

// Обновление позиции
PUT /api/spatial/entities/{id}/position
{
  newSpatialAddress: SpatialAddress;
  newCoordinates: Coordinates3D;
  reason: string;
  method: 'manual' | 'qr_scan' | 'system' | 'drone';
}

// Поиск сущностей
GET /api/spatial/entities
?type={EntityType}
&facility={facilityCode}
&building={buildingCode} 
&room={roomCode}
&zone={zoneCode}

// История перемещений
GET /api/spatial/entities/{id}/history
?from={date}
&to={date}
```

#### 2. Управление Структурой

```typescript
// Создание комнаты
POST /api/spatial/rooms
{
  code: string;
  name: string;
  type: RoomType;
  floorId: string;
  dimensions: RoomDimensions;
}

// Создание зоны
POST /api/spatial/zones
{
  code: string;
  name: string;
  type: ZoneType;
  roomId: string;
  boundaries: Polygon;
}

// Создание позиции
POST /api/spatial/positions
{
  code: string;
  zoneId?: string;
  coordinates: Coordinates3D;
  capacity: PositionCapacity;
}
```

#### 3. QR-код Операции

```typescript
// Сканирование QR-кода
POST /api/spatial/qr/scan
{
  qrCode: string;
  operatorId: string;
  newPosition?: {
    spatialAddress: SpatialAddress;
    coordinates: Coordinates3D;
  };
}

// Генерация QR-кода
POST /api/spatial/qr/generate
{
  entityId: string;
  format: 'url' | 'json' | 'simple';
}

// Печать этикеток
POST /api/spatial/qr/labels
{
  entityIds: string[];
  templateId: string;
  printerSettings: PrinterSettings;
}
```

#### 4. Поиск и Навигация

```typescript
// Поиск ближайших сущностей
GET /api/spatial/nearby
?coordinates={x,y,z}
&radius={meters}
&types={EntityType[]}

// Расчет маршрута
POST /api/spatial/route
{
  from: Coordinates3D;
  to: Coordinates3D;
  constraints?: RouteConstraints;
}

// Проверка занятости зоны
GET /api/spatial/zones/{zoneId}/occupancy

// Доступные позиции
GET /api/spatial/positions/available
?zoneId={zoneId}
&entityType={EntityType}
```

## Интеграция с Другими Системами

### 1. Сервис 3D Визуализации

```typescript
interface Spatial3DIntegration {
  // Получение 3D карты объекта
  get3DMap(facilityId: string): Promise<FacilityMap3D>;
  
  // Обновление позиций в реальном времени
  subscribeToUpdates(callback: (update: EntityUpdate) => void): void;
  
  // Рендеринг сущностей в 3D
  renderEntities(entities: FarmEntity[]): Three.Object3D[];
}
```

### 2. Система Контроля Доступа (SCUD)

```typescript
interface SCUDIntegration {
  // Проверка разрешений доступа
  checkAccess(operatorId: string, zoneId: string): Promise<boolean>;
  
  // Лог входа в зону
  logZoneEntry(operatorId: string, zoneId: string): Promise<void>;
  
  // Получение разрешенных зон
  getAllowedZones(operatorId: string): Promise<Zone[]>;
}
```

### 3. Система Мониторинга BMS

```typescript
interface BMSIntegration {
  // Получение данных окружения для позиции
  getEnvironmentalData(coordinates: Coordinates3D): Promise<EnvironmentalData>;
  
  // Связывание датчиков с позициями
  associateSensors(positionId: string, sensorIds: string[]): Promise<void>;
  
  // Алерты на основе позиции
  createLocationBasedAlert(alert: LocationAlert): Promise<void>;
}
```

### 4. Inventory Management System

```typescript
interface InventoryIntegration {
  // Обновление инвентаря при перемещении
  updateInventoryLocation(itemId: string, newLocation: SpatialAddress): Promise<void>;
  
  // Получение инвентаря по локации
  getInventoryByLocation(spatialAddress: SpatialAddress): Promise<InventoryItem[]>;
  
  // Резервирование позиций
  reservePositions(positionIds: string[], reservedBy: string): Promise<void>;
}
```

## Структура Базы Данных

### PostgreSQL + PostGIS Схема

```sql
-- Основная таблица сущностей
CREATE TABLE farm_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    spatial_address JSONB NOT NULL,
    qr_code VARCHAR(255) UNIQUE,
    coordinates GEOMETRY(POINTZ, 4326),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    last_modified_by UUID REFERENCES users(id)
);

-- История перемещений
CREATE TABLE movement_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID REFERENCES farm_entities(id),
    from_address JSONB,
    to_address JSONB NOT NULL,
    from_coordinates GEOMETRY(POINTZ, 4326),
    to_coordinates GEOMETRY(POINTZ, 4326) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    operator_id UUID REFERENCES users(id),
    reason TEXT NOT NULL,
    method VARCHAR(20) DEFAULT 'manual',
    notes TEXT
);

-- Объекты
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Здания
CREATE TABLE buildings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    facility_id UUID REFERENCES facilities(id),
    metadata JSONB,
    UNIQUE(facility_id, code)
);

-- Этажи
CREATE TABLE floors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL,
    level INTEGER NOT NULL,
    building_id UUID REFERENCES buildings(id),
    metadata JSONB,
    UNIQUE(building_id, code)
);

-- Комнаты
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    floor_id UUID REFERENCES floors(id),
    dimensions JSONB,
    metadata JSONB,
    UNIQUE(floor_id, code)
);

-- Зоны
CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    room_id UUID REFERENCES rooms(id),
    boundaries GEOMETRY(POLYGON, 4326),
    capacity JSONB,
    environmental_settings JSONB,
    metadata JSONB,
    UNIQUE(room_id, code)
);

-- Позиции
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL,
    zone_id UUID REFERENCES zones(id),
    coordinates GEOMETRY(POINTZ, 4326) NOT NULL,
    capacity JSONB,
    metadata JSONB,
    UNIQUE(zone_id, code)
);

-- Индексы для производительности
CREATE INDEX idx_farm_entities_type ON farm_entities(type);
CREATE INDEX idx_farm_entities_spatial_address ON farm_entities USING GIN(spatial_address);
CREATE INDEX idx_farm_entities_coordinates ON farm_entities USING GIST(coordinates);
CREATE INDEX idx_farm_entities_qr_code ON farm_entities(qr_code);
CREATE INDEX idx_movement_history_entity_id ON movement_history(entity_id);
CREATE INDEX idx_movement_history_timestamp ON movement_history(timestamp);
```

## Схемы Валидации (Zod)

```typescript
import { z } from 'zod';

export const Coordinates3DSchema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number().optional(),
  rotation: z.number().optional()
});

export const SpatialAddressSchema = z.object({
  facility: z.string(),
  building: z.string().optional(),
  floor: z.string().optional(),
  room: z.string(),
  zone: z.string().optional(),
  position: z.string().optional(),
  entityType: z.string(),
  entityId: z.string()
});

export const EntityTypeSchema = z.enum([
  'plant', 'equipment', 'storageUnit', 'dryingUnit', 'finishedProduct',
  'operator', 'drone', 'sensor', 'alert', 'inventoryItem', 'waste',
  'package', 'sample'
]);

export const FarmEntitySchema = z.object({
  id: z.string().uuid(),
  type: EntityTypeSchema,
  spatialAddress: SpatialAddressSchema,
  qrCode: z.string().optional(),
  coordinates: Coordinates3DSchema,
  metadata: z.record(z.any()),
  auditTrail: z.array(z.object({
    fromAddress: SpatialAddressSchema.optional(),
    toAddress: SpatialAddressSchema,
    fromCoordinates: Coordinates3DSchema.optional(),
    toCoordinates: Coordinates3DSchema,
    timestamp: z.date(),
    operatorId: z.string(),
    reason: z.string(),
    method: z.enum(['manual', 'qr_scan', 'system', 'drone']),
    notes: z.string().optional()
  })),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  lastModifiedBy: z.string()
});

export const RoomTypeSchema = z.enum([
  'vegetation', 'flowering', 'mother', 'clone', 'drying', 'curing',
  'storage', 'processing', 'packaging', 'qa_lab', 'office', 'corridor',
  'utility', 'security', 'waste', 'quarantine'
]);

export const ZoneTypeSchema = z.enum([
  'growing', 'storage', 'processing', 'quarantine', 'restricted',
  'maintenance', 'access_control'
]);
```

## Примеры Использования

### 1. Регистрация Нового Растения

```typescript
const plant: FarmEntity = {
  id: generateUUID(),
  type: 'plant',
  spatialAddress: {
    facility: 'F001',
    building: 'B001',
    floor: 'L01',
    room: 'R001',
    zone: 'Z001',
    position: 'P045',
    entityType: 'PLT',
    entityId: 'PLT001234'
  },
  coordinates: { x: 12.5, y: 8.3, z: 1.2 },
  metadata: {
    strain: 'Purple Haze',
    plantDate: '2024-01-15',
    stage: 'vegetative',
    batchId: 'B20240115001'
  },
  qrCode: generateQRCode('PLT001234'),
  auditTrail: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'operator123',
  lastModifiedBy: 'operator123'
};

await spatialService.createEntity(plant);
```

### 2. Перемещение через QR-код

```typescript
const scanResult = await spatialService.scanQRCode({
  qrCode: 'PLT001234',
  operatorId: 'OP001',
  newPosition: {
    spatialAddress: {
      facility: 'F001',
      building: 'B001', 
      floor: 'L01',
      room: 'R002',
      zone: 'Z003',
      position: 'P012',
      entityType: 'PLT',
      entityId: 'PLT001234'
    },
    coordinates: { x: 5.2, y: 3.8, z: 1.2 }
  }
});
```

### 3. Поиск Сущностей по Локации

```typescript
const entitiesInRoom = await spatialService.findEntities({
  facility: 'F001',
  room: 'R001'
});

const plantsInZone = await spatialService.findEntities({
  facility: 'F001',
  room: 'R001',
  zone: 'Z001',
  type: 'plant'
});
```

### 4. История Перемещений

```typescript
const history = await spatialService.getMovementHistory('PLT001234', {
  from: new Date('2024-01-01'),
  to: new Date('2024-01-31')
});

// Восстановление состояния на определенную дату
const stateAt = await spatialService.getStateAtDate(
  new Date('2024-01-15T10:00:00Z')
);
```

## Требования к Производительности

- **Время отклика API**: < 100ms для основных операций
- **Пропускная способность**: 1000+ операций/сек
- **Поиск по координатам**: < 50ms для радиуса до 100м
- **QR-код сканирование**: < 200ms от сканирования до обновления
- **Исторические запросы**: < 500ms для периода до 1 года

## Требования к Безопасности

- **Аутентификация**: Все операции требуют валидного JWT токена
- **Авторизация**: RBAC проверки для доступа к зонам
- **Аудит**: Все изменения логируются с ID оператора
- **Шифрование**: TLS 1.3 для всех API вызовов
- **Валидация**: Все входные данные валидируются через Zod схемы

## Планы Развития

### Фаза 1 (Базовая функциональность)

- Основные CRUD операции для сущностей
- QR-код сканирование и отслеживание
- Базовый поиск и фильтрация
- Интеграция с PostgreSQL + PostGIS

### Фаза 2 (Расширенные возможности)

- Автоматическое обнаружение позиций
- Продвинутая аналитика перемещений
- Интеграция с IoT датчиками
- Машинное обучение для оптимизации размещения

### Фаза 3 (AI и Автоматизация)

- Автоматическое планирование размещения
- Предиктивная аналитика
- Интеграция с дронами
- Автоматизированное управление inventory

## Заключение

Сервис Пространственной Адресации является основополагающим компонентом GACP-ERP системы, обеспечивающим точное отслеживание и управление всеми сущностями фермы каннабиса. Система разработана с учетом требований масштабируемости, производительности и соответствия нормативным требованиям GACP/GMP.