---
title: "Plant Lifecycle Creation Test"
module: "Plant Lifecycle"
urs_id: "URS-PLM-001"
fs_id: "FS-PLM-001"
ds_id: "DS-PLM-001"
iq_oq_pq_step: "OQ-PLM-001"
version: "0.1"
status: "draft"
last_updated: "2025-09-01"
---

# 1. Purpose

Проверка корректного создания нового растения в системе и правильной записи в Audit Trail.

# 2. Preconditions

- ERP запущена
- Пользователь с правами "Cultivation Manager"
- База данных пуста для тестового растения

# 3. Test Steps

1. Войти в ERP как "Cultivation Manager"
2. Перейти в модуль Plant Lifecycle → Create Plant
3. Ввести все обязательные данные (ID, Strain, Mother, Date Planted)
4. Сохранить запись

# 4. Expected Results

- Растение создано в системе с корректными атрибутами
- Audit Trail зафиксировал действие с timestamp и пользователем
- Данные доступны для отчетов GACP

# 5. Actual Results

- Заполняется после выполнения теста

# 6. Pass/Fail

- Pass/Fail
