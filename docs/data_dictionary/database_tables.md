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

**Последнее обновление**: 2025-09-16  
**Источники**: docs/validation/DS.md, docs/services/spatial-addressing-service-v2.md
