# DSL-to-Document Generation Guide

## Цель
Данный документ описывает, как GitHub Copilot должен генерировать регуляторные документы из DSL-файлов.

## Философия генерации
**LLM как компилятор**: DSL → Естественный регуляторный документ

- **НЕ используем** шаблоны и Python-скрипты
- LLM **читает** DSL и **генерирует** профессиональный документ
- Документ должен быть **понятным**, **регуляторно-корректным**, **аудируемым**

## Структура выходных файлов

```
docs/
├── en/                    # English documents
│   ├── sop/              # Standard Operating Procedures
│   │   ├── sanitation/
│   │   ├── equipment/
│   │   ├── cultivation/
│   │   ├── quality/
│   │   └── security/
│   ├── wi/               # Work Instructions
│   ├── forms/            # Forms & Templates
│   └── training/         # Training Materials
└── ru/                   # Russian documents
    └── (same structure)
```

## Процесс генерации

### 1. Запрос пользователя
```
Пользователь: "Сгенерируй SOP-SAN-001 на русском"
```

### 2. Чтение DSL
```yaml
# Copilot читает: dsl/processes/SOP-SAN-001_cleaning_sanitation.yaml
metadata:
  id: "SOP-SAN-001"
  title: "Cleaning and Sanitation Procedures"
  ...
```

### 3. Генерация документа
Copilot создаёт: `docs/ru/sop/sanitation/SOP-SAN-001.md`

## Правила генерации

### Регуляторный тон
- **Формальный**, **императивный**, **однозначный**
- Использовать регуляторные термины: "должен", "обязан", "необходимо"
- EN: "shall", "must", "required", "ensure"
- RU: "должен", "обязан", "необходимо", "обеспечивается"

### Структура документа
Следовать классической регуляторной структуре:

```markdown
# [ID] [Title]

## 1. Purpose / Цель
## 2. Scope / Область применения
## 3. Definitions / Определения
## 4. Responsibilities / Ответственность
## 5. Materials & Equipment / Материалы и оборудование
## 6. Procedure / Процедура
## 7. Quality Controls / Контроль качества
## 8. Documentation / Документация
## 9. Safety / Безопасность
## 10. Deviations / Отклонения
## 11. References / Ссылки
## 12. Revision History / История изменений
```

### Обработка неопределённых значений

DSL использует маркеры для неопределённых данных:

```yaml
parameters:
  temperature:
    min: "defined_by_regulation"  # Будет заполнено позже
  frequency: "to_be_determined"   # Ещё не определено
```

**В документе отображать явно:**
```markdown
- **Temperature Range**: [To be defined by applicable regulation]
- **Frequency**: [To be determined during validation]
```

**Маркеры:**
- `defined_by_qa` → [To be defined by Quality Assurance]
- `defined_by_regulation` → [To be defined by applicable regulation]
- `defined_by_manufacturer` → [As per manufacturer specifications]
- `defined_by_operator` → [Determined by trained operator]
- `defined_by_management` → [To be approved by management]
- `to_be_determined` → [To be determined]
- `not_applicable` → N/A

### Перекрёстные ссылки

DSL может ссылаться на другие документы:

```yaml
documentation:
  related_sops:
    - id: "SOP-QC-001"
      title: "Quality Control Procedures"
  required_forms:
    - id: "FORM-CLN-001"
      title: "Cleaning Log"
```

**В документе:**
```markdown
## Related Documents
- [SOP-QC-001](../quality/SOP-QC-001.md) - Quality Control Procedures
- [FORM-CLN-001](../../forms/FORM-CLN-001.md) - Cleaning Log
```

### Локализация

**Полная локализация**, а не только перевод меток:

**EN:**
```markdown
## Purpose
This SOP establishes standardized procedures for cleaning and sanitation
of equipment, surfaces, and controlled environments...
```

**RU:**
```markdown
## Цель
Настоящая СОП устанавливает стандартизированные процедуры очистки
и санитарной обработки оборудования, поверхностей и контролируемых сред...
```

### Таблицы и структурированные данные

DSL может содержать табличные данные:

```yaml
materials:
  - id: "MAT-DISINF-001"
    name: "Isopropyl Alcohol 70%"
    specification: "USP Grade"
```

**В документе:**
```markdown
| ID | Material | Specification |
|----|----------|---------------|
| MAT-DISINF-001 | Isopropyl Alcohol 70% | USP Grade |
```

### Процедуры (шаги)

```yaml
procedure:
  steps:
    - step_number: 1
      title: "Pre-cleaning Inspection"
      actions:
        - "Verify equipment is shut down"
        - "Remove loose debris"
```

**В документе:**
```markdown
### Step 1: Pre-cleaning Inspection

1. Verify equipment is completely shut down and locked out
2. Remove all loose debris and residual material
3. Document equipment condition on [FORM-CLN-001](../../forms/FORM-CLN-001.md)
```

### Регуляторные требования

```yaml
compliance:
  standards:
    - "WHO GACP"
    - "FDA 21 CFR Part 11"
```

**В документе:**
```markdown
## Regulatory Compliance
This SOP complies with:
- WHO Good Agricultural and Collection Practices (GACP)
- FDA 21 CFR Part 11 - Electronic Records and Signatures
- EU GMP Annex 11 - Computerized Systems
```

## Примеры запросов

### Генерация одного документа
```
Пользователь: "Generate SOP-SAN-001 in English"
Copilot: 
1. Reads dsl/processes/SOP-SAN-001_cleaning_sanitation.yaml
2. Creates docs/en/sop/sanitation/SOP-SAN-001.md
3. Confirms: "Created SOP-SAN-001 in docs/en/sop/sanitation/"
```

### Генерация на обоих языках
```
Пользователь: "Generate SOP-EQP-CAL-001 in both languages"
Copilot:
1. Reads dsl/processes/SOP-EQP-CAL-001_equipment_calibration.yaml
2. Creates docs/en/sop/equipment/SOP-EQP-CAL-001.md (English)
3. Creates docs/ru/sop/equipment/SOP-EQP-CAL-001.md (Russian)
4. Confirms both files created
```

### Пакетная генерация
```
Пользователь: "Generate all sanitation SOPs in Russian"
Copilot:
1. Finds all dsl/processes/SOP-SAN-*.yaml
2. Generates each to docs/ru/sop/sanitation/
3. Reports summary of generated files
```

## Контроль качества генерации

После генерации документа проверить:

### ✅ Структура
- [ ] Все обязательные разделы присутствуют
- [ ] Нумерация последовательна
- [ ] Перекрёстные ссылки корректны

### ✅ Содержание
- [ ] Неопределённые значения явно отмечены
- [ ] Таблицы отформатированы правильно
- [ ] Процедуры детализированы и понятны

### ✅ Регуляторность
- [ ] Использован формальный тон
- [ ] Указаны стандарты compliance
- [ ] История изменений заполнена

### ✅ Локализация
- [ ] Весь текст переведён (не только заголовки)
- [ ] Термины переведены корректно
- [ ] Ссылки на другие документы работают

## Обработка форм и сопутствующих документов

### Формы (Forms)
DSL: `dsl/forms/FORM-CLN-001.yaml`
Output: `docs/{locale}/forms/FORM-CLN-001.md`

### Тренинги (Training)
DSL: `dsl/training/TRN-SAN-001.yaml`
Output: `docs/{locale}/training/TRN-SAN-001.md`

### Рабочие инструкции (WI)
DSL: `dsl/processes/WI-*.yaml`
Output: `docs/{locale}/wi/WI-*.md`

## Отладка

### Если DSL неполный
```markdown
⚠️ **Warning**: Some sections in DSL are incomplete or TBD.
Generated document includes placeholders for manual completion.
```

### Если отсутствуют ссылки
```markdown
⚠️ **Missing Reference**: FORM-CLN-002 referenced but DSL not found.
Link created as placeholder.
```

## Эволюция системы

По мере добавления новых типов документов:
1. Создать DSL схему: `dsl/schemas/{type}_schema.yaml`
2. Обновить структуру каталогов: `docs/{locale}/{type}/`
3. Добавить инструкции генерации в этот файл

---

**Ключевой принцип**: DSL — это структурированные данные. LLM — это компилятор, который превращает данные в профессиональный регуляторный документ.
