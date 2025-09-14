# Facility Visualization Service (FVS) - Техническая спецификация

## 1. Обзор сервиса

### 1.1 Назначение

Facility Visualization Service (FVS) предоставляет 3D-визуализацию фермы в реальном времени с интеграцией данных от систем мониторинга (BMS/SCADA), создавая цифровой двойник производственного объекта для GACP-compliant операций.

### 1.2 Ключевые возможности

- **3D Digital Twin:** Интерактивная 3D-модель всех помещений фермы
- **Real-time Data Integration:** Прямая интеграция с BMS/SCADA системами
- **Spatial Entity Tracking:** Сквозная адресация и отслеживание всех объектов
- **GACP Compliance Dashboard:** Визуализация compliance статуса по зонам
- **Environmental Monitoring:** Визуализация климатических параметров
- **Alert Management:** Система тревог с географической привязкой

## 2. Архитектура сервиса

### 2.1 Компоненты системы

```text
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend 3D   │    │  Visualization  │    │  Data Adapters  │
│   Web Client    │◄──►│    Backend      │◄──►│   (BMS/SCADA)   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Spatial DB    │    │   Time Series   │    │   Event Store   │
│  (PostgreSQL    │    │   Time Series   │    │   Event Store   │
│   + PostGIS)    │    │   Database      │    │    (Kafka)      │
│                 │    │(VictoriaMetrics/│    │                 │
│                 │    │   TSDB)         │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2.2 Технологический стек

**Frontend:**

- **XeoKit:** 3D BIM/CAD визуализация в браузере (WebGL)
- **React + TypeScript:** UI компоненты
- **Socket.io:** Real-time данные
- **Material-UI:** GACP-compliant interface design

**Backend:**

- **Node.js + Express:** API сервер
- **GraphQL:** Flexible data queries
- **Socket.io:** WebSocket server для real-time updates
- **Bull Queue:** Background job processing

**Data Layer:**

- **PostgreSQL + PostGIS:** Spatial data и facility layout
- **VictoriaMetrics:** Time series sensor data
- **Redis:** Caching и session management

## 3. Spatial Entity Addressing System

### 3.1 Универсальная схема адресации

Каждый объект на ферме получает уникальный spatial address:

```text
{FACILITY_CODE}.{ZONE_ID}.{ROOM_ID}.{POSITION_GRID}.{ENTITY_TYPE}.{ENTITY_ID}

Примеры:
- GACP001.PROD.VEG02.A12.PLANT.P240915001
- GACP001.PROD.FLOW1.B05.SENSOR.T240915002
- GACP001.UTIL.HVAC.C01.EQUIP.AHU001
- GACP001.QC.LAB01.D03.INSTR.BAL001
```

### 3.2 Компоненты адреса

- **FACILITY_CODE:** Уникальный код фермы (GACP001)
- **ZONE_ID:** Производственная зона (PROD, QC, STORAGE, UTIL)
- **ROOM_ID:** Идентификатор помещения (VEG01, FLOW1, LAB01)
- **POSITION_GRID:** Сетка координат в помещении (A01-Z99)
- **ENTITY_TYPE:** Тип объекта (PLANT, SENSOR, EQUIP, INSTR)
- **ENTITY_ID:** Уникальный ID объекта

### 3.3 Hierarchical Location Tree

```json
{
  "facility": {
    "code": "GACP001",
    "name": "GACP Production Facility Alpha",
    "zones": [
      {
        "id": "PROD",
        "name": "Production Zone",
        "rooms": [
          {
            "id": "VEG02",
            "name": "Vegetation Room 2",
            "grid": {
              "rows": "A-P",
              "columns": "01-24",
              "cellSize": "1m x 1m"
            },
            "entities": []
          }
        ]
      }
    ]
  }
}
```

## 4. 3D Visualization Features

### 4.1 XeoKit Integration

**XeoKit SDK Capabilities:**

- **BIM/CAD Support:** Загрузка и отображение IFC, 3DXML, glTF моделей фермы
- **Performance Optimization:** Эффективный рендеринг больших CAD моделей
- **Section Planes:** Создание разрезов здания для детального просмотра
- **Measurements:** Инструменты измерения расстояний и площадей
- **Model Navigation:** Продвинутая навигация по 3D модели (orbit, pan, zoom, fly-to)
- **Object Picking:** Интерактивный выбор и выделение объектов
- **Annotations:** Размещение информационных меток на 3D модели

**XeoKit Component Architecture:**

```typescript
interface XeoKitVisualization {
  viewer: Viewer; // Основной 3D viewer
  scene: Scene; // 3D сцена
  models: Map<string, Model>; // Загруженные модели (IFC, glTF)
  plugins: {
    bimViewer: BIMViewerPlugin; // BIM функциональность
    annotations: AnnotationsPlugin; // Аннотации
    section: SectionPlanesPlugin; // Секущие плоскости
    navCube: NavCubePlugin; // Навигационный куб
  };
}

// Интеграция с facility data
interface FacilityModel {
  loadIFCModel(url: string): Promise<Model>;
  addEntityVisualization(entity: FarmEntity): void;
  updateEntityStatus(entityId: string, status: any): void;
  createHeatmapOverlay(data: EnvironmentalReading[]): void;
}
```

### 4.2 Facility Layout Visualization

**3D Floor Plans:**

- Interactive 3D модель всех помещений на основе IFC/CAD файлов
- GACP zone segregation визуализация
- Air flow patterns отображение
- Equipment placement и статус

**Real-time Environment:**

- Temperature heat maps overlaid на BIM модель
- Humidity distribution visualization
- CO₂ level visualization
- VPD (Vapor Pressure Deficit) zones

### 4.3 Entity Visualization

**Plant Tracking:**

- Individual plant positions
- Growth stage indicators
- Health status color coding
- Batch/lot affiliations

**Equipment Status:**

- HVAC system components
- Sensor network visualization
- Alert indicators
- Maintenance schedules

### 4.3 Compliance Dashboard

**GACP Zone Monitoring:**

- Zone segregation compliance
- Access control status
- Environmental parameter compliance
- Documentation completeness

## 5. Data Integration

### 5.1 BMS/SCADA Integration

```typescript
interface BMSDataAdapter {
  // HVAC система
  getHVACStatus(zoneId: string): Promise<HVACStatus>;
  getEnvironmentalData(roomId: string): Promise<EnvironmentalReading[]>;

  // Система контроля доступа
  getAccessEvents(timeRange: TimeRange): Promise<AccessEvent[]>;

  // Тревоги и алерты
  getActiveAlerts(): Promise<Alert[]>;
  subscribeToAlerts(callback: (alert: Alert) => void): void;
}

interface EnvironmentalReading {
  sensorId: string;
  spatialAddress: string;
  timestamp: Date;
  temperature: number;
  humidity: number;
  co2Level?: number;
  vpd?: number;
  location: {
    x: number;
    y: number;
    z: number;
  };
}
```

### 5.2 Real-time Data Flow

```text
BMS/SCADA → Message Queue → Data Adapter → WebSocket → 3D Client
                ↓
         Time Series DB ← Background Processor
                ↓
         Spatial DB ← Location Enrichment
```

### 5.3 Historical Data Visualization

- Time-lapse environmental changes
- Equipment performance trends
- Compliance violations history
- Batch tracking timeline

## 6. API Specification

### 6.1 GraphQL Schema

```graphql
type Facility {
  id: ID!
  code: String!
  name: String!
  zones: [Zone!]!
  spatialBounds: SpatialBounds!
}

type Zone {
  id: ID!
  name: String!
  type: ZoneType!
  rooms: [Room!]!
  complianceStatus: ComplianceStatus!
}

type Room {
  id: ID!
  name: String!
  dimensions: Dimensions!
  grid: PositionGrid!
  entities: [SpatialEntity!]!
  environmentalReadings: [EnvironmentalReading!]!
}

type SpatialEntity {
  spatialAddress: String!
  entityType: EntityType!
  position: Position3D!
  status: EntityStatus!
  metadata: JSON!
}

enum EntityType {
  PLANT
  SENSOR
  EQUIPMENT
  INSTRUMENT
  INVENTORY
}
```

### 6.2 REST Endpoints

```typescript
// Spatial addressing
GET / api / v1 / spatial / entities / { spatialAddress };
POST / api / v1 / spatial / entities;
PUT / api / v1 / spatial / entities / { spatialAddress } / position;

// Real-time data
GET / api / v1 / realtime / environmental / { roomId };
GET / api / v1 / realtime / alerts / active;
POST / api / v1 / realtime / subscribe;

// Visualization data
GET / api / v1 / visualization / facility / model;
GET / api / v1 / visualization / heatmap / { parameter } / { roomId };
GET / api / v1 / visualization / timeline / { entityId };
```

## 7. Performance Requirements

### 7.1 Real-time Performance

- **Data Update Latency:** <2 секунды от BMS до UI
- **3D Rendering:** 60 FPS для smooth navigation
- **Concurrent Users:** До 50 одновременных пользователей
- **Historical Data:** Query response <5 секунд

### 7.2 Data Capacity

- **Sensor Readings:** 10,000+ readings/minute
- **Entity Tracking:** 100,000+ tracked objects
- **Historical Storage:** 3 года данных online
- **Spatial Resolution:** 10cm precision

## 8. Security & Compliance

### 8.1 Access Control

- **Role-based Access Control (RBAC):** По зонам и функциям
- **GACP Audit Trail:** Все действия логируются
- **Data Encryption:** TLS 1.3 for transit, AES-256 at rest
- **Session Management:** JWT with refresh tokens

### 8.2 GACP Compliance Features

- **Zone Segregation Monitoring:** Visual compliance indicators
- **Access Control Integration:** Personnel movement tracking
- **Documentation Links:** SOP и procedure integration
- **Audit Report Generation:** Automated compliance reports

## 9. Integration с GACP-ERP

### 9.1 PLM Integration

```typescript
interface PLMIntegration {
  // Синхронизация данных растений
  syncPlantPositions(batchId: string): Promise<void>;

  // Обновление lifecycle events
  updateLifecycleEvent(plantId: string, event: LifecycleEvent): Promise<void>;

  // Harvest tracking
  trackHarvestMovement(
    plantIds: string[],
    targetLocation: string
  ): Promise<void>;
}
```

### 9.2 Audit Trail Integration

- **Spatial Events:** Все перемещения объектов
- **Access Events:** Entrance/exit по зонам
- **Environmental Events:** Отклонения параметров
- **Compliance Events:** Нарушения GACP requirements

### 9.3 Workflow Integration

- **Task Assignment:** Visual task routing
- **Inspection Workflows:** Interactive checklists
- **Maintenance Scheduling:** Equipment-based workflows

## 10. Deployment Configuration

### 10.1 Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: facility-visualization-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: facility-visualization-service
  template:
    spec:
      containers:
        - name: fvs-backend
          image: gacp/facility-visualization:latest
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: fvs-secrets
                  key: database-url
            - name: INFLUXDB_URL
              valueFrom:
                secretKeyRef:
                  name: fvs-secrets
                  key: influxdb-url
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"
```

### 10.2 Environment Configuration

```env
# Database connections
DATABASE_URL=postgresql://user:pass@postgres:5432/fvs_db
INFLUXDB_URL=http://influxdb:8086
REDIS_URL=redis://redis:6379

# BMS/SCADA Integration
BMS_API_ENDPOINT=https://bms.facility.local/api
SCADA_OPC_ENDPOINT=opc.tcp://scada.facility.local:4840

# Security
JWT_SECRET=<secret-key>
ENCRYPTION_KEY=<encryption-key>

# Performance
MAX_CONCURRENT_USERS=50
CACHE_TTL=300
```

## 11. Monitoring & Observability

### 11.1 Metrics

```typescript
// Application metrics
fvs_active_connections_total;
fvs_api_request_duration_seconds;
fvs_spatial_queries_total;
fvs_3d_render_fps;

// Business metrics
fvs_tracked_entities_total;
fvs_environmental_readings_per_minute;
fvs_compliance_violations_total;
fvs_alert_response_time_seconds;
```

### 11.2 Health Checks

- **BMS/SCADA Connectivity:** Real-time data flow monitoring
- **Database Performance:** Query latency monitoring
- **3D Rendering Performance:** Client-side performance tracking
- **Spatial Data Integrity:** Address validation и consistency

## 12. Testing Strategy

### 12.1 Functional Testing

- **Spatial Address Generation:** Unique address creation
- **3D Visualization:** Rendering accuracy
- **Real-time Updates:** Data synchronization
- **Alert Propagation:** Notification delivery

### 12.2 Performance Testing

- **Load Testing:** 50 concurrent users
- **Stress Testing:** Data ingestion peaks
- **3D Performance:** Frame rate under load
- **Database Performance:** Spatial query optimization

### 12.3 Integration Testing

- **BMS Integration:** Data accuracy
- **GACP-ERP Integration:** Entity synchronization
- **Compliance Testing:** GACP requirement verification

## 13. Acceptance Criteria

### 13.1 Functional Requirements

- [x] 3D visualization всех помещений фермы
- [x] Real-time integration с BMS/SCADA systems
- [x] Spatial addressing для всех объектов
- [x] Environmental data visualization
- [x] GACP compliance monitoring
- [x] Alert management с spatial context

### 13.2 Performance Requirements

- [x] <2s latency для real-time updates
- [x] 60 FPS 3D rendering performance
- [x] Support для 50 concurrent users
- [x] 99.9% uptime availability

### 13.3 Compliance Requirements

- [x] GACP zone segregation visualization
- [x] Access control integration
- [x] Audit trail для всех spatial events
- [x] Documentation integration
- [x] Compliance reporting capabilities

### 13.4 Integration Requirements

- [x] PLM system synchronization
- [x] Audit trail service integration
- [x] BMS/SCADA data consumption
- [x] User authentication integration
- [x] Mobile device compatibility
