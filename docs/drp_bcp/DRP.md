---
title: "Disaster Recovery Plan (DRP)"
module: "ERP Infrastructure"
version: "0.1"
status: "draft"
last_updated: "2025-09-01"
---

# 1. Purpose

Обеспечение непрерывной работы ERP и восстановления после катастроф.

# 2. Scope

Сервера, базы данных, контейнеры, IoT интеграции, критические сервисы.

# 3. Responsibilities

- IT Admin: выполнение DRP процедур
- Compliance Officer: аудит готовности DRP

# 4. Recovery Procedures

1. Резервное копирование данных (ежедневно) в WORM-хранилище
2. Репликация базы данных и сервисов в гео-резерв
3. Контейнеры Kubernetes: восстановление пода из последнего стабильного state
4. Проверка целостности данных и журналов после восстановления
5. Тестирование восстановления ежеквартально

# 5. References

- URS-DRP-001, FS-DRP-001, DS-DRP-001
- EU GMP Annex 11, GAMP5

# 6. Notes

- Все шаги фиксируются в Audit Trail
- DRP интегрирован с PQ тестами
