---
title: "Reporting Generation Test"
module: "Reporting"
urs_id: "URS-REPORT-001"
fs_id: "FS-REPORT-001"
ds_id: "DS-REPORT-001"
iq_oq_pq_step: "OQ-REPORT-001"
version: "0.1"
status: "draft"
last_updated: "2025-09-01"
---

# 1. Purpose

Проверка генерации стандартных и кастомных отчетов для GACP-соответствия, включая Plant Lifecycle и Audit Trail.

# 2. Preconditions

- ERP запущена
- Существуют записи растений, Audit Trail и e-Signatures
- Пользователь с правами "Compliance Officer"

# 3. Test Steps

1. Войти в ERP как "Compliance Officer"
2. Перейти в модуль Reporting
3. Сгенерировать отчет по Plant Lifecycle за выбранный период
4. Сгенерировать Audit Trail Report для выбранной партии
5. Проверить корректность данных и формата отчетов

# 4. Expected Results

- Все отчеты сгенерированы без ошибок
- Данные отчетов соответствуют записям в базе
- Формат отчета соответствует требованиям GACP

# 5. Actual Results

- Заполняется после выполнения теста

# 6. Pass/Fail

- Pass/Fail
