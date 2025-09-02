---
title: "Backup & Restore Test"
module: "Backup/Restore"
urs_id: "URS-BACKUP-001"
fs_id: "FS-BACKUP-001"
ds_id: "DS-BACKUP-001"
iq_oq_pq_step: "PQ-BACKUP-001"
version: "0.1"
status: "draft"
last_updated: "2025-09-01"
---

# 1. Purpose

Проверка работы процедур резервного копирования и восстановления данных ERP.

# 2. Preconditions

- ERP запущена
- Настроены backup/restore процессы и WORM-хранилище
- Пользователь с правами "IT Admin"

# 3. Test Steps

1. Создать резервную копию базы данных и конфигурации
2. Имитировать сбой системы (удаление части тестовых данных)
3. Восстановить данные из резервной копии
4. Проверить целостность восстановленных данных
5. Проверить привязку Audit Trail и e-Signatures к восстановленным данным

# 4. Expected Results

- Данные восстановлены корректно
- Нет потери критических записей
- Audit Trail и e-Signatures остаются валидными
- Система готова к дальнейшей работе без ошибок

# 5. Actual Results

- Заполняется после выполнения теста

# 6. Pass/Fail

- Pass/Fail
