# Facility Visualization Service v2.0 - Comprehensive Technical Specification

## 1. Service Overview

**Facility Visualization Service v2.0** предоставляет полноценную 3D-визуализацию состояния фермы в реальном времени через XeoKit SDK, интегрируясь с event-driven архитектурой и независимыми потоками метрик для создания цифрового двойника производственного объекта.

### 1.1 Core Responsibilities

1. **XeoKit 3D Rendering Engine**: Browser-based 3D визуализация с поддержкой IFC, glTF, XKT форматов
2. **Multi-Layer Architecture**: Независимые слои Snapshot, Live Metrics, Historical Metrics с полной изоляцией
3. **Frontend Entity System**: Полноценные frontend entities с метаданными, event handlers, Zod validation
4. **Hierarchical Object Compositions**: Поддержка сложных иерархий Rack→Shelf→Tray→Plant с различными размерами
5. **Event-Driven Architecture**: Real-time обновления через Kafka для Snapshot слоя
6. **Independent Metrics Layer**: Отдельный поток данных MQTT→Telegraf→TSDB для live и исторических метрик
7. **Spatial Integration**: Полная интеграция с Spatial Addressing Service для всех уровней объектов
8. **Readonly Interactivity**: Click/hover интерактивность без drag&drop, все изменения через формы
9. **Plant Stage Visualization**: Динамическая визуализация стадий роста растений с цветовой кодировкой

### 1.2 Service Architecture Principles

- **Event-Driven Snapshot Pattern**: Snapshot Service реагирует на Kafka events, frontend получает готовые сцены
- **Layer Independence**: Metrics Layer полностью независим от Snapshot Layer
- **Immutable Geometry Caching**: Стены, стеллажи, оборудование кэшируются как статичная геометрия
- **Differential Updates**: Snapshot передает только изменения, не полную сцену
- **Type Safety End-to-End**: Полная интеграция с Zod contracts и ts-rest

## 2. XeoKit Layer Architecture

### 2.1 Layer Structure

```text
Frontend (Next.js + XeoKit 3D Viewer)
┌─────────────────────────────────────────────┐
│                 XeoKit Scene                │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│ │ Immutable   │ │ Snapshot    │ │ Metrics │ │
│ │ Layer       │ │ Layer       │ │ Layer   │ │
│ │             │ │             │ │         │ │
│ │ • Rooms     │ │ • Plants    │ │ • Live  │ │
│ │ • Racks     │ │ • Trays     │ │ • Hist. │ │
│ │ • Equipment │ │ • Zones     │ │ • Heat  │ │
│ │ • Shelving  │ │ • Alerts    │ │ • Orbs  │ │
│ │             │ │ • Cycle     │ │ • Glyphs│ │
│ └─────────────┘ └─────────────┘ └─────────┘ │
│                                             │
│ Entity Management System                    │
│ • BaseEntity / PlantEntity / RackEntity     │
│ • Metadata binding to backend services     │
│ • Event handlers (click/hover)             │
│ • Zod schema validation                     │
└─────────────────────────────────────────────┘
```

### 2.2 Data Flow Architecture

```text
Data Sources and Flows:

Snapshot Flow (Event-Driven):
[Plans Service] ──┐
[Plants Service] ──┤
[Cycle Service] ───┼──> Kafka Events ──> [Snapshot Service] ──> [Frontend Snapshot Layer]
[Inventory Service] ┘

Metrics Flow (Direct TSDB):
[IoT Sensors] ──> [MQTT] ──> [Telegraf] ──> [TSDB] ──> [Frontend Metrics Layer]

Immutable Geometry:
[Plans Service] ──> [3D Model Storage] ──> [Frontend Cache] ──> [Immutable Layer]
```

## 3. Frontend Entity System

### 3.1 Base Entity Structure

```typescript
interface BaseEntity {
  id: string;
  type: EntityType;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  highlight?: boolean;
  alert?: string;
  metadata?: Record<string, any>;
  onClick?: (entity: BaseEntity) => void;
  onHover?: (entity: BaseEntity) => void;
  visualizationConfig?: VisualizationConfig;
}

enum EntityType {
  PLANT = "plant",
  RACK = "rack",
  TRAY = "tray",
  EQUIPMENT = "equipment",
  ZONE = "zone",
  SENSOR = "sensor",
  CYCLE_ITEM = "cycleItem",
}
```

### 3.2 Hierarchical Entity Compositions

```typescript
// Zod Schemas for Hierarchical Objects
export const PlantSchema = z.object({
  id: z.string(),
  stage: z.enum(["seedling", "vegetative", "flowering", "harvest"]),
  strain: z.string(),
  trayId: z.string(),
  position: z.tuple([z.number(), z.number(), z.number()]),
  healthStatus: z.enum(["healthy", "needs_water", "needs_light", "disease"]),
});

export const TraySchema = z.object({
  id: z.string(),
  rackId: z.string(),
  shelfIndex: z.number(),
  size: z.enum(["small", "medium", "large"]),
  plants: z.array(PlantSchema),
  maxCapacity: z.number(),
});

export const RackSchema = z.object({
  id: z.string(),
  facilityCode: z.string(),
  zoneId: z.string(),
  rackType: z.enum(["1-shelf", "2-shelf", "3-shelf", "custom"]),
  shelves: z.array(
    z.object({
      index: z.number(),
      trays: z.array(TraySchema),
      maxTrays: z.number(),
    })
  ),
});

export const SensorSchema = z.object({
  id: z.string(),
  type: z.enum(["temperature", "humidity", "co2", "light", "ph", "airflow"]),
  position: z.tuple([z.number(), z.number(), z.number()]),
  value: z.number(),
  threshold: z.number().optional(),
  visualization: z.enum(["sphere", "heatmap", "glyph", "bar"]),
  alert: z.boolean().optional(),
});
```

### 3.3 Plant Stage Visualization Mapping

```typescript
const plantStageVisualization = {
  seedling: {
    color: [0, 1, 0], // Bright green
    scale: 0.5, // Small size
    opacity: 1.0,
    geometry: "seedling.xkt",
  },
  vegetative: {
    color: [0, 0.8, 0], // Medium green
    scale: 1.0, // Normal size
    opacity: 1.0,
    geometry: "vegetative.xkt",
  },
  flowering: {
    color: [1, 1, 0], // Yellow
    scale: 1.2, // Larger size
    opacity: 1.0,
    geometry: "flowering.xkt",
  },
  harvest: {
    color: [0.5, 0.5, 0.5], // Gray
    scale: 1.0, // Normal size
    opacity: 0.7, // Semi-transparent
    geometry: "harvest.xkt",
  },
};
```

## 4. Sensor Visualization System

### 4.1 Multi-Modal Sensor Visualization

```typescript
interface SensorVisualizationConfig {
  type: "sphere" | "heatmap" | "glyph" | "bar" | "connection";
  colorMapping: ThresholdColorMapping;
  sizeMapping?: ValueSizeMapping;
  animationConfig?: AnimationConfig;
  overlayConfig?: OverlayConfig;
}

interface ThresholdColorMapping {
  excellent: [number, number, number]; // Green
  good: [number, number, number]; // Yellow
  warning: [number, number, number]; // Orange
  critical: [number, number, number]; // Red
}

// Example configurations by sensor type
const sensorVisualizationConfigs = {
  temperature: {
    type: "heatmap",
    colorMapping: {
      excellent: [0, 0, 1], // Blue (cool)
      good: [0, 1, 0], // Green
      warning: [1, 1, 0], // Yellow
      critical: [1, 0, 0], // Red (hot)
    },
  },
  humidity: {
    type: "sphere",
    colorMapping: {
      excellent: [0, 1, 0],
      good: [0.5, 1, 0],
      warning: [1, 1, 0],
      critical: [1, 0, 0],
    },
    sizeMapping: {
      min: 0.05,
      max: 0.15,
      valueRange: [0, 100],
    },
  },
  co2: {
    type: "glyph",
    colorMapping: {
      excellent: [0, 1, 0],
      good: [0.5, 1, 0],
      warning: [1, 0.5, 0],
      critical: [1, 0, 0],
    },
  },
};
```

### 4.2 Heatmap Generation

```typescript
interface HeatmapConfig {
  interpolationMethod: "linear" | "gaussian" | "inverse_distance";
  gridResolution: number;
  influenceRadius: number;
  blendMode: "overlay" | "multiply" | "screen";
  opacity: number;
}

// Heatmap overlay for temperature sensors
const generateTemperatureHeatmap = (
  sensors: SensorEntity[],
  config: HeatmapConfig
) => {
  // Implementation for interpolating sensor values across surfaces
  // Projected onto floors, walls, or rack surfaces
};
```

## 5. Snapshot Service Integration

### 5.1 JSON Scene Structure

```typescript
interface SceneSnapshot {
  timestamp: string;
  version: string;
  immutableGeometry: {
    rooms: RoomGeometry[];
    racks: RackGeometry[];
    equipment: EquipmentGeometry[];
  };
  dynamicEntities: {
    plants: PlantEntity[];
    trays: TrayEntity[];
    zones: ZoneEntity[];
    alerts: AlertEntity[];
  };
  cycleOverlay?: {
    plannedPlacements: PlannedPlantEntity[];
    futureScenarios: ScenarioEntity[];
  };
}

interface SnapshotDiff {
  timestamp: string;
  changes: {
    added: EntityChange[];
    modified: EntityChange[];
    removed: string[]; // Entity IDs
  };
}
```

### 5.2 Event-Driven Scene Updates

```typescript
// Kafka event consumption pattern
const handleKafkaEvents = {
  "plants.events": (event: PlantEvent) => {
    updatePlantEntity(event.plantId, event.changes);
    triggerVisualizationUpdate("plants");
  },

  "cycle.events": (event: CycleEvent) => {
    updateCycleOverlay(event.cycleId, event.scenario);
    triggerVisualizationUpdate("cycle");
  },

  "environment.events": (event: EnvironmentEvent) => {
    updateZoneConditions(event.zoneId, event.conditions);
    triggerVisualizationUpdate("zones");
  },
};
```

## 6. XeoKit Integration Implementation

### 6.1 Scene Initialization

```typescript
import { Viewer, XKTModel, Node } from "xeokit-sdk";

class FarmVisualizationEngine {
  private viewer: Viewer;
  private entities: Map<string, BaseEntity> = new Map();
  private layers: Map<string, Node> = new Map();

  constructor(canvasId: string) {
    this.viewer = new Viewer({
      canvasId,
      transparent: true,
      antialias: true,
    });

    this.initializeLayers();
    this.setupEventHandlers();
  }

  private initializeLayers() {
    // Immutable layer for geometry that rarely changes
    this.layers.set(
      "immutable",
      this.viewer.scene.root.createChild({
        id: "immutable-layer",
      })
    );

    // Dynamic layer for plants, trays, zones
    this.layers.set(
      "snapshot",
      this.viewer.scene.root.createChild({
        id: "snapshot-layer",
      })
    );

    // Metrics layer for sensor visualization
    this.layers.set(
      "metrics",
      this.viewer.scene.root.createChild({
        id: "metrics-layer",
      })
    );
  }
}
```

### 6.2 Entity Rendering

```typescript
private renderPlantEntity(plant: PlantEntity) {
  const visualConfig = plantStageVisualization[plant.stage];

  const model = new XKTModel(this.viewer.scene, {
    id: plant.id,
    src: visualConfig.geometry,
    parent: this.layers.get('snapshot')
  });

  model.position = plant.position;
  model.scale = [visualConfig.scale, visualConfig.scale, visualConfig.scale];
  model.color = visualConfig.color;
  model.opacity = visualConfig.opacity;
  model.userData = plant; // For event handling

  this.entities.set(plant.id, plant);
}

private renderSensorEntity(sensor: SensorEntity) {
  const config = sensorVisualizationConfigs[sensor.type];

  switch (config.type) {
    case 'sphere':
      this.renderSensorSphere(sensor, config);
      break;
    case 'heatmap':
      this.renderSensorHeatmap(sensor, config);
      break;
    case 'glyph':
      this.renderSensorGlyph(sensor, config);
      break;
  }
}
```

### 6.3 Event Handling System

```typescript
private setupEventHandlers() {
  // Click events
  this.viewer.scene.input.on('click', (hit) => {
    if (hit && hit.entity && hit.entity.userData) {
      const entity = hit.entity.userData as BaseEntity;
      entity.onClick?.(entity);
    }
  });

  // Hover events
  this.viewer.scene.input.on('hover', (hit) => {
    if (hit && hit.entity && hit.entity.userData) {
      const entity = hit.entity.userData as BaseEntity;
      entity.onHover?.(entity);
    }
  });

  // Layer visibility controls
  this.viewer.scene.setLayerVisible = (layerId: string, visible: boolean) => {
    const layer = this.layers.get(layerId);
    if (layer) {
      layer.visible = visible;
    }
  };
}
```

## 7. Data Integration Patterns

### 7.1 Snapshot Updates

```typescript
// WebSocket connection for snapshot updates
const snapshotWebSocket = new WebSocket('wss://api/visualization/snapshot');

snapshotWebSocket.onmessage = (event) => {
  const update: SnapshotDiff = JSON.parse(event.data);

  // Validate with Zod
  const validated = SnapshotDiffSchema.parse(update);

  // Apply differential updates
  this.applySnapshotDiff(validated);
};

private applySnapshotDiff(diff: SnapshotDiff) {
  // Remove deleted entities
  diff.changes.removed.forEach(id => {
    this.removeEntity(id);
  });

  // Update modified entities
  diff.changes.modified.forEach(change => {
    this.updateEntity(change.id, change.data);
  });

  // Add new entities
  diff.changes.added.forEach(addition => {
    this.addEntity(addition.entity);
  });
}
```

### 7.2 Independent Metrics Integration

```typescript
// Separate connection for live metrics
const metricsWebSocket = new WebSocket('wss://api/metrics/live');

metricsWebSocket.onmessage = (event) => {
  const metrics: SensorMetric[] = JSON.parse(event.data);

  // Validate sensor data
  const validatedMetrics = metrics.map(m => SensorSchema.parse(m));

  // Update only metrics layer without affecting snapshot
  this.updateMetricsLayer(validatedMetrics);
};

private updateMetricsLayer(metrics: SensorMetric[]) {
  metrics.forEach(metric => {
    const existingSensor = this.entities.get(metric.id);
    if (existingSensor && existingSensor.type === EntityType.SENSOR) {
      this.updateSensorVisualization(metric);
    } else {
      this.renderSensorEntity(metric);
    }
  });
}
```

## 8. Historical Data Integration

### 8.1 Time-based Scene Reconstruction

```typescript
interface HistoricalSceneRequest {
  timestamp: string;
  includeMetrics: boolean;
  metricsWindow?: {
    start: string;
    end: string;
  };
}

async loadHistoricalScene(request: HistoricalSceneRequest) {
  // Load snapshot for specific timestamp
  const snapshot = await this.snapshotService.getSnapshotAtTime(request.timestamp);

  // Render snapshot layer
  this.renderSnapshot(snapshot);

  if (request.includeMetrics) {
    // Load historical metrics from TSDB
    const metrics = await this.tsdbService.getMetricsForPeriod(
      request.metricsWindow || { start: request.timestamp, end: request.timestamp }
    );

    // Overlay historical metrics
    this.renderHistoricalMetrics(metrics);
  }
}
```

## 9. Performance Optimization

### 9.1 Level of Detail (LOD) System

```typescript
interface LODConfig {
  distanceThresholds: number[];
  geometryVariants: {
    high: string;    // Full detail XKT model
    medium: string;  // Simplified model
    low: string;     // Basic placeholder
  };
}

private applyLOD(entity: BaseEntity, cameraDistance: number) {
  const lodConfig = this.getLODConfig(entity.type);

  if (cameraDistance > lodConfig.distanceThresholds[1]) {
    // Use low detail
    this.updateEntityGeometry(entity, lodConfig.geometryVariants.low);
  } else if (cameraDistance > lodConfig.distanceThresholds[0]) {
    // Use medium detail
    this.updateEntityGeometry(entity, lodConfig.geometryVariants.medium);
  } else {
    // Use high detail
    this.updateEntityGeometry(entity, lodConfig.geometryVariants.high);
  }
}
```

### 9.2 Culling and Batching

```typescript
// Frustum culling for large scenes
private updateVisibility() {
  const frustum = this.viewer.scene.camera.frustum;

  this.entities.forEach((entity, id) => {
    const visible = frustum.intersectsEntity(entity);
    this.setEntityVisible(id, visible);
  });
}

// Geometry instancing for repeated objects (plants, trays)
private createInstancedGeometry(templateId: string, instances: PlantEntity[]) {
  const template = this.getGeometryTemplate(templateId);

  instances.forEach((plant, index) => {
    const instance = template.createInstance({
      id: plant.id,
      position: plant.position,
      rotation: plant.rotation,
      scale: plant.scale
    });

    instance.userData = plant;
  });
}
```

## 10. API Integration Specifications

### 10.1 Snapshot Service API

```typescript
interface SnapshotServiceAPI {
  // Get current scene snapshot
  getCurrentSnapshot(): Promise<SceneSnapshot>;

  // Get historical snapshot
  getSnapshotAtTime(timestamp: string): Promise<SceneSnapshot>;

  // Subscribe to live updates
  subscribeToUpdates(): WebSocket;

  // Get snapshot diff between timestamps
  getSnapshotDiff(from: string, to: string): Promise<SnapshotDiff>;
}
```

### 10.2 Metrics Service API

```typescript
interface MetricsServiceAPI {
  // Get live sensor data
  getLiveSensorData(sensorIds?: string[]): Promise<SensorMetric[]>;

  // Get historical sensor data
  getHistoricalSensorData(
    timeRange: { start: string; end: string },
    sensorIds?: string[]
  ): Promise<SensorMetric[]>;

  // Subscribe to live metrics
  subscribeToLiveMetrics(): WebSocket;

  // Get aggregated metrics for heatmaps
  getAggregatedMetrics(
    type: string,
    aggregation: "avg" | "min" | "max",
    interval: string
  ): Promise<AggregatedMetric[]>;
}
```

## 11. Compliance and Audit Integration

### 11.1 GACP Compliance Visualization

```typescript
interface ComplianceVisualization {
  // Highlight compliance issues by zone
  highlightComplianceIssues(issues: ComplianceIssue[]): void;

  // Show audit trail for selected entities
  showAuditTrail(entityId: string): void;

  // Visualize chain of custody
  visualizeChainOfCustody(productId: string): void;

  // Show environmental compliance status
  showEnvironmentalCompliance(zoneId: string): void;
}
```

### 11.2 Audit Trail Integration

```typescript
interface AuditTrailVisualization {
  timeline: AuditEvent[];
  highlightedEntities: string[];

  // Show who touched what when
  visualizeEntityHistory(entityId: string): void;

  // Show movement patterns
  visualizeMovementHistory(entityId: string): void;

  // Compliance checkpoint visualization
  showComplianceCheckpoints(): void;
}
```

## 12. Security and Access Control

### 12.1 Role-based Layer Visibility

```typescript
interface RoleBasedAccess {
  allowedLayers: string[];
  allowedEntities: string[];
  allowedActions: string[];
}

private enforceAccessControl(userRole: UserRole, action: string, entityId?: string) {
  const permissions = this.getPermissions(userRole);

  if (!permissions.allowedActions.includes(action)) {
    throw new Error('Access denied');
  }

  if (entityId && !permissions.allowedEntities.includes(entityId)) {
    throw new Error('Entity access denied');
  }
}
```

## 13. Error Handling and Resilience

### 13.1 Graceful Degradation

```typescript
class VisualizationErrorHandler {
  private fallbackMode = false;

  handleConnectionLoss() {
    this.fallbackMode = true;
    // Switch to cached data mode
    this.loadCachedSnapshot();
    this.showOfflineIndicator();
  }

  handleSnapshotLoadError(error: Error) {
    // Show placeholder geometry
    this.renderFallbackGeometry();
    this.logError("Snapshot load failed", error);
  }

  handleMetricsLoadError(error: Error) {
    // Continue with snapshot-only view
    this.disableMetricsLayer();
    this.showMetricsUnavailableWarning();
  }
}
```

## 14. Testing Strategy

### 14.1 Unit Testing

```typescript
describe("FarmVisualizationEngine", () => {
  it("should render plant entities with correct stage visualization", () => {
    const plant: PlantEntity = {
      id: "plant-001",
      stage: "flowering",
      position: [1, 0, 1],
    };

    engine.renderPlantEntity(plant);

    const renderedEntity = engine.getEntity("plant-001");
    expect(renderedEntity.color).toEqual([1, 1, 0]); // Yellow for flowering
    expect(renderedEntity.scale).toBe(1.2);
  });

  it("should handle snapshot diffs correctly", () => {
    const diff: SnapshotDiff = {
      timestamp: "2024-01-01T12:00:00Z",
      changes: {
        added: [{ id: "new-plant", entity: newPlantEntity }],
        modified: [{ id: "existing-plant", changes: { stage: "harvest" } }],
        removed: ["old-plant"],
      },
    };

    engine.applySnapshotDiff(diff);

    expect(engine.hasEntity("new-plant")).toBe(true);
    expect(engine.hasEntity("old-plant")).toBe(false);
    expect(engine.getEntity("existing-plant").stage).toBe("harvest");
  });
});
```

### 14.2 Integration Testing

```typescript
describe("XeoKit Integration", () => {
  it("should handle real Kafka events", async () => {
    const mockKafkaEvent = {
      topic: "plants.events",
      payload: { plantId: "plant-001", changes: { stage: "flowering" } },
    };

    await engine.handleKafkaEvent(mockKafkaEvent);

    const plant = engine.getEntity("plant-001");
    expect(plant.stage).toBe("flowering");
    expect(plant.color).toEqual([1, 1, 0]);
  });
});
```

## 15. Deployment and Configuration

### 15.1 Environment Configuration

```typescript
interface VisualizationConfig {
  xeokit: {
    antialias: boolean;
    transparent: boolean;
    gammaCorrection: boolean;
  };

  performance: {
    enableLOD: boolean;
    enableCulling: boolean;
    maxEntities: number;
    updateThrottleMs: number;
  };

  networking: {
    snapshotWebSocketUrl: string;
    metricsWebSocketUrl: string;
    reconnectIntervalMs: number;
    maxReconnectAttempts: number;
  };

  visualization: {
    enableHeatmaps: boolean;
    enableAnimations: boolean;
    defaultSensorVisualization: "sphere" | "heatmap" | "glyph";
  };
}
```

### 15.2 Docker Configuration

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install XeoKit dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build for production
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## 16. Monitoring and Observability

### 16.1 Performance Metrics

```typescript
interface VisualizationMetrics {
  frameRate: number;
  entityCount: number;
  renderTime: number;
  memoryUsage: number;
  snapshotUpdateLatency: number;
  metricsUpdateLatency: number;
}

class VisualizationMonitor {
  private metrics: VisualizationMetrics;

  startMonitoring() {
    setInterval(() => {
      this.collectMetrics();
      this.reportMetrics();
    }, 5000);
  }

  private collectMetrics() {
    this.metrics = {
      frameRate: this.viewer.getFPS(),
      entityCount: this.entities.size,
      renderTime: this.viewer.getLastRenderTime(),
      memoryUsage: performance.memory?.usedJSHeapSize || 0,
      snapshotUpdateLatency: this.getSnapshotLatency(),
      metricsUpdateLatency: this.getMetricsLatency(),
    };
  }
}
```

Эта расширенная спецификация включает все архитектурные инсайты из анализа 3DFrontend.md и готова для полной реализации визуализации фермы с XeoKit SDK.
