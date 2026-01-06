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

## 📋 Compliance Entities (DS v2.0)

### ChangeControl

**Описание**: Управление изменениями с GxP compliance  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - ChangeControlZodSchema`  
**Events**: `EVENT_ARCHITECTURE.md Section 9 (8 topics, 15 events)`

| Поле                    | Тип                     | Описание                                                                                              | Обязательное |
| ----------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------- | ------------ |
| `id` | UUID | Уникальный идентификатор change request | ✅ |
| `requestId` | string | Номер заявки (CR-YYYY-NNNN) | ✅ |
| `title` | string | Заголовок изменения | ✅ |
| `description` | string | Детальное описание | ✅ |
| `classification` | ChangeClassification | Critical/Major/Minor/Emergency | ✅ |
| `status` | ChangeStatus | draft/submitted/assessment/review/approved/rejected/implementation/verification/closed | ✅ |
| `requestedBy` | UserReference | Инициатор | ✅ |
| `impactAnalysis` | ImpactAnalysis | Оценка влияния | ✅ |
| `approvals` | ApprovalRecord[] | История утверждений | ✅ |
| `electronicSignatures` | ElectronicSignature[] | Электронные подписи (21 CFR Part 11) | ✅ |
| `auditTrail` | AuditTrailMetadata | ALCOA+ метаданные | ✅ |

**Related Entities**: CAPA, Deviation, Validation, Document

### CAPA

**Описание**: Corrective and Preventive Actions  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - CAPAZodSchema`  
**Events**: `EVENT_ARCHITECTURE.md Section 10 (6 topics, 12 events)`

| Поле                      | Тип                        | Описание                                                                                             | Обязательное |
| ------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------- | ------------ |
| `id`                 | UUID            | Уникальный идентификатор                                                                             | ✅           |
| `capaId`             | string          | Номер CAPA (CAPA-YYYY-NNNN)                                                                         | ✅           |
| `type`                    | 'corrective' \| 'preventive' | Тип действия                                                                                        | ✅           |
| `title`                   | string                     | Заголовок                                                                                            | ✅           |
| `description`             | string                     | Описание проблемы                                                                                    | ✅           |
| `status`                  | CAPAStatus                 | initiated/investigation/root_cause_identified/action_plan/implementation/effectiveness_check/closed  | ✅           |
| `priority`                | Priority                   | low/medium/high/critical                                                                             | ✅           |
| `sourceType`              | string                     | Источник (deviation, audit_finding, quality_event)                                                  | ✅           |
| `sourceId`                | UUID                       | ID источника                                                                                         | ❌           |
| `rootCauseAnalysis`       | RootCauseAnalysis          | Анализ первопричины (5 Why, Fishbone, etc.)                                                         | ✅           |
| `actions`                 | CAPAAction[]               | Корректирующие/предупреждающие действия                                                              | ✅           |
| `effectivenessCheck`      | EffectivenessCheck         | Проверка эффективности                                                                               | ❌           |
| `electronicSignatures`    | ElectronicSignature[]      | Электронные подписи                                                                                  | ✅           |
| `auditTrail`              | AuditTrailMetadata         | ALCOA+ метаданные                                                                                    | ✅           |

**Related Entities**: Deviation, ChangeControl, QualityEvent, Training

### Deviation

**Описание**: Управление отклонениями от установленных процедур  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - DeviationZodSchema`  
**Events**: `EVENT_ARCHITECTURE.md Section 11 (5 topics, 10 events)`

| Поле                    | Тип                       | Описание                                                   | Обязательное |
| ----------------------- | ------------------------- | ---------------------------------------------------------- | ------------ |
| `id`                    | UUID                      | Уникальный идентификатор                                   | ✅           |
| `deviationId`           | string                    | Номер отклонения (DEV-YYYY-NNNN)                           | ✅           |
| `title`                 | string                    | Заголовок                                                  | ✅           |
| `description`           | string                    | Описание отклонения                                        | ✅           |
| `classification`        | DeviationClassification   | critical/major/minor                                       | ✅           |
| `status`                | DeviationStatus           | reported/classified/investigation/impact_assessment/closed | ✅           |
| `reportedBy`            | UserReference             | Кто сообщил                                                | ✅           |
| `reportedDate`          | ISO8601DateTime           | Дата сообщения                                             | ✅           |
| `affectedProcess`       | string                    | Затронутый процесс                                         | ✅           |
| `affectedProducts`      | string[]                  | Затронутые продукты                                        | ❌           |
| `immediateActions`      | string                    | Немедленные действия                                       | ✅           |
| `investigation`         | Investigation             | Расследование                                              | ❌           |
| `impactAssessment`      | ImpactAssessment          | Оценка влияния на качество                                 | ✅           |
| `capaRequired`          | boolean                   | Требуется ли CAPA                                          | ✅           |
| `capaId`                | UUID                      | ID связанного CAPA                                         | ❌           |
| `electronicSignatures`  | ElectronicSignature[]     | Электронные подписи                                        | ✅           |
| `auditTrail`            | AuditTrailMetadata        | ALCOA+ метаданные                                          | ✅           |

**Related Entities**: CAPA, ChangeControl, QualityEvent

### Validation

**Описание**: Lifecycle управление валидацией систем (GAMP 5)  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - ValidationZodSchema`  
**Events**: `EVENT_ARCHITECTURE.md Section 12 (4 topics, 8 events)`

| Поле                    | Тип                      | Описание                                                                                 | Обязательное |
| ----------------------- | ------------------------ | ---------------------------------------------------------------------------------------- | ------------ |
| `id`                    | UUID                     | Уникальный идентификатор                                                                         | ✅           |
| `validationId`          | string                   | Номер валидации (VAL-YYYY-NNNN)                                                                  | ✅           |
| `title`                 | string                   | Название валидации                                                                               | ✅           |
| `type`                  | ValidationType           | IQ/OQ/PQ/revalidation                                                                            | ✅           |
| `system`                | string                   | Валидируемая система                                                                             | ✅           |
| `gampCategory`          | GAMPCategory             | 1/3/4/5 (GAMP 5 classification)                                                                  | ✅           |
| `status`                | ValidationStatus         | planning/protocol_draft/protocol_approved/execution/report_draft/report_approved/closed          | ✅           |
| `protocol`              | ValidationProtocol       | Протокол валидации                                                                               | ✅           |
| `testCases`             | ValidationTestCase[]     | Тест-кейсы                                                                                       | ✅           |
| `executionResults`      | ValidationResult[]       | Результаты выполнения                                                                            | ❌           |
| `deviations`            | ValidationDeviation[]    | Отклонения от протокола                                                                          | ❌           |
| `report`                | ValidationReport         | Отчёт о валидации                                                                                | ❌           |
| `electronicSignatures`  | ElectronicSignature[]    | Электронные подписи                                                                              | ✅           |
| `auditTrail`            | AuditTrailMetadata       | ALCOA+ метаданные                                                                                | ✅           |

**Related Entities**: ChangeControl, Document, QualityEvent

### QualityEvent

**Описание**: Управление качественными событиями  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - QualityEventZodSchema`  
**Events**: `EVENT_ARCHITECTURE.md Section 13 (3 topics, 6 events)`

| Поле                    | Тип                  | Описание                                                            | Обязательное |
| ----------------------- | -------------------- | ------------------------------------------------------------------- | ------------ |
| `id`                    | UUID                 | Уникальный идентификатор                                        | ✅           |
| `eventId`               | string               | Номер события (QE-YYYY-NNNN)                                    | ✅           |
| `type`                  | QualityEventType     | complaint/audit_finding/inspection_observation/quality_issue    | ✅           |
| `title`                 | string               | Заголовок                                                       | ✅           |
| `description`           | string               | Описание события                                                | ✅           |
| `severity`              | Severity             | low/medium/high/critical                                        | ✅           |
| `status`                | QualityEventStatus   | reported/investigation/action_plan/closed                       | ✅           |
| `reportedBy`            | UserReference        | Кто сообщил                                                     | ✅           |
| `reportedDate`          | ISO8601DateTime      | Дата сообщения                                                  | ✅           |
| `affectedAreas`         | string[]             | Затронутые области                                              | ✅           |
| `investigation`         | Investigation        | Расследование                                                   | ❌           |
| `linkedRecords`         | LinkedRecord[]       | Связанные записи (CAPA, Deviation, Change)                      | ❌           |
| `electronicSignatures`  | ElectronicSignature[]| Электронные подписи                                             | ✅           |
| `auditTrail`            | AuditTrailMetadata   | ALCOA+ метаданные                                               | ✅           |

**Related Entities**: CAPA, Deviation, ChangeControl, Training

### Training

**Описание**: Обучение и управление компетенциями  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - TrainingZodSchema`  
**Events**: `EVENT_ARCHITECTURE.md Section 14 (2 topics, 4 events)`

| Поле                    | Тип                   | Описание                       | Обязательное |
| ----------------------- | --------------------- | ------------------------------ | ------------ |
| `id`                    | UUID                  | Уникальный идентификатор           | ✅           |
| `trainingId`            | string                | Номер обучения (TRN-YYYY-NNNN)     | ✅           |
| `courseId`              | string                | ID курса (CUR-XXX)                 | ✅           |
| `userId`                | UUID                  | ID пользователя                    | ✅           |
| `status`                | TrainingStatus        | enrolled/in_progress/completed/expired | ✅       |
| `startDate`             | ISO8601DateTime       | Дата начала                        | ✅           |
| `completionDate`        | ISO8601DateTime       | Дата завершения                    | ❌           |
| `expirationDate`        | ISO8601DateTime       | Дата истечения сертификата         | ❌           |
| `score`                 | number                | Оценка (если экзамен)              | ❌           |
| `passingScore`          | number                | Проходной балл                     | ✅           |
| `attempts`              | number                | Количество попыток                 | ✅           |
| `certificateIssued`     | boolean               | Выдан ли сертификат                | ✅           |
| `electronicSignatures`  | ElectronicSignature[] | Электронные подписи                | ✅           |
| `auditTrail`            | AuditTrailMetadata    | ALCOA+ метаданные                  | ✅           |

**Related Entities**: User, QualityEvent, CAPA (для training gap CAPA)

### Document

**Описание**: Контроль документов с версионированием  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - DocumentZodSchema`  
**Events**: `EVENT_ARCHITECTURE.md Section 15 (1 topic, 3 events)`

| Поле                    | Тип                   | Описание                                              | Обязательное |
| ----------------------- | --------------------- | ----------------------------------------------------- | ------------ |
| `id`                    | UUID                  | Уникальный идентификатор                  | ✅           |
| `documentId`            | string                | Номер документа (DOC-XXX-YYYY-NNNN)       | ✅           |
| `title`                 | string                | Название                                  | ✅           |
| `type`                  | DocumentType          | SOP/protocol/report/form/policy           | ✅           |
| `version`               | string                | Версия (1.0, 2.0, etc.)                   | ✅           |
| `status`                | DocumentStatus        | draft/review/approved/obsolete/archived   | ✅           |
| `author`                | UserReference         | Автор                                     | ✅           |
| `approver`              | UserReference         | Утверждающий                              | ❌           |
| `effectiveDate`         | ISO8601DateTime       | Дата вступления в силу                    | ❌           |
| `reviewDate`            | ISO8601DateTime       | Дата следующего пересмотра                | ❌           |
| `edmsDocumentId`        | string                | ID в Mayan-EDMS                           | ✅           |
| `changeControlId`       | UUID                  | ID связанного Change Control              | ❌           |
| `electronicSignatures`  | ElectronicSignature[] | Электронные подписи                        | ✅           |
| `auditTrail`            | AuditTrailMetadata    | ALCOA+ метаданные                          | ✅           |

**Related Entities**: ChangeControl, Validation, Training

### Analytics

**Описание**: Метрики и аналитика compliance модулей  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - AnalyticsZodSchema`  
**Events**: `EVENT_ARCHITECTURE.md Section 16 (2 topics, 5 events)`

| Поле            | Тип                   | Описание                                                    | Обязательное |
| --------------- | --------------------- | ----------------------------------------------------------- | ------------ |
| `id`            | UUID                  | Уникальный идентификатор                                | ✅           |
| `metricType`    | string                | Тип метрики                                             | ✅           |
| `period`        | string                | Период (daily/weekly/monthly/quarterly)                 | ✅           |
| `startDate`     | ISO8601DateTime       | Начало периода                                          | ✅           |
| `endDate`       | ISO8601DateTime       | Конец периода                                           | ✅           |
| `module`        | string                | Модуль (change_control/capa/deviation/validation)       | ✅           |
| `metrics`       | Record<string, number>| Метрики                                                 | ✅           |
| `trends`        | TrendData[]           | Трендовые данные                                        | ❌           |
| `generatedBy`   | UserReference         | Кто сгенерировал                                        | ✅           |
| `generatedAt`   | ISO8601DateTime       | Когда сгенерировано                                     | ✅           |

**Related Entities**: All compliance modules

---

## 🔐 Enhanced Common Structures (DS v2.0)

### ElectronicSignature

**Описание**: Электронная подпись согласно 21 CFR Part 11  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - ElectronicSignatureZodSchema (Enhanced)`

| Поле                     | Тип             | Описание                                            | Обязательное |
| ------------------------ | --------------- | --------------------------------------------------- | ------------ |
| `userId`                 | UUID            | ID пользователя                                     | ✅           |
| `fullName`               | string          | Полное имя                                          | ✅           |
| `role`                   | string          | Роль                                                | ✅           |
| `action`                 | string          | Действие (approved, reviewed, implemented)          | ✅           |
| `reason`                 | string          | Обоснование (mandatory per 21 CFR Part 11)          | ✅           |
| `timestamp`              | ISO8601DateTime | Время подписи                                       | ✅           |
| `ipAddress`              | string          | IP адрес                                            | ✅           |
| `authenticationMethod`   | string          | Метод аутентификации (password/mfa/certificate)     | ✅           |

### AuditTrailMetadata

**Описание**: ALCOA+ совместимые метаданные аудита  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - AuditTrailZodSchema (Enhanced)`

| Поле                 | Тип             | Описание                       | Обязательное |
| -------------------- | --------------- | ------------------------------ | ------------ |
| `createdBy`          | UserReference   | Кто создал                         | ✅           |
| `createdAt`          | ISO8601DateTime | Когда создано                      | ✅           |
| `lastModifiedBy`     | UserReference   | Кто изменил последний раз          | ❌           |
| `lastModifiedAt`     | ISO8601DateTime | Когда изменено                     | ❌           |
| `changeReason`       | string          | Причина изменения                  | ❌           |
| `version`            | number          | Версия записи                      | ✅           |
| `dataIntegrityHash`  | string          | Хеш для проверки целостности       | ✅           |

### GxPValidationFields

**Описание**: Mixin для всех GxP-критичных сущностей  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - GxPValidationFieldsSchema`

| Поле                     | Тип              | Описание                                | Обязательное |
| ------------------------ | ---------------- | --------------------------------------- | ------------ |
| `gxpCritical`            | boolean          | Критично ли для GxP                     | ✅           |
| `validationStatus`       | ValidationStatus | Статус валидации                        | ✅           |
| `regulatoryRelevance`    | string[]         | Применимые регуляторные требования      | ✅           |
| `dataIntegrityLevel`     | AlcoaLevel       | ALCOA+ compliance level                 | ✅           |

---

**Последнее обновление**: 2025-10-17  
**Версия**: 2.0 - Aligned with DS v2.0 compliance modules  
**Источники**: CONTRACT_SPECIFICATIONS.md v2.0, EVENT_ARCHITECTURE.md v2.0, DS.md v2.0
