---
title: "Audit Trail Verification"
module: "Audit Trail"
urs_id: "URS-AUD-001"
fs_id: "FS-AUD-001"
ds_id: "DS-AUD-001"
iq_oq_pq_step: "OQ-AUD-001"
version: "0.1"
status: "draft"
last_updated: "2025-09-01"
---

# 1. Purpose

Проверка неизменяемости записей Audit Trail и привязки к e-Signature.

# 2. Preconditions

- ERP запущена
- Пользователь с правами "Compliance Officer"
- Существуют тестовые записи Plant Lifecycle

# 3. Test Steps

1. Войти в ERP как "Compliance Officer"
2. Просмотреть Audit Trail для тестового растения
3. Попробовать изменить существующую запись
4. Проверить привязку e-Signature к действиям пользователя

# 4. Expected Results

- Изменение записей невозможно
- Каждое действие привязано к пользователю и timestamp
- e-Signature подтверждает подлинность действия

# 5. Actual Results

- Заполняется после выполнения теста

# 6. Pass/Fail

- Pass/Fail
