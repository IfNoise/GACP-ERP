---
title: "Functional Specification (FS)"
system: "ERP for GACP-Compliant Cannabis Cultivation"
version: "0.1-draft"
status: "draft"
last_updated: "2025-09-14"
---

## 1. Purpose

Документ описывает функциональные требования системы ERP для управления производством каннабиса с полным соответствием GACP/GxP. FS является прямым продолжением URS и детализирует, как каждое требование URS реализуется в функциональности.

## 2. Traceability

Каждое требование URS имеет свой FS-эквивалент с полной прослеживаемостью:

### Основные модули:
- URS-DI-001 → FS-DI-001 (Data Integrity)
- URS-AUTH-001 → FS-AUTH-001 (Authentication)
- URS-ES-001 → FS-ES-001 (Electronic Signatures)
- URS-PLM-001 → FS-PLM-001 (Plant Lifecycle Management)
- URS-TRAIN-001 → FS-TRAIN-001 (Training & Competency)
- URS-DR-001 → FS-DR-001 (Disaster Recovery)

### Расширенные модули:
- URS-FIN-001-005 → FS-FIN-001-005 (Financial Module)
- URS-WF-001-004 → FS-WF-001-003 (Workforce Management)
- URS-SP-001-002 → FS-SP-001-002 (Spatial Planning)
- URS-FC-001-003 → FS-FC-001-003 (Forecasting & Analytics)
- URS-PR-001-003 → FS-PR-001-003 (Procurement)
- URS-KM-001-002 → FS-KM-001-002 (Knowledge Management)
- URS-EQ-001-002 → FS-EQ-001-002 (Equipment Management)
- URS-SEC-001-002 → FS-SEC-001-002 (Security & Surveillance)
- URS-INT-001-002 → FS-INT-001-002 (External Integrations)
- URS-AND-001-003 → FS-AND-001-003 (Android Terminals)

### Дополнительные функциональности:
- URS-ES-001-002 → FS-ES-001-005 (PKI Infrastructure & Document Workflow)

## 3. Functional Requirements

## 3.1 Data Integrity & Audit Trail

- **FS-DI-001**: Система использует WORM-хранилище (например, MinIO + S3 Object Lock или IPFS/WORM DB) для неизменяемого хранения критических данных.
- **FS-DI-002**: Каждый пользовательский экшен логируется в Audit Trail с:
  - ID пользователя
  - Меткой времени UTC
  - Типом действия
  - Контекстом (plant ID, batch ID, equipment ID)
- **FS-DI-003**: Audit Trail доступен через API, экспорт в PDF/CSV с фильтрацией по диапазону дат, пользователю и объекту.
- **FS-DI-004**: Любая попытка редактирования данных создаёт новую запись версии, оригинал остаётся неизменным.

## 3.2 Authentication & Authorization

- **FS-AUTH-001**: Интеграция Keycloak (OIDC/SAML) для SSO с поддержкой RBAC.
- **FS-AUTH-002**: Для QA/QC и администраторов обязательна 2FA (TOTP/HOTP или аппаратные токены).
- **FS-AUTH-003**: e-Signature через QR-код на бейдже или аппаратный токен.
- **FS-AUTH-004**: Разграничение доступа по ролям, включая кастомные роли и права CRUD на сущности Plants, Batches, Equipment.

## 3.3 Electronic Signatures

- **FS-ES-001**: Каждая электронная подпись включает: имя пользователя, метку времени, причину действия.
- **FS-ES-002**: Для критических операций требуется повторная аутентификация.
- **FS-ES-003**: Подписи привязаны к конкретным действиям в Audit Trail и невозможно их удалить/подменить.

## 3.4 Plant Lifecycle Management

- **FS-PLM-001**: Каждое растение получает уникальный идентификатор (QR/RFID/barcode).
- **FS-PLM-002**: Источник растения фиксируется (seed, clone).
- **FS-PLM-003**: Этапы жизненного цикла фиксируются автоматически: Germination → Vegetation → Flowering → Harvest.
- **FS-PLM-004**: Ведение полной истории вмешательств: подкормки, полив, обработка триходермой/бациллой, стимуляторы.
- **FS-PLM-005**: Генерация отчетов seed-to-sale для аудиторов с полной трассировкой партий и растений.

## 3.5 Training & Competency

- **FS-TRAIN-001**: В системе хранится база знаний, курсы и тесты.
- **FS-TRAIN-002**: Автоматическое создание аттестаций на должности с ограничением доступа к критическим функциям по уровню компетенции.
- **FS-TRAIN-003**: Отчеты об успешном прохождении курсов доступны в Audit Trail.

## 3.6 Disaster Recovery / Business Continuity

- **FS-DR-001**: Система построена на кластерной архитектуре с репликацией (Kubernetes, StatefulSets).
- **FS-DR-002**: Гео-репликация: минимум два дата-центра в разных регионах.
- **FS-DR-003**: Автоматизированный сценарий failover + тестирование 1 раз в год.
- **FS-DR-004**: Daily backup с хранением минимум 5 лет, шифрование резервов.

## 3.7 Financial Module

- **FS-FIN-001** — **Accounts Payable/Receivable Management**
  - Система ведёт счета поставщиков с автоматическим созданием проводок при получении товаров
  - Интеграция с inventory модулем для автоматического списания при поступлении материалов
  - API для интеграции с банковскими системами и автоматической сверки платежей
  - Полный audit trail всех финансовых операций с невозможностью изменения исторических записей

- **FS-FIN-002** — **General Ledger и автоматические проводки**
  - Автоматическое формирование бухгалтерских проводок при всех операциях с растениями/материалами
  - Append-only структура для всех ledger entries с поддержкой reversal entries
  - Chart of accounts настроенный для cannabis industry (biological assets, COGS, etc.)
  - Real-time финансовая отчётность с drill-down до исходных транзакций

- **FS-FIN-003** — **Biological Assets Accounting**
  - Автоматический перевод растений в биологические активы при переходе в стадию вегетации
  - Fair value оценка на основе market rates и historical yield data
  - Возможность продажи растений на любой стадии с автоматическим расчётом gain/loss
  - Интеграция с cost accounting для корректного распределения затрат по стадиям

- **FS-FIN-004** — **Cost Accounting по партиям**
  - Автоматическое накопление прямых затрат (материалы, labour) по партиям растений
  - Распределение overhead costs (электричество, аренда, equipment depreciation)
  - Automatic costing при закрытии партии с расчётом cost per gram
  - Integration с payroll для accurate labour costing

- **FS-FIN-005** — **Payroll Integration**
  - Автоматический расчёт зарплаты на основе timesheet data из workforce модуля
  - Поддержка различных схем оплаты: hourly, salary, piece-rate для harvest operations
  - Автоматические налоговые расчёты и генерация payslips в EDMS
  - Integration с cost accounting для распределения labour costs по партиям

## 3.8 Workforce Management

- **FS-WF-001** — **Task Assignment и Skills Verification**
  - Система назначает задачи только сотрудникам с подтверждёнными навыками для конкретной SOP
  - Integration с training module для проверки актуальности сертификатов
  - Автоматическая блокировка задач при истечении required certifications
  - Mobile notifications для assignment/deadline reminders

- **FS-WF-002** — **Timesheet Management**
  - Automatic time tracking через SCUD/mobile app с GPS verification
  - Integration с payroll для accurate cost calculation
  - Overtime detection и approval workflows
  - Project/batch allocation для accurate cost accounting

- **FS-WF-003** — **Android Terminals Integration**
  - Offline-capable mobile app для SOP execution с local SQLite cache
  - Automatic sync when connectivity restored с conflict resolution
  - QR/NFC scanning для plant/equipment identification
  - Photo/video capture для SOP compliance documentation

- **FS-WF-004** — **Competency Verification**
  - Real-time проверка допуска к выполнению SOP на основе training records
  - Automatic blocking доступа при expired certifications
  - Skills matrix с visual competency tracking
  - Integration с HR systems для performance management

## 3.9 Spatial Planning Module

- **FS-SP-001** — **Growing Zone Visualization**
  - 2D/3D визуализация grow rooms с real-time plant placement
  - Integration с IoT sensors для environmental monitoring overlay
  - Capacity planning с optimization algorithms для максимального yield
  - Historical utilization analytics для improve planning

- **FS-SP-002** — **Resource Optimization**
  - Algorithms для оптимального размещения с учётом energy efficiency
  - Workflow optimization для minimizing staff movement time
  - Equipment utilization tracking и optimization recommendations
  - Integration с forecasting для future capacity planning

## 3.10 Forecasting и Analytics

- **FS-FC-001** — **Yield Forecasting**
  - ML-based models используют historical data, environmental conditions, strain characteristics
  - Integration с IoT data для real-time model updates
  - Confidence intervals и risk assessment для production planning
  - What-if scenarios для different growing conditions

- **FS-FC-002** — **Resource Planning**
  - Automated forecasting потребности в materials на основе production plans
  - Staff scheduling optimization на основе workload predictions
  - Equipment capacity planning с predictive maintenance integration
  - Cash flow forecasting на основе production и sales forecasts

- **FS-FC-003** — **Financial Forecasting**
  - Revenue forecasting на основе yield predictions и market prices
  - Cost analysis по strain/growing method/season
  - Profitability analysis по batches/strains/grow zones
  - ROI calculations для new investments/strains

## 3.11 Procurement Module

- **FS-PR-001** — **Supplier Management**
  - Supplier qualification process с document management
  - Performance tracking: delivery time, quality metrics, compliance
  - Contract management с automatic renewal notifications
  - Risk assessment и backup supplier identification

- **FS-PR-002** — **Purchase Orders Automation**
  - Automatic PO generation на основе inventory thresholds
  - Integration с financial module для budget control
  - Multi-level approval workflows на основе amount/category
  - Real-time tracking от PO creation до delivery

- **FS-PR-003** — **Receiving и Quality Control**
  - QR-код scanning для incoming materials с automatic lot creation
  - Integration с QC processes для inspection workflows
  - Automatic inventory updates и cost allocation
  - Non-conformance tracking и supplier feedback

## 3.12 Knowledge Management System

- **FS-KM-001** — **Integrated Knowledge Base**
  - Integration с Wiki.js/EDMS для centralized documentation
  - Automatic linking SOPs к relevant tasks в mobile app
  - Version control с audit trail для document changes
  - Advanced search functionality across all documentation

- **FS-KM-002** — **Training Content Delivery**
  - Delivery training materials через mobile app с offline capability
  - Interactive content support: videos, quizzes, simulations
  - Progress tracking и automatic certificate generation
  - Microlearning modules для just-in-time training

## 3.13 External Integrations и API

- **FS-API-001** — **External API Support**
  - RESTful API для integration с tax systems, regulatory reporting platforms
  - Real-time data synchronization с third-party analytics tools
  - Webhook support для external system notifications
  - API rate limiting и authentication для security

- **FS-API-002** — **Regulatory Reporting**
  - Automated generation regulatory reports для health authorities
  - Integration с government tracking systems (METRC, etc.)
  - Electronic submission capabilities с audit trail
  - Compliance monitoring и alert systems

## 3.14 Android Terminal Support

- **FS-AND-001** — **Offline Operations**
  - Full SOP execution capability в offline mode с local SQLite storage
  - Automatic conflict resolution when syncing with server
  - Local photo/video storage с background upload
  - Emergency mode для critical operations without connectivity

- **FS-AND-002** — **SOP Guided Workflows**
  - Step-by-step SOP execution с visual guides и photos
  - Digital signature capture для compliance
  - Automatic progress tracking и completion verification
  - Real-time validation requirements и quality checks

- **FS-AND-003** — **Hardware Integration**
  - QR/NFC scanning для plant/equipment identification
  - Camera integration для photo documentation
  - Barcode printing support для new labels
  - Push notification system для alerts и assignments

## 3.15 Electronic Signatures и Document Workflow

- **FS-ES-004** — **PKI Infrastructure**
  - Digital certificate management для all users
  - Signature verification и timestamp services
  - Certificate revocation list (CRL) management
  - Integration с external PKI providers if required

- **FS-ES-005** — **Document Workflow Automation**
  - Automated routing documents for approval на основе document type
  - Deadline tracking и escalation procedures
  - Electronic approval chains с full audit trail
  - Document version control с signature preservation

- Все FS требования должны быть покрыты IQ/OQ/PQ тестами.
- Маппинг на RTM: FS → URS.
- Полное покрытие Audit Trail, e-signature, disaster recovery, RBAC.

## 4. Acceptance Criteria

- Все FS требования должны быть покрыты IQ/OQ/PQ тестами.
- Маппинг на RTM: FS → URS с полной traceability для всех модулей.
- Полное покрытие всех новых модулей: Financial, Workforce, Spatial Planning, Forecasting, Procurement.
- Integration testing для всех API и external systems.
- Performance testing для Android terminals в offline/online режимах.
- Security testing для PKI infrastructure и digital signatures.
- Compliance validation для всех regulatory requirements.

## 5. Integration Points

### 5.1 Inter-module Dependencies

- **Financial ↔ Inventory**: Автоматические проводки при движении материалов
- **Workforce ↔ Training**: Проверка компетенций перед назначением задач
- **Spatial Planning ↔ IoT**: Real-time environmental data для оптимизации
- **Forecasting ↔ All modules**: Data aggregation для ML models
- **Procurement ↔ Financial**: Budget control и automatic cost allocation

### 5.2 External Integrations

- **Banking Systems**: Automated payment processing и reconciliation
- **Government Systems**: Regulatory reporting и compliance tracking
- **Third-party Analytics**: Data export для advanced analytics
- **PKI Providers**: Certificate management и validation services

## 6. Financial Module Requirements

### 6.1 Accounts Payable/Receivable (FS-FIN-001)

- **AP Management**: Automated invoice processing with three-way matching (PO, receipt, invoice)
- **AR Management**: Automatic invoice generation based on delivery confirmation
- **Credit Management**: Credit limits and aging analysis with automated collection workflows
- **GL Integration**: Real-time posting of all AP/AR transactions to General Ledger
- **Audit Trail**: Complete transaction history with electronic signatures

### 6.2 Biological Assets Accounting (FS-FIN-003)

- **Stage-based Valuation**: Different accounting treatment per growth stage:
  - Seeds/Clones: Raw materials at cost
  - Vegetation/Flowering: Biological assets at fair value or cost
  - Harvest: Finished goods inventory
- **Cost Accumulation**: Track labor, materials, and overhead costs per batch
- **Fair Value Adjustments**: Periodic revaluation with regulatory compliance
- **Sales Integration**: Support sales at any growth stage with proper revenue recognition

### 6.3 Cost Accounting (FS-FIN-004)

- **Batch Costing**: Accumulate all costs (materials, labor, overhead) per production batch
- **Standard Costing**: Variance analysis between standard and actual costs
- **Activity-Based Costing**: Allocation of indirect costs based on resource consumption
- **Profitability Analysis**: Real-time P&L per strain, batch, or zone

### 6.4 Payroll Integration (FS-FIN-005)

- **Timesheet Integration**: Automatic import from workforce management system
- **Cost Allocation**: Distribute labor costs to appropriate cost centers and batches
- **Compliance**: Tax calculations and regulatory reporting
- **Electronic Payslips**: Generation and secure delivery via EDMS

## 7. Workforce Management Requirements

### 7.1 Employee Management (FS-WF-001)

- **Skill Matrix**: Define and track employee competencies and certifications
- **Task Assignment**: Automated task routing based on skills and availability
- **Performance Tracking**: KPIs and productivity metrics per employee
- **Training Integration**: Automatic training assignment based on skill gaps

### 7.2 Shift Management (FS-WF-002)

- **Shift Scheduling**: Visual scheduling with drag-and-drop interface
- **Time Tracking**: Integration with СКУД systems for accurate time recording
- **Overtime Management**: Automatic calculation and approval workflows
- **Mobile Access**: Real-time schedule access via Android terminals

### 7.3 Android Terminal Integration (FS-WF-003)

- **Offline Capability**: Full SOP execution without network connectivity
- **Data Synchronization**: Conflict resolution and merge capabilities
- **Digital Signatures**: PKI-based signatures for SOP completion
- **Media Capture**: Photo/video evidence collection with automatic timestamping

## 8. Spatial Planning Requirements

### 8.1 Zone Management (FS-SP-001)

- **3D Visualization**: Interactive facility layout with real-time occupancy
- **Capacity Planning**: Optimization algorithms for space utilization
- **Environmental Mapping**: Integration with IoT sensors for microclimate tracking
- **Resource Allocation**: Automated assignment of equipment and personnel

### 8.2 Workflow Optimization (FS-SP-002)

- **Path Planning**: Minimize travel time for personnel and materials
- **Bottleneck Analysis**: Identify and resolve workflow constraints
- **Energy Efficiency**: Optimize lighting and HVAC based on zone occupancy
- **Compliance Zones**: Separate handling of different compliance levels

## 9. Forecasting & Analytics Requirements

### 9.1 Yield Prediction (FS-FC-001)

- **ML Models**: Machine learning algorithms using historical and environmental data
- **Strain Analytics**: Performance comparison across different cannabis strains
- **Environmental Correlation**: Predict yields based on temperature, humidity, lighting
- **Harvest Planning**: Optimize harvest timing for maximum yield and quality

### 9.2 Resource Planning (FS-FC-002)

- **Demand Forecasting**: Predict material and labor requirements
- **Inventory Optimization**: Minimize inventory costs while ensuring availability
- **Capacity Planning**: Long-term facility expansion planning
- **Supply Chain Analytics**: Supplier performance and risk analysis

### 9.3 Financial Forecasting (FS-FC-003)

- **Cash Flow Prediction**: 13-week rolling cash flow forecasts
- **Profitability Modeling**: Scenario analysis for different business strategies
- **Cost Variance Analysis**: Predict and prevent cost overruns
- **Investment Analysis**: ROI calculations for facility and equipment investments

## 10. Procurement & Supplier Management Requirements

### 10.1 Supplier Qualification (FS-PR-001)

- **Vendor Assessment**: Standardized qualification process with scoring
- **Certificate Management**: Track certifications and compliance documents
- **Performance Monitoring**: KPIs for delivery, quality, and service
- **Risk Assessment**: Supplier risk categorization and mitigation plans

### 10.2 Purchase Order Management (FS-PR-002)

- **Automated PO Generation**: Based on inventory levels and reorder points
- **Approval Workflows**: Multi-level approval based on value and category
- **Electronic Ordering**: Integration with supplier systems where possible
- **Change Management**: Controlled process for PO modifications

### 10.3 Receiving & Inspection (FS-PR-003)

- **QR Code Scanning**: Mobile receipt confirmation with lot tracking
- **Quality Inspection**: Integration with QC processes and hold procedures
- **Discrepancy Management**: Automated variance reporting and resolution
- **Supplier Feedback**: Performance data back to supplier management

## 11. Equipment Management Requirements

### 11.1 Asset Management (FS-EQ-001)

- **Equipment Registry**: Complete asset tracking with specifications and history
- **Maintenance Scheduling**: Preventive maintenance with automatic work orders
- **Calibration Management**: Scheduled calibrations with certificate tracking
- **Performance Monitoring**: Equipment effectiveness and utilization metrics

### 11.2 SCADA Integration (FS-EQ-002)

- **Real-time Monitoring**: Live data from climate control systems
- **Alarm Management**: Automated alerting with escalation procedures
- **Historical Trending**: Long-term performance and efficiency analysis
- **Remote Control**: Secure remote operation of critical systems

## 12. Security & Surveillance Requirements

### 12.1 Video Integration (FS-SEC-001)

- **Event Correlation**: Link video footage to specific ERP transactions
- **Automated Bookmarking**: Mark critical operations for compliance review
- **Retention Management**: Automated archival based on regulatory requirements
- **Privacy Controls**: Masking and access controls for sensitive areas

### 12.2 Access Control Integration (FS-SEC-002)

- **Real-time Monitoring**: Live view of facility access and occupancy
- **Compliance Tracking**: Ensure only authorized personnel in controlled areas
- **Emergency Procedures**: Automated lockdown and evacuation protocols
- **Audit Integration**: Access events included in comprehensive audit trail

## 13. Knowledge Management Requirements

### 13.1 Document Management (FS-KM-001)

- **Version Control**: Automatic versioning with change tracking
- **Search Functionality**: Full-text search across all documents and SOPs
- **Access Control**: Role-based access to sensitive documents
- **Integration**: Seamless linking from tasks and training modules

### 13.2 Training Content Delivery (FS-KM-002)

- **Multi-media Support**: Video, audio, and interactive content delivery
- **Progress Tracking**: Detailed analytics on learning progress
- **Certification Management**: Automatic certificate generation and renewal
- **Mobile Delivery**: Content accessible via Android terminals

## 14. Performance Requirements

- **API Response Time**: < 500ms для 95% requests
- **Mobile App Sync**: < 30 seconds для typical daily data
- **Offline Capability**: Minimum 8 hours операций без connectivity
- **Concurrent Users**: Support for 200+ simultaneous users
- **Data Retention**: 10+ years для regulatory compliance
- **Backup/Recovery**: RTO < 4 hours, RPO < 1 hour

## 15. Security Requirements

- **Data Encryption**: AES-256 для data at rest, TLS 1.3 для data in transit
- **Access Control**: RBAC с mandatory 2FA для privileged operations
- **Audit Logging**: 100% coverage всех user actions и system events
- **Network Security**: Zero-trust architecture с microsegmentation
- **Mobile Security**: Device encryption и remote wipe capabilities

## 16. Glossary

- **WORM** — Write Once Read Many
- **RBAC** — Role-Based Access Control
- **Audit Trail** — неизменяемый журнал действий пользователей
- **QR-code/NFC e-signature** — подпись через сканирование бейджа QR или NFC
- **Seed-to-sale report** — отчёт с полной трассировкой растения или партии
- **Biological Assets** — растения как финансовые активы в соответствии с IFRS/GAAP
- **Fair Value** — справедливая стоимость биологических активов
- **Cost Accounting** — система учёта затрат по партиям/проектам
- **PKI** — Public Key Infrastructure для digital signatures
- **ML** — Machine Learning для forecasting и analytics
- **IoT** — Internet of Things для environmental monitoring
- **API** — Application Programming Interface
- **SOP** — Standard Operating Procedure
- **SCUD** — Smart Card User Device
- **GPS** — Global Positioning System
- **SQLite** — локальная база данных для offline operations
- **RTO** — Recovery Time Objective
- **RPO** — Recovery Point Objective
- **METRC** — государственная система tracking cannabis
- **CRL** — Certificate Revocation List
