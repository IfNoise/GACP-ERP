# ✅ Чек-лист немедленных действий по аудиту документации

> **Дата:** 16 октября 2025 г.  
> **Базируется на:** DOCUMENTATION_AUDIT_REPORT.md  
> **Статус:** К выполнению

---

## 🔴 КРИТИЧЕСКИЙ ПРИОРИТЕТ (Неделя 1)

### 1. Обновить Traceability Matrix ⚠️

**Файл:** `/docs/validation/TraceabilityMatrix.md`

**Задачи:**

- [ ] Добавить новые модули в матрицу:
  - [ ] Jitsi Communications Stack
  - [ ] Database Replication Infrastructure
  - [ ] Workforce Management (Android терминалы)
  - [ ] Spatial Planning (3D)
  - [ ] Forecasting & Analytics (ML)
  - [ ] Procurement Management
  - [ ] Knowledge Management (Wiki.js)

- [ ] Проверить связи для всех требований:
  - [ ] URS → FS (User Requirements → Functional Spec)
  - [ ] FS → DS (Functional Spec → Design Spec)
  - [ ] DS → IQ/OQ/PQ (Design → Qualification)
  - [ ] URS → Test Cases (Requirements → Tests)

- [ ] Добавить недостающие тест-кейсы:
  - [ ] TC-JITSI-001 (Jitsi communications)
  - [ ] TC-DB-REP-001 (Database replication)
  - [ ] TC-SPATIAL-001 (Spatial planning)
  - [ ] TC-ML-001 (ML forecasting)

- [ ] Проверить полноту покрытия (должно быть 100%)

**Ответственный:** Validation Lead  
**Срок:** 5 рабочих дней  
**Критичность:** 🔴 ВЫСОКАЯ

---

## 🟡 ВЫСОКИЙ ПРИОРИТЕТ (Неделя 2-3)

### 2. Обновить даты в ключевых документах 📅

#### 2.1 DOCUMENTATION_INDEX.md

**Файл:** `/docs/DOCUMENTATION_INDEX.md`

- [ ] Изменить дату обновления с "14 сентября 2025" на "16 октября 2025"
- [ ] Обновить версию с "v3.0" на "v3.1"
- [ ] Проверить актуальность статусов всех документов

**Строка 4:** `> **Последнее обновление**: 14 сентября 2025`  
**Заменить на:** `> **Последнее обновление**: 16 октября 2025`

#### 2.2 README.md

**Файл:** `/docs/README.md`

- [ ] Обновить дату обновления
- [ ] Проверить актуальность структуры папок
- [ ] Обновить quick start инструкции при необходимости

#### 2.3 Compliance документы

**Файлы:**

- [ ] `/docs/compliance/FDA_21CFR_Part11.md`
- [ ] `/docs/compliance/EU_GMP_Annex11.md`
- [ ] `/docs/compliance/WHO_GACP.md`
- [ ] `/docs/compliance/EMA_GACP.md`
- [ ] `/docs/compliance/MHRA_DataIntegrity.md`
- [ ] `/docs/compliance/ALCOA+.md`
- [ ] `/docs/compliance/GAMP5.md`

**Действия для каждого:**

- [ ] Проверить актуальность требований (не изменились ли регуляции)
- [ ] Обновить дату последнего review
- [ ] Добавить примечание о проверке актуальности

#### 2.4 Валидационные документы

**Файлы:**

- [ ] `/docs/validation/URS.md`
- [ ] `/docs/validation/FS.md`
- [ ] `/docs/validation/DS.md`
- [ ] `/docs/validation/VMP.md`
- [ ] `/docs/validation/IQ.md`
- [ ] `/docs/validation/OQ.md`
- [ ] `/docs/validation/PQ.md`
- [ ] `/docs/validation/RA.md`

**Действия:**

- [ ] Проверить соответствие текущей архитектуре
- [ ] Обновить даты
- [ ] Добавить новые модули при необходимости

**Ответственный:** Documentation Manager  
**Срок:** 10 рабочих дней  
**Критичность:** 🟡 СРЕДНЯЯ

### 3. Исправить плейсхолдеры в SOP 🔗

#### 3.1 SOP_WastePlantMaterial.md

**Файл:** `/docs/sop/SOP_WastePlantMaterial.md`  
**Строка:** 32

**Текущее состояние:**

```markdown
- [URS-XXX-001, FS-XXX-001]
```

**Заменить на:**

```markdown
- [URS-PLM-012: Waste Management](../validation/URS.md#waste-management)
- [FS-PLM-012: Waste Tracking](../validation/FS.md#waste-tracking)
```

**Действия:**

- [ ] Найти соответствующие разделы в URS и FS
- [ ] Создать якорные ссылки (#waste-management)
- [ ] Обновить ссылки
- [ ] Проверить что ссылки работают

#### 3.2 SOP_Trimming.md

**Файл:** `/docs/sop/SOP_Trimming.md`  
**Строка:** 784

**Текущее состояние:**

```markdown
- [URS-XXX-001, FS-XXX-001]
```

**Заменить на:**

```markdown
- [URS-PLM-008: Trimming Process](../validation/URS.md#trimming-process)
- [FS-PLM-008: Trimming Workflow](../validation/FS.md#trimming-workflow)
```

**Действия:**

- [ ] Найти соответствующие разделы в URS и FS
- [ ] Создать якорные ссылки
- [ ] Обновить ссылки
- [ ] Проверить что ссылки работают

#### 3.3 Проверка других SOP

- [ ] Выполнить поиск плейсхолдеров во всех SOP:

```bash
grep -r "XXX" /docs/sop/*.md
grep -r "\[.*-XXX-.*\]" /docs/sop/*.md
```

- [ ] Составить список всех найденных плейсхолдеров
- [ ] Исправить каждый по аналогии с выше

**Ответственный:** Technical Writer  
**Срок:** 5 рабочих дней  
**Критичность:** 🟡 СРЕДНЯЯ

---

## 🟢 СРЕДНИЙ ПРИОРИТЕТ (Неделя 4)

### 4. Настроить автоматизацию проверок 🤖

#### 4.1 Markdownlint

**Задачи:**

- [ ] Установить markdownlint:

```bash
npm install -g markdownlint-cli
```

- [ ] Создать конфигурацию `.markdownlint.json` в корне проекта:

```json
{
  "default": true,
  "MD013": false,
  "MD033": false,
  "MD041": false
}
```

- [ ] Запустить проверку:

```bash
markdownlint docs/**/*.md
```

- [ ] Исправить найденные проблемы форматирования

#### 4.2 Markdown Link Check

**Задачи:**

- [ ] Установить markdown-link-check:

```bash
npm install -g markdown-link-check
```

- [ ] Создать скрипт проверки `scripts/check-links.sh`:

```bash
#!/bin/bash
find docs -name "*.md" -exec markdown-link-check {} \;
```

- [ ] Запустить проверку
- [ ] Исправить битые ссылки

#### 4.3 Настройка CI/CD

**Задачи:**

- [ ] Создать GitHub Action `.github/workflows/docs-quality.yml`:

```yaml
name: Documentation Quality

on:
  push:
    paths:
      - 'docs/**'
  pull_request:
    paths:
      - 'docs/**'

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run markdownlint
        uses: actionshub/markdownlint@main
      - name: Check links
        uses: gaurav-nelson/github-action-markdown-link-check@v1
```

- [ ] Настроить pre-commit hook
- [ ] Добавить badge в README

**Ответственный:** DevOps Engineer  
**Срок:** 5 рабочих дней  
**Критичность:** 🟢 СРЕДНЯЯ

---

## 📊 Прогресс выполнения

### Общий статус

```
Критический приоритет:  [ ] 0/1 (0%)
Высокий приоритет:      [ ] 0/3 (0%)
Средний приоритет:      [ ] 0/1 (0%)

Общий прогресс:         [ ] 0/5 (0%)
```

### Трекинг по неделям

**Неделя 1 (16-20 октября):**

- [ ] Traceability Matrix обновлена
- [ ] Новые модули добавлены
- [ ] Связи проверены

**Неделя 2-3 (23 октября - 3 ноября):**

- [ ] DOCUMENTATION_INDEX обновлён
- [ ] README обновлён
- [ ] Compliance документы пересмотрены
- [ ] Валидационные документы обновлены
- [ ] Плейсхолдеры в SOP исправлены

**Неделя 4 (6-10 ноября):**

- [ ] Markdownlint настроен
- [ ] Link checker настроен
- [ ] CI/CD pipeline создан
- [ ] Pre-commit hooks добавлены

---

## ✅ Критерии приёмки

### Для Traceability Matrix

- ✅ Все новые модули присутствуют
- ✅ Все требования связаны с функциями
- ✅ Все функции связаны с дизайном
- ✅ Все требования имеют тест-кейсы
- ✅ Покрытие = 100%

### Для обновления дат

- ✅ DOCUMENTATION_INDEX актуален
- ✅ README актуален
- ✅ Все compliance документы пересмотрены
- ✅ Все валидационные документы актуальны
- ✅ Даты обновления корректны

### Для плейсхолдеров

- ✅ Нет плейсхолдеров типа "XXX"
- ✅ Все ссылки рабочие
- ✅ Ссылки ведут на правильные разделы
- ✅ Якоря существуют в целевых документах

### Для автоматизации

- ✅ Markdownlint запускается без ошибок
- ✅ Link checker не находит битых ссылок
- ✅ CI/CD pipeline работает
- ✅ Pre-commit hooks активны

---

## 📝 Отчётность

### Ежедневные обновления

**Формат:**

```markdown
## Дата: [DD.MM.YYYY]

### Выполнено
- [x] Задача 1
- [x] Задача 2

### В процессе
- [ ] Задача 3 (50%)

### Блокеры
- Нет

### Следующие шаги
- Задача 4
- Задача 5
```

### Недельные отчёты

**Отправлять:** Validation Lead, Documentation Manager  
**Формат:** Markdown summary с метриками прогресса

---

## 🔗 Связанные документы

- **[DOCUMENTATION_AUDIT_REPORT.md](./DOCUMENTATION_AUDIT_REPORT.md)** - Полный отчёт аудита
- **[AUDIT_EXECUTIVE_SUMMARY.md](./AUDIT_EXECUTIVE_SUMMARY.md)** - Исполнительное резюме
- **[DOCUMENTATION_INDEX.md](../DOCUMENTATION_INDEX.md)** - Центральный индекс
- **[TraceabilityMatrix.md](../validation/TraceabilityMatrix.md)** - Матрица трассируемости

---

## 📞 Контакты для вопросов

- **Validation Lead:** [email@example.com]
- **Documentation Manager:** [email@example.com]
- **Technical Writer:** [email@example.com]
- **DevOps Engineer:** [email@example.com]

---

**Статус:** К выполнению  
**Версия чек-листа:** 1.0  
**Последнее обновление:** 16 октября 2025 г.
