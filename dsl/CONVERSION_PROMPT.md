# Промпт для полного преобразования SOP в DSL формат

## Цель
Преобразовать все документы из `/docs/sop/` в структурированный DSL формат (YAML), создав для каждого SOP полный набор связанных документов (формы, отчеты, чеклисты, тренинги).

## Контекст проекта
Проект: GACP-ERP - система управления предприятием для производства медицинского каннабиса
Регуляторные стандарты: FDA 21 CFR Part 11, WHO GACP, EU GMP Annex 11, ISO 17025, ALCOA+

## Принципы DSL (КРИТИЧНО)
1. **DSL как единственный источник истины** - DSL не является "представлением" документа, он ЯВЛЯЕТСЯ документом
2. **Запрет на изобретение фактов** - если информация отсутствует в исходном SOP, используйте `null` или явно пометьте как `UNDEFINED`
3. **Явная маркировка неопределенных значений** - каждое `null` или `UNDEFINED` должно сопровождаться комментарием: `# UNDEFINED: причина - источник не содержит информацию`
4. **Детерминированность** - одинаковый вход всегда дает одинаковый выход
5. **Языковая нейтральность** - DSL не зависит от языка отображения

## Схемы и стандарты
**Обязательные схемы для валидации:**
- `/dsl/schemas/sop_schema.yaml` - структура SOP
- `/dsl/schemas/form_schema.yaml` - структура форм
- `/dsl/schemas/checklist_schema.yaml` - структура чеклистов
- `/dsl/schemas/report_schema.yaml` - структура отчетов
- `/dsl/schemas/training_schema.yaml` - структура тренингов

**Справочные документы:**
- `/dsl/README.md` - полное руководство по DSL
- `/dsl/DOCUMENT_MAPPING.md` - анализ связей между документами
- `/dsl/GENERATION_GUIDE.md` - руководство по генерации документации

## Правила именования (СТРОГО)
**Формат:** `ТИП-ДОМЕН-НОМЕР-ОПИСАНИЕ.yaml` (все в ВЕРХНЕМ РЕГИСТРЕ)

**Примеры:**
- SOP: `SOP-COC-001-CHAIN_OF_CUSTODY.yaml`
- Форма: `FORM-COC-001-RECEIPT.yaml`
- Чеклист: `CHKLST-COC-001-VERIFICATION.yaml`
- Отчет: `REPORT-AUDIT-001-TRAIL.yaml`
- Тренинг: `TRN-COC-001-PROCEDURES.yaml`

**Коды доменов (примеры):**
- COC - Chain of Custody
- AUDIT - Auditing
- DEV - Deviation Management
- CAPA - Corrective/Preventive Action
- CHG - Change Control
- DOC - Document Control
- CAL - Calibration
- CLEAN - Cleaning/Sanitation
- ANAL - Analytical Methods
- SMPL - Sampling
- EQP - Equipment
- STOR - Storage
- TRAIN - Training
- SEC - Security
- DI - Data Integrity

## Структура задачи

### Этап 1: Анализ исходного SOP
Для каждого файла в `/docs/sop/SOP_*.md`:

1. **Прочитать полностью документ** для понимания контекста
2. **Извлечь метаданные:**
   - Название и ID
   - Версия и дата
   - Область применения и цель
   - Регуляторные требования
3. **Идентифицировать процедуры:**
   - Основные шаги (с ID)
   - Роли и ответственности
   - Входы/выходы
   - Решения и условия
4. **Найти упоминания связанных документов:**
   - Формы (явные и неявные)
   - Отчеты (явные и неявные)
   - Чеклисты (явные и неявные)
   - Необходимые тренинги
5. **Выделить требования:**
   - Оборудование и материалы
   - Контроль качества
   - Безопасность
   - Записи и документация
   - Сроки хранения

### Этап 2: Создание SOP DSL
Создать файл `process/SOP-{ДОМЕН}-{НОМЕР}-{ОПИСАНИЕ}.yaml` со следующей структурой:

```yaml
metadata:
  id: "SOP-{ДОМЕН}-{НОМЕР}"
  type: "sop"
  title:
    en: "English Title"
    ru: "Русское Название"
  version: "1.0"
  effective_date: "YYYY-MM-DD"
  review_period_months: 12
  status: "active"
  regulatory_references:
    - standard: "FDA 21 CFR Part 11"
      sections: ["11.10(a)", "11.50"]
    # ... другие стандарты
  
purpose:
  en: "English purpose"
  ru: "Цель на русском"

scope:
  en: "English scope"
  ru: "Область применения на русском"

roles:
  - role_id: "ROLE-001"
    title:
      en: "Role Name"
      ru: "Название роли"
    responsibilities:
      en: ["Responsibility 1", "Responsibility 2"]
      ru: ["Обязанность 1", "Обязанность 2"]
    qualifications:
      en: ["Qualification 1"]
      ru: ["Квалификация 1"]

equipment:
  - equipment_id: "EQP-001"
    name:
      en: "Equipment Name"
      ru: "Название оборудования"
    specifications: "Technical specs or null"
    calibration_required: true
    calibration_frequency: "annual"

materials:
  - material_id: "MAT-001"
    name:
      en: "Material Name"
      ru: "Название материала"
    specifications: "Specs or null"

procedure:
  steps:
    - step_id: "{ДОМЕН}-001"
      sequence: 1
      title:
        en: "Step Title"
        ru: "Название шага"
      description:
        en: "Detailed description"
        ru: "Подробное описание"
      responsible_role: "ROLE-001"
      estimated_duration: "30 minutes or null"
      inputs:
        - "Input 1"
      outputs:
        - "Output 1"
      decisions:
        - condition: "If condition"
          true_action: "Action if true"
          false_action: "Action if false"
      substeps:
        - substep_id: "{ДОМЕН}-001-01"
          action:
            en: "Action description"
            ru: "Описание действия"
          critical: true
      forms:
        - form_id: "FORM-{ДОМЕН}-001"
          when: "at_start or at_end or during"
      checklists:
        - checklist_id: "CHKLST-{ДОМЕН}-001"
          when: "before or after or during"

quality_controls:
  - control_id: "QC-001"
    type: "verification or validation or inspection"
    description:
      en: "Control description"
      ru: "Описание контроля"
    frequency: "per_batch or daily or weekly"
    acceptance_criteria:
      en: "Criteria"
      ru: "Критерии"
    responsible_role: "ROLE-QA"
    form_id: "FORM-QC-001 or null"

safety_requirements:
  ppe:
    - item:
        en: "PPE Item"
        ru: "СИЗ"
      required: true
  hazards:
    - hazard:
        en: "Hazard description"
        ru: "Описание опасности"
      mitigation:
        en: "Mitigation measures"
        ru: "Меры предосторожности"

records:
  - record_id: "REC-001"
    name:
      en: "Record Name"
      ru: "Название записи"
    form_id: "FORM-{ДОМЕН}-001"
    retention_period: "30_years or 5_years"
    storage_location: "electronic or physical"
    backup_required: true

training:
  required_courses:
    - training_id: "TRN-{ДОМЕН}-001"
      title:
        en: "Training Title"
        ru: "Название тренинга"
      duration_hours: 24
      recertification_months: 12 or null
  prerequisites:
    - "TRN-GMP-001"

related_documents:
  forms:
    - "FORM-{ДОМЕН}-001"
  reports:
    - "REPORT-{ДОМЕН}-001"
  checklists:
    - "CHKLST-{ДОМЕН}-001"
  parent_sops:
    - "SOP-PARENT-001 or null"
  child_sops:
    - "SOP-CHILD-001 or null"

change_history:
  - version: "1.0"
    date: "YYYY-MM-DD"
    author: "Author Name"
    changes:
      en: "Initial release"
      ru: "Первый выпуск"
    approved_by: "Approver Name"
```

**ВАЖНО:** Если какое-то поле отсутствует в исходном SOP, используйте:
```yaml
field_name: null  # UNDEFINED: source SOP does not specify this information (section X.Y)
```

### Этап 3: Создание связанных форм
Для каждой упомянутой формы создать `forms/FORM-{ДОМЕН}-{НОМЕР}-{ОПИСАНИЕ}.yaml`:

```yaml
metadata:
  id: "FORM-{ДОМЕН}-{НОМЕР}"
  type: "form"
  category: "receipt or transfer or inspection or deviation or capa or training or other"
  title:
    en: "Form Title"
    ru: "Название формы"
  version: "1.0"
  effective_date: "YYYY-MM-DD"
  regulatory_compliance:
    - "FDA_21CFR11"
    - "ALCOA_PLUS"

usage:
  purpose:
    en: "Form purpose"
    ru: "Назначение формы"
  when_used:
    en: "When to use"
    ru: "Когда использовать"
  who_completes: ["ROLE-001"]
  sop_references:
    - "SOP-{ДОМЕН}-001"

form_structure:
  header:
    - field_id: "FORM_NUMBER"
      label:
        en: "Form Number"
        ru: "Номер формы"
      type: "auto_generated"
      required: true
      format: "FORM-{ДОМЕН}-{НОМЕР}-YYYYMMDD-NNN"
  
  sections:
    - section_id: "SEC-001"
      title:
        en: "Section Title"
        ru: "Название секции"
      fields:
        - field_id: "FIELD-001"
          label:
            en: "Field Label"
            ru: "Метка поля"
          type: "text or number or date or datetime or boolean or select or textarea or file"
          required: true
          validation:
            min_length: 1 or null
            max_length: 100 or null
            pattern: "regex or null"
          help_text:
            en: "Help text"
            ru: "Справка"

signature_requirements:
  - role: "ROLE-001"
    meaning: "completed_by"
    required: true
    date_required: true

retention:
  period: "30_years"
  location: "electronic"
  backup_required: true
```

### Этап 4: Создание чеклистов
Для каждого упомянутого чеклиста создать `checklists/CHKLST-{ДОМЕН}-{НОМЕР}-{ОПИСАНИЕ}.yaml`:

```yaml
metadata:
  id: "CHKLST-{ДОМЕН}-{НОМЕР}"
  type: "checklist"
  category: "verification or inspection or audit or safety or pre_operation"
  title:
    en: "Checklist Title"
    ru: "Название чеклиста"
  version: "1.0"
  effective_date: "YYYY-MM-DD"

usage:
  purpose:
    en: "Checklist purpose"
    ru: "Назначение чеклиста"
  trigger:
    en: "When to use"
    ru: "Когда использовать"
  responsible_role: "ROLE-001"
  sop_references:
    - "SOP-{ДОМЕН}-001"

checklist_structure:
  sections:
    - section_id: "SEC-001"
      title:
        en: "Section Title"
        ru: "Название секции"
      items:
        - item_id: "ITEM-001"
          sequence: 1
          check_description:
            en: "What to check"
            ru: "Что проверить"
          acceptance_criteria:
            en: "Pass criteria"
            ru: "Критерии прохождения"
          critical: true
          response_type: "pass_fail or yes_no or measurement"
          measurement_unit: "celsius or null"
          range_min: null
          range_max: null

scoring_method: "all_must_pass or percentage_pass or critical_items_only"
pass_threshold: 100 or 85 or null

corrective_actions:
  - trigger: "item_failure"
    item_id: "ITEM-001"
    action:
      en: "Corrective action"
      ru: "Корректирующее действие"
    escalation_required: true
```

### Этап 5: Создание отчетов
Для каждого упомянутого отчета создать `reports/REPORT-{ДОМЕН}-{НОМЕР}-{ОПИСАНИЕ}.yaml`:

```yaml
metadata:
  id: "REPORT-{ДОМЕН}-{НОМЕР}"
  type: "report"
  category: "audit or incident or validation or analytical or compliance or performance"
  title:
    en: "Report Title"
    ru: "Название отчета"
  version: "1.0"
  effective_date: "YYYY-MM-DD"

context:
  purpose:
    en: "Report purpose"
    ru: "Назначение отчета"
  audience:
    - "Management"
    - "Regulatory Authorities"
  frequency: "on_demand or daily or weekly or monthly or annual"
  sop_references:
    - "SOP-{ДОМЕН}-001"

report_structure:
  sections:
    - section_id: "SEC-001"
      title:
        en: "Section Title"
        ru: "Название секции"
      content_type: "narrative or table or chart or summary"
      data_sources:
        - type: "database_query"
          source: "erp.audit_trail"
          query: "SELECT * FROM audit_trail WHERE..."
        - type: "form_collection"
          form_id: "FORM-{ДОМЕН}-001"

data_sources:
  - source_id: "SRC-001"
    type: "database or form or measurement or manual_input"
    description:
      en: "Data source description"
      ru: "Описание источника"
    validation_required: true

generation:
  automated: true
  template_file: "reports/templates/REPORT-{ДОМЕН}-{НОМЕР}.md"
  output_formats: ["pdf", "html"]
  scheduling: "daily at 00:00 or null"

distribution:
  - role: "Management"
    delivery_method: "email"
    when: "immediately"

retention:
  period: "30_years"
  location: "electronic"
```

### Этап 6: Создание тренингов
Для каждого необходимого тренинга создать `training/TRN-{ДОМЕН}-{НОМЕР}-{ОПИСАНИЕ}.yaml`:

```yaml
metadata:
  id: "TRN-{ДОМЕН}-{НОМЕР}"
  type: "training"
  category: "sop_training or compliance_training or safety_training or technical_training"
  title:
    en: "Training Title"
    ru: "Название тренинга"
  version: "1.0"
  effective_date: "YYYY-MM-DD"

training_details:
  target_audience:
    - "ROLE-001"
  duration_hours: 24
  delivery_method: "classroom or online or hybrid or self_study"
  prerequisite_trainings:
    - "TRN-GMP-001"
  recertification_required: true
  recertification_period_months: 12

curriculum:
  modules:
    - module_id: "MOD-001"
      sequence: 1
      title:
        en: "Module Title"
        ru: "Название модуля"
      duration_hours: 4
      learning_objectives:
        en:
          - "Objective 1"
        ru:
          - "Цель 1"
      topics:
        en:
          - "Topic 1"
        ru:
          - "Тема 1"

assessment:
  theoretical_exam:
    required: true
    passing_score: 85
    questions_count: 20
    time_limit_minutes: 60
  practical_demonstration:
    required: true
    scenarios:
      - scenario_id: "PRAC-001"
        description:
          en: "Scenario description"
          ru: "Описание сценария"
        success_criteria:
          en: ["Criteria 1"]
          ru: ["Критерий 1"]

materials:
  - material_id: "MAT-001"
    type: "presentation or manual or video or sop_document"
    title:
      en: "Material Title"
      ru: "Название материала"
    location: "training/materials/TRN-{ДОМЕН}-{НОМЕР}/MAT-001.pdf"

records:
  training_certificate:
    template: "training/certificates/TRN-{ДОМЕН}-{НОМЕР}.pdf"
    retention_period: "indefinite"
```

## Workflow для обработки всех SOP

### Шаг 1: Получить список всех SOP
```bash
ls /docs/sop/SOP_*.md
```

### Шаг 2: Для каждого SOP выполнить
```
FOR EACH sop_file IN /docs/sop/:
  1. Прочитать sop_file полностью
  2. Извлечь метаданные и структуру
  3. Идентифицировать домен и присвоить код (e.g., COC, AUDIT, DEV)
  4. Создать SOP-{ДОМЕН}-{НОМЕР}-{ОПИСАНИЕ}.yaml в /dsl/process/
  5. Найти все упоминания форм → создать FORM-*.yaml
  6. Найти все упоминания отчетов → создать REPORT-*.yaml
  7. Найти все упоминания чеклистов → создать CHKLST-*.yaml
  8. Определить необходимые тренинги → создать TRN-*.yaml
  9. Обновить related_documents во всех созданных файлах
  10. Валидировать против соответствующих схем
```

### Шаг 3: Валидация
После создания всех файлов:
1. Проверить соответствие схемам (`/dsl/schemas/*.yaml`)
2. Проверить консистентность ID между документами
3. Проверить, что все `related_documents` ссылки существуют
4. Проверить отсутствие изобретенных фактов (все null имеют комментарии)

### Шаг 4: Документация связей
Обновить `/dsl/DOCUMENT_MAPPING.md` с полным списком созданных документов

## Приоритеты обработки

### Phase 1 - Critical Quality & Compliance (Priority: HIGH)
1. SOP_AuditTrail.md → SOP-AUDIT-001
2. SOP_DeviationManagement.md → SOP-DEV-001
3. SOP_CAPA.md → SOP-CAPA-001
4. SOP_ChangeControl.md → SOP-CHG-001
5. SOP_DocumentControl.md → SOP-DOC-001
6. SOP_DataIntegrity.md → SOP-DI-001

### Phase 2 - Analytical & Measurement (Priority: HIGH)
7. SOP_AnalyticalMethods.md → SOP-ANAL-001
8. SOP_EquipmentCalibration.md → SOP-CAL-001
9. SOP_Sampling.md → SOP-SMPL-001
10. SOP_InternalAudits.md → SOP-AUDIT-002

### Phase 3 - Operations & Safety (Priority: MEDIUM)
11. SOP_ChainOfCustody.md → SOP-COC-001 (уже сделано ✅)
12. SOP_CleaningSanitation.md → SOP-CLEAN-001
13. SOP_EquipmentMaintenance.md → SOP-EQP-001
14. SOP_EquipmentManagement.md → SOP-EQP-002
15. SOP_AccessControl.md → SOP-SEC-001

### Phase 4 - Специализированные процессы (Priority: MEDIUM-LOW)
16-60. Остальные SOP в порядке зависимости

## Контроль качества

### Чеклист для каждого созданного DSL файла
- [ ] Все обязательные поля заполнены
- [ ] Файл валидируется против схемы
- [ ] ID уникален и следует конвенции именования
- [ ] Все bilingual поля имеют значения на en и ru
- [ ] Все `null` значения помечены комментарием `# UNDEFINED: ...`
- [ ] Все ссылки на связанные документы существуют
- [ ] Даты в формате ISO 8601 (YYYY-MM-DD)
- [ ] Regulatory references корректны
- [ ] Retention periods указаны
- [ ] Роли и ответственности определены

### Метрики прогресса
```yaml
total_sops: 60
completed_sops: 1  # SOP-COC-001
remaining_sops: 59
total_forms_expected: ~150
total_checklists_expected: ~80
total_reports_expected: ~100
total_trainings_expected: ~60
```

## Технические требования

### Формат файлов
- Кодировка: UTF-8
- Отступы: 2 пробела
- Перевод строки: LF (Unix-style)
- YAML синтаксис: strict YAML 1.2

### Комментарии
```yaml
# Используйте комментарии для:
# 1. Объяснения UNDEFINED значений
# 2. Пояснения сложной логики
# 3. Временных TODO (с датой и автором)

field: null  # UNDEFINED: source document SOP_Example.md Section 5.3 does not specify this parameter
```

## Пример использования промпта

**Запрос для AI:**
```
Используя промпт из /dsl/CONVERSION_PROMPT.md, преобразуй следующие SOP в DSL:
1. /docs/sop/SOP_AuditTrail.md
2. /docs/sop/SOP_DeviationManagement.md
3. /docs/sop/SOP_CAPA.md

Для каждого SOP создай:
- Основной SOP DSL файл
- Все упомянутые формы
- Все упомянутые отчеты
- Все упомянутые чеклисты
- Необходимые тренинги

Валидируй каждый файл против соответствующей схемы.
```

## Автоматизация (будущее)

### Скрипт конвертации
Создать `/dsl/convert_sop.py`:
```python
def convert_sop_to_dsl(sop_path: str) -> dict:
    """
    Читает SOP markdown и преобразует в DSL YAML
    """
    pass

def extract_related_documents(sop_content: str) -> dict:
    """
    Извлекает упоминания форм, отчетов, чеклистов из SOP
    """
    pass

def validate_against_schema(dsl_file: str, schema_file: str) -> bool:
    """
    Валидирует DSL против схемы
    """
    pass
```

## Справочная информация

### Документы для изучения перед началом
1. `/dsl/README.md` - основное руководство
2. `/dsl/schemas/sop_schema.yaml` - структура SOP
3. `/dsl/process/SOP-COC-001-CHAIN_OF_CUSTODY.yaml` - эталонный пример
4. `/docs/CODING_STANDARDS.md` - стандарты кодирования
5. `/docs/compliance/ALCOA+.md` - принципы целостности данных

### Регуляторные требования по типам документов
- **Формы**: FDA 21 CFR Part 11 (electronic signatures, audit trails)
- **Отчеты**: ALCOA+ compliance, data integrity
- **Чеклисты**: ISO 17025 (verification procedures)
- **Тренинги**: WHO GACP (personnel qualifications)

## Итоговый результат

По завершении конвертации должна быть получена:
1. **60+ SOP DSL файлов** в `/dsl/process/`
2. **150+ Form DSL файлов** в `/dsl/forms/`
3. **80+ Checklist DSL файлов** в `/dsl/checklists/`
4. **100+ Report DSL файлов** в `/dsl/reports/`
5. **60+ Training DSL файлов** в `/dsl/training/`
6. **Обновленный DOCUMENT_MAPPING.md** с полным списком
7. **Валидационный отчет** по всем файлам

---

**Версия промпта:** 1.0  
**Дата:** 2026-01-08  
**Автор:** GACP-ERP DSL Team  
**Статус:** Ready for use
