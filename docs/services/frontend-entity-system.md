# Frontend Entity System - Technical Specification

## 1. Overview

**Frontend Entity System** предоставляет полноценную объектную модель для всех сущностей фермы в 3D-визуализации, обеспечивая типобезопасность через Zod contracts, интерактивность через event handlers и интеграцию с backend через metadata binding.

### 1.1 Core Principles

1. **Type Safety**: Полная интеграция с Zod schemas и ts-rest contracts
2. **Hierarchical Composition**: Поддержка сложных иерархий Rack→Shelf→Tray→Plant
3. **Event-Driven Interactivity**: Click/hover/context handlers для каждого entity
4. **Metadata Binding**: Прямая связь с backend данными через validated contracts
5. **Visual State Management**: Управление цветом, подсветкой, анимациями по состоянию
6. **Stage-Based Rendering**: Динамическая визуализация в зависимости от стадии развития
7. **Readonly Interaction Model**: Только просмотр и формы, без drag&drop

## 2. Base Entity Architecture

### 2.1 Core Entity Interface

```typescript
interface BaseEntity {
  // Identity
  id: string;
  type: EntityType;
  spatialAddress: string;

  // 3D Properties
  position: Vector3;
  rotation?: Vector3;
  scale?: Vector3;

  // Visual State
  visible: boolean;
  highlight?: HighlightState;
  alert?: AlertState;
  opacity?: number;

  // Metadata & Backend Integration
  metadata: EntityMetadata;
  lastUpdated: Date;

  // Event Handlers
  onClick?: (entity: BaseEntity, event: ClickEvent) => void;
  onHover?: (entity: BaseEntity, event: HoverEvent) => void;
  onContextMenu?: (entity: BaseEntity, event: ContextEvent) => void;

  // Rendering
  visualConfig: VisualizationConfig;
  geometry?: GeometryReference;
  material?: MaterialReference;

  // Hierarchy
  parentId?: string;
  children?: string[];

  // Validation
  validate(): ValidationResult;
}

type Vector3 = [number, number, number];

enum EntityType {
  FACILITY = "facility",
  ZONE = "zone",
  RACK = "rack",
  SHELF = "shelf",
  TRAY = "tray",
  PLANT = "plant",
  EQUIPMENT = "equipment",
  SENSOR = "sensor",
  ALERT = "alert",
  CYCLE_ITEM = "cycleItem",
}

interface EntityMetadata {
  backendId: string;
  entityClass: string;
  properties: Record<string, any>;
  relationships: EntityRelationship[];
  permissions: EntityPermission[];
  complianceStatus?: ComplianceStatus;
}

interface VisualizationConfig {
  geometry: GeometryConfig;
  material: MaterialConfig;
  animation?: AnimationConfig;
  levelOfDetail?: LODConfig;
}
```

### 2.2 Highlight and Alert System

```typescript
interface HighlightState {
  enabled: boolean;
  type: HighlightType;
  color: Vector3;
  intensity: number;
  animation?: HighlightAnimation;
  duration?: number;
}

enum HighlightType {
  SELECTION = "selection",
  HOVER = "hover",
  ALERT = "alert",
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error",
}

interface AlertState {
  level: AlertLevel;
  message: string;
  category: AlertCategory;
  timestamp: Date;
  acknowledged: boolean;
  source: string;
}

enum AlertLevel {
  INFO = "info",
  WARNING = "warning",
  CRITICAL = "critical",
  EMERGENCY = "emergency",
}

enum AlertCategory {
  ENVIRONMENTAL = "environmental",
  EQUIPMENT = "equipment",
  PLANT_HEALTH = "plant_health",
  SECURITY = "security",
  COMPLIANCE = "compliance",
}
```

## 3. Specialized Entity Types

### 3.1 Plant Entity

```typescript
interface PlantEntity extends BaseEntity {
  type: EntityType.PLANT;
  plantData: PlantData;
  growthStage: PlantStage;
  healthStatus: HealthStatus;
  trayId: string;
  slotIndex: number;
  visualStage: PlantVisualConfig;
}

interface PlantData {
  strain: string;
  genetics: string;
  plantedDate: Date;
  expectedHarvest?: Date;
  cycleId: string;
  batchId: string;
  motherPlantId?: string;
}

enum PlantStage {
  SEEDLING = "seedling",
  VEGETATIVE = "vegetative",
  FLOWERING = "flowering",
  HARVEST_READY = "harvest_ready",
  HARVESTED = "harvested",
}

enum HealthStatus {
  HEALTHY = "healthy",
  NEEDS_WATER = "needs_water",
  NEEDS_NUTRIENTS = "needs_nutrients",
  PEST_ISSUE = "pest_issue",
  DISEASE = "disease",
  STRESSED = "stressed",
}

interface PlantVisualConfig {
  stage: PlantStage;
  baseColor: Vector3;
  highlightColor: Vector3;
  scale: number;
  geometry: string;
  material: string;
  glowEffect?: boolean;
  animationType?: PlantAnimation;
}

// Zod Schema for Plant Entity
export const PlantEntitySchema = z.object({
  id: z.string(),
  type: z.literal(EntityType.PLANT),
  spatialAddress: z.string(),
  position: z.tuple([z.number(), z.number(), z.number()]),
  plantData: z.object({
    strain: z.string(),
    genetics: z.string(),
    plantedDate: z.date(),
    cycleId: z.string(),
    batchId: z.string(),
  }),
  growthStage: z.nativeEnum(PlantStage),
  healthStatus: z.nativeEnum(HealthStatus),
  trayId: z.string(),
  slotIndex: z.number().min(0),
});

export type ValidatedPlantEntity = z.infer<typeof PlantEntitySchema>;
```

### 3.2 Rack Entity

```typescript
interface RackEntity extends BaseEntity {
  type: EntityType.RACK;
  rackData: RackData;
  configuration: RackConfiguration;
  shelves: ShelfEntity[];
  utilization: RackUtilization;
}

interface RackData {
  rackCode: string;
  rackType: RackType;
  installationDate: Date;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  lastMaintenance?: Date;
}

enum RackType {
  SINGLE_SHELF = "1-shelf",
  DOUBLE_SHELF = "2-shelf",
  TRIPLE_SHELF = "3-shelf",
  QUAD_SHELF = "4-shelf",
  CUSTOM = "custom",
}

interface RackConfiguration {
  shelfCount: number;
  shelfSpacing: number;
  maxTrayCapacity: number;
  supportedTraySizes: TraySize[];
  weightCapacity: number;
  powerSupply?: boolean;
  irrigationSupport?: boolean;
}

interface RackUtilization {
  totalCapacity: number;
  occupiedSlots: number;
  utilizationPercentage: number;
  availableSlots: number;
  byShelf: ShelfUtilization[];
}

// Zod Schema for Rack Entity
export const RackEntitySchema = z.object({
  id: z.string(),
  type: z.literal(EntityType.RACK),
  spatialAddress: z.string(),
  position: z.tuple([z.number(), z.number(), z.number()]),
  rackData: z.object({
    rackCode: z.string(),
    rackType: z.nativeEnum(RackType),
    installationDate: z.date(),
  }),
  configuration: z.object({
    shelfCount: z.number().min(1).max(10),
    shelfSpacing: z.number().positive(),
    maxTrayCapacity: z.number().positive(),
    supportedTraySizes: z.array(z.nativeEnum(TraySize)),
  }),
});
```

### 3.3 Tray Entity

```typescript
interface TrayEntity extends BaseEntity {
  type: EntityType.TRAY;
  trayData: TrayData;
  plants: PlantEntity[];
  layout: TrayLayout;
  occupancy: TrayOccupancy;
}

interface TrayData {
  trayCode: string;
  size: TraySize;
  material: TrayMaterial;
  acquisitionDate: Date;
  rackId: string;
  shelfIndex: number;
  positionIndex: number;
}

enum TraySize {
  SMALL = "small", // 30x20 cm
  MEDIUM = "medium", // 40x30 cm
  LARGE = "large", // 50x40 cm
  XLARGE = "xlarge", // 60x50 cm
  CUSTOM = "custom",
}

enum TrayMaterial {
  PLASTIC = "plastic",
  BIODEGRADABLE = "biodegradable",
  CERAMIC = "ceramic",
  METAL = "metal",
}

interface TrayLayout {
  rows: number;
  columns: number;
  spacing: number;
  pattern: LayoutPattern;
  plantPositions: PlantPosition[];
}

enum LayoutPattern {
  GRID = "grid",
  HEXAGONAL = "hexagonal",
  RANDOM = "random",
  OPTIMIZED = "optimized",
}

interface PlantPosition {
  index: number;
  coordinates: Vector3; // Relative to tray center
  occupied: boolean;
  occupiedBy?: string;
  reservedFor?: string;
  suitableFor: PlantStage[];
}

interface TrayOccupancy {
  totalSlots: number;
  occupiedSlots: number;
  occupancyRate: number;
  availableSlots: number;
  reservedSlots: number;
}

// Zod Schema for Tray Entity
export const TrayEntitySchema = z.object({
  id: z.string(),
  type: z.literal(EntityType.TRAY),
  spatialAddress: z.string(),
  position: z.tuple([z.number(), z.number(), z.number()]),
  trayData: z.object({
    trayCode: z.string(),
    size: z.nativeEnum(TraySize),
    material: z.nativeEnum(TrayMaterial),
    rackId: z.string(),
    shelfIndex: z.number().min(1),
    positionIndex: z.number().min(1),
  }),
  layout: z.object({
    rows: z.number().min(1),
    columns: z.number().min(1),
    pattern: z.nativeEnum(LayoutPattern),
  }),
});
```

### 3.4 Equipment Entity

```typescript
interface EquipmentEntity extends BaseEntity {
  type: EntityType.EQUIPMENT;
  equipmentData: EquipmentData;
  operationalStatus: OperationalStatus;
  monitoring: EquipmentMonitoring;
}

interface EquipmentData {
  equipmentCode: string;
  equipmentType: EquipmentType;
  manufacturer: string;
  model: string;
  serialNumber: string;
  installationDate: Date;
  specifications: EquipmentSpecs;
}

enum EquipmentType {
  HVAC_FAN = "hvac_fan",
  IRRIGATION_PUMP = "irrigation_pump",
  LED_LIGHT = "led_light",
  HUMIDIFIER = "humidifier",
  DEHUMIDIFIER = "dehumidifier",
  CO2_GENERATOR = "co2_generator",
  FILTER = "filter",
  SENSOR = "sensor",
  CAMERA = "camera",
}

interface OperationalStatus {
  status: EquipmentStatus;
  powerState: PowerState;
  currentSettings: Record<string, any>;
  lastOperation: Date;
  operatingHours: number;
  efficiency: number;
}

enum EquipmentStatus {
  OPERATIONAL = "operational",
  MAINTENANCE = "maintenance",
  FAULT = "fault",
  OFFLINE = "offline",
  STANDBY = "standby",
}

enum PowerState {
  ON = "on",
  OFF = "off",
  STANDBY = "standby",
  ERROR = "error",
}

// Zod Schema for Equipment Entity
export const EquipmentEntitySchema = z.object({
  id: z.string(),
  type: z.literal(EntityType.EQUIPMENT),
  spatialAddress: z.string(),
  position: z.tuple([z.number(), z.number(), z.number()]),
  equipmentData: z.object({
    equipmentCode: z.string(),
    equipmentType: z.nativeEnum(EquipmentType),
    manufacturer: z.string(),
    model: z.string(),
    serialNumber: z.string(),
  }),
  operationalStatus: z.object({
    status: z.nativeEnum(EquipmentStatus),
    powerState: z.nativeEnum(PowerState),
    efficiency: z.number().min(0).max(100),
  }),
});
```

### 3.5 Sensor Entity

```typescript
interface SensorEntity extends BaseEntity {
  type: EntityType.SENSOR;
  sensorData: SensorData;
  currentReading: SensorReading;
  visualization: SensorVisualization;
  calibration: SensorCalibration;
}

interface SensorData {
  sensorCode: string;
  sensorType: SensorType;
  manufacturer: string;
  model: string;
  serialNumber: string;
  installationDate: Date;
  measurementRange: MeasurementRange;
}

enum SensorType {
  TEMPERATURE = "temperature",
  HUMIDITY = "humidity",
  CO2 = "co2",
  LIGHT_PAR = "light_par",
  PH = "ph",
  EC = "ec",
  WATER_LEVEL = "water_level",
  PRESSURE = "pressure",
  AIRFLOW = "airflow",
  MOTION = "motion",
}

interface SensorReading {
  value: number;
  unit: string;
  timestamp: Date;
  quality: ReadingQuality;
  threshold: ThresholdStatus;
}

enum ReadingQuality {
  EXCELLENT = "excellent",
  GOOD = "good",
  FAIR = "fair",
  POOR = "poor",
  INVALID = "invalid",
}

enum ThresholdStatus {
  NORMAL = "normal",
  WARNING = "warning",
  CRITICAL = "critical",
  OUT_OF_RANGE = "out_of_range",
}

interface SensorVisualization {
  displayType: SensorDisplayType;
  colorMapping: ColorMapping;
  sizeMapping?: SizeMapping;
  animation?: SensorAnimation;
}

enum SensorDisplayType {
  SPHERE = "sphere",
  GLYPH = "glyph",
  BAR = "bar",
  HEATMAP = "heatmap",
  HIDDEN = "hidden",
}

// Zod Schema for Sensor Entity
export const SensorEntitySchema = z.object({
  id: z.string(),
  type: z.literal(EntityType.SENSOR),
  spatialAddress: z.string(),
  position: z.tuple([z.number(), z.number(), z.number()]),
  sensorData: z.object({
    sensorCode: z.string(),
    sensorType: z.nativeEnum(SensorType),
    manufacturer: z.string(),
    model: z.string(),
  }),
  currentReading: z.object({
    value: z.number(),
    unit: z.string(),
    timestamp: z.date(),
    quality: z.nativeEnum(ReadingQuality),
    threshold: z.nativeEnum(ThresholdStatus),
  }),
  visualization: z.object({
    displayType: z.nativeEnum(SensorDisplayType),
    colorMapping: z.object({
      normal: z.tuple([z.number(), z.number(), z.number()]),
      warning: z.tuple([z.number(), z.number(), z.number()]),
      critical: z.tuple([z.number(), z.number(), z.number()]),
    }),
  }),
});
```

### 3.6 Zone Entity

```typescript
interface ZoneEntity extends BaseEntity {
  type: EntityType.ZONE;
  zoneData: ZoneData;
  environment: ZoneEnvironment;
  capacity: ZoneCapacity;
  compliance: ZoneCompliance;
}

interface ZoneData {
  zoneCode: string;
  zoneType: ZoneType;
  name: string;
  description?: string;
  area: number; // square meters
  volume: number; // cubic meters
  accessLevel: AccessLevel;
}

enum ZoneType {
  VEGETATION = "vegetation",
  FLOWERING = "flowering",
  MOTHER_ROOM = "mother_room",
  CLONE_ROOM = "clone_room",
  DRYING = "drying",
  CURING = "curing",
  STORAGE = "storage",
  PROCESSING = "processing",
  QUARANTINE = "quarantine",
}

enum AccessLevel {
  PUBLIC = "public",
  RESTRICTED = "restricted",
  AUTHORIZED_ONLY = "authorized_only",
  CRITICAL = "critical",
}

interface ZoneEnvironment {
  temperature: EnvironmentMetric;
  humidity: EnvironmentMetric;
  co2: EnvironmentMetric;
  lightPAR: EnvironmentMetric;
  airflow: EnvironmentMetric;
  lastUpdate: Date;
}

interface EnvironmentMetric {
  current: number;
  target: number;
  min: number;
  max: number;
  unit: string;
  status: ThresholdStatus;
}

interface ZoneCapacity {
  maxRacks: number;
  currentRacks: number;
  maxPlants: number;
  currentPlants: number;
  utilizationRate: number;
  projectedCapacity?: number;
}

// Zod Schema for Zone Entity
export const ZoneEntitySchema = z.object({
  id: z.string(),
  type: z.literal(EntityType.ZONE),
  spatialAddress: z.string(),
  position: z.tuple([z.number(), z.number(), z.number()]),
  zoneData: z.object({
    zoneCode: z.string(),
    zoneType: z.nativeEnum(ZoneType),
    name: z.string(),
    area: z.number().positive(),
    accessLevel: z.nativeEnum(AccessLevel),
  }),
  environment: z.object({
    temperature: z.object({
      current: z.number(),
      target: z.number(),
      unit: z.string(),
      status: z.nativeEnum(ThresholdStatus),
    }),
    humidity: z.object({
      current: z.number(),
      target: z.number(),
      unit: z.string(),
      status: z.nativeEnum(ThresholdStatus),
    }),
  }),
  capacity: z.object({
    maxRacks: z.number().min(0),
    currentRacks: z.number().min(0),
    maxPlants: z.number().min(0),
    currentPlants: z.number().min(0),
    utilizationRate: z.number().min(0).max(100),
  }),
});
```

## 4. Entity Factory and Management

### 4.1 Entity Factory

```typescript
class EntityFactory {
  static createPlant(data: PlantCreationData): PlantEntity {
    const validated = PlantEntitySchema.parse(data);

    const plant: PlantEntity = {
      ...validated,
      visible: true,
      visualStage: this.getPlantVisualConfig(validated.growthStage),
      onClick: this.createPlantClickHandler(validated.id),
      onHover: this.createPlantHoverHandler(validated.id),
      validate: () => this.validatePlantEntity(validated),
    };

    return plant;
  }

  static createRack(data: RackCreationData): RackEntity {
    const validated = RackEntitySchema.parse(data);

    const rack: RackEntity = {
      ...validated,
      visible: true,
      shelves: this.createShelves(validated.configuration),
      utilization: this.calculateRackUtilization(validated),
      onClick: this.createRackClickHandler(validated.id),
      onHover: this.createRackHoverHandler(validated.id),
      validate: () => this.validateRackEntity(validated),
    };

    return rack;
  }

  private static getPlantVisualConfig(stage: PlantStage): PlantVisualConfig {
    const configs = {
      [PlantStage.SEEDLING]: {
        stage,
        baseColor: [0, 1, 0] as Vector3,
        highlightColor: [0, 1, 0.5] as Vector3,
        scale: 0.5,
        geometry: "seedling.xkt",
        material: "plant_seedling",
        glowEffect: false,
      },
      [PlantStage.VEGETATIVE]: {
        stage,
        baseColor: [0, 0.8, 0] as Vector3,
        highlightColor: [0, 1, 0] as Vector3,
        scale: 1.0,
        geometry: "vegetative.xkt",
        material: "plant_vegetative",
        glowEffect: false,
      },
      [PlantStage.FLOWERING]: {
        stage,
        baseColor: [1, 1, 0] as Vector3,
        highlightColor: [1, 1, 0.5] as Vector3,
        scale: 1.2,
        geometry: "flowering.xkt",
        material: "plant_flowering",
        glowEffect: true,
      },
      [PlantStage.HARVEST_READY]: {
        stage,
        baseColor: [1, 0.5, 0] as Vector3,
        highlightColor: [1, 0.8, 0] as Vector3,
        scale: 1.0,
        geometry: "harvest.xkt",
        material: "plant_harvest",
        glowEffect: true,
      },
      [PlantStage.HARVESTED]: {
        stage,
        baseColor: [0.5, 0.5, 0.5] as Vector3,
        highlightColor: [0.7, 0.7, 0.7] as Vector3,
        scale: 0.8,
        geometry: "harvested.xkt",
        material: "plant_harvested",
        glowEffect: false,
      },
    };

    return configs[stage];
  }
}
```

### 4.2 Entity Manager

```typescript
class EntityManager {
  private entities: Map<string, BaseEntity> = new Map();
  private entityTypes: Map<EntityType, Set<string>> = new Map();
  private hierarchyMap: Map<string, string[]> = new Map(); // parent -> children

  addEntity(entity: BaseEntity): void {
    // Validate entity before adding
    const validation = entity.validate();
    if (!validation.valid) {
      throw new Error(
        `Entity validation failed: ${validation.errors.join(", ")}`
      );
    }

    this.entities.set(entity.id, entity);

    // Index by type
    if (!this.entityTypes.has(entity.type)) {
      this.entityTypes.set(entity.type, new Set());
    }
    this.entityTypes.get(entity.type)!.add(entity.id);

    // Update hierarchy
    if (entity.parentId) {
      if (!this.hierarchyMap.has(entity.parentId)) {
        this.hierarchyMap.set(entity.parentId, []);
      }
      this.hierarchyMap.get(entity.parentId)!.push(entity.id);
    }
  }

  getEntity<T extends BaseEntity>(id: string): T | undefined {
    return this.entities.get(id) as T;
  }

  getEntitiesByType<T extends BaseEntity>(type: EntityType): T[] {
    const ids = this.entityTypes.get(type) || new Set();
    return Array.from(ids)
      .map((id) => this.entities.get(id))
      .filter((entity) => entity !== undefined) as T[];
  }

  getChildren(parentId: string): BaseEntity[] {
    const childIds = this.hierarchyMap.get(parentId) || [];
    return childIds
      .map((id) => this.entities.get(id))
      .filter((entity) => entity !== undefined) as BaseEntity[];
  }

  updateEntity(id: string, updates: Partial<BaseEntity>): void {
    const entity = this.entities.get(id);
    if (!entity) {
      throw new Error(`Entity ${id} not found`);
    }

    const updatedEntity = { ...entity, ...updates, lastUpdated: new Date() };

    // Validate updated entity
    const validation = updatedEntity.validate();
    if (!validation.valid) {
      throw new Error(
        `Entity update validation failed: ${validation.errors.join(", ")}`
      );
    }

    this.entities.set(id, updatedEntity);
  }

  removeEntity(id: string): void {
    const entity = this.entities.get(id);
    if (!entity) return;

    // Remove from type index
    this.entityTypes.get(entity.type)?.delete(id);

    // Remove from hierarchy
    if (entity.parentId) {
      const siblings = this.hierarchyMap.get(entity.parentId);
      if (siblings) {
        const index = siblings.indexOf(id);
        if (index !== -1) {
          siblings.splice(index, 1);
        }
      }
    }

    // Remove children references
    this.hierarchyMap.delete(id);

    this.entities.delete(id);
  }

  // Query methods
  findEntitiesInArea(bounds: BoundingBox): BaseEntity[] {
    return Array.from(this.entities.values()).filter((entity) =>
      this.isInBounds(entity.position, bounds)
    );
  }

  findEntitiesByProperty(property: string, value: any): BaseEntity[] {
    return Array.from(this.entities.values()).filter(
      (entity) => entity.metadata.properties[property] === value
    );
  }

  private isInBounds(position: Vector3, bounds: BoundingBox): boolean {
    return (
      position[0] >= bounds.min[0] &&
      position[0] <= bounds.max[0] &&
      position[1] >= bounds.min[1] &&
      position[1] <= bounds.max[1] &&
      position[2] >= bounds.min[2] &&
      position[2] <= bounds.max[2]
    );
  }
}

interface BoundingBox {
  min: Vector3;
  max: Vector3;
}
```

## 5. Event Handling System

### 5.1 Event Handlers

```typescript
interface EntityEventHandlers {
  createPlantClickHandler(
    plantId: string
  ): (entity: BaseEntity, event: ClickEvent) => void;
  createPlantHoverHandler(
    plantId: string
  ): (entity: BaseEntity, event: HoverEvent) => void;
  createRackClickHandler(
    rackId: string
  ): (entity: BaseEntity, event: ClickEvent) => void;
  createTrayClickHandler(
    trayId: string
  ): (entity: BaseEntity, event: ClickEvent) => void;
  createEquipmentClickHandler(
    equipmentId: string
  ): (entity: BaseEntity, event: ClickEvent) => void;
  createSensorClickHandler(
    sensorId: string
  ): (entity: BaseEntity, event: ClickEvent) => void;
}

class EntityEventHandlers implements EntityEventHandlers {
  constructor(
    private entityManager: EntityManager,
    private uiService: UIService,
    private dataService: DataService
  ) {}

  createPlantClickHandler(plantId: string) {
    return async (entity: BaseEntity, event: ClickEvent) => {
      const plant = this.entityManager.getEntity<PlantEntity>(plantId);
      if (!plant) return;

      // Fetch detailed plant data
      const plantDetails = await this.dataService.getPlantDetails(plantId);

      // Show plant details modal
      this.uiService.showPlantDetailsModal({
        plant: plantDetails,
        position: event.screenPosition,
        actions: [
          {
            label: "View Growth History",
            action: () => this.uiService.showGrowthHistoryModal(plantId),
          },
          {
            label: "Schedule Harvest",
            action: () => this.uiService.showHarvestScheduleModal(plantId),
          },
          {
            label: "View Compliance",
            action: () => this.uiService.showComplianceModal(plantId),
          },
        ],
      });

      // Highlight related entities
      this.highlightRelatedEntities(plant);
    };
  }

  createPlantHoverHandler(plantId: string) {
    return async (entity: BaseEntity, event: HoverEvent) => {
      const plant = this.entityManager.getEntity<PlantEntity>(plantId);
      if (!plant) return;

      // Show quick info tooltip
      this.uiService.showTooltip({
        content: this.formatPlantTooltip(plant),
        position: event.screenPosition,
        duration: 3000,
      });

      // Subtle highlight
      this.entityManager.updateEntity(plantId, {
        highlight: {
          enabled: true,
          type: HighlightType.HOVER,
          color: [0, 1, 1],
          intensity: 0.3,
          duration: 1000,
        },
      });
    };
  }

  createRackClickHandler(rackId: string) {
    return async (entity: BaseEntity, event: ClickEvent) => {
      const rack = this.entityManager.getEntity<RackEntity>(rackId);
      if (!rack) return;

      // Show rack management panel
      this.uiService.showRackManagementPanel({
        rack,
        position: event.screenPosition,
        tabs: ["utilization", "trays", "maintenance", "configuration"],
      });

      // Highlight all trays in rack
      this.highlightRackContents(rack);
    };
  }

  private highlightRelatedEntities(plant: PlantEntity): void {
    // Highlight tray
    const tray = this.entityManager.getEntity<TrayEntity>(plant.trayId);
    if (tray) {
      this.entityManager.updateEntity(tray.id, {
        highlight: {
          enabled: true,
          type: HighlightType.SELECTION,
          color: [0, 0, 1],
          intensity: 0.5,
        },
      });

      // Highlight rack
      const rack = this.entityManager.getEntity<RackEntity>(tray.rackId);
      if (rack) {
        this.entityManager.updateEntity(rack.id, {
          highlight: {
            enabled: true,
            type: HighlightType.SELECTION,
            color: [0, 0, 1],
            intensity: 0.3,
          },
        });
      }
    }
  }

  private formatPlantTooltip(plant: PlantEntity): string {
    return `
      <div class="plant-tooltip">
        <h3>${plant.plantData.strain}</h3>
        <p>Stage: ${plant.growthStage}</p>
        <p>Health: ${plant.healthStatus}</p>
        <p>Days since planted: ${this.calculateDaysSincePlanted(
          plant.plantData.plantedDate
        )}</p>
        <p>Location: ${plant.spatialAddress}</p>
      </div>
    `;
  }
}
```

### 5.2 Context Menu System

```typescript
interface ContextMenuAction {
  label: string;
  icon?: string;
  action: () => void | Promise<void>;
  enabled: boolean;
  permissions?: string[];
}

class ContextMenuService {
  createPlantContextMenu(plant: PlantEntity): ContextMenuAction[] {
    return [
      {
        label: "View Details",
        icon: "info",
        action: () => this.showPlantDetails(plant.id),
        enabled: true,
      },
      {
        label: "Move Plant",
        icon: "move",
        action: () => this.showMoveDialog(plant.id),
        enabled: plant.growthStage !== PlantStage.HARVESTED,
        permissions: ["plant.move"],
      },
      {
        label: "Schedule Harvest",
        icon: "harvest",
        action: () => this.showHarvestDialog(plant.id),
        enabled: plant.growthStage === PlantStage.HARVEST_READY,
        permissions: ["plant.harvest"],
      },
      {
        label: "View History",
        icon: "history",
        action: () => this.showPlantHistory(plant.id),
        enabled: true,
      },
      {
        label: "Generate QR Code",
        icon: "qr-code",
        action: () => this.generateQRCode(plant.id),
        enabled: true,
        permissions: ["qr.generate"],
      },
    ];
  }

  createRackContextMenu(rack: RackEntity): ContextMenuAction[] {
    return [
      {
        label: "View Rack Details",
        icon: "info",
        action: () => this.showRackDetails(rack.id),
        enabled: true,
      },
      {
        label: "Manage Trays",
        icon: "grid",
        action: () => this.showTrayManagement(rack.id),
        enabled: true,
        permissions: ["rack.manage"],
      },
      {
        label: "Maintenance Schedule",
        icon: "tools",
        action: () => this.showMaintenanceSchedule(rack.id),
        enabled: true,
        permissions: ["maintenance.view"],
      },
      {
        label: "Utilization Report",
        icon: "chart",
        action: () => this.showUtilizationReport(rack.id),
        enabled: true,
      },
    ];
  }
}
```

## 6. Visual State Management

### 6.1 Visual State Controller

```typescript
class VisualStateController {
  private entityManager: EntityManager;
  private animationQueue: AnimationQueue;

  constructor(entityManager: EntityManager) {
    this.entityManager = entityManager;
    this.animationQueue = new AnimationQueue();
  }

  updatePlantStageVisualization(plantId: string, newStage: PlantStage): void {
    const plant = this.entityManager.getEntity<PlantEntity>(plantId);
    if (!plant) return;

    const newVisualConfig = EntityFactory.getPlantVisualConfig(newStage);

    // Animate transition between stages
    this.animationQueue.add({
      entityId: plantId,
      type: AnimationType.STAGE_TRANSITION,
      duration: 2000,
      from: plant.visualStage,
      to: newVisualConfig,
      easing: EasingType.EASE_IN_OUT,
    });

    // Update entity
    this.entityManager.updateEntity(plantId, {
      growthStage: newStage,
      visualStage: newVisualConfig,
    });
  }

  highlightAlert(entityId: string, alert: AlertState): void {
    const entity = this.entityManager.getEntity(entityId);
    if (!entity) return;

    const alertColors = {
      [AlertLevel.INFO]: [0, 0, 1] as Vector3,
      [AlertLevel.WARNING]: [1, 1, 0] as Vector3,
      [AlertLevel.CRITICAL]: [1, 0.5, 0] as Vector3,
      [AlertLevel.EMERGENCY]: [1, 0, 0] as Vector3,
    };

    this.entityManager.updateEntity(entityId, {
      alert,
      highlight: {
        enabled: true,
        type: HighlightType.ALERT,
        color: alertColors[alert.level],
        intensity: 1.0,
        animation: {
          type: AnimationType.PULSE,
          speed: alert.level === AlertLevel.EMERGENCY ? 2.0 : 1.0,
        },
      },
    });
  }

  showEnvironmentalOverlay(zoneId: string, metricType: SensorType): void {
    const zone = this.entityManager.getEntity<ZoneEntity>(zoneId);
    if (!zone) return;

    // Get all sensors of the specified type in the zone
    const sensors = this.entityManager
      .getEntitiesByType<SensorEntity>(EntityType.SENSOR)
      .filter(
        (sensor) =>
          sensor.sensorData.sensorType === metricType &&
          sensor.spatialAddress.startsWith(zone.spatialAddress)
      );

    // Update sensor visualizations
    sensors.forEach((sensor) => {
      this.updateSensorVisualization(sensor, metricType);
    });
  }

  private updateSensorVisualization(
    sensor: SensorEntity,
    focusType: SensorType
  ): void {
    if (sensor.sensorData.sensorType !== focusType) {
      // Fade out non-matching sensors
      this.entityManager.updateEntity(sensor.id, {
        opacity: 0.2,
        visualization: {
          ...sensor.visualization,
          displayType: SensorDisplayType.SPHERE,
        },
      });
    } else {
      // Enhance matching sensors
      const visualConfig = this.getSensorVisualConfig(sensor);
      this.entityManager.updateEntity(sensor.id, {
        opacity: 1.0,
        visualization: {
          ...sensor.visualization,
          displayType: SensorDisplayType.GLYPH,
          ...visualConfig,
        },
      });
    }
  }
}
```

### 6.2 Animation System

```typescript
enum AnimationType {
  STAGE_TRANSITION = "stage_transition",
  PULSE = "pulse",
  GLOW = "glow",
  SCALE = "scale",
  ROTATE = "rotate",
  FADE = "fade",
}

enum EasingType {
  LINEAR = "linear",
  EASE_IN = "ease_in",
  EASE_OUT = "ease_out",
  EASE_IN_OUT = "ease_in_out",
  BOUNCE = "bounce",
}

interface Animation {
  entityId: string;
  type: AnimationType;
  duration: number;
  from: any;
  to: any;
  easing: EasingType;
  onComplete?: () => void;
}

class AnimationQueue {
  private queue: Animation[] = [];
  private running: Map<string, Animation> = new Map();

  add(animation: Animation): void {
    // Cancel existing animation for this entity
    this.cancel(animation.entityId);

    this.queue.push(animation);
    this.processQueue();
  }

  cancel(entityId: string): void {
    this.running.delete(entityId);
    this.queue = this.queue.filter((anim) => anim.entityId !== entityId);
  }

  private processQueue(): void {
    if (this.queue.length === 0) return;

    const animation = this.queue.shift()!;
    this.running.set(animation.entityId, animation);

    this.executeAnimation(animation);
  }

  private executeAnimation(animation: Animation): void {
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animation.duration, 1);

      const easedProgress = this.applyEasing(progress, animation.easing);
      const currentValue = this.interpolate(
        animation.from,
        animation.to,
        easedProgress
      );

      this.applyAnimationValue(animation, currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.running.delete(animation.entityId);
        animation.onComplete?.();
        this.processQueue();
      }
    };

    requestAnimationFrame(animate);
  }

  private applyEasing(t: number, easing: EasingType): number {
    switch (easing) {
      case EasingType.LINEAR:
        return t;
      case EasingType.EASE_IN:
        return t * t;
      case EasingType.EASE_OUT:
        return 1 - (1 - t) * (1 - t);
      case EasingType.EASE_IN_OUT:
        return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
      case EasingType.BOUNCE:
        return 1 - Math.abs(Math.sin(t * Math.PI * 4)) * (1 - t);
      default:
        return t;
    }
  }
}
```

## 7. Integration with XeoKit

### 7.1 XeoKit Entity Renderer

```typescript
import { Viewer, XKTModel, Node } from "xeokit-sdk";

class XeoKitEntityRenderer {
  private viewer: Viewer;
  private entityModels: Map<string, XKTModel> = new Map();
  private layers: Map<string, Node> = new Map();

  constructor(viewer: Viewer) {
    this.viewer = viewer;
    this.initializeLayers();
  }

  renderEntity(entity: BaseEntity): void {
    // Remove existing model if present
    this.removeEntityModel(entity.id);

    // Create new model based on entity type
    const model = this.createEntityModel(entity);
    if (model) {
      this.entityModels.set(entity.id, model);
      this.applyEntityVisualState(entity, model);
    }
  }

  private createEntityModel(entity: BaseEntity): XKTModel | null {
    const layer = this.getLayerForEntity(entity);

    switch (entity.type) {
      case EntityType.PLANT:
        return this.createPlantModel(entity as PlantEntity, layer);
      case EntityType.RACK:
        return this.createRackModel(entity as RackEntity, layer);
      case EntityType.TRAY:
        return this.createTrayModel(entity as TrayEntity, layer);
      case EntityType.EQUIPMENT:
        return this.createEquipmentModel(entity as EquipmentEntity, layer);
      case EntityType.SENSOR:
        return this.createSensorModel(entity as SensorEntity, layer);
      default:
        return null;
    }
  }

  private createPlantModel(plant: PlantEntity, layer: Node): XKTModel {
    const model = new XKTModel(this.viewer.scene, {
      id: plant.id,
      src: plant.visualStage.geometry,
      parent: layer,
    });

    model.position = plant.position;
    model.scale = [
      plant.visualStage.scale,
      plant.visualStage.scale,
      plant.visualStage.scale,
    ];
    model.color = plant.visualStage.baseColor;
    model.userData = plant;

    // Apply stage-specific effects
    if (plant.visualStage.glowEffect) {
      model.highlighted = true;
      model.highlightColor = plant.visualStage.highlightColor;
    }

    return model;
  }

  private createSensorModel(sensor: SensorEntity, layer: Node): XKTModel {
    const model = this.createSensorVisualization(sensor);
    model.parent = layer;
    model.userData = sensor;

    return model;
  }

  private createSensorVisualization(sensor: SensorEntity): XKTModel {
    switch (sensor.visualization.displayType) {
      case SensorDisplayType.SPHERE:
        return this.createSensorSphere(sensor);
      case SensorDisplayType.GLYPH:
        return this.createSensorGlyph(sensor);
      case SensorDisplayType.BAR:
        return this.createSensorBar(sensor);
      default:
        return this.createSensorSphere(sensor);
    }
  }

  private createSensorSphere(sensor: SensorEntity): XKTModel {
    const sphere = this.viewer.scene.createMesh({
      id: sensor.id,
      primitive: "sphere",
      position: sensor.position,
      radius: this.calculateSensorSize(sensor),
      color: this.getSensorColor(sensor),
    });

    return sphere as XKTModel;
  }

  private applyEntityVisualState(entity: BaseEntity, model: XKTModel): void {
    // Apply visibility
    model.visible = entity.visible;

    // Apply opacity
    if (entity.opacity !== undefined) {
      model.opacity = entity.opacity;
    }

    // Apply highlighting
    if (entity.highlight?.enabled) {
      model.highlighted = true;
      model.highlightColor = entity.highlight.color;

      // Apply highlight animation if specified
      if (entity.highlight.animation) {
        this.applyHighlightAnimation(model, entity.highlight);
      }
    }

    // Apply alert visualization
    if (entity.alert) {
      this.applyAlertVisualization(model, entity.alert);
    }
  }

  updateEntityVisualState(entityId: string, entity: BaseEntity): void {
    const model = this.entityModels.get(entityId);
    if (model) {
      this.applyEntityVisualState(entity, model);
    }
  }

  removeEntityModel(entityId: string): void {
    const model = this.entityModels.get(entityId);
    if (model) {
      model.destroy();
      this.entityModels.delete(entityId);
    }
  }
}
```

## 8. Testing Framework

### 8.1 Entity Testing

```typescript
describe("Frontend Entity System", () => {
  let entityManager: EntityManager;
  let factory: EntityFactory;

  beforeEach(() => {
    entityManager = new EntityManager();
    factory = new EntityFactory();
  });

  describe("Plant Entity", () => {
    it("should create valid plant entity with stage visualization", () => {
      const plantData: PlantCreationData = {
        id: "PLANT-001",
        type: EntityType.PLANT,
        spatialAddress: "FARM01.VEG-A.R-001.S-01.T-001.P-001.PLANT.PLANT-001",
        position: [1, 0, 1],
        plantData: {
          strain: "Blue Dream",
          genetics: "Hybrid",
          plantedDate: new Date("2024-01-01"),
          cycleId: "CYCLE-001",
          batchId: "BATCH-001",
        },
        growthStage: PlantStage.VEGETATIVE,
        healthStatus: HealthStatus.HEALTHY,
        trayId: "TRAY-001",
        slotIndex: 1,
      };

      const plant = factory.createPlant(plantData);

      expect(plant.id).toBe("PLANT-001");
      expect(plant.growthStage).toBe(PlantStage.VEGETATIVE);
      expect(plant.visualStage.scale).toBe(1.0);
      expect(plant.visualStage.baseColor).toEqual([0, 0.8, 0]);
      expect(plant.validate().valid).toBe(true);
    });

    it("should update visual config when stage changes", () => {
      const plant = factory.createPlant(validPlantData);
      entityManager.addEntity(plant);

      const visualController = new VisualStateController(entityManager);
      visualController.updatePlantStageVisualization(
        plant.id,
        PlantStage.FLOWERING
      );

      const updatedPlant = entityManager.getEntity<PlantEntity>(plant.id);
      expect(updatedPlant?.growthStage).toBe(PlantStage.FLOWERING);
      expect(updatedPlant?.visualStage.baseColor).toEqual([1, 1, 0]);
      expect(updatedPlant?.visualStage.glowEffect).toBe(true);
    });
  });

  describe("Entity Hierarchy", () => {
    it("should maintain rack-shelf-tray-plant hierarchy", () => {
      const rack = factory.createRack(validRackData);
      const tray = factory.createTray({ ...validTrayData, rackId: rack.id });
      const plant = factory.createPlant({ ...validPlantData, trayId: tray.id });

      entityManager.addEntity(rack);
      entityManager.addEntity(tray);
      entityManager.addEntity(plant);

      const rackChildren = entityManager.getChildren(rack.id);
      const trayChildren = entityManager.getChildren(tray.id);

      expect(rackChildren).toContain(tray);
      expect(trayChildren).toContain(plant);
    });
  });

  describe("Event Handling", () => {
    it("should call click handlers when entity is clicked", async () => {
      const mockUIService = jest.fn();
      const eventHandlers = new EntityEventHandlers(
        entityManager,
        mockUIService,
        mockDataService
      );

      const plant = factory.createPlant(validPlantData);
      plant.onClick = eventHandlers.createPlantClickHandler(plant.id);

      const clickEvent: ClickEvent = {
        screenPosition: [100, 100],
        worldPosition: [1, 0, 1],
        button: "left",
      };

      await plant.onClick!(plant, clickEvent);

      expect(mockUIService.showPlantDetailsModal).toHaveBeenCalledWith(
        expect.objectContaining({
          plant: expect.any(Object),
          position: [100, 100],
        })
      );
    });
  });
});
```

### 8.2 Performance Testing

```typescript
describe("Entity Performance", () => {
  it("should handle large numbers of entities efficiently", () => {
    const entityManager = new EntityManager();
    const startTime = Date.now();

    // Add 10,000 plant entities
    for (let i = 0; i < 10000; i++) {
      const plant = factory.createPlant({
        ...basePlantData,
        id: `PLANT-${i.toString().padStart(5, "0")}`,
        position: [Math.random() * 1000, 0, Math.random() * 1000],
      });
      entityManager.addEntity(plant);
    }

    const additionTime = Date.now() - startTime;
    expect(additionTime).toBeLessThan(1000); // Should complete in under 1 second

    // Test query performance
    const queryStart = Date.now();
    const plants = entityManager.getEntitiesByType<PlantEntity>(
      EntityType.PLANT
    );
    const queryTime = Date.now() - queryStart;

    expect(plants.length).toBe(10000);
    expect(queryTime).toBeLessThan(100); // Should query in under 100ms
  });

  it("should efficiently update visual states for many entities", () => {
    const entityManager = new EntityManager();
    const visualController = new VisualStateController(entityManager);

    // Add 1000 entities
    const entityIds: string[] = [];
    for (let i = 0; i < 1000; i++) {
      const plant = factory.createPlant({
        ...basePlantData,
        id: `PLANT-${i}`,
        growthStage: PlantStage.SEEDLING,
      });
      entityManager.addEntity(plant);
      entityIds.push(plant.id);
    }

    // Update all to flowering stage
    const updateStart = Date.now();
    entityIds.forEach((id) => {
      visualController.updatePlantStageVisualization(id, PlantStage.FLOWERING);
    });
    const updateTime = Date.now() - updateStart;

    expect(updateTime).toBeLessThan(500); // Should update 1000 entities in under 500ms
  });
});
```

Эта техническая спецификация Frontend Entity System полностью интегрирует все архитектурные инсайты из анализа 3DFrontend.md и готова для реализации полноценной объектной модели с XeoKit интеграцией.
