---
title: "Operational Qualification (OQ)"
system: "ERP for GACP-Compliant Cannabis Cultivation"
version: "0.1"
status: "draft"
last_updated: "2025-09-01"
---

# 1. Purpose

Проверка правильной работы ERP-системы и соответствия функциональных модулей требованиям URS/FS/DS.

# 2. Modules to Test

- Plant Lifecycle
- Batch Management
- Audit Trail
- Electronic Signatures
- Users & Roles
- Training & Competency
- Sensor Metrics & Zones
- Reporting

# 3. Test Procedures

- Проверка корректного создания, редактирования и удаления сущностей
- Проверка Audit Trail:
  - неизменяемость записей
  - привязка к электронной подписи
- Проверка RBAC (доступ по ролям)
- Проверка генерации отчетов по GACP
- Проверка интеграции с IoT, MinIO, WORM-хранилищем
- Проверка процессов backup/restore
- Проверка уведомлений и алертов

# 4. Acceptance Criteria

- Все модули работают без ошибок
- Audit Trail и e-Signatures корректны
- Отчеты соответствуют требованиям GACP
- Доступ пользователей соответствует ролям
- Процессы backup/restore подтверждены
