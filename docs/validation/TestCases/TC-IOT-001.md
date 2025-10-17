---
title: "IoT Sensor Metrics Integration Test"
module: "IoT Metrics"
urs_id: "URS-IOT-001"
fs_id: "FS-IOT-001"
ds_id: "DS-IOT-001"
iq_oq_pq_step: "OQ-IOT-001"
version: "1.0"
status: "draft"  # Changed from approved - requires re-verification per AI_Assisted_Documentation_Policy.md
author: "IoT Systems Engineer"
approved_by: "Validation Manager"
last_updated: "2025-09-15"
review_date: "2025-12-15"
gacp_compliance: "WHO GACP Section 5.3 - Environmental Control Systems"
cfr_compliance: "21 CFR Part 11 - Electronic Records"
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

# Test Case TC-IOT-001: IoT Sensor Metrics Integration Test

## 1. Purpose and Scope

### 1.1 Objective

Проверка корректного приема, обработки, хранения и визуализации данных от IoT-датчиков производственной среды с полной валидацией метрик, формированием алертов и соответствием регулятивным требованиям WHO GACP.

### 1.2 Regulatory Requirements

- **WHO GACP:** Section 5.3 - Environmental control and monitoring systems
- **21 CFR Part 11:** Electronic records integrity and data authenticity
- **GAMP 5:** Category 3 - Non-configured products (IoT devices)
- **ISO 27001:** Information security management for IoT data

### 1.3 Test Scope

- ✅ IoT sensor data ingestion via MQTT/HTTP protocols
- ✅ Real-time data processing and validation
- ✅ Environmental metrics visualization
- ✅ Alert generation and notification systems
- ✅ Data persistence in time-series database
- ✅ Audit trail for IoT data modifications
- ✅ Integration with GACP reporting systems

## 2. Prerequisites and Environment Setup

### 2.1 System Prerequisites

- [x] GACP-ERP система запущена с активным IoT модулем
- [x] InfluxDB time-series database configured and running
- [x] Telegraf data collection service active
- [x] Grafana dashboards deployed for visualization
- [x] MQTT broker (Eclipse Mosquitto) operational
- [x] Test IoT sensors calibrated and ready

### 2.2 User Access Requirements

- **Primary User:** `test_cultivation_manager` with role "Cultivation Manager"
- **Secondary User:** `test_iot_technician` with role "IoT Technician"
- **Admin User:** `test_system_admin` with role "System Administrator"

**Required Permissions:**

- `iot.sensor.view` - View sensor data and metrics
- `iot.sensor.configure` - Configure sensor parameters
- `iot.alert.manage` - Manage alert configurations
- `environmental.monitor` - Access environmental monitoring
- `audit_trail.view` - View IoT-related audit records

### 2.3 Test Environment Configuration

#### 2.3.1 Simulated Growth Zones

```yaml
test_zones:
  zone_veg_001:
    type: "vegetative"
    target_temp: 24.0 # Celsius
    target_humidity: 65.0 # %RH
    target_co2: 800 # ppm
    light_schedule: "18/6"

  zone_flower_001:
    type: "flowering"
    target_temp: 22.0 # Celsius
    target_humidity: 45.0 # %RH
    target_co2: 1200 # ppm
    light_schedule: "12/12"
```

#### 2.3.2 Test Sensor Configuration

```json
{
  "test_sensors": [
    {
      "sensor_id": "TEMP_VEG_001",
      "type": "temperature",
      "zone": "zone_veg_001",
      "mqtt_topic": "sensors/temp/veg001",
      "sample_rate": "30s",
      "accuracy": "±0.1°C"
    },
    {
      "sensor_id": "HUMID_VEG_001",
      "type": "humidity",
      "zone": "zone_veg_001",
      "mqtt_topic": "sensors/humidity/veg001",
      "sample_rate": "30s",
      "accuracy": "±2%RH"
    },
    {
      "sensor_id": "CO2_VEG_001",
      "type": "co2",
      "zone": "zone_veg_001",
      "mqtt_topic": "sensors/co2/veg001",
      "sample_rate": "60s",
      "accuracy": "±50ppm"
    }
  ]
}
```

### 2.4 Alert Threshold Configuration

```yaml
alert_thresholds:
  temperature:
    warning_low: 20.0
    warning_high: 28.0
    critical_low: 18.0
    critical_high: 32.0
  humidity:
    warning_low: 40.0
    warning_high: 75.0
    critical_low: 30.0
    critical_high: 85.0
  co2:
    warning_low: 300
    warning_high: 2000
    critical_low: 200
    critical_high: 3000
```

## 3. Detailed Test Steps

### 3.1 System Initialization and Verification (10 minutes)

#### Step 3.1.1: Authentication and Access Verification

1. **Login as IoT Technician:**

   - Navigate to GACP-ERP login page
   - Enter credentials: `test_iot_technician` / `IoTSecure123!`
   - Verify successful authentication
   - **Expected:** Dashboard displays with IoT monitoring widgets

2. **IoT Module Access Verification:**

   - Navigate to "Environmental Monitoring" → "Sensor Management"
   - Verify sensor list loads with configured sensors
   - **Expected:** All test sensors visible with status indicators

3. **Infrastructure Health Check:**
   - Check MQTT broker connectivity: `mosquitto_sub -h localhost -t sensors/+/+`
   - Verify InfluxDB accessibility: `curl -G http://localhost:8086/query --data-urlencode "q=SHOW DATABASES"`
   - **Expected:** All infrastructure components responding

#### Step 3.1.2: Baseline Data Collection

1. **Historical Data Verification:**
   - Query last 24 hours of sensor data
   - Verify data continuity and expected sample rates
   - **Expected:** Regular data intervals without significant gaps

### 3.2 Real-Time Data Ingestion Testing (20 minutes)

#### Step 3.2.1: Single Sensor Data Stream Test

1. **Temperature Sensor Simulation:**

   ```bash
   # Simulate temperature readings for vegetative zone
   for i in {1..10}; do
     temp=$(echo "scale=1; 24.0 + (($RANDOM % 20) - 10) / 10" | bc)
     timestamp=$(date -Iseconds)
     mosquitto_pub -h localhost -t sensors/temp/veg001 \
       -m "{\"sensor_id\":\"TEMP_VEG_001\",\"value\":$temp,\"timestamp\":\"$timestamp\",\"unit\":\"celsius\"}"
     sleep 30
   done
   ```

2. **Data Reception Verification:**

   - Navigate to "Real-time Monitoring" dashboard
   - Observe temperature widget for zone_veg_001
   - **Expected:** New readings appear within 5 seconds of transmission

3. **Database Persistence Check:**
   ```sql
   SELECT * FROM environmental_metrics
   WHERE sensor_id = 'TEMP_VEG_001'
   AND timestamp > NOW() - INTERVAL 10 MINUTE
   ORDER BY timestamp DESC;
   ```
   - **Expected:** All simulated readings stored correctly

#### Step 3.2.2: Multi-Sensor Concurrent Data Stream

1. **Concurrent Sensor Simulation:**

   ```bash
   #!/bin/bash
   # multi_sensor_test.sh

   simulate_temp() {
     for i in {1..20}; do
       temp=$(echo "scale=1; 24.0 + (($RANDOM % 40) - 20) / 10" | bc)
       timestamp=$(date -Iseconds)
       mosquitto_pub -h localhost -t sensors/temp/veg001 \
         -m "{\"sensor_id\":\"TEMP_VEG_001\",\"value\":$temp,\"timestamp\":\"$timestamp\"}"
       sleep 30
     done
   }

   simulate_humidity() {
     for i in {1..20}; do
       humidity=$(echo "scale=1; 65.0 + (($RANDOM % 20) - 10)" | bc)
       timestamp=$(date -Iseconds)
       mosquitto_pub -h localhost -t sensors/humidity/veg001 \
         -m "{\"sensor_id\":\"HUMID_VEG_001\",\"value\":$humidity,\"timestamp\":\"$timestamp\"}"
       sleep 30
     done
   }

   simulate_co2() {
     for i in {1..20}; do
       co2=$(echo "800 + (($RANDOM % 400) - 200)" | bc)
       timestamp=$(date -Iseconds)
       mosquitto_pub -h localhost -t sensors/co2/veg001 \
         -m "{\"sensor_id\":\"CO2_VEG_001\",\"value\":$co2,\"timestamp\":\"$timestamp\"}"
       sleep 60
     done
   }

   # Run simulations in parallel
   simulate_temp &
   simulate_humidity &
   simulate_co2 &

   wait
   ```

2. **Concurrent Processing Verification:**
   - Monitor system performance during concurrent data ingestion
   - Check CPU and memory usage
   - Verify no data loss or corruption
   - **Expected:** System handles concurrent streams efficiently

### 3.3 Data Validation and Processing (15 minutes)

#### Step 3.3.1: Data Quality Validation

1. **Range Validation Testing:**

   ```bash
   # Send out-of-range temperature value
   mosquitto_pub -h localhost -t sensors/temp/veg001 \
     -m "{\"sensor_id\":\"TEMP_VEG_001\",\"value\":150.0,\"timestamp\":\"$(date -Iseconds)\"}"
   ```

   - **Expected:** System flags invalid reading and logs validation error

2. **Timestamp Validation:**

   ```bash
   # Send future timestamp
   future_time=$(date -d '+1 hour' -Iseconds)
   mosquitto_pub -h localhost -t sensors/temp/veg001 \
     -m "{\"sensor_id\":\"TEMP_VEG_001\",\"value\":24.5,\"timestamp\":\"$future_time\"}"
   ```

   - **Expected:** System rejects future timestamps

3. **Duplicate Detection:**
   ```bash
   # Send identical messages
   message="{\"sensor_id\":\"TEMP_VEG_001\",\"value\":24.0,\"timestamp\":\"$(date -Iseconds)\"}"
   mosquitto_pub -h localhost -t sensors/temp/veg001 -m "$message"
   mosquitto_pub -h localhost -t sensors/temp/veg001 -m "$message"
   ```
   - **Expected:** System detects and handles duplicates appropriately

#### Step 3.3.2: Data Aggregation and Calculations

1. **Moving Average Calculation:**

   - Navigate to analytics dashboard
   - Verify 15-minute moving averages calculated correctly
   - **Expected:** Smooth trend lines with reduced noise

2. **Daily Min/Max/Average Reports:**
   - Check daily summary calculations
   - Compare with raw data for accuracy
   - **Expected:** Statistical calculations accurate within 0.1%

### 3.4 Alert System Testing (15 minutes)

#### Step 3.4.1: Warning Level Alerts

1. **Temperature Warning Simulation:**

   ```bash
   # Send temperature above warning threshold (28°C)
   mosquitto_pub -h localhost -t sensors/temp/veg001 \
     -m "{\"sensor_id\":\"TEMP_VEG_001\",\"value\":29.5,\"timestamp\":\"$(date -Iseconds)\"}"
   ```

2. **Alert Verification:**
   - Check alert notifications in UI
   - Verify email/SMS notifications sent (if configured)
   - Confirm alert logged in audit trail
   - **Expected:** Warning alert generated within 60 seconds

#### Step 3.4.2: Critical Level Alerts

1. **Critical CO2 Level Simulation:**

   ```bash
   # Send critically high CO2 reading
   mosquitto_pub -h localhost -t sensors/co2/veg001 \
     -m "{\"sensor_id\":\"CO2_VEG_001\",\"value\":3500,\"timestamp\":\"$(date -Iseconds)\"}"
   ```

2. **Emergency Response Verification:**
   - Verify critical alert escalation
   - Check automated equipment responses (if configured)
   - Confirm immediate notifications to management
   - **Expected:** Critical alert with immediate escalation

#### Step 3.4.3: Alert Acknowledgment and Resolution

1. **Alert Acknowledgment Process:**

   - Login as Cultivation Manager
   - Navigate to active alerts
   - Acknowledge temperature warning alert
   - **Expected:** Alert status changes to "Acknowledged"

2. **Alert Auto-Resolution:**
   ```bash
   # Send normal temperature reading
   mosquitto_pub -h localhost -t sensors/temp/veg001 \
     -m "{\"sensor_id\":\"TEMP_VEG_001\",\"value\":24.0,\"timestamp\":\"$(date -Iseconds)\"}"
   ```
   - **Expected:** Alert automatically resolves when conditions normalize

### 3.5 Visualization and Dashboard Testing (10 minutes)

#### Step 3.5.1: Real-Time Dashboard Functionality

1. **Live Data Display:**

   - Open environmental monitoring dashboard
   - Verify real-time updates of sensor readings
   - Check auto-refresh intervals (every 30 seconds)
   - **Expected:** Dashboard updates automatically with latest data

2. **Historical Data Charts:**
   - Select different time ranges (1 hour, 24 hours, 7 days)
   - Verify chart data accuracy and performance
   - **Expected:** Charts load quickly with accurate historical data

#### Step 3.5.2: Multi-Zone Comparison

1. **Zone Comparison View:**
   - Enable multi-zone comparison dashboard
   - Compare environmental conditions across zones
   - **Expected:** Clear visual comparison of zone conditions

### 3.6 GACP Compliance and Audit Trail (10 minutes)

#### Step 3.6.1: Environmental Control Documentation

1. **GACP Documentation Requirements:**

   - Verify environmental monitoring data meets WHO GACP Section 5.3
   - Check documentation of control measures
   - **Expected:** Complete environmental records maintained

2. **Audit Trail Verification:**
   - Navigate to IoT audit trail
   - Filter by sensor modifications and alerts
   - **Expected:** Complete audit trail of all IoT-related activities

#### Step 3.6.2: Data Integrity Verification

1. **Electronic Signature for Critical Changes:**

   - Attempt to modify sensor calibration settings
   - **Expected:** Electronic signature required for critical modifications

2. **WORM Storage Compliance:**
   - Verify environmental data stored in write-once format
   - **Expected:** Historical data cannot be modified

## 4. Expected Results Summary

### 4.1 Data Ingestion Performance

- ✅ **Real-time Processing:** All sensor data processed within 5 seconds
- ✅ **Throughput:** System handles 1000+ messages per minute
- ✅ **Reliability:** 99.9% data delivery success rate
- ✅ **Scalability:** Support for 100+ concurrent sensors

### 4.2 Alert System Performance

- ✅ **Detection Speed:** Alerts generated within 60 seconds
- ✅ **Accuracy:** Zero false positives during test period
- ✅ **Escalation:** Critical alerts escalated immediately
- ✅ **Resolution:** Automatic resolution when conditions normalize

### 4.3 Data Quality and Integrity

- ✅ **Validation:** Invalid data rejected with proper logging
- ✅ **Persistence:** 100% data persistence in time-series database
- ✅ **Accuracy:** Calculations accurate within specified tolerances
- ✅ **Audit Trail:** Complete record of all data modifications

### 4.4 Compliance Requirements

- ✅ **WHO GACP:** Full compliance with Section 5.3 requirements
- ✅ **21 CFR Part 11:** Electronic records integrity maintained
- ✅ **Data Security:** Encrypted data transmission and storage
- ✅ **Access Control:** Role-based access properly enforced

## 5. Performance Metrics

### 5.1 Key Performance Indicators

```yaml
performance_targets:
  data_ingestion_latency: "<5 seconds"
  alert_generation_time: "<60 seconds"
  dashboard_load_time: "<3 seconds"
  data_retention_period: "7 years"
  system_availability: "99.9%"
  data_accuracy: "±sensor_tolerance"
```

### 5.2 Load Testing Results

| Metric          | Target   | Actual | Status |
| --------------- | -------- | ------ | ------ |
| Messages/minute | 1000     | TBD    | ⏳     |
| CPU Usage       | <80%     | TBD    | ⏳     |
| Memory Usage    | <4GB     | TBD    | ⏳     |
| Disk I/O        | <100MB/s | TBD    | ⏳     |

## 6. Test Execution Results

### 6.1 Test Execution Log

```
Test Executed By: ________________
Date: _________________
Start Time: ___________
End Time: _____________
Duration: _____________

Environmental Conditions:
- Ambient Temperature: _________
- Network Latency: ____________
- System Load: _______________
```

### 6.2 Pass/Fail Criteria

#### Pass Criteria (All must be met):

- [ ] All sensor data ingested successfully
- [ ] Real-time processing within 5-second SLA
- [ ] Alert system functioning correctly
- [ ] Data visualization accurate and responsive
- [ ] Audit trail complete and immutable
- [ ] GACP compliance requirements met
- [ ] No system errors or data loss

#### Fail Criteria (Any constitutes failure):

- [ ] Data loss or corruption detected
- [ ] Alert system failures or false alarms
- [ ] Performance below specified thresholds
- [ ] Security or compliance violations
- [ ] System crashes or unhandled errors

### 6.3 Actual Test Results

```
Overall Test Result: [ ] PASS [ ] FAIL

Individual Component Results:
Data Ingestion:      [ ] PASS [ ] FAIL
Alert System:        [ ] PASS [ ] FAIL
Visualization:       [ ] PASS [ ] FAIL
Audit Trail:         [ ] PASS [ ] FAIL
Performance:         [ ] PASS [ ] FAIL
Compliance:          [ ] PASS [ ] FAIL

Notes and Observations:
_________________________________
_________________________________
_________________________________
```

## 7. Defect Tracking

| Defect ID | Severity | Component | Description | Status | Resolution |
| --------- | -------- | --------- | ----------- | ------ | ---------- |
|           |          |           |             |        |            |

## 8. Sign-off and Approvals

```
Test Execution:
Tester: _________________________ Date: _________
Signature: _______________________________________

Technical Review:
IoT Systems Engineer: ____________ Date: _________
Signature: _______________________________________

Quality Assurance:
QA Manager: _____________________ Date: _________
Signature: _______________________________________

Final Approval:
Validation Manager: ______________ Date: _________
Signature: _______________________________________
```

## 9. Related Documentation

- **URS:** URS-IOT-001 - IoT Integration Requirements
- **FS:** FS-IOT-001 - IoT Functional Specification
- **DS:** DS-IOT-001 - IoT Data Architecture
- **SOP:** SOP_EnvironmentalMonitoring - Environmental Control Procedures
- **IQ/OQ:** IQ-IOT-001, OQ-IOT-001 - IoT Installation and Operational Qualification

---

**Document Control:** This test case requires electronic signature for modifications and is subject to change control procedures.
