---
title: "Electronic Signature Functionality"
module: "e-Signature"
urs_id: "URS-ES-001"
fs_id: "FS-ES-001"
ds_id: "DS-ES-001"
iq_oq_pq_step: "OQ-ES-001"
version: "0.1"
status: "draft"
last_updated: "2025-09-01"
---

# 1. Purpose

Проверка работы электронной подписи при утверждении действий пользователя.

# 2. Preconditions

- ERP запущена
- Пользователь с правами "Manager"
- Plant Lifecycle запись создана

# 3. Test Steps

1. Войти в ERP как "Manager"
2. Перейти к созданному растению
3. Подтвердить запись с помощью e-Signature (пароль/QR)
4. Проверить Audit Trail на привязку подписи

# 4. Expected Results

- Подтверждение успешно
- Audit Trail зафиксировал e-Signature и действие пользователя
- Попытка изменить запись без подписи запрещена

# 5. Actual Results

- Заполняется после выполнения теста

# 6. Pass/Fail

- Pass/Fail
