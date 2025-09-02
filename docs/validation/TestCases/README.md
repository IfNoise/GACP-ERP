# TestCases

Директория содержит шаблоны тест-кейсов для всех модулей ERP. Каждый файл теста привязан к URS/FS/DS и шагам IQ/OQ/PQ.

## Структура файлов

- TC-<Module>-<Number>.md
- Например:
  - TC-PLM-001.md
  - TC-AUD-001.md
  - TC-TRAIN-001.md

## Формат тест-кейса

```markdown
---
title: "Test Case Title"
module: "Module Name"
urs_id: "URS-xxxx"
fs_id: "FS-xxxx"
ds_id: "DS-xxxx"
iq_oq_pq_step: "IQ/OQ/PQ Step ID"
version: "0.1"
status: "draft"
last_updated: "2025-09-01"
---

# 1. Purpose

Описание цели теста.

# 2. Preconditions

- Установленная среда
- Доступ пользователя
- Необходимые данные

# 3. Test Steps

1. Действие 1
2. Действие 2
3. Проверка результата

# 4. Expected Results

- Результат 1
- Результат 2

# 5. Actual Results

- Заполняется после выполнения теста

# 6. Pass/Fail

- Pass/Fail
```
