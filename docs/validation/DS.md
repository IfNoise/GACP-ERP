---
title: "Data Specification (DS)"
system: "ERP for GACP-Compliant Cannabis Cultivation"
version: "1.0"
status: "approved"
last_updated: "2025-09-14"
approved_by: "QA Lead, IT Manager"
approval_date: "2025-09-14"
---

# Data Specification (DS)

## 📋 **Document Overview**

Данный документ определяет структуру данных ERP системы для GACP-совместимого производства каннабиса. Включает модели растений, партий, Audit Trail, e-signatures, пользователей, курсов и IoT-метрики.

**🔗 Связанные документы:**

- **[CONTRACT_SPECIFICATIONS.md](../CONTRACT_SPECIFICATIONS.md)** - 🎯 **ГЛАВНЫЙ ДОКУМЕНТ** по всем Zod схемам данных
- **[SYSTEM_ARCHITECTURE.md](../SYSTEM_ARCHITECTURE.md)** - Архитектурный контекст
- **[DATA_REPLICATION_ARCHITECTURE.md](../infrastructure/DATA_REPLICATION_ARCHITECTURE.md)** - Стратегии репликации

## 2. Traceability

Каждое требование FS имеет свою DS-реализацию с полной прослеживаемостью:

### Основные модули

- FS-DI-001 → DS-DI-002 (Audit Trail структура)
- FS-PLM-001 → DS-PLM-001 (Plant Lifecycle)
- FS-TRAIN-001 → DS-TRAIN-001,DS-TRAIN-002 (Training система)
- FS-DR-001 → DS-DI-003 (Backup стратегия)
- FS-ES-001 → DS-ES-001 (Electronic Signatures)
- FS-AUTH-001 → DS-AUTH-001,DS-AUTH-002 (Authentication)

### Расширенные модули

- FS-FIN-001-005 → DS-FIN-001-005 (Financial Module)
- FS-WF-001-004 → DS-WF-001-003 (Workforce Management)
- FS-SP-001-002 → DS-SP-001 (Spatial Planning)
- FS-FC-001-003 → DS-FC-001 (Forecasting & Analytics)
- FS-PR-001-003 → DS-PR-001,DS-PR-002 (Procurement)
- FS-API-001-002 → DS-API-001 (External Integrations)
- FS-AND-001-003 → DS-AND-001 (Android Terminals)
- FS-IOT-001 → DS-IOT-001 (IoT Sensor Data)
- FS-EQP-001 → DS-EQP-001 (Equipment Data)

## 3. Core Data Models

### 3.1 Plants (DS-PLM-001)

**Основная сущность для жизненного цикла растений**

- plant_id: UUID, Primary Key
- batch_id: UUID, Foreign Key к batches
- source_type: enum (seed, clone)
- source_reference: UUID, опциональная ссылка на родителя
- strain: varchar(255), сорт
- stage: enum (germination,cloning, vegetation,mother_plant, flowering,stopped, harvest)
- current_health_score: integer (0-100)
- current_zone_id: UUID, текущее расположение
- biological_asset_value: decimal(15,2), справедливая стоимость как биологический актив
- cost_allocation_id: UUID, Foreign Key к cost allocations
- created_at, updated_at: timestamps
- version: integer, для версионирования

### 3.2 Plant Events (DS-PLM-002)

**Журнал всех действий с растениями**

- event_id: UUID, Primary Key
- plant_id: UUID, Foreign Key
- event_type: varchar (watering, feeding, transplant, harvest, etc.)
- event_data: JSONB, детали события
- performed_by: UUID, идентификатор пользователя
- performed_at: timestamp
- labour_cost: decimal(10,2), стоимость трудозатрат
- material_cost: decimal(10,2), стоимость материалов
- equipment_cost: decimal(10,2), стоимость использования оборудования
- audit_version: integer

### 3.3 Batches (DS-PLM-003)

**Партии растений**

- batch_id: UUID, Primary Key
- parent_batch_id: UUID, опциональная ссылка на родительскую партию
- strain: varchar(255)
- quantity: integer
- stage: enum (propagation, vegetation, flowering, harvest, processed)
- total_cost: decimal(15,2), общая стоимость партии
- cost_per_unit: decimal(10,2), себестоимость единицы
- biological_asset_total: decimal(15,2), общая стоимость как биологических активов
- revenue_potential: decimal(15,2), потенциальная выручка
- created_at, updated_at: timestamps
- compliance_status: enum (pending, approved, rejected)

### 3.4 Financial Transactions (DS-FIN-001)

**Финансовые транзакции системы**

- transaction_id: UUID, Primary Key
- transaction_type: enum (revenue, expense, asset_transfer, depreciation)
- amount: decimal(15,2), сумма транзакции
- currency: varchar(3), валюта (USD, EUR, etc.)
- account_from: varchar(20), счёт дебета
- account_to: varchar(20), счёт кредита
- reference_id: UUID, ссылка на связанную сущность (plant, batch, invoice)
- reference_type: varchar(50), тип связанной сущности
- description: text, описание транзакции
- batch_id: UUID, партия для распределения затрат
- posted_at: timestamp, время проводки
- created_by: UUID, пользователь создавший транзакцию
- approved_by: UUID, пользователь утвердивший
- audit_trail_id: UUID, Foreign Key к audit trail

### 3.5 General Ledger (DS-FIN-002)

**Главная книга - append-only структура**

- ledger_entry_id: UUID, Primary Key
- account_code: varchar(20), код счёта
- account_name: varchar(255), название счёта
- debit_amount: decimal(15,2), дебетовая сумма
- credit_amount: decimal(15,2), кредитовая сумма
- transaction_id: UUID, Foreign Key к transactions
- posting_date: date, дата проводки
- description: text, описание проводки
- journal_reference: varchar(50), ссылка на журнал
- created_at: timestamp, неизменяемое время создания
- reversal_of: UUID, опциональная ссылка на reversal entry

### 3.6 Biological Assets (DS-FIN-003)

**Учёт растений как биологических активов**

- asset_id: UUID, Primary Key
- plant_id: UUID, Foreign Key к plants
- batch_id: UUID, Foreign Key к batches
- stage: enum (seed, clone, vegetation, flowering, harvest)
- acquisition_cost: decimal(15,2), первоначальная стоимость
- fair_value: decimal(15,2), справедливая стоимость
- accumulated_costs: decimal(15,2), накопленные затраты
- market_rate_per_gram: decimal(8,2), рыночная цена за грамм
- estimated_yield: decimal(8,2), ожидаемый урожай в граммах
- valuation_date: date, дата последней оценки
- impairment_loss: decimal(15,2), убытки от обесценения
- disposal_date: date, дата выбытия (при продаже/harvest)
- disposal_value: decimal(15,2), стоимость при выбытии

### 3.7 Cost Allocations (DS-FIN-004)

**Распределение затрат по партиям и растениям**

- allocation_id: UUID, Primary Key
- batch_id: UUID, Foreign Key к batches
- cost_type: enum (direct_material, direct_labour, overhead)
- cost_category: varchar(100), категория затрат
- allocated_amount: decimal(15,2), распределённая сумма
- allocation_method: enum (quantity_based, time_based, square_footage)
- allocation_base: decimal(10,2), база для распределения
- period_start: date, начало периода
- period_end: date, конец периода
- created_at: timestamp

### 3.8 Payroll Data (DS-FIN-005)

**Данные расчёта заработной платы**

- payroll_id: UUID, Primary Key
- employee_id: UUID, Foreign Key к employees
- pay_period_start: date, начало расчётного периода
- pay_period_end: date, конец расчётного периода
- regular_hours: decimal(8,2), обычные часы
- overtime_hours: decimal(8,2), сверхурочные часы
- holiday_hours: decimal(8,2), праздничные часы
- gross_pay: decimal(10,2), валовая зарплата
- tax_deductions: decimal(10,2), налоговые вычеты
- net_pay: decimal(10,2), чистая зарплата
- hourly_rate: decimal(8,2), часовая ставка
- overtime_rate: decimal(8,2), ставка сверхурочных
- batch_allocations: JSONB, распределение по партиям
- processed_at: timestamp
- approved_by: UUID, пользователь утвердивший

### 3.9 Workforce Management (DS-WF-001)

**Управление персоналом и задачами**

- task_id: UUID, Primary Key
- assigned_to: UUID, Foreign Key к employees
- task_type: enum (cultivation, quality_control, maintenance, harvest)
- sop_id: UUID, ссылка на SOP
- plant_ids: UUID[], массив растений для задачи
- batch_id: UUID, партия для задачи
- zone_id: UUID, зона выполнения
- estimated_duration: interval, ожидаемое время выполнения
- actual_duration: interval, фактическое время
- status: enum (assigned, in_progress, completed, cancelled)
- priority: enum (low, medium, high, urgent)
- deadline: timestamp, срок выполнения
- created_at: timestamp
- started_at: timestamp
- completed_at: timestamp
- notes: text, заметки по выполнению

### 3.10 Accounts Payable (DS-FIN-006)

**Управление кредиторской задолженностью**

- ap_id: UUID, Primary Key
- supplier_id: UUID, Foreign Key к suppliers
- purchase_order_id: UUID, Foreign Key к purchase_orders
- receiving_id: UUID, Foreign Key к receiving_records
- invoice_number: varchar(100), номер счёта поставщика
- invoice_date: date, дата счёта
- due_date: date, срок оплаты
- total_amount: decimal(15,2), общая сумма
- tax_amount: decimal(15,2), сумма НДС
- discount_amount: decimal(15,2), сумма скидки
- paid_amount: decimal(15,2), оплаченная сумма
- status: enum (pending, approved, paid, disputed, cancelled)
- payment_terms: varchar(50), условия оплаты
- currency: varchar(3), валюта
- exchange_rate: decimal(10,6), курс валют
- approval_workflow_id: UUID, процесс утверждения
- created_at: timestamp
- approved_at: timestamp
- paid_at: timestamp

### 3.11 Accounts Receivable (DS-FIN-007)

**Управление дебиторской задолженностью**

- ar_id: UUID, Primary Key
- customer_id: UUID, Foreign Key к customers
- invoice_number: varchar(100), номер счёта
- invoice_date: date, дата выставления
- due_date: date, срок оплаты
- total_amount: decimal(15,2), общая сумма
- tax_amount: decimal(15,2), сумма НДС
- discount_amount: decimal(15,2), сумма скидки
- received_amount: decimal(15,2), полученная сумма
- outstanding_amount: decimal(15,2), остаток задолженности
- status: enum (issued, partial_paid, paid, overdue, written_off)
- payment_terms: varchar(50), условия оплаты
- aging_category: enum (current, 30_days, 60_days, 90_days, over_90)
- collection_status: enum (normal, follow_up, legal_action)
- currency: varchar(3), валюта
- sales_order_id: UUID, ссылка на заказ продаж
- shipped_at: timestamp, дата отгрузки

### 3.12 Chart of Accounts (DS-FIN-008)

**План счетов бухгалтерского учёта**

- account_id: UUID, Primary Key
- account_code: varchar(20), код счёта
- account_name: varchar(255), название счёта
- account_type: enum (asset, liability, equity, revenue, expense)
- account_subtype: varchar(100), подтип счёта
- parent_account_id: UUID, родительский счёт
- normal_balance: enum (debit, credit), нормальное сальдо
- is_active: boolean, активен ли счёт
- is_system: boolean, системный счёт
- consolidation_account: varchar(20), счёт консолидации
- currency: varchar(3), валюта счёта
- cost_center: varchar(50), центр затрат
- profit_center: varchar(50), центр прибыли
- description: text, описание счёта
- created_at: timestamp
- updated_at: timestamp

### 3.13 Spatial Planning (DS-SP-001)

**Планирование пространства и зон**

- zone_id: UUID, Primary Key
- zone_name: varchar(100), название зоны
- zone_type: enum (propagation, vegetative, flowering, drying, storage, maintenance)
- facility_id: UUID, Foreign Key к facilities
- parent_zone_id: UUID, родительская зона
- dimensions: JSONB, размеры зоны (length, width, height)
- area_m2: decimal(8,2), площадь в квадратных метрах
- volume_m3: decimal(8,2), объём в кубических метрах
- coordinates: JSONB, координаты на плане (x, y, z)
- max_capacity: integer, максимальная вместимость растений
- current_occupancy: integer, текущая занятость
- environmental_controls: JSONB, настройки окружающей среды
- equipment_ids: UUID[], массив оборудования в зоне
- lighting_circuits: varchar(100)[], осветительные контуры
- hvac_zone: varchar(50), зона вентиляции
- irrigation_zone: varchar(50), зона полива
- monitoring_sensors: UUID[], массив датчиков
- access_level: enum (public, restricted, high_security)
- safety_requirements: JSONB, требования безопасности
- is_active: boolean, активна ли зона
- created_at: timestamp
- updated_at: timestamp

### 3.14 Zone Assignments (DS-SP-002)

**Назначения растений и партий зонам**

- assignment_id: UUID, Primary Key
- zone_id: UUID, Foreign Key к zones
- assignable_type: enum (plant, batch, equipment)
- assignable_id: UUID, ID назначаемого объекта
- assigned_at: timestamp, время назначения
- expected_duration: interval, ожидаемое время пребывания
- actual_duration: interval, фактическое время
- position: JSONB, позиция в зоне (x, y, z)
- status: enum (assigned, active, completed, moved)
- moved_to_zone_id: UUID, зона перемещения
- moved_at: timestamp, время перемещения
- assignment_reason: text, причина назначения
- assigned_by: UUID, кто назначил
- notes: text, заметки

### 3.15 Forecasting Models (DS-FC-001)

**Модели прогнозирования**

- model_id: UUID, Primary Key
- model_name: varchar(100), название модели
- model_type: enum (yield_prediction, resource_demand, financial_forecast, quality_prediction)
- algorithm: enum (linear_regression, random_forest, neural_network, time_series)
- version: varchar(20), версия модели
- features: JSONB, входные переменные модели
- target_variable: varchar(100), целевая переменная
- training_data_start: date, начало обучающих данных
- training_data_end: date, конец обучающих данных
- last_trained: timestamp, последнее обучение
- model_parameters: JSONB, параметры модели
- performance_metrics: JSONB, метрики производительности
- accuracy_score: decimal(5,4), точность модели (0-1)
- confidence_level: decimal(5,4), уровень доверия
- validation_results: JSONB, результаты валидации
- is_active: boolean, активна ли модель
- created_by: UUID, создатель модели
- created_at: timestamp

### 3.16 Predictions (DS-FC-002)

**Прогнозы и предсказания**

- prediction_id: UUID, Primary Key
- model_id: UUID, Foreign Key к forecasting_models
- prediction_type: enum (yield, cost, revenue, quality, resource_need)
- target_entity_type: enum (plant, batch, zone, facility)
- target_entity_id: UUID, ID целевой сущности
- prediction_date: date, дата прогноза
- prediction_horizon: integer, горизонт прогноза в днях
- predicted_value: decimal(15,4), прогнозируемое значение
- confidence_lower: decimal(15,4), нижняя граница доверительного интервала
- confidence_upper: decimal(15,4), верхняя граница доверительного интервала
- confidence_level: decimal(5,4), уровень доверия
- actual_value: decimal(15,4), фактическое значение (после реализации)
- accuracy: decimal(5,4), точность прогноза
- influencing_factors: JSONB, влияющие факторы
- created_at: timestamp
- updated_at: timestamp

### 3.17 Procurement Data (DS-PR-001)

**Данные закупок и поставщиков**

- supplier_id: UUID, Primary Key
- supplier_name: varchar(255), название поставщика
- supplier_code: varchar(50), код поставщика
- supplier_type: enum (raw_materials, equipment, services, utilities)
- legal_entity_name: varchar(255), юридическое наименование
- tax_id: varchar(50), налоговый номер
- registration_number: varchar(100), регистрационный номер
- contact_info: JSONB, контактная информация
- addresses: JSONB, адреса (shipping, billing, headquarters)
- payment_terms: varchar(100), условия оплаты
- credit_limit: decimal(15,2), кредитный лимит
- currency: varchar(3), основная валюта
- status: enum (active, inactive, suspended, blacklisted)
- qualification_status: enum (pending, qualified, conditional, rejected)
- quality_rating: decimal(3,2), рейтинг качества (1-5)
- delivery_rating: decimal(3,2), рейтинг доставки (1-5)
- compliance_rating: decimal(3,2), рейтинг соответствия (1-5)
- certifications: JSONB, сертификаты и лицензии
- audit_date: date, дата последнего аудита
- contract_expiry: date, окончание контракта
- created_at: timestamp
- updated_at: timestamp

### 3.18 Purchase Orders (DS-PR-002)

**Заказы на поставку**

- po_id: UUID, Primary Key
- po_number: varchar(100), номер заказа
- supplier_id: UUID, Foreign Key к suppliers
- requisition_id: UUID, ссылка на заявку
- po_date: date, дата заказа
- delivery_date: date, планируемая дата поставки
- delivery_address: JSONB, адрес доставки
- status: enum (draft, approved, sent, acknowledged, partial_delivered, delivered, invoiced, closed, cancelled)
- total_amount: decimal(15,2), общая сумма
- tax_amount: decimal(15,2), сумма НДС
- currency: varchar(3), валюта
- exchange_rate: decimal(10,6), курс валют
- payment_terms: varchar(100), условия оплаты
- shipping_terms: varchar(100), условия доставки
- priority: enum (low, medium, high, urgent)
- buyer_id: UUID, покупатель
- approver_id: UUID, утверждающий
- created_at: timestamp
- approved_at: timestamp
- sent_at: timestamp

### 3.19 Android Terminal Data (DS-AND-001)

**Данные мобильных терминалов**

- terminal_id: UUID, Primary Key
- device_id: varchar(100), уникальный ID устройства
- terminal_name: varchar(100), имя терминала
- assigned_employee_id: UUID, назначенный сотрудник
- device_model: varchar(100), модель устройства
- os_version: varchar(50), версия ОС
- app_version: varchar(50), версия приложения
- mac_address: varchar(17), MAC-адрес
- ip_address: inet, IP-адрес
- location: JSONB, местоположение (GPS координаты)
- zone_id: UUID, текущая зона
- battery_level: integer, уровень заряда батареи
- storage_used: bigint, использованное хранилище (байты)
- storage_total: bigint, общее хранилище (байты)
- connection_status: enum (online, offline, syncing, error)
- last_sync: timestamp, последняя синхронизация
- sync_status: JSONB, статус синхронизации
- pending_tasks: integer, количество ожидающих задач
- completed_tasks: integer, выполненных задач
- error_count: integer, количество ошибок
- is_active: boolean, активен ли терминал
- created_at: timestamp
- updated_at: timestamp

### 3.20 Offline Data Sync (DS-AND-002)

**Синхронизация офлайн данных**

- sync_id: UUID, Primary Key
- terminal_id: UUID, Foreign Key к android_terminals
- sync_type: enum (full, incremental, delta, conflict_resolution)
- sync_direction: enum (upload, download, bidirectional)
- started_at: timestamp, начало синхронизации
- completed_at: timestamp, окончание синхронизации
- status: enum (pending, in_progress, completed, failed, cancelled)
- records_total: integer, общее количество записей
- records_processed: integer, обработано записей
- records_failed: integer, записей с ошибками
- data_size: bigint, размер данных (байты)
- compression_ratio: decimal(4,3), коэффициент сжатия
- conflicts_detected: integer, обнаруженных конфликтов
- conflicts_resolved: integer, разрешённых конфликтов
- error_details: JSONB, детали ошибок
- performance_metrics: JSONB, метрики производительности
- checksum: varchar(64), контрольная сумма
- created_at: timestamp

### 3.21 Knowledge Base (DS-KM-001)

**База знаний и документооборот**

- document_id: UUID, Primary Key
- title: varchar(500), заголовок документа
- content: text, содержимое документа
- document_type: enum (sop, manual, guide, training, reference, form, template)
- category: varchar(100), категория документа
- subcategory: varchar(100), подкатегория
- version: varchar(20), версия документа
- status: enum (draft, review, approved, published, superseded, retired)
- language: varchar(5), язык документа
- author_id: UUID, автор документа
- reviewer_id: UUID, рецензент
- approver_id: UUID, утверждающий
- owner_department: varchar(100), владелец-отдел
- target_audience: varchar(200)[], целевая аудитория
- prerequisites: varchar(200)[], необходимые знания
- keywords: varchar(100)[], ключевые слова
- tags: varchar(50)[], теги для поиска
- estimated_read_time: integer, время чтения (минуты)
- access_level: enum (public, internal, restricted, confidential)
- compliance_relevant: boolean, связан с соответствием
- risk_level: enum (low, medium, high), уровень риска
- effective_date: date, дата вступления в силу
- review_date: date, дата пересмотра
- expiry_date: date, дата истечения
- supersedes: UUID[], замещаемые документы
- related_documents: UUID[], связанные документы
- attachments: JSONB, приложения и файлы
- view_count: integer, количество просмотров
- download_count: integer, количество скачиваний
- rating_average: decimal(3,2), средняя оценка
- rating_count: integer, количество оценок
- created_at: timestamp
- updated_at: timestamp
- published_at: timestamp

### 3.22 Employee Competencies (DS-WF-002)

**Компетенции и допуски сотрудников**

- competency_id: UUID, Primary Key
- employee_id: UUID, Foreign Key к employees
- skill_category: varchar(100), категория навыка
- skill_name: varchar(255), название навыка
- proficiency_level: enum (novice, intermediate, advanced, expert)
- certification_id: UUID, ссылка на сертификат
- certified_by: UUID, пользователь выдавший сертификат
- certification_date: date, дата сертификации
- expiry_date: date, дата истечения
- renewal_required: boolean, требуется ли продление
- assessment_score: integer, оценка (0-100)
- last_training_date: date, дата последнего обучения

### 3.11 Timesheets (DS-WF-003)

**Учёт рабочего времени**

- timesheet_id: UUID, Primary Key
- employee_id: UUID, Foreign Key к employees
- work_date: date, дата работы
- clock_in: timestamp, время начала
- clock_out: timestamp, время окончания
- break_duration: interval, время перерывов
- total_hours: decimal(8,2), общее время работы
- overtime_hours: decimal(8,2), сверхурочные часы
- task_id: UUID, Foreign Key к tasks
- batch_id: UUID, партия на которой работал
- zone_id: UUID, зона работы
- hourly_rate: decimal(8,2), часовая ставка
- total_cost: decimal(10,2), общая стоимость работы
- approved_by: UUID, пользователь утвердивший
- gps_location: point, GPS координаты (если applicable)
- mobile_device_id: varchar(255), ID мобильного устройства

### 3.12 Spatial Data (DS-SP-001)

**Пространственные данные и планирование**

- zone_id: UUID, Primary Key
- zone_name: varchar(255), название зоны
- zone_type: enum (grow_room, drying_room, storage, processing)
- floor_plan_id: UUID, ссылка на план помещения
- total_area: decimal(10,2), общая площадь в кв.м
- usable_area: decimal(10,2), используемая площадь
- coordinates: polygon, геометрические координаты зоны
- environmental_controls: JSONB, системы контроля среды
- lighting_specifications: JSONB, спецификации освещения
- capacity_plants: integer, максимальное количество растений
- current_occupancy: integer, текущее количество растений
- utilization_rate: decimal(5,2), процент использования
- energy_consumption: decimal(10,2), потребление энергии кВт/ч
- last_optimization: timestamp, последняя оптимизация

### 3.13 Forecasting Models (DS-FC-001)

**Модели прогнозирования**

- forecast_id: UUID, Primary Key
- model_type: enum (yield_prediction, resource_demand, financial_forecast)
- model_version: varchar(50), версия модели
- input_parameters: JSONB, входные параметры
- historical_data_period: daterange, период исторических данных
- forecast_horizon: interval, горизонт прогнозирования
- prediction_results: JSONB, результаты прогноза
- confidence_interval: decimal(5,2), доверительный интервал
- accuracy_score: decimal(5,2), точность модели
- created_at: timestamp
- model_training_data: JSONB, данные для обучения модели
- feature_importance: JSONB, важность признаков

### 3.14 Procurement Data (DS-PR-001)

**Данные закупок и поставщиков**

- supplier_id: UUID, Primary Key
- supplier_name: varchar(255), название поставщика
- supplier_code: varchar(50), код поставщика
- contact_information: JSONB, контактная информация
- qualification_status: enum (qualified, pending, disqualified)
- quality_rating: decimal(3,2), рейтинг качества (0-5)
- delivery_rating: decimal(3,2), рейтинг доставки
- compliance_status: enum (compliant, non_compliant, under_review)
- certification_documents: UUID[], ссылки на документы
- contract_id: UUID, ссылка на контракт
- payment_terms: varchar(100), условия оплаты
- approved_products: JSONB, одобренные продукты
- last_audit_date: date, дата последнего аудита

### 3.15 Purchase Orders (DS-PR-002)

**Заказы поставщикам**

- po_id: UUID, Primary Key
- po_number: varchar(50), номер заказа
- supplier_id: UUID, Foreign Key к suppliers
- order_date: date, дата заказа
- requested_delivery: date, запрашиваемая дата доставки
- actual_delivery: date, фактическая дата доставки
- total_amount: decimal(15,2), общая сумма заказа
- currency: varchar(3), валюта
- status: enum (draft, sent, confirmed, received, invoiced, paid)
- created_by: UUID, пользователь создавший
- approved_by: UUID, пользователь утвердивший
- terms_conditions: text, условия поставки
- shipping_address: JSONB, адрес доставки
- line_items: JSONB, позиции заказа

### 3.16 Mobile Device Data (DS-AND-001)

**Данные Android терминалов**

- device_id: UUID, Primary Key
- device_serial: varchar(255), серийный номер устройства
- device_model: varchar(100), модель устройства
- assigned_to: UUID, Foreign Key к employees
- zone_assignment: UUID, закреплённая зона
- last_sync: timestamp, последняя синхронизация
- offline_data_size: bigint, размер offline данных в байтах
- app_version: varchar(50), версия приложения
- os_version: varchar(50), версия Android
- battery_level: integer, уровень заряда (0-100)
- storage_available: bigint, доступное место в байтах
- gps_enabled: boolean, включён ли GPS
- camera_enabled: boolean, включена ли камера
- nfc_enabled: boolean, включён ли NFC
- last_maintenance: date, дата последнего обслуживания

### 3.17 Audit Trail (DS-DI-002)

**Неизменяемый журнал всех действий в системе**

- audit_id: UUID, Primary Key
- entity_type: varchar(50), тип сущности
- entity_id: UUID, идентификатор сущности
- action: varchar(50), тип действия (CREATE, UPDATE, DELETE, SIGN)
- old_value: JSONB, значение до изменения
- new_value: JSONB, значение после изменения
- performed_by: UUID, пользователь
- performed_at: timestamp
- reason: text, причина изменения
- signature_id: UUID, связь с электронной подписью
- session_id: UUID, идентификатор сессии
- correlation_id: UUID, связь с business transaction
- source_system: varchar(50), источник изменения (web, mobile, api)
- ip_address: inet, IP адрес пользователя
- user_agent: text, информация о браузере/устройстве

**Go Audit Consumer Architecture:**

- Go-based consumer для high-performance обработки Kafka events
- Batch processing с конфигурируемым размером batch (100-1000 events)
- Прямая запись в immudb для immutable storage
- Graceful shutdown с обработкой оставшихся событий
- Health checks и метрики для Prometheus
- Dead letter queue для failed events
- Партиционирование Kafka по entity_type для optimal performance

### 3.18 Electronic Signatures (DS-ES-001)

**Электронные подписи по 21 CFR Part 11**

- signature_id: UUID, Primary Key
- user_id: UUID, пользователь
- signed_at: timestamp
- reason: text, причина подписания
- method: enum (password_2fa, qr_badge, hardware_token, pki_certificate)
- auth_time: timestamp, время последней аутентификации
- signature_hash: varchar, хэш подписи
- certificate_serial: varchar, серийный номер сертификата (для PKI)
- certificate_issuer: varchar, издатель сертификата
- biometric_hash: varchar, хэш биометрических данных (опционально)
- valid: boolean, статус валидности
- revoked_at: timestamp, время аннулирования
- document_hash: varchar, хэш подписанного документа
- signature_format: enum (pkcs7, xades, cades), формат подписи

### 3.19 Users (DS-AUTH-001)

**Пользователи системы**

- user_id: UUID, Primary Key
- username: varchar(100), уникальное имя пользователя
- email: varchar(255), email адрес
- first_name: varchar(100), имя
- last_name: varchar(100), фамилия
- employee_id: varchar(50), номер сотрудника
- department: varchar(100), отдел
- position: varchar(100), должность
- hire_date: date, дата найма
- termination_date: date, дата увольнения
- active: boolean, активность аккаунта
- last_login: timestamp, последний вход
- failed_login_attempts: integer, неудачные попытки входа
- password_last_changed: timestamp, последняя смена пароля
- two_factor_enabled: boolean, включена ли 2FA
- preferred_language: varchar(10), предпочитаемый язык
- timezone: varchar(50), часовой пояс
- mobile_device_ids: UUID[], привязанные мобильные устройства

### 3.20 Roles (DS-AUTH-002)

**Роли и права доступа**

- role_id: UUID, Primary Key
- role_name: varchar(100), название роли
- description: text, описание роли
- permissions: JSONB, права доступа
- plant_access_level: enum (none, read, write, admin), доступ к растениям
- batch_access_level: enum (none, read, write, admin), доступ к партиям
- financial_access_level: enum (none, read, write, admin), доступ к финансам
- reporting_access_level: enum (none, read, write, admin), доступ к отчётам
- system_admin: boolean, системный администратор
- can_approve_batches: boolean, может утверждать партии
- can_sign_documents: boolean, может подписывать документы
- max_transaction_limit: decimal(15,2), лимит на транзакции
- zone_restrictions: UUID[], ограничения по зонам

### 3.21 Training Courses (DS-TRAIN-001)

**Курсы обучения**

- course_id: UUID, Primary Key
- course_code: varchar(50), код курса
- course_name: varchar(255), название курса
- description: text, описание курса
- course_type: enum (initial, refresher, specialized, compliance)
- duration_hours: decimal(5,2), длительность в часах
- passing_score: integer, проходной балл
- validity_period: interval, период действия сертификата
- mandatory: boolean, обязательный курс
- prerequisites: UUID[], предварительные курсы
- content_url: text, ссылка на контент
- created_by: UUID, автор курса
- approved_by: UUID, утвердивший курс
- version: varchar(20), версия курса
- effective_date: date, дата вступления в силу
- retirement_date: date, дата выбытия

### 3.22 Training Records (DS-TRAIN-002)

**Записи об обучении**

- record_id: UUID, Primary Key
- user_id: UUID, Foreign Key к users
- course_id: UUID, Foreign Key к courses
- enrollment_date: date, дата записи на курс
- completion_date: date, дата завершения
- score: integer, итоговая оценка
- passed: boolean, пройден ли курс
- certificate_number: varchar(100), номер сертификата
- instructor_id: UUID, инструктор
- training_method: enum (online, classroom, on_job, simulation)
- training_duration: interval, фактическая длительность
- next_required_training: date, дата следующего обучения
- notes: text, заметки инструктора
- attachments: UUID[], приложения к записи

### 3.23 IoT Sensor Data (DS-IOT-001)

**Данные IoT сенсоров**

- sensor_reading_id: UUID, Primary Key
- sensor_id: UUID, идентификатор сенсора
- zone_id: UUID, Foreign Key к zones
- sensor_type: enum (temperature, humidity, co2, ph, light, pressure)
- reading_value: decimal(10,4), значение показания
- unit_of_measure: varchar(20), единица измерения
- timestamp: timestamp, время считывания
- quality_status: enum (good, questionable, bad), качество данных
- alarm_status: enum (normal, warning, critical), статус тревоги
- calibration_date: date, дата последней калибровки
- battery_level: integer, уровень заряда сенсора (0-100)
- signal_strength: integer, уровень сигнала
- maintenance_required: boolean, требуется обслуживание

### 3.24 Equipment Data (DS-EQP-001)

**Данные оборудования**

- equipment_id: UUID, Primary Key
- equipment_code: varchar(50), код оборудования
- equipment_name: varchar(255), название оборудования
- equipment_type: enum (hvac, lighting, irrigation, processing, monitoring)
- manufacturer: varchar(100), производитель
- model_number: varchar(100), номер модели
- serial_number: varchar(100), серийный номер
- installation_date: date, дата установки
- warranty_expiry: date, окончание гарантии
- zone_id: UUID, расположение оборудования
- status: enum (operational, maintenance, broken, retired)
- operating_hours: integer, наработка в часах
- maintenance_schedule: JSONB, график обслуживания
- last_maintenance: date, дата последнего обслуживания
- next_maintenance: date, дата следующего обслуживания
- energy_consumption: decimal(10,2), потребление энергии
- maintenance_cost_ytd: decimal(10,2), затраты на обслуживание за год

### 3.25 API Integration Logs (DS-API-001)

**Логи интеграций с внешними системами**

- log_id: UUID, Primary Key
- integration_name: varchar(100), название интеграции
- endpoint_url: text, URL конечной точки
- request_method: varchar(10), HTTP метод
- request_headers: JSONB, заголовки запроса
- request_body: JSONB, тело запроса
- response_status: integer, HTTP статус ответа
- response_headers: JSONB, заголовки ответа
- response_body: JSONB, тело ответа
- execution_time: interval, время выполнения
- success: boolean, успешность запроса
- error_message: text, сообщение об ошибке
- retry_count: integer, количество повторов
- correlation_id: UUID, идентификатор корреляции
- timestamp: timestamp, время запроса
- user_id: UUID, пользователь инициировавший запрос

## 4. Data Relationships

### 4.1 Primary Relationships

**Core Entity Relationships:**

- Plants → Batches (Many-to-One)
- Plants → Biological_Assets (One-to-One)
- Batches → Cost_Allocations (One-to-Many)
- Users → Employees → Timesheets (One-to-Many)
- Tasks → Plants/Batches (Many-to-Many)
- Zones → Plants/Equipment/IoT_Sensors (One-to-Many)

**Financial Relationships:**

- Financial_Transactions → General_Ledger (One-to-Many)
- Biological_Assets → Cost_Allocations (Many-to-One)
- Purchase_Orders → Suppliers (Many-to-One)
- Payroll → Employees → Cost_Allocations (связь через labour costs)

**Traceability Relationships:**

- All entities → Audit_Trail (One-to-Many)
- Electronic_Signatures → Audit_Trail (One-to-One)
- Documents → Electronic_Signatures (One-to-Many)

### 4.2 Data Flow Patterns

**Real-time Event Flow:**

1. User Action → Kafka Event → Go Audit Consumer → immudb
2. IoT Sensor → Time-series DB → Analytics/Forecasting
3. Mobile Device → Offline SQLite → Sync → PostgreSQL

**Batch Processing Flow:**

1. Daily Cost Allocation: Timesheets → Cost_Allocations → Biological_Assets
2. Financial Closing: Transactions → General_Ledger → Financial_Reports
3. Compliance Reporting: All entities → Regulatory_Reports

## 5. Data Retention & WORM (DS-DI-003)

### 4.1 Retention Policies

- **GxP Critical Data**: минимум 10 лет
- **Audit Trail**: постоянное хранение
- **Training Records**: 7 лет после увольнения
- **IoT Metrics**: 5 лет с возможностью архивирования

### 4.2 WORM Implementation

- Использование MinIO с Object Lock для документов
- Immutable storage для audit trail (immudb или аналог)
- Версионирование всех критических таблиц
- Запрет операций DELETE/UPDATE для audit tables

## 5. Backup & Disaster Recovery (DS-DR-001)

### 5.1 Backup Strategy

- **PostgreSQL**: ежедневные полные + инкрементальные бэкапы
- **Object Storage**: репликация между регионами
- **Audit Trail**: гео-распределённое хранение
- **Retention**: минимум 5 лет для бэкапов

### 5.2 Geo-Redundancy

- Основной кластер: Дата-центр A
- Резервный кластер: Дата-центр B (другой регион)
- Асинхронная репликация для non-critical данных
- Синхронная репликация для audit trail

## 6. Security & Encryption (DS-SEC-001)

### 6.1 Data Encryption

- **At Rest**: AES-256 для всех данных
- **In Transit**: TLS 1.3 для всех соединений
- **Key Management**: HashiCorp Vault или AWS KMS
- **Database**: Transparent Data Encryption (TDE)

### 6.2 Access Control

- **Row-Level Security** для разграничения доступа к растениям
- **Column-Level Encryption** для PII данных
- **Audit всех доступов** к критическим данным
- **Автоматическая блокировка** подозрительной активности

## 7. Integration Patterns (DS-INT-001)

### 7.1 External Systems

- **State Tracking Systems**: METRC, BioTrackTHC
- **Laboratory Systems**: LIMS интеграция
- **Accounting Systems**: экспорт финансовых данных
- **Monitoring Systems**: Prometheus, Grafana

### 7.2 API Contracts

- **Contract-First**: ts-rest + Zod схемы
- **Versioning**: Semantic versioning для API
- **Backward Compatibility**: минимум 2 мажорные версии
- **Rate Limiting**: защита от злоупотреблений

## 8. Acceptance Criteria

### 8.1 Data Integrity

- Все операции логируются в audit trail
- Невозможность изменения исторических данных
- Криптографическая верификация целостности
- Автоматические проверки консистентности

### 8.2 Performance

- Время отклика API: < 200ms для 95% запросов
- Пропускная способность: > 1000 RPS
- Время восстановления: < 4 часа (RTO)
- Потеря данных: < 15 минут (RPO)

### 8.3 Compliance

- Полное соответствие ALCOA+ принципам
- Электронные подписи по 21 CFR Part 11
- Audit trail по EU GMP Annex 11
- Документированная трассируемость

## 9. Glossary

- **WORM**: Write Once Read Many
- **UUID**: Universally Unique Identifier
- **JSONB**: JSON Binary (PostgreSQL)
- **Audit Trail**: неизменяемый журнал действий
- **e-Signature**: электронная подпись, привязанная к действию
- **IoT Metric**: показания датчика в зоне выращивания
- **ALCOA+**: Attributable, Legible, Contemporaneous, Original, Accurate + Complete, Consistent, Enduring, Available
- **Biological Assets**: растения как финансовые активы согласно IFRS/GAAP
- **Fair Value**: справедливая стоимость биологических активов
- **Cost Allocation**: распределение затрат по партиям/проектам
- **PKI**: Public Key Infrastructure для цифровых подписей
- **Timesheet**: учёт рабочего времени сотрудников
- **SOP**: Standard Operating Procedure
- **RBAC**: Role-Based Access Control
- **2FA**: Two-Factor Authentication
- **SCUD**: Smart Card User Device
- **NFC**: Near Field Communication
- **GPS**: Global Positioning System
- **SQLite**: локальная база данных для offline операций
- **Kafka**: система обмена сообщениями для audit trail
- **immudb**: immutable база данных для audit trail
- **Go Audit Consumer**: высокопроизводительный сервис обработки audit events
- **RTO**: Recovery Time Objective
- **RPO**: Recovery Point Objective
- **TLS**: Transport Layer Security
- **AES-256**: стандарт шифрования данных
- **API**: Application Programming Interface
- **METRC**: государственная система tracking cannabis
