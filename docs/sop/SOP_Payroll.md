---
title: "SOP: Payroll Management"
document_number: "SOP-FIN-004"
version: "1.0"
effective_date: "2025-09-14"
review_date: "2026-09-14"
approval: "QA Manager"
---

# SOP: Payroll Management

## 1. Purpose

Данная SOP определяет процедуры расчёта заработной платы с интеграцией в ERP систему, включая timesheet processing, cost allocation по batches, tax calculations и compliance с трудовым законодательством.

## 2. Scope

- Обработка timesheet data из workforce module
- Расчёт gross pay, deductions и net pay
- Автоматическое распределение labour costs по batches
- Tax calculation и reporting
- Payroll journal entries и financial integration

## 3. Responsibilities

- **Payroll Administrator**: Daily timesheet review и payroll processing
- **HR Manager**: Employee setup, rate changes и policy compliance
- **Financial Manager**: Review payroll costs и journal entries
- **Cost Accountant**: Validate labour cost allocation

## 4. Definitions

- **Regular Hours**: Standard work hours up to 40 per week
- **Overtime Hours**: Hours worked over 40 in a work week
- **Fully-loaded Rate**: Hourly rate including benefits и employer taxes
- **Cost Allocation**: Distribution labour costs по production batches

## 5. Procedure

### 5.1 Employee Setup

1. **New Employee Registration**
   - Create employee record в HR module
   - Set up pay rate, tax withholdings, benefit deductions
   - Assign employee to appropriate cost centers
   - Configure timesheet access и mobile device authorization

2. **Rate Configuration**
   - Base hourly rate
   - Overtime premium (typically 1.5x base rate)
   - Shift differentials (if applicable)
   - Benefits allocation rates
   - Employer tax rates

### 5.2 Timesheet Processing

1. **Daily Timesheet Review**
   - Review submitted timesheets from mobile devices/SCUD systems
   - Validate clock-in/clock-out times
   - Verify task assignments и batch allocations
   - Check для missing timesheets

2. **Timesheet Approval**
   - Supervisors review и approve subordinate timesheets
   - Resolve any discrepancies или questions
   - Electronic signature required для approval
   - System locks approved timesheets

3. **Overtime Calculation**
   - System automatically calculates overtime based на:
     - Hours over 40 in work week
     - Daily overtime rules (if applicable)
     - Holiday и weekend premiums

### 5.3 Payroll Calculation

1. **Gross Pay Calculation**

   ```
   Regular Pay = Regular Hours × Base Rate
   Overtime Pay = Overtime Hours × (Base Rate × 1.5)
   Holiday Pay = Holiday Hours × (Base Rate × Premium)
   Total Gross Pay = Regular Pay + Overtime Pay + Holiday Pay
   ```

2. **Deductions Processing**
   - Federal income tax withholding
   - State income tax withholding
   - Social Security (6.2%)
   - Medicare (1.45%)
   - Health insurance premiums
   - Retirement plan contributions
   - Other voluntary deductions

3. **Net Pay Calculation**

   ```
   Net Pay = Gross Pay - Total Deductions
   ```

### 5.4 Cost Allocation

1. **Batch Cost Distribution**
   - Распределить labour costs based на timesheet batch assignments
   - Calculate fully-loaded rates including:
     - Base wages
     - Employer payroll taxes
     - Benefits costs
     - Workers' compensation

2. **Allocation Journal Entry**

   ```accounting
   Dr. Work in Process - Batch A
   Dr. Work in Process - Batch B
   Dr. Manufacturing Overhead (indirect labour)
       Cr. Accrued Payroll
       Cr. Payroll Tax Payable
       Cr. Benefits Payable
   ```

### 5.5 Payroll Journal Entries

1. **Payroll Accrual**

   ```accounting
   Dr. Payroll Expense
   Dr. Payroll Tax Expense
   Dr. Benefits Expense
       Cr. Accrued Wages Payable
       Cr. Payroll Taxes Payable
       Cr. Benefits Payable
   ```

2. **Payroll Payment**

   ```accounting
   Dr. Accrued Wages Payable
       Cr. Cash - Payroll Account
   ```

3. **Tax Deposits**

   ```accounting
   Dr. Payroll Taxes Payable
       Cr. Cash
   ```

### 5.6 Payroll Reporting

1. **Employee Pay Statements**
   - Generate electronic pay stubs
   - Include year-to-date information
   - Store в EDMS system для compliance
   - Email/mobile notification to employees

2. **Management Reports**
   - Labour cost by batch/strain
   - Department labour summaries
   - Overtime analysis
   - Labour efficiency metrics

3. **Tax Reporting**
   - Quarterly 941 returns
   - Annual W-2 statements
   - State unemployment reports
   - Workers' compensation reporting

### 5.7 Month-End Procedures

1. **Payroll Accruals**
   - Accrue unpaid wages для period
   - Accrue employer taxes и benefits
   - Update cost allocations

2. **Variance Analysis**
   - Compare actual labour costs к budget
   - Analyze overtime trends
   - Review labour efficiency metrics
   - Document significant variances

## 6. Compliance Requirements

### 6.1 Federal Compliance
- Fair Labor Standards Act (FLSA)
- Federal unemployment tax
- Social Security и Medicare taxes
- Federal income tax withholding

### 6.2 State Compliance
- State unemployment insurance
- Workers' compensation
- State disability insurance
- State income tax withholding

### 6.3 Cannabis Industry Compliance
- 280E tax considerations
- State-specific employment requirements
- Background check compliance
- Training requirements documentation

## 7. System Controls

### 7.1 Access Controls
- Role-based access to payroll functions
- Segregation of duties (processing vs approval)
- Electronic signatures для critical changes
- Audit trail для all payroll transactions

### 7.2 Data Validation
- Timesheet completeness checks
- Rate change authorization
- Overtime calculation validation
- Tax calculation verification

## 8. Documentation Requirements

### 8.1 Employee Records
- Timesheets (7 years)
- Pay statements (7 years)
- Tax withholding forms (4 years)
- Personnel files (employment + 7 years)

### 8.2 Compliance Records
- Tax deposits и returns
- Workers' compensation filings
- Unemployment claims
- Audit trail reports

## 9. Quality Control

### 9.1 Daily QC Procedures
- Verify timesheet data integrity
- Check payroll calculation accuracy
- Review exception reports
- Validate cost allocations

### 9.2 Monthly QC Reviews
- Reconcile payroll bank account
- Review labour cost variances
- Validate tax accruals
- Test system calculations

## 10. Error Correction

### 10.1 Payroll Corrections
- Use adjustment entries, not reversals
- Document correction reasons
- Obtain supervisor approval
- Update affected employee records

### 10.2 Tax Corrections
- File amended returns when necessary
- Correct employee W-2s if needed
- Notify employees of corrections
- Update year-to-date records

## 11. Training Requirements

- Payroll system training (4 hours)
- Tax compliance training (2 hours)
- Labour law compliance (2 hours)
- Annual updates (1 hour)

## 12. Performance Metrics

- Payroll processing accuracy (target: 99.9%)
- On-time payment rate (target: 100%)
- Cost allocation accuracy
- Compliance audit results

## 13. References

- Fair Labor Standards Act
- IRS Publication 15 (Circular E)
- State Employment Laws
- URS-FIN-005 Payroll Integration
- FS-FIN-005 Payroll Integration

## 14. Revision History

| Version | Date | Changes | Approved By |
|---------|------|---------|-------------|
| 1.0 | 2025-09-14 | Initial version | QA Manager |