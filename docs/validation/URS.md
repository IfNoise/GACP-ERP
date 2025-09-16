---
id: URS
title: "User Requirements Specification (URS) — GACP ERP"
version: 1.0.0
status: active
owner: "QA/CSV Lead"
approvers:
  - "Head of Cultivation"
  - "Head of Quality (QA)"
  - "IT/CSV Manager"
created: "2025-09-01"
timezone: "Asia/Bangkok"
scope:
  in:
    - "ERP для GACP фермы (каннабис): культивация, качество, оборудование/IoT, комплаенс, обучение"
    - "Ведение электронных записей и подписей (21 CFR Part 11), аудит-трейл (Annex 11)"
    - "Отчеты и экспорт для аудита (CSV/PDF), WORM-хранение, DR/BCP, Geo-redundancy"
  out:
    - "Продажи/финансы вне комплаенса (если не критично для GACP)"
    - "Розничная e-commerce витрина"
references:
  regulatory:
    - "WHO GACP"
    - "EMA GACP"
    - "EU GMP Annex 11 — Computerised Systems"
    - "FDA 21 CFR Part 11 — Electronic Records, Electronic Signatures"
    - "MHRA GxP Data Integrity — ALCOA+"
    - "GAMP 5 (2nd ed.)"
  internal:
    - "../compliance/WHO_GACP.md"
    - "../compliance/EMA_GACP.md"
    - "../compliance/EU_GMP_Annex11.md"
    - "../compliance/FDA_21CFR_Part11.md"
    - "../compliance/MHRA_DataIntegrity.md"
    - "../compliance/ALCOA+.md"
    - "../compliance/GAMP5.md"
systems_context:
  platform:
    - "Nx monorepo (NestJS backend, Next.js frontend)"
    - "Contract-first API: ts-rest + Zod (shared types)"
    - "AuthZ/AuthN: Keycloak (RBAC, MFA)"
    - "Audit trail: immudb (append-only)"
    - "Object storage: MinIO with Object Lock (WORM)"
    - "RDBMS: PostgreSQL (business data)"
    - "Observability: OpenTelemetry → VictoriaMetrics, Loki, Tempo"
    - "Telemetry: EMQX → Telegraf → VictoriaMetrics"
    - "Containers: Docker; Orchestrator: Kubernetes (Helm, GitOps)"
    - "Event Streaming: Kafka"
    - "IOT mqtt/coap broker EMQX"
validation_strategy: "Risk-based (GAMP5). High-risk функции — расширенное тестирование и контроль."
gxp_risk_definitions:
  high: "Влияние на качество продукта/пациентскую безопасность/целостность записей"
  medium: "Операционные риски без прямого влияния на продукт/пациентскую безопасность"
  low: "Административные функции"
glossary:
  - key: "Audit Trail"
    value: "Неизменяемый журнал событий с атрибутами кто/что/когда/почему"
  - key: "e-signature"
    value: "Электронная подпись по Part 11: ID + второй фактор + намерение"
  - key: "WORM"
    value: "Write Once Read Many (нельзя изменить/удалить в retention window)"
  - key: "Retention"
    value: "Минимальный срок хранения критичных данных; по умолчанию ≥ 10 лет"
roles:
  - id: "CultivationOperator"
    desc: "Операторы теплиц/помещений"
  - id: "QAOfficer"
    desc: "Контроль качества, ревью и одобрения"
  - id: "LabTech"
    desc: "Лабораторные анализы, CoA"
  - id: "Maintenance"
    desc: "Оборудование, калибровки"
  - id: "ITAdmin"
    desc: "Администратор системы, конфигурации и доступы"
  - id: "Auditor"
    desc: "Чтение, отчеты, экспорт; без возможности модификации"
data_classification:
  - class: "GxP-Primary"
    examples: ["Batch Record", "Plant Lifecycle", "Deviations/CAPA", "CoA"]
  - class: "GxP-Config"
    examples: ["Master Data (strains, rooms)", "SOP refs", "Spec limits"]
  - class: "Non-GxP"
    examples: ["UI preferences", "Telemetry not tied to product quality"]
service_levels:
  rpo_minutes: 15
  rto_minutes: 120
localization:
  locales: ["en", "ru", "th"]
  time_format: "ISO8601 + TZ"
---

## 1. Overview

Этот документ описывает пользовательские требования (URS) к ERP-системе для GACP фермы, включая функции, соответствие регуляторным требованиям, интеграции, производительность, безопасность и требования к эксплуатации/восстановлению.

## 2. Acceptance and Verification Legend

- **Priority**: MUST | SHOULD | NICE
- **Risk**: High | Medium | Low
- **Verification**: IQ (Install Qual), OQ (Operational Qual), PQ (Performance/UAT), DR (Doc Review), SR (Security Review)
- **Trace**: связь с FS/DS/TestCases будет заполнена в матрице трассируемости

## 3. User Requirements

## 3.1 Безопасность и идентификация (Security & Identity)

- **URS-SEC-001** — **Единая аутентификация через Keycloak**

  - Priority: MUST | Risk: High
  - Rationale: Annex 11 §12; Part 11 §11.10(d)
  - Acceptance:
    - Все пользователи аутентифицируются через IdP (OIDC).
    - Пароли не хранятся в приложении.
  - Verification: IQ, OQ, SR, DR

- **URS-SEC-002** — **MFA для High-risk операций**

  - Priority: MUST | Risk: High
  - Rationale: Part 11 §11.200; ALCOA+
  - Acceptance:
    - Для операций класса High требуется второй фактор (TOTP/U2F/QR-badge+PIN).
    - Политика MFA управляется в Keycloak.
  - Verification: OQ, PQ, SR

- **URS-SEC-003** — **RBAC по ролям/областям (room/batch/strain)**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Разрешения на CRUD зависят от роли и контекста (помещение/партия).
    - Auditor — только чтение + экспорт.
  - Verification: OQ, SR

- **URS-SEC-004** — **Сессии и тайм-ауты**
  - Priority: MUST | Risk: Medium
  - Acceptance:
    - Конфигурируемый idle timeout; re-auth для подписи.
    - Принудительный logout по событию (access revocation).
  - Verification: OQ, SR

## 3.2 Электронные подписи (Part 11)

- **URS-SIGN-001** — **Двухкомпонентная подпись**

  - Priority: MUST | Risk: High
  - Rationale: Part 11 §11.200(a)
  - Acceptance:
    - Подпись = пользовательский ID + второй фактор + intent (Approve/Review).
    - Фиксация причины/комментария при отклонении.
  - Verification: OQ, PQ

- **URS-SIGN-002** — **Подписываемые объекты**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Подпись доступна для: Batch Record, Deviations/CAPA, CoA, изменения master data.
  - Verification: OQ, PQ

- **URS-SIGN-003** — **Отображение подписи**
  - Priority: MUST | Risk: High
  - Acceptance:
    - В UI/PDF отображаются: ФИО/ID, дата/время с TZ, причина, версия записи, хэш.
  - Verification: OQ, DR

## 3.3 Audit Trail (Annex 11, ALCOA+)

- **URS-AUD-001** — **Неизменяемый журнал в immudb**

  - Priority: MUST | Risk: High
  - Rationale: Annex 11 §9; ALCOA+
  - Acceptance:
    - Любое создание/изменение/подпись/логин → запись в append-only.
    - Записи имеют криптографические хэши, цепочки и серверные timestamps.
  - Verification: IQ, OQ, SR

- **URS-AUD-002** — **Полнота атрибутов**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Обязательные поля: who, when (TZ), what (entity+fields), before/after, why (comment), where (origin/room), intent.
  - Verification: OQ

- **URS-AUD-003** — **Ревью журналов QA**
  - Priority: MUST | Risk: Medium
  - Acceptance:
    - Ежемесячный отчёт по отклонениям/подписям/отказам; отметка QA ревью.
  - Verification: PQ, DR

## 3.4 Хранение и целостность данных (WORM, Retention)

- **URS-DATA-001** — **WORM на объектном хранилище**

  - Priority: MUST | Risk: High
  - Rationale: Annex 11 §7; ALCOA+ Enduring
  - Acceptance:
    - MinIO Object Lock (compliance mode) для GxP-Primary артефактов (PDF, CoA, отчёты).
    - Retention ≥ 10 лет (конфигурируемо), legal hold поддерживается.
  - Verification: IQ, OQ

- **URS-DATA-002** — **Версионирование и контроль изменений**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Все GxP-Primary записи версионируются; предыдущие версии доступны только для чтения.
  - Verification: OQ

- **URS-DATA-003** — **Криптографическая фиксация**
  - Priority: SHOULD | Risk: Medium
  - Acceptance:
    - Документы/экспорты снабжаются хэш-суммами; хэши хранятся в audit trail.
  - Verification: OQ, DR

## 3.5 Культивация (Seed-to-Harvest)

- **URS-CULT-001** — **Жизненный цикл растения**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Статусы: mother → clone → veg → flower → harvest → batch link.
    - История перемещений (room/bench) с timestamps.
  - Verification: OQ, PQ

- **URS-CULT-002** — **Master Data (штаммы, помещения, рецепты)**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Изменение master data требует подписи (QAOfficer) и audit trail.
  - Verification: OQ

- **URS-CULT-003** — **Отклонения и CAPA**
  - Priority: MUST | Risk: High
  - Acceptance:
    - Регистрация отклонений с классификацией (minor/major/critical); CAPA workflow с подписями.
  - Verification: PQ

## 3.6 Лаборатория и качество (Lab/QA)

- **URS-LAB-001** — **Результаты анализов и спецификации**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Импорт/ввод результатов (THC/CBD/микробиология/тяжелые металлы) против спецификаций.
    - Автоматический флаг out-of-spec (OOS) → отклонение.
  - Verification: OQ, PQ

- **URS-LAB-002** — **CoA генерация и подпись**
  - Priority: MUST | Risk: High
  - Acceptance:
    - CoA в PDF с цифровой подписью; версия закрепляется в WORM.
  - Verification: OQ

## 3.7 Оборудование и IoT

- **URS-IOT-001** — **Сбор телеметрии**

  - Priority: MUST | Risk: Medium
  - Acceptance:
    - Температура, влажность, CO₂, освещенность, полив/EC/рН — поступают по MQTT/Kafka, хранятся в TSDB (VictoriaMetrics).
  - Verification: IQ, OQ

- **URS-IOT-002** — **Алармы и пороги**

  - Priority: MUST | Risk: Medium
  - Acceptance:
    - Конфигурируемые пороги; уведомления (email/Telegram/…) и запись в audit trail при срабатывании.
  - Verification: OQ

- **URS-IOT-003** — **Калибровки и обслуживание**
  - Priority: MUST | Risk: High
  - Acceptance:
    - Журнал калибровок/ТО оборудования с подписями и напоминаниями.
  - Verification: PQ, DR

## 3.8 Отчетность и экспорт

- **URS-REP-001** — **Стандартные отчеты GACP**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Шаблоны: Audit Trail, Batch Record, Training, OOS/CAPA, CoA register.
    - Экспорт CSV/PDF; PDF отправляется в WORM.
  - Verification: OQ

- **URS-REP-002** — **Фильтрация и прослеживаемость**
  - Priority: MUST | Risk: High
  - Acceptance:
    - Любой отчет можно отфильтровать по дате/локации/партии/штамму/помещению.
  - Verification: OQ

## 3.9 Обучение и аттестация

- **URS-TRN-001** — **Курсы, экзамены, аттестации**
  - Priority: MUST | Risk: Medium
  - Acceptance:
    - Привязка курсов к ролям; прохождение — prerequisite для прав доступа High-risk.
    - Журнал обучения/сертификатов, подпись QA на допуск.
  - Verification: PQ

## 3.10 Непрерывность, DR/BCP, гео-резерв

- **URS-DR-001** — **Geo-redundancy (2 DC)**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Postgres: primary+sync replica (DC2) + async off-site.
    - immudb: active-active; MinIO: репликация + erasure coding.
  - Verification: IQ, DR, DR-Test

- **URS-DR-002** — **RPO/RTO**

  - Priority: MUST | Risk: High
  - Acceptance:
    - RPO ≤ 15 мин, RTO ≤ 120 мин; документированные сценарии failover/failback.
  - Verification: DR-Test, Reports

- **URS-DR-003** — **Резервное копирование и восстановление**
  - Priority: MUST | Risk: High
  - Acceptance:
    - Velero/pgBackRest или эквивалент; регулярные restore-тесты с протоколами.
  - Verification: IQ, DR-Test

## 3.11 Наблюдаемость и операционные требования

- **URS-OBS-001** — **Полная трассировка (OTEL)**

  - Priority: SHOULD | Risk: Medium
  - Acceptance:
    - Трейс каждого запроса и фоновой задачи; лог-корреляция (Loki/Tempo).
  - Verification: OQ

- **URS-OBS-002** — **SIEM/SOC интеграция**
  - Priority: SHOULD | Risk: Medium
  - Acceptance:
    - Экспорт security-событий в SIEM (в т.ч. e-sign, отказ MFA, admin actions).
  - Verification: OQ, SR

## 3.12 Производительность и масштабирование

- **URS-PERF-001** — **Производительность UI/API**

  - Priority: SHOULD | Risk: Medium
  - Acceptance:
    - P95 API < 300 мс при 200 RPS для Read-heavy; UI интерактивность < 100 мс навигации.
  - Verification: OQ, Perf Test

- **URS-PERF-002** — **Объемы данных**
  - Priority: SHOULD | Risk: Medium
  - Acceptance:
    - Поддержка ≥ 1e8 audit-трейл записей; ≥ 1e9 IoT метрик/год; ротация не нарушает ALCOA+.
  - Verification: DR, OQ

## 3.13 Финансовый модуль (Finance)

- **URS-FIN-001** — **Accounts Payable/Receivable**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Система должна вести счета поставщиков/клиентов с полным audit trail, интеграцией с inventory и автоматическим журналированием в GL.
  - Verification: OQ, PQ

- **URS-FIN-002** — **General Ledger и проводки**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Автоматическое формирование бухгалтерских проводок, append-only ledger entries, поддержка reversal entries с полной traceability.
  - Verification: OQ

- **URS-FIN-003** — **Биологические активы учёт**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Учёт растений как биологических активов по стадиям (семена→клоны→вегетация→цветение→harvest), automatic costing, возможность продажи на любой стадии.
  - Verification: OQ, PQ

- **URS-FIN-004** — **Cost Accounting для партий**

  - Priority: MUST | Risk: Medium
  - Acceptance:
    - Распределение затрат (материалы + труд + overhead) по партиям растений, автоматический расчёт себестоимости при закрытии партии.
  - Verification: PQ

- **URS-FIN-005** — **Payroll интеграция**
  - Priority: MUST | Risk: Medium
  - Acceptance:
    - Расчёт зарплаты на основе timesheet data, автоматические налоговые расчёты, генерация payslips в EDMS.
  - Verification: OQ

## 3.14 Workforce Management модуль

- **URS-WF-001** — **Управление персоналом и задачами**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Назначение задач сотрудникам с проверкой навыков/сертификации, интеграция с training records, mobile Android support.
  - Verification: OQ, PQ

- **URS-WF-002** — **Timesheet и смены**

  - Priority: MUST | Risk: Medium
  - Acceptance:
    - Отслеживание рабочего времени через SCUD/mobile app, автоматические расчёты переработок, интеграция с payroll.
  - Verification: OQ

- **URS-WF-003** — **Android терминалы интеграция**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Mobile app для SOP выполнения, QR/NFC scanning, offline capability с последующей синхронизацией, push notifications.
  - Verification: OQ, PQ

- **URS-WF-004** — **Компетенции и допуски**
  - Priority: MUST | Risk: High
  - Acceptance:
    - Проверка допуска к выполнению SOP на основе training records, автоматическая блокировка задач при истёкших сертификатах.
  - Verification: OQ

## 3.15 Spatial Planning модуль

- **URS-SP-001** — **Планирование зон выращивания**

  - Priority: SHOULD | Risk: Medium
  - Acceptance:
    - 2D/3D визуализация зон, оптимизация размещения растений, capacity planning, интеграция с IoT для мониторинга условий.
  - Verification: PQ

- **URS-SP-002** — **Оптимизация ресурсов**
  - Priority: SHOULD | Risk: Low
  - Acceptance:
    - Алгоритмы оптимального размещения с учётом energy efficiency, workflow optimization, equipment utilization.
  - Verification: PQ

## 3.16 Forecasting и аналитика

- **URS-FC-001** — **Прогнозирование урожайности**

  - Priority: SHOULD | Risk: Medium
  - Acceptance:
    - ML-модели для прогноза yield на основе historical data, environmental conditions, strain characteristics.
  - Verification: PQ

- **URS-FC-002** — **Планирование ресурсов**

  - Priority: SHOULD | Risk: Medium
  - Acceptance:
    - Прогнозирование потребности в материалах, персонале, equipment capacity на основе production plans.
  - Verification: PQ

- **URS-FC-003** — **Financial forecasting**
  - Priority: SHOULD | Risk: Medium
  - Acceptance:
    - Прогнозы cash flow, cost analysis, profitability analysis по партиям/сортам/зонам.
  - Verification: PQ

## 3.17 Procurement модуль

- **URS-PR-001** — **Управление поставщиками**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Supplier qualification, contract management, performance tracking, compliance documentation.
  - Verification: OQ

- **URS-PR-002** — **Purchase Orders**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Автоматическое создание PO на основе inventory levels, approval workflows, integration с financial module.
  - Verification: OQ

- **URS-PR-003** — **Receiving и inspection**
  - Priority: MUST | Risk: High
  - Acceptance:
    - QR-код сканирование incoming materials, automatic lot creation, integration с QC процессами.
  - Verification: OQ, PQ

## 3.18 Knowledge Management System

- **URS-KM-001** — **База знаний интеграция**

  - Priority: MUST | Risk: Medium
  - Acceptance:
    - Integration с Wiki.js/EDMS, automatic linking SOP к задачам, search functionality, version control.
  - Verification: OQ

- **URS-KM-002** — **Training content delivery**
  - Priority: MUST | Risk: Medium
  - Acceptance:
    - Delivery training materials через mobile app, progress tracking, automatic certificate generation.
  - Verification: OQ, PQ

## 3.19 Интеграции и API

- **URS-INT-001** — **Contract-first API**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Все публичные API описаны контрактами (ts-rest + Zod shared types), версионирование semver, backward-compatible минорные релизы.
  - Verification: DR, OQ

- **URS-INT-002** — **Импорт/экспорт лабораторных данных**
  - Priority: MUST | Risk: High
  - Acceptance:
    - Поддержка CSV/JSON импорта CoA/результатов; валидация против спецификаций; аудит изменений.
  - Verification: OQ, PQ

## 3.20 Financial Module (Comprehensive ERP Integration)

- **URS-FIN-001** — **Accounts Payable (AP)**

  - Priority: MUST | Risk: High
  - Rationale: GACP требует прослеживаемость всех поставок и их финансового учёта
  - Acceptance:
    - Purchase Orders с привязкой к receiving, supplier invoice reconciliation, approval workflows, GL integration.
  - Verification: OQ, PQ

- **URS-FIN-002** — **Accounts Receivable (AR)**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Customer invoicing, payment tracking, aging reports, credit management, integration с sales module.
  - Verification: OQ

- **URS-FIN-003** — **General Ledger (GL)**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Chart of Accounts management, automated journal entries, trial balance, period close procedures, multi-currency support.
  - Verification: OQ, PQ

- **URS-FIN-004** — **Biological Assets Accounting**

  - Priority: MUST | Risk: High
  - Rationale: Cannabis plants требуют учёта как биологические активы по стадиям
  - Acceptance:
    - Plant batches as WIP inventory, cost accumulation (materials, labor, overhead), fair value adjustments, harvest capitalization.
  - Verification: OQ, PQ

- **URS-FIN-005** — **Cost Accounting & Product Costing**

  - Priority: MUST | Risk: High
  - Acceptance:
    - FIFO/weighted average costing, batch cost allocation, labor distribution from timesheet, overhead allocation, COGS calculation.
  - Verification: OQ, PQ

- **URS-FIN-006** — **Payroll Integration**

  - Priority: MUST | Risk: Medium
  - Acceptance:
    - Integration с workforce module, timesheet processing, payroll calculations, tax deductions, payslip generation, GL posting.
  - Verification: OQ

- **URS-FIN-007** — **Fixed Assets & Depreciation**

  - Priority: SHOULD | Risk: Medium
  - Acceptance:
    - Asset registration, depreciation schedules, maintenance cost tracking, disposal processing.
  - Verification: OQ

- **URS-FIN-008** — **Immutable Financial Audit Trail**

  - Priority: MUST | Risk: High
  - Rationale: Финансовые записи должны соответствовать ALCOA+ principles
  - Acceptance:
    - All financial transactions записываются в immudb, no UPDATE/DELETE operations, только корректировочные проводки.
  - Verification: OQ, SR

- **URS-FIN-009** — **External Accounting System Integration**

  - Priority: SHOULD | Risk: Medium
  - Acceptance:
    - Export to SAP/QuickBooks/1C, GL interface, standard accounting formats (XML, CSV), scheduled data synchronization.
  - Verification: OQ

## 3.21 Go Audit Trail Consumer

- **URS-AUD-GO-001** — **High-Performance Event Processing**

  - Priority: MUST | Risk: High
  - Rationale: Kafka events должны обрабатываться с высокой производительностью в immudb
  - Acceptance:
    - Go consumer обработка 10,000+ events/second, batch processing (100-1000 events per batch), graceful shutdown.
  - Verification: OQ, Performance Testing

- **URS-AUD-GO-002** — **Reliable Message Processing**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Circuit breaker pattern, retry logic с exponential backoff, dead letter queue для failed messages, health checks.
  - Verification: OQ, SR

- **URS-AUD-GO-003** — **Dual Storage Architecture**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Primary storage в immudb для cryptographic verification, PostgreSQL replica для query performance, eventual consistency handling.
  - Verification: OQ, DR

- **URS-AUD-GO-004** — **Monitoring & Observability**

  - Priority: MUST | Risk: Medium
  - Acceptance:
    - Prometheus metrics (throughput, latency, errors), structured logging, distributed tracing integration.
  - Verification: OQ

## 3.22 Конфигурации и изменение системы (Change Control)

- **URS-CHG-001** — **Управление изменениями**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Любое изменение конфигураций/контрактов/схем требует тикета, оценки риска, одобрения QA, трассируемости в релизные заметки.
  - Verification: DR, SR

- **URS-CHG-002** — **Валидация релизов**
  - Priority: MUST | Risk: High
  - Acceptance:
    - Для High-risk компонентов — OQ/PQ регресс-наборы и подписи ответственных.
  - Verification: OQ, PQ, DR

## 3.23 Локализация и соответствие TZ

- **URS-LOC-001** — **Три языка (en/ru/th)**

  - Priority: SHOULD | Risk: Low
  - Acceptance:
    - Локализация статусов, отчетов, экранов; неизменяемые записи хранят оригинал + перевод.
  - Verification: PQ

- **URS-LOC-002** — **Часовые пояса**
  - Priority: MUST | Risk: Medium
  - Acceptance:
    - Все timestamps — ISO8601 + TZ; отображение в локальном TZ пользователя, хранение в UTC.
  - Verification: OQ

## 3.24 Юзабилити и доступность

- **URS-UX-001** — **Сканеры/бейджи/QR**

  - Priority: SHOULD | Risk: Medium
  - Acceptance:
    - Поддержка сканирования QR бейджей для ускорения операций; для подписи — дополнительно PIN/MFA.
  - Verification: OQ

- **URS-UX-002** — **A11y базовый**
  - Priority: NICE | Risk: Low
  - Acceptance:
    - Контрасты, фокус, навигация с клавиатуры для критичных операций.
  - Verification: DR

## 3.25 Юридические и хранение/удаление данных

- **URS-LGL-001** — **Retention и Legal Hold**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Retention политики по классам данных; legal hold блокирует любые удаления, включая системные.
  - Verification: OQ

- **URS-LGL-002** — **GDPR/PDPA совместимость (минимально)**
  - Priority: SHOULD | Risk: Medium
  - Acceptance:
    - Персональные данные — минимизация, маскирование в отчетах при необходимости; аудит доступа.
  - Verification: SR, DR

## 3.26 External Integrations и API

- **URS-API-001** — **External API Support**

  - Priority: MUST | Risk: Medium
  - Acceptance:
    - REST API для интеграции с tax systems, regulatory reporting, third-party analytics platforms.
  - Verification: OQ

- **URS-API-002** — **Webhooks и notifications**
  - Priority: SHOULD | Risk: Low
  - Acceptance:
    - Real-time notifications для external systems, configurable webhook endpoints, retry mechanisms.
  - Verification: OQ

## 3.27 Android Terminal Support

- **URS-AND-001** — **Offline capability**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Работа в offline режиме с последующей синхронизацией, local SQLite cache, conflict resolution.
  - Verification: OQ, PQ

- **URS-AND-002** — **SOP guided workflows**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Step-by-step SOP execution с фото/видео captures, digital signatures, automatic progress tracking.
  - Verification: OQ, PQ

- **URS-AND-003** — **Hardware integration**
  - Priority: MUST | Risk: Medium
  - Acceptance:
    - QR/NFC scanning, camera integration, barcode printing support, push notifications.
  - Verification: OQ

## 3.28 Электронные подписи и документооборот

- **URS-ES-001** — **PKI инфраструктура**

  - Priority: MUST | Risk: High
  - Acceptance:
    - Digital signatures для SOPs, batch records, analytical results. Certificate management, signature verification.
  - Verification: IQ, OQ

- **URS-ES-002** — **Document workflow**
  - Priority: MUST | Risk: High
  - Acceptance:
    - Электронный документооборот с approval chains, automatic routing, deadline tracking.
  - Verification: OQ, PQ

## 4. Constraints & Assumptions

- Все High-risk данные должны быть доступны при отказе одного DC.
- Любые операции массового обновления данных должны иметь dry-run и двойное подтверждение.
- Внеплановые изменения конфигураций в прод — запрещены без Change Control.

## 5. Acceptance of URS

Подтверждением данного URS является подписание ответственными лицами (электронные подписи по Part 11). После утверждения — документ является основой для FS/DS/RA и матрицы трассируемости.

## 6. Appendices

- Примеры подписываемых операций (неисчерпывающий список): создание/закрытие партии, изменение master data, подтверждение CoA, отклонения/CAPA, выпуск отчета Batch Record.
- Классификация операций по риску: прилагается в RA.
