---
title: "SOP: Deviation Management and CAPA System"
module: "Quality Management System"
version: "1.0"
status: "active"
last_updated: "2025-10-15"
author: "Quality Manager"
approver: "Quality Director"
effective_date: "2025-10-15"
review_date: "2026-10-15"
regulatory_basis: "ICH Q9/Q10, FDA OOS Guidance, EU GMP, WHO GACP"
---

## SOP: Deviation Management

### 1. Purpose

Установить систематический подход к управлению отклонениями от установленных процедур, обеспечивающий немедленное выявление, документирование, расследование и корректировку отклонений для поддержания качества продукции и соответствия GACP.

### 2. Scope

Данная процедура охватывает:

- Идентификацию и классификацию отклонений
- Немедленные действия и уведомления
- Расследование и анализ первопричин
- Оценку влияния на качество продукции
- Корректирующие и предупреждающие действия (CAPA)
- Тренды и статистический анализ отклонений
- Документирование и архивирование

### 3. Definitions

| Term                   | Definition                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| **Deviation**          | Отклонение от утвержденной процедуры, спецификации или стандарта                         |
| **Critical Deviation** | Отклонение, которое может повлиять на безопасность, эффективность или качество продукции |
| **Major Deviation**    | Отклонение, которое может повлиять на качество продукции, но не на безопасность          |
| **Minor Deviation**    | Отклонение, которое не влияет на качество или безопасность продукции                     |
| **Root Cause**         | Основная причина отклонения, устранение которой предотвращает повторение                 |
| **CAPA**               | Corrective and Preventive Actions - корректирующие и предупреждающие действия            |

### 4. Responsibilities

| Role                          | Responsibility                                   |
| ----------------------------- | ------------------------------------------------ |
| **Personnel (All)**           | Немедленное сообщение об отклонениях             |
| **Shift Supervisor**          | Первичная оценка и немедленные действия          |
| **Quality Assurance Manager** | Классификация, утверждение расследований         |
| **QA Investigator**           | Проведение расследований отклонений              |
| **Production Manager**        | Расследование производственных отклонений        |
| **Laboratory Manager**        | Расследование лабораторных отклонений            |
| **Subject Matter Expert**     | Техническая экспертиза по специфическим областям |
| **Quality Director**          | Утверждение CAPA, надзор за программой           |

### 5. Deviation Classification

#### 5.1 Severity Classification

##### 5.1.1 Critical Deviations

**Criteria**:

- Potential impact on product safety or efficacy
- Regulatory compliance violations
- GMP/GACP critical requirements breach
- Patient/consumer safety risk

**Examples**:

- Микробиологические контаминации
- Неутвержденные изменения в критических процессах
- Нарушения стерильности
- Отказы критических систем контроля
- Неправильное обращение с возвращенной продукцией

**Response Time**: Немедленно (в течение 2 часов)

##### 5.1.2 Major Deviations

**Criteria**:

- Potential impact on product quality
- Non-critical GMP/GACP requirements breach
- Documentation discrepancies
- Equipment malfunction without safety impact

**Examples**:

- Отклонения в спецификациях сырья
- Документационные ошибки
- Неисправности оборудования без влияния на продукт
- Нарушения процедур отбора проб
- Отклонения в условиях хранения

**Response Time**: В течение 24 часов

##### 5.1.3 Minor Deviations

**Criteria**:

- No impact on product quality or safety
- Administrative or housekeeping issues
- Training documentation gaps
- Minor procedural variations

**Examples**:

- Опоздания в документировании
- Косметические повреждения упаковки
- Незначительные административные ошибки
- Процедурные вариации без влияния на качество

**Response Time**: В течение 72 часов

#### 5.2 Area Classification

| Area                     | Examples                               | Specific Considerations         |
| ------------------------ | -------------------------------------- | ------------------------------- |
| **Production**           | Process deviations, equipment failures | Product impact assessment       |
| **Quality Control**      | Analytical deviations, OOS results     | Data integrity, method validity |
| **Materials Management** | Storage, handling, labeling            | Chain of custody, traceability  |
| **Facility/Utilities**   | HVAC, water systems, cleaning          | Environmental impact            |
| **Documentation**        | Record errors, missing signatures      | GMP compliance, audit trail     |

### 6. Deviation Reporting Process

#### 6.1 Immediate Reporting

##### 6.1.1 Discovery and Initial Response

```yaml
Immediate_Actions:
  timeframe: "Within 2 hours of discovery"

  required_actions:
    - Secure/isolate affected materials
    - Document immediate observations
    - Notify supervisor and QA
    - Implement containment measures
    - Preserve evidence

  notifications:
    critical: "QA Manager, Production Manager, Quality Director"
    major: "QA Manager, Department Supervisor"
    minor: "Shift Supervisor, QA designee"
```

##### 6.1.2 Initial Documentation

**Deviation Report Form Fields**:

- **Deviation ID**: Auto-generated unique identifier
- **Discovery Date/Time**: When deviation was first observed
- **Reporter Information**: Name, department, contact
- **Area/Process**: Where deviation occurred
- **Description**: Detailed description of what occurred
- **Immediate Actions**: Actions taken upon discovery
- **Material/Batch Information**: Affected products/batches
- **Preliminary Classification**: Initial severity assessment

#### 6.2 Electronic Deviation Management System

##### 6.2.1 System Features

```yaml
EDMS_Features:
  workflow_management:
    - Automated routing based on classification
    - Approval workflows
    - Escalation timers
    - Status tracking

  documentation:
    - Electronic forms
    - Document attachment
    - Photo/video uploads
    - Timeline tracking

  notifications:
    - Automatic alerts
    - Escalation notifications
    - Due date reminders
    - Status updates

  reporting:
    - Real-time dashboards
    - Trend analysis
    - Performance metrics
    - Regulatory reports
```

### 7. Investigation Process

#### 7.1 Investigation Planning

##### 7.1.1 Investigation Team Assignment

| Deviation Type | Investigation Lead  | Team Members                                |
| -------------- | ------------------- | ------------------------------------------- |
| **Production** | Production Manager  | QA Investigator, Process Engineer, Operator |
| **Laboratory** | Laboratory Manager  | QA Investigator, Analyst, Method Developer  |
| **Materials**  | Materials Manager   | QA Investigator, Warehouse Supervisor       |
| **Facility**   | Engineering Manager | QA Investigator, Maintenance, Environmental |

##### 7.1.2 Investigation Timeline

```yaml
Investigation_Timeline:
  critical_deviations:
    initial_assessment: "24 hours"
    investigation_completion: "5 business days"
    final_report: "10 business days"

  major_deviations:
    initial_assessment: "48 hours"
    investigation_completion: "10 business days"
    final_report: "15 business days"

  minor_deviations:
    initial_assessment: "72 hours"
    investigation_completion: "15 business days"
    final_report: "20 business days"
```

#### 7.2 Root Cause Analysis

##### 7.2.1 Investigation Methodology

**1. Fishbone Analysis (Ishikawa Diagram)**

```text
                 Methods        Machines
                     |             |
                     |             |
              -------+-------------+------- DEVIATION
                     |             |
                     |             |
                Materials      Manpower
```

**2. 5 Why Analysis**

- Why did the deviation occur?
- Why did that cause occur?
- Why did that cause occur?
- Why did that cause occur?
- Why did that cause occur?

**3. Fault Tree Analysis**

- Top event: Deviation occurrence
- Intermediate events: Contributing factors
- Basic events: Root causes

##### 7.2.2 Evidence Collection

| Evidence Type          | Collection Method     | Storage                    |
| ---------------------- | --------------------- | -------------------------- |
| **Physical Samples**   | Chain of custody      | Secure sample storage      |
| **Documentation**      | Original + copies     | Electronic document system |
| **Photos/Videos**      | Digital capture       | Secure server storage      |
| **Witness Statements** | Structured interviews | Confidential files         |
| **Data Logs**          | System exports        | Validated data archives    |

#### 7.3 Impact Assessment

##### 7.3.1 Product Quality Impact

```yaml
Quality_Assessment:
  chemical_composition:
    - Cannabinoid profiles
    - Terpene profiles
    - Impurity levels
    - Stability implications

  microbiological:
    - Bioburden levels
    - Pathogen presence
    - Sterility assurance
    - Shelf life impact

  physical_characteristics:
    - Appearance
    - Moisture content
    - Particle size
    - Package integrity
```

##### 7.3.2 Batch Disposition Decision Tree

```text
Start: Deviation Identified
    ↓
Quality Impact Assessment
    ↓
Critical Impact? → YES → REJECT BATCH
    ↓ NO
Additional Testing Required?
    ↓ YES → Perform Testing
    ↓ NO      ↓
Accept with    Results Acceptable?
Conditions     ↓ YES      ↓ NO
    ↑          RELEASE    REJECT
    ←─────────────────────────┘
```

### 8. Corrective and Preventive Actions (CAPA)

#### 8.1 CAPA Development

##### 8.1.1 Action Categories

| Category                  | Purpose                   | Examples                             |
| ------------------------- | ------------------------- | ------------------------------------ |
| **Immediate Corrections** | Stop the deviation        | Equipment shutdown, batch quarantine |
| **Corrective Actions**    | Eliminate root cause      | Process modification, training       |
| **Preventive Actions**    | Prevent recurrence        | System improvements, design changes  |
| **Risk Mitigation**       | Reduce probability/impact | Additional controls, monitoring      |

##### 8.1.2 CAPA Effectiveness Criteria

```yaml
Effectiveness_Measures:
  quantitative:
    - Reduction in deviation rate
    - Improved process capability
    - Reduced customer complaints
    - Lower defect rates

  qualitative:
    - Process robustness
    - Operator confidence
    - System reliability
    - Regulatory compliance
```

#### 8.2 CAPA Implementation

##### 8.2.1 Action Plan Development

**Required Elements**:

- **Specific Actions**: Clear, measurable tasks
- **Responsible Parties**: Named individuals
- **Target Dates**: Realistic timelines
- **Success Criteria**: Measurable outcomes
- **Verification Method**: How effectiveness will be measured
- **Resources Required**: Budget, personnel, equipment

##### 8.2.2 Implementation Tracking

| Phase            | Activities                | Documentation       | Timeline  |
| ---------------- | ------------------------- | ------------------- | --------- |
| **Planning**     | Action plan development   | CAPA plan document  | Week 1    |
| **Execution**    | Implementation activities | Progress reports    | Weeks 2-6 |
| **Verification** | Effectiveness assessment  | Verification report | Week 7    |
| **Closure**      | Final review and closure  | Closure memo        | Week 8    |

### 9. Quality Management Integration

#### 9.1 Deviation Trending

##### 9.1.1 Statistical Analysis

**Monthly Metrics**:

- Total number of deviations by category
- Deviation rate per batch/lot
- Time to resolution by severity
- Repeat deviation analysis
- Department/area distribution

**Quarterly Analysis**:

- Trend identification
- Root cause patterns
- CAPA effectiveness review
- Resource utilization assessment
- Regulatory impact evaluation

##### 9.1.2 Trend Reporting

```yaml
Trend_Reports:
  executive_dashboard:
    frequency: "Weekly"
    audience: "Senior management"
    content: "High-level metrics, critical deviations"

  operational_review:
    frequency: "Monthly"
    audience: "Department managers"
    content: "Detailed analysis, action plans"

  regulatory_summary:
    frequency: "Quarterly"
    audience: "Regulatory affairs"
    content: "Compliance status, trend analysis"
```

#### 9.2 Management Review

##### 9.2.1 Review Cycle

**Monthly QA Review**:

- Deviation summary and trends
- Investigation status updates
- CAPA progress review
- Resource needs assessment

**Quarterly Management Review**:

- System effectiveness evaluation
- Trend analysis and patterns
- Resource allocation decisions
- Strategic improvement initiatives

##### 9.2.2 Decision Making

| Decision Type            | Authority Level  | Documentation         |
| ------------------------ | ---------------- | --------------------- |
| **Batch Release**        | QA Manager       | Disposition memo      |
| **Process Changes**      | Quality Director | Change control        |
| **System Improvements**  | Site Management  | Investment approval   |
| **Regulatory Reporting** | QA Director      | Regulatory submission |

### 10. Regulatory Considerations

#### 10.1 Reporting Requirements

##### 10.1.1 Internal Reporting

- **Immediate**: Critical deviations to senior management
- **Weekly**: Deviation summary to department heads
- **Monthly**: Trend analysis to quality council
- **Quarterly**: System performance to board

##### 10.1.2 External Reporting

```yaml
Regulatory_Reporting:
  field_alert_reports:
    trigger: "Product safety concerns"
    timeline: "24 hours"
    recipients: "Health authorities"

  annual_reports:
    content: "Deviation trends, system changes"
    timeline: "Annual filing"
    recipients: "Regulatory agencies"

  inspection_readiness:
    documentation: "Complete deviation files"
    availability: "Real-time access"
    format: "Inspection-ready format"
```

#### 10.2 Data Integrity

##### 10.2.1 ALCOA+ Compliance

- **Attributable**: Clear identification of personnel
- **Legible**: Clear, readable documentation
- **Contemporaneous**: Real-time documentation
- **Original**: First recording of data
- **Accurate**: Error-free and complete
- **Complete**: All required information
- **Consistent**: Uniform approach
- **Enduring**: Permanent records
- **Available**: Accessible when needed

##### 10.2.2 Electronic Records

```yaml
Electronic_Records:
  system_validation:
    - 21 CFR Part 11 compliance
    - GxP validation protocols
    - User access controls
    - Audit trail functionality

  data_security:
    - Encryption at rest
    - Secure transmission
    - Access logging
    - Backup procedures
```

### 11. Training and Competency

#### 11.1 Training Requirements

##### 11.1.1 Role-Based Training

| Role              | Training Hours | Content Focus               | Frequency |
| ----------------- | -------------- | --------------------------- | --------- |
| **All Personnel** | 2 hours        | Recognition and reporting   | Annual    |
| **Supervisors**   | 4 hours        | Classification and response | Annual    |
| **QA Staff**      | 8 hours        | Investigation techniques    | Annual    |
| **Investigators** | 16 hours       | Root cause analysis, CAPA   | Annual    |

##### 11.1.2 Training Content

**Basic Training** (All Personnel):

- Deviation definition and examples
- Reporting requirements and timelines
- Immediate action requirements
- Documentation basics

**Advanced Training** (QA/Investigators):

- Investigation methodologies
- Root cause analysis techniques
- CAPA development
- Risk assessment
- Statistical analysis

#### 11.2 Competency Assessment

##### 11.2.1 Assessment Methods

```yaml
Competency_Assessment:
  written_examination:
    content: "Procedures, requirements, decision trees"
    passing_score: "80%"
    frequency: "Annual"

  case_study_evaluation:
    content: "Real deviation scenarios"
    assessment: "Investigation approach and conclusions"
    frequency: "Bi-annual"

  on_job_observation:
    content: "Actual deviation handling"
    assessment: "Procedure compliance"
    frequency: "As needed"
```

##### 11.2.2 Remedial Training

- **Performance Gaps**: Additional training for specific weaknesses
- **Regulatory Updates**: Training on new requirements
- **System Changes**: Training on procedure updates
- **Investigation Skills**: Advanced methodology training

### 12. Continuous Improvement

#### 12.1 System Performance Metrics

##### 12.1.1 Key Performance Indicators

| Metric                       | Target                | Measurement          | Frequency |
| ---------------------------- | --------------------- | -------------------- | --------- |
| **Time to Report**           | <2 hours for critical | System timestamps    | Real-time |
| **Investigation Completion** | 95% on-time           | Project tracking     | Monthly   |
| **CAPA Effectiveness**       | >90% effective        | Follow-up assessment | Quarterly |
| **Repeat Deviations**        | <5% of total          | Statistical analysis | Monthly   |

##### 12.1.2 Benchmarking

- **Industry Standards**: Comparison with pharmaceutical industry
- **Internal Benchmarks**: Year-over-year improvement
- **Best Practices**: Adoption of leading practices
- **Regulatory Expectations**: Alignment with agency guidance

#### 12.2 System Enhancement

##### 12.2.1 Technology Improvements

```yaml
Technology_Roadmap:
  short_term:
    - Mobile reporting applications
    - Automated notifications
    - Dashboard enhancements
    - Integration improvements

  medium_term:
    - AI-powered root cause suggestions
    - Predictive analytics
    - Advanced trending tools
    - Workflow optimization

  long_term:
    - Machine learning for pattern recognition
    - Automated investigation support
    - Predictive deviation prevention
    - Real-time risk assessment
```

##### 12.2.2 Process Optimization

- **Workflow Streamlining**: Eliminate non-value-added steps
- **Automation Opportunities**: Reduce manual activities
- **Resource Optimization**: Improve efficiency
- **User Experience**: Enhance system usability

### 13. Risk Management

#### 13.1 Deviation Risk Assessment

##### 13.1.1 Risk Matrix

| Probability | Severity: Minor | Severity: Major | Severity: Critical |
| ----------- | --------------- | --------------- | ------------------ |
| **High**    | Medium Risk     | High Risk       | Critical Risk      |
| **Medium**  | Low Risk        | Medium Risk     | High Risk          |
| **Low**     | Low Risk        | Low Risk        | Medium Risk        |

##### 13.1.2 Risk Mitigation Strategies

```yaml
Risk_Mitigation:
  prevention:
    - Robust process design
    - Adequate training
    - Regular maintenance
    - Environmental controls

  detection:
    - Real-time monitoring
    - Regular inspections
    - Statistical process control
    - Automated alerts

  response:
    - Rapid notification systems
    - Trained response teams
    - Clear procedures
    - Decision support tools
```

#### 13.2 Business Continuity

##### 13.2.1 Critical Deviation Response

- **Emergency Response Team**: 24/7 availability
- **Communication Plan**: Stakeholder notification
- **Resource Allocation**: Priority resource assignment
- **Business Impact**: Production and delivery assessment

##### 13.2.2 Recovery Planning

- **Immediate Actions**: Containment and stabilization
- **Short-term Recovery**: Process restoration
- **Long-term Improvement**: System enhancement
- **Lessons Learned**: Knowledge capture and sharing

### 14. References

- **URS-QMS-001**: User Requirements for Quality Management System
- **FS-QMS-001**: Functional Specification for Deviation Management
- **SOP_CAPA.md**: Corrective and Preventive Actions
- **SOP_ChangeControl.md**: Change management process
- **SOP_DocumentControl.md**: Document control procedures
- ICH Q9: Quality Risk Management
- ICH Q10: Pharmaceutical Quality System
- FDA Guidance: Investigating Out-of-Specification (OOS) Test Results
- EMA Guideline on Good Manufacturing Practice
- USP <1206>: Sterility Testing

### 15. Glossary

| Term | Definition |
|------|------------|
| **OOS** | Out-of-Specification - результат, выходящий за установленные пределы |
| **OOT** | Out-of-Trend - результат, отклоняющийся от исторической тенденции |
| **CAPA** | Corrective and Preventive Actions |
| **RCA** | Root Cause Analysis - анализ первопричин |
| **FTA** | Fault Tree Analysis - анализ дерева отказов |
| **FMEA** | Failure Mode and Effects Analysis |
| **5 Why** | Методология последовательного углубления в причины |

### 16. Revision History

| Version | Date | Description | Author | Approved By |
|---------|------|-------------|--------|-------------|
| 0.1 | 2025-09-01 | Initial template | System | - |
| 0.2 | 2025-09-02 | Comprehensive deviation management | Quality Manager | - |
| 1.0 | 2025-10-15 | Finalized with full CAPA integration, risk management, regulatory compliance | Quality Manager | Quality Director |

### 17. Approvals

| Role | Name | Signature | Date |
|------|------|-----------|------|
| **Author** | Quality Manager | _________________ | __________ |
| **Technical Reviewer** | Production Manager | _________________ | __________ |
| **Quality Reviewer** | Compliance Officer | _________________ | __________ |
| **Final Approver** | Quality Director | _________________ | __________ |

---

**Document Control:**
- Document ID: SOP-QMS-002
- Location: /docs/sop/SOP_DeviationManagement.md
- Classification: Internal - Restricted
- Next Review Date: 2026-10-15

### 18. Attachments

- **Attachment A**: Deviation Report Form Template (FORM-DEV-001)
- **Attachment B**: Investigation Checklist (CHECK-DEV-001)
- **Attachment C**: Root Cause Analysis Tools Guide (GUIDE-DEV-001)
- **Attachment D**: CAPA Development Worksheet (FORM-DEV-002)
- **Attachment E**: Trend Analysis Templates (TEMPLATE-DEV-001)
- **Attachment F**: Risk Assessment Matrix (TOOL-DEV-001)
- **Attachment G**: Batch Disposition Decision Tree (FLOW-DEV-001)
