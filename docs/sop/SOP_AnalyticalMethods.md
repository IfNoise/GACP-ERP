---
title: "SOP: Analytical Methods"
module: "Laboratory Management"
version: "0.2"
status: "draft"
last_updated: "2025-09-02"
author: "Laboratory Manager"
approver: "Quality Manager"
effective_date: "TBD"
review_date: "2026-09-02"
# AI-Assisted Documentation Metadata (per AI_Assisted_Documentation_Policy.md)
ai_assisted: true
ai_tool: "GitHub Copilot (GPT-4)"
ai_model_version: "gpt-4-turbo-2024-04-09"
ai_usage_date: "2025-10-16"
ai_purpose: "Documentation generation and compliance review"

# Human Verification (per Section 6-7 of AI Policy)
author_id: "noise83"
author_verified: false  # Author must set to true after review
author_verification_date: null
author_signature_id: null  # Link to DS-ES-001 after e-signature

# QA Approval (per Section 6-7 of AI Policy)
qa_reviewer_id: null
qa_approved: false
qa_approval_date: null
qa_signature_id: null  # Link to DS-ES-001 after QA e-signature

# Document Control (per Section 8 of AI Policy)
document_status: "draft"  # draft | under_review | approved | effective
controlled_copy: false  # Must be false until QA approval
---

## SOP: Analytical Methods

## 1. Purpose

Установить стандартизированные, валидированные и соответствующие GACP аналитические методы для тестирования продукции каннабиса, обеспечивающие точные, надежные и воспроизводимые результаты анализов.

## 2. Scope

Данная процедура охватывает:

- Количественное определение каннабиноидов (HPLC-UV/DAD)
- Анализ терпенового профиля (GC-MS)
- Микробиологические испытания
- Определение тяжелых металлов (ICP-MS)
- Анализ остаточных пестицидов (LC-MS/MS, GC-MS/MS)
- Определение остаточных растворителей (GC-FID)
- Физико-химические испытания
- Контроль влажности и активности воды

## 3. Responsibilities

| Роль                             | Ответственность                          |
| -------------------------------- | ---------------------------------------- |
| **Laboratory Manager**           | Общее управление лабораторией и методами |
| **Method Development Scientist** | Разработка и валидация методов           |
| **Senior Analyst**               | Выполнение сложных анализов, обучение    |
| **Laboratory Analyst**           | Выполнение рутинных анализов             |
| **QA Laboratory**                | Контроль качества лабораторных данных    |
| **Instrument Technician**        | Обслуживание и калибровка приборов       |
| **Sample Coordinator**           | Управление потоком образцов              |

## 4. Method Validation Framework

### 4.1 ICH Q2(R1) Validation Parameters

#### 4.1.1 Validation Requirements by Method Type

| Parameter              | Quantitative | Limit Test | Identification |
| ---------------------- | ------------ | ---------- | -------------- |
| **Accuracy**           | ✓            | ✓          | -              |
| **Precision**          | ✓            | ✓          | -              |
| **Specificity**        | ✓            | ✓          | ✓              |
| **Detection Limit**    | ✓            | ✓          | -              |
| **Quantitation Limit** | ✓            | -          | -              |
| **Linearity**          | ✓            | -          | -              |
| **Range**              | ✓            | -          | -              |
| **Robustness**         | ✓            | ✓          | ✓              |

#### 4.1.2 Acceptance Criteria

```yaml
Validation_Criteria:
  accuracy:
    recovery_range: "95-105%"
    bias: "±5%"

  precision:
    repeatability_rsd: "<5%"
    intermediate_precision_rsd: "<10%"

  linearity:
    correlation_coefficient: ">0.995"
    lack_of_fit: "Not significant (p>0.05)"

  specificity:
    peak_purity: ">95%"
    resolution: ">2.0"

  robustness:
    system_suitability: "All parameters within limits"
    critical_parameters: "±10% variation acceptable"
```

## 5. Cannabinoid Analysis (HPLC-UV/DAD)

### 5.1 Method Overview

#### 5.1.1 Principle

- **Technique**: High Performance Liquid Chromatography with UV/Diode Array Detection
- **Separation**: Reverse phase chromatography (C18 column)
- **Detection**: UV absorption at 220nm and 280nm
- **Quantitation**: External standard calibration

#### 5.1.2 Target Analytes

| Cannabinoid                     | Abbreviation | Typical RT (min) | LOQ (%) |
| ------------------------------- | ------------ | ---------------- | ------- |
| **Δ9-Tetrahydrocannabinol**     | THC          | 15.2             | 0.05    |
| **Tetrahydrocannabinolic Acid** | THCA         | 12.8             | 0.05    |
| **Cannabidiol**                 | CBD          | 13.5             | 0.05    |
| **Cannabidiolic Acid**          | CBDA         | 11.2             | 0.05    |
| **Cannabigerol**                | CBG          | 10.8             | 0.02    |
| **Cannabinol**                  | CBN          | 18.3             | 0.02    |
| **Cannabichromene**             | CBC          | 16.7             | 0.02    |

### 5.2 Instrumentation and Conditions

#### 5.2.1 HPLC System Requirements

```yaml
HPLC_Conditions:
  system: "Agilent 1260 or equivalent"
  column: "Agilent Zorbax Eclipse Plus C18, 4.6x150mm, 3.5μm"
  guard_column: "Agilent Zorbax Eclipse Plus C18, 4.6x12.5mm"

  mobile_phase:
    A: "0.1% Formic acid in water"
    B: "0.1% Formic acid in acetonitrile"

  gradient:
    time_0min: "A:85%, B:15%"
    time_5min: "A:85%, B:15%"
    time_15min: "A:20%, B:80%"
    time_20min: "A:20%, B:80%"
    time_22min: "A:85%, B:15%"
    time_27min: "A:85%, B:15%"

  flow_rate: "1.0 mL/min"
  injection_volume: "10 μL"
  column_temperature: "30°C"
  detection_wavelength: "220nm (primary), 280nm (secondary)"
  run_time: "27 minutes"
```

#### 5.2.2 System Suitability Criteria

| Parameter              | Acceptance Criteria         |
| ---------------------- | --------------------------- |
| **Resolution**         | >2.0 between critical pairs |
| **Tailing Factor**     | 0.8-2.0 for all peaks       |
| **Theoretical Plates** | >3000 for THC               |
| **Reproducibility**    | RSD <2% for peak area (n=6) |
| **Baseline Noise**     | <5% of LOQ response         |

### 5.3 Sample Preparation

#### 5.3.1 Dried Cannabis Flower

1. **Decarboxylation Process**

   ```
   Step 1: Sample Preparation
   - Grind sample to pass through 20-mesh sieve
   - Weigh 100mg ± 1mg into decarboxylation vial
   - Add 10mL methanol

   Step 2: Decarboxylation
   - Heat at 145°C for 30 minutes
   - Cool to room temperature
   - Sonicate for 30 minutes

   Step 3: Filtration
   - Filter through 0.45μm PTFE filter
   - Dilute appropriately for analysis
   - Store at 4°C until analysis
   ```

#### 5.3.2 Cannabis Extracts

1. **Direct Dissolution Method**
   - Weigh 10-50mg extract (depending on potency)
   - Dissolve in 10mL methanol
   - Sonicate for 15 minutes
   - Filter through 0.22μm filter
   - Dilute to appropriate concentration

### 5.4 Calibration and Standards

#### 5.4.1 Reference Standards

- **Source**: Certified reference materials (Restek, Sigma-Aldrich)
- **Purity**: >98% with certificate of analysis
- **Storage**: -20°C in amber vials under nitrogen
- **Stability**: Verify monthly, replace annually

#### 5.4.2 Calibration Procedure

1. **Stock Solutions**

   - Prepare 1000μg/mL stock in methanol
   - Store at -20°C, stable for 1 year
   - Document preparation and storage

2. **Working Standards**
   - Prepare fresh daily from stock
   - Concentration range: 0.5-100μg/mL
   - Minimum 6 calibration points
   - Include quality control levels

## 6. Terpene Analysis (GC-MS)

### 6.1 Method Overview

#### 6.1.1 Principle

- **Technique**: Gas Chromatography-Mass Spectrometry
- **Separation**: Capillary column with temperature programming
- **Detection**: Electron ionization mass spectrometry
- **Quantitation**: Internal standard method

#### 6.1.2 Target Terpenes

| Terpene             | RT (min) | Qualifier Ions | Quantifier Ion |
| ------------------- | -------- | -------------- | -------------- |
| **α-Pinene**        | 8.45     | 93, 77, 121    | 93             |
| **β-Pinene**        | 9.12     | 93, 69, 121    | 93             |
| **Myrcene**         | 10.23    | 93, 69, 121    | 69             |
| **Limonene**        | 12.34    | 93, 68, 121    | 68             |
| **Linalool**        | 15.67    | 93, 71, 121    | 71             |
| **β-Caryophyllene** | 21.45    | 93, 69, 161    | 93             |
| **Humulene**        | 22.18    | 93, 69, 161    | 93             |

### 6.2 GC-MS Conditions

```yaml
GC_MS_Conditions:
  instrument: "Agilent 7890B GC / 5977A MS or equivalent"
  column: "HP-5MS, 30m x 0.25mm x 0.25μm"

  gc_conditions:
    injection_volume: "1 μL"
    injection_mode: "Split (10:1)"
    injector_temperature: "250°C"
    carrier_gas: "Helium, 1.0 mL/min constant flow"

    temperature_program:
      initial: "40°C, hold 2 min"
      ramp1: "10°C/min to 180°C"
      ramp2: "20°C/min to 280°C, hold 5 min"
      total_runtime: "24 minutes"

  ms_conditions:
    ionization: "EI, 70eV"
    source_temperature: "230°C"
    quad_temperature: "150°C"
    scan_mode: "SIM (Selected Ion Monitoring)"
    scan_range: "35-350 m/z (for full scan)"
```

### 6.3 Sample Preparation for Terpenes

#### 6.3.1 Static Headspace Method

1. **Fresh Cannabis Flower**

   ```
   Step 1: Sample Preparation
   - Use fresh, not dried material
   - Weigh 1.0g ± 0.1g into 20mL headspace vial
   - Add internal standard solution
   - Crimp seal with PTFE/silicone septum

   Step 2: Equilibration
   - Heat at 80°C for 30 minutes
   - Allow temperature equilibration
   - Analyze within 2 hours

   Step 3: Analysis
   - Inject 1mL headspace using heated syringe
   - Temperature: 85°C
   - Immediate injection to avoid losses
   ```

#### 6.3.2 Direct Injection Method (for extracts)

1. **Cannabis Extracts and Oils**
   - Dilute extract in pentane (1:100-1:1000)
   - Add internal standard
   - Filter if necessary
   - Analyze immediately

## 7. Microbiology Testing

### 7.1 Test Requirements

#### 7.1.1 Mandatory Microbiological Tests

| Test                    | Method       | Limit       | Sample Size |
| ----------------------- | ------------ | ----------- | ----------- |
| **Total Aerobic Count** | USP <61>     | <10^5 CFU/g | 1g          |
| **Total Yeast & Mold**  | USP <61>     | <10^4 CFU/g | 1g          |
| **E. coli**             | USP <62>     | <10 CFU/g   | 1g          |
| **Salmonella spp.**     | USP <62>     | Absent/1g   | 1g          |
| **STEC E. coli**        | AOAC 2011.09 | Absent/1g   | 1g          |

#### 7.1.2 Sample Preparation

1. **Sample Homogenization**

   - Aseptic sampling technique
   - Homogenize 1g in 9mL sterile diluent
   - Serial dilutions as needed
   - Plate within 2 hours

2. **Incubation Conditions**
   - Total Aerobic: 30-35°C, 48-72 hours
   - Yeast & Mold: 20-25°C, 5-7 days
   - E. coli: 35-37°C, 18-24 hours
   - Salmonella: Enrichment followed by selective plating

## 8. Heavy Metals Analysis (ICP-MS)

### 8.1 Target Elements

| Element          | LOQ (μg/g) | Action Limit (μg/g) | Method |
| ---------------- | ---------- | ------------------- | ------ |
| **Lead (Pb)**    | 0.1        | 0.5                 | ICP-MS |
| **Cadmium (Cd)** | 0.05       | 0.2                 | ICP-MS |
| **Mercury (Hg)** | 0.02       | 0.1                 | ICP-MS |
| **Arsenic (As)** | 0.1        | 0.2                 | ICP-MS |

### 8.2 Sample Preparation (Microwave Digestion)

1. **Digestion Protocol**

   ```
   Step 1: Sample Preparation
   - Weigh 0.5g dried sample into PTFE vessel
   - Add 8mL concentrated HNO3
   - Add 2mL 30% H2O2
   - Pre-digest for 15 minutes at room temperature

   Step 2: Microwave Digestion
   - Ramp to 180°C over 15 minutes
   - Hold at 180°C for 15 minutes
   - Cool to room temperature

   Step 3: Dilution
   - Transfer to 50mL volumetric flask
   - Dilute to volume with ultrapure water
   - Filter if necessary
   ```

### 8.3 ICP-MS Conditions

```yaml
ICPMS_Conditions:
  instrument: "Agilent 7900 or equivalent"
  sample_introduction:
    nebulizer: "MicroMist"
    spray_chamber: "Scott type, cooled to 2°C"
    sample_uptake: "0.3 mL/min"

  plasma_conditions:
    rf_power: "1550 W"
    plasma_gas: "15 L/min Ar"
    auxiliary_gas: "0.9 L/min Ar"
    carrier_gas: "1.05 L/min Ar"

  measurement_parameters:
    integration_time: "0.1 s per mass"
    replicates: "3"
    internal_standards: "Sc, Y, In, Bi"
```

## 9. Quality Control Procedures

### 9.1 Daily QC Requirements

#### 9.1.1 System Suitability

- **Frequency**: Beginning of each analytical sequence
- **Requirements**: All parameters within acceptance criteria
- **Documentation**: Electronic integration with LIMS
- **Action if Failed**: Do not proceed until corrected

#### 9.1.2 Quality Control Samples

| QC Type                    | Frequency        | Acceptance Criteria         |
| -------------------------- | ---------------- | --------------------------- |
| **Blank**                  | Every 10 samples | <LOQ for all analytes       |
| **Duplicate**              | Every 10 samples | RPD <20%                    |
| **Matrix Spike**           | Every 20 samples | 80-120% recovery            |
| **Reference Material**     | Daily            | ±10% of certified value     |
| **Continuing Calibration** | Every 10 samples | ±15% of initial calibration |

### 9.2 Method Performance Monitoring

#### 9.2.1 Control Charts

- **Accuracy**: Matrix spike recoveries
- **Precision**: Duplicate sample RPDs
- **Calibration**: Continuing calibration verification
- **Contamination**: Method blank results

#### 9.2.2 Out of Control Actions

1. **Investigation Requirements**

   - Immediate stop of sample analysis
   - Investigation of root cause
   - Documentation of findings
   - Corrective action implementation

2. **Re-analysis Criteria**
   - QC failure impact assessment
   - Sample re-analysis decision
   - Batch acceptance/rejection
   - Client notification if required

## 10. Data Management and LIMS Integration

### 10.1 Electronic Data Handling

#### 10.1.1 Data Flow

```yaml
Data_Flow:
  instrument_data:
    - Raw chromatograms/spectra
    - Integration parameters
    - Calibration data
    - QC results

  lims_integration:
    - Automatic data transfer
    - Sample tracking
    - Result approval workflow
    - Certificate generation

  data_integrity:
    - Audit trail maintenance
    - Electronic signatures
    - Change control
    - Backup procedures
```

#### 10.1.2 Data Review Process

1. **First Level Review** (Analyst)

   - Data quality assessment
   - Calculation verification
   - QC evaluation
   - Initial approval

2. **Second Level Review** (Supervisor)
   - Method compliance verification
   - QC trend analysis
   - Final approval
   - Certificate authorization

### 10.2 Result Reporting

#### 10.2.1 Certificate of Analysis Content

- **Sample Information**: ID, description, receipt date
- **Test Methods**: Reference to validated procedures
- **Results**: Values with uncertainty when appropriate
- **QC Summary**: QC sample results
- **Approval**: Electronic signatures of reviewer and authorizer

#### 10.2.2 Out of Specification Results

1. **Immediate Actions**

   - Investigation initiation
   - Customer notification
   - Sample retention
   - Documentation requirements

2. **Investigation Process**
   - Laboratory error assessment
   - Re-analysis consideration
   - Technical review
   - Final determination

## 11. Method Transfer and Technology Transfer

### 11.1 Method Transfer Protocol

#### 11.1.1 Pre-Transfer Requirements

- **Method Documentation**: Complete and current
- **Training Plan**: Receiving laboratory staff
- **Equipment Qualification**: Comparable instrumentation
- **Reference Standards**: Same source and grade

#### 11.1.2 Transfer Evaluation

1. **Precision Study**

   - Both laboratories analyze same samples
   - Statistical comparison of results
   - Acceptance criteria: No significant difference

2. **Accuracy Assessment**
   - Certified reference material analysis
   - Matrix spike recovery comparison
   - Bias evaluation

### 11.2 Continuous Improvement

#### 11.2.1 Method Optimization

- **Performance Monitoring**: Monthly reviews
- **Technology Updates**: Equipment upgrades
- **Regulatory Changes**: Method updates
- **Scientific Advances**: New techniques evaluation

#### 11.2.2 Innovation Projects

- **New Method Development**: Emerging analytes
- **Automation**: Sample preparation robotics
- **Faster Methods**: Reduced analysis time
- **Green Chemistry**: Solvent reduction

## 12. Training and Competency

### 12.1 Analyst Qualification

#### 12.1.1 Training Requirements

| Skill Level               | Training Hours | Competency Assessment |
| ------------------------- | -------------- | --------------------- |
| **Junior Analyst**        | 80 hours       | Written + Practical   |
| **Senior Analyst**        | 40 hours       | Method demonstration  |
| **Method Developer**      | 120 hours      | Validation execution  |
| **Laboratory Supervisor** | 60 hours       | Technical review      |

#### 12.1.2 Ongoing Training

- **Annual Update**: 16 hours minimum
- **New Methods**: Full training required
- **Equipment Changes**: Specific training
- **Regulatory Updates**: As needed

### 12.2 Competency Maintenance

#### 12.2.1 Performance Monitoring

- **QC Performance**: Individual analyst tracking
- **Proficiency Testing**: External programs
- **Internal Assessments**: Quarterly evaluations
- **Peer Reviews**: Method comparisons

#### 12.2.2 Corrective Training

- **Performance Issues**: Immediate retraining
- **Method Changes**: Update training
- **Equipment Problems**: Troubleshooting skills
- **Safety Incidents**: Safety reinforcement

## 13. References

- **URS-LAB-001**: User Requirements for Laboratory Management System
- **FS-LAB-001**: Functional Specification for Laboratory Operations
- **SOP_Sampling.md**: Sample collection procedures
- **SOP_DataIntegrity.md**: Laboratory data integrity
- ICH Q2(R1): Validation of Analytical Procedures
- USP <1058>: Analytical Instrument Qualification
- USP <61>: Microbiological Examination of Nonsterile Products
- AOAC Official Methods of Analysis
- ISO/IEC 17025: General Requirements for Testing and Calibration Laboratories

## 14. Revision History

| Version | Date       | Description                      | Author             |
| ------- | ---------- | -------------------------------- | ------------------ |
| 0.1     | 2025-09-01 | Initial template                 | System             |
| 0.2     | 2025-09-02 | Comprehensive analytical methods | Laboratory Manager |

## 15. Attachments

- Attachment A: Method Validation Protocols
- Attachment B: Instrument Operating Procedures
- Attachment C: QC Sample Preparation Instructions
- Attachment D: Data Review Checklists
- Attachment E: Method Transfer Protocol Template
