---
title: "SOP: Financial Accounting"
document_number: "SOP-FIN-001"
version: "1.0"
effective_date: "2025-09-14"
review_date: "2026-09-14"
approval: "QA Manager"
---

# SOP: Financial Accounting

## 1. Purpose

Данная SOP определяет процедуры финансового учёта в ERP системе для GACP-совместимого производства каннабиса, включая автоматические проводки, управление счетами и соответствие требованиям аудита.

## 2. Scope

- Автоматическое формирование бухгалтерских проводок
- Ведение General Ledger с append-only записями
- Управление счетами поставщиков и клиентов
- Интеграция с inventory и production модулями
- Compliance с audit trail требованиями

## 3. Responsibilities

- **Financial Manager**: Утверждение закрытия периодов и reconciliation
- **Accounting Clerk**: Ежедневное выполнение процедур и проверка автоматических проводок
- **System Administrator**: Настройка chart of accounts и правил проводок
- **QA Manager**: Аудит financial processes и compliance

## 4. Equipment & Materials

- ERP система с Financial модулем
- Доступ к General Ledger и Accounts модулям
- Электронные подписи для critical transactions
- Banking integration для automatic reconciliation

## 5. Procedure

### 5.1 Daily Financial Processing

1. **Проверка автоматических проводок**

   - Войти в Financial модуль ERP системы
   - Открыть "Daily Transaction Review" dashboard
   - Проверить все автоматические проводки за предыдущий день
   - Подтвердить соответствие проводок фактическим операциям

2. **Review Accounts Payable**

   - Открыть "Accounts Payable" модуль
   - Проверить новые invoices от suppliers
   - Подтвердить matching с purchase orders и receipts
   - Approve invoices для payment processing

3. **Review Accounts Receivable**
   - Открыть "Accounts Receivable" модуль
   - Проверить новые customer invoices
   - Confirm delivery против sales orders
   - Process customer payments и reconciliation

### 5.2 Inventory Integration

1. **Material Receipts Processing**

   - При поступлении материалов система автоматически создаёт проводку:

     ```
     Dr. Raw Materials Inventory
     Cr. Accounts Payable
     ```

   - Проверить автоматическую проводку в General Ledger
   - Подтвердить соответствие amounts в Purchase Order

2. **Production Cost Allocation**

   - Система автоматически распределяет costs по batches:

     ```
     Dr. Work in Process - Batch [ID]
     Cr. Raw Materials Inventory
     Cr. Direct Labor
     Cr. Manufacturing Overhead
     ```

### 5.3 Banking Reconciliation

1. **Daily Bank Statement Import**

   - Импортировать bank statement через secure API
   - Система автоматически matches transactions
   - Review unmatched items и manually reconcile
   - Approve final reconciliation с electronic signature

2. **Cash Flow Management**
   - Review daily cash position
   - Update cash flow forecasts
   - Alert management при low cash situations

### 5.4 Period End Closing

1. **Month End Procedures**

   - Complete all accruals и deferrals
   - Review biological asset valuations
   - Process depreciation журналы
   - Reconcile all balance sheet accounts
   - Generate financial statements

2. **Audit Trail Verification**
   - Verify all transactions имеют complete audit trail
   - Check electronic signatures для critical transactions
   - Review access logs для period

## 6. Critical Control Points

### 6.1 Segregation of Duties

- Different users для creation и approval transactions
- Mandatory dual approval для transactions > $10,000
- System enforced approval workflows

### 6.2 Electronic Signatures

- Required для all journal entries > $1,000
- Mandatory для period end closing
- PKI certificates для high-value transactions

### 6.3 Audit Trail Integrity

- All changes logged в immutable audit trail
- No deletion возможности для posted transactions
- Automatic backup всех financial data

## 7. Documentation

### 7.1 Required Records

- General Ledger printouts (monthly)
- Bank reconciliation statements
- Audit trail reports
- Electronic signature logs

### 7.2 Retention Period

- Financial records: 10 years minimum
- Audit trails: Permanent retention
- Supporting documents: 7 years

## 8. Training Requirements

- Initial training на Financial модуле (8 hours)
- Annual refresher training (2 hours)
- Compliance training на regulations (4 hours annually)
- Electronic signature certification

## 9. Quality Control

### 9.1 Daily QC Checks

- Verify trial balance balances
- Check for unusual journal entries
- Review exception reports
- Confirm backup completion

### 9.2 Weekly Reviews

- Accounts aging analysis
- Cash flow projections review
- Variance analysis против budget

## 10. Corrective Actions

### 10.1 Error Correction

- Use reversal entries, never delete original transactions
- Document reason для correction в audit trail
- Require supervisor approval для corrections
- Electronic signature required

### 10.2 System Issues

- Immediately notify IT support
- Document incident в system log
- Implement manual backup procedures if needed
- Update procedures based на lessons learned

## 11. References

- 21 CFR Part 11 (Electronic Records and Signatures)
- GAAP Accounting Standards
- Company Financial Policies
- URS-FIN-001 through URS-FIN-005
- FS-FIN-001 through FS-FIN-005

## 12. Revision History

| Version | Date       | Changes         | Approved By |
| ------- | ---------- | --------------- | ----------- |
| 1.0     | 2025-09-14 | Initial version | QA Manager  |

## 13. Approval

**Prepared by:** Financial Systems Analyst  
**Reviewed by:** Financial Manager  
**Approved by:** QA Manager  
**Effective Date:** 2025-09-14
