---
title: "SOP: Spatial Planning & Zone Optimization"
sop_id: "SOP-SP-001"
version: "1.0"
effective_date: "2025-09-13"
review_date: "2026-09-13"
department: "Cultivation / Operations"
process_owner: "Head of Cultivation"
approver: "Operations Director"
related_sops:
  - "SOP_Germination.md"
  - "SOP_Transplantation.md"
  - "SOP_GrowthMonitoring.md"
  - "SOP_HVACMonitoring.md"
risk_level: "Medium"
---

# SOP: Spatial Planning & Zone Optimization

## 1. Purpose

Establish procedures for optimal spatial planning of cultivation areas, zone allocation, capacity planning, and resource optimization to maximize yield while maintaining GACP compliance and environmental controls.

## 2. Scope

This SOP covers:
- Cultivation zone planning and layout design
- Plant density optimization and spacing calculations
- Resource allocation (lighting, HVAC, irrigation)
- Capacity planning and scheduling
- Environmental monitoring zone management
- Equipment placement optimization

## 3. Responsibilities

| Role | Responsibility |
|------|---------------|
| **Head of Cultivation** | Overall spatial planning strategy, zone approval, resource allocation |
| **Cultivation Manager** | Daily zone management, plant placement, environmental monitoring |
| **Facilities Engineer** | HVAC/lighting optimization, infrastructure planning |
| **Agronomist** | Plant spacing recommendations, yield optimization |
| **QA Manager** | Compliance verification, audit trail maintenance |
| **Operations Supervisor** | Daily execution, staff coordination, scheduling |

## 4. Zone Classification and Management

### 4.1 Cultivation Zone Types

#### 4.1.1 Propagation Zone
**Purpose**: Seed germination and clone development
- **Environmental Requirements**:
  - Temperature: 22-25°C (±1°C)
  - Humidity: 65-75% RH
  - Light: 18-24 hour photoperiod, 200-400 PPFD
  - Air circulation: 0.5-1.0 m/s

**Spatial Configuration**:
```
Zone Layout:
┌─────────────────────────────────────┐
│ Germination Tables (Adjustable)    │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │
│ │ G1  │ │ G2  │ │ G3  │ │ G4  │    │
│ └─────┘ └─────┘ └─────┘ └─────┘    │
│                                     │
│ Clone Mother Area                   │
│ ┌─────────────┐ ┌─────────────┐    │
│ │     M1      │ │     M2      │    │
│ └─────────────┘ └─────────────┘    │
└─────────────────────────────────────┘
```

#### 4.1.2 Vegetative Zone
**Purpose**: Plant growth from clone to pre-flower
- **Environmental Requirements**:
  - Temperature: 24-26°C (±1°C)
  - Humidity: 55-65% RH
  - Light: 18-hour photoperiod, 400-600 PPFD
  - CO₂: 800-1200 ppm

**Plant Density**: 4-9 plants/m² depending on cultivation method

#### 4.1.3 Flowering Zone
**Purpose**: Final cultivation phase until harvest
- **Environmental Requirements**:
  - Temperature: 21-24°C (±1°C)
  - Humidity: 45-55% RH (reducing to 40% final weeks)
  - Light: 12-hour photoperiod, 600-1000 PPFD
  - CO₂: 1200-1500 ppm

**Plant Density**: 1-4 plants/m² depending on training method

#### 4.1.4 Support Zones
- **Drying rooms**: Controlled temperature/humidity
- **Storage areas**: Climate-controlled inventory
- **Equipment rooms**: HVAC, electrical, monitoring
- **Preparation areas**: Transplanting, maintenance

### 4.2 Spatial Planning Methodology

#### 4.2.1 Capacity Calculations
```python
# Example capacity calculation
def calculate_zone_capacity(zone_area_m2, plant_spacing_cm, growth_stage):
    """
    Calculate optimal plant capacity for cultivation zone
    """
    if growth_stage == "propagation":
        plants_per_m2 = 400  # High density for small plants
    elif growth_stage == "vegetative":
        plants_per_m2 = 16   # Medium density
    elif growth_stage == "flowering":
        plants_per_m2 = 4    # Low density for mature plants
    
    total_capacity = zone_area_m2 * plants_per_m2
    return total_capacity
```

#### 4.2.2 Resource Allocation Matrix
| Zone Type | Lighting (W/m²) | HVAC (CFM/m²) | Irrigation Points | Monitoring Sensors |
|-----------|----------------|---------------|-------------------|--------------------|
| Propagation | 200-300 | 5-8 | 1 per table | Temp, RH, Light |
| Vegetative | 400-600 | 8-12 | 1 per 4 plants | Temp, RH, CO₂, Light |
| Flowering | 600-800 | 10-15 | 1 per plant | Temp, RH, CO₂, Light |
| Drying | 0 | 3-5 | 0 | Temp, RH |

## 5. Planning Procedures

### 5.1 Long-term Strategic Planning

#### 5.1.1 Annual Capacity Planning
1. **Market Demand Analysis**:
   - Review sales forecasts
   - Analyze strain popularity trends
   - Calculate required production volumes

2. **Resource Assessment**:
   - Evaluate current infrastructure capacity
   - Identify bottlenecks and limitations
   - Plan facility expansions or modifications

3. **Layout Optimization**:
   - Model different zone configurations
   - Optimize for energy efficiency
   - Plan for regulatory compliance requirements

#### 5.1.2 Seasonal Adjustments
- **Summer**: Increased cooling requirements, humidity management
- **Winter**: Heating optimization, reduced ventilation
- **Transition periods**: Gradual environmental adjustments

### 5.2 Operational Planning

#### 5.2.1 Crop Cycle Planning
```
Planning Cycle (12-week example):
Week 1-2:   Propagation Zone (clones/seeds)
Week 3-6:   Vegetative Zone (growth phase)
Week 7-14:  Flowering Zone (flower development)
Week 15:    Harvest and zone preparation
Week 16:    Zone cleaning and setup for next cycle
```

#### 5.2.2 Zone Rotation Schedule
1. **Monday Planning Session**:
   - Review weekly production schedule
   - Plan plant movements between zones
   - Coordinate with environmental controls

2. **Zone Transitions**:
   - Document plant movements in ERP system
   - Update environmental settings for new occupancy
   - Verify compliance with spacing requirements

### 5.3 Environmental Optimization

#### 5.3.1 Microclimate Management
Each zone maintains optimal conditions through:
- **Dedicated HVAC zones** with independent controls
- **Environmental monitoring** with real-time feedback
- **Automated adjustments** based on plant stage and density
- **Energy optimization** algorithms for cost efficiency

#### 5.3.2 Lighting Optimization
```
Lighting Strategy:
┌─────────────────────────────────────┐
│ Zone 1: LED Arrays (Propagation)   │
│ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐    │
│ │200│ │200│ │200│ │200│ │200│ W  │
│ └───┘ └───┘ └───┘ └───┘ └───┘    │
│                                     │
│ Zone 2: High-Intensity (Flowering) │
│ ┌─────┐     ┌─────┐     ┌─────┐    │
│ │ 600W│     │ 600W│     │ 600W│    │
│ └─────┘     └─────┘     └─────┘    │
└─────────────────────────────────────┘
```

## 6. Technology Integration

### 6.1 Spatial Planning Software

#### 6.1.1 ERP System Integration
- **Real-time occupancy tracking**: Current plant locations and densities
- **Automated scheduling**: Zone transitions based on growth stages
- **Resource monitoring**: Energy usage, environmental conditions
- **Compliance reporting**: Space utilization, regulatory requirements

#### 6.1.2 3D Visualization Tools
- **Zone modeling**: Virtual representation of cultivation areas
- **Layout optimization**: Test different configurations
- **Equipment placement**: Optimal positioning of lights, sensors, HVAC
- **Workflow visualization**: Staff movement patterns and efficiency

### 6.2 IoT Sensor Integration

#### 6.2.1 Environmental Monitoring Network
```yaml
Sensor Deployment:
  zones:
    propagation:
      sensors: ["temp", "humidity", "light", "co2"]
      density: 1 sensor per 10m²
      update_frequency: 5 minutes
    
    vegetative:
      sensors: ["temp", "humidity", "light", "co2", "airflow"]
      density: 1 sensor per 15m²
      update_frequency: 5 minutes
    
    flowering:
      sensors: ["temp", "humidity", "light", "co2", "airflow", "voc"]
      density: 1 sensor per 20m²
      update_frequency: 5 minutes
```

#### 6.2.2 Automation Controls
- **Dynamic lighting**: Adjust intensity based on plant density and growth stage
- **Climate control**: Automated HVAC adjustments for optimal conditions
- **Irrigation scheduling**: Zone-specific watering based on plant needs
- **Alert systems**: Immediate notification of environmental deviations

## 7. Optimization Procedures

### 7.1 Space Utilization Analysis

#### 7.1.1 Daily Metrics Collection
```sql
-- Space utilization query example
SELECT 
    zone_id,
    zone_type,
    total_area_m2,
    occupied_area_m2,
    plant_count,
    utilization_percentage,
    energy_consumption_kwh,
    yield_per_m2
FROM spatial_analytics 
WHERE date = CURRENT_DATE;
```

#### 7.1.2 Performance Indicators
- **Space Utilization**: Target >85% for production zones
- **Energy Efficiency**: kWh per gram of yield
- **Plant Density**: Optimal plants per m² by growth stage
- **Cycle Time**: Days from clone to harvest

### 7.2 Continuous Improvement

#### 7.2.1 Monthly Reviews
- **Space utilization analysis**: Identify underutilized areas
- **Energy consumption review**: Optimize for cost efficiency
- **Yield analysis**: Compare actual vs. projected production
- **Environmental compliance**: Verify adherence to parameters

#### 7.2.2 Layout Modifications
1. **Problem Identification**:
   - Analyze performance metrics
   - Identify bottlenecks or inefficiencies
   - Review staff feedback and observations

2. **Solution Development**:
   - Model proposed changes in planning software
   - Calculate ROI for modifications
   - Plan implementation timeline

3. **Implementation**:
   - Schedule changes during non-production periods
   - Update ERP system with new configurations
   - Train staff on modified procedures

## 8. Quality Control

### 8.1 Compliance Verification

#### 8.1.1 GACP Requirements
- **Proper separation** between different cultivation stages
- **Contamination prevention** through zone isolation
- **Environmental controls** maintained within specifications
- **Documentation** of all spatial planning decisions

#### 8.1.2 Audit Trail
All spatial planning activities must be documented:
- **Zone assignments** with timestamps and responsible personnel
- **Environmental parameter changes** with justification
- **Layout modifications** with approval workflow
- **Performance metrics** with regular reporting

### 8.2 Performance Standards

#### 8.2.1 Target Metrics
- **Yield per m²**: Minimum 400g/m² for flowering zones
- **Energy efficiency**: Maximum 35 kWh per ounce produced
- **Space utilization**: >80% average across all zones
- **Environmental compliance**: 98% uptime within parameters

#### 8.2.2 Monitoring and Alerts
- **Real-time dashboards**: Current zone status and performance
- **Automated alerts**: Environmental parameter deviations
- **Weekly reports**: Spatial utilization and efficiency metrics
- **Monthly analysis**: Trend identification and improvement opportunities

## 9. Training Requirements

### 9.1 Initial Training (4 hours)
- Spatial planning principles and methodology
- ERP system navigation for zone management
- Environmental control systems operation
- Safety procedures for zone modifications

### 9.2 Ongoing Training
- Quarterly updates on optimization techniques
- Annual comprehensive spatial planning review
- New technology integration training
- Industry best practice workshops

## 10. Documentation and Records

### 10.1 Required Records
- **Zone layout diagrams** with current configurations
- **Capacity calculations** and utilization reports
- **Environmental monitoring data** by zone
- **Layout modification requests** and approvals
- **Performance metrics** and analysis reports

### 10.2 Retention Schedule
- **Daily monitoring data**: 3 years
- **Layout diagrams**: 7 years
- **Performance reports**: 5 years
- **Modification records**: 10 years

## 11. Emergency Procedures

### 11.1 Environmental System Failure
1. **Immediate Response**:
   - Activate backup environmental controls
   - Relocate sensitive plants if necessary
   - Notify maintenance and management

2. **Recovery Planning**:
   - Assess damage to zones and plants
   - Develop temporary spatial arrangements
   - Plan permanent repairs and improvements

### 11.2 Facility Damage
- **Plant evacuation procedures** to alternate zones
- **Equipment protection protocols**
- **Emergency spatial reallocation** plans
- **Recovery timeline development**

## 12. Revision History

| Version | Date | Description | Author |
|---------|------|-------------|---------|
| 1.0 | 2025-09-13 | Initial SOP creation | Head of Cultivation |

---

**Next Review Date**: September 13, 2026
**Document Owner**: Head of Cultivation
**Approval**: Operations Director