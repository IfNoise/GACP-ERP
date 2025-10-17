---
title: "SOP: Growth Monitoring"
module: "Cultivation Management"
version: "0.2"
status: "draft"
last_updated: "2025-09-02"
author: "Cultivation Manager"
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

## SOP: Growth Monitoring

### 1. Purpose

Установить стандартизированные процедуры мониторинга роста и развития растений каннабиса на всех стадиях жизненного цикла для обеспечения оптимального качества и урожайности в соответствии с требованиями GACP.

### 2. Scope

Данная процедура охватывает:

- Мониторинг всех стадий роста растений (вегетативная, цветение)
- Измерение биометрических параметров
- Оценку здоровья и физиологического состояния
- Документирование данных роста
- Корректирующие действия при отклонениях
- Интеграцию с системой Seed-to-Sale tracking

### 3. Plant Growth Stages

#### 3.1 Growth Stage Classification

| Stage            | Duration  | Key Characteristics                      | Critical Parameters                         |
| ---------------- | --------- | ---------------------------------------- | ------------------------------------------- |
| **Seedling**     | 2-3 weeks | First true leaves, establishing root     | Light intensity, humidity, temperature      |
| **Vegetative**   | 4-8 weeks | Rapid leaf/stem growth, root development | Nutrition, water, light schedule            |
| **Pre-flower**   | 1-2 weeks | Sex determination, growth slowing        | Photoperiod transition, stress monitoring   |
| **Early Flower** | 2-3 weeks | Flower initiation, stretch phase         | Nutrition transition, environmental control |
| **Mid Flower**   | 3-4 weeks | Flower development, resin production     | Nutrient management, pest monitoring        |
| **Late Flower**  | 2-3 weeks | Trichome maturation, harvest preparation | Water management, quality assessment        |

#### 3.2 Stage-Specific Monitoring Requirements

##### 3.2.1 Seedling Stage Monitoring

```yaml
Seedling_Parameters:
  frequency: "Daily"

  measurements:
    height: "mm precision, to growing tip"
    leaf_count: "True leaves only"
    stem_diameter: "At soil level"
    leaf_color: "Visual assessment scale"
    root_development: "Weekly assessment"

  environmental_targets:
    temperature: "22-26°C"
    humidity: "65-75% RH"
    light_intensity: "200-400 PPFD"
    photoperiod: "18/6 hours"

  health_indicators:
    - Cotyledon condition
    - Leaf emergence rate
    - Stem strength
    - Root visibility (if possible)
    - Disease/pest signs
```

##### 3.2.2 Vegetative Stage Monitoring

```yaml
Vegetative_Parameters:
  frequency: "Every 2-3 days"

  measurements:
    height: "cm precision, multiple points"
    width: "Canopy diameter, 2 measurements"
    node_count: "Primary stem nodes"
    leaf_count: "Fan leaves >5cm"
    stem_diameter: "Base and mid-point"
    internodal_distance: "Average of 3 measurements"

  environmental_targets:
    temperature: "20-28°C"
    humidity: "55-70% RH"
    light_intensity: "400-600 PPFD"
    photoperiod: "18/6 hours"

  development_tracking:
    - Branch development
    - Leaf morphology
    - Growth rate trends
    - Training response
    - Nutrient deficiency signs
```

##### 3.2.3 Flowering Stage Monitoring

```yaml
Flowering_Parameters:
  frequency: "Every 2 days"

  measurements:
    overall_height: "Post-stretch height"
    canopy_coverage: "Area coverage %"
    flower_site_count: "Primary and secondary"
    flower_development: "Size and density"
    trichome_development: "Microscopic assessment"
    pistil_color: "Visual assessment"

  environmental_targets:
    temperature: "18-26°C"
    humidity: "40-55% RH"
    light_intensity: "600-800 PPFD"
    photoperiod: "12/12 hours"

  quality_indicators:
    - Flower density
    - Resin production
    - Aroma development
    - Color changes
    - Maturation signs
```

### 4. Responsibilities

| Role                       | Responsibility                               |
| -------------------------- | -------------------------------------------- |
| **Head Cultivator**        | Overall growth monitoring program oversight  |
| **Cultivation Technician** | Daily measurements and observations          |
| **Assistant Grower**       | Data collection and plant care               |
| **Quality Assurance**      | Verification of monitoring procedures        |
| **Cultivation Manager**    | Review and approval of growth data           |
| **Plant Pathologist**      | Health assessment and disease identification |
| **Data Analyst**           | Statistical analysis and trending            |

### 5. Monitoring Equipment and Tools

#### 5.1 Measurement Equipment

| Equipment            | Purpose                         | Specification     | Calibration       |
| -------------------- | ------------------------------- | ----------------- | ----------------- |
| **Digital Calipers** | Stem diameter, leaf measurement | ±0.1mm accuracy   | Monthly           |
| **Measuring Tape**   | Height, width measurements      | Metric, 3m length | Quarterly         |
| **Digital Scale**    | Biomass measurements            | 0.1g precision    | Weekly            |
| **pH Meter**         | Soil/water pH monitoring        | ±0.1 pH accuracy  | Weekly            |
| **EC/TDS Meter**     | Nutrient concentration          | ±2% accuracy      | Weekly            |
| **Magnifying Glass** | Trichome examination            | 60x magnification | Visual inspection |
| **Camera**           | Photo documentation             | High resolution   | As needed         |

#### 5.2 Environmental Monitoring

```yaml
Environmental_Equipment:
  sensors:
    temperature: "±0.5°C accuracy, continuous logging"
    humidity: "±3% RH accuracy, continuous logging"
    light_intensity: "PAR sensor, ±5% accuracy"
    air_circulation: "Anemometer, wind speed measurement"
    co2_levels: "±50ppm accuracy, continuous"

  data_logging:
    frequency: "Every 15 minutes"
    storage: "Cloud-based system"
    alerts: "Out-of-range notifications"
    trending: "Historical analysis"
```

### 6. Data Collection Procedures

#### 6.1 Standardized Measurement Protocol

##### 6.1.1 Plant Height Measurement

1. **Preparation**

   - Ensure plants are well-hydrated (not wilted)
   - Measure at consistent time of day (morning preferred)
   - Use consistent reference point

2. **Measurement Technique**

   ```
   Step 1: Position measuring tape at soil level
   Step 2: Extend to highest growing point
   Step 3: Record to nearest 0.5cm
   Step 4: Take 3 measurements, record average
   Step 5: Photo document measurement point
   ```

3. **Documentation**
   - Plant ID number
   - Measurement date and time
   - Technician initials
   - Environmental conditions
   - Any abnormalities noted

##### 6.1.2 Canopy Assessment

**Width Measurements**:

- Measure across widest points (2 perpendicular measurements)
- Record canopy shape irregularities
- Document training/pruning impact
- Calculate canopy area (LxW)

**Density Evaluation**:

- Visual assessment of leaf density
- Light penetration evaluation
- Branch distribution analysis
- Defoliation needs assessment

#### 6.2 Health and Quality Assessment

##### 6.2.1 Visual Health Inspection

```yaml
Health_Checklist:
  general_appearance:
    - Overall vigor
    - Color uniformity
    - Leaf turgidity
    - Growth symmetry

  specific_indicators:
    leaf_condition:
      - Color variations
      - Spotting or discoloration
      - Curling or twisting
      - Edge burning
      - Chlorosis patterns

    stem_condition:
      - Color and texture
      - Structural integrity
      - Node development
      - Branching patterns

    root_assessment:
      - Color (when visible)
      - Density and distribution
      - Health indicators
      - Growth pattern
```

##### 6.2.2 Pest and Disease Monitoring

**Daily Visual Inspection**:

- Systematic examination of all plant surfaces
- Focus on undersides of leaves
- Check soil surface and drainage
- Document any abnormalities

**Weekly Detailed Assessment**:

- Magnified inspection for pests
- Disease symptom evaluation
- Environmental stress indicators
- Beneficial insect presence

### 7. Data Management and Documentation

#### 7.1 Growth Data Recording

##### 7.1.1 Plant Growth Cards

```yaml
Growth_Card_Fields:
  plant_identification:
    - Plant ID (QR code/barcode)
    - Genetic strain
    - Planting date
    - Growth stage
    - Location (room/section/position)

  biometric_data:
    - Height measurements
    - Width measurements
    - Node count
    - Leaf count
    - Flower development
    - Biomass (when applicable)

  environmental_conditions:
    - Temperature at measurement
    - Humidity at measurement
    - Light intensity
    - Days since stage transition
    - Watering/feeding schedule
```

##### 7.1.2 Electronic Data Systems

**GACP-ERP Integration**:

- Real-time data entry via mobile devices
- Barcode/QR code scanning for plant ID
- Automatic environmental data linkage
- Photo documentation attachment
- Trend analysis and reporting

**Data Validation**:

- Range checking for measurements
- Mandatory field completion
- Duplicate entry prevention
- Timestamp verification
- User authentication

#### 7.2 Statistical Analysis and Trending

##### 7.2.1 Growth Rate Calculations

```yaml
Growth_Metrics:
  daily_growth_rate:
    formula: "(Height_today - Height_yesterday) / 1 day"
    units: "cm/day"
    target_range: "0.5-3.0 cm/day (vegetative)"

  weekly_biomass_gain:
    formula: "(Mass_week2 - Mass_week1) / 7 days"
    units: "g/day"
    measurement: "Destructive sampling subset"

  canopy_expansion_rate:
    formula: "(Area_today - Area_week_ago) / 7 days"
    units: "cm²/day"
    application: "Space planning"
```

##### 7.2.2 Performance Indicators

| Metric                   | Target Range     | Alert Threshold     | Action Required        |
| ------------------------ | ---------------- | ------------------- | ---------------------- |
| **Daily Height Growth**  | 0.5-3.0 cm/day   | <0.2 or >4.0 cm/day | Investigation          |
| **Node Development**     | 1 node/5-7 days  | <1 node/10 days     | Nutritional assessment |
| **Leaf Color Score**     | 7-9 (1-10 scale) | <6 or >9            | Environmental check    |
| **Flowering Site Count** | Strain-dependent | <80% expected       | Growth review          |

### 8. Growth Optimization Protocols

#### 8.1 Training and Pruning Documentation

##### 8.1.1 Training Methods

```yaml
Training_Techniques:
  low_stress_training:
    description: "Bending and tying branches"
    timing: "Vegetative stage"
    documentation: "Photos before/after, tie locations"
    monitoring: "Branch response, stress indicators"

  topping:
    description: "Removing apical meristem"
    timing: "4-6 nodes developed"
    documentation: "Cut location, healing progress"
    monitoring: "Recovery time, lateral development"

  defoliation:
    description: "Selective leaf removal"
    timing: "Early flowering transition"
    documentation: "Leaves removed, reasoning"
    monitoring: "Light penetration, stress response"
```

##### 8.1.2 Response Monitoring

**Post-Training Assessment**:

- Stress indicator evaluation (24-48 hours)
- Recovery rate documentation
- Growth pattern changes
- Yield impact estimation

**Long-term Tracking**:

- Branch development patterns
- Canopy uniformity achievement
- Final yield correlation
- Technique effectiveness analysis

#### 8.2 Environmental Response Monitoring

##### 8.2.1 Climate Response Tracking

```yaml
Environmental_Response:
  temperature_response:
    optimal_range: "20-28°C"
    stress_indicators:
      - Leaf curling (>30°C)
      - Slowed growth (<18°C)
      - Color changes
      - Flowering delays

  humidity_response:
    optimal_range: "55-70% RH (veg), 40-55% RH (flower)"
    stress_indicators:
      - Fungal issues (>70%)
      - Transpiration stress (<40%)
      - Leaf texture changes
      - Growth rate variations

  light_response:
    optimal_ppfd: "400-800 depending on stage"
    stress_indicators:
      - Bleaching (excessive light)
      - Stretching (insufficient light)
      - Leaf positioning changes
      - Photosynthesis efficiency
```

### 9. Quality Assurance and Control

#### 9.1 Data Quality Verification

##### 9.1.1 Measurement Accuracy Checks

**Daily QC Procedures**:

- Equipment calibration verification
- Measurement repeatability tests
- Cross-technician validation
- Environmental sensor verification

**Weekly QC Reviews**:

- Data trend analysis
- Outlier investigation
- Measurement consistency evaluation
- Equipment performance assessment

##### 9.1.2 Documentation Review

```yaml
QC_Checklist:
  completeness:
    - All required fields populated
    - Photos attached when required
    - Technician identification
    - Timestamp accuracy

  accuracy:
    - Measurement within expected ranges
    - Calculation verification
    - Environmental data correlation
    - Growth stage appropriateness

  consistency:
    - Measurement technique standardization
    - Documentation format compliance
    - Terminology usage
    - Data entry procedures
```

#### 9.2 Corrective Actions

##### 9.2.1 Growth Deviation Response

**Slow Growth Response**:

1. Environmental condition review
2. Nutritional status assessment
3. Root system evaluation
4. Pest/disease inspection
5. Corrective action implementation
6. Enhanced monitoring protocol

**Abnormal Development Response**:

1. Immediate plant isolation (if disease suspected)
2. Expert consultation
3. Photo documentation
4. Sample collection (if warranted)
5. Treatment protocol initiation
6. Recovery monitoring

### 10. Harvest Timing and Maturity Assessment

#### 10.1 Maturity Indicators

##### 10.1.1 Trichome Assessment

```yaml
Trichome_Evaluation:
  examination_method:
    - 60x magnification minimum
    - Multiple sample points
    - Daily assessment (final 2 weeks)
    - Photo documentation

  maturity_stages:
    clear: "Early, high THC potential"
    cloudy_milky: "Peak potency window"
    amber: "Degrading THC, increasing CBN"

  harvest_targets:
    sativa_dominant: "10-20% amber trichomes"
    indica_dominant: "20-30% amber trichomes"
    cbd_varieties: "Monitor CBD:THC ratios"
```

##### 10.1.2 Additional Maturity Indicators

| Indicator             | Assessment Method   | Harvest Signal             |
| --------------------- | ------------------- | -------------------------- |
| **Pistil Color**      | Visual assessment   | 70-90% brown/amber         |
| **Flower Density**    | Physical assessment | Firm, compact buds         |
| **Aroma Development** | Sensory evaluation  | Full terpene expression    |
| **Calyx Swelling**    | Visual examination  | Swollen, mature appearance |
| **Fan Leaf Color**    | Visual assessment   | Natural senescence         |

### 11. Data Analytics and Reporting

#### 11.1 Performance Analytics

##### 11.1.1 Growth Performance Metrics

```yaml
Analytics_Dashboard:
  cultivation_kpis:
    - Average days to harvest by strain
    - Growth rate trends by environmental conditions
    - Yield per square foot
    - Resource utilization efficiency

  quality_metrics:
    - Trichome development consistency
    - Harvest timing accuracy
    - Post-harvest quality scores
    - Customer satisfaction ratings

  operational_metrics:
    - Labor hours per plant
    - Equipment utilization
    - Environmental control effectiveness
    - Resource consumption per gram
```

##### 11.1.2 Predictive Modeling

**Growth Prediction Models**:

- Harvest date estimation
- Yield forecasting
- Resource requirement planning
- Quality outcome prediction

**Environmental Impact Analysis**:

- Climate condition correlation with growth
- Energy efficiency optimization
- Resource utilization patterns
- Seasonal variation impacts

#### 11.2 Reporting and Communication

##### 11.2.1 Regular Reports

```yaml
Reporting_Schedule:
  daily_summary:
    audience: "Cultivation team"
    content: "Growth measurements, health status, issues"
    format: "Digital dashboard"

  weekly_analysis:
    audience: "Management"
    content: "Trends, performance, recommendations"
    format: "Executive summary"

  monthly_review:
    audience: "Quality assurance"
    content: "Compliance, trends, improvements"
    format: "Detailed report"

  harvest_report:
    audience: "Production planning"
    content: "Yield, quality, timing analysis"
    format: "Comprehensive assessment"
```

### 12. Training and Competency

#### 12.1 Personnel Training Requirements

##### 12.1.1 Role-Based Training

| Role                       | Training Hours | Content Focus                          | Certification          |
| -------------------------- | -------------- | -------------------------------------- | ---------------------- |
| **Cultivation Technician** | 40 hours       | Measurement techniques, data recording | Internal certification |
| **Assistant Grower**       | 24 hours       | Plant health, basic measurements       | Competency assessment  |
| **Head Cultivator**        | 16 hours       | Data analysis, trend interpretation    | Advanced certification |
| **Quality Auditor**        | 8 hours        | Monitoring procedures, compliance      | QA certification       |

##### 12.1.2 Training Content

**Technical Skills**:

- Measurement standardization
- Equipment operation and calibration
- Data collection procedures
- Photo documentation techniques

**Plant Knowledge**:

- Growth stage identification
- Health assessment techniques
- Strain-specific characteristics
- Environmental response patterns

#### 12.2 Competency Verification

##### 12.2.1 Assessment Methods

```yaml
Competency_Testing:
  practical_assessment:
    - Live plant measurement demonstration
    - Health assessment accuracy
    - Data recording compliance
    - Equipment operation proficiency

  written_examination:
    - Procedure knowledge
    - Growth stage identification
    - Health indicator recognition
    - Documentation requirements

  ongoing_evaluation:
    - Data quality monitoring
    - Measurement consistency
    - Peer review feedback
    - Supervisor assessment
```

### 13. Continuous Improvement

#### 13.1 Process Optimization

##### 13.1.1 Technology Integration

**Automation Opportunities**:

- Automated measurement systems
- Digital imaging analysis
- Environmental data integration
- Predictive analytics implementation

**Efficiency Improvements**:

- Workflow optimization
- Data collection streamlining
- Resource allocation optimization
- Quality assurance enhancement

##### 13.1.2 Innovation Projects

```yaml
Innovation_Roadmap:
  short_term:
    - Mobile app development
    - Barcode scanning integration
    - Photo analysis automation
    - Real-time dashboard enhancement

  medium_term:
    - AI-powered health assessment
    - Predictive growth modeling
    - Automated environmental control
    - Yield optimization algorithms

  long_term:
    - Machine learning integration
    - Autonomous monitoring systems
    - Genetic marker correlation
    - Advanced phenotyping tools
```

### 14. References

- **URS-CULT-001**: User Requirements for Cultivation Management
- **FS-CULT-001**: Functional Specification for Growth Monitoring
- **SOP_EnvironmentalControl.md**: Environmental monitoring procedures
- **SOP_Irrigation.md**: Irrigation and nutrition management
- **SOP_PestControl.md**: Integrated pest management
- Cannabis cultivation best practices guidelines
- GACP standards for medicinal plants
- Agricultural measurement standards
- Digital agriculture protocols

### 15. Revision History

| Version | Date       | Description                                | Author              |
| ------- | ---------- | ------------------------------------------ | ------------------- |
| 0.1     | 2025-09-01 | Initial template                           | System              |
| 0.2     | 2025-09-02 | Comprehensive growth monitoring procedures | Cultivation Manager |

### 16. Attachments

- Attachment A: Growth Measurement Templates
- Attachment B: Health Assessment Checklists
- Attachment C: Environmental Control Guidelines
- Attachment D: Data Collection Forms
- Attachment E: Training Materials and Competency Tests
