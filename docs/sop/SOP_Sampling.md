---
title: "SOP: Sampling Procedures"
module: "Quality Control & Laboratory"
version: "0.2"
status: "draft"
last_updated: "2025-09-02"
author: "QC Manager"
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

# SOP: Sampling Procedures

## 1. Purpose

Установить стандартизированные процедуры отбора репрезентативных проб продукции каннабиса на всех этапах производства для обеспечения объективного контроля качества, соответствия спецификациям и требованиям GACP.

## 2. Scope

Данная процедура охватывает:

- Отбор проб сырья (семена, клоны, удобрения, субстраты)
- Промежуточное тестирование растений в процессе выращивания
- Отбор проб готовой продукции (высушенные соцветия)
- Образцы для microbiological testing
- Environmental monitoring samples
- Retain samples для долгосрочного хранения
- Chain of custody procedures

## 3. Responsibilities

| Роль                       | Ответственность                                  |
| -------------------------- | ------------------------------------------------ |
| **QC Sampling Technician** | Выполнение процедур отбора проб                  |
| **QC Manager**             | Планирование отбора проб, утверждение процедур   |
| **Laboratory Analyst**     | Приём проб, анализ, выдача результатов           |
| **Production Supervisor**  | Координация с производством, доступ к материалам |
| **Quality Manager**        | Общий надзор за системой контроля качества       |
| **Compliance Officer**     | Соответствие нормативным требованиям             |

## 4. Sampling Principles

### 4.1 Statistical Principles

#### 4.1.1 Representative Sampling

- **Objective**: Обеспечить, чтобы проба отражала характеристики всей партии
- **Method**: Random sampling с использованием статистически обоснованных методов
- **Sample Size**: Определяется согласно статистическим таблицам (MIL-STD-105E)

#### 4.1.2 Sample Size Determination

| Batch Size          | Sample Size | Acceptance Number |
| ------------------- | ----------- | ----------------- |
| **1-50 units**      | 5 units     | 0 defects         |
| **51-150 units**    | 8 units     | 0 defects         |
| **151-500 units**   | 13 units    | 1 defect          |
| **501-1200 units**  | 20 units    | 1 defect          |
| **1201-3200 units** | 32 units    | 2 defects         |

### 4.2 GACP Compliance Requirements

#### 4.2.1 Traceability

- Каждая проба должна быть полностью прослеживаема до источника
- Unique sample ID linked to batch/lot numbers
- Complete chain of custody documentation
- Geographic and temporal tracking

#### 4.2.2 Integrity

- Samples must maintain integrity from collection to analysis
- Proper storage conditions
- Tamper-evident packaging
- Temperature and humidity monitoring

## 5. Sampling Equipment and Materials

### 5.1 Sampling Tools

| Equipment             | Specification                  | Purpose                 | Calibration            |
| --------------------- | ------------------------------ | ----------------------- | ---------------------- |
| **Sample Scoops**     | Stainless steel, various sizes | Solid material sampling | Visual inspection      |
| **Sample Containers** | Glass/plastic, sterile         | Sample storage          | Sterility verification |
| **Sampling Probe**    | Stainless steel, grain probe   | Deep sampling           | Monthly cleaning       |
| **Digital Scale**     | 0.001g precision               | Weight measurement      | Annual calibration     |
| **Thermometer**       | ±0.1°C accuracy                | Temperature monitoring  | Annual calibration     |
| **pH Meter**          | ±0.01 pH accuracy              | pH measurement          | Weekly calibration     |

### 5.2 Labeling and Documentation

#### 5.2.1 Sample Labels

```yaml
Sample_Label_Requirements:
  sample_id: "Unique identifier (QR code + human readable)"
  batch_lot_number: "Source identification"
  sampling_date_time: "YYYY-MM-DD HH:MM"
  sampler_id: "Technician identification"
  sample_type: "Raw material/In-process/Finished product"
  storage_conditions: "Temperature and humidity requirements"
  test_requirements: "Analytical methods needed"
  priority: "Routine/Rush/Emergency"
```

#### 5.2.2 Chain of Custody Form

- **Sample Information**: Complete identification and description
- **Transfer Record**: Time, date, signatures for each transfer
- **Storage Conditions**: Temperature, humidity, special requirements
- **Test Requests**: Specific analyses required
- **Expected Results Timeline**: When results are needed

## 6. Sampling Procedures by Product Type

### 6.1 Raw Material Sampling

#### 6.1.1 Seeds and Clones

1. **Visual Inspection**

   - Check for visible defects, discoloration, damage
   - Document any abnormalities
   - Photo documentation for records

2. **Sample Collection**

   - Random selection from different containers
   - Minimum 10% of incoming containers
   - Sample size: 50-100 seeds or 5-10 clones per lot

3. **Testing Requirements**
   - Viability testing
   - Pathogen screening
   - Genetic verification (if required)
   - Contaminant analysis

#### 6.1.2 Growing Media and Nutrients

1. **Representative Sampling**

   - Sample from different locations in bulk containers
   - Mix thoroughly before subsampling
   - Minimum 500g sample for solid media

2. **Sample Collection Process**
   ```yaml
   Growing_Media_Sampling:
     pre_sampling:
       - Visual inspection of containers
       - Check for contamination signs
       - Document storage conditions

     sampling:
       - Use clean sampling tools
       - Collect from multiple depths/locations
       - Combine into composite sample
       - Subsample for testing

     post_sampling:
       - Seal containers properly
       - Update inventory records
       - Transfer to laboratory
   ```

### 6.2 In-Process Sampling

#### 6.2.1 Plant Material During Growth

1. **Vegetative Stage Sampling**

   - **Purpose**: Nutrient status, pathogen screening
   - **Sample Type**: Leaf tissue, growing tips
   - **Frequency**: Weekly during critical growth phases
   - **Sample Size**: 2-3 leaves per plant, 10% of plants

2. **Flowering Stage Sampling**
   - **Purpose**: Cannabinoid development tracking
   - **Sample Type**: Small bud samples
   - **Frequency**: Bi-weekly during flowering
   - **Sample Size**: 0.5-1g per plant sampled

#### 6.2.2 Environmental Monitoring

1. **Air Quality Sampling**

   - **Microbial**: Petri dish exposure method
   - **Particulate**: Air filtration sampling
   - **Frequency**: Weekly in production areas
   - **Locations**: Multiple points throughout facility

2. **Water Quality Sampling**
   - **Source Water**: Daily testing
   - **Irrigation Water**: After treatment, before use
   - **Sample Volume**: 100ml minimum
   - **Parameters**: pH, EC, microbials, heavy metals

### 6.3 Finished Product Sampling

#### 6.3.1 Dried Cannabis Flower

1. **Batch Definition**

   - **Homogeneous Batch**: Same strain, same harvest date, same processing
   - **Maximum Batch Size**: 15 kg or one day's production
   - **Minimum Sample Size**: 0.25% of batch weight, minimum 1g

2. **Sampling Procedure**

   ```
   Step 1: Batch Identification
   - Verify batch number and documentation
   - Check batch homogeneity
   - Record environmental conditions

   Step 2: Sample Point Selection
   - Minimum 10 sampling points per batch
   - Random distribution throughout batch
   - Avoid edge effects and damaged material

   Step 3: Sample Collection
   - Use clean, sterile tools
   - Collect equal amounts from each point
   - Combine into composite sample
   - Mix thoroughly but gently

   Step 4: Subsampling
   - Divide composite into analysis portions
   - Retain sample portion
   - Reference sample portion
   - Label and document each portion
   ```

#### 6.3.2 Processed Products

1. **Extracts and Concentrates**

   - **Sample Size**: Minimum 1g or 1ml
   - **Sampling Points**: Beginning, middle, end of production run
   - **Homogenization**: Mix thoroughly before sampling
   - **Storage**: Appropriate container for product type

2. **Edibles and Infused Products**
   - **Sample Size**: Minimum 10 units or 50g
   - **Selection**: Random from production batch
   - **Special Considerations**: Homogeneity verification
   - **Storage**: Appropriate conditions for product stability

## 7. Sample Handling and Storage

### 7.1 Storage Conditions

| Sample Type      | Temperature       | Humidity         | Container          | Max Storage Time |
| ---------------- | ----------------- | ---------------- | ------------------ | ---------------- |
| **Dried Flower** | -20°C (long-term) | <60% RH          | Airtight glass     | 2 years          |
| **Fresh Plant**  | 4°C               | As collected     | Breathable bag     | 24 hours         |
| **Extracts**     | -20°C             | N/A              | Amber glass        | 1 year           |
| **Edibles**      | Per product req.  | Per product req. | Original packaging | Per stability    |
| **Water**        | 4°C               | N/A              | Sterile glass      | 48 hours         |

### 7.2 Sample Security

#### 7.2.1 Access Control

- **Authorized Personnel**: Only trained QC staff
- **Sample Storage Area**: Restricted access, keycard entry
- **Inventory Tracking**: Real-time location and status updates
- **Surveillance**: 24/7 video monitoring of sample areas

#### 7.2.2 Chain of Custody

1. **Sample Collection**

   - Collector signature and timestamp
   - Witness signature (if required)
   - Initial seal placement
   - Photo documentation

2. **Sample Transfer**

   - Transfer log completion
   - Recipient verification
   - Condition assessment
   - Seal integrity check

3. **Laboratory Receipt**
   - Condition upon receipt
   - Transfer to appropriate storage
   - System entry and tracking
   - Analysis assignment

## 8. Analytical Testing Requirements

### 8.1 Mandatory Testing (Regulatory)

#### 8.1.1 Safety Testing

| Test Category         | Parameters                                    | Method          | Frequency     |
| --------------------- | --------------------------------------------- | --------------- | ------------- |
| **Microbials**        | Total aerobic, yeast/mold, E.coli, Salmonella | USP, AOAC       | Every batch   |
| **Heavy Metals**      | Lead, cadmium, mercury, arsenic               | ICP-MS          | Every batch   |
| **Pesticides**        | Per state regulations                         | LC-MS/MS, GC-MS | Every batch   |
| **Residual Solvents** | Class 1, 2, 3 solvents                        | GC-FID/MS       | If applicable |

#### 8.1.2 Potency Testing

- **Cannabinoids**: THC, THCA, CBD, CBDA, CBG, CBN
- **Method**: HPLC-UV/DAD
- **Frequency**: Every batch
- **Accuracy**: ±10% of labeled amount

### 8.2 Quality Testing (Internal)

#### 8.2.1 Physical Properties

- **Moisture Content**: Karl Fischer or LOD
- **Water Activity**: AquaLab or equivalent
- **Particle Size**: Sieve analysis
- **Foreign Matter**: Visual inspection, microscopy

#### 8.2.2 Chemical Properties

- **Terpene Profile**: GC-MS analysis
- **pH**: Electronic pH meter
- **Ash Content**: Gravimetric analysis
- **Extractable Matter**: Solvent extraction

## 9. Sample Documentation and Records

### 9.1 Sample Log Books

#### 9.1.1 Master Sample Log

```yaml
Sample_Log_Entry:
  entry_number: "Sequential number"
  sample_id: "Unique identifier"
  date_collected: "YYYY-MM-DD"
  time_collected: "HH:MM"
  sampler: "Technician name and ID"

  source_information:
    batch_number: "Source batch/lot"
    product_type: "Category description"
    location: "Where sample was taken"
    quantity: "Amount sampled"

  storage_information:
    location: "Storage area/freezer"
    conditions: "Temperature/humidity"
    container_type: "Description"
    expected_stability: "Storage duration"

  testing_plan:
    tests_requested: ["list of analyses"]
    priority: "Routine/Rush/Emergency"
    expected_completion: "Target date"
    assigned_analyst: "Lab personnel"
```

### 9.2 Digital Records Integration

#### 9.2.1 ERP System Integration

- **Real-time Data Entry**: Tablet-based field entry
- **Barcode Integration**: Sample tracking throughout process
- **Automated Workflows**: Test assignment and tracking
- **Results Integration**: Direct LIMS connection

#### 9.2.2 Audit Trail Requirements

- **Complete Traceability**: From collection to disposal
- **Access Logging**: Who accessed samples when
- **Change Documentation**: Any modifications to sample status
- **Integrity Verification**: Regular system checks

## 10. Quality Control of Sampling Process

### 10.1 Sampling Validation

#### 10.1.1 Method Validation

1. **Precision Study**

   - Multiple samples from same batch
   - Statistical analysis of variation
   - Acceptance criteria: RSD <10%

2. **Bias Assessment**
   - Comparison with reference methods
   - Spiked sample recovery studies
   - Acceptance criteria: 90-110% recovery

#### 10.1.2 Sampler Qualification

1. **Training Requirements**

   - Theoretical knowledge assessment
   - Practical demonstration
   - Annual requalification

2. **Performance Monitoring**
   - Regular observation of technique
   - Review of sampling records
   - Corrective training if needed

### 10.2 Sampling Plan Review

#### 10.2.1 Statistical Review

- **Monthly**: Sample size adequacy
- **Quarterly**: Sampling frequency optimization
- **Annually**: Complete procedure review
- **As needed**: Regulatory requirement changes

#### 10.2.2 Continuous Improvement

1. **Data Analysis**

   - Trend analysis of results
   - Identification of patterns
   - Process optimization opportunities

2. **Technology Upgrades**
   - Automated sampling equipment
   - Improved tracking systems
   - Enhanced analytical methods

## 11. Training Requirements

### 11.1 Sampling Technician Training

#### 11.1.1 Core Competencies

| Topic                      | Duration | Method          | Assessment          |
| -------------------------- | -------- | --------------- | ------------------- |
| **Sampling Theory**        | 4 hours  | Classroom       | Written exam (80%)  |
| **Statistical Principles** | 2 hours  | Classroom       | Written exam (80%)  |
| **Hands-on Technique**     | 8 hours  | Practical       | Demonstration       |
| **Documentation**          | 2 hours  | System training | Practical test      |
| **Safety Procedures**      | 2 hours  | Classroom       | Written exam (100%) |

#### 11.1.2 Specialized Training

- **Microbial Sampling**: Aseptic technique, sterility
- **Chemical Sampling**: Contamination prevention
- **Physical Sampling**: Representative collection
- **Environmental Sampling**: Monitoring protocols

### 11.2 Training Records

- **Individual Training Matrix**: Competencies achieved
- **Practical Assessments**: Hands-on evaluations
- **Continuing Education**: Annual updates
- **Requalification**: Periodic competency verification

## 12. Emergency and Deviation Procedures

### 12.1 Sampling Deviations

#### 12.1.1 Common Deviations

- **Insufficient Sample Size**: Resampling if possible
- **Sample Contamination**: Investigation and resampling
- **Chain of Custody Breaks**: Incident investigation
- **Storage Condition Failures**: Sample integrity assessment

#### 12.1.2 Deviation Response

1. **Immediate Actions**

   - Stop sampling process
   - Secure remaining samples
   - Notify QC Manager
   - Document incident

2. **Investigation Process**
   - Root cause analysis
   - Impact assessment
   - Corrective actions
   - Preventive measures

### 12.2 Emergency Sampling

#### 12.2.1 Complaint Investigations

- **Rapid Response**: Within 4 hours
- **Enhanced Documentation**: Complete photo record
- **Expanded Testing**: Additional parameters
- **Regulatory Notification**: If required

#### 12.2.2 Recall Situations

- **Retain Sample Analysis**: Immediate priority
- **Batch Investigation**: Complete testing
- **Supply Chain Sampling**: Upstream/downstream
- **Documentation**: Comprehensive records

## 13. Performance Indicators

### 13.1 Key Metrics

| KPI                         | Target           | Measurement Method           |
| --------------------------- | ---------------- | ---------------------------- |
| **Sampling Timeliness**     | 100% on schedule | Collection vs. planned dates |
| **Sample Integrity**        | 99.5% acceptable | Condition upon receipt       |
| **Documentation Accuracy**  | 100% complete    | Audit findings               |
| **Test Result Variability** | RSD <10%         | Statistical analysis         |
| **Sampler Qualification**   | 100% current     | Training records             |

### 13.2 Regular Reviews

- **Weekly**: Sample collection performance
- **Monthly**: Statistical analysis of results
- **Quarterly**: Procedure effectiveness
- **Annually**: Complete system review

## 14. References

- **URS-SAMP-001**: User Requirements for Sampling System
- **FS-SAMP-001**: Functional Specification for Sampling
- **SOP_DataIntegrity.md**: Data integrity requirements
- **SOP_AuditTrail.md**: Audit trail procedures
- GACP Guidelines (WHO, EMA)
- ASTM E122: Standard Practice for Calculating Sample Size
- ICH Q2(R1): Validation of Analytical Procedures
- USP <1058>: Analytical Instrument Qualification

## 15. Revision History

| Version | Date       | Description                       | Author     |
| ------- | ---------- | --------------------------------- | ---------- |
| 0.1     | 2025-09-01 | Initial template                  | System     |
| 0.2     | 2025-09-02 | Comprehensive sampling procedures | QC Manager |

## 16. Attachments

- Attachment A: Sample Collection Forms
- Attachment B: Chain of Custody Templates
- Attachment C: Statistical Sampling Tables
- Attachment D: Emergency Sampling Procedures
- Attachment E: Sampling Equipment Calibration Records
