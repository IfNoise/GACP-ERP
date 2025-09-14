---
title: "SOP: Biological Assets Management"
document_number: "SOP-FIN-002"
version: "1.0"
effective_date: "2025-09-14"
review_date: "2026-09-14"
approval: "QA Manager"
---

# SOP: Biological Assets Management

## 1. Purpose

Данная SOP определяет процедуры учёта растений каннабиса как биологических активов в соответствии с IFRS 41 и требованиями GACP, включая fair value оценку, impairment testing и disposal procedures.

## 2. Scope

- Признание растений как биологических активов
- Fair value measurement на каждую отчётную дату
- Impairment testing и loss recognition
- Transfer процедуры при harvest/sale
- Integration с cost accounting системой

## 3. Responsibilities

- **Plant Lifecycle Manager**: Предоставление данных о стадиях развития растений
- **Financial Analyst**: Выполнение fair value оценки и impairment testing
- **QA Manager**: Validation fair value методологии и compliance
- **CFO**: Approval significant write-downs и policy changes

## 4. Definitions

- **Biological Asset**: Живое растение cannabis в стадии роста
- **Fair Value**: Цена получения при продаже актива в orderly transaction
- **Harvest Date**: Дата перевода из biological asset в inventory
- **Impairment Loss**: Снижение recoverable amount ниже carrying value

## 5. Procedure

### 5.1 Initial Recognition

1. **Plant Registration**
   - При переходе растения в стадию vegetation автоматически создаётся biological asset record
   - Initial cost = accumulated costs (seeds/clones + direct labour + materials)
   - System creates journal entry:

   ```accounting
   Dr. Biological Assets - Vegetation
   Cr. Work in Process - Propagation
   ```

2. **Asset Classification**
   - Vegetation stage: Current biological assets
   - Flowering stage: Current biological assets  
   - Mature plants ready for harvest: Current assets

### 5.2 Fair Value Measurement

1. **Market Rate Determination**
   - Weekly update market rates per gram для каждого strain
   - Sources: Licensed dispensaries, wholesale markets, broker quotes
   - Document источники в fair value support file

2. **Yield Estimation**
   - Use historical yield data по strain и growing conditions
   - Adjust для current batch characteristics
   - Consider plant health score и environmental factors
   - Validate estimates с Plant Lifecycle Manager

3. **Fair Value Calculation**

   ```
   Fair Value = Estimated Yield (grams) × Market Rate per gram × Completion Factor
   ```

   - Completion Factor based на stage:
     - Vegetation: 40-60%
     - Early Flowering: 70-80%
     - Late Flowering: 90-95%

4. **System Update**
   - Input fair value в biological asset record
   - System automatically creates gain/loss journal entry:

   ```accounting
   Dr/Cr. Biological Assets
   Cr/Dr. Gain/Loss on Biological Assets
   ```

### 5.3 Monthly Fair Value Review

1. **Data Collection**
   - Gather current market rates from approved sources
   - Review yield estimates с cultivation team
   - Assess environmental factors affecting growth

2. **Revaluation Process**
   - Calculate новую fair value для каждого batch
   - Compare с carrying amount
   - Generate revaluation journal entries
   - Document significant changes в support file

3. **Approval Process**
   - Financial Analyst prepares revaluation summary
   - QA Manager reviews methodology compliance
   - CFO approves revaluations > 10% change

### 5.4 Impairment Testing

1. **Impairment Indicators**
   - Plant health score drops below 70
   - Pest or disease issues
   - Environmental damage
   - Market price decline > 20%

2. **Impairment Loss Calculation**
   - Determine recoverable amount (higher of value in use или fair value less costs to sell)
   - Compare с carrying amount
   - Recognize impairment loss if carrying amount exceeds recoverable amount

3. **Impairment Recording**

   ```accounting
   Dr. Impairment Loss - Biological Assets
   Cr. Biological Assets
   ```

### 5.5 Harvest and Disposal

1. **Harvest Notification**
   - Cultivation team notifies через ERP system при harvest initiation
   - System automatically triggers transfer process
   - Final fair value measurement на harvest date

2. **Transfer to Inventory**
   - Calculate final biological asset value
   - Transfer к finished goods inventory at fair value
   - Journal entry:

   ```accounting
   Dr. Finished Goods Inventory
   Cr. Biological Assets
   ```

3. **Cost Basis Determination**
   - Fair value на harvest date becomes cost basis для inventory
   - Use для subsequent cost of goods sold calculations

### 5.6 Sale of Living Plants

1. **Pre-Sale Approval**
   - Obtain approval для sale living plants
   - Determine sale price и payment terms
   - Document regulatory compliance

2. **Sale Recording**

   ```accounting
   Dr. Accounts Receivable/Cash
   Cr. Revenue from Biological Assets
   Dr. Cost of Biological Assets Sold
   Cr. Biological Assets
   ```

## 6. Documentation Requirements

### 6.1 Fair Value Support
- Market rate sources и methodology
- Yield estimation basis
- Completion factor determination
- Independent validation при available

### 6.2 Impairment Documentation
- Impairment indicators identification
- Recoverable amount calculation
- Write-down authorization
- Recovery monitoring

## 7. Quality Control

### 7.1 Monthly QC Procedures
- Review fair value inputs для reasonableness
- Compare actual yields к estimates
- Validate market rate sources
- Test calculation accuracy

### 7.2 Annual Procedures
- Independent review fair value methodology
- Compare results к industry benchmarks
- Update procedures для process improvements

## 8. Compliance Requirements

### 8.1 IFRS 41 Compliance
- Biological assets measured at fair value less costs to sell
- Gains and losses recognized в profit or loss
- Disclosure fair value measurement techniques

### 8.2 Audit Trail
- All valuation changes logged в audit trail
- Electronic signatures для significant revaluations
- Supporting documentation maintained

## 9. Training Requirements

- IFRS 41 biological assets training (4 hours)
- Fair value measurement principles (2 hours)
- System procedures training (2 hours)
- Annual compliance update (1 hour)

## 10. References

- IFRS 41 Agriculture
- IAS 36 Impairment of Assets
- IFRS 13 Fair Value Measurement
- URS-FIN-003 Biological Assets Accounting
- FS-FIN-003 Biological Assets

## 11. Revision History

| Version | Date | Changes | Approved By |
|---------|------|---------|-------------|
| 1.0 | 2025-09-14 | Initial version | QA Manager |