---
title: "WHO Guidelines on Good Agricultural and Collection Practices (GACP)"
version: "WHO Technical Report Series 1025 (2020)"
status: "active"
last_updated: "2025-10-15"
regulatory_authority: "World Health Organization (WHO)"
scope: "Cultivation, collection, and primary processing of medicinal plants"
related_standards: "EU GMP Annex 11, EMA GACP, ISO 22000, ISO 22716"
---

# WHO Guidelines on Good Agricultural and Collection Practices (GACP)

## 1. Executive Summary

**WHO GACP Guidelines** (2020 revision) устанавливают международные стандарты для культивации, сбора и первичной обработки лекарственных растений, включая медицинскую каннабис. Документ обеспечивает качество, безопасность и подлинность растительного сырья.

### 1.1 Core Principles

```yaml
GACP_Fundamentals:
  quality_assurance:
    - Identity verification (видовая идентификация)
    - Consistent quality (uniform cannabinoid profiles)
    - Freedom from contamination (pesticides, heavy metals, microbes)
    - Traceability (seed to sale)
    
  good_practices:
    - Site selection and management
    - Seed/propagation material control
    - Cultivation operations
    - Harvesting procedures
    - Post-harvest processing
    - Storage and transport
    
  documentation:
    - Standard Operating Procedures
    - Batch production records
    - Personnel training records
    - Equipment maintenance logs
    - Quality control test results
```

### 1.2 Applicability to Medical Cannabis

**GACP-ERP Scope:**

```yaml
Cannabis_Cultivation_Lifecycle:
  propagation:
    - Seed banking
    - Mother plant management
    - Cloning operations
    - Tissue culture (optional)
    
  vegetative_growth:
    - Transplanting
    - Environmental control (light, temp, humidity)
    - Nutrient management
    - Pest/disease monitoring
    - Growth monitoring
    
  flowering:
    - Light cycle management
    - Cannabinoid development
    - Trichome maturity assessment
    - Environmental optimization
    
  harvest:
    - Timing determination
    - Cutting procedures
    - Initial drying
    - Batch documentation
    
  post_harvest:
    - Drying (temperature, humidity, duration)
    - Curing (jar/container curing)
    - Trimming (wet or dry)
    - Packaging
    - Labeling
    
  storage:
    - Climate control
    - Light protection
    - Contamination prevention
    - Inventory tracking
```

## 2. Site Selection and Management (WHO GACP Section 3)

### 2.1 Site Selection Criteria

**WHO Requirement:**
> "The cultivation site should be selected considering ecological conditions, environmental pollution, and accessibility."

#### 2.1.1 Environmental Assessment

**GACP-ERP Site Management:**

```yaml
Site_Selection_Factors:
  environmental:
    soil_quality:
      - pH: 6.0-7.0 (cannabis optimal)
      - Drainage: adequate
      - Contamination: tested for heavy metals
      - Organic matter: >3%
    
    water_source:
      - Potability: tested quarterly
      - Heavy metals: below WHO limits
      - Microbial load: <500 CFU/ml
      - Pesticide residues: none detected
    
    air_quality:
      - Distance from pollution sources: >5 km
      - VOC monitoring: continuous
      - Particulate matter: within limits
    
  climate:
    temperature_range: "18-28°C (optimal)"
    humidity_range: "40-60% (vegetative), 40-50% (flowering)"
    light_availability: "18/6 (veg), 12/12 (flower)"
    
  security:
    physical_barriers: "Fence, surveillance, access control"
    monitoring: "24/7 CCTV, alarm systems"
    access_logs: "Electronic badge system"
```

#### 2.1.2 Site Documentation

**Required Records:**

```typescript
interface SiteQualificationRecord {
  siteId: string;
  siteName: string;
  location: GeoCoordinates;
  
  // Environmental assessment
  soilAnalysis: {
    testDate: Date;
    laboratory: string;
    results: {
      pH: number;
      organicMatter: number;
      heavyMetals: HeavyMetalsPanel;
      nutrients: NutrientPanel;
    };
  };
  
  waterAnalysis: {
    testDate: Date;
    laboratory: string;
    results: {
      potability: 'POTABLE' | 'NON_POTABLE';
      heavyMetals: HeavyMetalsPanel;
      microbes: MicrobialPanel;
      pesticides: PesticidePanel;
    };
  };
  
  // Qualification
  qualificationStatus: 'QUALIFIED' | 'NOT_QUALIFIED';
  qualificationDate: Date;
  qualifiedBy: string;
  requalificationDue: Date;
  
  // Approvals
  approvals: {
    environmentalOfficer: ElectronicSignature;
    qualityManager: ElectronicSignature;
  };
}
```

### 2.2 Site Maintenance

**Ongoing Monitoring:**

```yaml
Site_Monitoring_Schedule:
  daily:
    - Visual inspection (pests, contamination)
    - Environmental parameters (temp, humidity)
    - Security systems check
    
  weekly:
    - Pest traps inspection
    - Equipment functionality
    - Sanitation verification
    
  monthly:
    - Water quality testing
    - HVAC filter replacement/cleaning
    - Calibration verification
    
  quarterly:
    - Soil testing (if applicable)
    - Comprehensive environmental audit
    - Pest control effectiveness
    
  annually:
    - Site requalification
    - Regulatory compliance audit
    - Infrastructure integrity assessment
```

## 3. Seed and Propagation Material (WHO GACP Section 4)

### 3.1 Seed/Clone Selection

**WHO Requirement:**
> "Seeds and propagation material should be of identified botanical species and variety, free from pests and diseases."

#### 3.1.1 Mother Plant Management

**Genetic Stability Protocol:**

```yaml
Mother_Plant_Program:
  selection_criteria:
    - Verified genetics (DNA fingerprinting)
    - Disease-free status (visual + lab testing)
    - Desired cannabinoid profile (COA verified)
    - Vigor and productivity
    - Stable characteristics
    
  maintenance:
    - Vegetative photoperiod (18/6)
    - Optimal nutrition (low N, balanced NPK)
    - Pest/disease monitoring (weekly)
    - Clone rotation (max 12 months)
    - Replacement schedule (annual)
    
  documentation:
    - Mother plant ID (unique)
    - Genetics source (COA, lab report)
    - Health status log
    - Clone production log
    - Replacement history
```

#### 3.1.2 Cloning Operations

**SOP Compliance:**

```typescript
// Clone production with full traceability
interface CloneProductionRecord {
  cloneId: string;                    // Unique identifier
  motherPlantId: string;              // Source traceability
  
  // Production details
  cloningDate: Date;
  cloningMethod: 'CUTTING' | 'TISSUE_CULTURE';
  performedBy: string;
  
  // Rooting phase
  rootingMedium: string;
  rootingHormone?: string;
  rootingDuration: number;            // Days
  rootingSuccess: boolean;
  
  // Health verification
  visualInspection: {
    date: Date;
    inspector: string;
    pestsDetected: boolean;
    diseasesDetected: boolean;
    vigorRating: 1 | 2 | 3 | 4 | 5;  // 5 = excellent
  };
  
  // Transfer to production
  transplantDate?: Date;
  facilityId?: string;
  roomId?: string;
  
  // Status tracking
  status: 'ROOTING' | 'READY' | 'TRANSPLANTED' | 'DISCARDED';
  discardReason?: string;
}
```

**Documentation:**

- 📋 See `SOP_Germination.md` for propagation procedures

### 3.2 Seed Banking (If Applicable)

**Seed Storage Requirements:**

```yaml
Seed_Bank_Conditions:
  storage_environment:
    temperature: "4°C ± 2°C"
    humidity: "30-40% RH"
    light: "Dark"
    atmosphere: "Nitrogen or vacuum sealed"
    
  documentation:
    - Seed lot number
    - Botanical identification
    - Collection date
    - Viability test results
    - Storage date
    - Expiry date
    
  viability_testing:
    frequency: "Annual"
    method: "Germination test (ISTA standard)"
    acceptance: ">80% germination"
```

## 4. Cultivation Operations (WHO GACP Section 5)

### 4.1 Growing Conditions

**WHO Requirement:**
> "Cultivation should follow documented procedures designed to ensure consistent quality and yield."

#### 4.1.1 Environmental Control

**Cannabis-Specific Parameters:**

```yaml
Growth_Stage_Parameters:
  vegetative_stage:
    photoperiod: "18 hours light / 6 hours dark"
    temperature:
      day: "24-28°C"
      night: "18-22°C"
    humidity: "50-70% RH"
    co2: "1000-1500 ppm"
    air_circulation: "Continuous, 0.5-1.0 m/s"
    
  flowering_stage:
    photoperiod: "12 hours light / 12 hours dark"
    temperature:
      day: "22-26°C"
      night: "18-22°C"
    humidity:
      early_flower: "50-60% RH"
      mid_flower: "45-55% RH"
      late_flower: "40-50% RH"
    co2: "1200-1500 ppm"
    air_circulation: "Continuous, 0.5-1.0 m/s"
```

#### 4.1.2 Nutrient Management

**Feeding Protocol:**

```typescript
interface NutrientSchedule {
  growthStage: 'SEEDLING' | 'VEGETATIVE' | 'EARLY_FLOWER' | 'MID_FLOWER' | 'LATE_FLOWER' | 'FLUSH';
  
  // NPK ratios
  nitrogen: number;     // ppm
  phosphorus: number;   // ppm
  potassium: number;    // ppm
  
  // Secondary nutrients
  calcium: number;
  magnesium: number;
  sulfur: number;
  
  // Micronutrients
  iron: number;
  manganese: number;
  zinc: number;
  copper: number;
  boron: number;
  molybdenum: number;
  
  // pH and EC
  pH: {
    target: number;
    min: number;
    max: number;
  };
  ec: {
    target: number;    // mS/cm
    min: number;
    max: number;
  };
  
  // Feeding frequency
  frequency: string;   // e.g., "Daily", "Every 2 days"
  volume: number;      // Liters per plant
}

// Example: Vegetative stage feeding
const vegetativeNutrients: NutrientSchedule = {
  growthStage: 'VEGETATIVE',
  nitrogen: 200,
  phosphorus: 100,
  potassium: 150,
  calcium: 150,
  magnesium: 75,
  sulfur: 50,
  iron: 3,
  manganese: 1,
  zinc: 0.5,
  copper: 0.3,
  boron: 0.5,
  molybdenum: 0.1,
  pH: { target: 6.0, min: 5.8, max: 6.2 },
  ec: { target: 1.8, min: 1.6, max: 2.0 },
  frequency: 'Daily',
  volume: 1.5
};
```

### 4.2 Pest and Disease Management

**Integrated Pest Management (IPM):**

```yaml
IPM_Strategy:
  prevention:
    - Site sanitation (daily cleaning)
    - Positive air pressure in grow rooms
    - HEPA filtration
    - Personnel hygiene (gowning, hand washing)
    - Equipment sterilization
    - Quarantine for new materials
    
  monitoring:
    - Visual inspection (daily)
    - Sticky traps (weekly count)
    - Microscopic examination (as needed)
    - Environmental monitoring (pests thrive in specific conditions)
    
  control_methods:
    biological:
      - Beneficial insects (ladybugs, predatory mites)
      - Bacillus thuringiensis (Bt)
      - Neem oil
      - Insecticidal soaps
    
    physical:
      - Manual removal
      - Water spray
      - Pruning infected material
      - UV-C sterilization
    
    chemical:
      - Only WHO-approved pesticides
      - Pre-harvest interval (PHI) compliance
      - Residue testing mandatory
      - Documentation required
    
  prohibited:
    - Systemic pesticides during flowering
    - Unapproved chemicals
    - Any pesticide within 14 days of harvest
```

**Documentation:**

- 📋 Pest monitoring logs
- 📋 Treatment records
- 📋 Pesticide COAs

### 4.3 Water Management

**Irrigation Control:**

```yaml
Irrigation_System:
  water_source:
    - Municipal water (treated)
    - Well water (tested quarterly)
    - Reverse osmosis (optional)
    
  quality_parameters:
    pH: "6.0-7.0"
    EC: "<0.5 mS/cm (before nutrients)"
    microbes: "<100 CFU/100ml"
    heavy_metals: "WHO limits"
    chlorine: "<1 ppm"
    
  delivery_method:
    - Drip irrigation (preferred)
    - Flood and drain
    - Hand watering (small scale)
    
  monitoring:
    - Flow rate (continuous)
    - Volume delivered (per plant)
    - Runoff EC/pH (daily)
    - Leachate testing (weekly)
```

## 5. Harvesting (WHO GACP Section 6)

### 5.1 Harvest Timing

**WHO Requirement:**
> "Harvesting should be carried out at the appropriate stage of maturity to ensure optimal quality."

#### 5.1.1 Maturity Assessment

**Cannabis-Specific Indicators:**

```yaml
Harvest_Readiness_Criteria:
  visual_indicators:
    - Pistil color: "70-90% brown/amber"
    - Trichome color: "70-90% cloudy, 10-30% amber"
    - Leaf color: "Yellowing/senescence"
    
  cannabinoid_profile:
    - THC content: "At target % (strain-dependent)"
    - CBD content: "At target % (strain-dependent)"
    - CBN content: "<1% (avoid degradation)"
    
  microscopic_examination:
    - Trichome head intact
    - Trichome stalk filled
    - No signs of mold/disease
    
  environmental_factors:
    - Final flush complete (5-7 days)
    - No recent pesticide application (>14 days)
    - Optimal humidity for harvest (40-50%)
```

#### 5.1.2 Harvest Procedure

**Step-by-Step Protocol:**

```typescript
interface HarvestRecord {
  harvestId: string;
  batchId: string;
  
  // Harvest execution
  harvestDate: Date;
  harvestTime: string;
  harvestedBy: string[];
  supervisedBy: string;
  
  // Pre-harvest
  finalFlushDate: Date;
  lastPesticideApplication?: Date;
  preHarvestInspection: {
    inspector: string;
    pestsDetected: boolean;
    moldDetected: boolean;
    approved: boolean;
  };
  
  // Harvest details
  plantIds: string[];                  // All plants in harvest
  totalPlantCount: number;
  estimatedWetWeight: number;          // kg
  
  // Environmental conditions
  roomTemperature: number;
  roomHumidity: number;
  
  // Processing
  cuttingMethod: 'WHOLE_PLANT' | 'BRANCH_BY_BRANCH';
  hangingLocation: string;             // Drying room ID
  hangingStartTime: string;
  
  // Quality notes
  visualQuality: 1 | 2 | 3 | 4 | 5;   // 5 = excellent
  trichomeDensity: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  aromaNotes: string[];
  defects?: string[];
  
  // Approvals
  approvedBy: ElectronicSignature;
}
```

**Documentation:**

- 📋 See `SOP_Harvest.md` for detailed procedures

### 5.2 Harvest Personnel

**Training Requirements:**

```yaml
Harvester_Competencies:
  required_training:
    - "GACP Principles" (4 hours)
    - "Cannabis Harvesting Procedures" (8 hours)
    - "Hygiene and Sanitation" (2 hours)
    - "Quality Identification" (4 hours)
    - "Safety and PPE" (2 hours)
    
  practical_assessment:
    - Trichome microscopy
    - Proper cutting technique
    - Defect identification
    - Handling procedures
    
  retraining:
    frequency: "Annual"
    additional: "After any SOP change"
```

## 6. Post-Harvest Processing (WHO GACP Section 7)

### 6.1 Drying

**WHO Requirement:**
> "Drying should be carried out under controlled conditions to prevent degradation and contamination."

#### 6.1.1 Drying Parameters

**Cannabis Drying Protocol:**

```yaml
Drying_Conditions:
  phase_1_initial_dry:
    duration: "7-10 days"
    temperature: "18-22°C"
    humidity: "50-60% RH"
    air_circulation: "Gentle, indirect"
    light: "Dark"
    
  phase_2_final_dry:
    duration: "3-5 days"
    temperature: "18-20°C"
    humidity: "55-62% RH"
    air_circulation: "Minimal"
    light: "Dark"
    
  target_moisture:
    stems_snap: "Yes"
    moisture_content: "10-12% (w/w)"
    water_activity: "<0.65 aw"
    
  monitoring:
    temperature: "Continuous (every 15 min)"
    humidity: "Continuous (every 15 min)"
    visual_inspection: "Daily"
    moisture_testing: "Daily (after day 5)"
```

#### 6.1.2 Drying Room Management

**Environmental Control:**

```typescript
interface DryingRoomLog {
  roomId: string;
  date: Date;
  shift: 'DAY' | 'NIGHT';
  
  // Environmental readings
  temperature: number;        // °C
  humidity: number;           // %
  airflow: number;            // m/s
  
  // Visual inspection
  inspector: string;
  mold Detected: boolean;
  pestDetected: boolean;
  discoloration: boolean;
  aromaNotes: string;
  
  // Material tracking
  batchesInRoom: string[];
  daysInDrying: { [batchId: string]: number };
  
  // Actions taken
  adjustmentsMade?: string;
  issuesReported?: string;
  
  // Signature
  verifiedBy: string;
}
```

**Documentation:**

- 📋 See `SOP_DryingCuring.md` for detailed procedures

### 6.2 Curing (Optional but Recommended)

**Curing Process:**

```yaml
Curing_Protocol:
  container_selection:
    material: "Glass jars or food-grade plastic totes"
    size: "Appropriate for batch size"
    seal: "Airtight"
    
  initial_cure:
    duration: "2-4 weeks"
    temperature: "18-20°C"
    humidity_target: "60-62% RH"
    burping_schedule:
      week_1: "Daily (15 min)"
      week_2: "Every 2 days (15 min)"
      week_3_4: "Every 3-4 days (15 min)"
    
  extended_cure:
    duration: "4-8 weeks (optional)"
    temperature: "18-20°C"
    humidity_target: "60-62% RH"
    monitoring: "Weekly"
    
  quality_improvement:
    - Chlorophyll breakdown (smoother taste)
    - Terpene development (enhanced aroma)
    - Cannabinoid stability
    - Moisture equilibration
```

### 6.3 Trimming

**Trimming Options:**

```yaml
Trimming_Methods:
  wet_trim:
    timing: "Immediately after harvest"
    advantages:
      - Faster drying
      - Easier to trim
      - Uniform appearance
    disadvantages:
      - Terpene loss
      - Harsher taste
      - Lower bag appeal
    
  dry_trim:
    timing: "After drying (7-10 days)"
    advantages:
      - Better terpene retention
      - Smoother taste
      - Enhanced bag appeal
    disadvantages:
      - Slower process
      - More difficult
      - Leaf protection during dry
    
  machine_trim:
    equipment: "Commercial trimming machine"
    suitable_for: "Large-scale operations"
    considerations:
      - Trichome damage risk
      - Consistency
      - Speed vs. quality
    
  hand_trim:
    equipment: "Scissors, trimmers"
    suitable_for: "Small to medium scale"
    considerations:
      - Labor intensive
      - Highest quality
      - Flexibility
```

## 7. Storage and Distribution (WHO GACP Section 8)

### 7.1 Storage Conditions

**WHO Requirement:**
> "Stored material should be protected from contamination, deterioration, and pest infestation."

#### 7.1.1 Storage Parameters

**Cannabis Storage Requirements:**

```yaml
Storage_Conditions:
  environmental:
    temperature: "15-20°C"
    humidity: "55-62% RH"
    light: "Dark (light-proof containers)"
    oxygen: "Low (vacuum seal or nitrogen flush)"
    
  packaging:
    primary: "Food-grade Mylar bags or glass jars"
    secondary: "Cardboard boxes or totes"
    labeling:
      - Batch number
      - Strain name
      - Package date
      - Net weight
      - Expiry date
      - Storage instructions
    
  segregation:
    - By batch number
    - By strain
    - By quality grade
    - Quarantine area for pending release
    
  security:
    - Limited access (badge system)
    - CCTV monitoring
    - Inventory reconciliation (daily)
    - Dual custody for high-value products
```

#### 7.1.2 Stability Monitoring

**Shelf-Life Verification:**

```typescript
interface StabilityStudy {
  studyId: string;
  batchId: string;
  
  // Storage conditions
  storageCondition: 'LONG_TERM' | 'ACCELERATED' | 'STRESS';
  temperature: number;
  humidity: number;
  lightExposure: 'DARK' | 'AMBIENT' | 'DIRECT';
  
  // Testing schedule
  testPoints: Date[];          // e.g., 0, 3, 6, 9, 12 months
  
  // Parameters monitored
  parameters: {
    cannabinoidProfile: boolean;
    terpeneProfile: boolean;
    moistureContent: boolean;
    waterActivity: boolean;
    microbialLoad: boolean;
    appearance: boolean;
    aroma: boolean;
  };
  
  // Results
  testResults: StabilityTestResult[];
  
  // Conclusion
  shelfLife: number;           // Months
  storageRecommendations: string;
}
```

### 7.2 Distribution

**Transport Requirements:**

```yaml
Transportation:
  vehicle_requirements:
    - Climate control (if needed)
    - Clean and dry
    - Secure (lockable)
    - GPS tracking
    
  packaging:
    - Tamper-evident seals
    - Shock-absorbing materials
    - Temperature indicators (if required)
    - Chain of custody documentation
    
  documentation:
    - Bill of lading
    - Certificate of analysis
    - GACP certificate
    - Transport authorization
    - Chain of custody log
    
  receiving_verification:
    - Visual inspection
    - Temperature verification
    - Package integrity
    - Documentation review
    - Acceptance signature
```

**Documentation:**

- 📋 See `SOP_ChainOfCustody.md` for distribution procedures

## 8. Quality Control (WHO GACP Section 9)

### 8.1 Quality Testing

**WHO Requirement:**
> "Representative samples should be taken and analyzed to verify compliance with specifications."

#### 8.1.1 Sampling Plan

**Statistical Sampling:**

```yaml
Sampling_Strategy:
  batch_definition:
    - Produced under uniform conditions
    - Same strain/genetics
    - Same harvest date
    - Same processing method
    
  sample_size:
    batch_size_lt_10kg: "3 samples minimum"
    batch_size_10_100kg: "5 samples"
    batch_size_gt_100kg: "Square root of number of containers"
    
  sampling_procedure:
    - Random selection
    - Representative of batch
    - Aseptic technique
    - Chain of custody
    - Tamper-evident seals
    
  sample_quantity:
    cannabinoid_analysis: "5 grams"
    terpene_analysis: "5 grams"
    microbial_testing: "10 grams"
    pesticide_residue: "10 grams"
    heavy_metals: "5 grams"
    moisture_content: "5 grams"
```

#### 8.1.2 Analytical Methods

**Required Testing:**

```yaml
Quality_Tests:
  identity:
    method: "DNA fingerprinting or morphological identification"
    acceptance: "Matches reference standard"
    
  potency:
    cannabinoids:
      - THC (total)
      - CBD (total)
      - CBN
      - CBG
      - CBC
    method: "HPLC or GC-MS"
    specification: "Within ±10% of target"
    
  purity:
    pesticide_residues:
      method: "LC-MS/MS or GC-MS"
      specification: "Below regulatory limits"
      
    heavy_metals:
      - Lead (Pb)
      - Cadmium (Cd)
      - Mercury (Hg)
      - Arsenic (As)
      method: "ICP-MS"
      specification: "USP <232> limits"
      
    microbial:
      - Total aerobic count
      - Yeast and mold
      - Bile-tolerant Gram-negative bacteria
      - E. coli
      - Salmonella
      - S. aureus
      method: "USP <2021>, <2022>, <2023>"
      specification: "USP limits for herbal materials"
      
    mycotoxins:
      - Aflatoxins (B1, B2, G1, G2)
      - Ochratoxin A
      method: "LC-MS/MS"
      specification: "Below EU limits"
      
  physical:
    moisture_content:
      method: "Loss on drying (LOD)"
      specification: "10-12%"
      
    water_activity:
      method: "Water activity meter"
      specification: "<0.65 aw"
      
    foreign_matter:
      method: "Visual inspection, microscopy"
      specification: "<2%"
```

### 8.2 Release Criteria

**Batch Release Decision:**

```typescript
interface BatchReleaseDecision {
  batchId: string;
  
  // QC test results
  identityVerified: boolean;
  potencyInSpec: boolean;
  purityInSpec: boolean;
  microbialInSpec: boolean;
  physicalInSpec: boolean;
  
  // Documentation complete
  batchRecordComplete: boolean;
  coaAvailable: boolean;
  deviationsClosed: boolean;
  
  // Decision
  releaseDecision: 'RELEASE' | 'REJECT' | 'HOLD' | 'REWORK';
  decisionRationale: string;
  
  // Qualified Person approval
  qualifiedPerson: {
    userId: string;
    name: string;
    signature: ElectronicSignature;
    date: Date;
  };
  
  // Certificate of Analysis
  coaNumber: string;
  coaIssueDate: Date;
}
```

## 9. Documentation and Record Keeping (WHO GACP Section 10)

### 9.1 Document Control

**WHO Requirement:**
> "All procedures should be documented and records maintained."

**GACP-ERP Document Management:**

```yaml
Document_Hierarchy:
  tier_1_policies:
    - Quality Policy
    - GACP Compliance Policy
    - Data Integrity Policy
    
  tier_2_sops:
    - Cultivation SOPs
    - Harvesting SOPs
    - Processing SOPs
    - QC SOPs
    
  tier_3_work_instructions:
    - Pest control procedures
    - Equipment operation
    - Cleaning procedures
    
  tier_4_records:
    - Batch production records
    - QC test results
    - Training records
    - Deviation reports
    - Change control records
```

**Documentation:**

- 📋 See `SOP_DocumentControl.md` for document management procedures

### 9.2 Batch Production Records

**Required Information:**

```typescript
interface BatchProductionRecord {
  // Identification
  batchNumber: string;
  strainName: string;
  geneticsSource: string;
  
  // Production dates
  propagationDate: Date;
  transplantDate: Date;
  floweringStart: Date;
  harvestDate: Date;
  
  // Materials used
  motherPlantId: string;
  growingMedium: string;
  nutrients: NutrientLog[];
  pesticides: PesticideLog[];
  
  // Environmental conditions
  environmentalLogs: EnvironmentalLog[];
  
  // Personnel
  cultivator: string;
  supervisor: string;
  harvestedBy: string[];
  
  // Processing
  dryingStartDate: Date;
  dryingEndDate: Date;
  curingStartDate?: Date;
  curingEndDate?: Date;
  trimmingDate: Date;
  
  // Quality
  visualInspections: InspectionLog[];
  qcTests: QCTestResult[];
  
  // Yields
  wetWeight: number;
  dryWeight: number;
  trimmedWeight: number;
  yieldPercentage: number;
  
  // Deviations
  deviations?: DeviationRecord[];
  
  // Release
  releaseDecision: BatchReleaseDecision;
}
```

### 9.3 Traceability

**Seed to Sale Tracking:**

```yaml
Traceability_Requirements:
  forward_traceability:
    - From mother plant to final product
    - All processing steps documented
    - Distribution chain recorded
    
  backward_traceability:
    - From product to source genetics
    - All inputs identified
    - Processing history available
    
  implementation:
    technology: "Barcode/QR code + database"
    identifier_format: "Unique per plant/batch"
    audit_trail: "Immutable (ImmuDB)"
    retention: "7 years minimum"
```

## 10. Personnel (WHO GACP Section 11)

### 10.1 Training

**Training Requirements:**

```yaml
GACP_Training_Matrix:
  all_cultivation_staff:
    - "Introduction to GACP" (4 hours)
    - "Cannabis Cultivation Basics" (16 hours)
    - "GMP/GDP Awareness" (4 hours)
    - "Data Integrity" (2 hours)
    - "Safety and Hygiene" (4 hours)
    frequency: "Initial + annual refresher"
    
  supervisors:
    - All cultivation staff training (above)
    - "Batch Record Management" (8 hours)
    - "Deviation Management" (4 hours)
    - "Quality Control Basics" (8 hours)
    frequency: "Initial + annual refresher"
    
  quality_personnel:
    - "GACP Advanced" (16 hours)
    - "Analytical Methods" (24 hours)
    - "GMP Inspector Training" (16 hours)
    - "Root Cause Analysis" (8 hours)
    frequency: "Initial + bi-annual refresher"
```

**Documentation:**

- 📋 Training Curriculum: `/docs/training/Curriculum.md`
- 📋 Test Case: `TC-TRAIN-001.md`

### 10.2 Hygiene

**Personnel Hygiene Requirements:**

```yaml
Hygiene_Practices:
  personal_cleanliness:
    - Daily shower required
    - Clean clothing
    - Hair restraint
    - No jewelry
    - Short, clean nails
    
  gowning:
    - Clean gown/coveralls
    - Hair net/cap
    - Shoe covers (in clean rooms)
    - Gloves (for harvesting/processing)
    
  prohibited:
    - Smoking in facility
    - Eating in grow rooms
    - Personal items in production areas
    - Sick personnel (until cleared)
```

## 11. Equipment and Facilities (WHO GACP Section 12)

### 11.1 Equipment Qualification

**Equipment Management:**

```yaml
Equipment_Lifecycle:
  acquisition:
    - User requirements specification
    - Vendor qualification
    - Equipment specification review
    
  installation:
    - Installation Qualification (IQ)
    - Utilities verification
    - Documentation
    
  commissioning:
    - Operational Qualification (OQ)
    - Functional testing
    - Calibration
    
  operation:
    - Performance Qualification (PQ)
    - Routine use
    - Preventive maintenance
    - Calibration verification
    
  retirement:
    - Decommissioning procedure
    - Data archiving
    - Disposal documentation
```

**Documentation:**

- 📋 See `SOP_EquipmentManagement.md` for equipment procedures

### 11.2 Calibration

**Calibration Program:**

```yaml
Calibration_Schedule:
  critical_instruments:
    pH_meters:
      frequency: "Monthly"
      standard: "NIST-traceable buffers"
      
    EC_meters:
      frequency: "Monthly"
      standard: "Calibration solution"
      
    temperature_probes:
      frequency: "Quarterly"
      standard: "NIST-traceable thermometer"
      
    humidity_sensors:
      frequency: "Quarterly"
      standard: "Saturated salt solutions"
      
    scales/balances:
      frequency: "Quarterly"
      standard: "NIST-traceable weights"
      
    light_meters:
      frequency: "Semi-annual"
      standard: "Calibrated light source"
```

**Documentation:**

- 📋 See `SOP_EquipmentCalibration.md`

## 12. GACP-ERP Implementation Matrix

### 12.1 System Modules for GACP

**Module Mapping:**

```yaml
GACP_ERP_Modules:
  genetics_management:
    - Mother plant database
    - Clone tracking
    - Genetics COA repository
    
  cultivation_management:
    - Plant lifecycle tracking
    - Environmental monitoring (IoT integration)
    - Nutrient scheduling
    - Pest/disease logging
    
  harvest_processing:
    - Harvest planning
    - Drying room management
    - Curing tracking
    - Trimming logs
    
  quality_control:
    - Sample management
    - COA repository
    - Specification management
    - Batch release workflow
    
  inventory_management:
    - Real-time inventory
    - Lot/batch tracking
    - Expiry date management
    - Storage location tracking
    
  traceability:
    - Seed to sale tracking
    - Barcode/QR code generation
    - Chain of custody
    - Audit trail (ImmuDB)
    
  compliance:
    - SOP library
    - Training records
    - Deviation management
    - CAPA tracking
    - Document control
```

### 12.2 Data Capture Points

**Automated Data Collection:**

```typescript
// IoT integration for environmental monitoring
interface EnvironmentalDataPoint {
  sensorId: string;
  roomId: string;
  timestamp: Date;
  
  // Measurements
  temperature: number;
  humidity: number;
  co2: number;
  vpd: number;              // Vapor Pressure Deficit
  lightIntensity: number;   // PPFD
  
  // Data integrity
  calibrationStatus: 'CURRENT' | 'DUE' | 'OVERDUE';
  dataQuality: 'GOOD' | 'SUSPECT' | 'BAD';
  
  // Audit
  recordedBy: 'AUTOMATED';
  recordHash: string;
}
```

## 13. Glossary

| Term | Definition |
|------|------------|
| **GACP** | Good Agricultural and Collection Practices |
| **Cannabinoid** | Active compounds in cannabis (THC, CBD, CBN, etc.) |
| **Terpene** | Aromatic compounds responsible for cannabis aroma and effects |
| **Trichome** | Resin glands containing cannabinoids and terpenes |
| **Clone** | Genetic copy of mother plant propagated from cutting |
| **Curing** | Post-drying process to improve flavor and smoothness |
| **IPM** | Integrated Pest Management |
| **Phenotype** | Observable characteristics of a plant |
| **Genotype** | Genetic makeup of a plant |
| **VPD** | Vapor Pressure Deficit (air moisture demand) |

## 14. Revision History

| Version | Date | Description | Author | Approved By |
|---------|------|-------------|--------|-------------|
| 0.1 | 2025-09-01 | Initial reference | System | - |
| 1.0 | 2025-10-15 | Comprehensive WHO GACP compliance guide for medical cannabis cultivation with detailed procedures, quality standards, and ERP integration | Compliance Team | Quality Director |

## 15. Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Author** | Cultivation Manager | _________________ | __________ |
| **Quality Reviewer** | Quality Manager | _________________ | __________ |
| **Compliance Reviewer** | Compliance Officer | _________________ | __________ |
| **Final Approver** | General Manager | _________________ | __________ |

---

**Document Control:**

- Document ID: COMP-WHO-001
- Location: /docs/compliance/WHO_GACP.md
- Classification: Internal - Restricted
- Next Review Date: 2026-10-15

## 16. References

- **WHO Technical Report Series No. 1025**: Annex 2, WHO guidelines on good agricultural and collection practices (GACP) for medicinal plants (2020)
- **EU GMP Annex 11**: Computerised Systems
- **ISO 22000**: Food Safety Management
- **SOP_Germination.md**: Propagation procedures
- **SOP_GrowthMonitoring.md**: Cultivation monitoring
- **SOP_Harvest.md**: Harvesting procedures
- **SOP_DryingCuring.md**: Post-harvest processing
- **SOP_EquipmentManagement.md**: Equipment lifecycle management
- **SOP_EquipmentCalibration.md**: Calibration procedures
- **SOP_DocumentControl.md**: Document management
- **SOP_ChainOfCustody.md**: Distribution and traceability
- **TC-TRAIN-001.md**: Training effectiveness validation
- **VMP.md**: Validation Master Plan
