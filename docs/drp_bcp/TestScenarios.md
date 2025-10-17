---
title: "DRP/BCP Test Scenarios Template"
module: "Business Continuity & Disaster Recovery"
version: "2.0"
status: "draft"  # Changed from approved - requires re-verification per AI_Assisted_Documentation_Policy.md
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
  - "TestReports.md"
  - "CONTRACT_SPECIFICATIONS.md#TestingSchema"
# AI-Assisted Documentation Metadata (per AI_Assisted_Documentation_Policy.md)
ai_assisted: true
ai_tool: "GitHub Copilot (GPT-4)"
ai_model_version: "gpt-4-turbo-2024-04-09"
ai_usage_date: "2025-10-16"
ai_purpose: "Documentation generation and compliance review"

# Human Verification (per Section 6-7 of AI Policy)
author_id: "noise83"
author_verified: false  # Author must set to true after review
author_verification_date: null
author_signature_id: null  # Link to DS-ES-001 after e-signature

# QA Approval (per Section 6-7 of AI Policy)
qa_reviewer_id: null
qa_approved: false
qa_approval_date: null
qa_signature_id: null  # Link to DS-ES-001 after QA e-signature

# Document Control (per Section 8 of AI Policy)
document_status: "draft"  # draft | under_review | approved | effective
controlled_copy: false  # Must be false until QA approval
---

## 1. Назначение и область применения

### 1.1 Назначение документа

Данный документ содержит стандартизированные сценарии тестирования для:

- **Валидации процедур восстановления** всех критических систем
- **Проверки соответствия RTO/RPO** целевым показателям
- **Тестирования готовности персонала** к кризисным ситуациям
- **Выявления слабых мест** в планах непрерывности
- **Соответствия регулятивным требованиям** GACP и 21 CFR Part 11
- **Постоянного улучшения** процедур DR/BCP

### 1.2 Классификация сценариев

| Категория                | Частота     | RTO Цель     | Участники      | Сложность |
| ------------------------ | ----------- | ------------ | -------------- | --------- |
| **Daily Health Checks**  | Ежедневно   | 5 минут      | IT Ops         | Low       |
| **Component Failover**   | Еженедельно | 15-30 минут  | Technical Team | Medium    |
| **Application Recovery** | Ежемесячно  | 30-60 минут  | Full IT Team   | Medium    |
| **Site Disaster**        | Квартально  | 60-120 минут | All Teams      | High      |
| **Multi-Site Failure**   | Полугодично | 120+ минут   | All + Vendors  | Critical  |

### 1.3 Уровни тестирования

#### Level 1: Automated System Checks

- **Цель:** Непрерывная валидация готовности
- **Время:** 24/7 автоматически
- **Участники:** Системы мониторинга
- **Критерии:** 100% автоматизация

#### Level 2: Tabletop Exercises

- **Цель:** Проверка процедур и знаний
- **Время:** 2-4 часа
- **Участники:** Management и key personnel
- **Критерии:** Качество планирования

#### Level 3: Technical Simulations

- **Цель:** Функциональное тестирование
- **Время:** 4-8 часов
- **Участники:** Технические команды
- **Критерии:** RTO/RPO соответствие

#### Level 4: Full-Scale Exercises

- **Цель:** Комплексная проверка готовности
- **Время:** 8-24 часа
- **Участники:** Все подразделения
- **Критерии:** Полная операционная готовность

## 2. Ежедневные проверки готовности

### 2.1 Daily DR Readiness Check

```yaml
scenario_id: DRC-001
name: "Daily DR Readiness Check"
category: "Health Check"
frequency: "Daily"
duration: "5 minutes"
automation_level: "Full"
owner: "IT Operations"
```

#### Цель тестирования

Ежедневная автоматическая проверка готовности всех компонентов DR инфраструктуры

#### Предварительные условия

- Все системы в нормальном операционном состоянии
- Мониторинг системы активен
- Автоматизированные скрипты развернуты

#### Проверяемые компоненты

##### Database Replication Health

```bash
#!/bin/bash
# check_db_replication.sh

echo "=== Database Replication Health Check ==="

# Проверка primary database
PRIMARY_STATUS=$(kubectl exec postgresql-primary-0 -n database -- \
  psql -U postgres -t -c "SELECT pg_is_in_recovery();" 2>/dev/null | tr -d ' ')

if [ "$PRIMARY_STATUS" = "f" ]; then
    echo "✅ Primary database: ACTIVE"
else
    echo "❌ Primary database: ERROR - In recovery mode"
    exit 1
fi

# Проверка standby database
STANDBY_STATUS=$(kubectl exec postgresql-standby-0 -n database -- \
  psql -U postgres -t -c "SELECT pg_is_in_recovery();" 2>/dev/null | tr -d ' ')

if [ "$STANDBY_STATUS" = "t" ]; then
    echo "✅ Standby database: READY"
else
    echo "❌ Standby database: ERROR - Not in recovery mode"
    exit 1
fi

# Проверка replication lag
REPLICATION_LAG=$(kubectl exec postgresql-primary-0 -n database -- \
  psql -U postgres -t -c "SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()));" 2>/dev/null)

if [[ "$REPLICATION_LAG" =~ ^[0-9]+$ ]] && [ "$REPLICATION_LAG" -lt 300 ]; then
    echo "✅ Replication lag: ${REPLICATION_LAG}s (Target: <300s)"
else
    echo "❌ Replication lag: ${REPLICATION_LAG}s EXCEEDS TARGET"
    exit 1
fi

echo "✅ Database replication health: PASSED"
```

##### Backup Systems Validation

```bash
#!/bin/bash
# check_backup_systems.sh

echo "=== Backup Systems Validation ==="

# Проверка последнего backup job
LAST_BACKUP_JOB=$(kubectl get jobs -n backup-system -o jsonpath='{.items[?(@.status.succeeded==1)].metadata.name}' | tail -1)

if [ ! -z "$LAST_BACKUP_JOB" ]; then
    BACKUP_TIME=$(kubectl get job "$LAST_BACKUP_JOB" -n backup-system -o jsonpath='{.status.completionTime}')
    echo "✅ Last successful backup: $BACKUP_TIME"
else
    echo "❌ No successful backup jobs found"
    exit 1
fi

# Проверка backup integrity
BACKUP_INTEGRITY=$(kubectl logs job/"$LAST_BACKUP_JOB" -n backup-system | grep -c "BACKUP_INTEGRITY_CHECK: PASSED")

if [ "$BACKUP_INTEGRITY" -gt 0 ]; then
    echo "✅ Backup integrity: VERIFIED"
else
    echo "❌ Backup integrity: FAILED"
    exit 1
fi

# Проверка backup storage space
BACKUP_STORAGE_USAGE=$(kubectl exec backup-storage-0 -n backup-system -- df -h /backup | tail -1 | awk '{print $5}' | sed 's/%//')

if [ "$BACKUP_STORAGE_USAGE" -lt 80 ]; then
    echo "✅ Backup storage usage: ${BACKUP_STORAGE_USAGE}%"
else
    echo "⚠️ Backup storage usage: ${BACKUP_STORAGE_USAGE}% (>80%)"
fi

echo "✅ Backup systems validation: PASSED"
```

##### Network Connectivity Check

```bash
#!/bin/bash
# check_network_connectivity.sh

echo "=== Network Connectivity Check ==="

# Проверка связи с DR site
if ping -c 3 -W 5 dr-site.company.internal >/dev/null 2>&1; then
    echo "✅ DR site connectivity: ACTIVE"
else
    echo "❌ DR site connectivity: FAILED"
    exit 1
fi

# Проверка cloud connectivity
if curl -s --max-time 10 https://aws.amazon.com >/dev/null; then
    echo "✅ AWS connectivity: ACTIVE"
else
    echo "❌ AWS connectivity: FAILED"
fi

if curl -s --max-time 10 https://portal.azure.com >/dev/null; then
    echo "✅ Azure connectivity: ACTIVE"
else
    echo "❌ Azure connectivity: FAILED"
fi

# Проверка internal services
SERVICES=("erp-core:8080" "iot-service:8081" "surveillance:8082")

for service in "${SERVICES[@]}"; do
    if nc -z -w 5 ${service/:/ }; then
        echo "✅ Service $service: REACHABLE"
    else
        echo "❌ Service $service: UNREACHABLE"
    fi
done

echo "✅ Network connectivity check: COMPLETED"
```

#### Критерии успешности

- **Database replication lag:** < 300 seconds
- **Backup freshness:** < 24 hours
- **Network connectivity:** 100% critical paths
- **Service availability:** 100% core services

#### Действия при сбое

1. **Автоматическое уведомление** дежурной команды
2. **Эскалация** через 15 минут если не исправлено
3. **Генерация инцидента** в системе ticketing
4. **Запуск корректирующих процедур**

### 2.2 IoT Systems Health Check

```yaml
scenario_id: DRC-002
name: "IoT Systems Health Check"
category: "Health Check"
frequency: "Daily"
duration: "10 minutes"
automation_level: "Partial"
owner: "Production Team"
```

#### Проверяемые компоненты

##### Sensor Connectivity

```bash
#!/bin/bash
# check_iot_sensors.sh

echo "=== IoT Sensors Health Check ==="

# Получение списка активных датчиков
ACTIVE_SENSORS=$(kubectl exec iot-service-0 -n production -- \
  curl -s http://localhost:8081/api/sensors/active | jq -r '.sensors[].sensor_id')

TOTAL_SENSORS=$(echo "$ACTIVE_SENSORS" | wc -l)
HEALTHY_SENSORS=0
CRITICAL_SENSORS=("TEMP_001" "HUMID_001" "CO2_001")

echo "Checking $TOTAL_SENSORS sensors..."

for sensor_id in $ACTIVE_SENSORS; do
    # Проверка последних данных (в течение 10 минут)
    LAST_READING=$(kubectl exec iot-service-0 -n production -- \
      curl -s "http://localhost:8081/api/sensors/$sensor_id/last" | \
      jq -r '.timestamp')

    LAST_READING_TIME=$(date -d "$LAST_READING" +%s 2>/dev/null || echo 0)
    CURRENT_TIME=$(date +%s)
    TIME_DIFF=$((CURRENT_TIME - LAST_READING_TIME))

    if [ "$TIME_DIFF" -lt 600 ]; then  # 10 minutes
        echo "✅ Sensor $sensor_id: ACTIVE (${TIME_DIFF}s ago)"
        ((HEALTHY_SENSORS++))
    else
        echo "❌ Sensor $sensor_id: STALE (${TIME_DIFF}s ago)"

        # Проверка критических датчиков
        if [[ " ${CRITICAL_SENSORS[@]} " =~ " ${sensor_id} " ]]; then
            echo "🚨 CRITICAL SENSOR OFFLINE: $sensor_id"
            # Немедленное уведомление
            curl -X POST $SLACK_URGENT_WEBHOOK \
                -d "{\"text\":\"🚨 Critical sensor offline: $sensor_id\"}"
        fi
    fi
done

SENSOR_HEALTH_RATE=$((HEALTHY_SENSORS * 100 / TOTAL_SENSORS))
echo "Sensor health rate: $SENSOR_HEALTH_RATE% ($HEALTHY_SENSORS/$TOTAL_SENSORS)"

if [ "$SENSOR_HEALTH_RATE" -lt 95 ]; then
    echo "⚠️ Sensor health below threshold (95%)"
    exit 1
fi
```

##### Environmental Controls

```bash
#!/bin/bash
# check_environmental_controls.sh

echo "=== Environmental Controls Check ==="

# Проверка HVAC систем
HVAC_ZONES=("veg_zone_1" "flower_zone_1" "flower_zone_2" "dry_zone_1")

for zone in "${HVAC_ZONES[@]}"; do
    TEMP=$(kubectl exec iot-service-0 -n production -- \
      curl -s "http://localhost:8081/api/zones/$zone/temperature" | jq -r '.current_temp')

    TARGET_TEMP=$(kubectl exec iot-service-0 -n production -- \
      curl -s "http://localhost:8081/api/zones/$zone/target" | jq -r '.target_temp')

    TEMP_DIFF=$(echo "$TEMP - $TARGET_TEMP" | bc | tr -d '-')

    if (( $(echo "$TEMP_DIFF < 2.0" | bc -l) )); then
        echo "✅ Zone $zone: ${TEMP}°C (Target: ${TARGET_TEMP}°C)"
    else
        echo "⚠️ Zone $zone: ${TEMP}°C DEVIATION from ${TARGET_TEMP}°C"
    fi
done

echo "✅ Environmental controls check: COMPLETED"
```

## 3. Еженедельные функциональные тесты

### 3.1 Database Failover Test

```yaml
scenario_id: DFT-001
name: "PostgreSQL Primary-Standby Failover"
category: "Component Failover"
frequency: "Weekly"
duration: "30 minutes"
automation_level: "Semi-automated"
rto_target: "15 minutes"
rpo_target: "5 minutes"
owner: "Database Team"
```

#### Описание сценария

Контролируемое переключение с primary на standby PostgreSQL сервер для проверки процедур failover и восстановления.

#### Предварительные условия

- [x] Standby database в состоянии ready
- [x] Replication lag < 60 seconds
- [x] Backup выполнен в течение 24 часов
- [x] Maintenance window утвержден
- [x] Команда DB уведомлена

#### Процедура выполнения

##### Шаг 1: Подготовка и baseline (5 минут)

```bash
#!/bin/bash
# db_failover_step1_preparation.sh

echo "=== Step 1: Preparation and Baseline ==="

# Создание точки отсчета
BASELINE_TIME=$(date -Iseconds)
echo "Baseline time: $BASELINE_TIME"

# Проверка текущего состояния
echo "Current primary database status:"
kubectl exec postgresql-primary-0 -n database -- \
  psql -U postgres -c "SELECT pg_is_in_recovery(), pg_current_wal_lsn();"

echo "Current standby database status:"
kubectl exec postgresql-standby-0 -n database -- \
  psql -U postgres -c "SELECT pg_is_in_recovery(), pg_last_wal_replay_lsn();"

# Создание test record для проверки
TEST_RECORD_ID=$(uuidgen)
kubectl exec postgresql-primary-0 -n database -- \
  psql -U postgres -c "INSERT INTO test_failover (id, created_at, test_data) VALUES ('$TEST_RECORD_ID', NOW(), 'failover_test_$BASELINE_TIME');"

echo "Test record created: $TEST_RECORD_ID"

# Сохранение baseline метрик
echo "Recording baseline metrics..."
kubectl exec postgresql-primary-0 -n database -- \
  psql -U postgres -c "SELECT COUNT(*) FROM plants;" > /tmp/baseline_plants_count.txt

echo "✅ Preparation completed"
```

##### Шаг 2: Симуляция отказа primary (2 минуты)

```bash
#!/bin/bash
# db_failover_step2_simulate_failure.sh

echo "=== Step 2: Simulate Primary Database Failure ==="

FAILURE_START_TIME=$(date -Iseconds)
echo "Failure simulation started: $FAILURE_START_TIME"

# Остановка primary database (симуляция сбоя)
echo "Stopping primary database..."
kubectl scale statefulset postgresql-primary --replicas=0 -n database

# Ожидание полной остановки
echo "Waiting for primary shutdown..."
kubectl wait --for=delete pod/postgresql-primary-0 -n database --timeout=120s

# Проверка недоступности
echo "Verifying primary unavailability..."
if kubectl exec postgresql-primary-0 -n database -- psql -U postgres -c "SELECT 1;" 2>/dev/null; then
    echo "❌ Primary still accessible - failure simulation failed"
    exit 1
else
    echo "✅ Primary database unavailable - failure simulated"
fi

echo "Primary failure simulated successfully"
```

##### Шаг 3: Активация standby (8 минут)

```bash
#!/bin/bash
# db_failover_step3_activate_standby.sh

echo "=== Step 3: Activate Standby Database ==="

ACTIVATION_START_TIME=$(date -Iseconds)
echo "Standby activation started: $ACTIVATION_START_TIME"

# Промотирование standby в primary
echo "Promoting standby to primary..."
kubectl exec postgresql-standby-0 -n database -- \
  psql -U postgres -c "SELECT pg_promote();"

# Ожидание завершения promotion
echo "Waiting for promotion to complete..."
sleep 30

# Проверка статуса нового primary
echo "Verifying new primary status..."
NEW_PRIMARY_STATUS=$(kubectl exec postgresql-standby-0 -n database -- \
  psql -U postgres -t -c "SELECT pg_is_in_recovery();" | tr -d ' ')

if [ "$NEW_PRIMARY_STATUS" = "f" ]; then
    echo "✅ Standby promoted to primary successfully"
else
    echo "❌ Standby promotion failed"
    exit 1
fi

# Обновление service endpoint
echo "Updating service endpoint..."
kubectl patch service postgresql-primary -n database \
  -p '{"spec":{"selector":{"app":"postgresql-standby"}}}'

# Проверка connectivity через service
echo "Testing connectivity through service..."
if kubectl exec postgresql-test-client -n database -- \
  psql -h postgresql-primary.database.svc.cluster.local -U postgres -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ New primary accessible through service"
else
    echo "❌ New primary not accessible through service"
    exit 1
fi

echo "Standby activation completed successfully"
```

##### Шаг 4: Валидация и верификация (10 минут)

```bash
#!/bin/bash
# db_failover_step4_validation.sh

echo "=== Step 4: Validation and Verification ==="

VALIDATION_START_TIME=$(date -Iseconds)
echo "Validation started: $VALIDATION_START_TIME"

# Проверка данных
echo "Validating data integrity..."

# Проверка test record
if kubectl exec postgresql-standby-0 -n database -- \
  psql -U postgres -t -c "SELECT COUNT(*) FROM test_failover WHERE id = '$TEST_RECORD_ID';" | grep -q "1"; then
    echo "✅ Test record found in new primary"
else
    echo "❌ Test record missing in new primary"
    exit 1
fi

# Проверка базовых метрик
CURRENT_PLANTS_COUNT=$(kubectl exec postgresql-standby-0 -n database -- \
  psql -U postgres -t -c "SELECT COUNT(*) FROM plants;" | tr -d ' ')
BASELINE_PLANTS_COUNT=$(cat /tmp/baseline_plants_count.txt | tr -d ' ')

if [ "$CURRENT_PLANTS_COUNT" = "$BASELINE_PLANTS_COUNT" ]; then
    echo "✅ Plants count consistent: $CURRENT_PLANTS_COUNT"
else
    echo "⚠️ Plants count discrepancy: $CURRENT_PLANTS_COUNT vs $BASELINE_PLANTS_COUNT"
fi

# Тестирование функциональности приложений
echo "Testing application connectivity..."
kubectl rollout restart deployment/erp-core -n gacp-erp

# Ожидание перезапуска приложений
kubectl rollout status deployment/erp-core -n gacp-erp --timeout=300s

# Проверка health check приложения
if curl -f http://erp-core.gacp-erp.svc.cluster.local:8080/health/database; then
    echo "✅ Application database connectivity restored"
else
    echo "❌ Application cannot connect to database"
    exit 1
fi

echo "Validation completed successfully"
```

##### Шаг 5: Восстановление и cleanup (5 минут)

```bash
#!/bin/bash
# db_failover_step5_recovery.sh

echo "=== Step 5: Recovery and Cleanup ==="

RECOVERY_START_TIME=$(date -Iseconds)
echo "Recovery started: $RECOVERY_START_TIME"

# Запуск нового standby (бывший primary)
echo "Starting new standby database..."
kubectl scale statefulset postgresql-primary --replicas=1 -n database

# Ожидание готовности нового standby
kubectl wait --for=condition=Ready pod/postgresql-primary-0 -n database --timeout=300s

# Настройка репликации (новый primary -> новый standby)
echo "Configuring replication to new standby..."
kubectl exec postgresql-standby-0 -n database -- \
  psql -U postgres -c "SELECT pg_create_physical_replication_slot('standby_slot');"

# Cleanup test data
echo "Cleaning up test data..."
kubectl exec postgresql-standby-0 -n database -- \
  psql -U postgres -c "DELETE FROM test_failover WHERE id = '$TEST_RECORD_ID';"

# Финальная проверка репликации
echo "Final replication status check..."
kubectl exec postgresql-standby-0 -n database -- \
  psql -U postgres -c "SELECT client_addr, state, sync_state FROM pg_stat_replication;"

RECOVERY_END_TIME=$(date -Iseconds)
echo "Recovery completed: $RECOVERY_END_TIME"

# Расчет RTO
TOTAL_RTO=$(( $(date -d "$RECOVERY_END_TIME" +%s) - $(date -d "$FAILURE_START_TIME" +%s) ))
echo "Total RTO: ${TOTAL_RTO} seconds (Target: 900 seconds)"

if [ "$TOTAL_RTO" -le 900 ]; then
    echo "✅ RTO target met"
else
    echo "❌ RTO target exceeded"
fi

echo "Database failover test completed successfully"
```

#### Критерии успешности

- **RTO Achievement:** ≤ 15 minutes
- **RPO Achievement:** ≤ 5 minutes
- **Data Integrity:** 100% consistency
- **Application Recovery:** All services operational
- **Replication Restoration:** Standby fully synced

#### Ожидаемые результаты

- Standby database promoted to primary
- All applications reconnected successfully
- No data loss detected
- New replication established
- Service endpoints updated correctly

### 3.2 Application Recovery Test

```yaml
scenario_id: ART-001
name: "ERP Core Application Recovery"
category: "Application Failover"
frequency: "Weekly"
duration: "45 minutes"
automation_level: "Semi-automated"
rto_target: "30 minutes"
owner: "DevOps Team"
```

#### Описание сценария

Тестирование процедур восстановления основного ERP приложения после критического сбоя, включая failover на резервный кластер.

#### Процедура выполнения

##### Подготовка окружения

```bash
#!/bin/bash
# app_recovery_preparation.sh

echo "=== Application Recovery Test Preparation ==="

# Проверка состояния кластеров
echo "Checking cluster health..."
kubectl cluster-info --context=primary-cluster
kubectl cluster-info --context=secondary-cluster

# Проверка образов приложений
echo "Verifying application images..."
kubectl get deployment erp-core -n gacp-erp -o jsonpath='{.spec.template.spec.containers[0].image}'

# Создание baseline traffic
echo "Generating baseline traffic..."
kubectl apply -f - << EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: traffic-generator-baseline
  namespace: gacp-erp
spec:
  template:
    spec:
      containers:
      - name: traffic-gen
        image: curlimages/curl:latest
        command: ["/bin/sh"]
        args:
        - -c
        - |
          for i in {1..100}; do
            curl -s http://erp-core:8080/health
            curl -s http://erp-core:8080/api/plants
            sleep 1
          done
      restartPolicy: Never
EOF

echo "Preparation completed"
```

##### Failover Process

```bash
#!/bin/bash
# app_recovery_failover.sh

echo "=== Application Failover Process ==="

FAILOVER_START=$(date -Iseconds)

# Симуляция критического сбоя
echo "Simulating critical application failure..."
kubectl scale deployment erp-core --replicas=0 -n gacp-erp

# Активация secondary cluster
echo "Activating secondary cluster..."
kubectl config use-context secondary-cluster

# Запуск приложения на secondary
kubectl apply -f - << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: erp-core-dr
  namespace: gacp-erp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: erp-core-dr
  template:
    metadata:
      labels:
        app: erp-core-dr
    spec:
      containers:
      - name: erp-core
        image: gacp-erp/core:latest
        env:
        - name: DATABASE_URL
          value: "postgresql://standby-db:5432/gacp"
        - name: CLUSTER_MODE
          value: "secondary"
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
EOF

# Обновление DNS/Load Balancer
echo "Updating traffic routing..."
kubectl patch service erp-core-external -n gacp-erp \
  -p '{"spec":{"selector":{"app":"erp-core-dr"}}}'

FAILOVER_END=$(date -Iseconds)
FAILOVER_DURATION=$(( $(date -d "$FAILOVER_END" +%s) - $(date -d "$FAILOVER_START" +%s) ))

echo "Failover completed in ${FAILOVER_DURATION} seconds"
```

#### Валидация восстановления

```bash
#!/bin/bash
# app_recovery_validation.sh

echo "=== Application Recovery Validation ==="

# Проверка доступности сервиса
echo "Testing service availability..."
for i in {1..30}; do
    if curl -f http://erp-core-external/health; then
        echo "✅ Service available after $i attempts"
        break
    fi
    sleep 10
done

# Функциональное тестирование
echo "Running functional tests..."

# Тест 1: Authentication
AUTH_TEST=$(curl -s -X POST http://erp-core-external/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test_user","password":"test_pass"}' | \
  jq -r '.token')

if [ "$AUTH_TEST" != "null" ]; then
    echo "✅ Authentication: PASSED"
else
    echo "❌ Authentication: FAILED"
fi

# Тест 2: Database connectivity
DB_TEST=$(curl -s -H "Authorization: Bearer $AUTH_TEST" \
  http://erp-core-external/api/plants/count | jq -r '.count')

if [[ "$DB_TEST" =~ ^[0-9]+$ ]]; then
    echo "✅ Database connectivity: PASSED ($DB_TEST plants)"
else
    echo "❌ Database connectivity: FAILED"
fi

# Тест 3: IoT integration
IOT_TEST=$(curl -s -H "Authorization: Bearer $AUTH_TEST" \
  http://erp-core-external/api/sensors/status | jq -r '.active_sensors')

if [[ "$IOT_TEST" =~ ^[0-9]+$ ]]; then
    echo "✅ IoT integration: PASSED ($IOT_TEST sensors)"
else
    echo "❌ IoT integration: FAILED"
fi

echo "Validation completed"
```

## 4. Ежемесячные комплексные учения

### 4.1 Full Site Disaster Simulation

```yaml
scenario_id: FSS-001
name: "Complete Primary Site Failure"
category: "Site Disaster"
frequency: "Monthly"
duration: "4 hours"
automation_level: "Manual"
rto_target: "2 hours"
participants: "All Teams"
owner: "Crisis Management Team"
```

#### Описание сценария

Полная симуляция выхода из строя основного дата-центра с активацией всех процедур восстановления на резервной площадке.

#### Участники и роли

| Роль                    | Участник           | Ответственность            |
| ----------------------- | ------------------ | -------------------------- |
| **Incident Commander**  | CTO Alex Rodriguez | Общее руководство          |
| **Technical Lead**      | DevOps Manager     | Техническое восстановление |
| **Database Lead**       | DBA Senior         | Восстановление данных      |
| **Network Lead**        | Network Manager    | Сетевая инфраструктура     |
| **Production Lead**     | Operations Manager | Производственные системы   |
| **Communications Lead** | PR Manager         | Внешние коммуникации       |

#### Фазы выполнения

##### Фаза 1: Обнаружение инцидента (0-15 минут)

```markdown
**T+0:** Exercise Controller объявляет начало симуляции
**Сценарий:** "Primary data center недоступен из-за пожара"

**Ожидаемые действия:**

1. Системы мониторинга детектируют недоступность
2. Автоматические уведомления отправляются команде
3. Incident Commander активирует crisis management team
4. Оценка масштаба инцидента

**Критерии успеха:**

- Инцидент обнаружен в течение 5 минут
- Команда уведомлена в течение 10 минут
- Crisis Commander назначен в течение 15 минут
```

##### Фаза 2: Активация DR процедур (15-45 минут)

```bash
#!/bin/bash
# site_disaster_phase2_activation.sh

echo "=== Phase 2: DR Procedures Activation ==="

# Активация DR команды
echo "Activating DR response team..."
curl -X POST $INCIDENT_MANAGEMENT_API/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "incident_type": "site_disaster",
    "severity": "critical",
    "description": "Primary site failure - activating DR procedures",
    "commander": "alex.rodriguez@company.com"
  }'

# Переключение на DR site
echo "Switching to DR site operations..."
kubectl config use-context dr-site-cluster

# Активация standby infrastructure
echo "Starting standby infrastructure..."
kubectl apply -f /dr-configs/infrastructure/

# Ожидание готовности инфраструктуры
echo "Waiting for infrastructure readiness..."
kubectl wait --for=condition=Ready pods --all -n infrastructure --timeout=600s

# Проверка сетевой связности
echo "Verifying network connectivity..."
ping -c 5 primary-site.internal || echo "Primary site confirmed unreachable"
ping -c 5 dr-site.internal && echo "DR site connectivity confirmed"

echo "Phase 2 completed"
```

##### Фаза 3: Восстановление данных (45-90 минут)

```bash
#!/bin/bash
# site_disaster_phase3_data_recovery.sh

echo "=== Phase 3: Data Recovery ==="

# Активация standby databases
echo "Activating standby databases..."
kubectl exec postgresql-standby-0 -n database -- \
  psql -U postgres -c "SELECT pg_promote();"

# Восстановление из последних backups
echo "Initiating backup restoration..."
kubectl create job restore-from-latest --from=cronjob/nightly-backup

# Проверка целостности данных
echo "Verifying data integrity..."
kubectl exec postgresql-standby-0 -n database -- \
  psql -U postgres -c "
    SELECT
      schemaname,
      tablename,
      n_tup_ins + n_tup_upd + n_tup_del as total_operations
    FROM pg_stat_user_tables
    ORDER BY total_operations DESC
    LIMIT 10;"

# Активация Kafka для event streaming
echo "Starting Kafka cluster..."
kubectl apply -f /dr-configs/kafka/

# Проверка event processing
echo "Verifying event processing..."
kubectl exec kafka-0 -n messaging -- \
  kafka-topics.sh --bootstrap-server localhost:9092 --list

echo "Phase 3 completed"
```

##### Фаза 4: Восстановление приложений (90-120 минут)

```bash
#!/bin/bash
# site_disaster_phase4_application_recovery.sh

echo "=== Phase 4: Application Recovery ==="

# Восстановление core ERP
echo "Recovering ERP core application..."
kubectl apply -f /dr-configs/applications/erp-core.yaml

# Восстановление IoT services
echo "Recovering IoT monitoring services..."
kubectl apply -f /dr-configs/applications/iot-services.yaml

# Восстановление security services
echo "Recovering security and surveillance..."
kubectl apply -f /dr-configs/applications/security.yaml

# Обновление DNS записей
echo "Updating DNS records..."
curl -X PUT https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID \
  -H "Authorization: Bearer $CF_TOKEN" \
  -d '{
    "type": "A",
    "name": "erp.company.com",
    "content": "'$DR_SITE_IP'",
    "ttl": 300
  }'

# Проверка доступности приложений
echo "Testing application availability..."
APPS=("erp-core" "iot-service" "surveillance" "reporting")

for app in "${APPS[@]}"; do
    echo "Testing $app..."
    kubectl wait --for=condition=Ready pod -l app=$app --timeout=300s

    # Health check
    if kubectl exec -l app=$app -- curl -f http://localhost:8080/health; then
        echo "✅ $app: HEALTHY"
    else
        echo "❌ $app: UNHEALTHY"
    fi
done

echo "Phase 4 completed"
```

##### Фаза 5: Валидация и коммуникации (120-150 минут)

```bash
#!/bin/bash
# site_disaster_phase5_validation.sh

echo "=== Phase 5: Validation and Communications ==="

# Полное функциональное тестирование
echo "Running comprehensive functional tests..."

# Тест производственных процедур
echo "Testing production workflows..."
curl -X POST http://erp.company.com/api/plants \
  -H "Authorization: Bearer $API_TOKEN" \
  -d '{
    "strain": "Test Strain",
    "source_type": "clone",
    "zone_id": "test_zone"
  }'

# Тест IoT мониторинга
echo "Testing IoT monitoring..."
curl -X GET http://iot.company.com/api/sensors/status

# Тест систем безопасности
echo "Testing security systems..."
curl -X GET http://surveillance.company.com/api/cameras/status

# Уведомление stakeholders
echo "Notifying stakeholders..."

# Внутренние уведомления
curl -X POST $SLACK_WEBHOOK \
  -d '{
    "text": "✅ DR Exercise Phase 5: All systems operational on DR site",
    "channel": "#crisis-management"
  }'

# Клиентские уведомления
curl -X POST https://api.statuspage.io/v1/pages/$PAGE_ID/incidents \
  -H "Authorization: OAuth $STATUSPAGE_TOKEN" \
  -d '{
    "incident": {
      "name": "DR Exercise - All Systems Operational",
      "status": "resolved",
      "impact": "none",
      "body": "DR exercise completed successfully. All systems operational."
    }
  }'

echo "Phase 5 completed"
```

#### Метрики и KPI

##### Временные показатели

```yaml
time_metrics:
  detection_time:
    target: 5_minutes
    measurement: "Time from failure to detection"

  team_notification:
    target: 10_minutes
    measurement: "Time from detection to team alert"

  dr_activation:
    target: 30_minutes
    measurement: "Time from alert to DR site activation"

  data_recovery:
    target: 60_minutes
    measurement: "Time to restore database functionality"

  application_recovery:
    target: 90_minutes
    measurement: "Time to restore all applications"

  full_operation:
    target: 120_minutes
    measurement: "Time to complete operational capability"
```

##### Функциональные показатели

```yaml
functional_metrics:
  data_integrity:
    target: 100%
    measurement: "Percentage of data preserved"

  service_availability:
    target: 100%
    measurement: "Percentage of services restored"

  performance_ratio:
    target: 80%
    measurement: "DR site performance vs primary"

  staff_response:
    target: 90%
    measurement: "Percentage of staff responding on time"
```

## 5. Квартальные полномасштабные учения

### 5.1 Multi-Site Disaster Exercise

```yaml
scenario_id: MSE-001
name: "Multi-Site Catastrophic Failure"
category: "Full Scale Exercise"
frequency: "Quarterly"
duration: "8 hours"
automation_level: "Manual"
rto_target: "4 hours"
participants: "All Teams + External Partners"
owner: "Executive Team"
```

#### Описание сценария

Симуляция катастрофического события, затрагивающего как основную, так и резервную площадки, с полной активацией облачной инфраструктуры и внешних партнеров.

#### Сценарий события

```markdown
**Событие:** Крупное землетрясение в регионе
**Воздействие:**

- Primary data center: Полная недоступность (здание повреждено)
- Secondary data center: Частичная недоступность (30% серверов)
- Офисы: Эвакуация персонала
- Инфраструктура: Нарушения связи и электроснабжения

**Дополнительные условия:**

- 40% персонала недоступны
- External vendors активированы
- Media attention высокое
- Regulatory notifications требуются
```

### 5.2 Regulatory Compliance Exercise

```yaml
scenario_id: RCE-001
name: "Regulatory Audit During DR"
category: "Compliance Exercise"
frequency: "Quarterly"
duration: "6 hours"
automation_level: "Manual"
participants: "All Teams + External Auditors"
owner: "Compliance Team"
```

#### Описание сценария

Симуляция регулятивного аудита, проводимого во время активных DR процедур, для проверки соответствия требованиям во время кризиса.

## 6. Критерии оценки и метрики

### 6.1 Количественные метрики

#### RTO/RPO Compliance

```yaml
rto_metrics:
  database_recovery:
    target: 15_minutes
    measurement_method: "automated_timestamp_tracking"
    success_criteria: "actual_time <= target_time"

  application_recovery:
    target: 30_minutes
    measurement_method: "health_check_automation"
    success_criteria: "all_services_operational"

  full_site_recovery:
    target: 120_minutes
    measurement_method: "comprehensive_functional_test"
    success_criteria: "end_to_end_workflow_success"

rpo_metrics:
  transactional_data:
    target: 5_minutes
    measurement_method: "transaction_log_analysis"
    success_criteria: "data_loss <= target"

  iot_telemetry:
    target: 10_minutes
    measurement_method: "sensor_data_comparison"
    success_criteria: "missing_data_points <= target"
```

#### Performance Benchmarks

```yaml
performance_metrics:
  response_time_degradation:
    acceptable_threshold: 20%
    measurement: "api_response_times"

  throughput_reduction:
    acceptable_threshold: 30%
    measurement: "requests_per_second"

  error_rate_increase:
    acceptable_threshold: 5%
    measurement: "error_percentage"
```

### 6.2 Качественные критерии

#### Team Performance Assessment

```yaml
team_assessment:
  communication_effectiveness:
    criteria:
      - "Clear status updates every 15 minutes"
      - "Stakeholder notifications within target timeframes"
      - "Accurate technical information sharing"

  decision_making_quality:
    criteria:
      - "Rapid assessment of situations"
      - "Appropriate escalation procedures"
      - "Risk-based prioritization"

  procedural_compliance:
    criteria:
      - "Adherence to documented procedures"
      - "Proper approvals obtained"
      - "Regulatory requirements met"
```

### 6.3 Continuous Improvement Metrics

#### Learning and Adaptation

```yaml
improvement_metrics:
  issues_identified:
    measurement: "count_of_new_issues_per_test"
    target: "decreasing_trend"

  procedure_updates:
    measurement: "number_of_procedure_improvements"
    target: "regular_incremental_improvements"

  automation_advancement:
    measurement: "percentage_of_automated_procedures"
    target: "increasing_automation_coverage"

  training_effectiveness:
    measurement: "staff_competency_scores"
    target: "consistent_high_performance"
```

## 7. Автоматизированное тестирование

### 7.1 Continuous Testing Framework

```python
# continuous_dr_testing.py
import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any

class ContinuousDRTester:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.test_results = []
        self.metrics_collector = MetricsCollector()

    async def run_daily_health_checks(self):
        """Execute daily automated health checks"""
        test_suite = [
            self.check_database_replication,
            self.check_backup_systems,
            self.check_network_connectivity,
            self.check_application_health,
            self.check_monitoring_systems
        ]

        results = []
        for test in test_suite:
            try:
                result = await test()
                results.append(result)
                self.logger.info(f"Health check {test.__name__}: {result['status']}")
            except Exception as e:
                self.logger.error(f"Health check {test.__name__} failed: {e}")
                results.append({
                    'test': test.__name__,
                    'status': 'FAILED',
                    'error': str(e),
                    'timestamp': datetime.now().isoformat()
                })

        # Generate daily report
        await self.generate_daily_report(results)
        return results

    async def check_database_replication(self) -> Dict[str, Any]:
        """Check database replication health"""
        try:
            # Check replication lag
            lag_result = await self._execute_kubectl_command(
                "exec postgresql-primary-0 -n database -- "
                "psql -U postgres -t -c "
                "\"SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()));\""
            )

            replication_lag = float(lag_result.strip())

            # Check standby status
            standby_result = await self._execute_kubectl_command(
                "exec postgresql-standby-0 -n database -- "
                "psql -U postgres -t -c \"SELECT pg_is_in_recovery();\""
            )

            standby_ready = standby_result.strip() == 't'

            status = 'PASSED' if replication_lag < 300 and standby_ready else 'FAILED'

            return {
                'test': 'database_replication',
                'status': status,
                'metrics': {
                    'replication_lag_seconds': replication_lag,
                    'standby_ready': standby_ready
                },
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            return {
                'test': 'database_replication',
                'status': 'ERROR',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

    async def execute_weekly_failover_test(self, test_type: str):
        """Execute weekly failover tests"""
        test_config = {
            'database': {
                'target_rto': 900,  # 15 minutes
                'target_rpo': 300,  # 5 minutes
                'procedure': self.database_failover_test
            },
            'application': {
                'target_rto': 1800,  # 30 minutes
                'target_rpo': 600,   # 10 minutes
                'procedure': self.application_failover_test
            }
        }

        if test_type not in test_config:
            raise ValueError(f"Unknown test type: {test_type}")

        config = test_config[test_type]
        start_time = datetime.now()

        try:
            result = await config['procedure']()
            end_time = datetime.now()

            actual_rto = (end_time - start_time).total_seconds()
            rto_compliance = actual_rto <= config['target_rto']

            result.update({
                'rto_target': config['target_rto'],
                'rto_actual': actual_rto,
                'rto_compliance': rto_compliance,
                'start_time': start_time.isoformat(),
                'end_time': end_time.isoformat()
            })

            await self.generate_weekly_report(result)
            return result

        except Exception as e:
            self.logger.error(f"Weekly failover test {test_type} failed: {e}")
            return {
                'test': f'{test_type}_failover',
                'status': 'FAILED',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }

    async def database_failover_test(self) -> Dict[str, Any]:
        """Execute database failover test procedure"""
        phases = []

        # Phase 1: Preparation
        phase1_start = datetime.now()
        await self._create_test_record()
        phase1_end = datetime.now()
        phases.append({
            'phase': 'preparation',
            'duration': (phase1_end - phase1_start).total_seconds(),
            'status': 'COMPLETED'
        })

        # Phase 2: Failure simulation
        phase2_start = datetime.now()
        await self._simulate_primary_failure()
        phase2_end = datetime.now()
        phases.append({
            'phase': 'failure_simulation',
            'duration': (phase2_end - phase2_start).total_seconds(),
            'status': 'COMPLETED'
        })

        # Phase 3: Standby activation
        phase3_start = datetime.now()
        await self._activate_standby_database()
        phase3_end = datetime.now()
        phases.append({
            'phase': 'standby_activation',
            'duration': (phase3_end - phase3_start).total_seconds(),
            'status': 'COMPLETED'
        })

        # Phase 4: Validation
        phase4_start = datetime.now()
        validation_result = await self._validate_database_functionality()
        phase4_end = datetime.now()
        phases.append({
            'phase': 'validation',
            'duration': (phase4_end - phase4_start).total_seconds(),
            'status': 'COMPLETED' if validation_result else 'FAILED'
        })

        # Phase 5: Recovery
        phase5_start = datetime.now()
        await self._restore_replication()
        phase5_end = datetime.now()
        phases.append({
            'phase': 'recovery',
            'duration': (phase5_end - phase5_start).total_seconds(),
            'status': 'COMPLETED'
        })

        overall_status = 'PASSED' if all(p['status'] == 'COMPLETED' for p in phases) else 'FAILED'

        return {
            'test': 'database_failover',
            'status': overall_status,
            'phases': phases,
            'validation_result': validation_result,
            'timestamp': datetime.now().isoformat()
        }

    async def generate_comprehensive_report(self, period: str = 'monthly'):
        """Generate comprehensive test reports"""
        if period == 'monthly':
            return await self._generate_monthly_report()
        elif period == 'quarterly':
            return await self._generate_quarterly_report()
        elif period == 'annual':
            return await self._generate_annual_report()
        else:
            raise ValueError(f"Unknown report period: {period}")

    async def _generate_monthly_report(self):
        """Generate monthly comprehensive report"""
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)

        # Collect test data for the month
        test_data = await self._collect_test_data(start_date, end_date)

        # Calculate metrics
        metrics = await self._calculate_monthly_metrics(test_data)

        # Generate report
        report = {
            'report_type': 'monthly_comprehensive',
            'period': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            },
            'summary': {
                'total_tests': len(test_data),
                'success_rate': metrics['success_rate'],
                'average_rto': metrics['average_rto'],
                'rto_compliance_rate': metrics['rto_compliance_rate']
            },
            'detailed_results': test_data,
            'recommendations': await self._generate_recommendations(metrics),
            'next_actions': await self._identify_next_actions(metrics)
        }

        # Save report
        await self._save_report(report, 'monthly')
        return report

# Usage example
async def main():
    tester = ContinuousDRTester()

    # Run daily health checks
    daily_results = await tester.run_daily_health_checks()

    # Run weekly failover test
    weekly_result = await tester.execute_weekly_failover_test('database')

    # Generate monthly report
    monthly_report = await tester.generate_comprehensive_report('monthly')

    print(f"Testing completed. Monthly report: {monthly_report['summary']}")

if __name__ == "__main__":
    asyncio.run(main())
```

## 8. Интеграция с мониторингом

### 8.1 Prometheus Metrics для DR Testing

```yaml
# dr_testing_metrics.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: dr-testing-metrics
  namespace: monitoring
spec:
  groups:
    - name: dr_testing
      interval: 30s
      rules:
        - record: dr_test:success_rate_24h
          expr: |
            (
              sum(rate(dr_test_success_total[24h])) /
              sum(rate(dr_test_total[24h]))
            ) * 100

        - record: dr_test:average_rto_24h
          expr: |
            avg(dr_test_rto_seconds[24h])

        - record: dr_test:rto_compliance_rate_24h
          expr: |
            (
              sum(rate(dr_test_rto_compliance_total[24h])) /
              sum(rate(dr_test_total[24h]))
            ) * 100

        - alert: DRTestFailureRate
          expr: dr_test:success_rate_24h < 95
          for: 5m
          labels:
            severity: warning
            component: dr_testing
          annotations:
            summary: "DR test failure rate is high"
            description: "DR test success rate is {{ $value }}% (target: 95%)"

        - alert: DRTestRTOExceeded
          expr: dr_test:average_rto_24h > 3600
          for: 5m
          labels:
            severity: critical
            component: dr_testing
          annotations:
            summary: "DR test RTO target exceeded"
            description: "Average RTO is {{ $value }}s (target: 3600s)"
```

### 8.2 Grafana Dashboard для DR Testing

```json
{
  "dashboard": {
    "title": "DR Testing Dashboard",
    "panels": [
      {
        "title": "DR Test Success Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "dr_test:success_rate_24h",
            "legendFormat": "Success Rate %"
          }
        ],
        "thresholds": [
          { "color": "red", "value": 0 },
          { "color": "yellow", "value": 90 },
          { "color": "green", "value": 95 }
        ]
      },
      {
        "title": "RTO Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "dr_test_rto_seconds",
            "legendFormat": "Actual RTO"
          },
          {
            "expr": "dr_test_rto_target_seconds",
            "legendFormat": "Target RTO"
          }
        ]
      },
      {
        "title": "Test Execution Timeline",
        "type": "table",
        "targets": [
          {
            "expr": "dr_test_info",
            "format": "table"
          }
        ]
      }
    ]
  }
}
```

## 9. Управление версиями и изменениями

### 9.1 Version Control для Test Scenarios

```yaml
# test_scenario_versioning.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: test-scenario-versions
data:
  versioning_policy.yaml: |
    scenario_lifecycle:
      development: "draft_scenarios"
      testing: "beta_scenarios"
      production: "approved_scenarios"
      retired: "deprecated_scenarios"

    change_management:
      minor_updates: "technical_lead_approval"
      major_changes: "crisis_management_team_approval"
      new_scenarios: "full_stakeholder_approval"

    documentation_requirements:
      change_log: required
      impact_assessment: required
      rollback_procedures: required
      approval_signatures: required
```

## 10. Ссылки и нормативные документы

- **DISASTER_RECOVERY_PLAN.md:** Основные процедуры восстановления
- **BUSINES_CONTINUITY_PLAN.md:** Планы непрерывности бизнеса
- **TestReports.md:** Шаблоны отчетности по тестированию
- **CONTRACT_SPECIFICATIONS.md:** TestingSchema и ValidationSchema
- **NIST SP 800-34:** Contingency Planning Guide for Federal Information Systems
- **ISO 22301:2019:** Business Continuity Management Systems requirements
- **ISO 27031:2011:** Information and Communication Technology Readiness for Business Continuity
- **21 CFR Part 11:** Electronic Records and Electronic Signatures regulations
- **WHO GACP Guidelines:** Section 9 - Business Continuity and Disaster Recovery

## 11. История изменений

| Версия | Дата       | Изменения                                                                                                                                                                     | Утверждено               |
| ------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| 1.0    | 2023-06-15 | Первоначальная версия сценариев тестирования                                                                                                                                  | CTO Rodriguez            |
| 1.5    | 2023-12-01 | Добавление автоматизированных сценариев и multi-site exercises                                                                                                                | CTO Rodriguez            |
| 2.0    | 2024-01-15 | Комплексная переработка с детализированными процедурами, автоматизацией тестирования, непрерывным мониторингом, GACP соответствием и интеграцией с CONTRACT_SPECIFICATIONS.md | CTO Rodriguez & COO Chen |

---

**КОНФИДЕНЦИАЛЬНО** - Данный документ содержит критическую информацию о процедурах тестирования и восстановления системы и не подлежит распространению без соответствующей авторизации.
