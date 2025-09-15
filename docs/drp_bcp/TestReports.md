---
title: "DRP/BCP Test Reports Template"
module: "Business Continuity & Disaster Recovery"
version: "2.0"
status: "approved"
effective_date: "2024-01-15"
author: "Business Continuity Team & IT Operations"
approved_by: "CTO Alex Rodriguez & COO Michael Chen"
review_date: "2024-04-15"
next_review: "2024-07-15"
last_updated: "2025-09-15"
classification: "CONFIDENTIAL"
references:
  - "DISASTER_RECOVERY_PLAN.md"
  - "BUSINES_CONTINUITY_PLAN.md"
  - "TestScenarios.md"
  - "CONTRACT_SPECIFICATIONS.md#TestingSchema"
---

# Шаблоны отчетов DRP/BCP тестирования

## 1. Назначение и область применения

### 1.1 Назначение шаблонов

Данный документ содержит стандартизированные шаблоны для:

- **Документирования результатов** всех типов DRP/BCP тестов
- **Метрик производительности** и соответствия целевым показателям
- **Анализа эффективности** процедур восстановления
- **Выявления улучшений** и планирования корректирующих действий
- **Регулятивной отчетности** для GACP compliance
- **Трекинга прогресса** по итогам тестирования

### 1.2 Типы отчетов

| Тип отчета                         | Частота     | Аудитория         | Цель                       |
| ---------------------------------- | ----------- | ----------------- | -------------------------- |
| **Daily Health Check Report**      | Ежедневно   | IT Operations     | Мониторинг готовности      |
| **Weekly Failover Test Report**    | Еженедельно | Management        | Проверка базовых процедур  |
| **Monthly DR Drill Report**        | Ежемесячно  | Executive Team    | Комплексное тестирование   |
| **Quarterly Full Exercise Report** | Квартально  | Board, Regulators | Полная симуляция           |
| **Annual Compliance Report**       | Ежегодно    | Audit, Regulators | Соответствие требованиям   |
| **Incident Response Report**       | По событию  | All Stakeholders  | Анализ реальных инцидентов |

## 2. Ежедневные отчеты мониторинга

### 2.1 Daily DR Health Check Report

````markdown
# Daily DR Health Check Report

**Дата:** {DATE}
**Время выполнения:** {TIMESTAMP}
**Выполнил:** {OPERATOR_NAME}
**Продолжительность проверки:** {DURATION_MINUTES} минут

## Исполнительное резюме

### Общий статус DR готовности: {OVERALL_STATUS} ✅/⚠️/❌

**Критические показатели:**

- Database Replication Health: {DB_REPLICATION_STATUS}
- Backup Systems Status: {BACKUP_STATUS}
- Network Connectivity: {NETWORK_STATUS}
- Cloud Integration: {CLOUD_STATUS}

## Детальные проверки

### 2.1 Database Replication

- **Primary Database Status:** {PRIMARY_DB_STATUS}
- **Standby Database Status:** {STANDBY_DB_STATUS}
- **Replication Lag:** {REPLICATION_LAG_SECONDS} seconds (Target: <300s)
- **Last Successful Sync:** {LAST_SYNC_TIME}

**Validation Commands:**

```bash
# Проверка статуса репликации
kubectl exec postgresql-primary-0 -n database -- \
  psql -U postgres -c "SELECT client_addr, state, sent_lsn, write_lsn, flush_lsn, replay_lsn, sync_state FROM pg_stat_replication;"

# Проверка лага репликации
kubectl exec postgresql-standby-0 -n database -- \
  psql -U postgres -c "SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()));"
```
````

**Результаты:**

```
{REPLICATION_RESULTS}
```

### 2.2 Backup Systems

- **Backup Job Status:** {BACKUP_JOB_STATUS}
- **Last Backup Time:** {LAST_BACKUP_TIME}
- **Backup Size:** {BACKUP_SIZE_GB} GB
- **Backup Integrity Check:** {BACKUP_INTEGRITY_STATUS}

**Validation Commands:**

```bash
# Проверка статуса backup jobs
kubectl get cronjobs -n backup-system

# Проверка последнего backup
kubectl logs -l job-name=daily-backup --tail=50
```

**Результаты:**

```
{BACKUP_RESULTS}
```

### 2.3 Network Connectivity

- **Primary Site Connectivity:** {PRIMARY_CONNECTIVITY}
- **DR Site Connectivity:** {DR_CONNECTIVITY}
- **Cloud Connectivity (AWS):** {AWS_CONNECTIVITY}
- **Cloud Connectivity (Azure):** {AZURE_CONNECTIVITY}

**Validation Commands:**

```bash
# Проверка связи с DR site
ping -c 5 dr-site.company.internal

# Проверка облачных подключений
curl -s https://status.aws.amazon.com/
curl -s https://status.azure.com/
```

### 2.4 Application Health

- **ERP Core System:** {ERP_STATUS}
- **IoT Monitoring:** {IOT_STATUS}
- **Surveillance System:** {SURVEILLANCE_STATUS}
- **Reporting Services:** {REPORTING_STATUS}

## Обнаруженные проблемы

| Приоритет  | Система  | Проблема            | Действие          | Ответственный        | Срок       |
| ---------- | -------- | ------------------- | ----------------- | -------------------- | ---------- |
| {PRIORITY} | {SYSTEM} | {ISSUE_DESCRIPTION} | {ACTION_REQUIRED} | {RESPONSIBLE_PERSON} | {DUE_DATE} |

## Рекомендации на завтра

1. {RECOMMENDATION_1}
2. {RECOMMENDATION_2}
3. {RECOMMENDATION_3}

## Автоматически сгенерированные метрики

```json
{
  "timestamp": "{TIMESTAMP}",
  "overall_health_score": {HEALTH_SCORE},
  "rpo_compliance": {RPO_COMPLIANCE},
  "rto_readiness": {RTO_READINESS},
  "backup_coverage": {BACKUP_COVERAGE},
  "replication_health": {REPLICATION_HEALTH}
}
```

**Подпись:** {DIGITAL_SIGNATURE}

````

### 2.2 Автоматическая генерация ежедневного отчета

```bash
#!/bin/bash
# daily_dr_health_check.sh

REPORT_DATE=$(date +%Y-%m-%d)
REPORT_TIME=$(date +%H:%M:%S)
REPORT_FILE="/opt/gacp-erp/reports/dr/daily_health_${REPORT_DATE}.md"

echo "Generating Daily DR Health Check Report for $REPORT_DATE"

# Создание директории отчетов
mkdir -p "/opt/gacp-erp/reports/dr"

# Проверка репликации базы данных
echo "Checking database replication..."
DB_REPLICATION_LAG=$(kubectl exec postgresql-primary-0 -n database -- \
  psql -U postgres -t -c "SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()));" 2>/dev/null || echo "ERROR")

if [[ "$DB_REPLICATION_LAG" =~ ^[0-9]+$ ]] && [ "$DB_REPLICATION_LAG" -lt 300 ]; then
    DB_STATUS="✅ HEALTHY"
    DB_REPLICATION_STATUS="✅ GOOD"
else
    DB_STATUS="❌ UNHEALTHY"
    DB_REPLICATION_STATUS="❌ LAG_EXCEEDED"
fi

# Проверка backup систем
echo "Checking backup systems..."
LAST_BACKUP=$(kubectl get job -n backup-system -o jsonpath='{.items[?(@.status.succeeded==1)].metadata.name}' | tail -1)
if [ ! -z "$LAST_BACKUP" ]; then
    BACKUP_STATUS="✅ HEALTHY"
else
    BACKUP_STATUS="❌ NO_RECENT_BACKUP"
fi

# Проверка сетевого соединения
echo "Checking network connectivity..."
if ping -c 3 dr-site.company.internal >/dev/null 2>&1; then
    NETWORK_STATUS="✅ CONNECTED"
else
    NETWORK_STATUS="❌ DISCONNECTED"
fi

# Проверка облачных соединений
echo "Checking cloud connectivity..."
if curl -s --max-time 10 https://aws.amazon.com >/dev/null; then
    CLOUD_STATUS="✅ CONNECTED"
else
    CLOUD_STATUS="❌ DISCONNECTED"
fi

# Расчет общего health score
HEALTH_COMPONENTS=("$DB_STATUS" "$BACKUP_STATUS" "$NETWORK_STATUS" "$CLOUD_STATUS")
HEALTHY_COUNT=0
for component in "${HEALTH_COMPONENTS[@]}"; do
    if [[ $component == *"✅"* ]]; then
        ((HEALTHY_COUNT++))
    fi
done

HEALTH_SCORE=$((HEALTHY_COUNT * 100 / ${#HEALTH_COMPONENTS[@]}))

if [ $HEALTH_SCORE -ge 95 ]; then
    OVERALL_STATUS="✅ EXCELLENT"
elif [ $HEALTH_SCORE -ge 80 ]; then
    OVERALL_STATUS="⚠️ GOOD"
else
    OVERALL_STATUS="❌ NEEDS_ATTENTION"
fi

# Генерация отчета
cat > "$REPORT_FILE" << EOF
# Daily DR Health Check Report

**Дата:** $REPORT_DATE
**Время выполнения:** $REPORT_TIME
**Выполнил:** Automated System
**Продолжительность проверки:** 5 минут

## Исполнительное резюме

### Общий статус DR готовности: $OVERALL_STATUS

**Критические показатели:**
- Database Replication Health: $DB_REPLICATION_STATUS
- Backup Systems Status: $BACKUP_STATUS
- Network Connectivity: $NETWORK_STATUS
- Cloud Integration: $CLOUD_STATUS

## Детальные проверки

### Database Replication
- **Replication Lag:** $DB_REPLICATION_LAG seconds (Target: <300s)
- **Status:** $DB_STATUS

### Backup Systems
- **Last Backup:** $LAST_BACKUP
- **Status:** $BACKUP_STATUS

### Network Connectivity
- **DR Site:** $NETWORK_STATUS
- **Cloud Services:** $CLOUD_STATUS

## Автоматически сгенерированные метрики

\`\`\`json
{
  "timestamp": "$(date -Iseconds)",
  "overall_health_score": $HEALTH_SCORE,
  "replication_lag_seconds": $DB_REPLICATION_LAG,
  "components_healthy": $HEALTHY_COUNT,
  "total_components": ${#HEALTH_COMPONENTS[@]}
}
\`\`\`

EOF

echo "Daily DR Health Check Report generated: $REPORT_FILE"

# Отправка уведомления если есть проблемы
if [ $HEALTH_SCORE -lt 90 ]; then
    curl -X POST $SLACK_WEBHOOK_URL \
        -H 'Content-Type: application/json' \
        -d "{\"text\":\"⚠️ DR Health Score: $HEALTH_SCORE% - Review required: $REPORT_FILE\"}"
fi
````

## 3. Еженедельные отчеты тестирования

### 3.1 Weekly Failover Test Report

```markdown
# Weekly Failover Test Report

**Неделя:** {WEEK_START_DATE} - {WEEK_END_DATE}
**Тест проведен:** {TEST_DATE} в {TEST_TIME}
**Тип теста:** {TEST_TYPE} (Database Failover, Application Failover, etc.)
**Тест-лидер:** {TEST_LEADER_NAME}
**Участники:** {PARTICIPANTS_LIST}

## Исполнительное резюме

### Результат теста: {TEST_RESULT} ✅/❌

**Ключевые метрики:**

- **RTO Цель:** {RTO_TARGET} минут
- **RTO Фактический:** {RTO_ACTUAL} минут
- **Соответствие RTO:** {RTO_COMPLIANCE}
- **RPO Соответствие:** {RPO_COMPLIANCE}
- **Успешность процедур:** {SUCCESS_RATE}%

## Детали тестирования

### 3.1 Тестируемый сценарий

**Сценарий:** {SCENARIO_NAME}
**Описание:** {SCENARIO_DESCRIPTION}
**Ожидаемый результат:** {EXPECTED_OUTCOME}

### 3.2 Хронология событий

| Время    | Событие   | Система    | Статус     | Комментарии  |
| -------- | --------- | ---------- | ---------- | ------------ |
| {TIME_1} | {EVENT_1} | {SYSTEM_1} | {STATUS_1} | {COMMENTS_1} |
| {TIME_2} | {EVENT_2} | {SYSTEM_2} | {STATUS_2} | {COMMENTS_2} |

### 3.3 Процедуры выполнения

#### Шаг 1: Подготовка

- [x] Уведомление команды
- [x] Резервирование ресурсов
- [x] Проверка baseline состояния

#### Шаг 2: Выполнение failover

- [x] Инициация процедуры
- [x] Мониторинг переключения
- [x] Верификация состояния

#### Шаг 3: Валидация

- [x] Проверка функциональности
- [x] Тестирование приложений
- [x] Проверка целостности данных

#### Шаг 4: Восстановление

- [x] Возврат к primary
- [x] Синхронизация данных
- [x] Финальная проверка

## Результаты по системам

### Database Failover

- **Primary → Standby переключение:** {DB_FAILOVER_TIME} секунд
- **Потеря данных:** {DATA_LOSS_AMOUNT}
- **Подключение приложений:** {APP_RECONNECT_TIME} секунд
- **Статус:** {DB_FAILOVER_STATUS}

### Application Recovery

- **ERP Core восстановление:** {ERP_RECOVERY_TIME} минут
- **IoT Service восстановление:** {IOT_RECOVERY_TIME} минут
- **Reporting восстановление:** {REPORTING_RECOVERY_TIME} минут

### Network & Infrastructure

- **DNS переключение:** {DNS_SWITCH_TIME} секунд
- **Load Balancer update:** {LB_UPDATE_TIME} секунд
- **Storage accessibility:** {STORAGE_ACCESS_STATUS}

## Функциональное тестирование

### Критические функции

- [ ] Создание новых растений: {PLANT_CREATION_TEST}
- [ ] Обновление данных IoT: {IOT_UPDATE_TEST}
- [ ] Генерация отчетов: {REPORT_GENERATION_TEST}
- [ ] Электронные подписи: {ESIGN_TEST}
- [ ] Audit trail запись: {AUDIT_TRAIL_TEST}

### Интеграции

- [ ] Mayan EDMS доступность: {MAYAN_INTEGRATION_TEST}
- [ ] Kafka event processing: {KAFKA_INTEGRATION_TEST}
- [ ] External API calls: {API_INTEGRATION_TEST}

## Производительность

### Baseline vs. После failover

| Метрика            | Baseline              | После Failover        | Отклонение            |
| ------------------ | --------------------- | --------------------- | --------------------- |
| Response Time (ms) | {BASELINE_RESPONSE}   | {FAILOVER_RESPONSE}   | {RESPONSE_VARIANCE}   |
| Throughput (req/s) | {BASELINE_THROUGHPUT} | {FAILOVER_THROUGHPUT} | {THROUGHPUT_VARIANCE} |
| Error Rate (%)     | {BASELINE_ERROR_RATE} | {FAILOVER_ERROR_RATE} | {ERROR_RATE_VARIANCE} |

## Обнаруженные проблемы

### Критические проблемы

1. **{CRITICAL_ISSUE_1}**
   - Описание: {ISSUE_DESCRIPTION_1}
   - Воздействие: {ISSUE_IMPACT_1}
   - Временное решение: {WORKAROUND_1}
   - Постоянное решение: {PERMANENT_FIX_1}
   - Ответственный: {RESPONSIBLE_1}
   - Срок устранения: {FIX_DEADLINE_1}

### Некритические проблемы

1. **{MINOR_ISSUE_1}**
   - Описание: {MINOR_DESCRIPTION_1}
   - Рекомендация: {MINOR_RECOMMENDATION_1}

## Действия по улучшению

### Немедленные действия (в течение недели)

1. {IMMEDIATE_ACTION_1}
2. {IMMEDIATE_ACTION_2}

### Краткосрочные действия (1-4 недели)

1. {SHORT_TERM_ACTION_1}
2. {SHORT_TERM_ACTION_2}

### Долгосрочные инициативы (1-6 месяцев)

1. {LONG_TERM_INITIATIVE_1}
2. {LONG_TERM_INITIATIVE_2}

## Соответствие целевым показателям

### RTO/RPO Compliance

- **Database RTO:** {DB_RTO_ACTUAL} из {DB_RTO_TARGET} минут - {DB_RTO_COMPLIANCE}
- **Application RTO:** {APP_RTO_ACTUAL} из {APP_RTO_TARGET} минут - {APP_RTO_COMPLIANCE}
- **RPO Achievement:** {RPO_ACTUAL} из {RPO_TARGET} минут - {RPO_COMPLIANCE}

### GACP Compliance

- **Data Integrity:** {DATA_INTEGRITY_STATUS}
- **Audit Trail Continuity:** {AUDIT_TRAIL_CONTINUITY}
- **Traceability Maintained:** {TRACEABILITY_STATUS}
- **Security Controls:** {SECURITY_CONTROLS_STATUS}

## Уроки изучения

### Что сработало хорошо

1. {LESSON_POSITIVE_1}
2. {LESSON_POSITIVE_2}

### Что требует улучшения

1. {LESSON_IMPROVEMENT_1}
2. {LESSON_IMPROVEMENT_2}

## Подписи и утверждения

**Подготовил:** {TEST_LEADER_NAME}, {TEST_LEADER_TITLE}
**Дата:** {REPORT_DATE}
**Цифровая подпись:** {DIGITAL_SIGNATURE}

**Рассмотрел:** {REVIEWER_NAME}, {REVIEWER_TITLE}  
**Дата рассмотрения:** {REVIEW_DATE}
**Подпись:** {REVIEWER_SIGNATURE}

**Утвердил:** {APPROVER_NAME}, {APPROVER_TITLE}
**Дата утверждения:** {APPROVAL_DATE}  
**Подпись:** {APPROVER_SIGNATURE}
```

## 4. Ежемесячные комплексные отчеты

### 4.1 Monthly Comprehensive DR Exercise Report

```markdown
# Monthly Comprehensive DR Exercise Report

**Отчетный месяц:** {MONTH_YEAR}
**Дата проведения:** {EXERCISE_DATE}
**Продолжительность:** {EXERCISE_DURATION} часов
**Руководитель учений:** {EXERCISE_DIRECTOR}
**Количество участников:** {PARTICIPANTS_COUNT}

## Исполнительное резюме для руководства

### Общая оценка готовности: {OVERALL_READINESS_SCORE}/100

**Ключевые достижения:**

- RTO соответствие: {RTO_COMPLIANCE_RATE}%
- RPO соответствие: {RPO_COMPLIANCE_RATE}%
- Успешность процедур: {PROCEDURE_SUCCESS_RATE}%
- Готовность персонала: {STAFF_READINESS_SCORE}%

**Финансовое воздействие симуляции:**

- Предотвращенные потери: ${PREVENTED_LOSSES}
- Стоимость восстановления: ${RECOVERY_COST}
- ROI на DR инвестиции: {DR_ROI}%

## Описание учений

### Сценарий

**Название:** {SCENARIO_NAME}
**Тип:** {SCENARIO_TYPE} (Full Site Failure, Partial Outage, etc.)
**Продолжительность симуляции:** {SIMULATION_DURATION}
**Область воздействия:** {IMPACT_SCOPE}

**Сценарий события:**
{DETAILED_SCENARIO_DESCRIPTION}

### Участники

#### Команда управления кризисом

| Роль               | Участник  | Оценка работы    | Комментарии   |
| ------------------ | --------- | ---------------- | ------------- |
| Incident Commander | {IC_NAME} | {IC_PERFORMANCE} | {IC_COMMENTS} |
| Technical Lead     | {TL_NAME} | {TL_PERFORMANCE} | {TL_COMMENTS} |
| Business Liaison   | {BL_NAME} | {BL_PERFORMANCE} | {BL_COMMENTS} |

#### Функциональные команды

- **IT Operations:** {IT_TEAM_MEMBERS}
- **Production Team:** {PRODUCTION_TEAM_MEMBERS}
- **Communications:** {COMMS_TEAM_MEMBERS}
- **External Vendors:** {VENDOR_PARTICIPANTS}

## Детальная хронология

### Фаза 1: Обнаружение и уведомление (0-15 минут)

| Время                 | Событие            | Ответственный     | Результат             | Целевое время |
| --------------------- | ------------------ | ----------------- | --------------------- | ------------- |
| T+0                   | Симуляция начата   | Exercise Director | Initiated             | N/A           |
| T+{DETECTION_TIME}    | Инцидент обнаружен | Monitoring System | {DETECTION_RESULT}    | T+5           |
| T+{NOTIFICATION_TIME} | Команда уведомлена | Automated Alert   | {NOTIFICATION_RESULT} | T+10          |

### Фаза 2: Оценка и активация (15-30 минут)

| Время               | Событие                   | Ответственный      | Результат           | Целевое время |
| ------------------- | ------------------------- | ------------------ | ------------------- | ------------- |
| T+{ASSESSMENT_TIME} | Ситуация оценена          | Incident Commander | {ASSESSMENT_RESULT} | T+20          |
| T+{ACTIVATION_TIME} | DR процедуры активированы | Technical Lead     | {ACTIVATION_RESULT} | T+25          |

### Фаза 3: Восстановление систем (30-120 минут)

| Время                   | Событие                    | Ответственный | Результат        | Целевое время |
| ----------------------- | -------------------------- | ------------- | ---------------- | ------------- |
| T+{DB_FAILOVER_TIME}    | Database failover          | DBA Team      | {DB_RESULT}      | T+45          |
| T+{APP_RECOVERY_TIME}   | Applications восстановлены | DevOps Team   | {APP_RESULT}     | T+60          |
| T+{NETWORK_SWITCH_TIME} | Network перенаправлен      | Network Team  | {NETWORK_RESULT} | T+75          |

### Фаза 4: Валидация и возврат к норме (120+ минут)

| Время                  | Событие                    | Ответственный  | Результат              |
| ---------------------- | -------------------------- | -------------- | ---------------------- |
| T+{VALIDATION_TIME}    | Функциональность проверена | QA Team        | {VALIDATION_RESULT}    |
| T+{COMMUNICATION_TIME} | Stakeholders уведомлены    | Communications | {COMMS_RESULT}         |
| T+{RECOVERY_TIME}      | Полное восстановление      | All Teams      | {FULL_RECOVERY_RESULT} |

## Анализ производительности по системам

### Core ERP System

- **Целевое RTO:** 30 минут
- **Фактическое RTO:** {ERP_ACTUAL_RTO} минут
- **Соответствие:** {ERP_RTO_COMPLIANCE}
- **Функциональность после восстановления:** {ERP_FUNCTIONALITY}%
- **Производительность:** {ERP_PERFORMANCE}% от baseline

### Database Systems

- **Целевое RTO:** 15 минут
- **Фактическое RTO:** {DB_ACTUAL_RTO} минут
- **RPO Achievement:** {DB_RPO_ACTUAL} минут (Цель: ≤15 мин)
- **Data Integrity Check:** {DB_INTEGRITY_STATUS}
- **Replication Recovery:** {DB_REPLICATION_RECOVERY_TIME} минут

### IoT & Monitoring Systems

- **Целевое RTO:** 45 минут
- **Фактическое RTO:** {IOT_ACTUAL_RTO} минут
- **Sensor Connectivity:** {IOT_SENSOR_CONNECTIVITY}%
- **Data Collection Recovery:** {IOT_DATA_RECOVERY_TIME} минут
- **Alert Systems:** {IOT_ALERTS_STATUS}

### Security & Surveillance

- **Video System Recovery:** {VIDEO_RECOVERY_TIME} минут
- **Access Control Recovery:** {ACCESS_CONTROL_RECOVERY_TIME} минут
- **Security Monitoring:** {SECURITY_MONITORING_STATUS}
- **Compliance Recording:** {COMPLIANCE_RECORDING_STATUS}

## Коммуникационная эффективность

### Внутренние коммуникации

- **Первичное уведомление команды:** {INTERNAL_NOTIFICATION_TIME} минут
- **Статусные обновления:** Каждые {UPDATE_FREQUENCY} минут
- **Информированность персонала:** {STAFF_AWARENESS_SCORE}%

### Внешние коммуникации

- **Клиентские уведомления:** {CUSTOMER_NOTIFICATION_TIME} минут
- **Регулятивные уведомления:** {REGULATORY_NOTIFICATION_TIME} часов
- **Медиа-коммуникации:** {MEDIA_COMMUNICATION_STATUS}
- **Партнерские уведомления:** {PARTNER_NOTIFICATION_STATUS}

## Финансовый анализ симуляции

### Прямые затраты на восстановление

| Категория               | Планируемые затраты       | Фактические затраты      | Отклонение                 |
| ----------------------- | ------------------------- | ------------------------ | -------------------------- |
| Персонал (сверхурочные) | ${PLANNED_STAFF_COST}     | ${ACTUAL_STAFF_COST}     | ${STAFF_COST_VARIANCE}     |
| Cloud ресурсы           | ${PLANNED_CLOUD_COST}     | ${ACTUAL_CLOUD_COST}     | ${CLOUD_COST_VARIANCE}     |
| Внешние услуги          | ${PLANNED_VENDOR_COST}    | ${ACTUAL_VENDOR_COST}    | ${VENDOR_COST_VARIANCE}    |
| **Итого**               | **${TOTAL_PLANNED_COST}** | **${TOTAL_ACTUAL_COST}** | **${TOTAL_COST_VARIANCE}** |

### Предотвращенные потери

- **Потери от простоя:** ${DOWNTIME_LOSSES_PREVENTED}
- **Регулятивные штрафы:** ${REGULATORY_FINES_PREVENTED}
- **Репутационный ущерб:** ${REPUTATION_DAMAGE_PREVENTED}
- **Потеря клиентов:** ${CUSTOMER_LOSS_PREVENTED}

### ROI Калькуляция

- **Инвестиции в DR (годовые):** ${ANNUAL_DR_INVESTMENT}
- **Предотвращенные потери:** ${TOTAL_LOSSES_PREVENTED}
- **ROI:** {DR_ROI_PERCENTAGE}%

## Соответствие регулятивным требованиям

### GACP Compliance Assessment

| Требование                 | Статус                         | Доказательства        | Комментарии           |
| -------------------------- | ------------------------------ | --------------------- | --------------------- |
| Непрерывность производства | {PRODUCTION_CONTINUITY_STATUS} | {PRODUCTION_EVIDENCE} | {PRODUCTION_COMMENTS} |
| Целостность данных         | {DATA_INTEGRITY_STATUS}        | {DATA_EVIDENCE}       | {DATA_COMMENTS}       |
| Прослеживаемость           | {TRACEABILITY_STATUS}          | {TRACE_EVIDENCE}      | {TRACE_COMMENTS}      |
| Документирование           | {DOCUMENTATION_STATUS}         | {DOC_EVIDENCE}        | {DOC_COMMENTS}        |

### 21 CFR Part 11 Compliance

- **Electronic Records:** {ELECTRONIC_RECORDS_STATUS}
- **Electronic Signatures:** {ELECTRONIC_SIGNATURES_STATUS}
- **Audit Trail Integrity:** {AUDIT_TRAIL_STATUS}
- **System Access Controls:** {ACCESS_CONTROLS_STATUS}

### ISO 22301 Business Continuity

- **PDCA Implementation:** {PDCA_STATUS}
- **Risk Assessment:** {RISK_ASSESSMENT_STATUS}
- **Business Impact Analysis:** {BIA_STATUS}
- **Continuous Improvement:** {IMPROVEMENT_STATUS}

## Детальный анализ проблем

### Критические проблемы (Priority 1)

1. **{CRITICAL_ISSUE_1_TITLE}**
   - **Описание:** {CRITICAL_ISSUE_1_DESC}
   - **Корневая причина:** {CRITICAL_ISSUE_1_ROOT_CAUSE}
   - **Воздействие на RTO/RPO:** {CRITICAL_ISSUE_1_IMPACT}
   - **Временное решение:** {CRITICAL_ISSUE_1_WORKAROUND}
   - **Постоянное решение:** {CRITICAL_ISSUE_1_PERMANENT_FIX}
   - **Ответственный:** {CRITICAL_ISSUE_1_OWNER}
   - **Срок устранения:** {CRITICAL_ISSUE_1_DEADLINE}
   - **Стоимость исправления:** ${CRITICAL_ISSUE_1_COST}

### Значительные проблемы (Priority 2)

1. **{MAJOR_ISSUE_1_TITLE}**
   - **Описание:** {MAJOR_ISSUE_1_DESC}
   - **Воздействие:** {MAJOR_ISSUE_1_IMPACT}
   - **Рекомендуемые действия:** {MAJOR_ISSUE_1_ACTIONS}

### Возможности для улучшения

1. **{IMPROVEMENT_OPP_1_TITLE}**
   - **Текущее состояние:** {IMPROVEMENT_OPP_1_CURRENT}
   - **Желаемое состояние:** {IMPROVEMENT_OPP_1_DESIRED}
   - **Бенефиты:** {IMPROVEMENT_OPP_1_BENEFITS}
   - **Инвестиции:** ${IMPROVEMENT_OPP_1_INVESTMENT}

## План корректирующих действий

### Немедленные действия (1-2 недели)

| Действие             | Ответственный       | Срок                   | Стоимость           | Приоритет              |
| -------------------- | ------------------- | ---------------------- | ------------------- | ---------------------- |
| {IMMEDIATE_ACTION_1} | {IMMEDIATE_OWNER_1} | {IMMEDIATE_DEADLINE_1} | ${IMMEDIATE_COST_1} | {IMMEDIATE_PRIORITY_1} |

### Краткосрочные действия (1-3 месяца)

| Действие              | Ответственный        | Срок                    | Стоимость            | Приоритет               |
| --------------------- | -------------------- | ----------------------- | -------------------- | ----------------------- |
| {SHORT_TERM_ACTION_1} | {SHORT_TERM_OWNER_1} | {SHORT_TERM_DEADLINE_1} | ${SHORT_TERM_COST_1} | {SHORT_TERM_PRIORITY_1} |

### Долгосрочные инициативы (3-12 месяцев)

| Инициатива               | Ответственный       | Срок                   | Бюджет                | Ожидаемый ROI     |
| ------------------------ | ------------------- | ---------------------- | --------------------- | ----------------- |
| {LONG_TERM_INITIATIVE_1} | {LONG_TERM_OWNER_1} | {LONG_TERM_DEADLINE_1} | ${LONG_TERM_BUDGET_1} | {LONG_TERM_ROI_1} |

## Извлеченные уроки

### Успехи и лучшие практики

1. **{SUCCESS_1_TITLE}**
   - **Что сработало:** {SUCCESS_1_DESCRIPTION}
   - **Почему это важно:** {SUCCESS_1_IMPORTANCE}
   - **Как воспроизвести:** {SUCCESS_1_REPLICATION}

### Области для улучшения

1. **{LESSON_1_TITLE}**
   - **Что не сработало:** {LESSON_1_DESCRIPTION}
   - **Воздействие:** {LESSON_1_IMPACT}
   - **Как исправить:** {LESSON_1_SOLUTION}

### Обновления процедур

1. **{PROCEDURE_UPDATE_1}**
   - **Текущая процедура:** {CURRENT_PROCEDURE_1}
   - **Предлагаемое изменение:** {PROPOSED_CHANGE_1}
   - **Обоснование:** {CHANGE_JUSTIFICATION_1}

## Планы на следующий месяц

### Приоритетные улучшения

1. {NEXT_MONTH_PRIORITY_1}
2. {NEXT_MONTH_PRIORITY_2}

### Планируемые тесты

1. **{NEXT_TEST_1}:** {NEXT_TEST_1_DATE}
2. **{NEXT_TEST_2}:** {NEXT_TEST_2_DATE}

### Тренинги персонала

1. **{TRAINING_1}:** {TRAINING_1_DATE} для {TRAINING_1_AUDIENCE}
2. **{TRAINING_2}:** {TRAINING_2_DATE} для {TRAINING_2_AUDIENCE}

## Подписи и утверждения

### Подготовка отчета

**Руководитель учений:** {EXERCISE_DIRECTOR_NAME}
**Дата подготовки:** {REPORT_PREPARATION_DATE}
**Подпись:** {EXERCISE_DIRECTOR_SIGNATURE}

**Аналитик:** {ANALYST_NAME}  
**Дата анализа:** {ANALYSIS_DATE}
**Подпись:** {ANALYST_SIGNATURE}

### Рассмотрение и утверждение

**Рассмотрел:** {REVIEWER_NAME}, {REVIEWER_TITLE}
**Дата рассмотрения:** {REVIEW_DATE}
**Подпись:** {REVIEWER_SIGNATURE}

**Утвердил:** {APPROVER_NAME}, {APPROVER_TITLE}
**Дата утверждения:** {APPROVAL_DATE}
**Подпись:** {APPROVER_SIGNATURE}

### Цифровые подписи (21 CFR Part 11)

**Hash отчета:** {REPORT_HASH}
**Цифровая подпись:** {DIGITAL_SIGNATURE}
**Timestamp:** {DIGITAL_TIMESTAMP}
```

## 5. Ежегодные отчеты соответствия

### 5.1 Annual DR/BCP Compliance Report

```markdown
# Annual DR/BCP Compliance Report

**Отчетный год:** {REPORT_YEAR}
**Подготовлен:** {PREPARATION_DATE}
**Версия:** {REPORT_VERSION}
**Классификация:** CONFIDENTIAL

## Исполнительное резюме

### Общая оценка соответствия: {OVERALL_COMPLIANCE_SCORE}%

**Ключевые достижения года:**

- Проведено {TOTAL_TESTS_CONDUCTED} DR/BCP тестов
- Среднее RTO: {AVERAGE_RTO} минут (Цель: 60 минут)
- Среднее RPO: {AVERAGE_RPO} минут (Цель: 15 минут)
- Успешность тестов: {TEST_SUCCESS_RATE}%
- Соответствие GACP: {GACP_COMPLIANCE_RATE}%

**Инвестиции и ROI:**

- Общие инвестиции в DR/BCP: ${TOTAL_DRBCP_INVESTMENT}
- Предотвращенные потери: ${TOTAL_PREVENTED_LOSSES}
- ROI: {ANNUAL_ROI}%

## Регулятивное соответствие

### WHO GACP Guidelines

| Требование                         | Статус            | Доказательства      | Последний аудит       |
| ---------------------------------- | ----------------- | ------------------- | --------------------- |
| 9.1 Business Continuity Management | {GACP_9_1_STATUS} | {GACP_9_1_EVIDENCE} | {GACP_9_1_AUDIT_DATE} |
| 9.2 Disaster Recovery Procedures   | {GACP_9_2_STATUS} | {GACP_9_2_EVIDENCE} | {GACP_9_2_AUDIT_DATE} |
| 9.3 Data Backup and Recovery       | {GACP_9_3_STATUS} | {GACP_9_3_EVIDENCE} | {GACP_9_3_AUDIT_DATE} |

### 21 CFR Part 11 Electronic Records

- **11.10(a) System Validation:** {CFR_11_10_A_STATUS}
- **11.10(c) Protection of Records:** {CFR_11_10_C_STATUS}
- **11.10(e) System Documentation:** {CFR_11_10_E_STATUS}

### ISO 22301:2019 Business Continuity

- **4. Context of Organization:** {ISO_22301_4_STATUS}
- **8. Operation:** {ISO_22301_8_STATUS}
- **9. Performance Evaluation:** {ISO_22301_9_STATUS}
- **10. Improvement:** {ISO_22301_10_STATUS}

## Годовая статистика тестирования

### Проведенные тесты по типам

| Тип теста                  | Запланировано | Проведено             | Успешно                | Успешность                |
| -------------------------- | ------------- | --------------------- | ---------------------- | ------------------------- |
| Daily Health Checks        | 365           | {DAILY_CONDUCTED}     | {DAILY_SUCCESSFUL}     | {DAILY_SUCCESS_RATE}%     |
| Weekly Failover Tests      | 52            | {WEEKLY_CONDUCTED}    | {WEEKLY_SUCCESSFUL}    | {WEEKLY_SUCCESS_RATE}%    |
| Monthly DR Exercises       | 12            | {MONTHLY_CONDUCTED}   | {MONTHLY_SUCCESSFUL}   | {MONTHLY_SUCCESS_RATE}%   |
| Quarterly Full Simulations | 4             | {QUARTERLY_CONDUCTED} | {QUARTERLY_SUCCESSFUL} | {QUARTERLY_SUCCESS_RATE}% |
| **Итого**                  | **433**       | **{TOTAL_CONDUCTED}** | **{TOTAL_SUCCESSFUL}** | **{TOTAL_SUCCESS_RATE}%** |

### Тренды RTO/RPO по месяцам
```

| Месяц   | RTO (мин) | RPO (мин) | Соответствие     |
| ------- | --------- | --------- | ---------------- |
| Январь  | {JAN_RTO} | {JAN_RPO} | {JAN_COMPLIANCE} |
| Февраль | {FEB_RTO} | {FEB_RPO} | {FEB_COMPLIANCE} |

...
Декабрь | {DEC_RTO} | {DEC_RPO} | {DEC_COMPLIANCE}

```

## Инциденты и реальные активации

### Реальные DR активации
1. **{REAL_INCIDENT_1_DATE}:** {REAL_INCIDENT_1_DESCRIPTION}
   - **Причина:** {REAL_INCIDENT_1_CAUSE}
   - **Продолжительность:** {REAL_INCIDENT_1_DURATION}
   - **Воздействие:** {REAL_INCIDENT_1_IMPACT}
   - **Уроки:** {REAL_INCIDENT_1_LESSONS}

### Значительные инциденты без DR активации
1. **{INCIDENT_1_DATE}:** {INCIDENT_1_DESCRIPTION}
   - **Как предотвращен DR:** {INCIDENT_1_PREVENTION}
   - **Улучшения:** {INCIDENT_1_IMPROVEMENTS}

## Финансовый анализ

### Инвестиции в DR/BCP инфраструктуру
| Категория | Бюджет | Фактические затраты | Отклонение |
|-----------|--------|-------------------|------------|
| Hardware/Infrastructure | ${HARDWARE_BUDGET} | ${HARDWARE_ACTUAL} | ${HARDWARE_VARIANCE} |
| Software Licenses | ${SOFTWARE_BUDGET} | ${SOFTWARE_ACTUAL} | ${SOFTWARE_VARIANCE} |
| Cloud Services | ${CLOUD_BUDGET} | ${CLOUD_ACTUAL} | ${CLOUD_VARIANCE} |
| Personnel Training | ${TRAINING_BUDGET} | ${TRAINING_ACTUAL} | ${TRAINING_VARIANCE} |
| External Services | ${EXTERNAL_BUDGET} | ${EXTERNAL_ACTUAL} | ${EXTERNAL_VARIANCE} |
| **Итого** | **${TOTAL_BUDGET}** | **${TOTAL_ACTUAL}** | **${TOTAL_VARIANCE}** |

### Предотвращенные потери
| Тип потерь | Оценочная стоимость | Количество предотвращений | Сэкономлено |
|------------|-------------------|---------------------------|-------------|
| Простой производства | ${PRODUCTION_DOWNTIME_COST}/час | {PRODUCTION_INCIDENTS} | ${PRODUCTION_SAVINGS} |
| Потеря данных | ${DATA_LOSS_COST}/ГБ | {DATA_INCIDENTS} | ${DATA_SAVINGS} |
| Регулятивные штрафы | ${REGULATORY_FINE_COST} | {REGULATORY_INCIDENTS} | ${REGULATORY_SAVINGS} |
| Репутационный ущерб | ${REPUTATION_COST} | {REPUTATION_INCIDENTS} | ${REPUTATION_SAVINGS} |

## Улучшения и достижения

### Реализованные улучшения
1. **{IMPROVEMENT_1_TITLE}** (Завершено: {IMPROVEMENT_1_DATE})
   - **Инвестиции:** ${IMPROVEMENT_1_COST}
   - **Бенефиты:** {IMPROVEMENT_1_BENEFITS}
   - **ROI:** {IMPROVEMENT_1_ROI}%

### Технологические обновления
1. **{TECH_UPDATE_1}:** {TECH_UPDATE_1_DESCRIPTION}
   - **Воздействие на RTO:** {TECH_UPDATE_1_RTO_IMPACT}
   - **Воздействие на RPO:** {TECH_UPDATE_1_RPO_IMPACT}

### Процедурные улучшения
1. **{PROCEDURE_IMPROVEMENT_1}:** {PROCEDURE_IMPROVEMENT_1_DESCRIPTION}
   - **Результат:** {PROCEDURE_IMPROVEMENT_1_RESULT}

## Обучение и готовность персонала

### Статистика обучения
| Программа обучения | Участники | Завершили | Сертифицированы | Успешность |
|-------------------|-----------|-----------|-----------------|------------|
| DR Basic Training | {DR_BASIC_PARTICIPANTS} | {DR_BASIC_COMPLETED} | {DR_BASIC_CERTIFIED} | {DR_BASIC_SUCCESS_RATE}% |
| Crisis Management | {CRISIS_PARTICIPANTS} | {CRISIS_COMPLETED} | {CRISIS_CERTIFIED} | {CRISIS_SUCCESS_RATE}% |
| Technical Recovery | {TECH_PARTICIPANTS} | {TECH_COMPLETED} | {TECH_CERTIFIED} | {TECH_SUCCESS_RATE}% |

### Компетенции команды DR
- **Incident Commanders:** {IC_TRAINED_COUNT} обучено из {IC_REQUIRED_COUNT} требуемых
- **Technical Leads:** {TL_TRAINED_COUNT} обучено из {TL_REQUIRED_COUNT} требуемых
- **Communication Leads:** {CL_TRAINED_COUNT} обучено из {CL_REQUIRED_COUNT} требуемых

## Внешние аудиты и проверки

### Регулятивные инспекции
1. **{REGULATORY_AUDIT_1_DATE}:** {REGULATORY_AUDIT_1_AUTHORITY}
   - **Фокус:** {REGULATORY_AUDIT_1_FOCUS}
   - **Результат:** {REGULATORY_AUDIT_1_RESULT}
   - **Корректирующие действия:** {REGULATORY_AUDIT_1_ACTIONS}

### Независимые аудиты
1. **{INDEPENDENT_AUDIT_1_DATE}:** {INDEPENDENT_AUDIT_1_FIRM}
   - **Область:** {INDEPENDENT_AUDIT_1_SCOPE}
   - **Оценка:** {INDEPENDENT_AUDIT_1_RATING}
   - **Рекомендации:** {INDEPENDENT_AUDIT_1_RECOMMENDATIONS}

## Планы на следующий год

### Стратегические инициативы
1. **{STRATEGIC_INITIATIVE_1}**
   - **Цель:** {STRATEGIC_GOAL_1}
   - **Бюджет:** ${STRATEGIC_BUDGET_1}
   - **Ожидаемые результаты:** {STRATEGIC_OUTCOMES_1}

### Целевые показатели
- **RTO цель:** {NEXT_YEAR_RTO_TARGET} минут (улучшение на {RTO_IMPROVEMENT}%)
- **RPO цель:** {NEXT_YEAR_RPO_TARGET} минут (улучшение на {RPO_IMPROVEMENT}%)
- **Соответствие цель:** {NEXT_YEAR_COMPLIANCE_TARGET}%

### Запланированные инвестиции
| Категория | Бюджет | Ожидаемый ROI | Приоритет |
|-----------|--------|---------------|-----------|
| Cloud Migration Phase 2 | ${CLOUD_MIGRATION_BUDGET} | {CLOUD_MIGRATION_ROI}% | HIGH |
| Automation Enhancement | ${AUTOMATION_BUDGET} | {AUTOMATION_ROI}% | HIGH |
| Staff Augmentation | ${STAFF_BUDGET} | {STAFF_ROI}% | MEDIUM |

## Заключение и рекомендации

### Ключевые выводы
1. {KEY_CONCLUSION_1}
2. {KEY_CONCLUSION_2}
3. {KEY_CONCLUSION_3}

### Рекомендации руководству
1. **{MANAGEMENT_RECOMMENDATION_1}**
   - **Обоснование:** {RECOMMENDATION_1_JUSTIFICATION}
   - **Инвестиции:** ${RECOMMENDATION_1_INVESTMENT}
   - **Ожидаемые бенефиты:** {RECOMMENDATION_1_BENEFITS}

### Следующие шаги
1. {NEXT_STEP_1} (Срок: {NEXT_STEP_1_DEADLINE})
2. {NEXT_STEP_2} (Срок: {NEXT_STEP_2_DEADLINE})

## Подписи и утверждения

**Подготовил:** {PREPARER_NAME}, {PREPARER_TITLE}
**Дата:** {PREPARATION_DATE}
**Подпись:** {PREPARER_SIGNATURE}

**Рассмотрел:** {REVIEWER_NAME}, {REVIEWER_TITLE}
**Дата:** {REVIEW_DATE}
**Подпись:** {REVIEWER_SIGNATURE}

**Утвердил:** {APPROVER_NAME}, {APPROVER_TITLE}
**Дата:** {APPROVAL_DATE}
**Подпись:** {APPROVER_SIGNATURE}

### Регулятивное подтверждение
**Compliance Officer:** {COMPLIANCE_OFFICER_NAME}
**Дата подтверждения:** {COMPLIANCE_DATE}
**Подпись:** {COMPLIANCE_SIGNATURE}

---

**Конец отчета**
**Документ содержит конфиденциальную информацию**
```

## 6. Автоматизированная генерация отчетов

### 6.1 Скрипт генерации отчетов

```bash
#!/bin/bash
# generate_dr_reports.sh

set -e

REPORT_TYPE=$1
REPORT_DATE=${2:-$(date +%Y-%m-%d)}
REPORT_DIR="/opt/gacp-erp/reports/dr"
TEMPLATE_DIR="/opt/gacp-erp/templates/dr"

# Создание директорий
mkdir -p "$REPORT_DIR/daily" "$REPORT_DIR/weekly" "$REPORT_DIR/monthly" "$REPORT_DIR/annual"

case $REPORT_TYPE in
    "daily")
        generate_daily_report "$REPORT_DATE"
        ;;
    "weekly")
        generate_weekly_report "$REPORT_DATE"
        ;;
    "monthly")
        generate_monthly_report "$REPORT_DATE"
        ;;
    "annual")
        generate_annual_report "$REPORT_DATE"
        ;;
    "incident")
        generate_incident_report "$REPORT_DATE" "$3"
        ;;
    *)
        echo "Usage: $0 {daily|weekly|monthly|annual|incident} [date] [incident_id]"
        exit 1
        ;;
esac

generate_daily_report() {
    local report_date=$1
    local report_file="$REPORT_DIR/daily/daily_health_${report_date}.md"

    echo "Generating daily health check report for $report_date"

    # Сбор метрик
    local db_lag=$(get_db_replication_lag)
    local backup_status=$(get_backup_status)
    local connectivity_status=$(check_connectivity)
    local health_score=$(calculate_health_score "$db_lag" "$backup_status" "$connectivity_status")

    # Использование шаблона
    sed -e "s/{DATE}/$report_date/g" \
        -e "s/{DB_REPLICATION_LAG}/$db_lag/g" \
        -e "s/{BACKUP_STATUS}/$backup_status/g" \
        -e "s/{CONNECTIVITY_STATUS}/$connectivity_status/g" \
        -e "s/{HEALTH_SCORE}/$health_score/g" \
        "$TEMPLATE_DIR/daily_template.md" > "$report_file"

    echo "Daily report generated: $report_file"

    # Отправка уведомлений при низком health score
    if [ "$health_score" -lt 90 ]; then
        send_alert "Daily DR Health Score: $health_score% - Review required"
    fi
}

get_db_replication_lag() {
    kubectl exec postgresql-primary-0 -n database -- \
        psql -U postgres -t -c "SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()));" 2>/dev/null || echo "ERROR"
}

get_backup_status() {
    local last_backup=$(kubectl get job -n backup-system -o jsonpath='{.items[?(@.status.succeeded==1)].metadata.creationTimestamp}' | tail -1)
    if [ ! -z "$last_backup" ]; then
        echo "SUCCESS"
    else
        echo "FAILED"
    fi
}

check_connectivity() {
    if ping -c 3 dr-site.company.internal >/dev/null 2>&1; then
        echo "CONNECTED"
    else
        echo "DISCONNECTED"
    fi
}

calculate_health_score() {
    local db_lag=$1
    local backup_status=$2
    local connectivity=$3
    local score=0

    # DB replication (40% weight)
    if [[ "$db_lag" =~ ^[0-9]+$ ]] && [ "$db_lag" -lt 300 ]; then
        score=$((score + 40))
    fi

    # Backup status (30% weight)
    if [ "$backup_status" = "SUCCESS" ]; then
        score=$((score + 30))
    fi

    # Connectivity (30% weight)
    if [ "$connectivity" = "CONNECTED" ]; then
        score=$((score + 30))
    fi

    echo $score
}

send_alert() {
    local message=$1
    curl -X POST $SLACK_WEBHOOK_URL \
        -H 'Content-Type: application/json' \
        -d "{\"text\":\"⚠️ $message\"}" >/dev/null 2>&1 || true
}
```

## 7. Интеграция с системами мониторинга

### 7.1 Prometheus метрики для отчетности

```yaml
# dr_reporting_metrics.yaml
groups:
  - name: dr_reporting_metrics
    rules:
      - record: dr:health_score
        expr: |
          (
            (dr_database_replication_healthy * 40) +
            (dr_backup_systems_healthy * 30) +
            (dr_connectivity_healthy * 30)
          ) / 100

      - record: dr:rto_compliance_rate
        expr: |
          (
            sum(rate(dr_test_rto_success_total[24h])) /
            sum(rate(dr_test_rto_total[24h]))
          ) * 100

      - record: dr:rpo_compliance_rate
        expr: |
          (
            sum(rate(dr_test_rpo_success_total[24h])) /
            sum(rate(dr_test_rpo_total[24h]))
          ) * 100

      - alert: DRReportingDataMissing
        expr: absent(dr:health_score)
        for: 5m
        labels:
          severity: warning
          component: dr_reporting
        annotations:
          summary: "DR reporting metrics missing"
          description: "DR health metrics not available for reporting"
```

## 8. Управление версиями отчетов

### 8.1 Система версионирования

```yaml
# report_version_control.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: dr-report-versions
data:
  versioning_policy.yaml: |
    report_retention:
      daily_reports: 90_days
      weekly_reports: 2_years  
      monthly_reports: 7_years
      annual_reports: permanent
      incident_reports: permanent

    version_control:
      git_repository: "git@github.com:company/dr-reports.git"
      branch_strategy: "monthly_branches"
      approval_workflow: true
      digital_signatures: required

    access_control:
      read_access: ["dr_team", "management", "auditors"]
      write_access: ["dr_team"]
      approve_access: ["cto", "coo"]
```

## 9. Ссылки и нормативные документы

- **DISASTER_RECOVERY_PLAN.md:** Основной план восстановления
- **BUSINES_CONTINUITY_PLAN.md:** План непрерывности бизнеса
- **TestScenarios.md:** Детальные сценарии тестирования
- **CONTRACT_SPECIFICATIONS.md:** TestingSchema и ReportingSchema
- **NIST SP 800-34:** Contingency Planning Guide
- **ISO 22301:2019:** Business Continuity Management
- **21 CFR Part 11:** Electronic Records requirements
- **WHO GACP Guidelines:** Section 9 - Business Continuity

## 10. История изменений

| Версия | Дата       | Изменения                                                                                                                                                                | Утверждено               |
| ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------ |
| 1.0    | 2023-06-15 | Первоначальная версия шаблонов отчетности                                                                                                                                | CTO Rodriguez            |
| 1.5    | 2023-12-01 | Добавление автоматизированных метрик и compliance отчетов                                                                                                                | CTO Rodriguez            |
| 2.0    | 2024-01-15 | Комплексная переработка с детализированными шаблонами, финансовым анализом, GACP соответствием, автоматизированной генерацией и интеграцией с CONTRACT_SPECIFICATIONS.md | CTO Rodriguez & COO Chen |

---

**КОНФИДЕНЦИАЛЬНО** - Данный документ содержит критическую информацию о процедурах тестирования и не подлежит распространению без соответствующей авторизации.
