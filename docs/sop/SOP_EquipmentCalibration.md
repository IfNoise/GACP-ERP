---
title: "SOP: Equipment Calibration"
module: "Equipment Management"
version: "0.2"
status: "draft"
last_updated: "2025-09-02"
author: "Engineering Manager"
approver: "Quality Manager"
effective_date: "TBD"
review_date: "2026-09-02"
---

## SOP: Equipment Calibration

### 1. Purpose

Установить систематическую программу калибровки измерительного и технологического оборудования для обеспечения точности и надежности измерений в соответствии с требованиями GACP и регуляторных стандартов.

### 2. Scope

Данная процедура охватывает:

- Идентификацию и классификацию оборудования
- Планирование и выполнение калибровки
- Калибровочные стандарты и референтные материалы
- Документирование результатов калибровки
- Управление калибровочными статусами
- Действия при выходе из спецификации
- Обслуживание калибровочных записей

### 3. Equipment Classification

#### 3.1 Critical Equipment (Class A)

**Definition**: Оборудование, прямо влияющее на качество продукции или безопасность

| Equipment Type              | Examples                      | Calibration Frequency |
| --------------------------- | ----------------------------- | --------------------- |
| **Analytical Balances**     | Sartorius, Mettler Toledo     | Monthly               |
| **HPLC Systems**            | Agilent 1260, Waters          | Quarterly             |
| **GC-MS Systems**           | Agilent 7890/5977             | Quarterly             |
| **Temperature Controllers** | Growth chambers, drying rooms | Monthly               |
| **pH Meters**               | Benchtop, portable            | Monthly               |
| **Pressure Gauges**         | HVAC, irrigation systems      | Quarterly             |
| **Flow Meters**             | Water, air systems            | Quarterly             |

#### 3.2 Important Equipment (Class B)

**Definition**: Оборудование, косвенно влияющее на качество продукции

| Equipment Type              | Examples                  | Calibration Frequency |
| --------------------------- | ------------------------- | --------------------- |
| **Temperature Loggers**     | Environmental monitoring  | Quarterly             |
| **Humidity Sensors**        | RH monitoring             | Semi-annually         |
| **Light Meters**            | PAR sensors, lux meters   | Semi-annually         |
| **Conductivity Meters**     | Water quality testing     | Quarterly             |
| **Scales (Non-analytical)** | Platform scales, shipping | Semi-annually         |

#### 3.3 Non-Critical Equipment (Class C)

**Definition**: Оборудование общего назначения, не влияющее на качество

| Equipment Type      | Examples            | Calibration Frequency |
| ------------------- | ------------------- | --------------------- |
| **Timers**          | Process timing      | Annually              |
| **Rulers/Calipers** | General measurement | Annually              |
| **Thermocouples**   | General temperature | Annually              |

### 4. Responsibilities

| Role                       | Responsibility                             |
| -------------------------- | ------------------------------------------ |
| **Engineering Manager**    | Общее управление программой калибровки     |
| **Calibration Technician** | Выполнение калибровочных процедур          |
| **Equipment Owner**        | Поддержание оборудования, уведомления      |
| **Quality Assurance**      | Аудит программы калибровки, утверждение    |
| **Metrology Lab**          | Внешние калибровочные услуги               |
| **Maintenance Team**       | Техническое обслуживание перед калибровкой |

### 5. Calibration Standards and Traceability

#### 5.1 Reference Standards Hierarchy

```
Primary Standards (NIST traceable)
    ↓
Secondary Standards (Company reference)
    ↓
Working Standards (Daily use)
    ↓
Test Equipment (Process measurement)
```

#### 5.2 Standard Requirements

| Standard Type | Accuracy Requirements  | Calibration Source     |
| ------------- | ---------------------- | ---------------------- |
| **Primary**   | 4:1 ratio to equipment | NIST or equivalent NMI |
| **Secondary** | 3:1 ratio to equipment | Accredited lab         |
| **Working**   | 3:1 ratio to equipment | Internal or external   |

#### 5.3 Calibration Environment Requirements

| Parameter         | Specification    | Monitoring        |
| ----------------- | ---------------- | ----------------- |
| **Temperature**   | 20±2°C           | Continuous        |
| **Humidity**      | 45-65% RH        | Continuous        |
| **Vibration**     | <10 Hz, <0.5g    | As needed         |
| **Power Quality** | Stable, filtered | UPS protected     |
| **Cleanliness**   | ISO 8 or better  | Visual inspection |

### 6. Calibration Procedure

#### 6.1 Pre-Calibration Activities

##### 6.1.1 Equipment Assessment

1. **Visual Inspection**

   - Physical condition check
   - Damage assessment
   - Cleanliness verification
   - Connection integrity

2. **Operational Check**

   - Power-on self-test
   - Basic functionality
   - Range verification
   - Display/readout check

3. **Documentation Review**
   - Previous calibration record
   - Maintenance history
   - User manual consultation
   - Procedure identification

##### 6.1.2 Environmental Preparation

```yaml
Environmental_Setup:
  temperature:
    target: "20°C"
    tolerance: "±2°C"
    stabilization_time: "30 minutes"

  humidity:
    target: "50% RH"
    tolerance: "±15% RH"
    monitoring: "Continuous"

  power:
    source: "Stable, filtered"
    warm_up_time: "As per manufacturer"
    voltage_tolerance: "±5%"
```

#### 6.2 Calibration Execution

##### 6.2.1 Multi-Point Calibration

1. **Point Selection**

   - Minimum 5 points across range
   - Include 0%, 25%, 50%, 75%, 100%
   - Add critical operating points
   - Include safety alarm levels

2. **Measurement Sequence**

   ```
   Ascending: 0% → 25% → 50% → 75% → 100%
   Descending: 100% → 75% → 50% → 25% → 0%
   Repeat: Second ascending run
   ```

3. **Data Collection**
   - Standard value (input)
   - Equipment reading (output)
   - Environmental conditions
   - Operator identification
   - Time stamps

##### 6.2.2 Statistical Analysis

| Parameter      | Calculation                                | Acceptance Criteria |
| -------------- | ------------------------------------------ | ------------------- |
| **Accuracy**   | (Reading - True Value) / True Value × 100% | ±0.5% for Class A   |
| **Precision**  | Standard deviation of repeated readings    | <0.3% for Class A   |
| **Linearity**  | Correlation coefficient                    | R² > 0.999          |
| **Hysteresis** | Max difference ascending vs descending     | <0.2% for Class A   |

#### 6.3 Calibration Documentation

##### 6.3.1 Calibration Certificate Content

```yaml
Certificate_Fields:
  header:
    - Equipment identification
    - Serial number
    - Model number
    - Location/department
    - Calibration date
    - Due date
    - Technician ID

  standards_used:
    - Standard ID
    - Certification number
    - Traceability
    - Uncertainty

  results:
    - As-found condition
    - Calibration data
    - Adjustments made
    - As-left condition
    - Uncertainty statement

  disposition:
    - Pass/fail determination
    - Limitations if any
    - Recommended actions
    - Next calibration due
```

##### 6.3.2 Electronic Records Management

1. **LIMS Integration**

   - Automatic data upload
   - Equipment database update
   - Schedule generation
   - Alert configuration

2. **Document Control**
   - Version management
   - Access permissions
   - Audit trail maintenance
   - Backup procedures

### 7. Calibration Intervals

#### 7.1 Interval Determination Factors

| Factor                          | Impact on Interval            | Adjustment     |
| ------------------------------- | ----------------------------- | -------------- |
| **Stability History**           | Good = extend, Poor = shorten | ±25%           |
| **Usage Frequency**             | High = shorten, Low = extend  | ±20%           |
| **Environmental Conditions**    | Harsh = shorten               | -30%           |
| **Criticality**                 | Critical = shorten            | -20%           |
| **Manufacturer Recommendation** | Base guideline                | Starting point |

#### 7.2 Interval Optimization

##### 7.2.1 Statistical Approach

1. **Reliability Analysis**

   - Probability of staying in tolerance
   - Confidence level: 95%
   - Risk tolerance: 2%

2. **Cost-Benefit Analysis**

   ```
   Total Cost = Calibration Cost + Risk Cost

   Where:
   Calibration Cost = Frequency × Cost per calibration
   Risk Cost = Probability of failure × Impact cost
   ```

##### 7.2.2 Interval Review Process

- **Quarterly Reviews**: Class A equipment
- **Annual Reviews**: All equipment classes
- **Trend Analysis**: Drift patterns
- **Adjustment Rationale**: Documented justification

### 8. Out-of-Specification Handling

#### 8.1 Immediate Actions

1. **Equipment Quarantine**

   ```yaml
   Quarantine_Process:
     physical_isolation:
       - Remove from service
       - Tag as "OUT OF CALIBRATION"
       - Secure location

     notification:
       - Equipment owner
       - Quality assurance
       - Department manager
       - Affected users

     investigation:
       - Impact assessment
       - Root cause analysis
       - Corrective action plan
       - Documentation requirements
   ```

2. **Impact Assessment**
   - Products affected since last calibration
   - Data validity evaluation
   - Customer notification requirements
   - Regulatory reporting needs

#### 8.2 Investigation Procedure

##### 8.2.1 Technical Investigation

1. **Equipment Evaluation**

   - Repeat calibration
   - Component inspection
   - Maintenance history review
   - Environmental factor analysis

2. **Data Review**
   - Historical calibration trends
   - Usage patterns
   - Maintenance correlation
   - Stability assessment

##### 8.2.2 Product Impact Assessment

| Assessment Area     | Evaluation Criteria                   | Documentation     |
| ------------------- | ------------------------------------- | ----------------- |
| **Production Lots** | All lots since last valid calibration | Lot genealogy     |
| **Test Results**    | Validity of analytical data           | Test invalidation |
| **Releases**        | Product disposition                   | Release hold      |
| **Customer Impact** | Field product assessment              | Notification plan |

### 9. Calibration Service Providers

#### 9.1 External Service Qualification

##### 9.1.1 Accreditation Requirements

- **ISO/IEC 17025** accreditation for specific parameters
- **NIST Traceability** documentation
- **A2LA/NVLAP** recognition preferred
- **Scope Coverage** matching equipment needs

##### 9.1.2 Service Provider Evaluation

| Criteria                 | Weight | Evaluation Method         |
| ------------------------ | ------ | ------------------------- |
| **Technical Competence** | 30%    | Audit, credentials review |
| **Quality System**       | 25%    | ISO 17025 assessment      |
| **Traceability**         | 20%    | Certification review      |
| **Turnaround Time**      | 15%    | Performance history       |
| **Cost**                 | 10%    | Competitive analysis      |

#### 9.2 Service Agreement Requirements

```yaml
Service_Agreement:
  technical_requirements:
    - Measurement uncertainty statements
    - Environmental conditions
    - Procedure compliance
    - Adjustment limitations

  administrative:
    - Turnaround commitments
    - Reporting format
    - Data delivery method
    - Problem resolution

  quality:
    - Nonconformance handling
    - Corrective action process
    - Continuous improvement
    - Performance metrics
```

### 10. Internal Calibration Capabilities

#### 10.1 Laboratory Setup

##### 10.1.1 Physical Requirements

- **Dedicated Space**: Environmentally controlled
- **Vibration Isolation**: Granite slabs, isolation pads
- **Electrical**: Clean power, grounding
- **Storage**: Reference standards, tools
- **Workspace**: Adequate bench space

##### 10.1.2 Equipment Inventory

| Standard Type             | Range          | Uncertainty | Traceable To |
| ------------------------- | -------------- | ----------- | ------------ |
| **Mass Standards**        | 1mg - 20kg     | Class F1    | NIST         |
| **Temperature Standards** | -50°C to 300°C | ±0.1°C      | NIST         |
| **Pressure Standards**    | 0-100 psi      | ±0.01% FS   | NIST         |
| **Electrical Standards**  | DC/AC, V/I/R   | 4½ digit    | NIST         |

#### 10.2 Personnel Qualifications

##### 10.2.1 Training Requirements

| Skill Level       | Education          | Experience | Certification         |
| ----------------- | ------------------ | ---------- | --------------------- |
| **Technician I**  | Technical degree   | 1 year     | Company certified     |
| **Technician II** | Technical degree   | 3 years    | External training     |
| **Senior Tech**   | Engineering degree | 5 years    | ASQ CQT preferred     |
| **Supervisor**    | Engineering degree | 7 years    | Professional engineer |

##### 10.2.2 Competency Assessment

1. **Written Examination**

   - Metrology principles
   - Statistical concepts
   - Procedure knowledge
   - Documentation requirements

2. **Practical Demonstration**
   - Equipment setup
   - Calibration execution
   - Data analysis
   - Report generation

### 11. Quality Assurance

#### 11.1 Program Audit

##### 11.1.1 Internal Audits

- **Frequency**: Semi-annual
- **Scope**: All calibration activities
- **Auditor**: QA personnel or trained designee
- **Documentation**: Audit reports, CAPA plans

##### 11.1.2 Audit Checklist Items

```yaml
Audit_Areas:
  documentation:
    - Procedure currency
    - Record completeness
    - Traceability verification
    - Change control compliance

  execution:
    - Technician competency
    - Procedure compliance
    - Equipment condition
    - Environmental monitoring

  management:
    - Schedule adherence
    - Resource adequacy
    - Management review
    - Continuous improvement
```

#### 11.2 Performance Metrics

##### 11.2.1 Key Performance Indicators

| Metric                      | Target   | Measurement             | Frequency |
| --------------------------- | -------- | ----------------------- | --------- |
| **On-Time Calibration**     | >95%     | Completed vs scheduled  | Monthly   |
| **First-Pass Rate**         | >90%     | Pass without adjustment | Monthly   |
| **Customer Satisfaction**   | >4.5/5   | Survey results          | Quarterly |
| **Measurement Uncertainty** | Minimize | Uncertainty analysis    | Annually  |

##### 11.2.2 Trending and Analysis

1. **Statistical Process Control**

   - Control charts for key metrics
   - Trend identification
   - Out-of-control investigations
   - Process improvement initiatives

2. **Management Review**
   - Monthly metrics review
   - Quarterly trend analysis
   - Annual program assessment
   - Resource planning

### 12. Measurement Uncertainty

#### 12.1 Uncertainty Budget

##### 12.1.1 Uncertainty Components

| Source                 | Type | Evaluation Method        | Typical Contribution |
| ---------------------- | ---- | ------------------------ | -------------------- |
| **Reference Standard** | B    | Certificate data         | 40-60%               |
| **Resolution**         | B    | Rectangular distribution | 5-15%                |
| **Repeatability**      | A    | Statistical analysis     | 20-40%               |
| **Environmental**      | B    | Specification limits     | 5-20%                |
| **Drift**              | B    | Historical data          | 5-15%                |

##### 12.1.2 Uncertainty Calculation

```
Standard Uncertainty: u(xi) = uncertainty of component i
Combined Uncertainty: uc = √(Σui²)
Expanded Uncertainty: U = k × uc (k=2 for 95% confidence)
```

#### 12.2 Uncertainty Reporting

##### 12.2.1 Statement Format

"The measurement uncertainty is ±X units at the 95% confidence level (k=2)"

##### 12.2.2 Application Guidelines

- **Decision Making**: Include uncertainty in acceptance decisions
- **Risk Assessment**: Consider measurement risk
- **Guard Banding**: Apply appropriate safety factors
- **Customer Communication**: Explain uncertainty significance

### 13. Technology and Innovation

#### 13.1 Automated Calibration Systems

##### 13.1.1 Benefits

- **Consistency**: Eliminates human variability
- **Efficiency**: Reduces labor requirements
- **Documentation**: Automatic record generation
- **Accuracy**: Precise measurement execution

##### 13.1.2 Implementation Considerations

| Factor          | Consideration                    | Impact                  |
| --------------- | -------------------------------- | ----------------------- |
| **Cost**        | Equipment + software + training  | High initial investment |
| **Complexity**  | System integration               | Medium complexity       |
| **Flexibility** | Limited to programmed procedures | Reduced flexibility     |
| **ROI**         | Labor savings + error reduction  | 2-3 year payback        |

#### 13.2 Digital Transformation

##### 13.2.1 Electronic Calibration Systems

```yaml
Digital_Features:
  data_collection:
    - Automatic data capture
    - Real-time analysis
    - Error detection
    - Trend monitoring

  documentation:
    - Electronic certificates
    - Digital signatures
    - Version control
    - Audit trails

  management:
    - Automated scheduling
    - Resource optimization
    - Performance tracking
    - Predictive maintenance
```

### 14. Regulatory Compliance

#### 14.1 Applicable Standards

| Standard               | Scope                 | Requirements                    |
| ---------------------- | --------------------- | ------------------------------- |
| **ISO 9001**           | Quality management    | Documented calibration process  |
| **ISO/IEC 17025**      | Laboratory competence | Technical requirements          |
| **FDA 21 CFR Part 11** | Electronic records    | Electronic signature compliance |
| **USP <41>**           | Weights and measures  | Pharmaceutical applications     |

#### 14.2 Validation Requirements

##### 14.2.1 Software Validation

- **User Requirements**: Functional specifications
- **Risk Assessment**: GxP impact analysis
- **Testing**: IQ/OQ/PQ protocols
- **Documentation**: Validation reports

##### 14.2.2 Change Control

- **Impact Assessment**: Risk evaluation
- **Testing Requirements**: Validation update
- **Documentation**: Change records
- **Training**: User updates

### 15. References

- **URS-ENG-001**: User Requirements for Equipment Management
- **FS-ENG-001**: Functional Specification for Calibration System
- **SOP_EquipmentMaintenance.md**: Preventive maintenance procedures
- **SOP_ChangeControl.md**: Change management process
- ISO/IEC 17025:2017 - General requirements for the competence of testing and calibration laboratories
- ANSI/NCSL Z540.3-2006 - Requirements for the Calibration of Measuring and Test Equipment
- NIST Special Publication 811 - Guide for the Use of the International System of Units (SI)
- VIM (International Vocabulary of Metrology) - Basic and general concepts and associated terms

### 16. Revision History

| Version | Date       | Description                          | Author              |
| ------- | ---------- | ------------------------------------ | ------------------- |
| 0.1     | 2025-09-01 | Initial template                     | System              |
| 0.2     | 2025-09-02 | Comprehensive calibration procedures | Engineering Manager |

### 17. Attachments

- Attachment A: Equipment Classification Database
- Attachment B: Calibration Interval Worksheets
- Attachment C: Uncertainty Budget Templates
- Attachment D: Service Provider Qualification Forms
- Attachment E: Calibration Certificate Templates
