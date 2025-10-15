---
title: "EMA Guidelines on Good Agricultural and Collection Practice (GACP) for Starting Materials of Herbal Origin"
version: "EMEA/HMPC/246816/2005 (2006)"
status: "active"
last_updated: "2025-10-15"
regulatory_authority: "European Medicines Agency (EMA)"
scope: "Herbal medicinal products - cultivation and primary processing"
related_standards: "EU GMP, WHO GACP, Ph.Eur. (European Pharmacopoeia)"
---

# EMA Guidelines on GACP for Starting Materials of Herbal Origin

## 1. Executive Summary

**EMA GACP Guidelines** (2006) устанавливают специфические требования Европейского Союза для культивации и первичной обработки растительного сырья, используемого в лекарственных препаратах. Документ интегрируется с EU GMP и является обязательным для производителей медицинских растительных продуктов в ЕС.

### 1.1 Regulatory Framework

```yaml
EU_Herbal_Regulatory_Structure:
  directive_2001_83_ec:
    scope: "Medicinal products for human use"
    relevance: "Defines requirements for herbal medicinal products"
    
  directive_2004_24_ec:
    scope: "Traditional herbal medicinal products"
    relevance: "Simplified registration for traditional use"
    
  ema_gacp_guidelines:
    document: "EMEA/HMPC/246816/2005"
    adoption: "July 2006"
    status: "Effective"
    
  european_pharmacopoeia:
    scope: "Quality standards for herbal drugs"
    relevance: "Specification requirements"
    
  eu_gmp_guidelines:
    volume_4: "GMP guidelines"
    annex_11: "Computerised systems"
    relevance: "Manufacturing requirements"
```

### 1.2 Key Differences from WHO GACP

**EMA-Specific Requirements:**
```yaml
EMA_vs_WHO:
  stricter_documentation:
    ema: "Complete batch documentation from seed to API"
    who: "General documentation principles"
    
  quality_specifications:
    ema: "Ph.Eur. monographs mandatory (where exist)"
    who: "WHO specifications or national standards"
    
  supplier_qualification:
    ema: "EU GMP annexes apply to suppliers"
    who: "General good practices"
    
  residue_limits:
    ema: "EU regulations (stricter for some pesticides)"
    who: "Codex Alimentarius or national limits"
    
  traceability:
    ema: "Full traceability including wild collection"
    who: "Traceability encouraged"
```

### 1.3 GACP-ERP Compliance Approach

**Integration Strategy:**
```yaml
Compliance_Architecture:
  base_standard: "WHO GACP (comprehensive)"
  overlay: "EMA-specific requirements"
  
  ema_enhancements:
    - Ph.Eur. specification enforcement
    - EU pesticide MRL compliance
    - Enhanced supplier qualification
    - Wild collection controls (if applicable)
    - Full chain of custody
    
  technical_implementation:
    - Specification library (Ph.Eur. database)
    - EU MRL database (Commission Regulation)
    - Supplier qualification workflow
    - Enhanced traceability (blockchain option)
```

## 2. Quality Assurance System (EMA GACP Section 2)

### 2.1 Quality Management

**EMA Requirement:**
> "A quality assurance system should be established which includes the organizational structure, procedures, processes and resources, as well as activities necessary to ensure that the starting material will have the required quality."

#### 2.1.1 QMS Structure

**GACP-ERP Quality System:**
```yaml
Quality_Management_System:
  quality_policy:
    commitment: "EMA GACP and Ph.Eur. compliance"
    scope: "All cultivation and primary processing"
    review_frequency: "Annual"
    
  organizational_structure:
    quality_manager:
      responsibilities:
        - QMS oversight
        - GACP compliance
        - Supplier qualification
        - Deviation/CAPA management
      qualifications: "Degree in agriculture/botany + GMP training"
      
    cultivation_manager:
      responsibilities:
        - Day-to-day operations
        - Personnel supervision
        - SOP implementation
        - Batch record management
      qualifications: "Horticultural experience + GACP training"
      
    qa_analyst:
      responsibilities:
        - Sample testing
        - COA generation
        - Specification compliance
        - Stability studies
      qualifications: "Analytical chemistry + Ph.Eur. knowledge"
  
  quality_procedures:
    - Document control
    - Change control
    - Deviation management
    - CAPA system
    - Internal audits
    - Management review
    - Supplier qualification
    - Batch release procedure
```

#### 2.1.2 Quality Manual

**Required Content:**
```typescript
interface QualityManual {
  section1_introduction: {
    companyProfile: string;
    productScope: string;        // "Medical cannabis"
    regulatoryScope: string;     // "EU medicinal products"
  };
  
  section2_quality_policy: {
    statement: string;
    objectives: string[];
    commitments: string[];
  };
  
  section3_organization: {
    orgChart: string;            // Link to document
    rolesResponsibilities: RoleDefinition[];
    deputyArrangements: string;
  };
  
  section4_qms_procedures: {
    documentControl: string;     // SOP reference
    changeControl: string;
    deviationManagement: string;
    capaSystem: string;
    internalAudits: string;
    managementReview: string;
  };
  
  section5_cultivation_practices: {
    gacpImplementation: string;
    cultivationSOPs: string[];
    processingSOPs: string[];
  };
  
  section6_quality_control: {
    analyticalmethods: string[];
    specifications: string;      // Ph.Eur. reference
    sampling: string;
    releaseProcess: string;
  };
  
  section7_documentation: {
    batchRecords: string;
    traceability: string;
    retention: string;
  };
  
  // Version control
  version: string;
  effectiveDate: Date;
  approvedBy: ElectronicSignature;
  nextReview: Date;
}
```

### 2.2 Personnel (EMA GACP Section 3)

**EMA Requirement:**
> "Personnel should have appropriate education, training and practical experience relevant to their specific duties."

#### 2.2.1 Competency Requirements

**Role-Based Training:**
```yaml
EMA_Training_Matrix:
  cultivation_operators:
    education: "Secondary school + practical experience"
    training:
      - "GACP Principles" (8 hours)
      - "EU GMP Basics" (4 hours)
      - "Cannabis Cultivation" (16 hours)
      - "Hygiene and Contamination Control" (4 hours)
      - "Documentation Practices" (4 hours)
    assessment: "Written test + practical evaluation"
    frequency: "Initial + annual refresher"
    
  quality_control_analysts:
    education: "BSc Chemistry/Biochemistry"
    training:
      - "Ph.Eur. Requirements" (16 hours)
      - "Analytical Methods Validation" (16 hours)
      - "HPLC/GC-MS Operation" (24 hours)
      - "Data Integrity" (4 hours)
      - "GMP for QC Labs" (8 hours)
    assessment: "Written test + method qualification"
    frequency: "Initial + bi-annual refresher"
    
  quality_assurance:
    education: "BSc + 2 years GMP experience"
    training:
      - "EMA GACP Advanced" (24 hours)
      - "Auditing Techniques" (16 hours)
      - "Deviation Investigation" (8 hours)
      - "Risk Management (ICH Q9)" (8 hours)
      - "Regulatory Requirements" (16 hours)
    assessment: "Written test + audit simulation"
    frequency: "Initial + annual refresher"
    
  management:
    education: "University degree + 5 years experience"
    training:
      - "Quality Management Systems" (16 hours)
      - "Regulatory Strategy" (8 hours)
      - "Inspection Readiness" (8 hours)
      - "Management Review" (4 hours)
    assessment: "Case study + presentation"
    frequency: "Initial + annual refresher"
```

**Documentation:**
- 📋 Training Curriculum: `/docs/training/Curriculum.md`
- 📋 Competency Assessment Forms
- 📋 Training Records Database (ERP)

## 3. Premises and Equipment (EMA GACP Section 4)

### 3.1 Premises Design

**EMA Requirement:**
> "Premises should be located, designed, constructed, adapted and maintained to suit the operations to be carried out."

#### 3.1.1 Facility Layout

**Cannabis Cultivation Facility:**
```yaml
Facility_Zones:
  clean_zones:
    propagation_room:
      classification: "Grade D equivalent"
      controls:
        - HEPA filtration
        - Positive pressure
        - Personnel gowning
        - Restricted access
      
    mother_plant_room:
      classification: "Grade D equivalent"
      controls:
        - HEPA filtration
        - Environmental monitoring
        - Pest exclusion
        - Access control
  
  controlled_zones:
    vegetative_growth_rooms:
      classification: "Controlled, not classified"
      controls:
        - HVAC with filtration
        - Environmental monitoring
        - IPM program
        - Hygiene procedures
      
    flowering_rooms:
      classification: "Controlled, not classified"
      controls:
        - Light-tight environment
        - HVAC with filtration
        - Environmental monitoring
        - Contamination prevention
  
  processing_zones:
    drying_rooms:
      classification: "Controlled"
      controls:
        - Climate control
        - Air filtration
        - Hygiene procedures
        - Limited access
      
    trimming_room:
      classification: "Controlled"
      controls:
        - HVAC
        - Cleanable surfaces
        - Pest exclusion
        - Hygiene procedures
      
    packaging_room:
      classification: "Grade D equivalent"
      controls:
        - HEPA filtration
        - Personnel gowning
        - Material flow control
        - Environmental monitoring
  
  support_zones:
    qc_laboratory:
      classification: "As per ISO 17025"
      controls:
        - Separate HVAC
        - Restricted access
        - Equipment qualification
        - Environmental monitoring
      
    storage_areas:
      raw_materials: "Climate controlled, segregated"
      finished_product: "Secure, climate controlled"
      quarantine: "Clearly identified, restricted"
      rejected: "Segregated, secure"
```

#### 3.1.2 Environmental Classification

**Ph.Eur. 5.1.4 Alignment:**
```yaml
Microbial_Limits:
  grade_d_areas:
    # For propagation, mother plants, packaging
    air_sample:
      action_limit: "200 CFU/m³"
      method: "Active air sampling"
      
    settle_plates:
      action_limit: "100 CFU/4hrs"
      method: "90mm plates, 4 hours"
      
    surface_swabs:
      action_limit: "50 CFU/plate"
      method: "Contact plates or swabs"
      
    monitoring_frequency: "Monthly minimum"
  
  controlled_areas:
    # For growing, drying, trimming
    monitoring:
      - Visual inspection (daily)
      - Environmental monitoring (continuous)
      - Microbial monitoring (quarterly)
    
    action_limits:
      - Defined per area
      - Risk-based approach
      - Trending analysis
```

### 3.2 Equipment (EMA GACP Section 4.3)

**EMA Requirement:**
> "Equipment should be qualified, calibrated and maintained. Records should be retained."

#### 3.2.1 Critical Equipment List

**Cannabis Cultivation Equipment:**
```yaml
Critical_Equipment:
  environmental_control:
    hvac_system:
      qualification: "IQ/OQ"
      calibration: "N/A (performance verification)"
      maintenance: "Quarterly preventive maintenance"
      
    temperature_humidity_sensors:
      qualification: "IQ"
      calibration: "Quarterly (NIST-traceable)"
      maintenance: "Annual"
      
    co2_controllers:
      qualification: "IQ/OQ"
      calibration: "Semi-annual"
      maintenance: "Annual"
  
  analytical_equipment:
    hplc:
      qualification: "IQ/OQ/PQ"
      calibration: "Per method (daily/weekly)"
      maintenance: "Per manufacturer + PM schedule"
      
    gc_ms:
      qualification: "IQ/OQ/PQ"
      calibration: "Per method"
      maintenance: "Per manufacturer + PM schedule"
      
    moisture_analyzer:
      qualification: "IQ/OQ"
      calibration: "Monthly"
      maintenance: "Annual"
      
    balances:
      qualification: "IQ/OQ"
      calibration: "Quarterly"
      maintenance: "Annual"
  
  processing_equipment:
    drying_racks:
      qualification: "IQ"
      calibration: "N/A"
      maintenance: "Cleaning validation"
      
    trimming_equipment:
      qualification: "IQ"
      calibration: "N/A"
      maintenance: "Cleaning + inspection"
      
    packaging_equipment:
      qualification: "IQ/OQ"
      calibration: "N/A (functionality check)"
      maintenance: "Per manufacturer"
```

**Documentation:**
- 📋 See `SOP_EquipmentManagement.md`
- 📋 See `SOP_EquipmentCalibration.md`

## 4. Documentation (EMA GACP Section 5)

### 4.1 Documentation System

**EMA Requirement:**
> "All documentation should be designed, prepared, reviewed and distributed with care. It should comply with the relevant parts of the manufacturing authorisation and the relevant specifications of the finished herbal medicinal product."

#### 4.1.1 Document Hierarchy

**EMA-Compliant Documentation:**
```yaml
Document_Structure:
  tier_1_quality_manual:
    purpose: "QMS overview"
    approval: "General Manager"
    review: "Annual"
    
  tier_2_sops:
    categories:
      - Cultivation operations
      - Harvesting and processing
      - Quality control
      - Quality assurance
      - Equipment management
      - Facility management
    approval: "Quality Manager"
    review: "Bi-annual or after change"
    
  tier_3_specifications:
    types:
      - Starting material specifications
      - In-process specifications
      - Finished product specifications
      - Ph.Eur. monograph references
    approval: "Quality Manager"
    review: "Annual or regulatory update"
    
  tier_4_batch_records:
    content:
      - Batch production record
      - In-process test results
      - Final QC results
      - Deviations
      - Release authorization
    approval: "Qualified Person (QP) or delegate"
    retention: "7 years minimum (EU requirement)"
    
  tier_5_support_documents:
    types:
      - Training records
      - Calibration certificates
      - Maintenance logs
      - Validation reports
      - Audit reports
    approval: "Department head"
    retention: "Per retention policy"
```

#### 4.1.2 Ph.Eur. Compliance Documentation

**European Pharmacopoeia Integration:**
```typescript
interface PhEurCompliance {
  monograph: {
    reference: string;          // e.g., "Ph.Eur. 01/2020:1433"
    substance: string;          // "Cannabis flos"
    version: string;            // Edition + supplement
  };
  
  specifications: {
    identity: {
      macroscopic: string;      // Visual characteristics
      microscopic: string;      // Microscopic features
      tlc: string;              // TLC fingerprint (if applicable)
      hplc: string;             // HPLC fingerprint (if applicable)
    };
    
    tests: {
      foreignMatter: {
        method: "Ph.Eur. 2.8.2";
        limit: "< 2%";
      };
      
      totalAsh: {
        method: "Ph.Eur. 2.4.16";
        limit: "< 12%";
      };
      
      waterContent: {
        method: "Ph.Eur. 2.5.12";
        limit: "< 12%";
      };
      
      pesticides: {
        method: "Ph.Eur. 2.8.13";
        limit: "Per EU regulation";
      };
      
      heavyMetals: {
        method: "Ph.Eur. 2.4.27 or 2.4.8";
        limits: "Ph.Eur. 5.20";
      };
      
      microbial: {
        method: "Ph.Eur. 2.6.12, 2.6.13";
        limits: "Ph.Eur. 5.1.4 or 5.1.8";
      };
    };
    
    assay: {
      cannabinoids: {
        method: "HPLC (in-house validated)";
        specification: "THC: X-Y%, CBD: X-Y%";
      };
    };
  };
  
  // Version control
  specificationVersion: string;
  effectiveDate: Date;
  approvedBy: ElectronicSignature;
}
```

### 4.2 Traceability (EMA GACP Section 5.4)

**EMA Requirement:**
> "It should be possible to trace the complete history of a batch from the starting material to the finished product through all stages of processing, testing and storage."

#### 4.2.1 Traceability System

**Seed to API Tracking:**
```yaml
Traceability_Architecture:
  backward_traceability:
    from_batch:
      - Harvest lot(s)
      - Plant IDs
      - Mother plant ID
      - Genetics source
      - Seed/clone lot
    
    from_plant:
      - Growing location
      - Environmental history
      - Nutrient inputs
      - Pesticide applications
      - Personnel involved
    
  forward_traceability:
    from_genetics:
      - All plants propagated
      - All batches produced
      - All lots created
      - Distribution chain
    
    from_batch:
      - Packaging lots
      - Distribution
      - Customer orders
      - End users (if known)
  
  technical_implementation:
    identifiers:
      - Mother plant: QR code + database
      - Clone/plant: Barcode tag
      - Batch: Unique batch number
      - Lot: Lot number (packaging)
    
    database:
      - PostgreSQL (business data)
      - ImmuDB (audit trail)
      - Blockchain (optional, enhanced integrity)
    
    reporting:
      - Instant traceability reports
      - Forward/backward trace
      - Graphical traceability map
```

## 5. Starting Material (EMA GACP Section 6)

### 5.1 Identity and Quality

**EMA Requirement:**
> "The identity and quality of starting material should be established and documented."

#### 5.1.1 Botanical Identity

**Cannabis sativa L. Verification:**
```yaml
Identity_Verification:
  taxonomic_classification:
    genus: "Cannabis"
    species: "sativa"
    subspecies: "sativa or indica"
    author: "L." (Linnaeus)
    
  verification_methods:
    macroscopic:
      - Leaf morphology (palmate, serrated)
      - Flower structure
      - Growth habit
      documentation: "Photographic record + description"
      
    microscopic:
      - Trichome morphology
      - Cystolithic hairs
      - Pollen structure
      documentation: "Microscopy images + report"
      
    genetic:
      method: "DNA fingerprinting (SNP or STR)"
      reference: "Certified reference sample"
      laboratory: "Accredited lab (ISO 17025)"
      frequency: "Per strain, annually"
      documentation: "COA from laboratory"
  
  cultivar_certification:
    - Strain name registered
    - Genetic stability verified
    - Cannabinoid profile consistent
    - Certificate of authenticity (COA)
```

#### 5.1.2 Quality Specifications

**EMA-Aligned Specifications:**
```typescript
interface StartingMaterialSpecification {
  materialType: 'DRIED_FLOWER' | 'DRIED_LEAF' | 'FRESH_MATERIAL';
  
  identity: {
    botanicalName: 'Cannabis sativa L.';
    cultivar: string;
    morphology: 'COMPLIANT' | 'NON_COMPLIANT';
    genetic: 'VERIFIED' | 'NOT_VERIFIED';
  };
  
  // Ph.Eur. tests
  foreignMatter: {
    method: 'Ph.Eur. 2.8.2';
    specification: '< 2%';
  };
  
  totalAsh: {
    method: 'Ph.Eur. 2.4.16';
    specification: '< 12%';
  };
  
  moistureContent: {
    method: 'Ph.Eur. 2.5.12' | 'Loss on Drying';
    specification: '8-12%';
  };
  
  // Cannabinoid assay
  cannabinoids: {
    thc: { min: number; max: number };
    cbd: { min: number; max: number };
    cbn: { max: number };
    method: 'HPLC (validated)';
  };
  
  // Contaminants
  pesticides: {
    method: 'LC-MS/MS or GC-MS';
    specification: 'Below EU MRL';
    regulationReference: 'Commission Regulation (EC) No 396/2005';
  };
  
  heavyMetals: {
    method: 'ICP-MS';
    specification: 'Ph.Eur. 5.20 compliance';
    limits: {
      lead: '< 5 ppm';
      cadmium: '< 0.5 ppm';
      mercury: '< 0.1 ppm';
      arsenic: '< 2 ppm';
    };
  };
  
  microbial: {
    method: 'Ph.Eur. 2.6.12, 2.6.13';
    specification: 'Ph.Eur. 5.1.4 (for herbal drugs)';
    limits: {
      tamc: '< 10^5 CFU/g';
      tymc: '< 10^4 CFU/g';
      bileGramNeg: '< 10^3 CFU/g';
      ecoli: 'Absent in 1g';
      salmonella: 'Absent in 10g';
    };
  };
  
  mycotoxins: {
    aflatoxins: {
      method: 'LC-MS/MS';
      limits: {
        b1: '< 2 μg/kg';
        total: '< 4 μg/kg';
      };
    };
    
    ochratoxinA: {
      method: 'LC-MS/MS';
      limit: '< 20 μg/kg';
    };
  };
  
  // Approval
  approvedBy: ElectronicSignature;
  effectiveDate: Date;
  reviewDate: Date;
}
```

## 6. Cultivation and Collection (EMA GACP Section 7)

### 6.1 Cultivation Operations

**EMA Requirement:**
> "Cultivation and collection of starting material should follow written procedures to ensure consistent quality."

**Implementation:**
- See **WHO_GACP.md Section 4** for detailed cultivation procedures
- Additional EMA requirements:
  - SOPs must reference Ph.Eur. where applicable
  - Batch records must be complete from propagation to harvest
  - All inputs (nutrients, pesticides) must be EU-approved

### 6.2 Wild Collection (If Applicable)

**EMA-Specific Requirements:**
```yaml
Wild_Collection:
  applicability: "Not applicable for cannabis (controlled cultivation only)"
  
  note: "Cannabis must be cultivated in controlled environment per narcotic control laws. Wild collection prohibited."
```

## 7. Harvest and Primary Processing (EMA GACP Section 8)

### 7.1 Harvesting

**EMA Requirement:**
> "Harvesting operations should be carried out in accordance with written instructions."

**Implementation:**
- See **WHO_GACP.md Section 5** for detailed harvest procedures
- Additional EMA requirements:
  - Harvest batch record must link to finished product batch
  - Harvest timing based on cannabinoid content verification
  - Harvest approval by qualified person

### 7.2 Primary Processing

**Drying and Stabilization:**
```yaml
EMA_Processing_Requirements:
  drying:
    documentation:
      - Drying start/end date and time
      - Environmental conditions (continuous log)
      - Visual inspections (daily)
      - Moisture content testing (daily after day 5)
      
    specifications:
      - Final moisture: 8-12%
      - No visible mold
      - No off-odors
      - Trichome integrity maintained
    
    batch_record:
      - All data points recorded
      - Deviations documented
      - Approval signatures
  
  storage_post_drying:
    conditions: "15-20°C, 55-62% RH, dark"
    containers: "Food-grade, airtight"
    labeling: "Batch number, date, contents, status"
    segregation: "Quarantine until QC release"
```

**Documentation:**
- 📋 See `SOP_DryingCuring.md`

## 8. Packaging and Storage (EMA GACP Section 9)

### 8.1 Packaging Materials

**EMA Requirement:**
> "Packaging materials should be suitable for their intended use and should not adversely affect the quality of the starting material."

**GACP-ERP Packaging:**
```yaml
Packaging_Materials:
  primary_packaging:
    material: "Food-grade Mylar bags or glass jars"
    specifications:
      - Moisture barrier (WVTR < 0.01 g/100in²/day)
      - Oxygen barrier (OTR < 0.01 cc/100in²/day)
      - Light-proof (or amber glass)
      - FDA/EU food contact approved
    
    supplier_qualification:
      - Certificate of compliance
      - Material safety data sheet
      - Supplier audit (if critical)
  
  secondary_packaging:
    material: "Cardboard boxes or plastic totes"
    specifications:
      - Sturdy construction
      - Clean and dry
      - Adequate protection
  
  labeling:
    required_information:
      - Material name: "Cannabis flos"
      - Cultivar/strain
      - Batch number
      - Net weight
      - Package date
      - Storage conditions
      - "Keep out of reach of children"
      - Supplier name and address
    
    label_approval:
      - Quality Manager review
      - Batch-specific labels
      - Barcode/QR code for traceability
```

### 8.2 Storage (EMA GACP Section 9.3)

**Storage Management:**
```yaml
Storage_System:
  quarantine_area:
    status: "Pending QC release"
    access: "Restricted (QA/QC only)"
    identification: "Clear labeling + database status"
    
  approved_area:
    status: "Released for distribution"
    access: "Controlled (authorized personnel)"
    segregation: "By batch number"
    
  rejected_area:
    status: "Rejected (OOS or non-conforming)"
    access: "Restricted"
    identification: "RED label"
    disposition: "Per deviation procedure"
    
  returned_area:
    status: "Returned goods (quarantine)"
    access: "Restricted"
    investigation: "Mandatory before disposition"
  
  fifo_fefo:
    principle: "First Expiry, First Out"
    monitoring: "Inventory system alerts"
    verification: "Monthly stock rotation check"
```

## 9. Quality Control (EMA GACP Section 10)

### 9.1 Sampling

**EMA Requirement:**
> "Sampling should be carried out in accordance with written procedures approved by the quality control unit."

#### 9.1.1 Sampling Procedures

**Statistical Sampling Plan:**
```yaml
Sampling_Protocol:
  batch_definition:
    - Uniform cultivation conditions
    - Same cultivar
    - Same harvest date
    - Same drying/processing batch
  
  sample_size_determination:
    method: "Square root rule or statistical table"
    example:
      batch_size_10_containers: "3 samples minimum"
      batch_size_100_containers: "10 samples"
      batch_size_1000_containers: "32 samples"
  
  sampling_procedure:
    personnel: "Trained QC personnel"
    equipment: "Clean sampling tools (thief sampler)"
    technique: "Aseptic, representative sampling"
    containers: "Clean, labeled sample containers"
    documentation: "Sample log + COC form"
  
  sample_types:
    identity_sample: "50 grams"
    assay_sample: "25 grams"
    contaminants_sample: "50 grams"
    microbial_sample: "25 grams"
    retention_sample: "3x batch quantity (for stability/investigation)"
```

### 9.2 Analytical Methods

**EMA Requirement:**
> "Test methods should be validated."

#### 9.2.1 Method Validation

**ICH Q2(R1) Compliance:**
```yaml
Analytical_Method_Validation:
  cannabinoid_assay_hplc:
    parameters:
      specificity: "Peak purity, no interference"
      linearity: "R² > 0.999, 5 points, 50-150% of target"
      accuracy: "Recovery 98-102%"
      precision:
        repeatability: "RSD < 2%"
        intermediate: "RSD < 3%"
      lod: "Signal-to-noise > 3:1"
      loq: "Signal-to-noise > 10:1"
      robustness: "Deliberate variations tested"
    
    system_suitability:
      - Resolution > 2.0
      - Tailing factor < 2.0
      - %RSD of replicate injections < 2%
      - Theoretical plates > 2000
    
    documentation: "Validation report + SOP"
  
  pesticide_residue_lcmsms:
    reference_method: "AOAC Official Method or equivalent"
    validation: "Per SANTE/11312/2021 (EU guidance)"
    accreditation: "ISO 17025 laboratory"
  
  microbial_testing:
    reference_method: "Ph.Eur. 2.6.12, 2.6.13"
    validation: "Method suitability + growth promotion"
    frequency: "Annual"
```

### 9.3 Certificate of Analysis (CoA)

**CoA Content:**
```typescript
interface CertificateOfAnalysis {
  header: {
    coaNumber: string;
    issueDate: Date;
    laboratoryName: string;
    accreditation: 'ISO 17025' | 'Internal GMP Lab';
  };
  
  materialIdentification: {
    materialName: 'Cannabis flos (dried flower)';
    cultivar: string;
    batchNumber: string;
    sampleDate: Date;
    sampleQuantity: string;
  };
  
  testResults: {
    identity: {
      macroscopic: 'Conforms to description';
      microscopic: 'Conforms to monograph';
      genetic: 'Verified (DNA fingerprint)';
    };
    
    phEurTests: {
      foreignMatter: { result: number; unit: '%'; specification: '< 2%'; status: 'PASS' | 'FAIL' };
      totalAsh: { result: number; unit: '%'; specification: '< 12%'; status: 'PASS' | 'FAIL' };
      moistureContent: { result: number; unit: '%'; specification: '8-12%'; status: 'PASS' | 'FAIL' };
    };
    
    cannabinoids: {
      thc: { result: number; unit: '%'; specification: string };
      cbd: { result: number; unit: '%'; specification: string };
      cbn: { result: number; unit: '%'; specification: string };
    };
    
    contaminants: {
      pesticides: { result: 'Below MRL' | 'Detected'; details?: string };
      heavyMetals: { pb: number; cd: number; hg: number; as: number; unit: 'ppm' };
      microbial: {
        tamc: { result: number; unit: 'CFU/g'; specification: '< 10^5'; status: 'PASS' | 'FAIL' };
        tymc: { result: number; unit: 'CFU/g'; specification: '< 10^4'; status: 'PASS' | 'FAIL' };
        ecoli: { result: 'Absent' | 'Detected'; specification: 'Absent in 1g' };
        salmonella: { result: 'Absent' | 'Detected'; specification: 'Absent in 10g' };
      };
    };
  };
  
  conclusion: {
    overallStatus: 'PASS' | 'FAIL';
    statement: string;  // "Meets specification" or reason for failure
  };
  
  signatures: {
    analyst: { name: string; date: Date; signature: string };
    reviewer: { name: string; date: Date; signature: string };
    approver: { name: string; title: 'Quality Manager'; date: Date; signature: string };
  };
}
```

## 10. EMA-Specific Compliance Matrix

### 10.1 Checklist

| EMA GACP Section | Requirement Summary | GACP-ERP Implementation | Evidence |
|------------------|---------------------|------------------------|----------|
| **Section 2** | Quality assurance system | QMS + Quality Manual | Quality Manual, SOPs |
| **Section 3** | Qualified personnel | Training matrix + records | Training database |
| **Section 4** | Premises & equipment | Facility qualification + calibration | IQ/OQ reports, calibration certificates |
| **Section 5** | Documentation | Document control system | Document management SOP |
| **Section 6** | Starting material identity | Botanical + genetic verification | Identity COA |
| **Section 7** | Cultivation operations | SOPs + batch records | Batch production records |
| **Section 8** | Harvest & processing | Harvest + drying SOPs | Processing records |
| **Section 9** | Packaging & storage | Packaging materials + storage mgmt | Material COAs, storage logs |
| **Section 10** | Quality control | Ph.Eur. testing + CoA | Analytical reports, CoAs |
| **Section 11** | Traceability | Seed to API tracking | Traceability reports |
| **Section 12** | Self-inspection | Internal audit program | Audit reports |

## 11. Glossary

| Term | Definition |
|------|------------|
| **EMA** | European Medicines Agency |
| **GACP** | Good Agricultural and Collection Practice |
| **Ph.Eur.** | European Pharmacopoeia (Pharmacopoea Europaea) |
| **MRL** | Maximum Residue Level (for pesticides) |
| **CoA** | Certificate of Analysis |
| **TAMC** | Total Aerobic Microbial Count |
| **TYMC** | Total Yeast and Mold Count |
| **ICH Q2(R1)** | International Council for Harmonisation - Analytical Validation |
| **ISO 17025** | General requirements for the competence of testing and calibration laboratories |

## 12. Revision History

| Version | Date | Description | Author | Approved By |
|---------|------|-------------|--------|-------------|
| 0.1 | 2025-09-01 | Initial reference | System | - |
| 1.0 | 2025-10-15 | Comprehensive EMA GACP compliance guide for EU market with Ph.Eur. integration, detailed quality standards, and traceability requirements | Compliance Team | Quality Director |

## 13. Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Author** | Compliance Officer | _________________ | __________ |
| **Technical Reviewer** | Quality Manager | _________________ | __________ |
| **Regulatory Reviewer** | Regulatory Affairs | _________________ | __________ |
| **Final Approver** | General Manager | _________________ | __________ |

---

**Document Control:**
- Document ID: COMP-EMA-001
- Location: /docs/compliance/EMA_GACP.md
- Classification: Internal - Restricted
- Next Review Date: 2026-10-15

## 14. References

- **EMA GACP Guidelines**: EMEA/HMPC/246816/2005 (2006)
- **European Pharmacopoeia**: Current edition + supplements
- **EU Directive 2001/83/EC**: Medicinal products for human use
- **Commission Regulation (EC) No 396/2005**: MRLs of pesticides
- **ICH Q2(R1)**: Validation of Analytical Procedures
- **ICH Q9**: Quality Risk Management
- **WHO GACP Guidelines**: WHO Technical Report Series No. 1025 (2020)
- **WHO_GACP.md**: Detailed cultivation procedures
- **EU GMP Annex 11**: Computerised systems
- **SOP_EquipmentManagement.md**: Equipment lifecycle management
- **SOP_EquipmentCalibration.md**: Calibration procedures
- **SOP_DryingCuring.md**: Post-harvest processing
- **SOP_DocumentControl.md**: Document management
- **VMP.md**: Validation Master Plan
