---
title: "Training Completion Tracking"
module: "Training & Competency"
urs_id: "URS-TRAIN-001"
fs_id: "FS-TRAIN-001"
ds_id: "DS-TRAIN-001"
iq_oq_pq_step: "OQ-TRAIN-001"
version: "0.1"
status: "draft"
last_updated: "2025-09-01"
---

# 1. Purpose

Проверка корректного отслеживания прохождения обучения и экзаменов сотрудниками.

# 2. Preconditions

- ERP запущена
- Пользователь с правами "HR Manager"
- Создан курс и экзамен для тестового сотрудника

# 3. Test Steps

1. Войти в ERP как "HR Manager"
2. Просмотреть список сотрудников и назначить курс
3. Сотрудник проходит курс и экзамен
4. Проверить отчет о прохождении в Training Report

# 4. Expected Results

- Статус курса обновлен на "Completed"
- Результаты экзамена сохранены
- Отчет Training Report отображает корректные данные

# 5. Actual Results

- Заполняется после выполнения теста

# 6. Pass/Fail

- Pass/Fail
