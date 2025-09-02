---
title: "Risk Assessment (RA)"
system: "ERP for GACP-Compliant Cannabis Cultivation"
version: "0.1"
status: "draft"
last_updated: "2025-09-01"
---

# 1. Purpose

Определение, оценка и управление рисками для ERP-системы, влияющими на GACP-соответствие и целостность данных.

# 2. Risk Identification

- Потеря данных (Plants, Batches, Audit Trail, e-Signatures)
- Ошибки в бизнес-логике (Plant Lifecycle, Reporting)
- Нарушения RBAC (доступ пользователей)
- Сбой IoT интеграции (метрики)
- Нарушения Disaster Recovery/BCP
- Ненадежное WORM-хранилище
- Невалидные отчеты или несоответствие требованиям GACP
- Сбой CI/CD или обновлений

# 3. Risk Analysis

- Оценка вероятности (Low, Medium, High)
- Оценка влияния (Low, Medium, High)
- Присвоение Risk Score = Probability × Impact
- Определение критичности (Critical, Major, Minor)

# 4. Risk Control & Mitigation

- Бэкапы и репликация + geo-redundancy
- WORM-хранилище для Audit Trail и e-Signatures
- Контроль доступа через RBAC + 2FA/QR
- Тестирование модулей (OQ) и нагрузки (PQ)
- Change Control и SOP на обновления
- Мониторинг и алерты
- Регулярная проверка отчетности и трассируемости

# 5. Risk Acceptance Criteria

- Все критические риски имеют план контроля
- Все мажорные риски задокументированы и контролируются
- Все minor риски отслеживаются, но могут быть приняты с согласованием

# 6. Traceability

- RA риски привязаны к URS, FS, DS, IQ/OQ/PQ
