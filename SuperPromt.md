# Copilot Super-Prompt for GACP-Compliant ERP

## Overview

You are my Copilot agent. Your task is to **design, implement, validate, and deploy a fully working ERP system** for a GACP-compliant cannabis farm. Use only **verified OpenSource solutions**. Generate **only runnable, production-ready code**—no placeholders or pseudocode.

All work must comply with **GACP, Annex 11, FDA 21 CFR Part 11, ALCOA+, GAMP5**. Infrastructure must be **Kubernetes-ready, containerized, and geo-redundant**.

---

## Regulatory Requirements

The system must comply with:

- WHO GACP 2003
- EMA GACP 2006
- EU GMP Annex 11 (2025 draft update)
- FDA 21 CFR Part 11
- MHRA GxP Data Integrity (ALCOA+)
- GAMP 5 (2nd edition, 2022)

---

## Modules & Features

### 1. Plant Lifecycle Management

- Track plant life from clone → vegetative → flowering → harvest → storage
- CRUD API endpoints + frontend
- Audit Trail for every action
- IoT integration: temperature, humidity, CO2, light, solution metrics, drainage metrics

### 2. Audit Trail & Data Integrity

- Immutable WORM audit logs
- Timestamped actions
- Role-based access
- E-signatures with MFA
- ALCOA+ data integrity

### 3. SOP Automation

- Access control
- Change control workflows
- Incident management
- Training integration

### 4. Training & Certification

- Curriculum management
- Position/role matrix
- Exams & automated evaluation
- Records for audit purposes

### 5. Validation & Compliance

- Validation Pack: VMP, IQ/OQ/PQ
- Traceability Matrix: URS → FS → DS → TestCases → Reports
- Unit, integration, and E2E tests
- Exportable compliance reports

### 6. DRP & BCP

- Disaster Recovery Plan scenarios
- Business Continuity workflows
- Failover orchestration
- Test reports and logs

### 7. IoT & Monitoring

- Sensor integration (ModBus, EMQX broker)
- Metrics storage: VictoriaMetrics + Loki
- Dashboard: Next.js frontend
- Alerts via OTEL/Tempo
- Historical analytics & forecasts

### 8. Reporting & Analytics

- Custom report builder
- Predefined report templates
- Data export (CSV, PDF)
- Dashboard widgets for key metrics

### 9. Nutrients / Inventory / Procurement

- Nutrients: расчёт питательных растворов по фазам роста.

- Inventory: контроль запасов, сроков годности, движение партий.

- Procurement: заказ химикатов и расходников, связка с Forecasting.

### 10. Forecasting / Cycle Planning

- Прогнозирование потребностей в ресурсах
- Планирование циклов роста и сбора урожая
- Связка с Procurement для автоматизации заказов
- Аналитика и отчётность по прогнозам
- Оптимизация процессов на основе данных
- Планирование рабочих ресурсов и бюджета
- План работ для персонала

### 11. Supplier Management / Certificates / Logistics

- Supplier must track all suppliers and their GACP certificates
- Certificates must be stored in WORM storage with expiry monitoring
- Logistics must track all shipments, conditions, and generate IncidentReports
- All changes must be logged in Audit

### 12. Incident Management

- Incident reporting and tracking
- Root cause analysis and CAPA
- Integration with Training for affected personnel

## Модули

### 1. PlantModule

- Управление жизненным циклом растений.
- Связка с SOPModule, ForecastingModule, InventoryModule, SpatialModule.
- Immutable logging через AuditModule.

### 2. SOPModule

- Автоматизация процедур по всем операциям.
- Интеграция с TrainingModule (проверка компетенции) и AuditModule.
- Все шаги должны быть traceable для GACP.

### 3. TrainingModule

- Курсы и тестирование персонала.
- Привязка к должностям через PositionMatrix.
- Запись результатов в AuditModule.

### 4. ForecastingModule

- Планирование будущих циклов.
- Прогноз урожайности, ресурсов, загрузки оборудования.
- Интеграция: PlantModule, SOPModule, EquipmentModule, SpatialModule, IoTModule, InventoryModule.

### 5. Nutrients & Inventory / ProcurementModule

- Расчёт питательных растворов по фазам.
- Учёт всех химикатов, растворов, batch tracking, сроки годности.
- Автоматическое формирование PurchaseOrders.
- Все операции фиксируются в AuditModule.
- Интеграция с ForecastingModule и SOPModule.

### 6. SupplierModule / Certificates / LogisticsModule

- Хранение всех контрагентов и их GACP-сертификатов.
- Certificates → WORM storage, проверка expiry.
- Логистика: Shipment, TransportLog, IncidentReport.
- Все действия immutable логируются → AuditModule.
- Интеграция: ProcurementModule, InventoryModule, ReportingModule.

### 7. EquipmentModule

- Учёт оборудования, его состояния, привязка к циклам.
- Планирование через ForecastingModule.

### 8. SpatialModule

- Визуальные и математические модели помещений.
- Привязка растений и оборудования через координаты.
- Интеграция с IoTModule и ForecastingModule.

### 9. IoTModule

- Сбор метрик температуры, влажности, CO2, света.
- Поддержка прогнозирования и контроля условий.

### 10. AuditModule

- Kafka consumer subscription for all relevant topics.
- Immutable audit trail для всех операций.
- Логи пользователей, изменений SOP, Inventory, Forecasting.
- Подготовка GACP-ready отчётов через ReportingModule.

### 11. ReportingModule

- Генерация всех GACP-ready отчётов.
- Источники: AuditModule, Inventory, SOP, Training, Forecasting, Suppliers, Logistics.
- Шаблоны: AuditTrailReport, TrainingReport, IncidentReport, ComplianceChecklist.

---

## Workflow for Copilot

1. Parse all Markdown documents in `docs/` (compliance, validation, SOP, training, DRP/BCP, reports).
2. For each module:
   - Analyze regulatory requirements and risks.
   - Generate **working architecture**, DB schemas, API endpoints, frontend components.
   - Generate **validation artifacts** (IQ/OQ/PQ/TestCases/Reports) linked to URS items.
   - Integrate **SOP and Audit Trail logging**.
   - Connect modules to **DRP/BCP and training**.
3. Generate **Kubernetes manifests, container images, secrets management, geo-replication**.
4. Verify all generated code passes **unit, integration, and end-to-end tests**.
5. Maintain **full traceability** for auditing purposes (URS → FS → DS → TestCases → Reports).

---

## Constraints

- Only official documentation and libraries.
- Focus on **production-ready architecture**.
- Automate all possible processes without skipping regulatory requirements.
- Maintain **strict end-to-end type safety** if using TypeScript/NestJS/Next.js.
- Keep **complete traceability** throughout the system.

---

## Output Requirements

- All code must be **runnable immediately**.
- Audit Trail, Training Records, SOP actions fully integrated.
- Reports must be **exportable for auditors**.
- Include references to all regulatory documents and GAMP5 compliance.
