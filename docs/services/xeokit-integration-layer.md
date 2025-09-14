# XeoKit Integration Layer - Technical Specification

## 1. Overview

**XeoKit Integration Layer** обеспечивает полную интеграцию между frontend entity system и XeoKit SDK для создания многослойной 3D-визуализации фермы с независимыми потоками данных, event-driven обновлениями и поддержкой исторических данных.

### 1.1 Core Architecture Principles

1. **Multi-Layer Architecture**: Независимые слои для Immutable, Snapshot, Live Metrics, Historical Metrics
2. **Event-Driven Updates**: Kafka интеграция для Snapshot слоя, прямое TSDB подключение для метрик
3. **Independent Data Flows**: Раздельные потоки данных без взаимозависимостей между слоями
4. **Performance Optimization**: LOD, culling, батчинг для больших сцен
5. **Type Safety**: Полная интеграция с Entity System и Zod validation
6. **Historical Overlay**: Возможность наложения исторических данных поверх текущих
7. **Real-time Visualization**: Live обновления метрик и snapshot без блокировки UI

### 1.2 Integration Points

```text
Frontend Entity System ←→ XeoKit Integration Layer ←→ XeoKit SDK
        ↑                           ↑                      ↑
  Zod Validation           Layer Management          3D Rendering
  Event Handlers          Performance Optimization   User Interaction
  Metadata Binding        Visual State Management    Scene Graph
```

## 2. Layer Architecture

### 2.1 Layer Hierarchy

```typescript
enum XeoKitLayer {
  IMMUTABLE = "immutable", // Static geometry: rooms, racks, equipment
  SNAPSHOT = "snapshot", // Dynamic entities: plants, trays, zones, alerts
  LIVE_METRICS = "live_metrics", // Real-time sensor data
  HISTORICAL_METRICS = "historical_metrics", // Historical sensor overlay
  CYCLE_OVERLAY = "cycle_overlay", // Planned cycle visualization
  UI_OVERLAY = "ui_overlay", // UI elements, tooltips, labels
}

interface LayerConfiguration {
  id: XeoKitLayer;
  visible: boolean;
  opacity: number;
  updateFrequency: number; // ms
  dataSource: DataSourceType;
  renderPriority: number;
  cullingEnabled: boolean;
  lodEnabled: boolean;
}

enum DataSourceType {
  STATIC = "static", // Loaded once, rarely updated
  SNAPSHOT_SERVICE = "snapshot_service", // Kafka events → Snapshot Service
  TSDB_LIVE = "tsdb_live", // Direct TSDB connection for live metrics
  TSDB_HISTORICAL = "tsdb_historical", // TSDB queries for historical data
  CYCLE_SERVICE = "cycle_service", // Cycle planning service
}
```

### 2.2 Layer Data Flow Architecture

```text
Data Flow by Layer:

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Immutable Layer │    │ Snapshot Layer  │    │ Metrics Layers  │
│                 │    │                 │    │                 │
│ Source:         │    │ Source:         │    │ Source:         │
│ Plans Service   │    │ Kafka Events    │    │ MQTT → TSDB     │
│ 3D Models       │    │ ↓               │    │ ↓               │
│ Static Geometry │    │ Snapshot Service│    │ Live/Historical │
│                 │    │ ↓               │    │ Metrics         │
│ Update: Rare    │    │ WebSocket/REST  │    │ WebSocket/Query │
│ Caching: Full   │    │ Update: Real-time│   │ Update: 1-5 sec │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                  ┌─────────────────┐
                  │   XeoKit Scene  │
                  │   Integration   │
                  └─────────────────┘
```

## 3. XeoKit Scene Management

### 3.1 Scene Manager

```typescript
import { Viewer, XKTModel, Node, Entity } from "xeokit-sdk";

class XeoKitSceneManager {
  private viewer: Viewer;
  private layers: Map<XeoKitLayer, LayerManager> = new Map();
  private entityModels: Map<string, XKTModel> = new Map();
  private performanceMonitor: PerformanceMonitor;

  constructor(canvasId: string, config: SceneConfiguration) {
    this.viewer = new Viewer({
      canvasId,
      transparent: config.transparent,
      antialias: config.antialias,
      gammaCorrection: config.gammaCorrection,
      webgl2: config.webgl2,
    });

    this.initializeLayers(config.layers);
    this.setupEventHandlers();
    this.performanceMonitor = new PerformanceMonitor(this.viewer);
  }

  private initializeLayers(layerConfigs: LayerConfiguration[]): void {
    layerConfigs.forEach((config) => {
      const layerNode = this.viewer.scene.root.createChild({
        id: config.id,
        visible: config.visible,
        opacity: config.opacity,
      });

      const layerManager = new LayerManager(
        layerNode,
        config,
        this.viewer,
        this.entityModels
      );

      this.layers.set(config.id, layerManager);
    });
  }

  getLayer(layer: XeoKitLayer): LayerManager | undefined {
    return this.layers.get(layer);
  }

  setLayerVisibility(layer: XeoKitLayer, visible: boolean): void {
    const layerManager = this.layers.get(layer);
    if (layerManager) {
      layerManager.setVisibility(visible);
    }
  }

  setLayerOpacity(layer: XeoKitLayer, opacity: number): void {
    const layerManager = this.layers.get(layer);
    if (layerManager) {
      layerManager.setOpacity(opacity);
    }
  }

  // Performance management
  enablePerformanceMode(): void {
    this.layers.forEach((layer) => {
      layer.enableLOD(true);
      layer.enableCulling(true);
      layer.setUpdateFrequency(5000); // Reduce update frequency
    });
  }

  disablePerformanceMode(): void {
    this.layers.forEach((layer) => {
      layer.enableLOD(false);
      layer.enableCulling(false);
      layer.setUpdateFrequency(1000); // Normal update frequency
    });
  }
}

interface SceneConfiguration {
  transparent: boolean;
  antialias: boolean;
  gammaCorrection: boolean;
  webgl2: boolean;
  layers: LayerConfiguration[];
  performance: PerformanceConfiguration;
}
```

### 3.2 Layer Manager

```typescript
class LayerManager {
  private layerNode: Node;
  private config: LayerConfiguration;
  private viewer: Viewer;
  private entityModels: Map<string, XKTModel>;
  private updateTimer?: NodeJS.Timeout;
  private dataSource: DataSource;

  constructor(
    layerNode: Node,
    config: LayerConfiguration,
    viewer: Viewer,
    entityModels: Map<string, XKTModel>
  ) {
    this.layerNode = layerNode;
    this.config = config;
    this.viewer = viewer;
    this.entityModels = entityModels;

    this.dataSource = this.createDataSource(config.dataSource);
    this.startUpdateCycle();
  }

  private createDataSource(type: DataSourceType): DataSource {
    switch (type) {
      case DataSourceType.SNAPSHOT_SERVICE:
        return new SnapshotDataSource();
      case DataSourceType.TSDB_LIVE:
        return new LiveMetricsDataSource();
      case DataSourceType.TSDB_HISTORICAL:
        return new HistoricalMetricsDataSource();
      case DataSourceType.STATIC:
        return new StaticDataSource();
      default:
        throw new Error(`Unknown data source type: ${type}`);
    }
  }

  private startUpdateCycle(): void {
    if (this.config.updateFrequency > 0) {
      this.updateTimer = setInterval(() => {
        this.updateLayer();
      }, this.config.updateFrequency);
    }
  }

  private async updateLayer(): Promise<void> {
    try {
      const data = await this.dataSource.fetchData();
      this.renderLayerData(data);
    } catch (error) {
      console.error(`Failed to update layer ${this.config.id}:`, error);
    }
  }

  private renderLayerData(data: LayerData): void {
    switch (this.config.id) {
      case XeoKitLayer.IMMUTABLE:
        this.renderImmutableLayer(data as ImmutableLayerData);
        break;
      case XeoKitLayer.SNAPSHOT:
        this.renderSnapshotLayer(data as SnapshotLayerData);
        break;
      case XeoKitLayer.LIVE_METRICS:
        this.renderLiveMetricsLayer(data as LiveMetricsData);
        break;
      case XeoKitLayer.HISTORICAL_METRICS:
        this.renderHistoricalMetricsLayer(data as HistoricalMetricsData);
        break;
    }
  }

  setVisibility(visible: boolean): void {
    this.layerNode.visible = visible;
    this.config.visible = visible;
  }

  setOpacity(opacity: number): void {
    this.layerNode.opacity = opacity;
    this.config.opacity = opacity;
  }

  enableLOD(enabled: boolean): void {
    this.config.lodEnabled = enabled;
    // Update existing models with LOD settings
    this.entityModels.forEach((model, id) => {
      if (model.parent === this.layerNode) {
        this.applyLOD(model, enabled);
      }
    });
  }
}
```

## 4. Data Source Integration

### 4.1 Snapshot Data Source (Kafka Events)

```typescript
class SnapshotDataSource implements DataSource {
  private webSocket: WebSocket;
  private lastSnapshot: SnapshotLayerData | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.connect();
  }

  private connect(): void {
    this.webSocket = new WebSocket("wss://api/visualization/snapshot");

    this.webSocket.onopen = () => {
      console.log("Snapshot WebSocket connected");
      this.reconnectAttempts = 0;
    };

    this.webSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const validated = SnapshotDiffSchema.parse(data);
        this.processSnapshotDiff(validated);
      } catch (error) {
        console.error("Failed to process snapshot data:", error);
      }
    };

    this.webSocket.onerror = (error) => {
      console.error("Snapshot WebSocket error:", error);
    };

    this.webSocket.onclose = () => {
      console.log("Snapshot WebSocket closed");
      this.attemptReconnect();
    };
  }

  private processSnapshotDiff(diff: SnapshotDiff): void {
    if (!this.lastSnapshot) {
      // Initial snapshot load
      this.loadInitialSnapshot();
      return;
    }

    // Apply differential update
    this.applySnapshotDiff(diff);
  }

  private applySnapshotDiff(diff: SnapshotDiff): void {
    // Remove deleted entities
    diff.changes.removed.forEach((entityId) => {
      this.removeEntityFromSnapshot(entityId);
    });

    // Update modified entities
    diff.changes.modified.forEach((change) => {
      this.updateEntityInSnapshot(change);
    });

    // Add new entities
    diff.changes.added.forEach((addition) => {
      this.addEntityToSnapshot(addition);
    });

    this.lastSnapshot!.timestamp = diff.timestamp;
  }

  async fetchData(): Promise<SnapshotLayerData> {
    if (!this.lastSnapshot) {
      // Initial load
      return await this.loadInitialSnapshot();
    }

    return this.lastSnapshot;
  }

  private async loadInitialSnapshot(): Promise<SnapshotLayerData> {
    const response = await fetch("/api/visualization/snapshot/current");
    const data = await response.json();
    const validated = SnapshotLayerDataSchema.parse(data);

    this.lastSnapshot = validated;
    return validated;
  }
}

// Zod schemas for validation
const SnapshotDiffSchema = z.object({
  timestamp: z.string(),
  changes: z.object({
    added: z.array(
      z.object({
        entity: z.any(), // BaseEntity schema
        layer: z.string(),
      })
    ),
    modified: z.array(
      z.object({
        id: z.string(),
        changes: z.record(z.any()),
      })
    ),
    removed: z.array(z.string()),
  }),
});

const SnapshotLayerDataSchema = z.object({
  timestamp: z.string(),
  entities: z.object({
    plants: z.array(PlantEntitySchema),
    racks: z.array(RackEntitySchema),
    trays: z.array(TrayEntitySchema),
    zones: z.array(ZoneEntitySchema),
    equipment: z.array(EquipmentEntitySchema),
    alerts: z.array(z.any()), // AlertEntity schema
  }),
});
```

### 4.2 Live Metrics Data Source (TSDB)

```typescript
class LiveMetricsDataSource implements DataSource {
  private webSocket: WebSocket;
  private currentMetrics: Map<string, SensorMetric> = new Map();
  private subscriptions: Set<string> = new Set();

  constructor() {
    this.connect();
  }

  private connect(): void {
    this.webSocket = new WebSocket("wss://api/metrics/live");

    this.webSocket.onmessage = (event) => {
      try {
        const metrics: SensorMetric[] = JSON.parse(event.data);
        const validatedMetrics = metrics.map((m) =>
          SensorMetricSchema.parse(m)
        );

        validatedMetrics.forEach((metric) => {
          this.currentMetrics.set(metric.id, metric);
        });
      } catch (error) {
        console.error("Failed to process live metrics:", error);
      }
    };
  }

  async fetchData(): Promise<LiveMetricsData> {
    return {
      timestamp: new Date().toISOString(),
      metrics: Array.from(this.currentMetrics.values()),
      subscriptions: Array.from(this.subscriptions),
    };
  }

  subscribeTo(sensorIds: string[]): void {
    sensorIds.forEach((id) => this.subscriptions.add(id));

    // Send subscription message
    if (this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.send(
        JSON.stringify({
          action: "subscribe",
          sensorIds: Array.from(this.subscriptions),
        })
      );
    }
  }

  unsubscribeFrom(sensorIds: string[]): void {
    sensorIds.forEach((id) => this.subscriptions.delete(id));

    if (this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.send(
        JSON.stringify({
          action: "unsubscribe",
          sensorIds,
        })
      );
    }
  }
}

const SensorMetricSchema = z.object({
  id: z.string(),
  type: z.enum(["temperature", "humidity", "co2", "light", "ph", "airflow"]),
  value: z.number(),
  unit: z.string(),
  timestamp: z.string(),
  position: z.tuple([z.number(), z.number(), z.number()]),
  quality: z.enum(["excellent", "good", "fair", "poor"]),
  threshold: z.enum(["normal", "warning", "critical"]),
});

interface LiveMetricsData {
  timestamp: string;
  metrics: SensorMetric[];
  subscriptions: string[];
}
```

### 4.3 Historical Metrics Data Source

```typescript
class HistoricalMetricsDataSource implements DataSource {
  private timeRange: TimeRange | null = null;
  private sensorIds: string[] = [];

  setTimeRange(range: TimeRange): void {
    this.timeRange = range;
  }

  setSensorIds(ids: string[]): void {
    this.sensorIds = ids;
  }

  async fetchData(): Promise<HistoricalMetricsData> {
    if (!this.timeRange) {
      return { timestamp: new Date().toISOString(), metrics: [] };
    }

    const response = await fetch("/api/metrics/historical", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timeRange: this.timeRange,
        sensorIds: this.sensorIds,
        aggregation: "avg",
        interval: "1m",
      }),
    });

    const data = await response.json();
    const validated = HistoricalMetricsDataSchema.parse(data);

    return validated;
  }
}

interface TimeRange {
  start: string;
  end: string;
}

const HistoricalMetricsDataSchema = z.object({
  timestamp: z.string(),
  metrics: z.array(
    z.object({
      sensorId: z.string(),
      values: z.array(
        z.object({
          timestamp: z.string(),
          value: z.number(),
        })
      ),
    })
  ),
});
```

## 5. Entity Rendering System

### 5.1 Entity Renderer Factory

```typescript
class EntityRendererFactory {
  static createRenderer(
    entityType: EntityType,
    viewer: Viewer
  ): EntityRenderer {
    switch (entityType) {
      case EntityType.PLANT:
        return new PlantRenderer(viewer);
      case EntityType.RACK:
        return new RackRenderer(viewer);
      case EntityType.TRAY:
        return new TrayRenderer(viewer);
      case EntityType.EQUIPMENT:
        return new EquipmentRenderer(viewer);
      case EntityType.SENSOR:
        return new SensorRenderer(viewer);
      case EntityType.ZONE:
        return new ZoneRenderer(viewer);
      default:
        return new DefaultEntityRenderer(viewer);
    }
  }
}

abstract class EntityRenderer {
  protected viewer: Viewer;

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  abstract render(entity: BaseEntity, parent: Node): XKTModel;
  abstract update(model: XKTModel, entity: BaseEntity): void;
  abstract remove(model: XKTModel): void;
}
```

### 5.2 Plant Renderer

```typescript
class PlantRenderer extends EntityRenderer {
  private plantVisualConfigs = new Map<PlantStage, PlantVisualConfig>();

  constructor(viewer: Viewer) {
    super(viewer);
    this.initializeVisualConfigs();
  }

  render(entity: BaseEntity, parent: Node): XKTModel {
    const plant = entity as PlantEntity;
    const visualConfig = this.plantVisualConfigs.get(plant.growthStage);

    if (!visualConfig) {
      throw new Error(`No visual config for plant stage: ${plant.growthStage}`);
    }

    const model = new XKTModel(this.viewer.scene, {
      id: plant.id,
      src: visualConfig.geometry,
      parent: parent,
    });

    // Apply basic properties
    model.position = plant.position;
    model.scale = [visualConfig.scale, visualConfig.scale, visualConfig.scale];
    model.color = visualConfig.baseColor;
    model.userData = plant;

    // Apply stage-specific effects
    this.applyStageEffects(model, plant, visualConfig);

    // Apply health status effects
    this.applyHealthEffects(model, plant);

    return model;
  }

  update(model: XKTModel, entity: BaseEntity): void {
    const plant = entity as PlantEntity;
    const visualConfig = this.plantVisualConfigs.get(plant.growthStage);

    if (!visualConfig) return;

    // Update position
    model.position = plant.position;

    // Update visual properties if stage changed
    const currentStage = (model.userData as PlantEntity)?.growthStage;
    if (currentStage !== plant.growthStage) {
      this.animateStageTransition(model, currentStage, plant.growthStage);
    }

    // Update health effects
    this.applyHealthEffects(model, plant);

    // Update highlight state
    if (plant.highlight?.enabled) {
      model.highlighted = true;
      model.highlightColor = plant.highlight.color;
    } else {
      model.highlighted = false;
    }

    // Update user data
    model.userData = plant;
  }

  private applyStageEffects(
    model: XKTModel,
    plant: PlantEntity,
    config: PlantVisualConfig
  ): void {
    if (config.glowEffect) {
      model.highlighted = true;
      model.highlightColor = config.highlightColor;
    }

    // Apply stage-specific materials
    if (config.material) {
      model.material = this.viewer.scene.materials[config.material];
    }
  }

  private applyHealthEffects(model: XKTModel, plant: PlantEntity): void {
    const healthEffects = {
      [HealthStatus.HEALTHY]: { opacity: 1.0, glow: false },
      [HealthStatus.NEEDS_WATER]: {
        opacity: 0.8,
        glow: true,
        glowColor: [0, 0, 1],
      },
      [HealthStatus.NEEDS_NUTRIENTS]: {
        opacity: 0.8,
        glow: true,
        glowColor: [1, 1, 0],
      },
      [HealthStatus.PEST_ISSUE]: {
        opacity: 0.7,
        glow: true,
        glowColor: [1, 0.5, 0],
      },
      [HealthStatus.DISEASE]: {
        opacity: 0.6,
        glow: true,
        glowColor: [1, 0, 0],
      },
      [HealthStatus.STRESSED]: {
        opacity: 0.9,
        glow: true,
        glowColor: [0.5, 0.5, 0.5],
      },
    };

    const effect = healthEffects[plant.healthStatus];
    model.opacity = effect.opacity;

    if (effect.glow && effect.glowColor) {
      model.highlighted = true;
      model.highlightColor = effect.glowColor as Vector3;
    }
  }

  private animateStageTransition(
    model: XKTModel,
    fromStage: PlantStage,
    toStage: PlantStage
  ): void {
    const fromConfig = this.plantVisualConfigs.get(fromStage);
    const toConfig = this.plantVisualConfigs.get(toStage);

    if (!fromConfig || !toConfig) return;

    // Animate scale transition
    this.animateScale(model, fromConfig.scale, toConfig.scale, 2000);

    // Animate color transition
    this.animateColor(model, fromConfig.baseColor, toConfig.baseColor, 2000);

    // Update geometry if different
    if (fromConfig.geometry !== toConfig.geometry) {
      setTimeout(() => {
        model.src = toConfig.geometry;
      }, 1000); // Change geometry mid-transition
    }
  }

  private animateScale(
    model: XKTModel,
    fromScale: number,
    toScale: number,
    duration: number
  ): void {
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const currentScale =
        fromScale + (toScale - fromScale) * this.easeInOut(progress);
      model.scale = [currentScale, currentScale, currentScale];

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
  }
}
```

### 5.3 Sensor Renderer

```typescript
class SensorRenderer extends EntityRenderer {
  render(entity: BaseEntity, parent: Node): XKTModel {
    const sensor = entity as SensorEntity;

    switch (sensor.visualization.displayType) {
      case SensorDisplayType.SPHERE:
        return this.renderSphere(sensor, parent);
      case SensorDisplayType.GLYPH:
        return this.renderGlyph(sensor, parent);
      case SensorDisplayType.BAR:
        return this.renderBar(sensor, parent);
      case SensorDisplayType.HEATMAP:
        return this.renderHeatmapProjection(sensor, parent);
      default:
        return this.renderSphere(sensor, parent);
    }
  }

  private renderSphere(sensor: SensorEntity, parent: Node): XKTModel {
    const sphere = this.viewer.scene.createMesh({
      id: sensor.id,
      parent: parent,
      primitive: "sphere",
      position: sensor.position,
      radius: this.calculateSensorRadius(sensor),
      color: this.getSensorColor(sensor),
      opacity: this.getSensorOpacity(sensor),
    });

    sphere.userData = sensor;
    return sphere as XKTModel;
  }

  private renderGlyph(sensor: SensorEntity, parent: Node): XKTModel {
    // Create custom glyph geometry based on sensor type
    const glyphGeometry = this.createSensorGlyph(sensor.sensorData.sensorType);

    const glyph = new XKTModel(this.viewer.scene, {
      id: sensor.id,
      src: glyphGeometry,
      parent: parent,
    });

    glyph.position = sensor.position;
    glyph.color = this.getSensorColor(sensor);
    glyph.scale = this.calculateGlyphScale(sensor);
    glyph.userData = sensor;

    return glyph;
  }

  private renderBar(sensor: SensorEntity, parent: Node): XKTModel {
    const barHeight = this.calculateBarHeight(sensor);

    const bar = this.viewer.scene.createMesh({
      id: sensor.id,
      parent: parent,
      primitive: "box",
      position: [
        sensor.position[0],
        sensor.position[1] + barHeight / 2,
        sensor.position[2],
      ],
      size: [0.1, barHeight, 0.1],
      color: this.getSensorColor(sensor),
    });

    bar.userData = sensor;
    return bar as XKTModel;
  }

  private calculateSensorRadius(sensor: SensorEntity): number {
    const baseRadius = 0.05;
    const maxRadius = 0.2;

    // Scale radius based on sensor value relative to range
    const normalizedValue = this.normalizeSensorValue(sensor);
    return baseRadius + (maxRadius - baseRadius) * normalizedValue;
  }

  private getSensorColor(sensor: SensorEntity): Vector3 {
    const threshold = sensor.currentReading.threshold;
    const colorMapping = sensor.visualization.colorMapping;

    switch (threshold) {
      case ThresholdStatus.NORMAL:
        return colorMapping.normal || [0, 1, 0];
      case ThresholdStatus.WARNING:
        return colorMapping.warning || [1, 1, 0];
      case ThresholdStatus.CRITICAL:
        return colorMapping.critical || [1, 0, 0];
      default:
        return [0.5, 0.5, 0.5];
    }
  }

  private normalizeSensorValue(sensor: SensorEntity): number {
    // Normalize sensor value to 0-1 range based on expected range
    const sensorRanges = {
      [SensorType.TEMPERATURE]: { min: 15, max: 35 },
      [SensorType.HUMIDITY]: { min: 0, max: 100 },
      [SensorType.CO2]: { min: 300, max: 1500 },
      [SensorType.LIGHT_PAR]: { min: 0, max: 2000 },
      [SensorType.PH]: { min: 4, max: 8 },
    };

    const range = sensorRanges[sensor.sensorData.sensorType];
    if (!range) return 0.5;

    const normalized =
      (sensor.currentReading.value - range.min) / (range.max - range.min);
    return Math.max(0, Math.min(1, normalized));
  }

  update(model: XKTModel, entity: BaseEntity): void {
    const sensor = entity as SensorEntity;

    // Update color based on current reading
    model.color = this.getSensorColor(sensor);

    // Update size for sphere/bar types
    if (sensor.visualization.displayType === SensorDisplayType.SPHERE) {
      const mesh = model as any; // Type assertion for mesh properties
      mesh.radius = this.calculateSensorRadius(sensor);
    } else if (sensor.visualization.displayType === SensorDisplayType.BAR) {
      const barHeight = this.calculateBarHeight(sensor);
      model.position = [
        sensor.position[0],
        sensor.position[1] + barHeight / 2,
        sensor.position[2],
      ];
      (model as any).size = [0.1, barHeight, 0.1];
    }

    // Update user data
    model.userData = sensor;
  }
}
```

## 6. Heatmap Visualization System

### 6.1 Heatmap Generator

```typescript
class HeatmapGenerator {
  private viewer: Viewer;
  private heatmapTextures: Map<string, Texture> = new Map();

  constructor(viewer: Viewer) {
    this.viewer = viewer;
  }

  generateTemperatureHeatmap(
    sensors: SensorEntity[],
    area: BoundingBox
  ): HeatmapData {
    const gridResolution = 50; // 50x50 grid
    const heatmapGrid = this.createInterpolatedGrid(
      sensors,
      area,
      gridResolution
    );

    return {
      id: `temp_heatmap_${Date.now()}`,
      type: SensorType.TEMPERATURE,
      grid: heatmapGrid,
      area: area,
      resolution: gridResolution,
      colorScale: this.getTemperatureColorScale(),
    };
  }

  private createInterpolatedGrid(
    sensors: SensorEntity[],
    area: BoundingBox,
    resolution: number
  ): HeatmapGrid {
    const grid: number[][] = [];
    const stepX = (area.max[0] - area.min[0]) / resolution;
    const stepZ = (area.max[2] - area.min[2]) / resolution;

    for (let i = 0; i < resolution; i++) {
      grid[i] = [];
      for (let j = 0; j < resolution; j++) {
        const x = area.min[0] + i * stepX;
        const z = area.min[2] + j * stepZ;

        const interpolatedValue = this.interpolateValue(sensors, [x, 0, z]);
        grid[i][j] = interpolatedValue;
      }
    }

    return {
      values: grid,
      width: resolution,
      height: resolution,
    };
  }

  private interpolateValue(sensors: SensorEntity[], position: Vector3): number {
    let weightedSum = 0;
    let totalWeight = 0;

    sensors.forEach((sensor) => {
      const distance = this.calculateDistance(sensor.position, position);
      const weight = 1 / (1 + distance); // Inverse distance weighting

      weightedSum += sensor.currentReading.value * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  renderHeatmapOverlay(heatmapData: HeatmapData, targetSurface: Node): void {
    const texture = this.createHeatmapTexture(heatmapData);

    // Create overlay plane
    const overlay = this.viewer.scene.createMesh({
      id: heatmapData.id,
      parent: targetSurface,
      primitive: "plane",
      position: [
        (heatmapData.area.min[0] + heatmapData.area.max[0]) / 2,
        0.01, // Slightly above the surface
        (heatmapData.area.min[2] + heatmapData.area.max[2]) / 2,
      ],
      size: [
        heatmapData.area.max[0] - heatmapData.area.min[0],
        heatmapData.area.max[2] - heatmapData.area.min[2],
      ],
      opacity: 0.6,
      texture: texture,
    });

    this.heatmapTextures.set(heatmapData.id, texture);
  }

  private createHeatmapTexture(heatmapData: HeatmapData): Texture {
    const canvas = document.createElement("canvas");
    canvas.width = heatmapData.resolution;
    canvas.height = heatmapData.resolution;

    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.createImageData(canvas.width, canvas.height);

    // Convert grid values to colors
    for (let i = 0; i < heatmapData.grid.width; i++) {
      for (let j = 0; j < heatmapData.grid.height; j++) {
        const value = heatmapData.grid.values[i][j];
        const color = this.valueToColor(value, heatmapData.colorScale);

        const pixelIndex = (j * canvas.width + i) * 4;
        imageData.data[pixelIndex] = color.r;
        imageData.data[pixelIndex + 1] = color.g;
        imageData.data[pixelIndex + 2] = color.b;
        imageData.data[pixelIndex + 3] = color.a;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    return this.viewer.scene.createTexture({
      id: `texture_${heatmapData.id}`,
      image: canvas,
    });
  }

  updateHeatmap(heatmapId: string, sensors: SensorEntity[]): void {
    const existingTexture = this.heatmapTextures.get(heatmapId);
    if (!existingTexture) return;

    // Regenerate heatmap data and update texture
    // Implementation similar to generateTemperatureHeatmap
  }
}

interface HeatmapData {
  id: string;
  type: SensorType;
  grid: HeatmapGrid;
  area: BoundingBox;
  resolution: number;
  colorScale: ColorScale;
}

interface HeatmapGrid {
  values: number[][];
  width: number;
  height: number;
}

interface ColorScale {
  min: { r: number; g: number; b: number; a: number };
  max: { r: number; g: number; b: number; a: number };
  steps: ColorStep[];
}
```

## 7. Performance Optimization

### 7.1 Level of Detail (LOD) System

```typescript
class LODManager {
  private viewer: Viewer;
  private lodConfigs: Map<EntityType, LODConfiguration> = new Map();
  private entityDistances: Map<string, number> = new Map();

  constructor(viewer: Viewer) {
    this.viewer = viewer;
    this.initializeLODConfigs();
    this.startDistanceTracking();
  }

  private initializeLODConfigs(): void {
    this.lodConfigs.set(EntityType.PLANT, {
      thresholds: [10, 50, 200], // meters
      geometries: [
        "plant_high_detail.xkt",
        "plant_medium_detail.xkt",
        "plant_low_detail.xkt",
        "plant_placeholder.xkt",
      ],
      materials: [
        "plant_high_material",
        "plant_medium_material",
        "plant_low_material",
        "plant_placeholder_material",
      ],
    });

    this.lodConfigs.set(EntityType.RACK, {
      thresholds: [20, 100, 500],
      geometries: [
        "rack_detailed.xkt",
        "rack_simplified.xkt",
        "rack_basic.xkt",
        "rack_box.xkt",
      ],
    });
  }

  updateEntityLOD(entityId: string, model: XKTModel): void {
    const entity = model.userData as BaseEntity;
    if (!entity) return;

    const lodConfig = this.lodConfigs.get(entity.type);
    if (!lodConfig) return;

    const distance = this.entityDistances.get(entityId);
    if (distance === undefined) return;

    const lodLevel = this.calculateLODLevel(distance, lodConfig.thresholds);
    this.applyLOD(model, lodConfig, lodLevel);
  }

  private calculateLODLevel(distance: number, thresholds: number[]): number {
    for (let i = 0; i < thresholds.length; i++) {
      if (distance <= thresholds[i]) {
        return i;
      }
    }
    return thresholds.length; // Lowest detail level
  }

  private applyLOD(
    model: XKTModel,
    config: LODConfiguration,
    level: number
  ): void {
    if (level < config.geometries.length) {
      model.src = config.geometries[level];
    }

    if (config.materials && level < config.materials.length) {
      model.material = this.viewer.scene.materials[config.materials[level]];
    }
  }

  private startDistanceTracking(): void {
    setInterval(() => {
      this.updateAllDistances();
    }, 1000); // Update distances every second
  }

  private updateAllDistances(): void {
    const cameraPosition = this.viewer.scene.camera.eye;

    this.viewer.scene.models.forEach((model) => {
      if (model.userData) {
        const distance = this.calculateDistance(cameraPosition, model.position);
        this.entityDistances.set(model.id, distance);
        this.updateEntityLOD(model.id, model);
      }
    });
  }
}

interface LODConfiguration {
  thresholds: number[];
  geometries: string[];
  materials?: string[];
}
```

### 7.2 Culling System

```typescript
class CullingManager {
  private viewer: Viewer;
  private cullingSphere: BoundingSphere;
  private culledEntities: Set<string> = new Set();

  constructor(viewer: Viewer) {
    this.viewer = viewer;
    this.cullingSphere = { center: [0, 0, 0], radius: 1000 };
    this.startCullingCycle();
  }

  private startCullingCycle(): void {
    setInterval(() => {
      this.performCulling();
    }, 2000); // Cull every 2 seconds
  }

  private performCulling(): void {
    const frustum = this.viewer.scene.camera.frustum;
    const cameraPosition = this.viewer.scene.camera.eye;

    this.viewer.scene.models.forEach((model) => {
      const entity = model.userData as BaseEntity;
      if (!entity) return;

      const shouldCull = this.shouldCullEntity(model, frustum, cameraPosition);

      if (shouldCull && !this.culledEntities.has(model.id)) {
        this.cullEntity(model);
      } else if (!shouldCull && this.culledEntities.has(model.id)) {
        this.unCullEntity(model);
      }
    });
  }

  private shouldCullEntity(
    model: XKTModel,
    frustum: any,
    cameraPosition: Vector3
  ): boolean {
    // Distance culling
    const distance = this.calculateDistance(cameraPosition, model.position);
    if (distance > this.cullingSphere.radius) {
      return true;
    }

    // Frustum culling
    if (!frustum.intersectsPoint(model.position)) {
      return true;
    }

    // Occlusion culling (simplified)
    if (this.isOccluded(model, cameraPosition)) {
      return true;
    }

    return false;
  }

  private cullEntity(model: XKTModel): void {
    model.visible = false;
    this.culledEntities.add(model.id);
  }

  private unCullEntity(model: XKTModel): void {
    model.visible = true;
    this.culledEntities.delete(model.id);
  }
}
```

## 8. Event Integration

### 8.1 XeoKit Event Bridge

```typescript
class XeoKitEventBridge {
  private viewer: Viewer;
  private entityManager: EntityManager;
  private eventHandlers: EntityEventHandlers;

  constructor(
    viewer: Viewer,
    entityManager: EntityManager,
    eventHandlers: EntityEventHandlers
  ) {
    this.viewer = viewer;
    this.entityManager = entityManager;
    this.eventHandlers = eventHandlers;

    this.setupXeoKitEventHandlers();
  }

  private setupXeoKitEventHandlers(): void {
    // Click events
    this.viewer.scene.input.on("click", (hit) => {
      if (hit && hit.entity && hit.entity.userData) {
        const entity = hit.entity.userData as BaseEntity;
        const clickEvent: ClickEvent = {
          screenPosition: [hit.canvasPos[0], hit.canvasPos[1]],
          worldPosition: hit.worldPos,
          button: "left",
          entity: entity,
          model: hit.entity,
        };

        entity.onClick?.(entity, clickEvent);
      }
    });

    // Hover events
    this.viewer.scene.input.on("hover", (hit) => {
      if (hit && hit.entity && hit.entity.userData) {
        const entity = hit.entity.userData as BaseEntity;
        const hoverEvent: HoverEvent = {
          screenPosition: [hit.canvasPos[0], hit.canvasPos[1]],
          worldPosition: hit.worldPos,
          entity: entity,
          model: hit.entity,
        };

        entity.onHover?.(entity, hoverEvent);
      }
    });

    // Context menu events
    this.viewer.scene.input.on("rightclick", (hit) => {
      if (hit && hit.entity && hit.entity.userData) {
        const entity = hit.entity.userData as BaseEntity;
        const contextEvent: ContextEvent = {
          screenPosition: [hit.canvasPos[0], hit.canvasPos[1]],
          worldPosition: hit.worldPos,
          entity: entity,
          model: hit.entity,
        };

        entity.onContextMenu?.(entity, contextEvent);
      }
    });

    // Camera events for performance optimization
    this.viewer.scene.camera.on("viewMatrix", () => {
      this.onCameraMove();
    });
  }

  private onCameraMove(): void {
    // Trigger LOD and culling updates
    // This is handled by the respective managers
  }
}

interface ClickEvent {
  screenPosition: [number, number];
  worldPosition: Vector3;
  button: "left" | "right" | "middle";
  entity: BaseEntity;
  model: XKTModel;
}

interface HoverEvent {
  screenPosition: [number, number];
  worldPosition: Vector3;
  entity: BaseEntity;
  model: XKTModel;
}

interface ContextEvent {
  screenPosition: [number, number];
  worldPosition: Vector3;
  entity: BaseEntity;
  model: XKTModel;
}
```

## 9. Testing Framework

### 9.1 XeoKit Integration Tests

```typescript
describe("XeoKit Integration Layer", () => {
  let sceneManager: XeoKitSceneManager;
  let mockViewer: jest.Mocked<Viewer>;
  let entityManager: EntityManager;

  beforeEach(() => {
    mockViewer = createMockViewer();
    entityManager = new EntityManager();

    const config: SceneConfiguration = {
      transparent: true,
      antialias: true,
      gammaCorrection: true,
      webgl2: true,
      layers: [
        {
          id: XeoKitLayer.SNAPSHOT,
          visible: true,
          opacity: 1.0,
          updateFrequency: 1000,
          dataSource: DataSourceType.SNAPSHOT_SERVICE,
          renderPriority: 1,
          cullingEnabled: true,
          lodEnabled: true,
        },
      ],
      performance: {
        enableLOD: true,
        enableCulling: true,
        maxEntities: 10000,
      },
    };

    sceneManager = new XeoKitSceneManager("test-canvas", config);
  });

  describe("Layer Management", () => {
    it("should initialize all configured layers", () => {
      const snapshotLayer = sceneManager.getLayer(XeoKitLayer.SNAPSHOT);
      expect(snapshotLayer).toBeDefined();
      expect(snapshotLayer?.getVisibility()).toBe(true);
    });

    it("should update layer visibility", () => {
      sceneManager.setLayerVisibility(XeoKitLayer.SNAPSHOT, false);

      const layer = sceneManager.getLayer(XeoKitLayer.SNAPSHOT);
      expect(layer?.getVisibility()).toBe(false);
    });

    it("should handle layer opacity changes", () => {
      sceneManager.setLayerOpacity(XeoKitLayer.SNAPSHOT, 0.5);

      const layer = sceneManager.getLayer(XeoKitLayer.SNAPSHOT);
      expect(layer?.getOpacity()).toBe(0.5);
    });
  });

  describe("Entity Rendering", () => {
    it("should render plant entity with correct stage visualization", () => {
      const plant: PlantEntity = createTestPlantEntity({
        growthStage: PlantStage.FLOWERING,
      });

      const renderer = new PlantRenderer(mockViewer);
      const model = renderer.render(plant, mockViewer.scene.root);

      expect(model.color).toEqual([1, 1, 0]); // Flowering = yellow
      expect(model.scale).toEqual([1.2, 1.2, 1.2]); // Flowering = larger
      expect(model.userData).toBe(plant);
    });

    it("should update plant visualization when stage changes", () => {
      const plant: PlantEntity = createTestPlantEntity({
        growthStage: PlantStage.SEEDLING,
      });

      const renderer = new PlantRenderer(mockViewer);
      const model = renderer.render(plant, mockViewer.scene.root);

      // Change stage
      plant.growthStage = PlantStage.VEGETATIVE;
      renderer.update(model, plant);

      expect(model.color).toEqual([0, 0.8, 0]); // Vegetative = green
      expect(model.scale).toEqual([1.0, 1.0, 1.0]); // Vegetative = normal size
    });
  });

  describe("Sensor Visualization", () => {
    it("should render sensor sphere with color based on threshold", () => {
      const sensor: SensorEntity = createTestSensorEntity({
        currentReading: {
          value: 30,
          threshold: ThresholdStatus.CRITICAL,
        },
      });

      const renderer = new SensorRenderer(mockViewer);
      const model = renderer.render(sensor, mockViewer.scene.root);

      expect(model.color).toEqual([1, 0, 0]); // Critical = red
    });

    it("should update sensor visualization when reading changes", () => {
      const sensor: SensorEntity = createTestSensorEntity({
        currentReading: {
          value: 22,
          threshold: ThresholdStatus.NORMAL,
        },
      });

      const renderer = new SensorRenderer(mockViewer);
      const model = renderer.render(sensor, mockViewer.scene.root);

      // Change reading to warning
      sensor.currentReading.threshold = ThresholdStatus.WARNING;
      renderer.update(model, sensor);

      expect(model.color).toEqual([1, 1, 0]); // Warning = yellow
    });
  });

  describe("Performance Optimization", () => {
    it("should apply LOD based on camera distance", () => {
      const lodManager = new LODManager(mockViewer);
      const plant = createTestPlantEntity();
      const model = mockPlantModel(plant);

      // Set camera far from entity
      mockViewer.scene.camera.eye = [1000, 100, 1000];

      lodManager.updateEntityLOD(plant.id, model);

      expect(model.src).toContain("low_detail");
    });

    it("should cull entities outside camera frustum", () => {
      const cullingManager = new CullingManager(mockViewer);
      const plant = createTestPlantEntity();
      const model = mockPlantModel(plant);

      // Position entity outside frustum
      model.position = [10000, 0, 10000];

      // Simulate culling cycle
      cullingManager.performCulling();

      expect(model.visible).toBe(false);
    });
  });
});
```

## 10. Configuration and Deployment

### 10.1 XeoKit Configuration

```typescript
interface XeoKitConfiguration {
  scene: {
    transparent: boolean;
    antialias: boolean;
    gammaCorrection: boolean;
    webgl2: boolean;
    backgroundColor: Vector3;
  };

  performance: {
    enableLOD: boolean;
    enableCulling: boolean;
    enableBatching: boolean;
    maxEntitiesPerLayer: number;
    lodUpdateInterval: number;
    cullingUpdateInterval: number;
  };

  rendering: {
    shadows: boolean;
    reflections: boolean;
    bloomEffect: boolean;
    outlineEffect: boolean;
    ambientOcclusion: boolean;
  };

  interaction: {
    enablePicking: boolean;
    enableHover: boolean;
    enableContextMenu: boolean;
    doubleClickEnabled: boolean;
    mouseWheelZoom: boolean;
  };

  networking: {
    snapshotWebSocketUrl: string;
    metricsWebSocketUrl: string;
    reconnectInterval: number;
    maxReconnectAttempts: number;
    heartbeatInterval: number;
  };
}

const defaultXeoKitConfig: XeoKitConfiguration = {
  scene: {
    transparent: true,
    antialias: true,
    gammaCorrection: true,
    webgl2: true,
    backgroundColor: [0.9, 0.9, 0.9],
  },

  performance: {
    enableLOD: true,
    enableCulling: true,
    enableBatching: true,
    maxEntitiesPerLayer: 10000,
    lodUpdateInterval: 1000,
    cullingUpdateInterval: 2000,
  },

  rendering: {
    shadows: false, // Disabled for performance
    reflections: false,
    bloomEffect: true,
    outlineEffect: true,
    ambientOcclusion: false,
  },

  interaction: {
    enablePicking: true,
    enableHover: true,
    enableContextMenu: true,
    doubleClickEnabled: true,
    mouseWheelZoom: true,
  },

  networking: {
    snapshotWebSocketUrl: "wss://api/visualization/snapshot",
    metricsWebSocketUrl: "wss://api/metrics/live",
    reconnectInterval: 5000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
  },
};
```

### 10.2 Environment Configuration

```typescript
class ConfigurationManager {
  static getConfig(
    environment: "development" | "staging" | "production"
  ): XeoKitConfiguration {
    const baseConfig = defaultXeoKitConfig;

    switch (environment) {
      case "development":
        return {
          ...baseConfig,
          performance: {
            ...baseConfig.performance,
            enableLOD: false, // Disabled for debugging
            enableCulling: false,
          },
          rendering: {
            ...baseConfig.rendering,
            shadows: true, // Enabled for visual debugging
            reflections: true,
          },
        };

      case "staging":
        return {
          ...baseConfig,
          performance: {
            ...baseConfig.performance,
            maxEntitiesPerLayer: 5000, // Reduced for testing
          },
        };

      case "production":
        return {
          ...baseConfig,
          performance: {
            ...baseConfig.performance,
            enableLOD: true,
            enableCulling: true,
            enableBatching: true,
          },
          rendering: {
            ...baseConfig.rendering,
            shadows: false,
            reflections: false,
            ambientOcclusion: false,
          },
        };

      default:
        return baseConfig;
    }
  }
}
```

Эта техническая спецификация XeoKit Integration Layer полностью интегрирует все архитектурные инсайты из анализа 3DFrontend.md и готова для реализации полноценной многослойной 3D-визуализации с независимыми потоками данных.
