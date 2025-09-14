# SOP-EQ-001: Equipment Management and SCADA Integration

**Document ID:** SOP-EQ-001  
**Version:** 1.0  
**Effective Date:** 2025-09-14  
**Review Date:** 2026-09-14  
**Owner:** Facility Engineer  
**Approved By:** QA Manager

## 1. Purpose and Scope

This SOP defines procedures for equipment management, maintenance scheduling, calibration tracking, and SCADA system integration within the GACP-ERP system.

### 1.1 Scope

- Equipment registration and tracking
- Preventive maintenance scheduling
- Calibration management and tracking
- SCADA system integration and monitoring
- Equipment performance analysis
- Fault detection and response procedures

### 1.2 Exclusions

- Non-critical office equipment
- Personal computing devices
- Vehicles and transport equipment

## 2. Equipment Registration and Classification

### 2.1 Equipment Categories

#### 2.1.1 Critical Equipment

- HVAC systems (temperature/humidity control)
- Irrigation systems
- Lighting systems (LED grow lights)
- Security systems
- Environmental monitoring sensors

#### 2.1.2 Non-Critical Equipment

- General office equipment
- Basic hand tools
- Non-essential monitoring devices

### 2.2 Equipment Data Requirements

All equipment must be registered with the following information:

- Equipment ID (unique identifier)
- Equipment name and description
- Manufacturer and model
- Serial number
- Installation date
- Location (facility zone/room)
- Criticality level (Critical/Non-Critical)
- Maintenance schedule
- Calibration requirements
- SCADA connection status

## 3. SCADA System Integration

### 3.1 SCADA Connection Setup

#### 3.1.1 Connection Protocols

- Modbus TCP/IP for PLCs
- OPC UA for industrial devices
- MQTT for IoT sensors
- BACnet for HVAC systems

#### 3.1.2 Data Collection Points

- Real-time equipment status
- Operating parameters
- Alarm states
- Performance metrics
- Energy consumption

### 3.2 Data Acquisition and Storage

#### 3.2.1 Data Collection Frequency

- Critical parameters: Every 30 seconds
- Non-critical parameters: Every 5 minutes
- Historical data retention: 7 years minimum

#### 3.2.2 Data Storage Structure

```
Equipment_Data/
├── RealTime/
│   ├── {EquipmentID}/
│   │   ├── Status
│   │   ├── Parameters
│   │   └── Alarms
└── Historical/
    ├── {EquipmentID}/
    │   ├── Daily_Aggregates
    │   ├── Monthly_Reports
    │   └── Annual_Summaries
```

## 4. Maintenance Management

### 4.1 Preventive Maintenance Scheduling

#### 4.1.1 Maintenance Categories

- **Daily**: Visual inspections, basic cleaning
- **Weekly**: Performance checks, filter replacements
- **Monthly**: Detailed inspections, lubrication
- **Quarterly**: Major servicing, part replacements
- **Annual**: Complete overhauls, calibrations

#### 4.1.2 Maintenance Work Orders

1. System automatically generates work orders based on schedules
2. Technician receives notification via mobile app
3. Work order includes:
   - Equipment details and location
   - Required tools and parts
   - Step-by-step procedures
   - Safety requirements
   - Documentation forms

### 4.2 Maintenance Execution

#### 4.2.1 Pre-Maintenance Steps

1. Review equipment history and known issues
2. Gather required tools and replacement parts
3. Verify safety procedures and lockout/tagout requirements
4. Document equipment status before maintenance

#### 4.2.2 Maintenance Documentation

- Work order completion time
- Parts used and labor hours
- Any deviations from standard procedures
- Equipment condition assessment
- Recommendations for future maintenance

## 5. Calibration Management

### 5.1 Calibration Scheduling

#### 5.1.1 Calibration Frequencies

- Temperature sensors: Every 6 months
- Humidity sensors: Every 6 months
- Pressure sensors: Every 12 months
- Flow meters: Every 12 months
- pH meters: Every 3 months

#### 5.1.2 Calibration Standards

- Use NIST traceable standards
- Maintain calibration certificates
- Document calibration procedures
- Record calibration results

### 5.2 Calibration Procedures

#### 5.2.1 Pre-Calibration Steps

1. Review calibration history
2. Prepare calibration equipment and standards
3. Document current readings
4. Verify environmental conditions

#### 5.2.2 Calibration Execution

1. Follow manufacturer's calibration procedures
2. Apply known standards at multiple points
3. Record actual vs. expected readings
4. Calculate and document accuracy
5. Adjust if within acceptable limits
6. Mark as out-of-service if beyond limits

#### 5.2.3 Post-Calibration Steps

1. Update calibration records
2. Apply calibration labels
3. Return equipment to service
4. Generate calibration certificate

## 6. Equipment Performance Monitoring

### 6.1 Key Performance Indicators (KPIs)

#### 6.1.1 Availability Metrics

- Overall Equipment Effectiveness (OEE)
- Mean Time Between Failures (MTBF)
- Mean Time To Repair (MTTR)
- Planned vs. unplanned downtime

#### 6.1.2 Efficiency Metrics

- Energy consumption trends
- Operating parameter stability
- Maintenance cost per unit time
- Spare parts inventory turnover

### 6.2 Performance Analysis

#### 6.2.1 Automated Analysis

- Trend analysis for parameter drift
- Statistical process control for key metrics
- Predictive maintenance algorithms
- Anomaly detection for unusual patterns

#### 6.2.2 Manual Review

- Monthly performance reports
- Quarterly equipment assessments
- Annual reliability studies
- Cost-benefit analysis for replacements

## 7. Fault Detection and Response

### 7.1 Alarm Management

#### 7.1.1 Alarm Classifications

- **Critical**: Immediate response required (< 15 minutes)
- **High**: Response required within 1 hour
- **Medium**: Response required within 4 hours
- **Low**: Response required within 24 hours

#### 7.1.2 Alarm Response Procedures

1. System generates alarm notification
2. On-call technician receives alert
3. Technician acknowledges alarm
4. Initial assessment and response
5. Escalation if required
6. Resolution and documentation

### 7.2 Emergency Procedures

#### 7.2.1 Equipment Failure Response

1. Assess safety implications
2. Isolate failed equipment if necessary
3. Activate backup systems if available
4. Notify relevant personnel
5. Begin troubleshooting procedures
6. Document incident and response

#### 7.2.2 Critical System Failures

- HVAC failure: Activate backup climate control
- Power failure: Switch to emergency generators
- Water system failure: Activate backup water supply
- Security system failure: Implement manual security procedures

## 8. Documentation and Record Keeping

### 8.1 Required Documentation

#### 8.1.1 Equipment Records

- Equipment registration forms
- Installation documentation
- User manuals and technical specifications
- Maintenance history
- Calibration records
- Modification records

#### 8.1.2 Electronic Records Management

- All records stored in GACP-ERP system
- 21 CFR Part 11 compliant electronic signatures
- Audit trail for all record modifications
- Backup and disaster recovery procedures

### 8.2 Record Retention

#### 8.2.1 Retention Periods

- Equipment registration: Life of equipment + 7 years
- Maintenance records: 7 years
- Calibration records: 7 years
- Incident reports: 10 years
- Performance data: 7 years

## 9. Training and Competency

### 9.1 Training Requirements

#### 9.1.1 Equipment Operators

- Basic equipment operation procedures
- Safety requirements and emergency procedures
- Routine maintenance tasks
- Alarm response procedures

#### 9.1.2 Maintenance Technicians

- Advanced troubleshooting techniques
- Calibration procedures
- SCADA system operation
- Documentation requirements

### 9.2 Competency Assessment

- Initial training completion
- Annual refresher training
- Practical skill demonstrations
- Written examinations

## 10. Quality Assurance and Compliance

### 10.1 Quality Control Measures

#### 10.1.1 Regular Audits

- Monthly maintenance record reviews
- Quarterly calibration audits
- Annual system performance assessments
- External compliance audits

#### 10.1.2 Continuous Improvement

- Equipment performance trending
- Maintenance procedure optimization
- Technology upgrade evaluations
- Cost reduction initiatives

### 10.2 Regulatory Compliance

- WHO GACP requirements
- Local equipment safety regulations
- Environmental monitoring standards
- Data integrity requirements (ALCOA+)

## 11. Related Documents

- SOP-EQ-002: Calibration Management
- SOP-IT-001: Data Integrity
- SOP-QA-003: Change Control
- SOP-TR-001: Training Management

## 12. Revision History

| Version | Date       | Author          | Changes         |
| ------- | ---------- | --------------- | --------------- |
| 1.0     | 2025-09-14 | System Engineer | Initial version |

---

**Approval Signatures:**

**System Engineer:** ********\_******** Date: ****\_****

**QA Manager:** ********\_******** Date: ****\_****

**Site Manager:** ********\_******** Date: ****\_****
