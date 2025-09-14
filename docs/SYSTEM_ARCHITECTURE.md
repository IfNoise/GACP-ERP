# 🏗️ Архитектура GACP-ERP системы

**Документ**: System Architecture Document (SAD)  
**Версия**: 1.0  
**Дата**: 14 сентября 2025  
**Статус**: CRITICAL - Основа для разработки

---

## 🎯 **1. ВВЕДЕНИЕ**

### 1.1 Назначение документа

Данный документ описывает техническую архитектуру GACP-ERP системы с детальным рассмотрением:

- Модульной структуры системы
- API спецификаций и интерфейсов
- Схем баз данных и моделей данных
- Интеграционных паттернов
- Patterns и best practices

### 1.2 Целевая аудитория

- **Разработчики**: @IfNoise + AI Assistant (GitHub Copilot + Claude)
- **Архитекторы**: Для понимания общей структуры
- **DevOps инженеры**: Для deployment и infrastructure
- **QA инженеры**: Для планирования тестирования

### 1.3 Связь с другими документами

- **Базируется на**: Technical Requirements Document
- **Реализует**: URS/FS/DS требования
- **Интегрируется с**: Mayan-EDMS, XeoKit, IoT системы

---

## 🏛️ **2. ОБЩАЯ АРХИТЕКТУРА СИСТЕМЫ**

### 2.1 High-Level Architecture

```text
┌─────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                        │
├─────────────────────────────────────────────────────────────────────┤
│           Progressive Web Application (Next.js 15+)                │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ Desktop UI  │ │ Mobile UI   │ │ Terminal UI │ │ 3D Viewer   │   │
│  │ (Workstns)  │ │ (Phones)    │ │ (TV Screens)│ │ (XeoKit)    │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                          HTTPS/WSS
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────────┤
│                    NestJS API Gateway                              │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                     MICROSERVICES                              ││
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ ││
│  │ │Plant        │ │Financial    │ │Workforce    │ │Spatial    │ ││
│  │ │Lifecycle    │ │Management   │ │Management   │ │Planning   │ ││
│  │ └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ ││
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ ││
│  │ │IoT &        │ │Training &   │ │Procurement  │ │Analytics  │ ││
│  │ │Monitoring   │ │Competency   │ │Management   │ │& Forecast │ ││
│  │ └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ ││
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ ││
│  │ │Authentication│ │Audit Trail  │ │Document Mgmt│ │PDF Report │ ││
│  │ │& Authz      │ │& Compliance │ │(Mayan EDMS) │ │Generator  │ ││
│  │ └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ ││
│  │ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ ││
│  │ │Internal     │ │Database     │ │Knowledge    │ │External   │ ││
│  │ │Communications│ │Replication  │ │Management   │ │Integration│ ││
│  │ │(Jitsi Stack)│ │& WORM       │ │(Wiki.js)    │ │& APIs     │ ││
│  │ └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                              │
                      EVENT-DRIVEN MESSAGING
                              │
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│ │PostgreSQL   │ │MongoDB      │ │VictoriaMetrs│ │ImmuDB       │   │
│ │(Primary)    │ │(Documents)  │ │(TimeSeries) │ │(AuditTrail) │   │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│ │Redis        │ │Mayan-EDMS   │ │File Storage │ │Elasticsearch│   │
│ │(Cache)      │ │(Documents)  │ │(S3)         │ │(Search)     │   │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│ │PostgreSQL   │ │Prosody XMPP │ │Cloud        │ │WORM Storage │   │
│ │Replicas     │ │Server       │ │Database     │ │(Compliance) │   │
│ │(Multi-Cloud)│ │(Jitsi)      │ │Replicas     │ │             │   │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                        INFRASTRUCTURE
                              │
┌─────────────────────────────────────────────────────────────────────┐
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│ │Kubernetes   │ │Apache Kafka │ │MQTT Broker  │ │Keycloak     │   │
│ │(Container   │ │(Events)     │ │(IoT)        │ │(Auth)       │   │
│ │Orchestration│ │             │ │             │ │             │   │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│ │Prometheus   │ │Grafana      │ │Traefik      │ │Cert-Manager │   │
│ │(Monitoring) │ │(Dashboards) │ │(Load Bal.)  │ │(TLS)        │   │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│ │Jitsi Meet   │ │Jitsi        │ │Jicofo       │ │Jigasi       │   │
│ │(Video Conf) │ │Videobridge  │ │(Conference  │ │(SIP Gateway)│   │
│ │             │ │(Media SFU)  │ │ Management) │ │             │   │
│ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Архитектурные принципы

#### 2.2.1 Domain-Driven Design (DDD)

- **Bounded Contexts**: Четкое разделение доменов
- **Aggregates**: Consistency boundaries
- **Domain Events**: Loose coupling между модулями
- **Ubiquitous Language**: Единый язык предметной области

#### 2.2.2 Event-Driven Architecture (EDA)

- **Event Sourcing**: Для audit trail и compliance
- **CQRS**: Разделение команд и запросов
- **Eventual Consistency**: Между microservices
- **Saga Pattern**: Для distributed transactions

#### 2.2.3 Microservices Patterns

- **API Gateway**: Единая точка входа
- **Service Discovery**: Автоматическое обнаружение сервисов
- **Circuit Breaker**: Защита от каскадных отказов
- **Bulkhead**: Изоляция ресурсов

---

## 📦 **3. МОДУЛЬНАЯ АРХИТЕКТУРА**

### 3.1 Core Business Modules

#### 3.1.1 Plant Lifecycle Module

**Bounded Context**: Управление жизненным циклом растений

```typescript
// Domain Entities
interface Plant {
  id: PlantId;
  batchId: BatchId;
  genetics: Genetics;
  stage: PlantStage;
  location: Location;
  metadata: PlantMetadata;
  history: PlantEvent[];
}

interface Batch {
  id: BatchId;
  strain: Strain;
  plants: Plant[];
  startDate: Date;
  harvestDate?: Date;
  status: BatchStatus;
}

// Domain Events
type PlantEvent =
  | PlantCreatedEvent
  | PlantTransitionedEvent
  | PlantMovedEvent
  | PlantHarvestedEvent;

// Aggregates
class PlantAggregate {
  transition(newStage: PlantStage): PlantEvent[];
  move(newLocation: Location): PlantEvent[];
  harvest(): PlantEvent[];
}
```

**API Endpoints**:

```typescript
// REST API Specification
POST   /api/v1/plants              // Create plant
GET    /api/v1/plants/:id          // Get plant details
PUT    /api/v1/plants/:id          // Update plant
DELETE /api/v1/plants/:id          // Delete plant
POST   /api/v1/plants/:id/transition // Stage transition
POST   /api/v1/plants/:id/move     // Move plant
GET    /api/v1/batches             // List batches
POST   /api/v1/batches             // Create batch
GET    /api/v1/batches/:id/plants  // Get batch plants
```

**Database Schema**:

```sql
-- PostgreSQL Schema
CREATE TABLE plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES batches(id),
    genetics_id UUID NOT NULL REFERENCES genetics(id),
    stage plant_stage_enum NOT NULL,
    location_id UUID REFERENCES locations(id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE plant_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID NOT NULL REFERENCES plants(id),
    event_type VARCHAR(50) NOT NULL,
    event_data JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES users(id)
);

CREATE INDEX idx_plants_batch_id ON plants(batch_id);
CREATE INDEX idx_plants_stage ON plants(stage);
CREATE INDEX idx_plant_events_plant_id ON plant_events(plant_id);
```

#### 3.1.2 Financial Module

**Bounded Context**: Финансовый учет и биологические активы

```typescript
// Domain Entities
interface Account {
  id: AccountId;
  code: string;
  name: string;
  type: AccountType;
  parentId?: AccountId;
  balance: Money;
}

interface JournalEntry {
  id: JournalEntryId;
  date: Date;
  description: string;
  lines: JournalLine[];
  reference?: string;
  status: JournalStatus;
}

interface BiologicalAsset {
  id: BiologicalAssetId;
  plantId: PlantId;
  acquisitionCost: Money;
  currentValue: Money;
  valuationDate: Date;
  method: ValuationMethod;
}

// Value Objects
class Money {
  constructor(public amount: number, public currency: Currency) {}
}
```

**API Endpoints**:

```typescript
// Financial API
GET / api / v1 / accounts; // Chart of accounts
POST / api / v1 / journal - entries; // Create journal entry
GET / api / v1 / journal - entries; // List entries
GET / api / v1 / biological - assets; // List biological assets
POST / api / v1 / biological - assets / valuation; // Asset valuation
GET / api / v1 / reports / balance - sheet; // Balance sheet
GET / api / v1 / reports / income - statement; // P&L statement
```

#### 3.1.3 Document Management (Mayan-EDMS)

**Bounded Context**: Электронный документооборот

```typescript
// Domain Entities
interface Document {
  id: DocumentId;
  title: string;
  description?: string;
  documentType: DocumentType;
  metadata: DocumentMetadata;
  versions: DocumentVersion[];
  workflow?: WorkflowInstance;
  permissions: Permission[];
}

interface WorkflowInstance {
  id: WorkflowInstanceId;
  workflowId: WorkflowId;
  currentState: WorkflowState;
  tasks: WorkflowTask[];
  startedAt: Date;
  completedAt?: Date;
}

interface ElectronicSignature {
  id: SignatureId;
  documentId: DocumentId;
  signerId: UserId;
  signatureData: string;
  timestamp: Date;
  certificate: Certificate;
}
```

**Integration Points**:

```typescript
// Mayan-EDMS Integration Service
class MayanEdmsService {
  async uploadDocument(
    file: File,
    metadata: DocumentMetadata
  ): Promise<Document>;
  async getDocument(documentId: DocumentId): Promise<Document>;
  async startWorkflow(
    documentId: DocumentId,
    workflowId: WorkflowId
  ): Promise<WorkflowInstance>;
  async signDocument(
    documentId: DocumentId,
    signature: ElectronicSignature
  ): Promise<void>;
  async searchDocuments(query: SearchQuery): Promise<Document[]>;
}

// SOP Integration
class SopService {
  async createSop(content: SopContent): Promise<Sop>;
  async linkSopToTask(sopId: SopId, taskId: TaskId): Promise<void>;
  async getSopForTask(taskId: TaskId): Promise<Sop[]>;
}
```

### 3.2 Support Modules

#### 3.2.1 IoT & Monitoring Module

**Bounded Context**: Сбор и анализ IoT данных

```typescript
// Domain Entities
interface Sensor {
  id: SensorId;
  type: SensorType;
  location: Location;
  calibration: CalibrationData;
  status: SensorStatus;
  lastReading?: SensorReading;
}

interface SensorReading {
  sensorId: SensorId;
  value: number;
  unit: string;
  timestamp: Date;
  quality: ReadingQuality;
}

interface Alert {
  id: AlertId;
  sensorId: SensorId;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  triggeredAt: Date;
  acknowledgedAt?: Date;
}
```

**MQTT Integration**:

```typescript
// MQTT Message Handling
interface SensorDataMessage {
  sensorId: string;
  readings: {
    temperature?: number;
    humidity?: number;
    co2?: number;
    light?: number;
    ph?: number;
  };
  timestamp: string;
  deviceId: string;
}

class MqttHandler {
  @Subscribe("sensors/+/data")
  handleSensorData(topic: string, payload: SensorDataMessage) {
    // Process sensor data
    // Store in VictoriaMetrics
    // Check thresholds
    // Generate alerts if needed
  }
}
```

#### 3.2.2 Internal Communications Module (Jitsi Stack)

**Bounded Context**: Внутренние коммуникации и конференц-связь

```typescript
// Domain Entities
interface Conference {
  id: ConferenceId;
  name: string;
  roomId: string;
  participants: Participant[];
  startTime: Date;
  endTime?: Date;
  recording?: RecordingInfo;
  moderator: UserId;
}

interface Participant {
  userId: UserId;
  displayName: string;
  jid: string; // XMPP Jabber ID
  role: ParticipantRole; // moderator | participant
  joinTime: Date;
  leaveTime?: Date;
  status: ParticipantStatus; // active | muted | away
}

interface Message {
  id: MessageId;
  from: UserId;
  to: UserId | ConferenceId;
  content: string;
  type: MessageType; // chat | notification | alert
  timestamp: Date;
  delivered: boolean;
  read: boolean;
}
```

**Jitsi Integration Architecture**:

```typescript
// Jitsi Service Integration
@Injectable()
export class JitsiService {
  async createConference(
    request: CreateConferenceRequest
  ): Promise<Conference> {
    // Create room in Prosody XMPP
    // Configure Jicofo for media management
    // Setup recording if required
    // Generate JWT token for authentication
  }

  async joinConference(
    conferenceId: ConferenceId,
    userId: UserId
  ): Promise<JoinResponse> {
    // Authenticate user via Keycloak SSO
    // Generate secure conference JWT
    // Configure participant permissions
    // Log access for audit trail
  }

  async sendMessage(message: MessageRequest): Promise<void> {
    // Send via Prosody XMPP server
    // Store in audit trail (immudb)
    // Push notification if user offline
    // Integrate with Kafka events
  }
}
```

**XMPP/Prosody Configuration**:

```lua
-- prosody.cfg.lua configuration for GACP-ERP
VirtualHost "gacp-erp.local"
    authentication = "token"
    app_id = "gacp_erp"
    app_secret = "secure_secret_from_keycloak"
    allow_empty_token = false

    modules_enabled = {
        "bosh";
        "websocket";
        "smacks";
        "carbons";
        "mam"; -- Message Archive Management
        "token_verification";
        "presence";
        "roster";
        "audit_log"; -- Custom audit module
    }

Component "conference.gacp-erp.local" "muc"
    modules_enabled = {
        "muc_meeting_id";
        "muc_domain_mapper";
        "token_verification";
        "muc_rate_limit";
        "audit_conference"; -- Custom audit module
    }
```

#### 3.2.3 Database Replication Module

**Bounded Context**: Репликация данных и обеспечение непрерывности

```typescript
// Domain Entities
interface ReplicationStream {
  id: StreamId;
  name: string;
  sourceDatabase: DatabaseConfig;
  targetReplicas: ReplicaConfig[];
  status: ReplicationStatus;
  lag: number; // milliseconds
  lastSync: Date;
  configuration: StreamConfiguration;
}

interface ReplicaConfig {
  id: ReplicaId;
  type: ReplicaType; // primary | standby | cloud
  location: ReplicaLocation; // on-premise | aws | azure
  isWORM: boolean; // Write Once Read Many for compliance
  retentionPolicy: RetentionPolicy;
  encryptionConfig: EncryptionConfig;
}

interface AuditReplicationEvent {
  eventId: EventId;
  streamId: StreamId;
  eventType: ReplicationEventType;
  timestamp: Date;
  sourceWAL: WALPosition;
  targetWAL: WALPosition;
  latency: number;
  checksum: string;
}
```

**PostgreSQL Streaming Replication**:

```typescript
@Injectable()
export class DatabaseReplicationService {
  async configureStreaming(config: ReplicationConfig): Promise<void> {
    // Configure WAL streaming
    // Setup replication slots
    // Configure Kafka for change events
    // Initialize cloud replicas with WORM
  }

  async monitorReplicationLag(): Promise<ReplicationStatus> {
    // Check pg_stat_replication view
    // Verify Kafka consumer lag
    // Validate WORM integrity
    // Generate alerts if thresholds exceeded
  }

  async validateDataIntegrity(): Promise<IntegrityReport> {
    // Compare checksums between primary and replicas
    // Verify ALCOA+ compliance on audit tables
    // Check WORM policy enforcement
    // Generate compliance report
  }
}
```

**Kafka Integration for Replication Events**:

```typescript
// Kafka Topics for Database Events
interface DatabaseChangeEvent {
  operation: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  schema: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  timestamp: Date;
  transactionId: string;
  userId: string;
  checksum: string;
}

@KafkaConsumer("database-changes")
export class ReplicationConsumer {
  async processChange(event: DatabaseChangeEvent): Promise<void> {
    // Stream to cloud replicas
    // Validate against WORM policies
    // Store in immudb for audit
    // Update replication metrics
  }
}
```

**Cloud WORM Storage Implementation**:

```sql
-- WORM (Write Once, Read Many) enforcement
CREATE OR REPLACE FUNCTION enforce_worm_policy()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'WORM violation: % operation not allowed on table %',
                        TG_OP, TG_TABLE_NAME;
    END IF;

    -- Log to audit trail
    INSERT INTO audit.worm_access_log (
        table_name, operation, user_id, timestamp, checksum
    ) VALUES (
        TG_TABLE_NAME, TG_OP, current_user, NOW(),
        md5(row_to_json(NEW)::text)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all audit tables on cloud replicas
CREATE TRIGGER worm_enforcement
    BEFORE INSERT OR UPDATE OR DELETE
    ON audit.audit_trail_events
    FOR EACH ROW
    EXECUTE FUNCTION enforce_worm_policy();
```

#### 3.2.4 PDF Report Generator Module

**Bounded Context**: Автоматическая генерация PDF-отчетов для GACP-соответствия

```typescript
// Domain Entities
interface PDFReportTemplate {
  id: TemplateId;
  name: string;
  version: string;
  templateType: 'daily-plant-report' | 'weekly-summary' | 'batch-lifecycle' | 'audit-trail-export';
  reactComponent: string; // React component definition
  fields: TemplateField[];
  gacpCompliant: boolean;
  author: string;
  createdAt: Date;
  isActive: boolean;
}

interface PDFDocument {
  id: DocumentId;
  templateId: TemplateId;
  fileName: string;
  hash: string; // SHA-256 hash for integrity
  digitalSignature: string; // OpenSSL signature
  qrCode: string; // QR code for verification
  edmDocumentId: string; // Mayan EDMS document ID
  backupUrl: string; // S3/MinIO URL
  metadata: DocumentMetadata;
  generatedAt: Date;
  generatedBy: string;
}

interface ReportGenerationEvent {
  eventId: EventId;
  triggerEvent: AuditEvent;
  templateType: string;
  documentId: DocumentId;
  status: 'pending' | 'generating' | 'signing' | 'storing' | 'completed' | 'failed';
  metrics: GenerationMetrics;
}
```

**PDF Generation Service**:

```typescript
@Injectable()
export class PDFGeneratorService {
  constructor(
    private readonly templateEngine: TemplateEngine,
    private readonly signatureService: DigitalSignatureService,
    private readonly edmService: MayanEDMSService,
    private readonly storageService: StorageService
  ) {}

  async generateReport(
    templateName: string,
    data: any,
    metadata: ReportMetadata
  ): Promise<PDFDocument> {
    // 1. Generate PDF using React-PDF renderer
    const { filePath, hash } = await this.templateEngine.render(templateName, data);
    
    // 2. Create digital signature
    const signature = await this.signatureService.signWithOpenSSL(filePath);
    
    // 3. Generate QR code for verification
    const qrCode = await this.generateVerificationQR(hash, metadata.edmUrl);
    
    // 4. Store in Mayan EDMS
    const edmDocument = await this.edmService.upload(filePath, {
      label: metadata.label,
      hash,
      signature,
      template: templateName
    });
    
    // 5. Backup to S3/MinIO
    const backupUrl = await this.storageService.upload(filePath);
    
    return {
      id: generateDocumentId(),
      templateId: templateName,
      fileName: path.basename(filePath),
      hash,
      digitalSignature: signature,
      qrCode,
      edmDocumentId: edmDocument.id,
      backupUrl,
      metadata,
      generatedAt: new Date(),
      generatedBy: 'pdf-service'
    };
  }

  private async generateVerificationQR(hash: string, edmUrl: string): Promise<string> {
    const verificationUrl = `${edmUrl}/verify?hash=${hash}`;
    return await QRCode.toDataURL(verificationUrl);
  }
}
```

**Template Engine с React Components**:

```typescript
// libs/pdf-generator/templates/daily-plant-report.tsx
import React from 'react';
import { Document, Page, Text, View, Image } from '@react-pdf/renderer';
import { Header, Table, Footer, QRCode } from '../components';

interface DailyPlantReportProps {
  period: string;
  userName: string;
  plantEvents: PlantEvent[];
  edmUrl: string;
  hash: string;
}

export const DailyPlantReport: React.FC<DailyPlantReportProps> = ({
  period, userName, plantEvents, edmUrl, hash
}) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Header 
        title="Daily Plant Activity Report" 
        period={period}
        userName={userName}
      />
      
      <Table 
        columns={['Plant ID', 'Activity', 'Timestamp', 'Status']}
        data={plantEvents.map(e => [e.plantId, e.activity, e.timestamp, e.status])}
      />
      
      <Footer hash={hash} generatedAt={new Date()} />
      
      <QRCode 
        value={`${edmUrl}/verify?hash=${hash}`}
        style={styles.qr}
      />
    </Page>
  </Document>
);
```

**Kafka Integration для автоматической генерации**:

```typescript
@KafkaConsumer("audit.events")
export class ReportGenerationConsumer {
  constructor(private readonly pdfService: PDFGeneratorService) {}

  @MessagePattern("daily_plant_activity")
  async handleDailyPlantActivity(event: AuditEvent): Promise<void> {
    await this.pdfService.generateReport('daily-plant-report', {
      period: event.payload.period,
      userName: event.payload.userName,
      plantEvents: event.payload.events
    }, {
      label: `Daily Report ${event.payload.period}`,
      edmUrl: process.env.MAYAN_BASE_URL
    });
  }

  @MessagePattern("batch_completed")
  async handleBatchCompleted(event: AuditEvent): Promise<void> {
    await this.pdfService.generateReport('batch-lifecycle', event.payload, {
      label: `Batch Lifecycle ${event.payload.batchId}`,
      edmUrl: process.env.MAYAN_BASE_URL
    });
  }
}

@KafkaProducer()
export class ReportEventPublisher {
  async publishReportGenerated(document: PDFDocument): Promise<void> {
    await this.emit('pdf.generated', {
      documentId: document.id,
      hash: document.hash,
      edmUrl: document.edmDocumentId,
      template: document.templateId,
      generatedAt: document.generatedAt
    });
  }
}
```

**Digital Signature через OpenSSL**:

```typescript
@Injectable()
export class DigitalSignatureService {
  private readonly privateKeyPath = process.env.PRIVATE_KEY_PATH;
  private readonly publicKeyPath = process.env.PUBLIC_KEY_PATH;

  async signWithOpenSSL(filePath: string): Promise<string> {
    const sigPath = `${filePath}.sig`;
    
    await execFileAsync('openssl', [
      'dgst', '-sha256', '-sign', this.privateKeyPath,
      '-out', sigPath, filePath
    ]);
    
    // Return base64 encoded signature
    const signature = await fs.readFile(sigPath);
    return signature.toString('base64');
  }

  async verifySignature(filePath: string, signature: string): Promise<boolean> {
    try {
      const sigPath = `${filePath}.sig`;
      await fs.writeFile(sigPath, Buffer.from(signature, 'base64'));
      
      await execFileAsync('openssl', [
        'dgst', '-sha256', '-verify', this.publicKeyPath,
        '-signature', sigPath, filePath
      ]);
      
      return true;
    } catch {
      return false;
    }
  }
}
```

**GACP Compliance Integration**:

```typescript
interface GACPComplianceMetadata {
  documentType: 'audit-report' | 'batch-record' | 'calibration-cert';
  gacpVersion: string;
  complianceLevel: 'basic' | 'enhanced' | 'full';
  auditTrailHash: string;
  witnessSignatures: WitnessSignature[];
  regulatoryReferences: string[];
  retentionPeriod: number; // years
}

@Injectable()
export class GACPComplianceService {
  async validateCompliance(document: PDFDocument): Promise<ComplianceReport> {
    return {
      isCompliant: true,
      checks: {
        digitalSignature: await this.validateSignature(document),
        hashIntegrity: await this.validateHash(document),
        auditTrail: await this.validateAuditTrail(document),
        retention: await this.validateRetention(document)
      },
      validatedAt: new Date(),
      validatedBy: 'gacp-compliance-service'
    };
  }
}
```

---

## 🔗 **4. API АРХИТЕКТУРА**

### 4.1 API Gateway Pattern

```typescript
// API Gateway Configuration
@Module({
  imports: [
    PlantModule,
    FinancialModule,
    WorkforceModule,
    IoTModule,
    DocumentModule,
    AuthModule,
  ],
})
export class ApiGatewayModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthenticationMiddleware)
      .forRoutes("*")
      .apply(RateLimitMiddleware)
      .forRoutes("*")
      .apply(LoggingMiddleware)
      .forRoutes("*");
  }
}
```

### 4.2 Contract-First Development

**OpenAPI Specification Example**:

```yaml
# plants-api.yaml
openapi: 3.0.3
info:
  title: GACP-ERP Plants API
  version: 1.0.0
  description: Plant lifecycle management API

paths:
  /plants:
    get:
      summary: List plants
      parameters:
        - name: batchId
          in: query
          schema:
            type: string
            format: uuid
        - name: stage
          in: query
          schema:
            $ref: "#/components/schemas/PlantStage"
      responses:
        "200":
          description: List of plants
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Plant"

components:
  schemas:
    Plant:
      type: object
      required:
        - id
        - batchId
        - stage
      properties:
        id:
          type: string
          format: uuid
        batchId:
          type: string
          format: uuid
        stage:
          $ref: "#/components/schemas/PlantStage"
        genetics:
          $ref: "#/components/schemas/Genetics"
        location:
          $ref: "#/components/schemas/Location"

    PlantStage:
      type: string
      enum:
        - seedling
        - vegetative
        - flowering
        - harvest
        - disposed
```

### 4.3 Type-Safe API с ts-rest

```typescript
// API Contract Definition
import { initContract } from "@ts-rest/core";
import { z } from "zod";

const PlantSchema = z.object({
  id: z.string().uuid(),
  batchId: z.string().uuid(),
  stage: z.enum(["seedling", "vegetative", "flowering", "harvest"]),
  genetics: z.object({
    strain: z.string(),
    lineage: z.string(),
  }),
  location: z.object({
    facilityId: z.string(),
    zoneId: z.string(),
    position: z.string(),
  }),
});

const contract = initContract({
  plants: {
    getPlants: {
      method: "GET",
      path: "/plants",
      query: z.object({
        batchId: z.string().uuid().optional(),
        stage: z
          .enum(["seedling", "vegetative", "flowering", "harvest"])
          .optional(),
      }),
      responses: {
        200: z.array(PlantSchema),
      },
    },
    createPlant: {
      method: "POST",
      path: "/plants",
      body: PlantSchema.omit({ id: true }),
      responses: {
        201: PlantSchema,
      },
    },
  },
});

// Client Usage
const client = initClient(contract, {
  baseUrl: "https://api.gacp-erp.com",
  baseHeaders: {
    Authorization: `Bearer ${token}`,
  },
});

// Type-safe API calls
const plants = await client.plants.getPlants({
  query: { stage: "flowering" },
});
```

---

## 🗄️ **5. DATABASE АРХИТЕКТУРА**

### 5.1 Multi-Database Strategy

#### 5.1.1 PostgreSQL (Primary Database)

**Schema Organization**:

```sql
-- Core Business Schemas
CREATE SCHEMA plant_lifecycle;
CREATE SCHEMA financial;
CREATE SCHEMA workforce;
CREATE SCHEMA spatial;
CREATE SCHEMA procurement;

-- Support Schemas
CREATE SCHEMA audit;
CREATE SCHEMA configuration;
CREATE SCHEMA notifications;

-- Plant Lifecycle Schema
CREATE TABLE plant_lifecycle.facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address JSONB,
    timezone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE plant_lifecycle.strains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    genetics JSONB NOT NULL,
    characteristics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE plant_lifecycle.batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES plant_lifecycle.facilities(id),
    strain_id UUID NOT NULL REFERENCES plant_lifecycle.strains(id),
    batch_number VARCHAR(50) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    target_harvest_date DATE,
    actual_harvest_date DATE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'harvested', 'disposed')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE plant_lifecycle.plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID NOT NULL REFERENCES plant_lifecycle.batches(id),
    plant_tag VARCHAR(50) NOT NULL UNIQUE,
    mother_plant_id UUID REFERENCES plant_lifecycle.plants(id),
    stage VARCHAR(20) NOT NULL CHECK (stage IN ('seedling', 'vegetative', 'flowering', 'harvest', 'disposed')),
    location_id UUID REFERENCES spatial.locations(id),
    health_status VARCHAR(20) DEFAULT 'healthy',
    last_watered TIMESTAMP WITH TIME ZONE,
    last_fed TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial Schema
CREATE TABLE financial.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    parent_id UUID REFERENCES financial.accounts(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE financial.journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number VARCHAR(50) NOT NULL UNIQUE,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    reference VARCHAR(255),
    total_debit DECIMAL(15,2) NOT NULL,
    total_credit DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'posted', 'cancelled')),
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE financial.journal_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_entry_id UUID NOT NULL REFERENCES financial.journal_entries(id),
    account_id UUID NOT NULL REFERENCES financial.accounts(id),
    description TEXT,
    debit DECIMAL(15,2) DEFAULT 0,
    credit DECIMAL(15,2) DEFAULT 0,
    line_number INTEGER NOT NULL,
    CONSTRAINT check_debit_credit CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
);

CREATE TABLE financial.biological_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID NOT NULL REFERENCES plant_lifecycle.plants(id),
    acquisition_cost DECIMAL(15,2) NOT NULL,
    current_value DECIMAL(15,2) NOT NULL,
    valuation_date DATE NOT NULL,
    valuation_method VARCHAR(50) NOT NULL,
    accumulated_costs DECIMAL(15,2) DEFAULT 0,
    estimated_harvest_value DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Performance
CREATE INDEX idx_plants_batch_id ON plant_lifecycle.plants(batch_id);
CREATE INDEX idx_plants_stage ON plant_lifecycle.plants(stage);
CREATE INDEX idx_plants_location ON plant_lifecycle.plants(location_id);
CREATE INDEX idx_journal_lines_account ON financial.journal_lines(account_id);
CREATE INDEX idx_journal_lines_entry ON financial.journal_lines(journal_entry_id);
```

#### 5.1.2 MongoDB (Document Store)

**Collections Structure**:

```javascript
// Training Materials Collection
db.training_materials.insertOne({
  _id: ObjectId(),
  title: "Plant Care SOP",
  type: "sop",
  category: "cultivation",
  content: {
    sections: [
      {
        title: "Daily Care Routine",
        steps: [
          "Check soil moisture",
          "Monitor temperature",
          "Inspect for pests",
        ],
      },
    ],
  },
  metadata: {
    version: "1.2",
    approved_by: "supervisor_id",
    approved_at: ISODate(),
    tags: ["plant-care", "daily-routine"],
  },
  created_at: ISODate(),
  updated_at: ISODate(),
});

// Configuration Collection
db.system_configuration.insertOne({
  _id: "plant_stages_config",
  stages: {
    seedling: {
      duration_days: 14,
      temperature_range: { min: 18, max: 24 },
      humidity_range: { min: 65, max: 80 },
      light_schedule: "18/6",
    },
    vegetative: {
      duration_days: 30,
      temperature_range: { min: 20, max: 26 },
      humidity_range: { min: 60, max: 70 },
      light_schedule: "18/6",
    },
  },
  updated_at: ISODate(),
});

// Analytics Data Collection
db.business_metrics.insertOne({
  _id: ObjectId(),
  date: ISODate("2025-09-14"),
  facility_id: "facility_uuid",
  metrics: {
    active_plants: 1250,
    harvest_yield_kg: 45.2,
    revenue_daily: 15000.5,
    power_consumption_kwh: 340.5,
    water_usage_liters: 1200,
  },
  calculated_at: ISODate(),
});
```

#### 5.1.3 VictoriaMetrics (Time Series)

**Metrics Structure**:

```text
# Sensor Metrics
sensor_temperature{facility="facility_1",zone="veg_room_1",sensor_id="temp_001"} 23.5
sensor_humidity{facility="facility_1",zone="veg_room_1",sensor_id="hum_001"} 68.2
sensor_co2{facility="facility_1",zone="flower_room_2",sensor_id="co2_003"} 1200

# Business Metrics
plants_count{facility="facility_1",stage="vegetative"} 450
plants_count{facility="facility_1",stage="flowering"} 300
batch_progress{batch_id="batch_123",stage="flowering"} 0.75

# System Metrics
api_requests_total{method="GET",endpoint="/plants",status="200"} 1540
api_response_time{method="POST",endpoint="/plants",quantile="0.95"} 0.150
database_connections{pool="main",state="active"} 15
```

#### 5.1.4 ImmuDB (Audit Trail)

**Audit Schema**:

```sql
-- ImmuDB Schema for Audit Trail
CREATE TABLE audit_events (
    id INTEGER AUTO_INCREMENT,
    event_id VARCHAR[64] NOT NULL,
    entity_type VARCHAR[50] NOT NULL,
    entity_id VARCHAR[64] NOT NULL,
    action VARCHAR[20] NOT NULL,
    user_id VARCHAR[64] NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR[45],
    user_agent VARCHAR[255],
    PRIMARY KEY (id)
);

CREATE INDEX ON audit_events (entity_type, entity_id);
CREATE INDEX ON audit_events (user_id);
CREATE INDEX ON audit_events (timestamp);

-- Example Audit Record
INSERT INTO audit_events (
    event_id, entity_type, entity_id, action, user_id, timestamp,
    old_values, new_values, ip_address
) VALUES (
    'evt_123456', 'plant', 'plant_uuid', 'UPDATE', 'user_uuid', NOW(),
    '{"stage": "vegetative", "location": "zone_1"}',
    '{"stage": "flowering", "location": "zone_2"}',
    '192.168.1.100'
);
```

### 5.2 Data Access Patterns

#### 5.2.1 Repository Pattern

```typescript
// Generic Repository
interface Repository<T, ID> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: ID): Promise<void>;
}

// Plant Repository Implementation
@Injectable()
export class PlantRepository implements Repository<Plant, PlantId> {
  constructor(
    @InjectRepository(PlantEntity)
    private readonly plantRepo: Repository<PlantEntity>
  ) {}

  async findById(id: PlantId): Promise<Plant | null> {
    const entity = await this.plantRepo.findOne({
      where: { id: id.value },
      relations: ["batch", "genetics", "location"],
    });

    return entity ? this.toDomain(entity) : null;
  }

  async findByBatch(batchId: BatchId): Promise<Plant[]> {
    const entities = await this.plantRepo.find({
      where: { batchId: batchId.value },
      relations: ["genetics", "location"],
    });

    return entities.map((entity) => this.toDomain(entity));
  }

  private toDomain(entity: PlantEntity): Plant {
    return new Plant({
      id: new PlantId(entity.id),
      batchId: new BatchId(entity.batchId),
      stage: entity.stage,
      genetics: entity.genetics,
      location: entity.location,
      metadata: entity.metadata,
    });
  }
}
```

---

## 🔄 **6. EVENT-DRIVEN АРХИТЕКТУРА**

### 6.1 Domain Events

```typescript
// Base Domain Event
abstract class DomainEvent {
  public readonly eventId: string;
  public readonly timestamp: Date;
  public readonly version: number;

  constructor() {
    this.eventId = uuid();
    this.timestamp = new Date();
    this.version = 1;
  }
}

// Plant Domain Events
export class PlantStageTransitionedEvent extends DomainEvent {
  constructor(
    public readonly plantId: PlantId,
    public readonly fromStage: PlantStage,
    public readonly toStage: PlantStage,
    public readonly userId: UserId,
    public readonly reason?: string
  ) {
    super();
  }
}

export class PlantHarvestedEvent extends DomainEvent {
  constructor(
    public readonly plantId: PlantId,
    public readonly batchId: BatchId,
    public readonly harvestWeight: Weight,
    public readonly quality: QualityGrade,
    public readonly userId: UserId
  ) {
    super();
  }
}
```

### 6.2 Event Bus Implementation

```typescript
// Event Bus using Kafka
@Injectable()
export class EventBus {
  constructor(private readonly kafkaClient: KafkaService) {}

  async publish(event: DomainEvent): Promise<void> {
    const topic = this.getTopicForEvent(event);
    const message = {
      key: event.eventId,
      value: JSON.stringify({
        eventType: event.constructor.name,
        data: event,
        metadata: {
          version: event.version,
          timestamp: event.timestamp,
        },
      }),
    };

    await this.kafkaClient.emit(topic, message);
  }

  private getTopicForEvent(event: DomainEvent): string {
    const eventName = event.constructor.name;
    return `gacp-erp.${eventName.toLowerCase()}`;
  }
}

// Event Handlers
@EventHandler(PlantStageTransitionedEvent)
export class PlantStageTransitionedHandler {
  constructor(
    private readonly biologicalAssetService: BiologicalAssetService,
    private readonly auditService: AuditService
  ) {}

  async handle(event: PlantStageTransitionedEvent): Promise<void> {
    // Update biological asset valuation
    await this.biologicalAssetService.updateValuation(
      event.plantId,
      event.toStage
    );

    // Create audit record
    await this.auditService.recordEvent({
      entityType: "plant",
      entityId: event.plantId.value,
      action: "stage_transition",
      details: {
        from: event.fromStage,
        to: event.toStage,
        reason: event.reason,
      },
      userId: event.userId.value,
      timestamp: event.timestamp,
    });
  }
}
```

### 6.3 Saga Pattern для Distributed Transactions

```typescript
// Harvest Process Saga
@Saga()
export class HarvestProcessSaga {
  @SagaStart()
  @EventHandler(PlantHarvestedEvent)
  async handlePlantHarvested(event: PlantHarvestedEvent): Promise<void> {
    // Step 1: Update plant status
    await this.plantService.updateStatus(event.plantId, PlantStatus.HARVESTED);

    // Step 2: Create inventory record
    const inventoryCommand = new CreateInventoryItemCommand({
      plantId: event.plantId,
      weight: event.harvestWeight,
      quality: event.quality,
    });
    await this.commandBus.execute(inventoryCommand);

    // Step 3: Calculate biological asset value
    const valuationCommand = new CalculateBiologicalAssetValueCommand({
      plantId: event.plantId,
      harvestWeight: event.harvestWeight,
      harvestDate: event.timestamp,
    });
    await this.commandBus.execute(valuationCommand);
  }

  @EventHandler(InventoryItemCreatedEvent)
  async handleInventoryItemCreated(
    event: InventoryItemCreatedEvent
  ): Promise<void> {
    // Step 4: Create journal entries for harvest
    const journalCommand = new CreateHarvestJournalEntryCommand({
      plantId: event.plantId,
      inventoryValue: event.value,
      harvestDate: event.timestamp,
    });
    await this.commandBus.execute(journalCommand);
  }

  @EventHandler(HarvestJournalEntryCreatedEvent)
  async handleJournalEntryCreated(
    event: HarvestJournalEntryCreatedEvent
  ): Promise<void> {
    // Step 5: Generate harvest report
    const reportCommand = new GenerateHarvestReportCommand({
      plantId: event.plantId,
      journalEntryId: event.journalEntryId,
    });
    await this.commandBus.execute(reportCommand);
  }
}
```

---

## 🔐 **7. БЕЗОПАСНОСТЬ И АУТЕНТИФИКАЦИЯ**

### 7.1 Authentication Flow

```typescript
// JWT Token Structure
interface JwtPayload {
  sub: string; // User ID
  email: string;
  roles: string[];
  permissions: string[];
  facilities: string[]; // Facilities user has access to
  iat: number;
  exp: number;
}

// Keycloak Integration
@Injectable()
export class AuthService {
  constructor(private readonly keycloakService: KeycloakService) {}

  async validateToken(token: string): Promise<JwtPayload> {
    try {
      const decoded = await this.keycloakService.verifyToken(token);
      return {
        sub: decoded.sub,
        email: decoded.email,
        roles: decoded.realm_access?.roles || [],
        permissions: decoded.resource_access?.["gacp-erp"]?.roles || [],
        facilities: decoded.facilities || [],
        iat: decoded.iat,
        exp: decoded.exp,
      };
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }
  }
}

// Role-Based Access Control
@Injectable()
export class AuthorizationService {
  checkPermission(user: JwtPayload, resource: string, action: string): boolean {
    const requiredPermission = `${resource}:${action}`;
    return (
      user.permissions.includes(requiredPermission) ||
      user.roles.includes("admin")
    );
  }

  checkFacilityAccess(user: JwtPayload, facilityId: string): boolean {
    return user.facilities.includes(facilityId) || user.roles.includes("admin");
  }
}

// Authorization Guards
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthorizationService
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const permissions = this.reflector.get<string[]>(
      "permissions",
      context.getHandler()
    );
    if (!permissions) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return permissions.some((permission) => {
      const [resource, action] = permission.split(":");
      return this.authService.checkPermission(user, resource, action);
    });
  }
}

// Usage Example
@Controller("plants")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class PlantsController {
  @Get()
  @Permissions("plants:read")
  async getPlants(@User() user: JwtPayload) {
    // Only users with plants:read permission can access
  }

  @Post()
  @Permissions("plants:write")
  async createPlant(@User() user: JwtPayload, @Body() dto: CreatePlantDto) {
    // Only users with plants:write permission can access
  }
}
```

---

Этот документ представляет собой comprehensive архитектурную основу для GACP-ERP системы. Он включает все ключевые компоненты: модульную структуру, API спецификации, схемы баз данных, event-driven patterns, и интеграции с Mayan-EDMS.

**Следующие шаги**:

1. Использовать эту архитектуру как основу для implementation
2. Детализировать оставшиеся модули (Workforce, Spatial Planning, etc.)
3. Создать Development Roadmap на основе модульных зависимостей
4. Установить Coding Standards и Best Practices

**Ключевые преимущества архитектуры**:

- **Modularity**: Четкое разделение ответственности
- **Scalability**: Microservices + Event-driven design
- **Maintainability**: Domain-driven design + Type safety
- **Compliance**: Audit trail + Event sourcing
- **Integration**: Mayan-EDMS + IoT + 3D visualization
