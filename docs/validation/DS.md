---
title: "Data Specification (DS)"
system: "ERP for GACP-Compliant Cannabis Cultivation"
version: "2.0"
status: "draft"
last_updated: "2025-10-16"
approved_by: "Pending QA Review"
approval_date: "Pending"
previous_version: "1.0 (2025-09-14)"
compliance_reviewed_against: 
  - "FDA 21 CFR Part 11"
  - "EU GMP Annex 11"
  - "ALCOA+ Principles"
compliance_status: "In Progress - Target 95%+"
validation_status: "Pending validation after approval"
---

# Data Specification (DS) v2.0

## 📋 **Document Overview**

Данный документ определяет структуру данных ERP системы для GACP-совместимого производства каннабиса. Версия 2.0 включает критические дополнения для полного соответствия FDA 21 CFR Part 11 и EU GMP Annex 11.

**🚨 Критические изменения в v2.0:**

- ✅ Добавлены модули Change Control, Deviation Management, CAPA
- ✅ Добавлены структуры Validation Management
- ✅ Дополнены Electronic Signatures для FDA § 11.50/11.70
- ✅ Расширен Audit Trail для retention management
- ✅ Добавлены Data Retention и Workflow Management структуры
- ✅ Добавлен Document Control System
- ✅ Все GxP-critical tables получили validation metadata

**🔗 Связанные документы:**

- **[CONTRACT_SPECIFICATIONS.md](../CONTRACT_SPECIFICATIONS.md)** - 🎯 **ГЛАВНЫЙ ДОКУМЕНТ** по всем Zod схемам данных
- **[SYSTEM_ARCHITECTURE.md](../SYSTEM_ARCHITECTURE.md)** - Архитектурный контекст
- **[DATA_REPLICATION_ARCHITECTURE.md](../infrastructure/DATA_REPLICATION_ARCHITECTURE.md)** - Стратегии репликации
- **[DATA_DICTIONARY_COMPLIANCE_AUDIT.md](../reports/DATA_DICTIONARY_COMPLIANCE_AUDIT.md)** - Audit report обосновывающий v2.0
- **[DS_COMPLIANCE_MATRIX.md](../reports/DS_COMPLIANCE_MATRIX.md)** - Матрица соответствия регуляторным требованиям
- **[FDA_21CFR_Part11.md](../compliance/FDA_21CFR_Part11.md)** - FDA требования
- **[EU_GMP_Annex11.md](../compliance/EU_GMP_Annex11.md)** - EU GMP требования

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

**Compliance**: EU GMP Annex 11 Clause 4, GACP

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
- validation_status: varchar(20), DEFAULT 'unvalidated', статус валидации (unvalidated, validated, under_review, superseded)
- validation_protocol_id: UUID, Foreign Key → validation_protocols, протокол валидации структуры данных
- last_validated_at: timestamp, дата последней валидации
- next_review_date: date, дата следующего periodic review
- change_control_id: UUID, Foreign Key → change_requests, если структура изменялась через change control
- retention_policy_id: UUID, Foreign Key → data_retention_policies, политика хранения
- audit_trail_id: UUID, Foreign Key → audit_trail

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

**Compliance**: EU GMP Chapter 6, GACP

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
- validation_status: varchar(20), DEFAULT 'unvalidated', статус валидации структуры данных
- validation_protocol_id: UUID, Foreign Key → validation_protocols
- last_validated_at: timestamp, дата последней валидации
- next_review_date: date, дата следующего periodic review
- change_control_id: UUID, Foreign Key → change_requests
- retention_policy_id: UUID, Foreign Key → data_retention_policies
- audit_trail_id: UUID, Foreign Key → audit_trail

### 3.4 Financial Transactions (DS-FIN-001)

**Финансовые транзакции системы**

**Compliance**: IAS 41, SOX, Tax regulations

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
- validation_status: varchar(20), DEFAULT 'unvalidated', статус валидации структуры данных
- validation_protocol_id: UUID, Foreign Key → validation_protocols
- last_validated_at: timestamp, дата последней валидации
- next_review_date: date, дата следующего periodic review
- change_control_id: UUID, Foreign Key → change_requests
- retention_policy_id: UUID, Foreign Key → data_retention_policies

### 3.5 General Ledger (DS-FIN-002)

**Главная книга - append-only структура**

**Compliance**: GAAP, IFRS, SOX

- ledger_entry_id: UUID, Primary Key
- account_code: varchar(20), код счёта
- account_name: varchar(255), название счёта
- debit_amount: decimal(15,2), дебетовая сумма
- validation_status: varchar(20), DEFAULT 'unvalidated', статус валидации структуры данных
- validation_protocol_id: UUID, Foreign Key → validation_protocols
- last_validated_at: timestamp, дата последней валидации
- next_review_date: date, дата следующего periodic review
- change_control_id: UUID, Foreign Key → change_requests
- retention_policy_id: UUID, Foreign Key → data_retention_policies
- audit_trail_id: UUID, Foreign Key → audit_trail
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

**Compliance**: FDA 21 CFR Part 11 § 11.10(e), EU GMP Annex 11 Clause 9

- audit_id: UUID, Primary Key
- entity_type: varchar(50), NOT NULL, тип сущности
- entity_id: UUID, NOT NULL, идентификатор сущности
- action: varchar(50), NOT NULL, тип действия (CREATE, UPDATE, DELETE, SIGN, APPROVE, REVIEW, ARCHIVE)
- old_value: JSONB, значение до изменения
- new_value: JSONB, значение после изменения
- field_changes: JSONB, детальные изменения полей для audit queries
- performed_by: UUID, NOT NULL, Foreign Key → users, пользователь
- performed_at: timestamp, DEFAULT now(), время действия
- reason: text, причина изменения (обязательно для GxP-критичных изменений)
- signature_id: UUID, Foreign Key → electronic_signatures, связь с электронной подписью
- session_id: UUID, идентификатор сессии
- correlation_id: UUID, связь с business transaction
- source_system: varchar(50), NOT NULL, источник изменения (web, mobile, api, batch_job)
- ip_address: inet, IP адрес пользователя
- user_agent: text, информация о браузере/устройстве
- geolocation: point, координаты (для mobile actions)
- gxp_critical: boolean, DEFAULT false, критичность для GxP
- validation_status: varchar(20), статус валидации записи (unvalidated, validated, reviewed)
- review_status: varchar(20), статус проверки аудитором (pending_review, reviewed, flagged)
- reviewed_by: UUID, Foreign Key → users, кто проверил запись
- reviewed_at: timestamp, дата проверки
- review_comment: text, комментарий аудитора
- retention_category: varchar(50), NOT NULL, категория хранения (gxp_critical, financial, operational, system)
- retention_policy_id: UUID, Foreign Key → data_retention_policies, связь с политикой хранения
- retention_expiry: date, дата истечения хранения (computed from policy)
- archive_status: varchar(20), DEFAULT 'active', статус архивирования (active, scheduled_for_archive, archived, scheduled_for_deletion)
- archived_at: timestamp, дата архивирования
- kafka_offset: bigint, offset в Kafka topic для replay capability
- kafka_partition: integer, partition Kafka
- kafka_topic: varchar(100), название Kafka topic
- immudb_tx_id: bigint, transaction ID в immudb для cryptographic proof
- checksum: varchar(64), NOT NULL, SHA-256 хэш записи для integrity verification

**Go Audit Consumer Architecture:**

- Go-based consumer для high-performance обработки Kafka events
- Batch processing с конфигурируемым размером batch (100-1000 events)
- Прямая запись в immudb для immutable storage
- Graceful shutdown с обработкой оставшихся событий
- Health checks и метрики для Prometheus
- Dead letter queue для failed events
- Партиционирование Kafka по entity_type для optimal performance
- Cryptographic linking между audit records (blockchain-like chain)

**ALCOA+ Compliance**:

- **Attributable**: performed_by, ip_address, user_agent, geolocation
- **Legible**: field_changes with human-readable diffs
- **Contemporaneous**: performed_at captures exact time
- **Original**: Immutable storage in immudb, checksum ensures integrity
- **Accurate**: old_value/new_value validation, immudb_tx_id for cryptographic proof
- **Complete**: All CRUD operations logged, reason mandatory for GxP
- **Consistent**: Uniform schema, kafka_offset for replay
- **Enduring**: Permanent retention per retention_category, archive_status tracking
- **Available**: Indexed for query performance, review_status for auditor workflow

### 3.18 Electronic Signatures (DS-ES-001)

**Электронные подписи по 21 CFR Part 11**

**Compliance**: FDA 21 CFR Part 11 § 11.50, § 11.70, § 11.100, EU GMP Annex 11 Clause 12

- signature_id: UUID, Primary Key
- user_id: UUID, NOT NULL, Foreign Key → users, пользователь
- signed_at: timestamp, DEFAULT now(), время подписания
- reason: text, NOT NULL, причина подписания
- meaning: varchar(100), NOT NULL, значение подписи (FDA § 11.50) - "Reviewed by", "Approved by", "Verified by", "Performed by"
- method: enum (password_2fa, qr_badge, hardware_token, pki_certificate), метод подписания
- auth_time: timestamp, NOT NULL, время последней аутентификации перед подписанием
- auth_method: varchar(50), метод аутентификации (password+2FA, biometric+PIN)
- ip_address: inet, IP адрес откуда поставлена подпись
- device_info: JSONB, информация об устройстве (browser, OS, mobile)
- geolocation: point, координаты места подписания (опционально для mobile)
- signature_hash: varchar(64), NOT NULL, хэш подписи (SHA-256)
- certificate_serial: varchar(100), серийный номер сертификата (для PKI)
- certificate_issuer: varchar(255), издатель сертификата
- certificate_valid_until: timestamp, срок действия сертификата
- biometric_hash: varchar(64), хэш биометрических данных (опционально)
- biometric_type: enum (fingerprint, facial_recognition, voice), тип биометрии
- valid: boolean, DEFAULT true, статус валидности
- revoked_at: timestamp, время аннулирования
- revoked_by: UUID, Foreign Key → users, кто аннулировал
- revocation_reason: text, причина аннулирования
- signed_entity_type: varchar(50), NOT NULL, тип подписанной сущности (FDA § 11.70) - "batch", "deviation", "change_request"
- signed_entity_id: UUID, NOT NULL, ID подписанной сущности
- signed_entity_version: varchar(20), версия сущности на момент подписания
- linked_record_hash: varchar(64), NOT NULL, хэш связанной записи для верификации целостности
- document_hash: varchar(64), хэш подписанного документа (если применимо)
- signature_format: enum (pkcs7, xades, cades, simple), формат подписи
- witness_required: boolean, DEFAULT false, требуется ли свидетель для критичных операций
- witness_signature_id: UUID, Foreign Key → electronic_signatures, подпись свидетеля
- parent_signature_id: UUID, Foreign Key → electronic_signatures, родительская подпись (для иерархии approvals)
- signature_level: integer, DEFAULT 1, уровень подписи в цепочке утверждений
- audit_trail_id: UUID, Foreign Key → audit_trail

**ALCOA+ Compliance**:

- **Attributable**: user_id, ip_address, device_info, geolocation
- **Legible**: reason, meaning clearly documented
- **Contemporaneous**: signed_at, auth_time
- **Original**: signature_hash, linked_record_hash ensure integrity
- **Accurate**: Cryptographic validation via hashes
- **Complete**: Full context (meaning, entity_type, entity_id) per FDA § 11.50/11.70
- **Consistent**: Standard signature schema
- **Enduring**: Permanent retention
- **Available**: Linked to audit_trail

### 3.19 Users (DS-AUTH-001)

**Пользователи системы**

**Compliance**: EU GMP Chapter 2 (Personnel), ISO 13485 Clause 6.2

- user_id: UUID, Primary Key
- username: varchar(100), UNIQUE NOT NULL, уникальное имя пользователя
- email: varchar(255), UNIQUE NOT NULL, email адрес
- first_name: varchar(100), NOT NULL, имя
- last_name: varchar(100), NOT NULL, фамилия
- employee_id: varchar(50), UNIQUE, номер сотрудника
- department: varchar(100), отдел
- position: varchar(100), должность
- user_type: enum (internal, external_auditor, internal_auditor, third_party_auditor, contractor), тип пользователя
- auditor_certification: varchar(200), сертификация аудитора (если применимо)
- organization: varchar(200), организация (для внешних пользователей)
- hire_date: date, дата найма
- termination_date: date, дата увольнения
- account_expiry_date: date, дата истечения аккаунта (для временных)
- active: boolean, DEFAULT true, активность аккаунта
- temporary_account: boolean, DEFAULT false, временная учетная запись
- supervisor_required: boolean, DEFAULT false, требуется сопровождение
- last_login: timestamp, последний вход
- failed_login_attempts: integer, DEFAULT 0, неудачные попытки входа
- password_last_changed: timestamp, последняя смена пароля
- two_factor_enabled: boolean, DEFAULT false, включена ли 2FA
- preferred_language: varchar(10), DEFAULT 'en', предпочитаемый язык
- timezone: varchar(50), DEFAULT 'UTC', часовой пояс
- mobile_device_ids: UUID[], привязанные мобильные устройства
- nda_signed: boolean, DEFAULT false, подписано ли соглашение о неразглашении
- background_check_status: enum (pending, approved, rejected), статус проверки
- access_areas: varchar(100)[], разрешенные области доступа
- training_current_status: varchar(20), DEFAULT 'incomplete', текущий статус обучения (complete, incomplete, overdue)
- training_compliance_percent: integer, DEFAULT 0, процент завершенных обязательных курсов
- mandatory_training_completed: boolean, DEFAULT false, завершено ли обязательное обучение
- gxp_training_required: boolean, DEFAULT false, требуется ли GxP обучение
- gxp_training_current: boolean, DEFAULT false, актуально ли GxP обучение
- gxp_training_expiry: date, дата истечения GxP обучения
- next_training_due: date, дата следующего обязательного обучения
- qualification_status: varchar(20), статус квалификации (unqualified, in_training, qualified, requalification_needed)
- qualification_date: date, дата квалификации
- qualification_valid_until: date, срок действия квалификации
- qualified_for_roles: varchar(100)[], роли для которых квалифицирован (QA Inspector, Batch Record Reviewer, etc.)
- last_training_assessment_date: date, дата последней оценки обучения
- last_training_assessment_score: integer, оценка последней аттестации
- audit_trail_id: UUID, Foreign Key → audit_trail

**ALCOA+ Compliance**:

- **Attributable**: employee_id, username uniquely identify user
- **Legible**: Clear qualification and training status
- **Contemporaneous**: last_login, training dates tracked
- **Original**: Immutable user creation
- **Accurate**: training_compliance_percent calculated from training_records
- **Complete**: Full employment and training lifecycle
- **Consistent**: Standard user schema
- **Enduring**: Retained per HR policy
- **Available**: Linkable to training_records, audit_trail

### 3.20 Roles (DS-AUTH-002)

**Роли и права доступа**

- role_id: UUID, Primary Key
- role_name: varchar(100), название роли
- role_category: enum (production, management, auditing, system), категория роли
- description: text, описание роли
- permissions: JSONB, права доступа
- plant_access_level: enum (none, read, write, admin), доступ к растениям
- batch_access_level: enum (none, read, write, admin), доступ к партиям
- financial_access_level: enum (none, read, write, admin), доступ к финансам
- reporting_access_level: enum (none, read, write, admin), доступ к отчётам
- audit_trail_access: boolean, доступ к audit trail
- data_export_allowed: boolean, разрешен экспорт данных
- document_print_allowed: boolean, разрешена печать документов
- system_config_access: boolean, доступ к настройкам системы
- capa_management: boolean, управление CAPA
- watermark_required: boolean, требуется watermark для документов
- session_timeout_minutes: integer, таймаут сессии в минутах
- max_concurrent_sessions: integer, максимальное количество одновременных сессий
- system_admin: boolean, системный администратор
- can_approve_batches: boolean, может утверждать партии
- can_sign_documents: boolean, может подписывать документы
- max_transaction_limit: decimal(15,2), лимит на транзакции
- zone_restrictions: UUID[], ограничения по зонам

**Предопределенные роли аудиторов**:

```sql
-- External Auditor (Regulatory)
INSERT INTO roles (role_name, role_category, audit_trail_access, data_export_allowed,
                   watermark_required, session_timeout_minutes, max_concurrent_sessions)
VALUES ('external_auditor', 'auditing', true, true, true, 120, 1);

-- Internal Auditor (QA)
INSERT INTO roles (role_name, role_category, audit_trail_access, data_export_allowed,
                   capa_management, session_timeout_minutes, max_concurrent_sessions)
VALUES ('internal_auditor', 'auditing', true, true, true, 240, 2);

-- Third-party Auditor (Certification)
INSERT INTO roles (role_name, role_category, audit_trail_access, data_export_allowed,
                   watermark_required, session_timeout_minutes, max_concurrent_sessions)
VALUES ('third_party_auditor', 'auditing', true, true, true, 180, 1);
```

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

---

## 3.26 Change Control System (NEW in v2.0)

### 3.26.1 Change Requests (DS-CHG-001)

**Управление изменениями в системе**

**Compliance**: EU GMP Annex 11 Clause 12, FDA 21 CFR Part 11 § 11.10(k)

- change_id: UUID, Primary Key
- change_number: varchar(50), UNIQUE NOT NULL, номер изменения (CR-2025-001)
- title: varchar(255), NOT NULL, краткое описание изменения
- description: text, NOT NULL, детальное описание
- change_type: enum (configuration, code, procedure, infrastructure, data), тип изменения
- requested_by: UUID, Foreign Key → users, инициатор
- requested_at: timestamp, DEFAULT now(), дата запроса
- department: varchar(100), отдел инициатора
- gxp_impact: enum (none, low, medium, high, critical), влияние на GxP
- affected_systems: text[], массив затронутых систем
- affected_sops: text[], массив затронутых SOP
- risk_assessment: text, оценка рисков
- impact_analysis: JSONB, детальный анализ влияния
- business_justification: text, NOT NULL, бизнес-обоснование
- regulatory_driver: varchar(100), регуляторный драйвер
- urgency: enum (routine, high, urgent, emergency), срочность
- status: enum (draft, submitted, under_review, approved, rejected, in_progress, testing, implemented, closed, cancelled), статус
- reviewed_by: UUID, рецензент
- reviewed_at: timestamp, дата рецензирования
- review_signature_id: UUID, Foreign Key → electronic_signatures
- approved_by: UUID, утверждающий
- approved_at: timestamp, дата утверждения
- approval_signature_id: UUID, Foreign Key → electronic_signatures
- implementation_plan: text, план внедрения
- implementation_date: date, дата внедрения
- implemented_by: UUID, исполнитель
- test_plan_required: boolean, DEFAULT false, требуется ли тест-план
- test_plan_id: UUID, ссылка на тест-план
- test_results: JSONB, результаты тестирования
- validation_required: boolean, DEFAULT false, требуется ли валидация
- validation_protocol_id: UUID, Foreign Key → validation_protocols
- validation_status: varchar(20), статус валидации
- rollback_plan: text, план отката
- rollback_tested: boolean, DEFAULT false, протестирован ли откат
- training_required: boolean, DEFAULT false, требуется ли обучение
- communication_sent: boolean, DEFAULT false, отправлено ли уведомление
- closed_by: UUID, кто закрыл
- closed_at: timestamp, дата закрытия
- effectiveness_check: text, проверка эффективности
- audit_trail_id: UUID, Foreign Key → audit_trail

**ALCOA+ Compliance**:

- **Attributable**: requested_by, approved_by, implemented_by
- **Legible**: Structured text fields, UTF-8
- **Contemporaneous**: requested_at, approved_at with DEFAULT now()
- **Original**: Immutable storage in ImmuDB
- **Accurate**: Zod validation, enum constraints
- **Complete**: All required fields NOT NULL
- **Consistent**: Uniform schema across change records
- **Enduring**: Permanent retention (never deleted)
- **Available**: Indexed for audit queries

### 3.26.2 Change Approvals (DS-CHG-002)

**Утверждения изменений**

**Compliance**: EU GMP Annex 11 Clause 12, FDA 21 CFR Part 11 § 11.10(g)

- approval_id: UUID, Primary Key
- change_id: UUID, NOT NULL, Foreign Key → change_requests
- approver_role: varchar(50), NOT NULL, роль утверждающего (qa_manager, it_manager, process_owner)
- required: boolean, DEFAULT true, обязательно ли утверждение
- approver_id: UUID, Foreign Key → users, кто утверждает
- approval_status: enum (pending, approved, rejected, conditional), статус утверждения
- approved_at: timestamp, дата утверждения
- signature_id: UUID, Foreign Key → electronic_signatures, подпись утверждения
- comments: text, комментарии утверждающего
- conditions: text, условия (для conditional approvals)
- audit_trail_id: UUID, Foreign Key → audit_trail

### 3.26.3 Change Implementation History (DS-CHG-003)

**История внедрения изменений**

**Compliance**: EU GMP Annex 11 Clause 12, FDA 21 CFR Part 11 § 11.10(e)

- history_id: UUID, Primary Key
- change_id: UUID, NOT NULL, Foreign Key → change_requests
- step_number: integer, NOT NULL, номер шага
- step_description: text, NOT NULL, описание шага
- performed_by: UUID, NOT NULL, Foreign Key → users, исполнитель
- performed_at: timestamp, DEFAULT now(), время выполнения
- status: enum (pending, completed, failed, skipped), статус шага
- evidence: JSONB, доказательства (screenshots, logs, test results)
- issues_encountered: text, встреченные проблемы
- rollback_performed: boolean, DEFAULT false, был ли выполнен откат
- signature_id: UUID, Foreign Key → electronic_signatures
- audit_trail_id: UUID, Foreign Key → audit_trail

---

## 3.27 Deviation Management System (NEW in v2.0)

### 3.27.1 Deviations (DS-DEV-001)

**Управление отклонениями и нарушениями**

**Compliance**: EU GMP Annex 11 Clause 13, ICH Q10

- deviation_id: UUID, Primary Key
- deviation_number: varchar(50), UNIQUE NOT NULL, номер отклонения (DEV-2025-001)
- title: varchar(255), NOT NULL, краткое описание
- description: text, NOT NULL, детальное описание отклонения
- deviation_type: enum (procedure, specification, system, environmental, equipment), тип отклонения
- detected_at: timestamp, NOT NULL, время обнаружения
- detected_by: UUID, NOT NULL, Foreign Key → users, кто обнаружил
- detection_method: enum (inspection, audit, monitoring, complaint), метод обнаружения
- severity: enum (minor, major, critical), серьезность
- gxp_impact: enum (none, potential, actual), влияние на GxP
- patient_safety_impact: boolean, DEFAULT false, влияние на безопасность пациента
- product_quality_impact: boolean, DEFAULT false, влияние на качество продукта
- batch_id: UUID, Foreign Key → batches, связанная партия
- plant_id: UUID, Foreign Key → plants, связанное растение
- equipment_id: UUID, Foreign Key → equipment, связанное оборудование
- sop_id: varchar(50), нарушенная SOP
- zone_id: UUID, Foreign Key → zones, зона где произошло
- immediate_action_taken: text, предпринятые немедленные действия
- immediate_action_by: UUID, Foreign Key → users, кто предпринял действия
- immediate_action_at: timestamp, время предпринятия действий
- investigation_required: boolean, DEFAULT true, требуется ли расследование
- investigation_id: UUID, Foreign Key → root_cause_analyses, ID расследования
- investigation_deadline: date, крайний срок расследования
- investigation_status: enum (pending, in_progress, completed), статус расследования
- root_cause: text, найденная root cause
- root_cause_identified_at: timestamp, когда найдена root cause
- capa_required: boolean, DEFAULT true, требуется ли CAPA
- capa_id: UUID, Foreign Key → capa_records, ID CAPA
- status: enum (open, under_investigation, capa_pending, capa_in_progress, effectiveness_check, closed, cancelled), статус отклонения
- reviewed_by: UUID, Foreign Key → users, рецензент
- reviewed_at: timestamp, дата рецензирования
- review_signature_id: UUID, Foreign Key → electronic_signatures
- approved_by: UUID, Foreign Key → users, утверждающий
- approved_at: timestamp, дата утверждения
- approval_signature_id: UUID, Foreign Key → electronic_signatures
- closed_by: UUID, кто закрыл
- closed_at: timestamp, дата закрытия
- closure_signature_id: UUID, Foreign Key → electronic_signatures
- effectiveness_verified: boolean, подтверждена ли эффективность
- recurring_issue: boolean, DEFAULT false, повторяющаяся ли проблема
- related_deviations: UUID[], массив связанных отклонений
- audit_trail_id: UUID, Foreign Key → audit_trail

**ALCOA+ Compliance**:

- **Attributable**: detected_by, immediate_action_by, reviewed_by, approved_by
- **Legible**: Structured fields, clear descriptions
- **Contemporaneous**: detected_at, immediate_action_at with real-time capture
- **Original**: Immutable storage in ImmuDB
- **Accurate**: Zod validation, severity/impact enums
- **Complete**: All required fields enforced
- **Consistent**: Uniform schema for all deviation types
- **Enduring**: Permanent retention for GxP records
- **Available**: Indexed for trending and audit queries

### 3.27.2 Root Cause Analysis (DS-DEV-002)

**Анализ первопричин отклонений**

**Compliance**: EU GMP Annex 11 Clause 13, ICH Q10

- rca_id: UUID, Primary Key
- deviation_id: UUID, NOT NULL, Foreign Key → deviations
- method: enum (5_whys, fishbone, fault_tree, pareto), метод анализа
- analysis_data: JSONB, NOT NULL, данные специфичные для метода
- root_causes: JSONB, NOT NULL, массив найденных первопричин с категориями
- contributing_factors: JSONB, содействующие факторы
- performed_by: UUID, NOT NULL, Foreign Key → users, кто провел анализ
- performed_at: timestamp, DEFAULT now(), дата проведения
- reviewed_by: UUID, рецензент
- review_signature_id: UUID, Foreign Key → electronic_signatures
- evidence: JSONB, доказательства (ссылки на документы, фото, данные)
- analysis_report: text, отчет по анализу
- audit_trail_id: UUID, Foreign Key → audit_trail

---

## 3.28 CAPA System (NEW in v2.0)

### 3.28.1 CAPA Records (DS-CAPA-001)

**Corrective and Preventive Actions (CAPA)**

**Compliance**: ICH Q10, FDA 21 CFR Part 11

- capa_id: UUID, Primary Key
- capa_number: varchar(50), UNIQUE NOT NULL, номер CAPA (CAPA-2025-001)
- source_type: enum (deviation, audit, complaint, trend, risk_assessment), источник CAPA
- source_id: UUID, ID источника (deviation_id, audit_id, etc.)
- action_type: enum (corrective, preventive, both), тип действия
- problem_statement: text, NOT NULL, формулировка проблемы
- root_cause: text, NOT NULL, первопричина
- action_plan: text, NOT NULL, план действий
- actions: JSONB, NOT NULL, массив конкретных действий с шагами
- responsible_person: UUID, NOT NULL, Foreign Key → users, ответственный
- backup_person: UUID, Foreign Key → users, замена ответственного
- target_completion_date: date, NOT NULL, плановая дата завершения
- actual_completion_date: date, фактическая дата завершения
- implementation_status: enum (pending, in_progress, completed, overdue), статус внедрения
- implementation_evidence: JSONB, доказательства внедрения
- effectiveness_check_required: boolean, DEFAULT true, требуется ли проверка эффективности
- effectiveness_check_date: date, дата проверки эффективности
- effectiveness_check_result: enum (effective, not_effective, pending), результат проверки
- effectiveness_check_by: UUID, Foreign Key → users, кто проверил
- effectiveness_check_notes: text, заметки по проверке
- status: enum (open, in_progress, pending_verification, closed, extended), статус CAPA
- closed_by: UUID, кто закрыл
- closed_at: timestamp, дата закрытия
- closure_signature_id: UUID, Foreign Key → electronic_signatures
- audit_trail_id: UUID, Foreign Key → audit_trail

**ALCOA+ Compliance**:

- **Attributable**: responsible_person, effectiveness_check_by, closed_by
- **Legible**: Clear action plans, structured JSONB
- **Contemporaneous**: Timestamps for each milestone
- **Original**: Immutable storage
- **Accurate**: Validation of action completion
- **Complete**: All phases documented
- **Consistent**: Uniform CAPA process
- **Enduring**: Permanent retention
- **Available**: Queryable for effectiveness trending

---

## 3.29 Validation Management System (NEW in v2.0)

### 3.29.1 Validation Protocols (DS-VAL-001)

**Протоколы валидации системы**

**Compliance**: FDA 21 CFR Part 11 § 11.10(a), EU GMP Annex 11 Clause 4

- protocol_id: UUID, Primary Key
- protocol_number: varchar(50), UNIQUE NOT NULL, номер протокола (IQ-001, OQ-002, PQ-003)
- protocol_type: enum (IQ, OQ, PQ, revalidation, partial), тип протокола
- system_name: varchar(255), NOT NULL, название системы
- system_version: varchar(50), версия системы
- gamp_category: enum (category_3, category_4, category_5), категория GAMP
- gxp_impact: enum (none, low, medium, high, critical), влияние на GxP
- title: varchar(255), NOT NULL, заголовок протокола
- purpose: text, NOT NULL, цель валидации
- scope: text, NOT NULL, область валидации
- acceptance_criteria: text, NOT NULL, критерии приемки
- urs_reference: varchar(100), ссылка на URS
- fs_reference: varchar(100), ссылка на FS
- ds_reference: varchar(100), ссылка на DS
- risk_assessment_ref: varchar(100), ссылка на risk assessment
- author: UUID, NOT NULL, Foreign Key → users, автор
- author_signature_id: UUID, Foreign Key → electronic_signatures
- authored_at: timestamp, дата авторства
- reviewer: UUID, Foreign Key → users, рецензент
- reviewer_signature_id: UUID, Foreign Key → electronic_signatures
- reviewed_at: timestamp, дата рецензирования
- approver: UUID, Foreign Key → users, утверждающий
- approver_signature_id: UUID, Foreign Key → electronic_signatures
- approved_at: timestamp, дата утверждения
- status: enum (draft, approved, in_execution, completed, failed, superseded), статус протокола
- execution_start_date: date, дата начала выполнения
- execution_end_date: date, дата окончания выполнения
- executed_by: UUID, Foreign Key → users, исполнитель
- test_cases_total: integer, всего тест-кейсов
- test_cases_passed: integer, пройдено тест-кейсов
- test_cases_failed: integer, провалено тест-кейсов
- test_cases_blocked: integer, заблокировано тест-кейсов
- overall_result: enum (pass, fail, pass_with_deviations), общий результат
- report_id: UUID, ID отчета валидации
- report_signature_id: UUID, подпись отчета
- next_review_date: date, дата следующего periodic review
- audit_trail_id: UUID, Foreign Key → audit_trail

**ALCOA+ Compliance**:

- **Attributable**: author, reviewer, approver, executed_by
- **Legible**: Structured protocol documentation
- **Contemporaneous**: Timestamps for each lifecycle phase
- **Original**: Immutable protocol versions
- **Accurate**: Test results validated and signed
- **Complete**: All protocol phases documented
- **Consistent**: Standard protocol template
- **Enduring**: Permanent retention as GxP record
- **Available**: Queryable for regulatory inspection

### 3.29.2 Validation Test Cases (DS-VAL-002)

**Тест-кейсы валидации**

**Compliance**: FDA 21 CFR Part 11 § 11.10(a), EU GMP Annex 11 Clause 4

- test_case_id: UUID, Primary Key
- protocol_id: UUID, NOT NULL, Foreign Key → validation_protocols
- test_case_number: varchar(50), NOT NULL, номер тест-кейса (TC-001, TC-002)
- requirement_id: varchar(100), ссылка на требование URS/FS
- test_objective: text, NOT NULL, цель теста
- prerequisites: text, предварительные условия
- test_steps: JSONB, NOT NULL, шаги теста с ожидаемыми результатами
- expected_result: text, NOT NULL, ожидаемый результат
- execution_date: date, дата выполнения
- executed_by: UUID, Foreign Key → users, исполнитель
- actual_result: text, фактический результат
- status: enum (not_executed, pass, fail, blocked, skipped), статус выполнения
- evidence_attachments: JSONB, приложения (screenshots, logs, data files)
- deviation_id: UUID, Foreign Key → deviations, если тест провален
- comments: text, комментарии
- signature_id: UUID, Foreign Key → electronic_signatures
- audit_trail_id: UUID, Foreign Key → audit_trail

### 3.29.3 Periodic Reviews (DS-VAL-003)

**Периодические проверки валидации**

**Compliance**: FDA 21 CFR Part 11 § 11.10(a), EU GMP Annex 11 Clause 11

- review_id: UUID, Primary Key
- review_type: enum (annual, post_change, post_deviation, triggered), тип проверки
- system_name: varchar(255), NOT NULL, название системы
- system_version: varchar(50), версия системы
- review_period_start: date, NOT NULL, начало периода проверки
- review_period_end: date, NOT NULL, конец периода проверки
- validation_status: enum (remains_valid, revalidation_required), статус валидности
- changes_since_last_review: JSONB, изменения с последней проверки
- deviations_summary: JSONB, сводка по отклонениям
- incidents_summary: JSONB, сводка по инцидентам
- findings: JSONB, находки проверки
- actions_required: JSONB, требуемые действия
- reviewed_by: UUID, NOT NULL, Foreign Key → users, кто проводил проверку
- reviewed_at: timestamp, DEFAULT now(), дата проверки
- review_signature_id: UUID, Foreign Key → electronic_signatures
- approved_by: UUID, Foreign Key → users, утверждающий
- approved_at: timestamp, дата утверждения
- approval_signature_id: UUID, Foreign Key → electronic_signatures
- next_review_date: date, NOT NULL, дата следующей проверки
- audit_trail_id: UUID, Foreign Key → audit_trail

---

## 3.30 Document Control System (NEW in v2.0)

### 3.30.1 Controlled Documents (DS-DOC-001)

**Управление контролируемыми документами**

**Compliance**: EU GMP Annex 11 Clause 7, ISO 13485

- document_id: UUID, Primary Key
- document_number: varchar(50), UNIQUE NOT NULL, номер документа (SOP-001, FORM-002)
- document_type: enum (SOP, form, policy, protocol, report, specification), тип документа
- title: varchar(255), NOT NULL, название документа
- description: text, описание
- gxp_critical: boolean, DEFAULT false, GxP-критический документ
- confidentiality_level: enum (public, internal, confidential, restricted), уровень конфиденциальности
- current_version: varchar(20), NOT NULL, текущая версия
- status: enum (draft, under_review, approved, effective, obsolete, archived), статус документа
- created_at: timestamp, DEFAULT now(), дата создания
- created_by: UUID, NOT NULL, Foreign Key → users, создатель
- effective_date: date, дата вступления в силу
- review_date: date, дата последнего review
- next_review_date: date, дата следующего review
- retirement_date: date, дата выбытия
- author: UUID, Foreign Key → users, автор
- author_signature_id: UUID, Foreign Key → electronic_signatures
- reviewer: UUID, Foreign Key → users, рецензент
- reviewer_signature_id: UUID, Foreign Key → electronic_signatures
- approver: UUID, Foreign Key → users, утверждающий
- approver_signature_id: UUID, Foreign Key → electronic_signatures
- training_required: boolean, DEFAULT false, требуется ли обучение
- training_course_id: UUID, Foreign Key → training_courses
- distribution_list: UUID[], массив user/role IDs кто должен прочитать
- read_acknowledgement_required: boolean, DEFAULT false, требуется ли подтверждение прочтения
- file_path: varchar(500), путь к файлу
- file_checksum: varchar(64), SHA-256 checksum файла
- audit_trail_id: UUID, Foreign Key → audit_trail

**ALCOA+ Compliance**:

- **Attributable**: created_by, author, reviewer, approver
- **Legible**: Document metadata clearly structured
- **Contemporaneous**: Version timestamps
- **Original**: File checksum ensures integrity
- **Accurate**: Approval workflow validated
- **Complete**: Full document lifecycle tracked
- **Consistent**: Standard document numbering
- **Enduring**: Retention per document type
- **Available**: Searchable document repository

### 3.30.2 Document Versions (DS-DOC-002)

**Версии контролируемых документов**

**Compliance**: EU GMP Annex 11 Clause 7, FDA 21 CFR Part 11 § 11.10(e)

- version_id: UUID, Primary Key
- document_id: UUID, NOT NULL, Foreign Key → controlled_documents
- version_number: varchar(20), NOT NULL, номер версии
- change_description: text, NOT NULL, описание изменений
- change_reason: text, причина изменений
- change_request_id: UUID, Foreign Key → change_requests, связанное change control
- file_path: varchar(500), NOT NULL, путь к файлу версии
- file_checksum: varchar(64), NOT NULL, SHA-256 checksum
- file_size_bytes: bigint, размер файла
- created_at: timestamp, DEFAULT now(), дата создания версии
- created_by: UUID, NOT NULL, Foreign Key → users, создатель
- superseded_at: timestamp, дата замены
- superseded_by: UUID, Foreign Key → document_versions, следующая версия
- approved_at: timestamp, дата утверждения
- approved_by: UUID, Foreign Key → users, утверждающий
- approval_signature_id: UUID, Foreign Key → electronic_signatures
- audit_trail_id: UUID, Foreign Key → audit_trail
- UNIQUE(document_id, version_number)

### 3.30.3 Document Acknowledgements (DS-DOC-003)

**Подтверждения прочтения документов**

**Compliance**: EU GMP Annex 11 Clause 2, ISO 13485

- acknowledgement_id: UUID, Primary Key
- document_id: UUID, NOT NULL, Foreign Key → controlled_documents
- version_id: UUID, NOT NULL, Foreign Key → document_versions
- user_id: UUID, NOT NULL, Foreign Key → users, кто прочитал
- acknowledged_at: timestamp, DEFAULT now(), дата подтверждения
- signature_id: UUID, Foreign Key → electronic_signatures
- test_taken: boolean, DEFAULT false, пройден ли тест на понимание
- test_score: integer, оценка теста
- test_passed: boolean, пройден ли тест
- audit_trail_id: UUID, Foreign Key → audit_trail
- UNIQUE(document_id, version_id, user_id)

---

## 3.31 Quality Events System (NEW in v2.0)

### 3.31.1 Quality Events (DS-QE-001)

**Управление качественными событиями**

**Compliance**: EU GMP Chapter 8, ICH Q10

- event_id: UUID, Primary Key
- event_number: varchar(50), UNIQUE NOT NULL, номер события (QE-2025-001)
- event_type: enum (oos, oot, product_complaint, equipment_failure, environmental_excursion, contamination, labeling_error), тип события
- detected_at: timestamp, NOT NULL, время обнаружения
- detected_by: UUID, NOT NULL, Foreign Key → users, кто обнаружил
- description: text, NOT NULL, описание события
- severity: enum (minor, major, critical), серьезность
- patient_safety_risk: boolean, DEFAULT false, риск для безопасности пациента
- product_quality_impact: boolean, DEFAULT false, влияние на качество продукта
- reportable_event: boolean, DEFAULT false, требуется ли сообщать в органы
- batch_id: UUID, Foreign Key → batches, затронутая партия
- product_id: UUID, затронутый продукт
- equipment_id: UUID, Foreign Key → equipment, затронутое оборудование
- zone_id: UUID, Foreign Key → zones, зона события
- investigation_required: boolean, DEFAULT true, требуется ли расследование
- investigation_id: UUID, Foreign Key → root_cause_analyses, ID расследования
- affected_batches: UUID[], массив затронутых партий
- affected_products: UUID[], массив затронутых продуктов
- quarantine_required: boolean, DEFAULT false, требуется ли карантин
- recall_required: boolean, DEFAULT false, требуется ли отзыв
- capa_required: boolean, DEFAULT true, требуется ли CAPA
- capa_id: UUID, Foreign Key → capa_records, ID CAPA
- status: enum (open, under_investigation, pending_capa, pending_closure, closed), статус
- closed_by: UUID, кто закрыл
- closed_at: timestamp, дата закрытия
- closure_signature_id: UUID, Foreign Key → electronic_signatures
- regulatory_notification_required: boolean, DEFAULT false, требуется ли уведомление регулятора
- notification_sent_at: timestamp, дата отправки уведомления
- audit_trail_id: UUID, Foreign Key → audit_trail

**ALCOA+ Compliance**:

- **Attributable**: detected_by, closed_by
- **Legible**: Clear event descriptions
- **Contemporaneous**: detected_at captures real-time
- **Original**: Immutable event records
- **Accurate**: Severity validated against criteria
- **Complete**: Full investigation tracked
- **Consistent**: Uniform event classification
- **Enduring**: Permanent retention
- **Available**: Trending and analysis queries

---

## 3.32 Data Retention & Archive Management (NEW in v2.0)

### 3.32.1 Data Retention Policies (DS-DI-004)

**Политики хранения данных**

**Compliance**: FDA 21 CFR Part 11 § 11.10(c)

- policy_id: UUID, Primary Key
- entity_type: varchar(50), NOT NULL, тип сущности (plants, batches, audit_trail)
- retention_period: interval, NOT NULL, период хранения (7 years, 25 years)
- retention_basis: varchar(100), основание (FDA, EU GMP, Tax Law)
- archive_after: interval, когда архивировать (переместить в cold storage)
- destruction_allowed: boolean, DEFAULT false, разрешено ли уничтожение
- legal_hold_override: boolean, DEFAULT false, может ли legal hold переопределить
- created_at: timestamp, DEFAULT now()
- approved_by: UUID, NOT NULL, Foreign Key → users, утверждающий
- approval_signature_id: UUID, Foreign Key → electronic_signatures
- effective_date: date, NOT NULL, дата вступления в силу
- audit_trail_id: UUID, Foreign Key → audit_trail

### 3.32.2 Archived Records (DS-DI-005)

**Архивированные записи**

**Compliance**: FDA 21 CFR Part 11 § 11.10(c)

- archive_id: UUID, Primary Key
- entity_type: varchar(50), NOT NULL, тип сущности
- entity_id: UUID, NOT NULL, ID сущности
- archived_at: timestamp, DEFAULT now(), дата архивирования
- archived_by: UUID, NOT NULL, Foreign Key → users, кто архивировал
- retention_expiry: date, NOT NULL, дата истечения хранения
- archive_location: varchar(255), расположение в хранилище (storage path/URL)
- archive_format: enum (json, parquet, pdf), формат архива
- archive_checksum: varchar(64), SHA-256 checksum архива
- retrieval_time_estimate: interval, оценка времени на восстановление (SLA)
- legal_hold: boolean, DEFAULT false, под legal hold
- destruction_date: date, дата уничтожения
- destruction_by: UUID, Foreign Key → users, кто уничтожил
- destruction_signature_id: UUID, Foreign Key → electronic_signatures
- destruction_certificate: varchar(500), путь к certificate of destruction
- audit_trail_id: UUID, Foreign Key → audit_trail

---

## 3.33 Workflow Management System (NEW in v2.0)

### 3.33.1 Workflow Definitions (DS-WF-004)

**Определения workflow процессов**

**Compliance**: FDA 21 CFR Part 11 § 11.10(f)

- workflow_id: UUID, Primary Key
- workflow_name: varchar(100), NOT NULL, название workflow
- entity_type: varchar(50), NOT NULL, тип сущности (batch, deviation, change)
- workflow_type: varchar(50), тип workflow (approval, review, release)
- version: varchar(20), NOT NULL, версия workflow
- status: enum (active, draft, retired), статус
- states: JSONB, NOT NULL, массив допустимых состояний
- transitions: JSONB, NOT NULL, допустимые переходы между состояниями
- transition_rules: JSONB, бизнес-правила для переходов
- approval_requirements: JSONB, требования к утверждению на каждом шаге
- sla_timings: JSONB, ожидаемое время на каждый шаг
- created_at: timestamp, DEFAULT now()
- created_by: UUID, NOT NULL, Foreign Key → users, создатель
- approved_by: UUID, Foreign Key → users, утверждающий
- approval_signature_id: UUID, Foreign Key → electronic_signatures
- effective_date: date, NOT NULL, дата вступления в силу
- retirement_date: date, дата выбытия
- audit_trail_id: UUID, Foreign Key → audit_trail

**ALCOA+ Compliance**:

- **Attributable**: created_by, approved_by
- **Legible**: Structured workflow definitions
- **Contemporaneous**: Version timestamps
- **Original**: Immutable workflow versions
- **Accurate**: Transition rules validated
- **Complete**: All states and transitions defined
- **Consistent**: Standard workflow schema
- **Enduring**: Historical workflows retained
- **Available**: Workflow audit queries

### 3.33.2 Workflow Execution Logs (DS-WF-005)

**Логи выполнения workflow**

**Compliance**: FDA 21 CFR Part 11 § 11.10(f)

- execution_id: UUID, Primary Key
- workflow_id: UUID, NOT NULL, Foreign Key → workflow_definitions
- entity_type: varchar(50), NOT NULL, тип сущности
- entity_id: UUID, NOT NULL, ID сущности
- current_state: varchar(50), NOT NULL, текущее состояние
- previous_state: varchar(50), предыдущее состояние
- started_at: timestamp, DEFAULT now(), время начала
- completed_at: timestamp, время завершения
- status: enum (in_progress, completed, failed), статус выполнения
- assigned_to: UUID, Foreign Key → users, кому назначено
- assigned_at: timestamp, время назначения
- transition_valid: boolean, DEFAULT true, валиден ли переход
- validation_errors: JSONB, ошибки валидации
- audit_trail_id: UUID, Foreign Key → audit_trail
- signature_required: boolean, требуется ли подпись
- signature_id: UUID, Foreign Key → electronic_signatures

---

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

**Compliance & Quality Relationships (NEW in v2.0):**

- All GxP entities → Change_Requests (Many-to-Many) - любое изменение GxP-критичной записи требует change control
- Change_Requests → Change_Approvals (One-to-Many) - multi-level approval workflow
- Change_Requests → Change_Implementation_History (One-to-Many) - история реализации изменений
- Quality_Events → Deviations → Root_Cause_Analyses (One-to-One) - расследование отклонений
- Deviations/Quality_Events → CAPA_Records (Many-to-One) - корректирующие действия
- System_Components → Validation_Protocols (One-to-Many) - валидация систем
- Validation_Protocols → Validation_Test_Cases (One-to-Many) - тест-кейсы валидации
- Validation_Protocols → Periodic_Reviews (One-to-Many) - периодические пере-валидации
- Controlled_Documents → Document_Versions (One-to-Many) - версионирование документов
- Controlled_Documents → Document_Acknowledgements (Many-to-Many через version) - подтверждения прочтения
- Controlled_Documents → Training_Courses (One-to-Many) - связь документов с обучением
- Batches/Equipment/Zones → Quality_Events (One-to-Many) - качественные события
- All entity_types → Data_Retention_Policies (Many-to-One) - политики хранения
- All entity_types → Archived_Records (One-to-Many) - архивирование записей
- Workflow_Definitions → Workflow_Execution_Logs (One-to-Many) - выполнение workflows
- All approval processes → Electronic_Signatures (One-to-Many) - электронные подписи
- All compliance entities → Audit_Trail (One-to-Many) - полная аудит-трейл прослеживаемость

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
