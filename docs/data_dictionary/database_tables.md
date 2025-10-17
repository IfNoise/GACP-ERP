# Database Tables (Таблицы БД)

Схемы таблиц PostgreSQL, MongoDB коллекций и других структур данных.

## 📊 PostgreSQL Tables

### 🌱 Plant Lifecycle Tables

#### plants (DS-PLM-001)

**Описание**: Основная таблица растений

| Поле                   | SQL Тип     | Ограничения              | Описание                 |
| ---------------------- | ----------- | ------------------------ | ------------------------ |
| `plant_id`             | UUID        | PRIMARY KEY              | Уникальный идентификатор |
| `plant_code`           | VARCHAR(20) | UNIQUE NOT NULL          | Код растения             |
| `strain_id`            | UUID        | FOREIGN KEY → strains    | Сорт растения            |
| `stage`                | plant_stage | NOT NULL                 | Стадия роста             |
| `current_health_score` | INTEGER     | CHECK (0-100)            | Оценка здоровья          |
| `facility_id`          | UUID        | FOREIGN KEY → facilities | Объект                   |
| `room_id`              | UUID        | FOREIGN KEY → rooms      | Помещение                |
| `zone_id`              | UUID        | FOREIGN KEY → zones      | Зона                     |
| `coordinates`          | JSONB       | NOT NULL                 | Координаты x,y,z         |
| `created_at`           | TIMESTAMP   | DEFAULT now()            | Время создания           |
| `updated_at`           | TIMESTAMP   | AUTO UPDATE              | Время изменения          |

**Индексы**:

- `idx_plants_batch_id` ON (batch_id)
- `idx_plants_stage` ON (stage)
- `idx_plants_zone_id` ON (current_zone_id)

#### plant_events (DS-PLM-002)

**Описание**: Журнал всех событий растений  
**Источник**: `docs/validation/DS.md`

| Поле             | Тип           | Ограничения          | Описание                 |
| ---------------- | ------------- | -------------------- | ------------------------ |
| `event_id`       | UUID          | PRIMARY KEY          | Уникальный идентификатор |
| `plant_id`       | UUID          | FOREIGN KEY → plants | Растение                 |
| `event_type`     | VARCHAR(50)   | NOT NULL             | Тип события              |
| `event_data`     | JSONB         | NOT NULL             | Детали события           |
| `performed_by`   | UUID          | FOREIGN KEY → users  | Исполнитель              |
| `performed_at`   | TIMESTAMP     | NOT NULL             | Время выполнения         |
| `labour_cost`    | DECIMAL(10,2) | ≥ 0                  | Трудозатраты             |
| `material_cost`  | DECIMAL(10,2) | ≥ 0                  | Материальные затраты     |
| `equipment_cost` | DECIMAL(10,2) | ≥ 0                  | Затраты на оборудование  |
| `audit_version`  | INTEGER       | NOT NULL             | Версия аудита            |

**Индексы**:

- `idx_plant_events_plant_id` ON (plant_id)
- `idx_plant_events_type` ON (event_type)
- `idx_plant_events_performed_at` ON (performed_at)

#### batches (DS-PLM-003)

**Описание**: Партии растений  
**Источник**: `docs/validation/DS.md`

| Поле                     | Тип           | Ограничения                     | Описание                   |
| ------------------------ | ------------- | ------------------------------- | -------------------------- |
| `batch_id`               | UUID          | PRIMARY KEY                     | Уникальный идентификатор   |
| `parent_batch_id`        | UUID          | NULLABLE, FOREIGN KEY → batches | Родительская партия        |
| `strain`                 | VARCHAR(255)  | NOT NULL                        | Сорт                       |
| `quantity`               | INTEGER       | > 0                             | Количество растений        |
| `stage`                  | enum          | CHECK stage IN (...)            | Стадия партии              |
| `total_cost`             | DECIMAL(15,2) | ≥ 0                             | Общая стоимость            |
| `cost_per_unit`          | DECIMAL(10,2) | ≥ 0                             | Себестоимость единицы      |
| `biological_asset_total` | DECIMAL(15,2) | ≥ 0                             | Общая стоимость биоактивов |
| `revenue_potential`      | DECIMAL(15,2) | ≥ 0                             | Потенциальная выручка      |
| `created_at`             | TIMESTAMP     | DEFAULT now()                   | Время создания             |
| `updated_at`             | TIMESTAMP     | AUTO UPDATE                     | Время изменения            |
| `compliance_status`      | enum          | (pending, approved, rejected)   | Статус соответствия        |

### 🏭 Facility & Spatial Tables

#### facilities

**Описание**: Производственные объекты  
**Источник**: `docs/services/spatial-addressing-service-v2.md`

| Поле            | Тип          | Ограничения     | Описание                 |
| --------------- | ------------ | --------------- | ------------------------ |
| `id`            | VARCHAR(50)  | PRIMARY KEY     | Уникальный идентификатор |
| `facility_code` | VARCHAR(10)  | UNIQUE NOT NULL | Код объекта              |
| `name`          | VARCHAR(255) | NOT NULL        | Название                 |
| `address`       | TEXT         | NOT NULL        | Адрес                    |
| `coordinates`   | POINT        | NOT NULL        | GPS координаты           |
| `dimensions`    | JSONB        | NOT NULL        | Размеры здания           |
| `zones_count`   | INTEGER      | DEFAULT 0       | Количество зон           |

#### zones

**Описание**: Зоны выращивания  
**Источник**: `docs/services/spatial-addressing-service-v2.md`

| Поле                 | Тип         | Ограничения              | Описание                 |
| -------------------- | ----------- | ------------------------ | ------------------------ |
| `id`                 | VARCHAR(50) | PRIMARY KEY              | Уникальный идентификатор |
| `facility_id`        | VARCHAR(50) | FOREIGN KEY → facilities | Объект                   |
| `zone_code`          | VARCHAR(20) | NOT NULL                 | Код зоны                 |
| `zone_type`          | VARCHAR(20) | CHECK zone_type IN (...) | Тип зоны                 |
| `coordinates`        | POINT       | NOT NULL                 | Координаты               |
| `dimensions`         | JSONB       | NOT NULL                 | Размеры                  |
| `max_racks`          | INTEGER     | > 0                      | Максимум стеллажей       |
| `current_racks`      | INTEGER     | DEFAULT 0                | Текущее количество       |
| `environment_config` | JSONB       | NOT NULL                 | Конфигурация среды       |

**Уникальные ограничения**:

- `UNIQUE(facility_id, zone_code)`

#### racks

**Описание**: Стеллажи  
**Источник**: `docs/services/spatial-addressing-service-v2.md`

| Поле                   | Тип          | Ограничения              | Описание                 |
| ---------------------- | ------------ | ------------------------ | ------------------------ |
| `id`                   | VARCHAR(50)  | PRIMARY KEY              | Уникальный идентификатор |
| `zone_id`              | VARCHAR(50)  | FOREIGN KEY → zones      | Зона                     |
| `rack_code`            | VARCHAR(20)  | NOT NULL                 | Код стеллажа             |
| `rack_type`            | VARCHAR(20)  | CHECK rack_type IN (...) | Тип стеллажа             |
| `shelf_count`          | INTEGER      | DEFAULT 1                | Количество полок         |
| `coordinates`          | POINT        | NOT NULL                 | Координаты               |
| `dimensions`           | JSONB        | NOT NULL                 | Размеры                  |
| `orientation`          | DECIMAL(5,2) | DEFAULT 0                | Ориентация в градусах    |
| `max_tray_capacity`    | INTEGER      | > 0                      | Максимум лотков          |
| `supported_tray_sizes` | TEXT[]       | NOT NULL                 | Поддерживаемые размеры   |
| `installation_date`    | DATE         | NOT NULL                 | Дата установки           |
| `qr_code`              | VARCHAR(255) | UNIQUE                   | QR код                   |

**Уникальные ограничения**:

- `UNIQUE(zone_id, rack_code)`

#### shelves

**Описание**: Полки стеллажей  
**Источник**: `docs/services/spatial-addressing-service-v2.md`

| Поле                 | Тип          | Ограничения         | Описание                 |
| -------------------- | ------------ | ------------------- | ------------------------ |
| `id`                 | VARCHAR(50)  | PRIMARY KEY         | Уникальный идентификатор |
| `rack_id`            | VARCHAR(50)  | FOREIGN KEY → racks | Стеллаж                  |
| `shelf_index`        | INTEGER      | > 0                 | Индекс полки             |
| `height_from_floor`  | DECIMAL(8,2) | ≥ 0                 | Высота от пола (см)      |
| `max_trays`          | INTEGER      | > 0                 | Максимум лотков          |
| `tray_positions`     | JSONB        | NOT NULL            | Конфигурации позиций     |
| `occupied_positions` | INTEGER      | DEFAULT 0           | Занятые позиции          |

**Проверочные ограничения**:

- `CHECK (shelf_index > 0)`

#### trays

**Описание**: Лотки для растений  
**Источник**: `docs/services/spatial-addressing-service-v2.md`

| Поле             | Тип          | Ограничения              | Описание                 |
| ---------------- | ------------ | ------------------------ | ------------------------ |
| `id`             | VARCHAR(50)  | PRIMARY KEY              | Уникальный идентификатор |
| `rack_id`        | VARCHAR(50)  | FOREIGN KEY → racks      | Стеллаж                  |
| `shelf_index`    | INTEGER      | NOT NULL                 | Индекс полки             |
| `position_index` | INTEGER      | NOT NULL                 | Индекс позиции           |
| `tray_code`      | VARCHAR(30)  | NOT NULL                 | Код лотка                |
| `tray_size`      | VARCHAR(20)  | CHECK tray_size IN (...) | Размер лотка             |
| `dimensions`     | JSONB        | NOT NULL                 | Размеры                  |
| `plant_capacity` | INTEGER      | > 0                      | Вместимость растений     |
| `plant_layout`   | JSONB        | NOT NULL                 | Схема размещения         |
| `coordinates`    | POINT        | NOT NULL                 | Координаты               |
| `occupied_slots` | INTEGER      | DEFAULT 0                | Занятые слоты            |
| `qr_code`        | VARCHAR(255) | UNIQUE                   | QR код                   |

**Уникальные ограничения**:

- `UNIQUE(rack_id, shelf_index, position_index)`

### 💰 Financial Tables

#### financial_transactions (DS-FIN-001)

**Описание**: Финансовые транзакции  
**Источник**: `docs/validation/DS.md`

| Поле               | Тип           | Ограничения                                      | Описание                     |
| ------------------ | ------------- | ------------------------------------------------ | ---------------------------- |
| `transaction_id`   | UUID          | PRIMARY KEY                                      | Уникальный идентификатор     |
| `transaction_type` | enum          | (revenue, expense, asset_transfer, depreciation) | Тип транзакции               |
| `amount`           | DECIMAL(15,2) | NOT NULL                                         | Сумма                        |
| `currency`         | VARCHAR(3)    | DEFAULT 'USD'                                    | Валюта                       |
| `account_from`     | VARCHAR(20)   | NOT NULL                                         | Счёт дебета                  |
| `account_to`       | VARCHAR(20)   | NOT NULL                                         | Счёт кредита                 |
| `reference_id`     | UUID          | NULLABLE                                         | Ссылка на связанную сущность |
| `reference_type`   | VARCHAR(50)   | NULLABLE                                         | Тип связанной сущности       |
| `description`      | TEXT          | NOT NULL                                         | Описание                     |
| `batch_id`         | UUID          | FOREIGN KEY → batches                            | Партия для распределения     |
| `posted_at`        | TIMESTAMP     | NOT NULL                                         | Время проводки               |
| `created_by`       | UUID          | FOREIGN KEY → users                              | Создатель                    |
| `approved_by`      | UUID          | FOREIGN KEY → users                              | Утвердивший                  |
| `audit_trail_id`   | UUID          | FOREIGN KEY → audit_trail                        | Аудиторский след             |

#### general_ledger (DS-FIN-002)

**Описание**: Главная книга (append-only)  
**Источник**: `docs/validation/DS.md`

| Поле                | Тип           | Ограничения                            | Описание                      |
| ------------------- | ------------- | -------------------------------------- | ----------------------------- |
| `ledger_entry_id`   | UUID          | PRIMARY KEY                            | Уникальный идентификатор      |
| `account_code`      | VARCHAR(20)   | NOT NULL                               | Код счёта                     |
| `account_name`      | VARCHAR(255)  | NOT NULL                               | Название счёта                |
| `debit_amount`      | DECIMAL(15,2) | ≥ 0                                    | Дебетовая сумма               |
| `credit_amount`     | DECIMAL(15,2) | ≥ 0                                    | Кредитовая сумма              |
| `transaction_id`    | UUID          | FOREIGN KEY → financial_transactions   | Транзакция                    |
| `posting_date`      | DATE          | NOT NULL                               | Дата проводки                 |
| `description`       | TEXT          | NOT NULL                               | Описание                      |
| `journal_reference` | VARCHAR(50)   | NOT NULL                               | Ссылка на журнал              |
| `created_at`        | TIMESTAMP     | IMMUTABLE                              | Время создания (неизменяемое) |
| `reversal_of`       | UUID          | NULLABLE, FOREIGN KEY → general_ledger | Сторнирование                 |

**Проверочные ограничения**:

- `CHECK (debit_amount > 0 OR credit_amount > 0)`
- `CHECK (debit_amount = 0 OR credit_amount = 0)` -- Только дебет или кредит

#### biological_assets (DS-FIN-003)

**Описание**: Биологические активы (растения)  
**Источник**: `docs/validation/DS.md`

| Поле                   | Тип           | Ограничения           | Описание                 |
| ---------------------- | ------------- | --------------------- | ------------------------ |
| `asset_id`             | UUID          | PRIMARY KEY           | Уникальный идентификатор |
| `plant_id`             | UUID          | FOREIGN KEY → plants  | Растение                 |
| `batch_id`             | UUID          | FOREIGN KEY → batches | Партия                   |
| `stage`                | enum          | CHECK stage IN (...)  | Стадия развития          |
| `acquisition_cost`     | DECIMAL(15,2) | ≥ 0                   | Первоначальная стоимость |
| `fair_value`           | DECIMAL(15,2) | ≥ 0                   | Справедливая стоимость   |
| `accumulated_costs`    | DECIMAL(15,2) | ≥ 0                   | Накопленные затраты      |
| `market_rate_per_gram` | DECIMAL(8,2)  | ≥ 0                   | Рыночная цена за грамм   |
| `estimated_yield`      | DECIMAL(8,2)  | ≥ 0                   | Ожидаемый урожай (г)     |
| `valuation_date`       | DATE          | NOT NULL              | Дата оценки              |
| `impairment_loss`      | DECIMAL(15,2) | ≥ 0                   | Убытки от обесценения    |
| `disposal_date`        | DATE          | NULLABLE              | Дата выбытия             |
| `disposal_value`       | DECIMAL(15,2) | NULLABLE              | Стоимость при выбытии    |

### 👥 User & Workforce Tables

#### users (DS-AUTH-001)

**Описание**: Пользователи системы  
**Источник**: `docs/validation/DS.md` (обновлён пользователем)

| Поле                       | Тип          | Ограничения                                                                         | Описание                     |
| -------------------------- | ------------ | ----------------------------------------------------------------------------------- | ---------------------------- |
| `user_id`                  | UUID         | PRIMARY KEY                                                                         | Уникальный идентификатор     |
| `username`                 | VARCHAR(50)  | UNIQUE NOT NULL                                                                     | Имя пользователя             |
| `email`                    | VARCHAR(255) | UNIQUE NOT NULL                                                                     | Email                        |
| `password_hash`            | VARCHAR(255) | NOT NULL                                                                            | Хэш пароля                   |
| `first_name`               | VARCHAR(100) | NOT NULL                                                                            | Имя                          |
| `last_name`                | VARCHAR(100) | NOT NULL                                                                            | Фамилия                      |
| `user_type`                | enum         | (employee, manager, admin, external_auditor, internal_auditor, third_party_auditor) | Тип пользователя             |
| `is_active`                | BOOLEAN      | DEFAULT true                                                                        | Активность                   |
| `last_login`               | TIMESTAMP    | NULLABLE                                                                            | Последний вход               |
| `created_at`               | TIMESTAMP    | DEFAULT now()                                                                       | Время создания               |
| `updated_at`               | TIMESTAMP    | AUTO UPDATE                                                                         | Время изменения              |
| `auditor_certification`    | VARCHAR(255) | NULLABLE                                                                            | Сертификация аудитора        |
| `auditor_agency`           | VARCHAR(255) | NULLABLE                                                                            | Аудиторская организация      |
| `temporary_access_expires` | TIMESTAMP    | NULLABLE                                                                            | Истечение временного доступа |

#### roles (DS-AUTH-002)

**Описание**: Роли и разрешения  
**Источник**: `docs/validation/DS.md` (обновлён пользователем)

| Поле                   | Тип         | Ограничения     | Описание                 |
| ---------------------- | ----------- | --------------- | ------------------------ |
| `role_id`              | UUID        | PRIMARY KEY     | Уникальный идентификатор |
| `role_name`            | VARCHAR(50) | UNIQUE NOT NULL | Название роли            |
| `description`          | TEXT        | NULLABLE        | Описание                 |
| `permissions`          | JSONB       | NOT NULL        | Массив разрешений        |
| `is_auditor_role`      | BOOLEAN     | DEFAULT false   | Аудиторская роль         |
| `read_only`            | BOOLEAN     | DEFAULT false   | Только чтение            |
| `can_generate_reports` | BOOLEAN     | DEFAULT false   | Генерация отчётов        |
| `created_at`           | TIMESTAMP   | DEFAULT now()   | Время создания           |

### 📊 IoT & Monitoring Tables

#### sensor_readings (DS-IOT-001)

**Описание**: Показания IoT сенсоров  
**Источник**: `docs/validation/DS.md`

| Поле               | Тип           | Ограничения                     | Описание                 |
| ------------------ | ------------- | ------------------------------- | ------------------------ |
| `reading_id`       | UUID          | PRIMARY KEY                     | Уникальный идентификатор |
| `sensor_id`        | VARCHAR(50)   | NOT NULL                        | ID сенсора               |
| `zone_id`          | UUID          | FOREIGN KEY → zones             | Зона                     |
| `sensor_type`      | VARCHAR(20)   | CHECK sensor_type IN (...)      | Тип сенсора              |
| `value`            | DECIMAL(10,4) | NOT NULL                        | Значение                 |
| `unit`             | VARCHAR(10)   | NOT NULL                        | Единица измерения        |
| `timestamp`        | TIMESTAMP     | NOT NULL                        | Время измерения          |
| `quality`          | VARCHAR(20)   | CHECK quality IN (...)          | Качество показания       |
| `threshold_status` | VARCHAR(20)   | CHECK threshold_status IN (...) | Статус порога            |
| `created_at`       | TIMESTAMP     | DEFAULT now()                   | Время записи             |

**Индексы**:

- `idx_sensor_readings_sensor_timestamp` ON (sensor_id, timestamp)
- `idx_sensor_readings_zone_timestamp` ON (zone_id, timestamp)

### 🔍 Audit & Compliance Tables

#### audit_trail (DS-DI-002)

**Описание**: Аудиторский след (immutable)  
**Источник**: `docs/validation/DS.md`

| Поле         | Тип          | Ограничения                                 | Описание                 |
| ------------ | ------------ | ------------------------------------------- | ------------------------ |
| `audit_id`   | UUID         | PRIMARY KEY                                 | Уникальный идентификатор |
| `table_name` | VARCHAR(100) | NOT NULL                                    | Имя таблицы              |
| `record_id`  | VARCHAR(100) | NOT NULL                                    | ID записи                |
| `operation`  | VARCHAR(10)  | CHECK operation IN (INSERT, UPDATE, DELETE) | Операция                 |
| `old_values` | JSONB        | NULLABLE                                    | Старые значения          |
| `new_values` | JSONB        | NULLABLE                                    | Новые значения           |
| `changed_by` | UUID         | FOREIGN KEY → users                         | Пользователь             |
| `changed_at` | TIMESTAMP    | IMMUTABLE                                   | Время изменения          |
| `session_id` | VARCHAR(100) | NOT NULL                                    | ID сессии                |
| `ip_address` | INET         | NOT NULL                                    | IP адрес                 |
| `user_agent` | TEXT         | NULLABLE                                    | User Agent               |

**Ограничения**:

- **NO DELETE, NO UPDATE** - только INSERT операции
- Хранение в immudb для полной неизменяемости

## 📄 MongoDB Collections

### documents

**Описание**: Документы и файлы  
**Источник**: `docs/validation/DS.md`

```javascript
{
  _id: ObjectId,
  document_id: UUID,
  title: String,
  content: String, // или GridFS reference
  document_type: String, // SOP, report, certificate
  metadata: {
    created_by: UUID,
    created_at: Date,
    updated_at: Date,
    version: Number,
    tags: [String],
    compliance_status: String
  },
  access_control: {
    read_roles: [String],
    write_roles: [String]
  }
}
```

### time_series_data

**Описание**: Временные ряды IoT данных  
**Источник**: Системная архитектура

```javascript
{
  _id: ObjectId,
  sensor_id: String,
  zone_id: String,
  measurements: [{
    timestamp: Date,
    value: Number,
    unit: String,
    quality: String
  }],
  date: Date, // для партиционирования
  created_at: Date
}
```

## 🔄 Event Sourcing Tables

### event_store

**Описание**: Хранилище событий  
**Источник**: `docs/EVENT_ARCHITECTURE.md`

| Поле             | Тип          | Ограничения | Описание                 |
| ---------------- | ------------ | ----------- | ------------------------ |
| `event_id`       | UUID         | PRIMARY KEY | Уникальный идентификатор |
| `aggregate_id`   | UUID         | NOT NULL    | ID агрегата              |
| `aggregate_type` | VARCHAR(100) | NOT NULL    | Тип агрегата             |
| `event_type`     | VARCHAR(100) | NOT NULL    | Тип события              |
| `event_data`     | JSONB        | NOT NULL    | Данные события           |
| `event_version`  | INTEGER      | NOT NULL    | Версия события           |
| `occurred_at`    | TIMESTAMP    | IMMUTABLE   | Время события            |
| `metadata`       | JSONB        | NULLABLE    | Метаданные               |

**Уникальные ограничения**:

- `UNIQUE(aggregate_id, event_version)`

**Индексы**:

- `idx_event_store_aggregate` ON (aggregate_id, event_version)
- `idx_event_store_type_time` ON (event_type, occurred_at)

---

## 📋 Compliance & Quality Tables (DS v2.0)

### change_control (CR)

**Описание**: Управление изменениями (Change Control)  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - ChangeControlZodSchema`

| Поле                      | SQL Тип      | Ограничения                                 | Описание                       |
|---------------------------|--------------|---------------------------------------------|--------------------------------|
| `id`                      | UUID         | PRIMARY KEY                                 | Уникальный идентификатор       |
| `request_id`              | VARCHAR(15)  | UNIQUE NOT NULL, REGEX: `^CR-\d{4}-\d{4}$` | Номер change request           |
| `title`                   | VARCHAR(200) | NOT NULL, LENGTH 10-200                     | Заголовок изменения            |
| `description`             | TEXT         | NOT NULL, MIN 50 chars                      | Описание необходимости         |
| `classification`          | ENUM         | (critical, major, minor, emergency)         | Классификация                  |
| `status`                  | ENUM         | (draft, submitted, assessment, review, approved, rejected, implementation, verification, closed) | Статус в workflow |
| `requested_by_user_id`    | UUID         | FOREIGN KEY → users, NOT NULL               | Инициатор изменения            |
| `impact_analysis`         | JSONB        | NOT NULL                                    | Анализ влияния                 |
| `approvals`               | JSONB ARRAY  | NOT NULL                                    | Цепочка согласований           |
| `electronic_signatures`   | JSONB ARRAY  | NOT NULL                                    | Электронные подписи            |
| `audit_trail_metadata`    | JSONB        | NOT NULL                                    | ALCOA+ метаданные              |
| `created_at`              | TIMESTAMP    | DEFAULT now(), NOT NULL                     | Дата создания                  |
| `updated_at`              | TIMESTAMP    | AUTO UPDATE, NOT NULL                       | Дата изменения                 |

**Индексы**:
- `idx_change_control_request_id` UNIQUE ON (request_id)
- `idx_change_control_status` ON (status)
- `idx_change_control_classification` ON (classification)

**JSONB Схемы**:
- `impact_analysis`: { affectedSystems[], affectedProcesses[], riskLevel, mitigationPlan, regulatoryImpact, validationRequired }
- `approvals[]`: { level, approverUserId, approverName, approverRole, status, comments, electronicSignature, timestamp }
- `audit_trail_metadata`: { createdBy, createdAt, lastModifiedBy, lastModifiedAt, changeReason, version, dataIntegrityHash }

---

### capa (CAPA)

**Описание**: Корректирующие и предупреждающие действия  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - CAPAZodSchema`

| Поле                   | SQL Тип      | Ограничения                                 | Описание                       |
|------------------------|--------------|---------------------------------------------|--------------------------------|
| `id`                   | UUID         | PRIMARY KEY                                 | Уникальный идентификатор       |
| `capa_id`              | VARCHAR(15)  | UNIQUE NOT NULL, REGEX: `^CAPA-\d{4}-\d{4}$` | Номер CAPA                   |
| `type`                 | ENUM         | (corrective, preventive)                    | Тип CAPA                       |
| `title`                | VARCHAR(200) | NOT NULL, LENGTH 10-200                     | Заголовок                      |
| `description`          | TEXT         | NOT NULL, MIN 50 chars                      | Описание проблемы              |
| `status`               | ENUM         | (initiated, investigation, root_cause_identified, action_plan, implementation, effectiveness_check, closed) | Статус lifecycle |
| `priority`             | ENUM         | (low, medium, high, critical)               | Приоритет                      |
| `source_type`          | VARCHAR(50)  | NOT NULL                                    | Источник (deviation, audit_finding, etc.) |
| `source_id`            | UUID         | NULLABLE                                    | ID источника                   |
| `root_cause_analysis`  | JSONB        | NULLABLE                                    | RCA (5_why, fishbone, etc.)    |
| `actions`              | JSONB ARRAY  | NOT NULL                                    | Корректирующие действия        |
| `effectiveness_check`  | JSONB        | NULLABLE                                    | Проверка эффективности         |
| `electronic_signatures`| JSONB ARRAY  | NOT NULL                                    | Электронные подписи            |
| `audit_trail_metadata` | JSONB        | NOT NULL                                    | ALCOA+ метаданные              |
| `created_at`           | TIMESTAMP    | DEFAULT now(), NOT NULL                     | Дата создания                  |
| `updated_at`           | TIMESTAMP    | AUTO UPDATE, NOT NULL                       | Дата изменения                 |

**Индексы**:
- `idx_capa_capa_id` UNIQUE ON (capa_id)
- `idx_capa_status` ON (status)
- `idx_capa_priority` ON (priority)
- `idx_capa_source` ON (source_type, source_id)

**JSONB Схемы**:
- `root_cause_analysis`: { method, findings, rootCause, contributingFactors[], evidence[] }
- `actions[]`: { actionId, description, assignedTo, dueDate, status, completionDate, evidence[] }
- `effectiveness_check`: { scheduledDate, completedDate, method, result, findings, followUpRequired }

---

### deviation (DEV)

**Описание**: Отклонения от стандартов  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - DeviationZodSchema`

| Поле                   | SQL Тип      | Ограничения                                 | Описание                       |
|------------------------|--------------|---------------------------------------------|--------------------------------|
| `id`                   | UUID         | PRIMARY KEY                                 | Уникальный идентификатор       |
| `deviation_id`         | VARCHAR(15)  | UNIQUE NOT NULL, REGEX: `^DEV-\d{4}-\d{4}$` | Номер отклонения             |
| `title`                | VARCHAR(200) | NOT NULL, LENGTH 10-200                     | Заголовок                      |
| `description`          | TEXT         | NOT NULL, MIN 50 chars                      | Описание отклонения            |
| `classification`       | ENUM         | (critical, major, minor)                    | Классификация                  |
| `status`               | ENUM         | (reported, classified, investigation, impact_assessment, closed) | Статус workflow |
| `reported_by_user_id`  | UUID         | FOREIGN KEY → users, NOT NULL               | Кто сообщил                    |
| `reported_date`        | TIMESTAMP    | NOT NULL                                    | Дата сообщения                 |
| `affected_process`     | VARCHAR(100) | NOT NULL                                    | Затронутый процесс             |
| `affected_products`    | VARCHAR[] ARRAY | NULLABLE                                 | Затронутые продукты            |
| `immediate_actions`    | TEXT         | NOT NULL, MIN 30 chars                      | Немедленные действия           |
| `investigation`        | JSONB        | NULLABLE                                    | Расследование                  |
| `impact_assessment`    | JSONB        | NOT NULL                                    | Оценка влияния                 |
| `capa_required`        | BOOLEAN      | NOT NULL                                    | Требуется ли CAPA              |
| `capa_id`              | UUID         | FOREIGN KEY → capa, NULLABLE                | Связанный CAPA                 |
| `electronic_signatures`| JSONB ARRAY  | NOT NULL                                    | Электронные подписи            |
| `audit_trail_metadata` | JSONB        | NOT NULL                                    | ALCOA+ метаданные              |
| `created_at`           | TIMESTAMP    | DEFAULT now(), NOT NULL                     | Дата создания                  |
| `updated_at`           | TIMESTAMP    | AUTO UPDATE, NOT NULL                       | Дата изменения                 |

**Индексы**:
- `idx_deviation_deviation_id` UNIQUE ON (deviation_id)
- `idx_deviation_status` ON (status)
- `idx_deviation_classification` ON (classification)
- `idx_deviation_capa` ON (capa_id)

**JSONB Схемы**:
- `investigation`: { investigator, startDate, completionDate, findings, rootCause, evidence[] }
- `impact_assessment`: { qualityImpact, productImpact, affectedBatches[], regulatoryReportingRequired, customerNotificationRequired, assessmentDate, assessedBy }

---

### validation (VAL)

**Описание**: Валидация систем и процессов (GAMP 5)  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - ValidationZodSchema`

| Поле                   | SQL Тип      | Ограничения                                 | Описание                       |
|------------------------|--------------|---------------------------------------------|--------------------------------|
| `id`                   | UUID         | PRIMARY KEY                                 | Уникальный идентификатор       |
| `validation_id`        | VARCHAR(15)  | UNIQUE NOT NULL, REGEX: `^VAL-\d{4}-\d{4}$` | Номер валидации              |
| `title`                | VARCHAR(200) | NOT NULL, LENGTH 10-200                     | Название валидации             |
| `type`                 | ENUM         | (IQ, OQ, PQ, revalidation)                  | Тип валидации (GAMP 5)         |
| `system`               | VARCHAR(100) | NOT NULL                                    | Валидируемая система           |
| `gamp_category`        | ENUM         | (1, 3, 4, 5)                                | GAMP 5 категория               |
| `status`               | ENUM         | (planning, protocol_draft, protocol_approved, execution, report_draft, report_approved, closed) | Статус lifecycle |
| `protocol`             | JSONB        | NULLABLE                                    | Протокол валидации             |
| `test_cases`           | JSONB ARRAY  | NOT NULL                                    | Тест-кейсы                     |
| `execution_results`    | JSONB ARRAY  | NULLABLE                                    | Результаты выполнения          |
| `deviations`           | JSONB ARRAY  | NULLABLE                                    | Отклонения от протокола        |
| `report`               | JSONB        | NULLABLE                                    | Отчёт валидации                |
| `electronic_signatures`| JSONB ARRAY  | NOT NULL                                    | Электронные подписи            |
| `audit_trail_metadata` | JSONB        | NOT NULL                                    | ALCOA+ метаданные              |
| `created_at`           | TIMESTAMP    | DEFAULT now(), NOT NULL                     | Дата создания                  |
| `updated_at`           | TIMESTAMP    | AUTO UPDATE, NOT NULL                       | Дата изменения                 |

**Индексы**:
- `idx_validation_validation_id` UNIQUE ON (validation_id)
- `idx_validation_status` ON (status)
- `idx_validation_type` ON (type)
- `idx_validation_gamp` ON (gamp_category)

**JSONB Схемы**:
- `protocol`: { protocolNumber, version, approvedBy, approvalDate, documentId }
- `test_cases[]`: { testCaseId, description, acceptanceCriteria, status, executedBy, executionDate, result, evidence[] }
- `execution_results[]`: { testCaseId, result, executedBy, executionDate, notes, evidence[] }
- `deviations[]`: { deviationNumber, description, impact, resolution }
- `report`: { reportNumber, summary, conclusion, approvedBy, approvalDate, documentId }

---

### quality_event (QE)

**Описание**: Качественные события (жалобы, аудиты, инспекции)  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - QualityEventZodSchema`

| Поле                   | SQL Тип      | Ограничения                                 | Описание                       |
|------------------------|--------------|---------------------------------------------|--------------------------------|
| `id`                   | UUID         | PRIMARY KEY                                 | Уникальный идентификатор       |
| `event_id`             | VARCHAR(15)  | UNIQUE NOT NULL, REGEX: `^QE-\d{4}-\d{4}$` | Номер события                  |
| `type`                 | ENUM         | (complaint, audit_finding, inspection_observation, quality_issue) | Тип события |
| `title`                | VARCHAR(200) | NOT NULL, LENGTH 10-200                     | Заголовок                      |
| `description`          | TEXT         | NOT NULL, MIN 50 chars                      | Описание события               |
| `severity`             | ENUM         | (low, medium, high, critical)               | Критичность                    |
| `status`               | ENUM         | (reported, investigation, action_plan, closed) | Статус                      |
| `reported_by_user_id`  | UUID         | FOREIGN KEY → users, NOT NULL               | Кто сообщил                    |
| `reported_date`        | TIMESTAMP    | NOT NULL                                    | Дата сообщения                 |
| `affected_areas`       | VARCHAR[] ARRAY | NOT NULL                                 | Затронутые области             |
| `investigation`        | JSONB        | NULLABLE                                    | Расследование                  |
| `linked_records`       | JSONB ARRAY  | NULLABLE                                    | Связанные записи (CAPA, DEV)   |
| `electronic_signatures`| JSONB ARRAY  | NOT NULL                                    | Электронные подписи            |
| `audit_trail_metadata` | JSONB        | NOT NULL                                    | ALCOA+ метаданные              |
| `created_at`           | TIMESTAMP    | DEFAULT now(), NOT NULL                     | Дата создания                  |
| `updated_at`           | TIMESTAMP    | AUTO UPDATE, NOT NULL                       | Дата изменения                 |

**Индексы**:
- `idx_quality_event_event_id` UNIQUE ON (event_id)
- `idx_quality_event_status` ON (status)
- `idx_quality_event_severity` ON (severity)

**JSONB Схемы**:
- `investigation`: { investigator, startDate, completionDate, findings, rootCause, evidence[] }
- `linked_records[]`: { recordType, recordId, recordNumber, relationship }

---

### training (TRN)

**Описание**: Обучение и компетенции сотрудников  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - TrainingZodSchema`

| Поле                   | SQL Тип      | Ограничения                                 | Описание                       |
|------------------------|--------------|---------------------------------------------|--------------------------------|
| `id`                   | UUID         | PRIMARY KEY                                 | Уникальный идентификатор       |
| `training_id`          | VARCHAR(15)  | UNIQUE NOT NULL, REGEX: `^TRN-\d{4}-\d{4}$` | Номер обучения               |
| `course_id`            | VARCHAR(7)   | NOT NULL, REGEX: `^CUR-\d{3}$`              | ID курса                       |
| `user_id`              | UUID         | FOREIGN KEY → users, NOT NULL               | Обучающийся                    |
| `status`               | ENUM         | (enrolled, in_progress, completed, expired) | Статус                         |
| `start_date`           | TIMESTAMP    | NOT NULL                                    | Дата начала                    |
| `completion_date`      | TIMESTAMP    | NULLABLE                                    | Дата завершения                |
| `expiration_date`      | TIMESTAMP    | NULLABLE                                    | Дата истечения                 |
| `score`                | INTEGER      | CHECK 0-100, NULLABLE                       | Оценка                         |
| `passing_score`        | INTEGER      | CHECK 0-100, NOT NULL                       | Проходной балл                 |
| `attempts`             | INTEGER      | DEFAULT 0, CHECK 0-3                        | Количество попыток             |
| `certificate_issued`   | BOOLEAN      | DEFAULT false                               | Выдан ли сертификат            |
| `electronic_signatures`| JSONB ARRAY  | NOT NULL                                    | Электронные подписи            |
| `audit_trail_metadata` | JSONB        | NOT NULL                                    | ALCOA+ метаданные              |
| `created_at`           | TIMESTAMP    | DEFAULT now(), NOT NULL                     | Дата создания                  |
| `updated_at`           | TIMESTAMP    | AUTO UPDATE, NOT NULL                       | Дата изменения                 |

**Индексы**:
- `idx_training_training_id` UNIQUE ON (training_id)
- `idx_training_user_id` ON (user_id)
- `idx_training_status` ON (status)
- `idx_training_course_id` ON (course_id)

---

### training_course (CUR)

**Описание**: Курсы обучения  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - CourseDetailsDTOSchema`

| Поле                           | SQL Тип      | Ограничения                   | Описание                       |
|--------------------------------|--------------|-------------------------------|--------------------------------|
| `id`                           | UUID         | PRIMARY KEY                   | Уникальный идентификатор       |
| `course_id`                    | VARCHAR(7)   | UNIQUE NOT NULL, REGEX: `^CUR-\d{3}$` | ID курса                |
| `title`                        | VARCHAR(200) | NOT NULL                      | Название курса                 |
| `description`                  | TEXT         | NOT NULL                      | Описание                       |
| `duration_hours`               | INTEGER      | > 0, NOT NULL                 | Длительность (часы)            |
| `required_for_positions`       | VARCHAR[] ARRAY | NOT NULL                   | Обязательные должности         |
| `recertification_period_days`  | INTEGER      | > 0, NULLABLE                 | Период переаттестации (дни)    |
| `passing_score`                | INTEGER      | CHECK 0-100, NOT NULL         | Проходной балл                 |
| `created_at`                   | TIMESTAMP    | DEFAULT now(), NOT NULL       | Дата создания                  |
| `updated_at`                   | TIMESTAMP    | AUTO UPDATE, NOT NULL         | Дата изменения                 |

**Индексы**:
- `idx_training_course_course_id` UNIQUE ON (course_id)

---

### document_control (DOC)

**Описание**: Контроль документов с версионированием  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - DocumentZodSchema`

| Поле                   | SQL Тип      | Ограничения                                 | Описание                       |
|------------------------|--------------|---------------------------------------------|--------------------------------|
| `id`                   | UUID         | PRIMARY KEY                                 | Уникальный идентификатор       |
| `document_id`          | VARCHAR(22)  | UNIQUE NOT NULL, REGEX: `^DOC-[A-Z]{3}-\d{4}-\d{4}$` | Номер документа     |
| `title`                | VARCHAR(200) | NOT NULL, LENGTH 10-200                     | Название документа             |
| `type`                 | ENUM         | (SOP, protocol, report, form, policy)       | Тип документа                  |
| `version`              | VARCHAR(10)  | NOT NULL, REGEX: `^\d+\.\d+$`               | Версия (X.Y)                   |
| `status`               | ENUM         | (draft, review, approved, obsolete, archived) | Статус lifecycle            |
| `author_user_id`       | UUID         | FOREIGN KEY → users, NOT NULL               | Автор                          |
| `approver_user_id`     | UUID         | FOREIGN KEY → users, NULLABLE               | Утверждающий                   |
| `effective_date`       | TIMESTAMP    | NULLABLE                                    | Дата вступления в силу         |
| `review_date`          | TIMESTAMP    | NULLABLE                                    | Дата следующего пересмотра     |
| `edms_document_id`     | VARCHAR(100) | NOT NULL                                    | ID в Mayan-EDMS                |
| `change_control_id`    | UUID         | FOREIGN KEY → change_control, NULLABLE      | Связанный Change Control       |
| `electronic_signatures`| JSONB ARRAY  | NOT NULL                                    | Электронные подписи            |
| `audit_trail_metadata` | JSONB        | NOT NULL                                    | ALCOA+ метаданные              |
| `created_at`           | TIMESTAMP    | DEFAULT now(), NOT NULL                     | Дата создания                  |
| `updated_at`           | TIMESTAMP    | AUTO UPDATE, NOT NULL                       | Дата изменения                 |

**Индексы**:
- `idx_document_control_document_id` UNIQUE ON (document_id)
- `idx_document_control_status` ON (status)
- `idx_document_control_type` ON (type)
- `idx_document_control_edms` ON (edms_document_id)

---

### analytics_snapshot (ANALYTICS)

**Описание**: Снимки аналитических метрик compliance модулей  
**Источник**: `CONTRACT_SPECIFICATIONS.md v2.0 - AnalyticsZodSchema`

| Поле                   | SQL Тип      | Ограничения                                 | Описание                       |
|------------------------|--------------|---------------------------------------------|--------------------------------|
| `id`                   | UUID         | PRIMARY KEY                                 | Уникальный идентификатор       |
| `metric_type`          | VARCHAR(100) | NOT NULL                                    | Тип метрики                    |
| `period`               | ENUM         | (daily, weekly, monthly, quarterly, yearly) | Период агрегации               |
| `start_date`           | TIMESTAMP    | NOT NULL                                    | Начало периода                 |
| `end_date`             | TIMESTAMP    | NOT NULL                                    | Конец периода                  |
| `module`               | ENUM         | (change_control, capa, deviation, validation, quality_event, training, document) | Модуль |
| `metrics`              | JSONB        | NOT NULL                                    | Собранные метрики              |
| `trends`               | JSONB ARRAY  | NULLABLE                                    | Трендовые данные               |
| `generated_by_user_id` | UUID         | FOREIGN KEY → users, NOT NULL               | Кто сгенерировал               |
| `generated_at`         | TIMESTAMP    | NOT NULL                                    | Дата генерации                 |

**Индексы**:
- `idx_analytics_period` ON (period, start_date, end_date)
- `idx_analytics_module` ON (module)

**JSONB Схемы**:
- `metrics`: { capaOverdueRate, deviationRepeatRate, changeApprovalTimeAvg, trainingCompletionRate, validationOnTimeRate, documentReviewOverdue, auditTrailCompleteness }
- `trends[]`: { timestamp, value, label }

---

**Последнее обновление**: 2025-10-17  
**Версия**: 2.0 - Aligned with DS v2.0 compliance modules  
**Источники**: CONTRACT_SPECIFICATIONS.md v2.0, DS.md, spatial-addressing-service-v2.md
