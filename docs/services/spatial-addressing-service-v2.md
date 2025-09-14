# Spatial Addressing Service v2.0 - Enhanced Technical Specification

## 1. Service Overview

**Spatial Addressing Service v2.0** предоставляет универсальную систему адресации для всех объектов фермы, поддерживая сложные иерархические композиции от многоуровневых стеллажей до отдельных растений, с интеграцией QR-кодов и поддержкой различных размеров поддонов и стадий развития растений.

### 1.1 Enhanced Core Responsibilities

1. **Hierarchical Object Addressing**: Полная поддержка композиций Rack→Shelf→Tray→Plant с различными конфигурациями
2. **Multi-Size Support**: Адресация для поддонов различных размеров (small, medium, large, custom)
3. **Plant Stage Integration**: Интеграция с системой стадий роста растений для точного позиционирования
4. **QR-Code Generation**: Автоматическая генерация QR-кодов для всех уровней иерархии
5. **Spatial Queries**: Advanced пространственные запросы с поддержкой PostgreSQL+PostGIS
6. **Rack Configuration Management**: Поддержка различных типов стеллажей (1-shelf, 2-shelf, 3-shelf, custom)
7. **Dynamic Space Allocation**: Динамическое распределение пространства в зависимости от размера объектов
8. **Cross-Service Integration**: Полная интеграция с Plants, Inventory, Cycle Planning сервисами

### 1.2 Address Schema Evolution

```text
Enhanced Address Format:
{FACILITY_CODE}.{ZONE_ID}.{RACK_ID}.{SHELF_INDEX}.{TRAY_POSITION}.{PLANT_SLOT}.{ENTITY_TYPE}.{ENTITY_ID}

Examples:
- FARM01.VEG-A.R-001.S-01.T-001.P-001.PLANT.BLUE-001
- FARM01.VEG-A.R-001.S-02.T-002.-.TRAY.TRAY-002
- FARM01.VEG-A.R-001.-.-.-.RACK.R-001
- FARM01.VEG-A.-.-.-.-.SENSOR.TEMP-001
```

## 2. Hierarchical Entity Model

### 2.1 Enhanced Entity Types

```typescript
// Base spatial entity with enhanced properties
interface SpatialEntity {
  id: string;
  entityType: EntityType;
  spatialAddress: string;
  coordinates: {
    x: number;
    y: number;
    z: number;
  };
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  orientation: number; // Rotation in degrees
  qrCode: string;
  parentId?: string;
  children?: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

enum EntityType {
  FACILITY = "facility",
  ZONE = "zone",
  RACK = "rack",
  SHELF = "shelf",
  TRAY = "tray",
  PLANT = "plant",
  EQUIPMENT = "equipment",
  SENSOR = "sensor",
  PRODUCT = "product",
}
```

### 2.2 Rack System Configuration

```typescript
interface RackConfiguration {
  id: string;
  type: RackType;
  shelfCount: number;
  shelfSpacing: number; // Distance between shelves in cm
  maxTrayCapacity: number; // Per shelf
  supportedTraySizes: TraySize[];
  dimensions: EntityDimensions;
  position: SpatialCoordinates;
}

enum RackType {
  SINGLE_SHELF = "1-shelf",
  DOUBLE_SHELF = "2-shelf",
  TRIPLE_SHELF = "3-shelf",
  CUSTOM = "custom",
}

interface ShelfConfiguration {
  index: number; // 1-based shelf index
  rackId: string;
  dimensions: EntityDimensions;
  maxTrays: number;
  trayPositions: TrayPosition[];
  supportedSizes: TraySize[];
}

interface TrayPosition {
  index: number; // Position on shelf
  coordinates: SpatialCoordinates;
  maxTraySize: TraySize;
  occupied: boolean;
  occupiedBy?: string; // Tray ID
}
```

### 2.3 Tray Size Management

```typescript
interface TrayConfiguration {
  id: string;
  size: TraySize;
  dimensions: EntityDimensions;
  plantCapacity: number; // Max plants per tray
  plantLayout: PlantLayout;
  rackId: string;
  shelfIndex: number;
  positionIndex: number;
}

enum TraySize {
  SMALL = "small", // 30x20 cm
  MEDIUM = "medium", // 40x30 cm
  LARGE = "large", // 50x40 cm
  CUSTOM = "custom",
}

interface PlantLayout {
  rows: number;
  columns: number;
  spacing: number; // cm between plants
  pattern: "grid" | "hexagonal" | "random";
  positions: PlantPosition[];
}

interface PlantPosition {
  index: number;
  coordinates: SpatialCoordinates; // Relative to tray
  occupied: boolean;
  occupiedBy?: string; // Plant ID
  reservedFor?: string; // For cycle planning
}
```

### 2.4 Plant Stage Integration

```typescript
interface PlantSpatialData {
  id: string;
  strain: string;
  stage: PlantStage;
  trayId: string;
  positionIndex: number;
  spatialAddress: string;
  coordinates: SpatialCoordinates;
  spaceRequirement: SpaceRequirement;
  qrCode: string;
}

enum PlantStage {
  SEEDLING = "seedling",
  VEGETATIVE = "vegetative",
  FLOWERING = "flowering",
  HARVEST = "harvest",
}

interface SpaceRequirement {
  radius: number; // Required space around plant
  height: number; // Current height
  projectedGrowth: number; // Expected size at maturity
  stage: PlantStage;
}
```

## 3. Advanced Spatial Queries

### 3.1 Enhanced Query Operations

```typescript
interface SpatialQueryService {
  // Hierarchical queries
  findAvailableRackPositions(
    criteria: RackSearchCriteria
  ): Promise<RackPosition[]>;
  findAvailableShelfSpace(
    rackId: string,
    traySize: TraySize
  ): Promise<ShelfPosition[]>;
  findAvailableTraySlots(
    trayId: string,
    plantStage: PlantStage
  ): Promise<PlantPosition[]>;

  // Capacity management
  calculateRackUtilization(rackId: string): Promise<UtilizationMetrics>;
  calculateZoneCapacity(
    zoneId: string,
    traySize: TraySize
  ): Promise<CapacityMetrics>;
  findOptimalPlacement(
    plant: PlantSpatialData
  ): Promise<PlacementRecommendation>;

  // Spatial analysis
  findNearbyEntities(
    entityId: string,
    radius: number,
    type?: EntityType
  ): Promise<SpatialEntity[]>;
  calculatePathBetweenEntities(from: string, to: string): Promise<SpatialPath>;
  validateMovement(
    entityId: string,
    newPosition: SpatialCoordinates
  ): Promise<MovementValidation>;

  // Cycle planning support
  simulatePlacement(
    placements: PlannedPlacement[]
  ): Promise<PlacementSimulation>;
  findConflicts(placements: PlannedPlacement[]): Promise<PlacementConflict[]>;
}

interface RackSearchCriteria {
  zoneId?: string;
  rackType?: RackType;
  minAvailableSpace?: number;
  supportedTraySizes?: TraySize[];
  excludeOccupied?: boolean;
}

interface UtilizationMetrics {
  rackId: string;
  totalCapacity: number;
  occupiedSlots: number;
  utilizationPercentage: number;
  availableSlots: number;
  byTraySize: Record<TraySize, number>;
  byShelf: ShelfUtilization[];
}

interface PlacementRecommendation {
  recommendedAddress: string;
  coordinates: SpatialCoordinates;
  confidence: number;
  reasons: string[];
  alternatives: AlternativePlacement[];
}
```

### 3.2 Spatial Validation System

```typescript
interface SpatialValidator {
  validateRackConfiguration(config: RackConfiguration): ValidationResult;
  validateTrayPlacement(
    trayId: string,
    rackId: string,
    shelf: number,
    position: number
  ): ValidationResult;
  validatePlantPlacement(
    plantId: string,
    trayId: string,
    position: number
  ): ValidationResult;
  validateSpatialAddress(address: string): ValidationResult;

  // Collision detection
  checkCollisions(
    entity: SpatialEntity,
    newPosition: SpatialCoordinates
  ): CollisionResult;
  validateClearance(
    entity: SpatialEntity,
    requiredClearance: number
  ): ClearanceResult;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

interface CollisionResult {
  hasCollisions: boolean;
  collidingEntities: SpatialEntity[];
  severity: "blocking" | "warning" | "info";
  resolution: CollisionResolution[];
}
```

## 4. QR Code System Enhancement

### 4.1 Hierarchical QR Codes

```typescript
interface QRCodeService {
  generateRackQR(rackId: string): Promise<QRCodeData>;
  generateTrayQR(trayId: string): Promise<QRCodeData>;
  generatePlantQR(plantId: string): Promise<QRCodeData>;

  // Batch operations
  generateHierarchicalQRs(rackId: string): Promise<HierarchicalQRSet>;
  updateQRCodesForMovement(
    entityId: string,
    newAddress: string
  ): Promise<QRUpdateResult>;

  // QR code reading
  resolveQRCode(qrCode: string): Promise<EntityResolution>;
  validateQRCode(qrCode: string): Promise<QRValidation>;
}

interface QRCodeData {
  code: string;
  entityId: string;
  entityType: EntityType;
  spatialAddress: string;
  metadata: QRMetadata;
  format: "qr" | "datamatrix" | "code128";
  imageUrl: string;
}

interface HierarchicalQRSet {
  rack: QRCodeData;
  shelves: QRCodeData[];
  trays: QRCodeData[];
  plants: QRCodeData[];
  dependencies: QRDependency[];
}

interface QRMetadata {
  createdAt: Date;
  version: string;
  checksum: string;
  parentQR?: string;
  childQRs?: string[];
  validUntil?: Date;
}
```

### 4.2 Mobile Scanning Integration

```typescript
interface MobileScanningAPI {
  // Scan operations
  recordScan(scanData: ScanRecord): Promise<ScanResult>;
  validateScanPermissions(userId: string, entityId: string): Promise<boolean>;

  // Scan history
  getScanHistory(entityId: string): Promise<ScanHistory[]>;
  getUserScanActivity(
    userId: string,
    timeRange: TimeRange
  ): Promise<ScanActivity[]>;

  // Real-time validation
  validateScanContext(scan: ScanRecord): Promise<ContextValidation>;
}

interface ScanRecord {
  qrCode: string;
  scannedBy: string;
  timestamp: Date;
  location: SpatialCoordinates;
  device: DeviceInfo;
  context: ScanContext;
}

interface ScanContext {
  operation: "move" | "inspect" | "harvest" | "maintenance";
  expectedLocation?: string;
  workOrder?: string;
  cycleId?: string;
}
```

## 5. Database Schema Enhancement

### 5.1 Enhanced PostgreSQL Schema

```sql
-- Enhanced facilities table with rack support
CREATE TABLE facilities (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    facility_code VARCHAR(10) UNIQUE NOT NULL,
    address TEXT,
    coordinates POINT,
    total_area DECIMAL(10,2),
    max_rack_capacity INTEGER,
    supported_rack_types TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced zones table
CREATE TABLE zones (
    id VARCHAR(50) PRIMARY KEY,
    facility_id VARCHAR(50) REFERENCES facilities(id),
    zone_code VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    zone_type VARCHAR(50),
    geometry POLYGON,
    max_rack_count INTEGER,
    environmental_requirements JSONB,
    UNIQUE(facility_id, zone_code)
);

-- New racks table for multi-shelf support
CREATE TABLE racks (
    id VARCHAR(50) PRIMARY KEY,
    zone_id VARCHAR(50) REFERENCES zones(id),
    rack_code VARCHAR(20) NOT NULL,
    rack_type VARCHAR(20) NOT NULL CHECK (rack_type IN ('1-shelf', '2-shelf', '3-shelf', 'custom')),
    shelf_count INTEGER NOT NULL DEFAULT 1,
    coordinates POINT NOT NULL,
    dimensions JSONB NOT NULL, -- {width, height, depth}
    orientation DECIMAL(5,2) DEFAULT 0,
    max_tray_capacity INTEGER,
    supported_tray_sizes TEXT[],
    installation_date DATE,
    qr_code VARCHAR(255) UNIQUE,
    UNIQUE(zone_id, rack_code)
);

-- New shelves table for shelf-level tracking
CREATE TABLE shelves (
    id VARCHAR(50) PRIMARY KEY,
    rack_id VARCHAR(50) REFERENCES racks(id),
    shelf_index INTEGER NOT NULL,
    height_from_floor DECIMAL(8,2),
    max_trays INTEGER,
    tray_positions JSONB, -- Array of position configs
    occupied_positions INTEGER DEFAULT 0,
    CHECK (shelf_index > 0)
);

-- Enhanced trays table with size support
CREATE TABLE trays (
    id VARCHAR(50) PRIMARY KEY,
    rack_id VARCHAR(50) REFERENCES racks(id),
    shelf_index INTEGER,
    position_index INTEGER,
    tray_code VARCHAR(30) NOT NULL,
    tray_size VARCHAR(20) NOT NULL CHECK (tray_size IN ('small', 'medium', 'large', 'custom')),
    dimensions JSONB NOT NULL,
    plant_capacity INTEGER,
    plant_layout JSONB, -- Grid configuration
    coordinates POINT,
    occupied_slots INTEGER DEFAULT 0,
    qr_code VARCHAR(255) UNIQUE,
    UNIQUE(rack_id, shelf_index, position_index)
);

-- Enhanced plants table with position tracking
CREATE TABLE plants (
    id VARCHAR(50) PRIMARY KEY,
    tray_id VARCHAR(50) REFERENCES trays(id),
    plant_slot INTEGER,
    plant_code VARCHAR(50) UNIQUE NOT NULL,
    strain VARCHAR(100),
    stage VARCHAR(20) CHECK (stage IN ('seedling', 'vegetative', 'flowering', 'harvest')),
    coordinates POINT, -- Absolute coordinates
    relative_position JSONB, -- Position within tray
    space_requirement JSONB, -- Current space needs
    qr_code VARCHAR(255) UNIQUE,
    planted_date DATE,
    expected_harvest DATE
);

-- Enhanced spatial addresses table
CREATE TABLE spatial_addresses (
    entity_id VARCHAR(50) PRIMARY KEY,
    entity_type VARCHAR(20) NOT NULL,
    spatial_address VARCHAR(200) UNIQUE NOT NULL,
    facility_code VARCHAR(10) NOT NULL,
    zone_code VARCHAR(20),
    rack_code VARCHAR(20),
    shelf_index INTEGER,
    tray_position INTEGER,
    plant_slot INTEGER,
    coordinates POINT,
    address_components JSONB,
    qr_code VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- New table for tracking rack configurations
CREATE TABLE rack_configurations (
    id VARCHAR(50) PRIMARY KEY,
    rack_type VARCHAR(20) NOT NULL,
    shelf_count INTEGER NOT NULL,
    shelf_spacing DECIMAL(6,2), -- cm between shelves
    standard_dimensions JSONB,
    max_tray_capacity INTEGER,
    supported_sizes TEXT[],
    configuration_name VARCHAR(100),
    is_standard BOOLEAN DEFAULT true
);

-- Enhanced indexes for spatial queries
CREATE INDEX idx_plants_coordinates ON plants USING GIST (coordinates);
CREATE INDEX idx_trays_coordinates ON trays USING GIST (coordinates);
CREATE INDEX idx_racks_coordinates ON racks USING GIST (coordinates);
CREATE INDEX idx_spatial_addresses_composite ON spatial_addresses (facility_code, zone_code, rack_code, shelf_index);
CREATE INDEX idx_plants_stage ON plants (stage);
CREATE INDEX idx_trays_size ON trays (tray_size);
CREATE INDEX idx_racks_type ON racks (rack_type);
```

### 5.2 Spatial Indexing Strategy

```sql
-- Advanced spatial indexes for complex queries
CREATE INDEX idx_zone_geometry ON zones USING GIST (geometry);
CREATE INDEX idx_facility_coordinates ON facilities USING GIST (coordinates);

-- Composite indexes for hierarchical queries
CREATE INDEX idx_rack_shelf_tray ON trays (rack_id, shelf_index, position_index);
CREATE INDEX idx_plant_hierarchy ON plants (tray_id, plant_slot);
CREATE INDEX idx_address_hierarchy ON spatial_addresses (facility_code, zone_code, rack_code, shelf_index, tray_position);

-- Performance indexes for capacity queries
CREATE INDEX idx_rack_utilization ON racks (zone_id, rack_type, max_tray_capacity);
CREATE INDEX idx_tray_occupancy ON trays (rack_id, tray_size, occupied_slots, plant_capacity);
CREATE INDEX idx_shelf_capacity ON shelves (rack_id, shelf_index, max_trays, occupied_positions);
```

## 6. API Specifications Enhancement

### 6.1 Hierarchical Entity Management APIs

```typescript
// Rack Management
interface RackManagementAPI {
  // CRUD operations
  createRack(data: CreateRackRequest): Promise<RackEntity>;
  updateRackConfiguration(
    rackId: string,
    config: RackConfiguration
  ): Promise<RackEntity>;
  deleteRack(rackId: string): Promise<void>;

  // Queries
  getRacksByZone(zoneId: string): Promise<RackEntity[]>;
  getRackConfiguration(rackId: string): Promise<RackConfiguration>;
  findAvailableRacks(criteria: RackSearchCriteria): Promise<RackEntity[]>;

  // Capacity management
  getRackUtilization(rackId: string): Promise<UtilizationMetrics>;
  calculateOptimalRackPlacement(
    zoneId: string,
    rackType: RackType
  ): Promise<PlacementRecommendation>;
}

// Tray Management
interface TrayManagementAPI {
  // CRUD operations
  createTray(data: CreateTrayRequest): Promise<TrayEntity>;
  moveTray(trayId: string, newPosition: TrayPosition): Promise<MovementResult>;
  deleteTray(trayId: string): Promise<void>;

  // Queries
  getTraysByRack(rackId: string): Promise<TrayEntity[]>;
  findAvailableTraySlots(criteria: TraySearchCriteria): Promise<TrayPosition[]>;
  getTrayOccupancy(trayId: string): Promise<OccupancyStatus>;

  // Validation
  validateTrayPlacement(placement: TrayPlacement): Promise<ValidationResult>;
}

// Plant Positioning
interface PlantPositioningAPI {
  // Plant placement
  placePlant(
    plantId: string,
    position: PlantPosition
  ): Promise<PlacementResult>;
  movePlant(
    plantId: string,
    newPosition: PlantPosition
  ): Promise<MovementResult>;
  harvestPlant(plantId: string): Promise<HarvestResult>;

  // Queries
  getPlantsByTray(trayId: string): Promise<PlantEntity[]>;
  findAvailablePlantSlots(
    trayId: string,
    stage: PlantStage
  ): Promise<PlantPosition[]>;
  getPlantNeighbors(plantId: string, radius: number): Promise<PlantEntity[]>;

  // Batch operations
  batchPlantPlacement(placements: PlantPlacement[]): Promise<BatchResult>;
  optimizePlantLayout(trayId: string): Promise<LayoutOptimization>;
}
```

### 6.2 Spatial Query APIs

```typescript
// Advanced spatial queries
interface AdvancedSpatialAPI {
  // Proximity queries
  findEntitiesInRadius(
    center: SpatialCoordinates,
    radius: number,
    filters?: EntityFilter
  ): Promise<ProximityResult>;

  // Path and distance
  calculateShortestPath(from: string, to: string): Promise<SpatialPath>;
  measureDistance(from: string, to: string): Promise<DistanceMeasurement>;

  // Area queries
  getEntitiesInArea(
    area: BoundingBox,
    entityTypes?: EntityType[]
  ): Promise<AreaQueryResult>;
  findEmptySpaces(area: BoundingBox, minSize: number): Promise<EmptySpace[]>;

  // Capacity analysis
  analyzeZoneCapacity(zoneId: string): Promise<CapacityAnalysis>;
  projectCapacityGrowth(
    zoneId: string,
    timeframe: number
  ): Promise<GrowthProjection>;

  // Optimization
  optimizeEntityPlacement(
    entities: EntityPlacement[]
  ): Promise<OptimizationResult>;
  suggestReorganization(zoneId: string): Promise<ReorganizationPlan>;
}

interface ProximityResult {
  center: SpatialCoordinates;
  radius: number;
  entities: ProximityEntity[];
  count: number;
  averageDistance: number;
}

interface SpatialPath {
  from: string;
  to: string;
  waypoints: SpatialCoordinates[];
  totalDistance: number;
  estimatedTime: number;
  obstacles: Obstacle[];
}

interface CapacityAnalysis {
  zoneId: string;
  currentUtilization: number;
  maxCapacity: number;
  availableSpace: number;
  bottlenecks: Bottleneck[];
  recommendations: CapacityRecommendation[];
}
```

## 7. Cycle Planning Integration

### 7.1 Future Placement Simulation

```typescript
interface CyclePlanningIntegration {
  // Scenario planning
  createPlacementScenario(scenario: PlacementScenario): Promise<ScenarioResult>;
  simulateGrowthCycle(cycleId: string): Promise<GrowthSimulation>;
  validateCyclePlan(plan: CyclePlan): Promise<PlanValidation>;

  // Resource allocation
  reserveSpaceForCycle(
    cycleId: string,
    requirements: SpaceRequirement[]
  ): Promise<ReservationResult>;
  optimizeCyclePlacement(cycle: CyclePlan): Promise<OptimizedPlan>;

  // Conflict resolution
  detectCyclePlacementConflicts(cycles: CyclePlan[]): Promise<ConflictReport>;
  resolvePlacementConflicts(
    conflicts: PlacementConflict[]
  ): Promise<ConflictResolution>;
}

interface PlacementScenario {
  id: string;
  cycleId: string;
  plannedPlacements: PlannedPlacement[];
  timeframe: DateRange;
  requirements: CycleRequirement[];
}

interface PlannedPlacement {
  plantId: string;
  strain: string;
  stage: PlantStage;
  targetPosition: PlantPosition;
  placementDate: Date;
  expectedHarvest: Date;
  spaceRequirements: SpaceRequirement[];
}

interface GrowthSimulation {
  cycleId: string;
  timeline: GrowthPhase[];
  spaceUtilization: UtilizationTimeline;
  potentialConflicts: FutureConflict[];
  recommendations: GrowthRecommendation[];
}
```

### 7.2 Dynamic Space Allocation

```typescript
interface DynamicSpaceAllocation {
  // Real-time allocation
  allocateSpaceForPlant(
    plant: PlantEntity,
    requirements: SpaceRequirement
  ): Promise<AllocationResult>;
  deallocateSpace(entityId: string): Promise<DeallocationResult>;

  // Predictive allocation
  predictSpaceNeeds(
    plantId: string,
    daysAhead: number
  ): Promise<SpacePrediction>;
  optimizeSpaceUsage(zoneId: string): Promise<SpaceOptimization>;

  // Monitoring
  trackSpaceUtilization(zoneId: string): Promise<UtilizationMetrics>;
  alertOnSpaceShortage(
    zoneId: string,
    threshold: number
  ): Promise<SpaceAlert[]>;
}

interface SpacePrediction {
  plantId: string;
  currentSpace: number;
  predictedSpace: number;
  growthRate: number;
  criticalDate?: Date;
  recommendations: SpaceRecommendation[];
}
```

## 8. Mobile Integration and QR Scanning

### 8.1 Mobile Worker Interface

```typescript
interface MobileWorkerAPI {
  // Scanning operations
  scanQRCode(qrCode: string, context: ScanContext): Promise<ScanResult>;
  validateScanLocation(scan: ScanRecord): Promise<LocationValidation>;

  // Plant operations
  reportPlantStatus(
    plantId: string,
    status: PlantStatus
  ): Promise<StatusUpdate>;
  recordPlantMeasurement(
    plantId: string,
    measurements: PlantMeasurement
  ): Promise<MeasurementResult>;

  // Movement operations
  initiatePlantMove(
    plantId: string,
    targetLocation: string
  ): Promise<MoveInitiation>;
  confirmMovement(
    moveId: string,
    finalLocation: SpatialCoordinates
  ): Promise<MoveConfirmation>;

  // Maintenance
  reportEquipmentIssue(
    equipmentId: string,
    issue: EquipmentIssue
  ): Promise<MaintenanceTicket>;
  performMaintenance(
    taskId: string,
    results: MaintenanceResult
  ): Promise<TaskCompletion>;
}

interface ScanResult {
  success: boolean;
  entity: SpatialEntity;
  expectedVsActual: LocationComparison;
  permissions: OperationPermission[];
  availableActions: WorkerAction[];
  warnings: ScanWarning[];
}

interface LocationValidation {
  accurate: boolean;
  expectedLocation: SpatialCoordinates;
  actualLocation: SpatialCoordinates;
  deviation: number;
  acceptable: boolean;
  correctionRequired: boolean;
}
```

### 8.2 Real-time Position Tracking

```typescript
interface PositionTrackingService {
  // Worker tracking
  trackWorkerPosition(
    workerId: string,
    position: SpatialCoordinates
  ): Promise<void>;
  getWorkerLocation(workerId: string): Promise<WorkerLocation>;

  // Asset tracking
  trackAssetMovement(
    assetId: string,
    from: string,
    to: string
  ): Promise<MovementRecord>;
  getAssetLocation(assetId: string): Promise<AssetLocation>;

  // Analytics
  generateMovementReport(
    entityId: string,
    timeRange: DateRange
  ): Promise<MovementReport>;
  analyzeWorkflowEfficiency(zoneId: string): Promise<EfficiencyMetrics>;
}
```

## 9. Performance Optimization

### 9.1 Caching Strategy

```typescript
interface CachingStrategy {
  // Spatial data caching
  cacheZoneLayout(zoneId: string): Promise<void>;
  cacheRackConfiguration(rackId: string): Promise<void>;
  cachePlantPositions(trayId: string): Promise<void>;

  // Query result caching
  cacheCapacityMetrics(zoneId: string, ttl: number): Promise<void>;
  cacheProximityQueries(
    center: SpatialCoordinates,
    radius: number
  ): Promise<void>;

  // Cache invalidation
  invalidateEntityCache(entityId: string): Promise<void>;
  invalidateHierarchyCache(parentId: string): Promise<void>;
}
```

### 9.2 Spatial Indexing Optimization

```sql
-- Advanced spatial indexing for performance
CREATE INDEX CONCURRENTLY idx_spatial_addresses_btree
ON spatial_addresses USING btree (facility_code, zone_code, rack_code)
WHERE entity_type IN ('plant', 'tray');

CREATE INDEX CONCURRENTLY idx_plants_spatial_composite
ON plants USING gist (coordinates)
INCLUDE (stage, strain, tray_id);

CREATE INDEX CONCURRENTLY idx_rack_capacity_analysis
ON racks (zone_id, rack_type, max_tray_capacity)
INCLUDE (coordinates, supported_tray_sizes);

-- Partitioning for large datasets
CREATE TABLE plants_partitioned (
    LIKE plants INCLUDING ALL
) PARTITION BY HASH (tray_id);

CREATE TABLE plants_partition_1 PARTITION OF plants_partitioned
FOR VALUES WITH (modulus 4, remainder 0);
```

## 10. Event Integration

### 10.1 Kafka Event Producers

```typescript
interface SpatialEventProducer {
  // Entity lifecycle events
  publishEntityCreated(entity: SpatialEntity): Promise<void>;
  publishEntityMoved(entityId: string, from: string, to: string): Promise<void>;
  publishEntityRemoved(entityId: string): Promise<void>;

  // Capacity events
  publishCapacityChange(
    zoneId: string,
    metrics: UtilizationMetrics
  ): Promise<void>;
  publishSpaceAllocation(allocation: SpaceAllocation): Promise<void>;

  // QR code events
  publishQRCodeScanned(scan: ScanRecord): Promise<void>;
  publishQRCodeGenerated(qrCode: QRCodeData): Promise<void>;
}
```

### 10.2 Event Schema

```typescript
interface SpatialEvent {
  eventId: string;
  eventType: SpatialEventType;
  timestamp: Date;
  entityId: string;
  entityType: EntityType;
  data: Record<string, any>;
  metadata: EventMetadata;
}

enum SpatialEventType {
  ENTITY_CREATED = "entity.created",
  ENTITY_MOVED = "entity.moved",
  ENTITY_REMOVED = "entity.removed",
  SPACE_ALLOCATED = "space.allocated",
  SPACE_DEALLOCATED = "space.deallocated",
  QR_SCANNED = "qr.scanned",
  CAPACITY_CHANGED = "capacity.changed",
}
```

## 11. Compliance and Audit

### 11.1 Chain of Custody Tracking

```typescript
interface ChainOfCustodyTracking {
  // Movement tracking
  recordMovement(movement: MovementRecord): Promise<void>;
  getMovementHistory(entityId: string): Promise<MovementHistory>;

  // Custody chain
  establishCustody(entityId: string, custodian: string): Promise<CustodyRecord>;
  transferCustody(
    entityId: string,
    from: string,
    to: string
  ): Promise<CustodyTransfer>;

  // Audit trail
  generateAuditTrail(entityId: string): Promise<AuditTrail>;
  validateCustodyChain(entityId: string): Promise<CustodyValidation>;
}
```

### 11.2 Regulatory Compliance

```typescript
interface RegulatoryCompliance {
  // GACP compliance
  validateGACPRequirements(entityId: string): Promise<ComplianceCheck>;
  generateComplianceReport(
    zoneId: string,
    period: DateRange
  ): Promise<ComplianceReport>;

  // Documentation
  generateLocationCertificate(entityId: string): Promise<LocationCertificate>;
  createSpatialDocumentation(entityId: string): Promise<SpatialDocumentation>;
}
```

## 12. Testing Strategy

### 12.1 Spatial Logic Testing

```typescript
describe("Enhanced Spatial Addressing", () => {
  it("should handle complex rack configurations", async () => {
    const rackConfig: RackConfiguration = {
      id: "R-001",
      type: RackType.TRIPLE_SHELF,
      shelfCount: 3,
      shelfSpacing: 50,
      maxTrayCapacity: 12,
      supportedTraySizes: [TraySize.SMALL, TraySize.MEDIUM],
      dimensions: { width: 200, height: 150, depth: 60 },
      position: { x: 100, y: 200, z: 0 },
    };

    const result = await spatialService.createRack(rackConfig);
    expect(result.shelves).toHaveLength(3);
    expect(result.totalCapacity).toBe(36); // 3 shelves * 12 trays
  });

  it("should validate plant placement in tray slots", async () => {
    const placement: PlantPlacement = {
      plantId: "PLANT-001",
      trayId: "TRAY-001",
      slotIndex: 5,
      expectedGrowth: PlantStage.FLOWERING,
    };

    const validation = await spatialService.validatePlantPlacement(placement);
    expect(validation.valid).toBe(true);
    expect(validation.spatialAddress).toMatch(
      /FARM01\.VEG-A\.R-001\.S-01\.T-001\.P-005\.PLANT\.PLANT-001/
    );
  });
});
```

### 12.2 Performance Testing

```typescript
describe("Spatial Query Performance", () => {
  it("should handle large-scale proximity queries efficiently", async () => {
    const startTime = Date.now();

    const results = await spatialService.findEntitiesInRadius(
      { x: 500, y: 500, z: 0 },
      50,
      { entityTypes: [EntityType.PLANT], limit: 1000 }
    );

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    expect(queryTime).toBeLessThan(100); // Should complete in under 100ms
    expect(results.entities).toHaveLength(1000);
  });
});
```

Эта расширенная спецификация полностью интегрирует все архитектурные инсайты из анализа 3DFrontend.md и готова для реализации сложной системы пространственной адресации с поддержкой иерархических композиций и интеграции с визуализацией.
