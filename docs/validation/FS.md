---
title: "Functional Specification (FS)"
system: "ERP for GACP-Compliant Cannabis Cultivation"
version: "1.0-enhanced"
status: "draft"
last_updated: "2025-09-13"
---

# Functional Specification (FS) - GACP ERP System

## 1. Purpose

This document describes the functional requirements for the ERP system managing cannabis production with full GACP/GxP compliance. FS is a direct continuation of URS and details how each URS requirement is implemented in functionality.

## 2. Traceability

Each URS requirement has its FS equivalent with full traceability:

### Core Modules:
- URS-DI-001 → FS-DI-001 (Data Integrity)
- URS-AUTH-001 → FS-AUTH-001 (Authentication)
- URS-ES-001 → FS-ES-001 (Electronic Signatures)
- URS-PLM-001 → FS-PLM-001 (Plant Lifecycle Management)
- URS-TRAIN-001 → FS-TRAIN-001 (Training & Competency)
- URS-DR-001 → FS-DR-001 (Disaster Recovery)

### Financial & Advanced Modules:
- URS-FIN-001 → FS-FIN-001 (Financial Module)
- URS-WF-001 → FS-WF-001 (Workforce Management)
- URS-SP-001 → FS-SP-001 (Spatial Planning)
- URS-FC-001 → FS-FC-001 (Forecasting & Analytics)
- URS-PR-001 → FS-PR-001 (Procurement)
- URS-KM-001 → FS-KM-001 (Knowledge Management)
- URS-API-001 → FS-API-001 (External Integrations)
- URS-AND-001 → FS-AND-001 (Android Terminals)
- URS-AUD-GO-001 → FS-AUD-GO-001 (Go Audit Consumer)

### Additional Functionalities:
- URS-ES-002 → FS-ES-004 (PKI Infrastructure)
- URS-ES-003 → FS-ES-005 (Document Workflow)

## 3. Functional Requirements

### 3.1 Financial Module Comprehensive Implementation

#### 3.1.1 Accounts Payable (AP) - FS-FIN-001

**Business Logic**:
- **Three-Way Matching**: Automatic comparison of Purchase Order, Receiving Document, and Supplier Invoice
- **Exception Handling**: Discrepancy workflows with tolerance settings and approval requirements
- **Payment Processing**: Automated payment scheduling with bank integration and cash flow optimization
- **Vendor Management**: Performance tracking, payment terms negotiation, and vendor scoring

**Technical Implementation**:
```typescript
// Example ts-rest contract for AP operations
const apContract = c.router({
  createInvoice: {
    method: 'POST',
    path: '/ap/invoices',
    body: z.object({
      supplierId: z.string(),
      purchaseOrderId: z.string(),
      receivingId: z.string(),
      invoiceNumber: z.string(),
      totalAmount: z.number(),
      lineItems: z.array(z.object({
        itemId: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        glAccount: z.string()
      }))
    }),
    responses: {
      201: invoiceSchema,
      400: errorSchema
    }
  },
  processPayment: {
    method: 'POST',
    path: '/ap/payments',
    body: paymentRequestSchema,
    responses: {
      200: paymentConfirmationSchema
    }
  }
});
```

**Integration Points**:
- **Procurement Module**: Automatic invoice creation from received goods
- **GL Module**: Real-time posting of AP transactions
- **Cash Management**: Integration with bank systems for payment processing
- **Audit Trail**: All AP transactions logged to immudb via Go consumer

#### 3.1.2 Biological Assets Accounting - FS-FIN-004

**Asset Lifecycle Management**:
- **Seed/Clone Stage**: Materials inventory with acquisition costs
- **Vegetative Stage**: WIP with accumulated costs (labor, materials, overhead)
- **Flowering Stage**: Biological asset fair value adjustments
- **Harvest Stage**: Transfer to finished goods inventory

**Cost Accumulation Model**:
```typescript
interface BiologicalAsset {
  batchId: string;
  plantCount: number;
  stage: 'seed' | 'vegetative' | 'flowering' | 'harvest';
  costComponents: {
    materialCosts: number;      // Seeds, nutrients, media
    laborCosts: number;         // Direct labor hours * rates
    overheadCosts: number;      // Utilities, depreciation, indirect
    totalAccumulated: number;   // Sum of all costs
  };
  fairValue?: number;           // Market-based valuation
  harvestMetrics?: {
    projectedYield: number;
    qualityGrade: string;
    marketPrice: number;
  };
}
```

**GACP Compliance Features**:
- **Traceability**: Complete cost trail from seed to sale
- **Valuation Methods**: IAS 41 biological asset standards
- **Audit Trail**: Immutable cost recording via Kafka events
- **Reporting**: Cost per gram analysis, profitability by batch

#### 3.1.3 Cost Accounting Integration - FS-FIN-005

**Multi-Level Cost Allocation**:
- **Direct Costs**: Materials and labor directly traceable to batches
- **Indirect Costs**: Utilities, facility costs allocated by driver (square footage, plant count)
- **Quality Costs**: Testing, rework, compliance activities
- **Standard vs. Actual**: Variance analysis for continuous improvement

**Integration with Operational Systems**:
```typescript
// Cost allocation workflow
interface CostAllocationRule {
  costCenter: string;
  allocationBase: 'plant_count' | 'square_footage' | 'direct_labor_hours';
  rate: number;
  effectiveDate: Date;
}

// Real-time cost accumulation
const accumulateCosts = (batchId: string, event: OperationalEvent) => {
  switch (event.type) {
    case 'MATERIAL_USAGE':
      allocateDirectCost(batchId, event.amount);
      break;
    case 'LABOR_HOURS':
      allocateLaborCost(batchId, event.hours * event.rate);
      break;
    case 'UTILITY_CONSUMPTION':
      allocateOverheadCost(batchId, event.consumption);
      break;
  }
  publishCostEvent(batchId, event); // → Kafka → immudb
};
```

### 3.2 Go Audit Consumer Functional Specification - FS-AUD-GO-001

**High-Performance Event Processing**:
- **Batch Processing**: Accumulate 100-1000 events before processing for optimal throughput
- **Parallel Processing**: Multiple Go routines for concurrent batch processing
- **Memory Management**: Efficient memory usage with configurable buffer sizes
- **Backpressure Handling**: Dynamic throttling based on downstream system capacity

**Event Processing Logic**:
```go
type EventProcessor struct {
    batchSize    int
    flushTimeout time.Duration
    eventBuffer  []AuditEvent
    mutex        sync.RWMutex
}

func (ep *EventProcessor) ProcessEvents(events []AuditEvent) error {
    // Validate events
    for _, event := range events {
        if err := validateEvent(event); err != nil {
            return fmt.Errorf("invalid event %s: %w", event.EventID, err)
        }
    }
    
    // Store to immudb (primary)
    if err := ep.storeToImmuDB(events); err != nil {
        return fmt.Errorf("immudb storage failed: %w", err)
    }
    
    // Store to PostgreSQL (replica)
    if err := ep.storeToPostgres(events); err != nil {
        // Log error but don't fail - immudb is source of truth
        ep.logger.Warn("postgres storage failed", "error", err)
    }
    
    return nil
}
```

**Reliability Features**:
- **Circuit Breaker**: Protect downstream systems from cascading failures
- **Retry Logic**: Exponential backoff with jitter for transient failures
- **Dead Letter Queue**: Store permanently failed events for manual investigation
- **Health Monitoring**: Continuous health checks with Prometheus metrics

### 3.3 Workforce Management Advanced Features - FS-WF-001

**Competency-Based Task Assignment**:
- **Skill Matrix**: Define required competencies for each SOP/task
- **Automatic Validation**: Block task assignment if employee lacks required certifications
- **Training Integration**: Automatic enrollment in training when competency gaps identified
- **Performance Tracking**: Measure task completion quality and speed

**Android Terminal Integration**:
```typescript
interface TaskAssignment {
  taskId: string;
  employeeId: string;
  sopId: string;
  requiredCompetencies: string[];
  estimatedDuration: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  equipment: string[];
  location: {
    zone: string;
    coordinates?: { x: number; y: number; z?: number };
  };
  offline_capable: boolean;
}

// Offline synchronization logic
interface OfflineSync {
  localChanges: TaskCompletion[];
  serverChanges: TaskCompletion[];
  conflictResolution: 'server_wins' | 'client_wins' | 'manual_merge';
  syncTimestamp: Date;
}
```

**Real-Time Performance Analytics**:
- **Productivity Metrics**: Tasks per hour, quality scores, SOP compliance rates
- **Resource Utilization**: Equipment usage, zone efficiency, workforce allocation
- **Predictive Analytics**: Forecast labor needs based on production schedules
- **Alerting**: Real-time notifications for performance anomalies or safety issues

### 3.4 Spatial Planning Optimization - FS-SP-001

**Zone Management Logic**:
- **Dynamic Layout Optimization**: AI-powered space allocation based on plant growth predictions
- **Environmental Zone Control**: Independent climate control for propagation, vegetative, and flowering zones
- **Capacity Planning**: Real-time calculation of optimal plant density per growth stage
- **Resource Allocation**: Automated distribution of lighting, HVAC, and irrigation resources

**3D Visualization Integration**:
```typescript
interface SpatialZone {
  zoneId: string;
  zoneType: 'propagation' | 'vegetative' | 'flowering' | 'drying' | 'storage';
  dimensions: {
    length: number;    // meters
    width: number;     // meters
    height: number;    // meters
    area: number;      // calculated m²
    volume: number;    // calculated m³
  };
  environmentalControls: {
    hvacZone: string;
    lightingCircuits: string[];
    irrigationZone: string;
    sensors: SensorMapping[];
  };
  currentOccupancy: {
    plantCount: number;
    density: number;        // plants per m²
    utilizationPercent: number;
  };
  optimalConfiguration: {
    maxCapacity: number;
    recommendedDensity: number;
    equipmentLayout: EquipmentPlacement[];
  };
}
```

**Real-Time Optimization**:
- **Energy Efficiency**: Minimize HVAC and lighting costs while maintaining optimal conditions
- **Workflow Optimization**: Reduce staff movement between zones through intelligent layout
- **Equipment Utilization**: Maximize ROI on lighting, HVAC, and monitoring equipment
- **Scalability Planning**: Model expansion scenarios and equipment requirements

### 3.5 Forecasting & Analytics Engine - FS-FC-001

**Machine Learning Pipeline**:
- **Yield Prediction Models**: Random Forest and Neural Network models for yield forecasting
- **Resource Demand Forecasting**: Time series analysis for materials, labor, and utility planning
- **Market Analysis Integration**: External data feeds for pricing and demand trends
- **Scenario Planning**: Monte Carlo simulations for risk assessment

**Predictive Analytics Framework**:
```typescript
interface ForecastModel {
  modelId: string;
  modelType: 'yield_prediction' | 'resource_demand' | 'financial_forecast';
  algorithm: 'linear_regression' | 'random_forest' | 'neural_network' | 'time_series';
  trainingData: {
    features: string[];        // Input variables
    targetVariable: string;    // What we're predicting
    dataQuality: number;       // 0-1 score
    lastTrained: Date;
  };
  performance: {
    accuracy: number;          // MAPE score
    confidence: number;        // Model confidence
    validationResults: ValidationMetrics;
  };
  predictions: {
    shortTerm: Prediction[];   // Next 30 days
    mediumTerm: Prediction[]; // Next 90 days
    longTerm: Prediction[];   // Next 365 days
  };
}

interface Prediction {
  date: Date;
  value: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  influencingFactors: FactorImpact[];
}
```

**Real-Time Analytics Dashboard**:
- **Performance KPIs**: Live tracking of yield, quality, and efficiency metrics
- **Predictive Alerts**: Early warning system for potential issues
- **Resource Optimization**: Recommendations for optimal resource allocation
- **Financial Projections**: Real-time profitability analysis and cash flow forecasting

### 3.6 Data Integrity & Audit Trail

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

## 6. Performance Requirements

- **API Response Time**: < 500ms для 95% requests
- **Mobile App Sync**: < 30 seconds для typical daily data
- **Offline Capability**: Minimum 8 hours операций без connectivity
- **Concurrent Users**: Support for 200+ simultaneous users
- **Data Retention**: 10+ years для regulatory compliance
- **Backup/Recovery**: RTO < 4 hours, RPO < 1 hour

## 7. Security Requirements

- **Data Encryption**: AES-256 для data at rest, TLS 1.3 для data in transit
- **Access Control**: RBAC с mandatory 2FA для privileged operations
- **Audit Logging**: 100% coverage всех user actions и system events
- **Network Security**: Zero-trust architecture с microsegmentation
- **Mobile Security**: Device encryption и remote wipe capabilities

## 8. Glossary

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
