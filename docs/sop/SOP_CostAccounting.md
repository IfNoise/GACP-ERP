---
title: "SOP: Cost Accounting"
document_number: "SOP-FIN-003"
version: "1.0"
effective_date: "2025-09-14"
review_date: "2026-09-14"
approval: "QA Manager"
---

# SOP: Cost Accounting

## 1. Purpose

Данная SOP определяет процедуры распределения затрат по партиям растений каннабиса, включая прямые материалы, трудозатраты и накладные расходы для accurate cost determination и profitability analysis.

## 2. Scope

- Allocation прямых материалов по batches
- Distribution трудозатрат based на timesheet data
- Overhead allocation using activity-based costing
- Cost rollup при harvest и final costing
- Integration с biological assets и general ledger

## 3. Responsibilities

- **Cost Accountant**: Daily cost allocation и analysis
- **Production Manager**: Validation production data и resource usage
- **HR Manager**: Provision accurate timesheet data
- **Plant Lifecycle Manager**: Batch status updates и production metrics

## 4. Cost Categories

### 4.1 Direct Materials

- Seeds и clones
- Nutrients и fertilizers
- Growing media (soil, substrates)
- Pest control materials
- Packaging materials

### 4.2 Direct Labour

- Cultivation activities
- Harvesting operations
- Processing time
- Quality control testing
- Packaging labour

### 4.3 Manufacturing Overhead

- Facility rent allocation
- Utilities (electricity, water, HVAC)
- Equipment depreciation
- Indirect labour
- Compliance costs

## 5. Procedure

### 5.1 Daily Cost Allocation

1. **Material Cost Allocation**

   - Review material receipts from previous day
   - Identify batch assignments в system
   - Verify quantities used против requisitions
   - System automatically creates allocation entries:

   ```accounting
   Dr. Work in Process - Batch [ID]
   Cr. Raw Materials Inventory
   ```

2. **Labour Cost Distribution**

   - Import timesheet data from workforce module
   - Validate hours против task assignments
   - Calculate fully-loaded labour rates including benefits
   - Allocate labour costs по batches:

   ```accounting
   Dr. Work in Process - Batch [ID]
   Cr. Direct Labour
   ```

3. **Overhead Allocation**
   - Calculate daily overhead rates по cost driver:
     - Facility costs: per square foot occupied
     - Utilities: per plant count или sq ft
     - Equipment: per machine hour usage
   - Apply overhead rates к active batches

### 5.2 Weekly Cost Analysis

1. **Batch Cost Review**

   - Generate batch cost reports for all active batches
   - Analyze cost variances против standards
   - Identify unusual cost patterns или anomalies
   - Update standard costs if necessary

2. **Cost Driver Analysis**
   - Review efficiency metrics (cost per plant, per sq ft)
   - Compare actual overhead rates к budgeted rates
   - Analyze labour efficiency по task type
   - Document significant variances

### 5.3 Monthly Overhead Allocation

1. **Overhead Rate Calculation**

   - Compile actual overhead costs для month
   - Determine allocation bases (sq ft, plant count, labour hours)
   - Calculate overhead rates по cost center:

   ```
   Overhead Rate = Total Overhead Costs / Total Allocation Base
   ```

2. **Overhead Application**

   - Apply calculated rates к all active batches
   - Create journal entries для overhead allocation:

   ```accounting
   Dr. Work in Process - Various Batches
   Cr. Manufacturing Overhead Applied
   ```

3. **Over/Under Applied Analysis**
   - Compare applied overhead к actual overhead
   - Calculate over/under applied amounts
   - Prepare adjustment entries для significant variances

### 5.4 Batch Closing and Final Costing

1. **Harvest Cost Finalization**

   - При harvest completion, finalize all costs для batch
   - Calculate total accumulated costs:
     - Direct materials
     - Direct labour
     - Applied overhead
     - Quality control costs

2. **Unit Cost Calculation**

   ```
   Cost per Gram = Total Batch Costs / Total Grams Harvested
   ```

3. **Transfer to Inventory**

   - Transfer final costs к finished goods inventory
   - Update inventory records с cost per unit
   - Create final cost transfer entry:

   ```accounting
   Dr. Finished Goods Inventory
   Cr. Work in Process - Batch [ID]
   ```

### 5.5 Variance Analysis

1. **Standard vs Actual Analysis**

   - Compare actual costs к standard costs по category
   - Calculate variances:
     - Material price variance
     - Material usage variance
     - Labour rate variance
     - Labour efficiency variance
     - Overhead spending variance
     - Overhead volume variance

2. **Variance Investigation**
   - Investigate variances > 5% of standard
   - Document root causes
   - Implement corrective actions
   - Update standards if warranted

## 6. Cost Allocation Methods

### 6.1 Direct Cost Tracing

- Materials traced через lot numbers
- Labour traced через timesheet task assignments
- Direct costs charged to specific batches

### 6.2 Overhead Allocation Bases

- **Facility costs**: Square footage occupied
- **Utilities**: Plant count или square footage
- **Equipment depreciation**: Machine hours или plant capacity
- **Quality control**: Number of tests performed
- **Compliance**: Equal allocation по active batches

## 7. System Integration

### 7.1 Automated Interfaces

- Timesheet data from workforce module
- Material usage from inventory module
- Production metrics from plant lifecycle module
- Overhead costs from general ledger

### 7.2 Real-time Updates

- Costs updated as transactions occur
- Real-time batch profitability visibility
- Automated variance calculations
- Integration с biological assets valuation

## 8. Documentation Requirements

### 8.1 Daily Records

- Material allocation reports
- Labour distribution summaries
- Cost variance reports
- Batch status updates

### 8.2 Monthly Documentation

- Overhead rate calculations
- Variance analysis reports
- Standard cost updates
- Management cost reports

## 9. Quality Control

### 9.1 Daily QC Checks

- Verify cost allocation accuracy
- Review unusual cost entries
- Validate timesheet data completeness
- Check overhead rate applications

### 9.2 Monthly Reviews

- Analyze cost trends и patterns
- Review standard cost accuracy
- Validate allocation methodology
- Update procedures as needed

## 10. Performance Metrics

- Cost per gram by strain
- Labour efficiency by operation
- Overhead absorption rates
- Batch profitability analysis
- Cost variance trends

## 11. Training Requirements

- Cost accounting principles (4 hours)
- System procedures training (3 hours)
- Variance analysis techniques (2 hours)
- Annual update training (1 hour)

## 12. References

- GAAP Cost Accounting Standards
- IMA Cost Management Guidelines
- URS-FIN-004 Cost Accounting
- FS-FIN-004 Cost Accounting
- Company Cost Accounting Policies

## 13. Revision History

| Version | Date       | Changes         | Approved By |
| ------- | ---------- | --------------- | ----------- |
| 1.0     | 2025-09-14 | Initial version | QA Manager  |
