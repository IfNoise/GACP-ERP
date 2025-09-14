# 🚀 План разработки GACP-ERP системы

**Документ**: Development Roadmap  
**Версия**: 1.0  
**Дата**: 14 сентября 2025  
**Статус**: PLANNING - Основа для планирования

---

## 🎯 **1. ОБЗОР ПЛАНИРОВАНИЯ**

### 1.1 Цель документа

Данный документ определяет пошаговый план разработки GACP-ERP системы с учетом:

- AI-assisted разработки (@IfNoise + GitHub Copilot + Claude)
- Приоритизации модулей по бизнес-важности
- Мягких зависимостей между компонентами
- MVP подхода с итеративным развитием
- Интеграции с Mayan-EDMS на всех этапах

### 1.2 Принципы планирования

#### 1.2.1 AI-Assisted Development Workflow

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    AI-ASSISTED DEVELOPMENT CYCLE                   │
├─────────────────────────────────────────────────────────────────────┤
│  1. PLANNING PHASE                                                  │
│     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │
│     │ @IfNoise    │    │ Claude      │    │ GitHub      │           │
│     │ (Human)     │◄──►│ (Planning)  │◄──►│ Copilot     │           │
│     │ Architects  │    │ Analysis    │    │ (Coding)    │           │
│     └─────────────┘    └─────────────┘    └─────────────┘           │
│                                                                     │
│  2. IMPLEMENTATION PHASE                                            │
│     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │
│     │ @IfNoise    │    │ Copilot     │    │ Claude      │           │
│     │ Codes       │◄──►│ Suggests    │◄──►│ Reviews     │           │
│     │ Reviews     │    │ Completes   │    │ Optimizes   │           │
│     └─────────────┘    └─────────────┘    └─────────────┘           │
│                                                                     │
│  3. TESTING PHASE                                                   │
│     ┌─────────────┐    ┌─────────────┐    ┌─────────────┐           │
│     │ @IfNoise    │    │ AI Tools    │    │ Automated   │           │
│     │ Manual Test │◄──►│ Test Gen    │◄──►│ Testing     │           │
│     │ Validation  │    │ Coverage    │    │ CI/CD       │           │
│     └─────────────┘    └─────────────┘    └─────────────┘           │
└─────────────────────────────────────────────────────────────────────┘
```

#### 1.2.2 Development Methodology

- **Agile + DDD**: Domain-driven development с agile планированием
- **MVP First**: Быстрый MVP каждого модуля для validation
- **Incremental**: Итеративное развитие с постоянным feedback
- **AI-Pair Programming**: Continuous collaboration с AI assistants
- **Documentation-Driven**: Документация ведет разработку

---

## 📋 **2. ФАЗЫ РАЗРАБОТКИ**

### 2.1 Phase 0: Foundation Setup (Weeks 1-2)

**Цель**: Создание базовой инфраструктуры и dev environment

#### 2.1.1 Infrastructure Setup

#### Week 1: Development Environment

```bash
# Day 1-2: Project Setup
- ✅ Initialize Next.js 15+ project with TypeScript
- ✅ Setup ESLint, Prettier, Husky
- ✅ Configure Tailwind CSS + shadcn/ui
- ✅ Setup Docker development environment
- ✅ Initialize Git repository with branch strategy

# Day 3-5: Core Dependencies
- 🔄 Setup NestJS backend with microservices
- 🔄 Configure PostgreSQL with Prisma ORM
- 🔄 Setup Redis for caching
- 🔄 Configure authentication with Keycloak
- 🔄 Setup basic API Gateway structure
```

#### Week 2: Integration Foundations

```bash
# Day 6-8: External Integrations
- 🔄 Setup Mayan-EDMS container and API connection
- 🔄 Configure MQTT broker for IoT simulation
- 🔄 Setup VictoriaMetrics for time series data
- 🔄 Configure basic monitoring with Prometheus

# Day 9-10: Development Tools
- 🔄 Setup AI development tools integration
- 🔄 Configure VS Code workspace settings
- 🔄 Setup automated testing framework
- 🔄 Create development documentation templates
```

#### 2.1.2 Deliverables Phase 0

- ✅ Working development environment
- ✅ Basic project structure
- ✅ Core infrastructure components
- ✅ Authentication system
- ✅ API Gateway foundation
- ✅ Mayan-EDMS integration test

### 2.2 Phase 1: Core Plant Module (Weeks 3-6)

**Цель**: MVP системы управления растениями

#### 2.2.1 Week 3: Domain Foundation

**User Stories**:

- As a cultivator, I want to create plant batches
- As a supervisor, I want to track plant stages
- As a manager, I want to view plant inventory

**Technical Tasks**:

```typescript
// Day 1-2: Domain Models
interface PlantDomain {
  entities: {
    Plant: PlantAggregate;
    Batch: BatchAggregate;
    Strain: StrainEntity;
  };
  valueObjects: {
    PlantId: PlantId;
    PlantStage: PlantStage;
    Location: Location;
  };
  events: {
    PlantCreated: PlantCreatedEvent;
    StageTransitioned: StageTransitionedEvent;
  };
}

// Day 3-5: Repository Pattern
class PlantRepository {
  async save(plant: Plant): Promise<void>;
  async findById(id: PlantId): Promise<Plant>;
  async findByBatch(batchId: BatchId): Promise<Plant[]>;
  async findByStage(stage: PlantStage): Promise<Plant[]>;
}
```

#### 2.2.2 Week 4: API & Database

**API Endpoints**:

```typescript
// Plant Management API
POST   /api/v1/plants              // ✅ Create plant
GET    /api/v1/plants              // ✅ List plants with filters
GET    /api/v1/plants/:id          // ✅ Get plant details
PUT    /api/v1/plants/:id          // ✅ Update plant
DELETE /api/v1/plants/:id          // ✅ Delete plant
POST   /api/v1/plants/:id/move     // ✅ Move plant location
POST   /api/v1/plants/:id/transition // ✅ Change stage

// Batch Management API
GET    /api/v1/batches             // ✅ List batches
POST   /api/v1/batches             // ✅ Create batch
GET    /api/v1/batches/:id         // ✅ Get batch details
GET    /api/v1/batches/:id/plants  // ✅ Get batch plants
```

**Database Schema**:

```sql
-- Core Plant Tables (Week 4)
CREATE SCHEMA plant_lifecycle;

CREATE TABLE plant_lifecycle.strains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    genetics JSONB NOT NULL,
    characteristics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE plant_lifecycle.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number VARCHAR(50) NOT NULL UNIQUE,
    strain_id UUID NOT NULL REFERENCES plant_lifecycle.strains(id),
    start_date DATE NOT NULL,
    target_count INTEGER NOT NULL,
    actual_count INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE plant_lifecycle.plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES plant_lifecycle.batches(id),
    plant_tag VARCHAR(50) NOT NULL UNIQUE,
    stage VARCHAR(20) NOT NULL DEFAULT 'seedling',
    location_data JSONB,
    health_status VARCHAR(20) DEFAULT 'healthy',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2.2.3 Week 5: PWA Frontend

**Component Structure**:

```typescript
// Plant Management Components
src/
├── components/
│   ├── plants/
│   │   ├── PlantList.tsx           // ✅ Plant grid/list view
│   │   ├── PlantCard.tsx           // ✅ Plant summary card
│   │   ├── PlantDetails.tsx        // ✅ Detailed plant view
│   │   ├── PlantForm.tsx           // ✅ Create/edit plant
│   │   └── StageTransition.tsx     // ✅ Stage change UI
│   ├── batches/
│   │   ├── BatchList.tsx           // ✅ Batch overview
│   │   ├── BatchForm.tsx           // ✅ Create batch
│   │   └── BatchProgress.tsx       // ✅ Progress tracking
│   └── common/
│       ├── Header.tsx              // ✅ PWA header
│       ├── Navigation.tsx          // ✅ Responsive nav
│       └── LoadingStates.tsx       // ✅ Loading components
```

**PWA Features**:

```typescript
// PWA Configuration (Week 5)
export const pwaConfig = {
  // Workstation Mode (1920x1080+)
  desktop: {
    layout: "sidebar",
    density: "comfortable",
    features: ["full-functionality"],
  },

  // Mobile Mode (320px+)
  mobile: {
    layout: "bottom-tabs",
    density: "compact",
    features: ["essential-only"],
  },

  // Terminal Mode (4K displays)
  terminal: {
    layout: "fullscreen",
    density: "large",
    features: ["kiosk-mode"],
  },
};
```

#### 2.2.4 Week 6: Testing & Documentation

**Testing Strategy**:

```typescript
// Unit Tests
describe("PlantAggregate", () => {
  test("should transition from seedling to vegetative");
  test("should prevent invalid stage transitions");
  test("should emit domain events on transitions");
});

// Integration Tests
describe("Plant API", () => {
  test("POST /plants creates new plant");
  test("GET /plants returns filtered results");
  test("PUT /plants/:id/transition changes stage");
});

// E2E Tests
describe("Plant Management Flow", () => {
  test("create batch -> add plants -> track progress");
  test("plant lifecycle from seedling to harvest");
});
```

#### 2.2.5 Phase 1 Deliverables

- ✅ Complete Plant Lifecycle module
- ✅ Batch management system
- ✅ Responsive PWA interface
- ✅ Basic reporting capabilities
- ✅ Mayan-EDMS integration for SOPs
- ✅ Unit and integration tests
- ✅ User documentation

### 2.3 Phase 2: Financial Module (Weeks 7-10)

**Цель**: Базовый учет биологических активов и финансовых операций

#### 2.3.1 Week 7: Chart of Accounts & General Ledger

**Core Features**:

```typescript
// Financial Domain Models
interface FinancialDomain {
  entities: {
    Account: AccountAggregate;
    JournalEntry: JournalEntryAggregate;
    BiologicalAsset: BiologicalAssetAggregate;
  };
  valueObjects: {
    Money: Money;
    AccountCode: AccountCode;
    Period: AccountingPeriod;
  };
}

// Chart of Accounts Structure
const chartOfAccounts = {
  assets: {
    "1000": "Cash and Cash Equivalents",
    "1100": "Accounts Receivable",
    "1200": "Inventory - Finished Goods",
    "1300": "Biological Assets - Growing",
    "1400": "Property, Plant & Equipment",
  },
  liabilities: {
    "2000": "Accounts Payable",
    "2100": "Accrued Expenses",
    "2200": "Notes Payable",
  },
  equity: {
    "3000": "Owner Equity",
    "3100": "Retained Earnings",
  },
  revenue: {
    "4000": "Sales Revenue",
    "4100": "Other Revenue",
  },
  expenses: {
    "5000": "Cost of Goods Sold",
    "5100": "Operating Expenses",
    "5200": "Cultivation Costs",
  },
};
```

#### 2.3.2 Week 8: Biological Assets Valuation

**IAS 41 Compliance**:

```typescript
// Biological Asset Valuation
class BiologicalAssetService {
  async valuatePlant(plantId: PlantId): Promise<Money> {
    const plant = await this.plantRepo.findById(plantId);
    const costs = await this.getCultivationCosts(plantId);
    const marketValue = await this.getMarketValue(plant);

    // Fair value less costs to sell
    return marketValue.subtract(costs.selling);
  }

  async calculateRevaluation(): Promise<JournalEntry[]> {
    // Daily revaluation of biological assets
    const assets = await this.getBiologicalAssets();
    const entries = [];

    for (const asset of assets) {
      const currentValue = await this.valuatePlant(asset.plantId);
      const revaluation = currentValue.subtract(asset.bookValue);

      if (!revaluation.isZero()) {
        entries.push(this.createRevaluationEntry(asset, revaluation));
      }
    }

    return entries;
  }
}
```

#### 2.3.3 Week 9: API & Frontend

**Financial APIs**:

```typescript
// Financial Management API
GET / api / v1 / accounts; // Chart of accounts
POST / api / v1 / journal - entries; // Create journal entry
GET / api / v1 / journal - entries; // List journal entries
GET / api / v1 / biological - assets; // List biological assets
POST / api / v1 / biological - assets / valuation; // Trigger valuation
GET / api / v1 / reports / balance - sheet; // Balance sheet
GET / api / v1 / reports / income - statement; // P&L statement
```

**Financial UI Components**:

```typescript
// Financial Components
src/components/financial/
├── accounts/
│   ├── AccountTree.tsx         // Chart of accounts tree
│   ├── AccountForm.tsx         // Create/edit accounts
│   └── AccountBalance.tsx      // Account balance view
├── journal/
│   ├── JournalEntry.tsx        // Journal entry form
│   ├── JournalList.tsx         // List of entries
│   └── JournalReview.tsx       // Entry review/approval
├── biological-assets/
│   ├── AssetValuation.tsx      // Asset valuation view
│   ├── AssetList.tsx           // List of biological assets
│   └── ValuationHistory.tsx    // Valuation trend charts
└── reports/
    ├── BalanceSheet.tsx        // Balance sheet report
    ├── IncomeStatement.tsx     // P&L report
    └── BiologicalAssetReport.tsx // Asset performance
```

#### 2.3.4 Week 10: Financial Reporting

**Report Generation**:

```typescript
// Financial Reports Service
class FinancialReportsService {
  async generateBalanceSheet(date: Date): Promise<BalanceSheetReport> {
    const accounts = await this.getAccountBalances(date);

    return {
      assets: {
        current: {
          cash: accounts.find((a) => a.code === "1000")?.balance || 0,
          receivables: accounts.find((a) => a.code === "1100")?.balance || 0,
          inventory: accounts.find((a) => a.code === "1200")?.balance || 0,
          biologicalAssets:
            accounts.find((a) => a.code === "1300")?.balance || 0,
        },
        nonCurrent: {
          ppe: accounts.find((a) => a.code === "1400")?.balance || 0,
        },
      },
      liabilities: {
        current: {
          payables: accounts.find((a) => a.code === "2000")?.balance || 0,
          accrued: accounts.find((a) => a.code === "2100")?.balance || 0,
        },
      },
      equity: {
        capital: accounts.find((a) => a.code === "3000")?.balance || 0,
        retained: accounts.find((a) => a.code === "3100")?.balance || 0,
      },
    };
  }
}
```

### 2.4 Phase 3: Document Management Integration (Weeks 11-14)

**Цель**: Полная интеграция с Mayan-EDMS для управления SOPs и документооборота

#### 2.4.1 Week 11: Mayan-EDMS Deep Integration

**Document Service Architecture**:

```typescript
// Mayan-EDMS Integration Service
class DocumentManagementService {
  async uploadSOP(sopData: SOPData): Promise<Document> {
    // Upload to Mayan-EDMS with metadata
    const document = await this.mayanClient.upload({
      file: sopData.content,
      documentType: "SOP",
      metadata: {
        department: sopData.department,
        version: sopData.version,
        effectiveDate: sopData.effectiveDate,
        approvedBy: sopData.approvedBy,
      },
    });

    // Link to plant operations
    await this.linkToOperations(document.id, sopData.operations);

    return document;
  }

  async startApprovalWorkflow(documentId: string): Promise<WorkflowInstance> {
    return await this.mayanClient.startWorkflow(documentId, "sop-approval");
  }

  async signDocument(
    documentId: string,
    signature: ElectronicSignature
  ): Promise<void> {
    await this.mayanClient.signDocument(documentId, signature);

    // Create audit trail entry
    await this.auditService.logDocumentSigning({
      documentId,
      signerId: signature.signerId,
      timestamp: new Date(),
    });
  }
}
```

#### 2.4.2 Week 12: SOP Integration with Plant Operations

**SOP-to-Task Linking**:

```typescript
// SOP Integration with Plant Tasks
interface PlantTask {
  id: TaskId;
  plantId: PlantId;
  type: TaskType;
  requiredSOPs: SOPReference[];
  completionEvidence: Evidence[];
  performedBy: UserId;
  completedAt?: Date;
}

interface SOPReference {
  documentId: string;
  title: string;
  version: string;
  sections: string[];
}

class TaskSOPService {
  async getRequiredSOPs(taskType: TaskType): Promise<SOPReference[]> {
    // Get SOPs required for specific task type
    return await this.mayanClient.searchDocuments({
      documentType: "SOP",
      metadata: {
        applicableTasks: taskType,
      },
    });
  }

  async validateSOPCompliance(task: PlantTask): Promise<ComplianceResult> {
    const requiredSOPs = await this.getRequiredSOPs(task.type);
    const evidence = task.completionEvidence;

    return {
      compliant: this.checkCompliance(requiredSOPs, evidence),
      missingEvidence: this.findMissingEvidence(requiredSOPs, evidence),
      recommendations: this.generateRecommendations(requiredSOPs, evidence),
    };
  }
}
```

#### 2.4.3 Week 13: Electronic Signatures & Workflow

**Electronic Signature Implementation**:

```typescript
// Electronic Signature Service
class ElectronicSignatureService {
  async createSignature(
    documentId: string,
    signerId: string,
    reason: string
  ): Promise<ElectronicSignature> {
    const certificate = await this.getCertificate(signerId);
    const signatureData = await this.generateSignature(documentId, certificate);

    const signature: ElectronicSignature = {
      id: uuid(),
      documentId,
      signerId,
      reason,
      signatureData: signatureData.signature,
      certificate: certificate.public,
      timestamp: new Date(),
      isValid: true,
    };

    // Store in Mayan-EDMS
    await this.mayanClient.addSignature(documentId, signature);

    // Create immutable audit record
    await this.auditService.recordSignature(signature);

    return signature;
  }

  async verifySignature(
    signature: ElectronicSignature
  ): Promise<VerificationResult> {
    const certificate = await this.validateCertificate(signature.certificate);
    const signatureValid = await this.verifySignatureData(
      signature.signatureData,
      signature.certificate
    );

    return {
      isValid: certificate.valid && signatureValid,
      certificate: certificate,
      timestamp: signature.timestamp,
      warnings: this.getVerificationWarnings(signature),
    };
  }
}
```

#### 2.4.4 Week 14: Document Workflow UI

**Document Management UI**:

```typescript
// Document Management Components
src/components/documents/
├── sop/
│   ├── SOPLibrary.tsx          // SOP browsing interface
│   ├── SOPViewer.tsx           // SOP document viewer
│   ├── SOPEditor.tsx           // SOP creation/editing
│   └── SOPApproval.tsx         // Approval workflow UI
├── workflow/
│   ├── WorkflowDesigner.tsx    // Visual workflow builder
│   ├── WorkflowInstance.tsx    // Active workflow view
│   └── TaskQueue.tsx           // Pending approvals
├── signatures/
│   ├── SignatureRequest.tsx    // Digital signing interface
│   ├── SignatureHistory.tsx    // Signature audit trail
│   └── CertificateManager.tsx  // Certificate management
└── search/
    ├── DocumentSearch.tsx      // Advanced document search
    ├── SearchFilters.tsx       // Search filters
    └── SearchResults.tsx       // Results display
```

### 2.5 Phase 4: IoT & Monitoring (Weeks 15-18)

**Цель**: Система мониторинга окружающей среды и IoT интеграция

#### 2.5.1 Week 15: IoT Infrastructure

**MQTT & Sensor Integration**:

```typescript
// IoT Data Pipeline
interface SensorReading {
  sensorId: string;
  facilityId: string;
  zoneId: string;
  readings: {
    temperature?: number;
    humidity?: number;
    co2?: number;
    ph?: number;
    ec?: number;
    light?: number;
  };
  timestamp: Date;
  quality: "good" | "warning" | "error";
}

class IoTDataProcessor {
  @Subscribe("sensors/+/data")
  async processSensorData(
    topic: string,
    payload: SensorReading
  ): Promise<void> {
    // Store in VictoriaMetrics
    await this.timeSeriesDb.insert({
      metric: "sensor_readings",
      tags: {
        sensor_id: payload.sensorId,
        facility: payload.facilityId,
        zone: payload.zoneId,
      },
      values: payload.readings,
      timestamp: payload.timestamp,
    });

    // Check thresholds
    const alerts = await this.checkThresholds(payload);
    if (alerts.length > 0) {
      await this.alertService.triggerAlerts(alerts);
    }

    // Update plant environment data
    await this.updatePlantEnvironment(payload);
  }
}
```

#### 2.5.2 Week 16: Alert System

**Threshold & Alert Management**:

```typescript
// Alert Management System
interface AlertThreshold {
  sensorType: SensorType;
  facilityId: string;
  zoneId?: string;
  minValue?: number;
  maxValue?: number;
  severity: "low" | "medium" | "high" | "critical";
  action: AlertAction;
}

interface AlertAction {
  type: "email" | "sms" | "push" | "webhook";
  recipients: string[];
  escalation?: {
    delay: number;
    nextLevel: AlertAction;
  };
}

class AlertService {
  async checkThresholds(reading: SensorReading): Promise<Alert[]> {
    const thresholds = await this.getThresholds(
      reading.facilityId,
      reading.zoneId
    );
    const alerts: Alert[] = [];

    for (const [sensor, value] of Object.entries(reading.readings)) {
      const threshold = thresholds.find((t) => t.sensorType === sensor);
      if (!threshold) continue;

      if (this.isOutOfRange(value, threshold)) {
        alerts.push({
          id: uuid(),
          sensorId: reading.sensorId,
          type: sensor as SensorType,
          value,
          threshold,
          severity: threshold.severity,
          message: this.generateAlertMessage(sensor, value, threshold),
          timestamp: reading.timestamp,
          acknowledged: false,
        });
      }
    }

    return alerts;
  }
}
```

#### 2.5.3 Week 17: Monitoring Dashboard

**Real-time Monitoring UI**:

```typescript
// Monitoring Dashboard Components
src/components/monitoring/
├── dashboard/
│   ├── FacilityOverview.tsx     // Facility status overview
│   ├── ZoneMonitoring.tsx       // Zone-specific metrics
│   ├── AlertsPanel.tsx          // Active alerts display
│   └── MetricsChart.tsx         // Real-time charts
├── sensors/
│   ├── SensorGrid.tsx           // Sensor status grid
│   ├── SensorDetails.tsx        // Individual sensor view
│   ├── SensorConfig.tsx         // Sensor configuration
│   └── CalibrationManager.tsx   // Calibration tracking
├── alerts/
│   ├── AlertList.tsx            // Alert management
│   ├── AlertDetails.tsx         // Alert detail view
│   ├── ThresholdConfig.tsx      // Threshold configuration
│   └── EscalationMatrix.tsx     // Alert escalation setup
└── analytics/
    ├── TrendAnalysis.tsx        // Trend analysis
    ├── CorrelationView.tsx      // Data correlation
    └── PredictiveAlerts.tsx     // ML-based predictions
```

**Real-time Data Updates**:

```typescript
// WebSocket Integration for Real-time Updates
class RealtimeService {
  private wsConnection: WebSocket;

  async subscribeTo(subscriptions: Subscription[]): Promise<void> {
    const message = {
      type: "subscribe",
      subscriptions: subscriptions.map((sub) => ({
        topic: sub.topic,
        filters: sub.filters,
      })),
    };

    this.wsConnection.send(JSON.stringify(message));
  }

  onSensorData(callback: (data: SensorReading) => void): void {
    this.wsConnection.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "sensor_data") {
        callback(data.payload);
      }
    });
  }
}
```

### 2.6 Phase 5: Workforce & Training (Weeks 19-22)

**Цель**: Управление персоналом, компетенциями и тренингами

#### 2.6.1 Week 19: User Management & Roles

**RBAC Implementation**:

```typescript
// Role-Based Access Control
interface Role {
  id: RoleId;
  name: string;
  permissions: Permission[];
  facilities: FacilityId[];
  isActive: boolean;
}

interface Permission {
  resource: string; // 'plants', 'financial', 'documents'
  actions: string[]; // 'read', 'write', 'delete', 'approve'
  conditions?: PermissionCondition[];
}

interface PermissionCondition {
  field: string; // 'facility_id', 'created_by'
  operator: "eq" | "in" | "ne";
  value: any;
}

class RoleService {
  async checkPermission(
    userId: UserId,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    const userRoles = await this.getUserRoles(userId);

    for (const role of userRoles) {
      const permission = role.permissions.find(
        (p) => p.resource === resource && p.actions.includes(action)
      );

      if (
        permission &&
        this.evaluateConditions(permission.conditions, context)
      ) {
        return true;
      }
    }

    return false;
  }
}
```

#### 2.6.2 Week 20: Competency Management

**Skills & Competency Tracking**:

```typescript
// Competency Management System
interface Competency {
  id: CompetencyId;
  name: string;
  description: string;
  category: CompetencyCategory;
  requiredLevel: SkillLevel;
  certificationRequired: boolean;
  validityPeriod?: number; // months
}

interface UserCompetency {
  userId: UserId;
  competencyId: CompetencyId;
  currentLevel: SkillLevel;
  certifiedDate?: Date;
  expirationDate?: Date;
  assessments: Assessment[];
  trainings: Training[];
}

interface Assessment {
  id: AssessmentId;
  competencyId: CompetencyId;
  assessorId: UserId;
  score: number;
  maxScore: number;
  assessedAt: Date;
  evidence: Evidence[];
  notes?: string;
}

class CompetencyService {
  async assessUserCompetency(
    userId: UserId,
    competencyId: CompetencyId,
    assessment: AssessmentData
  ): Promise<UserCompetency> {
    const competency = await this.getCompetency(competencyId);
    const userComp = await this.getUserCompetency(userId, competencyId);

    const newAssessment: Assessment = {
      id: uuid(),
      competencyId,
      assessorId: assessment.assessorId,
      score: assessment.score,
      maxScore: assessment.maxScore,
      assessedAt: new Date(),
      evidence: assessment.evidence,
      notes: assessment.notes,
    };

    userComp.assessments.push(newAssessment);
    userComp.currentLevel = this.calculateSkillLevel(userComp.assessments);

    return await this.saveUserCompetency(userComp);
  }
}
```

#### 2.6.3 Week 21: Training System

**Training Management**:

```typescript
// Training Management System
interface TrainingProgram {
  id: TrainingProgramId;
  title: string;
  description: string;
  competencies: CompetencyId[];
  modules: TrainingModule[];
  prerequisites: TrainingProgramId[];
  duration: number; // hours
  isRequired: boolean;
  validityPeriod?: number; // months
}

interface TrainingModule {
  id: TrainingModuleId;
  title: string;
  content: TrainingContent;
  assessments: TrainingAssessment[];
  completionCriteria: CompletionCriteria;
}

interface TrainingEnrollment {
  userId: UserId;
  programId: TrainingProgramId;
  enrolledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: "enrolled" | "in_progress" | "completed" | "expired";
  progress: ModuleProgress[];
  finalScore?: number;
}

class TrainingService {
  async enrollUser(
    userId: UserId,
    programId: TrainingProgramId
  ): Promise<TrainingEnrollment> {
    // Check prerequisites
    const prerequisites = await this.checkPrerequisites(userId, programId);
    if (!prerequisites.met) {
      throw new Error(
        `Prerequisites not met: ${prerequisites.missing.join(", ")}`
      );
    }

    const enrollment: TrainingEnrollment = {
      userId,
      programId,
      enrolledAt: new Date(),
      status: "enrolled",
      progress: [],
    };

    return await this.saveEnrollment(enrollment);
  }

  async completeModule(
    userId: UserId,
    moduleId: TrainingModuleId,
    assessmentResults: AssessmentResult[]
  ): Promise<ModuleProgress> {
    const module = await this.getModule(moduleId);
    const progress = await this.getModuleProgress(userId, moduleId);

    progress.completedAt = new Date();
    progress.assessmentResults = assessmentResults;
    progress.passed = this.evaluateCompletion(
      module.completionCriteria,
      assessmentResults
    );

    return await this.saveProgress(progress);
  }
}
```

#### 2.6.4 Week 22: Training UI & Integration

**Training Interface Components**:

```typescript
// Training Management UI
src/components/training/
├── programs/
│   ├── ProgramCatalog.tsx       // Available training programs
│   ├── ProgramDetails.tsx       // Program information
│   ├── EnrollmentForm.tsx       // Training enrollment
│   └── ProgressTracker.tsx      // Training progress
├── modules/
│   ├── ModuleViewer.tsx         // Training content viewer
│   ├── AssessmentForm.tsx       // Module assessments
│   ├── CompletionCert.tsx       // Completion certificates
│   └── ModuleNavigation.tsx     // Module navigation
├── competency/
│   ├── CompetencyMatrix.tsx     // Skills matrix view
│   ├── UserProfile.tsx          // Individual competency profile
│   ├── AssessmentScheduler.tsx  // Assessment scheduling
│   └── CertificationTracker.tsx // Certification tracking
└── reporting/
    ├── TrainingReports.tsx      // Training analytics
    ├── ComplianceReports.tsx    // Compliance tracking
    └── SkillsGapAnalysis.tsx    // Skills gap analysis
```

---

## 📊 **3. ЗАВИСИМОСТИ И ПРИОРИТЕТЫ**

### 3.1 Module Dependency Matrix

```text
┌─────────────────────────────────────────────────────────────────────┐
│                       DEPENDENCY MATRIX                            │
├─────────────────────────────────────────────────────────────────────┤
│           │Auth│Plant│Finc│Docs│IoT │Work│Spat│Proc│Rept│Anly│      │
│ Auth      │ -  │  ✓  │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │      │
│ Plant     │ ✓  │ -  │ ✓  │ ~  │ ~  │ ~  │ ✓  │ ~  │ ✓  │ ✓  │      │
│ Financial │ ✓  │ ✓  │ -  │ ~  │ ~  │ ~  │ ~  │ ~  │ ✓  │ ✓  │      │
│ Documents │ ✓  │ ~  │ ~  │ -  │ ~  │ ✓  │ ~  │ ~  │ ✓  │ ~  │      │
│ IoT       │ ✓  │ ✓  │ ~  │ ~  │ -  │ ~  │ ✓  │ ~  │ ✓  │ ✓  │      │
│ Workforce │ ✓  │ ~  │ ~  │ ✓  │ ~  │ -  │ ~  │ ~  │ ✓  │ ✓  │      │
│ Spatial   │ ✓  │ ✓  │ ~  │ ~  │ ✓  │ ~  │ -  │ ~  │ ✓  │ ✓  │      │
│ Procurement│✓  │ ✓  │ ✓  │ ~  │ ~  │ ~  │ ~  │ -  │ ✓  │ ✓  │      │
│ Reporting │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │ -  │ ✓  │      │
│ Analytics │ ✓  │ ✓  │ ✓  │ ~  │ ✓  │ ✓  │ ✓  │ ✓  │ ✓  │ -  │      │
└─────────────────────────────────────────────────────────────────────┘

Legend:
✓ = Hard dependency (required)
~ = Soft dependency (beneficial)
- = Self
```

### 3.2 Critical Path Analysis

**MVP Critical Path** (Weeks 1-14):

1. **Foundation** (1-2) → Authentication, Infrastructure
2. **Plant Module** (3-6) → Core business logic
3. **Financial** (7-10) → Basic accounting
4. **Documents** (11-14) → Compliance foundation

**Full System Path** (Weeks 1-30):

- **Core Path**: Foundation → Plant → Financial → Documents
- **Enhancement Path**: IoT → Workforce → Spatial → Analytics
- **Integration Path**: Reporting → Procurement → Advanced Features

### 3.3 Risk Assessment

**High Risk Items**:

- Mayan-EDMS integration complexity
- PWA performance on different devices
- Real-time IoT data processing
- Electronic signature compliance

**Mitigation Strategies**:

- Early Mayan-EDMS proof of concept
- Progressive enhancement for PWA
- Simplified IoT implementation first
- External e-signature service integration

---

## 🚀 **4. РАЗВЕРТЫВАНИЕ И ТЕСТИРОВАНИЕ**

### 4.1 Testing Strategy

#### 4.1.1 Test Pyramid

```text
                    ┌─────────────┐
                   ╱  E2E Tests   ╲
                  ╱   (Manual +   ╲
                 ╱   Automated)   ╲
                ╱_________________╲
               ┌───────────────────┐
              ╱  Integration Tests ╲
             ╱    (API + DB +      ╲
            ╱     External)        ╲
           ╱_______________________╲
          ┌─────────────────────────┐
         ╱      Unit Tests          ╲
        ╱  (Domain Logic +          ╲
       ╱   Business Rules)          ╲
      ╱___________________________╲
```

#### 4.1.2 Test Implementation per Phase

**Phase 1 (Plant Module)**:

```typescript
// Unit Tests - Domain Logic
describe("PlantAggregate", () => {
  test("should transition stages according to business rules");
  test("should prevent invalid stage transitions");
  test("should calculate growth duration correctly");
});

// Integration Tests - API & Database
describe("Plant API Integration", () => {
  test("POST /plants with valid data creates plant");
  test("GET /plants filters by batch and stage");
  test("PUT /plants/:id/transition updates stage");
});

// E2E Tests - User Workflows
describe("Plant Management Workflow", () => {
  test("Cultivator can create batch and add plants");
  test("Supervisor can track plant progress");
  test("Manager can view batch reports");
});
```

### 4.2 Deployment Strategy

#### 4.2.1 Environment Pipeline

```text
┌─────────────────────────────────────────────────────────────────────┐
│                     DEPLOYMENT PIPELINE                            │
├─────────────────────────────────────────────────────────────────────┤
│  Developer     │ Feature Branch │ Pull Request │ Main Branch │       │
│  Machine       │ Development    │ Testing      │ Production  │       │
│                │                │              │             │       │
│ ┌────────────┐ │ ┌────────────┐ │ ┌──────────┐ │ ┌─────────┐ │       │
│ │ Local Dev  │→│ │ Dev Deploy │→│ │ Test Env │→│ │ Prod    │ │       │
│ │ Hot Reload │ │ │ Auto Deploy│ │ │ Staging  │ │ │ Manual  │ │       │
│ │ AI Assist  │ │ │ Unit Tests │ │ │ E2E Tests│ │ │ Deploy  │ │       │
│ └────────────┘ │ └────────────┘ │ └──────────┘ │ └─────────┘ │       │
└─────────────────────────────────────────────────────────────────────┘
```

#### 4.2.2 Docker Containerization

```dockerfile
# Frontend PWA Container
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Backend API Container
FROM node:18-alpine AS api-build
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM node:18-alpine AS api-production
WORKDIR /app
COPY --from=api-build /app/dist ./dist
COPY --from=api-build /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

#### 4.2.3 Kubernetes Deployment

```yaml
# Plant Module Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gacp-erp-plant-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gacp-erp-plant-service
  template:
    metadata:
      labels:
        app: gacp-erp-plant-service
    spec:
      containers:
        - name: plant-service
          image: gacp-erp/plant-service:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: database-secret
                  key: url
            - name: REDIS_URL
              valueFrom:
                configMapKeyRef:
                  name: redis-config
                  key: url
```

---

## 📈 **5. МЕТРИКИ И KPI**

### 5.1 Development Metrics

**AI-Assisted Development KPIs**:

- Code completion accuracy: > 85%
- Time to implement feature: < baseline - 40%
- Bug rate: < 0.1 bugs per 100 lines
- Test coverage: > 90%
- Documentation completeness: > 95%

**Phase Completion Metrics**:

- MVP delivery time: Week 14
- Module integration success: > 98%
- Performance benchmarks met: > 95%
- User acceptance criteria: > 90%

### 5.2 Business Metrics

**Plant Module KPIs**:

- Plant tracking accuracy: > 99.9%
- Stage transition compliance: 100%
- Batch yield tracking: Complete
- Inventory accuracy: > 99.5%

**Financial Module KPIs**:

- Biological asset valuation accuracy: ± 5%
- Financial report generation time: < 30 seconds
- Accounting period close time: < 4 hours
- Audit trail completeness: 100%

---

Этот план разработки обеспечивает структурированный подход к созданию GACP-ERP системы с учетом AI-assisted разработки, Mayan-EDMS интеграции и PWA архитектуры. План позволяет получить рабочий MVP к неделе 14 и полнофункциональную систему к неделе 30.
