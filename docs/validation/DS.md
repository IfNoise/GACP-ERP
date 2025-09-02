---
title: "Data Specification (DS)"
system: "ERP for GACP-Compliant Cannabis Cultivation"
version: "0.1"
status: "draft"
last_updated: "2025-09-01"
---

# 1. Purpose

Документ описывает полную спецификацию данных ERP-системы для GACP-совместимого производства каннабиса. Включает модели растений, партий, Audit Trail, электронные подписи, пользователей, роли, обучение и IoT-метрики.

# 2. Traceability

- FS-DI-001 → DS-DI-001 … DS-DI-004
- FS-PLM-001 → DS-PLM-001 … DS-PLM-010
- FS-TRAIN-001 → DS-TRAIN-001 … DS-TRAIN-005
- FS-DR-001 → DS-DR-001 … DS-DR-004

# 3. Core Data Models

## 3.1 Plants

- plant_id: UUID, PK
- batch_id: UUID, FK
- source_type: seed/clone
- source_reference: UUID, optional
- strain: string
- stage: germination / vegetation / flowering / harvest
- current_health_score: int
- created_at: timestamp
- updated_at: timestamp
- version: int (для WORM)

## 3.2 Plant Events

- event_id: UUID, PK
- plant_id: UUID, FK
- event_type: string
- event_data: JSON
- performed_by: UUID, FK
- performed_at: timestamp
- audit_version: int

## 3.3 Batches

- batch_id: UUID, PK
- parent_batch_id: UUID, optional
- strain: string
- quantity: int
- stage: propagation / vegetation / flowering / harvest / processed
- created_at: timestamp
- updated_at: timestamp

## 3.4 Audit Trail

- audit_id: UUID, PK
- entity_type: string
- entity_id: UUID
- action: string
- old_value: JSON
- new_value: JSON
- performed_by: UUID
- performed_at: timestamp
- reason: text
- signature_id: UUID, FK to e-signatures

## 3.5 Electronic Signatures

- signature_id: UUID, PK
- user_id: UUID, FK
- signed_at: timestamp
- reason: text
- method: 2FA / QR / HardwareToken
- valid: boolean

## 3.6 Users & Roles

- Users:
  - user_id: UUID, PK
  - username: string
  - role_id: UUID, FK
  - created_at: timestamp
  - updated_at: timestamp
- Roles:
  - role_id: UUID, PK
  - role_name: string
  - permissions: JSON

## 3.7 Training & Competency

- Courses:
  - course_id: UUID, PK
  - title: string
  - description: text
  - created_at: timestamp
- Course Tests:
  - test_id: UUID, PK
  - course_id: UUID, FK
  - questions: JSON
  - passing_score: int
- User Course Progress:
  - progress_id: UUID, PK
  - user_id: UUID, FK
  - course_id: UUID, FK
  - score: int
  - completed_at: timestamp
  - certified: boolean

## 3.8 Metrics & IoT

- Sensor Metrics:
  - metric_id: UUID, PK
  - sensor_id: UUID
  - zone_id: UUID
  - type: string
  - value: numeric
  - unit: string
  - recorded_at: timestamp
- Zones:
  - zone_id: UUID, PK
  - name: string
  - room: string

# 4. Data Retention & WORM

- Критические таблицы (plants, plant_events, audit_trail, e-signatures) — хранение минимум 5 лет
- Versioning + timestamp для всех операций
- Использовать immutable storage (MinIO S3 Object Lock, IPFS и др.)

# 5. Backup & Disaster Recovery

- Daily backups + geo-replication
- Incremental + full backup strategy
- Шифрование резервов, хранение минимум 5 лет

# 6. Glossary

- WORM — Write Once Read Many
- UUID — Universally Unique Identifier
- JSON — структурированные данные
- Audit Trail — неизменяемый журнал действий
- e-Signature — электронная подпись, привязанная к действию
- IoT Metric — показания датчика в зоне выращивания
