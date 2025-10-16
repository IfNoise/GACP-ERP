# Data Dictionary - Quick Start Guide

**Дата**: 2025-10-16  
**Версия**: 1.0  
**Для**: Development Team, QA Team, Management

---

## 🚨 CRITICAL ALERT

**DS.md версия 1.0 устарела и не соответствует регуляторным требованиям!**

```text
❌ FDA 21 CFR Part 11: 45% coverage (требуется 95%+)
❌ EU GMP Annex 11: 55% coverage (требуется 95%+)
⚠️ ALCOA+: 72% coverage (требуется 90%+)

🔴 40 критических gaps
🟠 67 высокоприоритетных issues
🟡 88 средних issues

📅 Timeline до compliance: 6 недель
💰 Стоимость исправления: $50K-$100K
💀 Стоимость НЕ исправления: $200K-$500K + regulatory риски
```

---

## 📚 Документы для Чтения

### Начните здесь

1. **[DATA_DICTIONARY_SUMMARY.md](./DATA_DICTIONARY_SUMMARY.md)** (5 мин)
   - Executive summary
   - Топ-5 критических проблем
   - Next steps

2. **[DS_COMPLIANCE_MATRIX.md](./DS_COMPLIANCE_MATRIX.md)** (10 мин)
   - Матрица соответствия
   - Coverage statistics
   - Что отсутствует

3. **[DS_UPDATE_ACTION_PLAN.md](./DS_UPDATE_ACTION_PLAN.md)** (15 мин)
   - Пошаговый план
   - Timeline с milestones
   - Acceptance criteria

### Для детального изучения

4. **[DATA_DICTIONARY_COMPLIANCE_AUDIT.md](./DATA_DICTIONARY_COMPLIANCE_AUDIT.md)** (1 час)
   - Полный audit report (74KB)
   - Все 195 findings
   - SQL примеры для каждой структуры

---

## 🎯 Что Нужно Сделать

### Этап 1: Критические Структуры (Недели 1-2) - БЛОКЕР

#### Отсутствующие модули

- [ ] **DS-CHG-001/002/003**: Change Control System
  - Requirement: EU GMP Annex 11 Clause 12
  - Tables: change_requests, change_approvals, change_history

- [ ] **DS-DEV-001/002**: Deviation Management
  - Requirement: EU GMP Annex 11 Clause 13
  - Tables: deviations, root_cause_analyses

- [ ] **DS-CAPA-001**: CAPA System
  - Requirement: ICH Q10
  - Tables: capa_records

- [ ] **DS-VAL-001/002/003**: Validation Management
  - Requirement: FDA 21 CFR Part 11 § 11.10(a)
  - Tables: validation_protocols, test_cases, periodic_reviews

- [ ] **DS-DI-004/005**: Data Retention & Archive
  - Requirement: FDA 21 CFR Part 11 § 11.10(c)
  - Tables: retention_policies, archived_records

- [ ] **DS-WF-004/005**: Workflow Management
  - Requirement: FDA 21 CFR Part 11 § 11.10(f)
  - Tables: workflow_definitions, workflow_executions

#### Дополнить существующие

- [ ] **DS-ES-001**: Electronic Signatures
  - Add: `meaning`, `signed_entity_type`, `signed_entity_id`, `linked_record_hash`
  - Requirement: FDA § 11.50 & § 11.70

- [ ] **DS-DI-002**: Audit Trail
  - Add: `review_status`, `validation_status`, `retention_category`, `archive_status`
  - Requirement: FDA § 11.10(e)

- [ ] **DS-AUTH-001**: Users
  - Add: `training_current_status`, `gxp_training_expiry`, `qualification_status`
  - Requirement: EU GMP Annex 11 Clause 2

- [ ] **DS-PR-001**: Suppliers
  - Add: `gxp_critical`, `vendor_qualification_status`, `audit_frequency`
  - Requirement: EU GMP Annex 11 Clause 7

### Этап 2: Высокоприоритетные (Недели 3-4)

- [ ] DS-DOC-001/002/003: Document Control
- [ ] DS-QE-001: Quality Events
- [ ] DS-PR-003: Vendor Audits
- [ ] Validation metadata для всех GxP-critical tables

### Этап 3: Реструктуризация (Недели 5-6)

- [ ] Создать `_definitions/` структуру (SSOT)
- [ ] Создать `views/` представления
- [ ] Устранить дублирование
- [ ] Финализировать compliance mapping

---

## 🔑 Ключевые Концепции

### ALCOA+ Принципы

Каждая таблица должна обеспечивать:

- **A**ttributable: `performed_by`, `created_by` поля
- **L**egible: UTF-8, структурированные данные
- **C**ontemporaneous: `timestamp` с DEFAULT now()
- **O**riginal: Immutable storage (ImmuDB)
- **A**ccurate: Zod validation, FK constraints
- **C**omplete: NOT NULL для обязательных полей
- **C**onsistent: Uniform schema
- **E**nduring: Retention policies
- **A**vailable: Indexed, доступно для audit

### Validation Lifecycle

Все GxP-critical tables должны иметь:

```sql
validation_status       VARCHAR(20),
validation_protocol_id  UUID,
last_validated_at       TIMESTAMP,
next_review_date        DATE
```

### Electronic Signatures (FDA § 11.50 & § 11.70)

Подписи должны содержать:

- **Meaning**: "review", "approval", "verification"
- **Linking**: Неразрывная связь с подписанной записью
- **Hash**: Криптографическое подтверждение целостности

---

## 💻 Примеры Кода

### Добавление Validation Metadata

```typescript
// Zod schema для любой validated table
const ValidatedEntitySchema = z.object({
  // ... existing fields ...
  
  // Validation lifecycle
  validation_status: z.enum(['validated', 'pending', 'expired']),
  validation_protocol_id: z.string().uuid().optional(),
  last_validated_at: z.date().optional(),
  next_review_date: z.date().optional(),
  
  // Change control
  change_control_id: z.string().uuid().optional(),
  
  // Retention
  retention_policy_id: z.string().uuid().optional(),
});
```

### E-Signature с FDA Compliance

```typescript
const EnhancedSignatureSchema = z.object({
  signature_id: z.string().uuid(),
  user_id: z.string().uuid(),
  signed_at: z.date(),
  
  // FDA § 11.50 - Meaning
  meaning: z.enum([
    'authorship',
    'review', 
    'approval',
    'verification',
    'witnessing',
    'release'
  ]),
  
  // FDA § 11.70 - Linking
  signed_entity_type: z.string(), // 'batch', 'deviation', 'change_request'
  signed_entity_id: z.string().uuid(),
  linked_record_hash: z.string().length(64), // SHA-256
  
  // Critical operations witness
  witness_signature_id: z.string().uuid().optional(),
  witness_required: z.boolean(),
});
```

---

## 📞 Кому Задавать Вопросы

### По Compliance

- **FDA 21 CFR Part 11**: См. `/docs/compliance/FDA_21CFR_Part11.md`
- **EU GMP Annex 11**: См. `/docs/compliance/EU_GMP_Annex11.md`
- **ALCOA+**: См. `/docs/compliance/ALCOA+.md`

### По Техническим Вопросам

- **DS.md**: `/docs/validation/DS.md` (v1.0, требует обновления)
- **Data Dictionary**: `/docs/data_dictionary/README.md`
- **Contract Specs**: `/docs/CONTRACT_SPECIFICATIONS.md`

### По Процессу

- **Action Plan**: См. `DS_UPDATE_ACTION_PLAN.md`
- **Compliance Matrix**: См. `DS_COMPLIANCE_MATRIX.md`

---

## ⚡ Quick Commands

### Найти все ссылки на DS структуры

```bash
grep -r "DS-[A-Z]\{2,\}-[0-9]\{3\}" docs/
```

### Проверить compliance coverage

```bash
# См. DS_COMPLIANCE_MATRIX.md для текущего статуса
cat docs/reports/DS_COMPLIANCE_MATRIX.md | grep "Coverage:"
```

### Создать новую DS структуру

1. Добавить в `/docs/validation/DS.md`
2. Обновить `/docs/reports/DS_COMPLIANCE_MATRIX.md`
3. Создать migration script
4. Обновить Zod schemas в `/docs/CONTRACT_SPECIFICATIONS.md`

---

## 🎯 Success Criteria

### DS.md v2.0 готов когда

- ✅ Все Phase 1 критические структуры добавлены
- ✅ Все существующие структуры дополнены compliance полями
- ✅ ALCOA+ mapping для каждой таблицы
- ✅ Traceability matrix обновлена
- ✅ QA Review completed
- ✅ Approval signatures captured

### System готова к Production когда

- ✅ FDA 21 CFR Part 11: 95%+ coverage
- ✅ EU GMP Annex 11: 95%+ coverage
- ✅ ALCOA+: 90%+ coverage
- ✅ Все критические gaps закрыты
- ✅ Mock audit passed
- ✅ External compliance consultant sign-off

---

## 📊 Progress Tracking

### Current Status

```text
Week: 0 (Baseline)
Phase: Planning & Analysis
Completion: 0%

Critical Issues: 40 open
High Priority: 67 open
Medium Priority: 88 open
```

### Target Milestones

```text
Week 2: Phase 1 complete (Critical structures added)
Week 4: Phase 2 complete (High-priority enhancements)
Week 6: Phase 3 complete (Restructuring & final compliance)
```

---

## 🚀 Get Started

1. **Read** [DATA_DICTIONARY_SUMMARY.md](./DATA_DICTIONARY_SUMMARY.md)
2. **Review** [DS_UPDATE_ACTION_PLAN.md](./DS_UPDATE_ACTION_PLAN.md)
3. **Check** [DS_COMPLIANCE_MATRIX.md](./DS_COMPLIANCE_MATRIX.md)
4. **Start** Phase 1 implementation
5. **Track** Progress daily

**Next Meeting**: Team review of Action Plan  
**Deadline**: Phase 1 completion by Week 2  
**Owner**: Development Team Lead + QA Manager

---

**Created**: 2025-10-16  
**Status**: Ready for team review  
**Priority**: 🔴 CRITICAL - P0 Blocker
