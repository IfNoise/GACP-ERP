# Entities (Сущности)

Основные сущности и их структуры в GACP-ERP системе.

## 🌱 Plant Entities

### PlantEntity

**Описание**: Основная сущность растения

| Поле           | Тип               | Описание                  | Обязательное |
| -------------- | ----------------- | ------------------------- | ------------ |
| `id`           | UUID              | Уникальный идентификатор  | ✅           |
| `plant_code`   | string(20)        | Код растения              | ✅           |
| `strain_id`    | UUID              | Сорт растения             | ✅           |
| `stage`        | PlantStage        | Стадия роста              | ✅           |
| `health_score` | number(0-100)     | Оценка здоровья           | ✅           |
| `location`     | LocationData      | Местоположение            | ✅           |
| `tray_id`      | UUID              | ID лотка                  | ❌           |
| `slot_index`   | number            | Индекс слота в лотке      | ❌           |
| `visual_stage` | PlantVisualConfig | Конфигурация визуализации | ❌           |

### PlantData

**Описание**: Детальные данные растения  
**Источник**: `docs/services/frontend-entity-system.md`

| Поле              | Тип    | Описание                 | Обязательное |
| ----------------- | ------ | ------------------------ | ------------ |
| `strain`          | string | Сорт растения            | ✅           |
| `genetics`        | string | Генетическая информация  | ✅           |
| `plantedDate`     | Date   | Дата посадки             | ✅           |
| `expectedHarvest` | Date   | Ожидаемая дата сбора     | ❌           |
| `cycleId`         | string | ID цикла выращивания     | ✅           |
| `batchId`         | string | ID партии                | ✅           |
| `motherPlantId`   | string | ID материнского растения | ❌           |

### PlantSpatialData

**Описание**: Пространственные данные растения  
**Источник**: `docs/services/spatial-addressing-service-v2.md`

| Поле               | Тип                | Описание                  | Обязательное |
| ------------------ | ------------------ | ------------------------- | ------------ |
| `id`               | string             | Уникальный идентификатор  | ✅           |
| `strain`           | string             | Сорт                      | ✅           |
| `stage`            | PlantStage         | Стадия роста              | ✅           |
| `trayId`           | string             | ID лотка                  | ✅           |
| `positionIndex`    | number             | Индекс позиции            | ✅           |
| `spatialAddress`   | string             | Пространственный адрес    | ✅           |
| `coordinates`      | SpatialCoordinates | Координаты                | ✅           |
| `spaceRequirement` | SpaceRequirement   | Требования к пространству | ✅           |
| `qrCode`           | string             | QR код                    | ✅           |

### SpaceRequirement

**Описание**: Требования растения к пространству  
**Источник**: `docs/services/spatial-addressing-service-v2.md`

| Поле              | Тип        | Описание           | Единицы |
| ----------------- | ---------- | ------------------ | ------- |
| `radius`          | number     | Необходимый радиус | см      |
| `height`          | number     | Текущая высота     | см      |
| `projectedGrowth` | number     | Ожидаемый размер   | см      |
| `stage`           | PlantStage | Стадия роста       | -       |

## 🏭 Facility Entities

### FacilityEntity

**Описание**: Производственный объект  
**Источник**: `docs/services/spatial-addressing-service-v2.md`

| Поле           | Тип                 | Описание                 | Обязательное |
| -------------- | ------------------- | ------------------------ | ------------ |
| `id`           | string              | Уникальный идентификатор | ✅           |
| `entityType`   | EntityType.FACILITY | Тип сущности             | ✅           |
| `facilityCode` | string              | Код объекта              | ✅           |
| `name`         | string              | Название                 | ✅           |
| `address`      | string              | Физический адрес         | ✅           |
| `coordinates`  | SpatialCoordinates  | GPS координаты           | ✅           |
| `dimensions`   | EntityDimensions    | Размеры здания           | ✅           |
| `zones`        | string[]            | Список зон               | ✅           |

### ZoneEntity

**Описание**: Зона в объекте  
**Источник**: `docs/services/frontend-entity-system.md`

| Поле          | Тип             | Описание                 | Обязательное |
| ------------- | --------------- | ------------------------ | ------------ |
| `id`          | string          | Уникальный идентификатор | ✅           |
| `type`        | EntityType.ZONE | Тип сущности             | ✅           |
| `zoneData`    | ZoneData        | Данные зоны              | ✅           |
| `environment` | ZoneEnvironment | Условия окружающей среды | ✅           |
| `capacity`    | ZoneCapacity    | Вместимость              | ✅           |
| `compliance`  | ZoneCompliance  | Соответствие требованиям | ✅           |

### ZoneData

**Описание**: Основные данные зоны  
**Источник**: `docs/services/frontend-entity-system.md`

| Поле          | Тип         | Описание        | Единицы |
| ------------- | ----------- | --------------- | ------- |
| `zoneCode`    | string      | Код зоны        | -       |
| `zoneType`    | ZoneType    | Тип зоны        | -       |
| `name`        | string      | Название        | -       |
| `description` | string      | Описание        | -       |
| `area`        | number      | Площадь         | м²      |
| `volume`      | number      | Объём           | м³      |
| `accessLevel` | AccessLevel | Уровень доступа | -       |

### ZoneEnvironment

**Описание**: Условия окружающей среды в зоне  
**Источник**: `docs/services/frontend-entity-system.md`

| Поле                  | Тип             | Описание            | Единицы |
| --------------------- | --------------- | ------------------- | ------- |
| `temperature.current` | number          | Текущая температура | °C      |
| `temperature.target`  | number          | Целевая температура | °C      |
| `temperature.status`  | ThresholdStatus | Статус температуры  | -       |
| `humidity.current`    | number          | Текущая влажность   | %       |
| `humidity.target`     | number          | Целевая влажность   | %       |
| `humidity.status`     | ThresholdStatus | Статус влажности    | -       |

### ZoneCapacity

**Описание**: Вместимость зоны  
**Источник**: `docs/services/frontend-entity-system.md`

| Поле              | Тип    | Описание                      | Обязательное |
| ----------------- | ------ | ----------------------------- | ------------ |
| `maxRacks`        | number | Максимум стеллажей            | ✅           |
| `currentRacks`    | number | Текущее количество стеллажей  | ✅           |
| `maxPlants`       | number | Максимум растений             | ✅           |
| `currentPlants`   | number | Текущее количество растений   | ✅           |
| `utilizationRate` | number | Коэффициент использования (%) | ✅           |

### RackEntity

**Описание**: Стеллаж  
**Источник**: `docs/services/frontend-entity-system.md`

| Поле            | Тип               | Описание                 | Обязательное |
| --------------- | ----------------- | ------------------------ | ------------ |
| `id`            | string            | Уникальный идентификатор | ✅           |
| `type`          | EntityType.RACK   | Тип сущности             | ✅           |
| `rackData`      | RackData          | Данные стеллажа          | ✅           |
| `configuration` | RackConfiguration | Конфигурация             | ✅           |
| `shelves`       | ShelfEntity[]     | Полки                    | ✅           |
| `utilization`   | RackUtilization   | Использование            | ✅           |

### RackData

**Описание**: Основные данные стеллажа  
**Источник**: `docs/services/frontend-entity-system.md`

| Поле               | Тип      | Описание       | Обязательное |
| ------------------ | -------- | -------------- | ------------ |
| `rackCode`         | string   | Код стеллажа   | ✅           |
| `rackType`         | RackType | Тип стеллажа   | ✅           |
| `installationDate` | Date     | Дата установки | ✅           |
| `manufacturer`     | string   | Производитель  | ❌           |
| `model`            | string   | Модель         | ❌           |
| `serialNumber`     | string   | Серийный номер | ❌           |
| `lastMaintenance`  | Date     | Последнее ТО   | ❌           |

### RackConfiguration

**Описание**: Конфигурация стеллажа  
**Источник**: `docs/services/frontend-entity-system.md`

| Поле                 | Тип        | Описание                      | Единицы |
| -------------------- | ---------- | ----------------------------- | ------- |
| `shelfCount`         | number     | Количество полок              | шт      |
| `shelfSpacing`       | number     | Расстояние между полками      | см      |
| `maxTrayCapacity`    | number     | Максимум лотков на полку      | шт      |
| `supportedTraySizes` | TraySize[] | Поддерживаемые размеры лотков | -       |
| `weightCapacity`     | number     | Грузоподъёмность              | кг      |
| `powerSupply`        | boolean    | Наличие питания               | -       |
| `irrigationSupport`  | boolean    | Поддержка орошения            | -       |

### TrayEntity

**Описание**: Лоток для растений  
**Источник**: `docs/services/frontend-entity-system.md`

| Поле        | Тип             | Описание                 | Обязательное |
| ----------- | --------------- | ------------------------ | ------------ |
| `id`        | string          | Уникальный идентификатор | ✅           |
| `type`      | EntityType.TRAY | Тип сущности             | ✅           |
| `trayData`  | TrayData        | Данные лотка             | ✅           |
| `plants`    | PlantEntity[]   | Растения                 | ✅           |
| `layout`    | TrayLayout      | Схема размещения         | ✅           |
| `occupancy` | TrayOccupancy   | Заполненность            | ✅           |

### TrayData

**Описание**: Основные данные лотка  
**Источник**: `docs/services/frontend-entity-system.md`

| Поле              | Тип          | Описание          | Обязательное |
| ----------------- | ------------ | ----------------- | ------------ |
| `trayCode`        | string       | Код лотка         | ✅           |
| `size`            | TraySize     | Размер            | ✅           |
| `material`        | TrayMaterial | Материал          | ✅           |
| `acquisitionDate` | Date         | Дата приобретения | ✅           |
| `rackId`          | string       | ID стеллажа       | ✅           |
| `shelfIndex`      | number       | Индекс полки      | ✅           |
| `positionIndex`   | number       | Индекс позиции    | ✅           |

### TrayLayout

**Описание**: Схема размещения в лотке  
**Источник**: `docs/services/frontend-entity-system.md`

| Поле             | Тип             | Описание                    | Единицы |
| ---------------- | --------------- | --------------------------- | ------- |
| `rows`           | number          | Количество рядов            | шт      |
| `columns`        | number          | Количество колонок          | шт      |
| `spacing`        | number          | Расстояние между растениями | см      |
| `pattern`        | LayoutPattern   | Шаблон размещения           | -       |
| `plantPositions` | PlantPosition[] | Позиции растений            | -       |

## ⚙️ Equipment Entities

### EquipmentEntity

**Описание**: Оборудование  
**Источник**: `docs/services/frontend-entity-system.md`

| Поле                | Тип                  | Описание                 | Обязательное |
| ------------------- | -------------------- | ------------------------ | ------------ |
| `id`                | string               | Уникальный идентификатор | ✅           |
| `type`              | EntityType.EQUIPMENT | Тип сущности             | ✅           |
| `equipmentData`     | EquipmentData        | Данные оборудования      | ✅           |
| `operationalStatus` | OperationalStatus    | Операционный статус      | ✅           |
| `monitoring`        | EquipmentMonitoring  | Мониторинг               | ✅           |

### EquipmentData

**Описание**: Данные оборудования  
**Источник**: `docs/services/frontend-entity-system.md`

| Поле               | Тип            | Описание                   | Обязательное |
| ------------------ | -------------- | -------------------------- | ------------ |
| `equipmentCode`    | string         | Код оборудования           | ✅           |
| `equipmentType`    | EquipmentType  | Тип оборудования           | ✅           |
| `manufacturer`     | string         | Производитель              | ✅           |
| `model`            | string         | Модель                     | ✅           |
| `serialNumber`     | string         | Серийный номер             | ✅           |
| `installationDate` | Date           | Дата установки             | ✅           |
| `specifications`   | EquipmentSpecs | Технические характеристики | ✅           |

### OperationalStatus

**Описание**: Операционный статус оборудования  
**Источник**: `docs/services/frontend-entity-system.md`

| Поле              | Тип                 | Описание           | Обязательное |
| ----------------- | ------------------- | ------------------ | ------------ |
| `status`          | EquipmentStatus     | Текущий статус     | ✅           |
| `powerState`      | PowerState          | Состояние питания  | ✅           |
| `currentSettings` | Record<string, any> | Текущие настройки  | ✅           |
| `lastOperation`   | Date                | Последняя операция | ✅           |
| `operatingHours`  | number              | Часы работы        | ✅           |
| `efficiency`      | number              | Эффективность (%)  | ✅           |

## 📊 Sensor Entities

### SensorEntity

**Описание**: Сенсор мониторинга  
**Источник**: `docs/services/frontend-entity-system.md`

| Поле             | Тип                 | Описание                 | Обязательное |
| ---------------- | ------------------- | ------------------------ | ------------ |
| `id`             | string              | Уникальный идентификатор | ✅           |
| `type`           | EntityType.SENSOR   | Тип сущности             | ✅           |
| `sensorData`     | SensorData          | Данные сенсора           | ✅           |
| `currentReading` | SensorReading       | Текущие показания        | ✅           |
| `visualization`  | SensorVisualization | Визуализация             | ✅           |
| `calibration`    | SensorCalibration   | Калибровка               | ✅           |

### SensorData

**Описание**: Данные сенсора  
**Источник**: `docs/services/frontend-entity-system.md`

| Поле               | Тип              | Описание           | Обязательное |
| ------------------ | ---------------- | ------------------ | ------------ |
| `sensorCode`       | string           | Код сенсора        | ✅           |
| `sensorType`       | SensorType       | Тип сенсора        | ✅           |
| `manufacturer`     | string           | Производитель      | ✅           |
| `model`            | string           | Модель             | ✅           |
| `serialNumber`     | string           | Серийный номер     | ✅           |
| `installationDate` | Date             | Дата установки     | ✅           |
| `measurementRange` | MeasurementRange | Диапазон измерений | ✅           |

### SensorReading

**Описание**: Показания сенсора  
**Источник**: `docs/services/frontend-entity-system.md`

| Поле        | Тип             | Описание           | Обязательное |
| ----------- | --------------- | ------------------ | ------------ |
| `value`     | number          | Значение           | ✅           |
| `unit`      | string          | Единица измерения  | ✅           |
| `timestamp` | Date            | Временная метка    | ✅           |
| `quality`   | ReadingQuality  | Качество показания | ✅           |
| `threshold` | ThresholdStatus | Статус порога      | ✅           |

## 📐 Common Types

### Vector3

**Описание**: 3D координаты  
**Источник**: `docs/services/frontend-entity-system.md`

```typescript
type Vector3 = [number, number, number]; // [x, y, z]
```

### SpatialCoordinates

**Описание**: Пространственные координаты  
**Источник**: `docs/services/spatial-addressing-service-v2.md`

| Поле | Тип    | Описание     | Единицы |
| ---- | ------ | ------------ | ------- |
| `x`  | number | Координата X | м       |
| `y`  | number | Координата Y | м       |
| `z`  | number | Координата Z | м       |

### EntityDimensions

**Описание**: Размеры сущности  
**Источник**: `docs/services/spatial-addressing-service-v2.md`

| Поле     | Тип    | Описание | Единицы |
| -------- | ------ | -------- | ------- |
| `width`  | number | Ширина   | м       |
| `height` | number | Высота   | м       |
| `depth`  | number | Глубина  | м       |

### PlantPosition

**Описание**: Позиция растения в лотке  
**Источник**: `docs/services/frontend-entity-system.md`

| Поле          | Тип          | Описание                      | Обязательное |
| ------------- | ------------ | ----------------------------- | ------------ |
| `index`       | number       | Индекс позиции                | ✅           |
| `coordinates` | Vector3      | Координаты относительно лотка | ✅           |
| `occupied`    | boolean      | Занята ли позиция             | ✅           |
| `occupiedBy`  | string       | ID растения (если занято)     | ❌           |
| `reservedFor` | string       | Зарезервировано для           | ❌           |
| `suitableFor` | PlantStage[] | Подходящие стадии роста       | ✅           |

---

**Последнее обновление**: 2025-09-16  
**Источники**: Анализ документации GACP-ERP системы
