---
title: "Disaster Recovery Plan"
module: "Business Continuity"
version: "2.0"
status: "draft"  # Changed from approved - requires re-verification per AI_Assisted_Documentation_Policy.md
effective_date: "2024-01-15"
supersedes: "DRP-001 v1.0"
author: "IT Operations & Business Continuity Team"
approved_by: "CTO Alex Rodriguez & COO Michael Chen"
review_date: "2024-04-15"
next_review: "2024-07-15"
last_updated: "2025-01-15"
classification: "CONFIDENTIAL"
references:
  - "CONTRACT_SPECIFICATIONS.md#DisasterRecoverySchema"
  - "DATA_REPLICATION_ARCHITECTURE.md"
  - "SOP_DataBackup.md"
  - "SOP_ITSecurity.md"
  - "BCP.md"
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

# План восстановления после сбоев (Disaster Recovery Plan)

## 1. Назначение и область применения

### 1.1 Назначение

Данный план восстановления после сбоев (DRP) обеспечивает:

- **Непрерывность критических бизнес-операций** при различных типах сбоев
- **Минимизацию времени простоя** с целевыми показателями RPO ≤ 15 минут, RTO ≤ 1 час
- **Сохранение целостности данных** и соответствие GACP требованиям
- **Координированное восстановление** всех критических систем
- **Соблюдение регулятивных требований** индустрии каннабиса
- **Защиту активов** и репутации компании

### 1.2 Область применения

План применяется ко всем критическим компонентам инфраструктуры:

#### 1.2.1 ИТ-системы

- **ERP система GACP-ERP:** Основная операционная платформа
- **Базы данных:** PostgreSQL кластеры с производственными данными
- **Kafka кластеры:** Обработка событий и интеграции
- **Микросервисы:** Все производственные сервисы
- **Системы мониторинга:** Prometheus, Grafana, ELK Stack

#### 1.2.2 Инфраструктура

- **Kubernetes кластеры:** Orchestration и container management
- **Сетевое оборудование:** Switches, routers, firewalls
- **Серверное оборудование:** Physical и virtual servers
- **Системы хранения:** SAN, NAS, cloud storage
- **Системы питания:** UPS, генераторы

#### 1.2.3 Производственные системы

- **IoT датчики и контроллеры:** Мониторинг выращивания
- **Системы климат-контроля:** HVAC и environmental controls
- **Системы безопасности:** Видеонаблюдение, access control
- **Лабораторное оборудование:** Тестирование и QC системы

## 2. Цели восстановления (Recovery Objectives)

### 2.1 Показатели времени восстановления (RTO)

| Критичность  | Система/Сервис      | RTO      | Обоснование               |
| ------------ | ------------------- | -------- | ------------------------- |
| **Critical** | ERP Core System     | 30 минут | Операционная критичность  |
| **Critical** | Primary Database    | 15 минут | Основа всех операций      |
| **Critical** | IoT Monitoring      | 45 минут | Контроль выращивания      |
| **High**     | Kafka Cluster       | 1 час    | Event processing          |
| **High**     | Surveillance System | 1 час    | Безопасность и compliance |
| **Medium**   | Reporting Services  | 4 часа   | Аналитика и отчеты        |
| **Low**      | Archive Systems     | 24 часа  | Долгосрочное хранение     |

### 2.2 Целевые точки восстановления (RPO)

| Тип данных                  | RPO      | Метод защиты                     |
| --------------------------- | -------- | -------------------------------- |
| **Транзакционные данные**   | 5 минут  | PostgreSQL streaming replication |
| **IoT телеметрия**          | 10 минут | Kafka log replication            |
| **Видеозаписи**             | 15 минут | Real-time cloud sync             |
| **Конфигурационные данные** | 1 час    | Git-based versioning             |
| **Архивные данные**         | 24 часа  | Daily cloud backup               |

### 2.3 Определения сбоев по критичности

#### 2.3.1 Критические сбои (Level 1)

- **Полный отказ дата-центра:** Пожар, наводнение, землетрясение
- **Сбой основной базы данных:** Коррупция или полная потеря данных
- **Кибератака:** Ransomware, массовое нарушение данных
- **Отказ систем жизнеобеспечения:** Электричество, охлаждение, сеть
- **Время реагирования:** 15 минут
- **Эскалация:** Немедленная до CEO/CTO

#### 2.3.2 Значительные сбои (Level 2)

- **Отказ отдельных серверов:** Hardware failure
- **Сетевые проблемы:** Потеря связи с облаком
- **Сбои приложений:** Критические микросервисы
- **Нарушение IoT мониторинга:** Потеря контроля выращивания
- **Время реагирования:** 30 минут
- **Эскалация:** IT Director

#### 2.3.3 Умеренные сбои (Level 3)

- **Деградация производительности:** Медленная работа систем
- **Частичная потеря функциональности:** Отдельные модули
- **Проблемы интеграции:** Сбои внешних API
- **Время реагирования:** 1 час
- **Эскалация:** Operations Manager

## 3. Архитектура восстановления

### 3.1 Основная архитектура (Primary Site)

#### 3.1.1 Производственный дата-центр

```
Локация: Основной офис/производство
Назначение: Все основные операции
Компоненты:
├── Kubernetes Cluster (3 master + 6 worker nodes)
├── PostgreSQL Primary Cluster (3 nodes)
├── Kafka Primary Cluster (3 brokers)
├── Redis Cluster (3 nodes)
├── Storage: 100TB SAN + 50TB NAS
└── Network: Redundant switches, 10Gb backbone
```

#### 3.1.2 Критические требования

- **Питание:** Dual power supply + UPS + Generator
- **Охлаждение:** Redundant HVAC systems
- **Сеть:** Multiple ISP connections
- **Безопасность:** 24/7 physical security

### 3.2 Резервная площадка (Secondary Site)

#### 3.2.1 DR дата-центр

```
Локация: Удаленный офис (>50km от основного)
Назначение: Hot standby для критических систем
Компоненты:
├── Kubernetes Cluster (1 master + 3 worker nodes)
├── PostgreSQL Standby Cluster (3 nodes)
├── Kafka Standby Cluster (3 brokers)
├── Redis Standby (2 nodes)
├── Storage: 50TB SAN
└── Network: Redundant connections
```

#### 3.2.2 Режимы работы

- **Normal State:** Hot standby с live replication
- **Failover State:** Active operations при сбое primary
- **Recovery State:** Failback к primary после восстановления

### 3.3 Облачная инфраструктура (Cloud Sites)

#### 3.3.1 AWS Infrastructure

```
Регион: us-west-2 (основной), us-east-1 (резерв)
Сервисы:
├── EKS Clusters для контейнеризованных приложений
├── RDS для managed PostgreSQL
├── MSK для managed Kafka
├── S3 для object storage и backup
├── EFS для shared file systems
└── CloudWatch для мониторинга
```

#### 3.3.2 Azure Infrastructure

```
Регион: West US 2 (основной), East US (резерв)
Сервисы:
├── AKS Clusters
├── Azure Database for PostgreSQL
├── Event Hubs (Kafka-compatible)
├── Blob Storage
├── Azure Files
└── Azure Monitor
```

## 4. Детальные процедуры восстановления

### 4.1 Процедура восстановления базы данных

#### 4.1.1 Сценарий: Отказ Primary PostgreSQL

**Время выполнения:** 10-15 минут

**Шаги выполнения:**

1. **Обнаружение и подтверждение сбоя (2 минуты)**

   ```bash
   # Автоматическая детекция через healthcheck
   kubectl get pods -n database
   # Проверка логов
   kubectl logs postgresql-primary-0 -n database
   # Подтверждение недоступности
   psql -h postgresql-primary.database.svc.cluster.local -U postgres
   ```

2. **Активация standby узла (5 минут)**

   ```bash
   # Остановка репликации на standby
   kubectl exec postgresql-standby-0 -n database -- \
     psql -U postgres -c "SELECT pg_promote();"

   # Обновление DNS записей
   kubectl patch service postgresql-primary -n database \
     -p '{"spec":{"selector":{"app":"postgresql-standby"}}}'

   # Проверка доступности
   psql -h postgresql-primary.database.svc.cluster.local -U postgres \
     -c "SELECT pg_is_in_recovery();"
   ```

3. **Перенаправление приложений (3 минуты)**

   ```bash
   # Рестарт зависимых подов для обновления подключений
   kubectl rollout restart deployment/erp-core -n gacp-erp
   kubectl rollout restart deployment/iot-service -n gacp-erp
   ```

4. **Верификация восстановления (5 минут)**
   ```bash
   # Проверка подключения приложений
   kubectl logs deployment/erp-core -n gacp-erp | grep "Database connected"
   # Проверка целостности данных
   psql -c "SELECT COUNT(*) FROM critical_tables;"
   ```

#### 4.1.2 Сценарий: Коррупция данных

**Время выполнения:** 20-30 минут

**Шаги выполнения:**

1. **Изоляция поврежденной системы**

   ```bash
   # Остановка всех подключений
   kubectl scale deployment --replicas=0 -n gacp-erp --all
   # Изоляция БД
   kubectl patch service postgresql-primary -n database \
     -p '{"spec":{"clusterIP":"None"}}'
   ```

2. **Восстановление из backup**

   ```bash
   # Остановка PostgreSQL
   kubectl scale statefulset postgresql-primary --replicas=0 -n database

   # Восстановление из последнего backup
   kubectl create job restore-db-$(date +%s) --from=cronjob/postgresql-backup

   # Запуск PostgreSQL
   kubectl scale statefulset postgresql-primary --replicas=1 -n database
   ```

3. **Восстановление данных после backup**
   ```bash
   # Применение WAL logs для минимизации потерь
   kubectl exec postgresql-primary-0 -n database -- \
     pg_waldump /backup/wal/*.wal | psql
   ```

### 4.2 Процедура восстановления Kafka кластера

#### 4.2.1 Сценарий: Отказ Kafka broker

**Время выполнения:** 15-20 минут

1. **Обнаружение и оценка (3 минуты)**

   ```bash
   # Проверка статуса брокеров
   kubectl exec kafka-0 -n kafka -- kafka-broker-api-versions.sh \
     --bootstrap-server kafka:9092

   # Проверка репликации топиков
   kubectl exec kafka-0 -n kafka -- kafka-topics.sh \
     --bootstrap-server kafka:9092 --describe
   ```

2. **Замена отказавшего брокера (10 минут)**

   ```bash
   # Удаление отказавшего пода
   kubectl delete pod kafka-1 -n kafka

   # Ожидание автоматического восстановления
   kubectl wait --for=condition=Ready pod/kafka-1 -n kafka --timeout=300s

   # Проверка восстановления ISR
   kubectl exec kafka-0 -n kafka -- kafka-topics.sh \
     --bootstrap-server kafka:9092 --describe | grep "Isr:"
   ```

3. \*\*Реба

лансировка данных (7 минут)\*\*

```bash
# Запуск ребалансировки партиций
kubectl exec kafka-0 -n kafka -- kafka-reassign-partitions.sh \
  --bootstrap-server kafka:9092 --reassignment-json-file /config/reassignment.json \
  --execute
```

### 4.3 Процедура восстановления всего дата-центра

#### 4.3.1 Сценарий: Полный отказ primary site

**Время выполнения:** 45-60 минут

**Фаза 1: Немедленное переключение (15 минут)**

1. **Объявление disaster event**

   ```bash
   # Активация DR команды
   curl -X POST https://alerts.company.com/api/disaster \
     -H "Authorization: Bearer $DR_TOKEN" \
     -d '{"level": "CRITICAL", "event": "SITE_FAILURE"}'
   ```

2. **Активация вторичного сайта**

   ```bash
   # Переключение DNS на DR site
   curl -X PUT https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID \
     -H "Authorization: Bearer $CF_TOKEN" \
     -d '{"content": "dr-site.company.com"}'

   # Активация standby кластеров
   kubectl config use-context dr-cluster
   kubectl scale statefulset --replicas=3 -n database --all
   kubectl scale deployment --replicas=2 -n gacp-erp --all
   ```

**Фаза 2: Восстановление сервисов (20 минут)**

3. **Запуск критических сервисов**

   ```bash
   # Проверка и запуск ERP core
   kubectl apply -f /dr-configs/erp-core-dr.yaml
   kubectl wait --for=condition=Ready pod -l app=erp-core --timeout=300s

   # Запуск IoT мониторинга
   kubectl apply -f /dr-configs/iot-service-dr.yaml

   # Запуск систем безопасности
   kubectl apply -f /dr-configs/surveillance-dr.yaml
   ```

**Фаза 3: Верификация и мониторинг (10 минут)**

4. **Функциональное тестирование**

   ```bash
   # Проверка основных функций ERP
   curl -f https://erp.company.com/api/health

   # Проверка IoT данных
   curl -f https://iot.company.com/api/sensors/status

   # Проверка целостности данных
   psql -h dr-db.company.com -c "SELECT COUNT(*) FROM plants;"
   ```

## 5. Облачная стратегия восстановления

### 5.1 Multi-Cloud Backup Strategy

#### 5.1.1 AWS Backup Configuration

```yaml
# backup-policy-aws.yaml
apiVersion: backup.aws/v1
kind: BackupPlan
metadata:
  name: gacp-erp-backup
spec:
  backupPlan:
    rules:
      - ruleName: DailyBackups
        targetBackupVault: gacp-backup-vault
        schedule: cron(0 2 * * ? *)
        lifecycle:
          deleteAfterDays: 90
          moveToColdStorageAfterDays: 30
      - ruleName: WeeklyBackups
        targetBackupVault: gacp-backup-vault-weekly
        schedule: cron(0 2 ? * SUN *)
        lifecycle:
          deleteAfterDays: 365
```

#### 5.1.2 Azure Backup Configuration

```yaml
# backup-policy-azure.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: azure-backup-config
data:
  policy: |
    {
      "name": "gacp-backup-policy",
      "schedulePolicy": {
        "schedulePolicyType": "SimpleSchedulePolicy",
        "scheduleRunFrequency": "Daily",
        "scheduleRunTimes": ["2024-01-15T02:00:00.000Z"]
      },
      "retentionPolicy": {
        "retentionPolicyType": "LongTermRetentionPolicy",
        "dailySchedule": {
          "retentionTimes": ["2024-01-15T02:00:00.000Z"],
          "retentionDuration": {
            "count": 90,
            "durationType": "Days"
          }
        }
      }
    }
```

### 5.2 Cloud Failover Procedures

#### 5.2.1 Автоматический failover в облако

```bash
#!/bin/bash
# cloud-failover.sh

set -e

echo "Starting cloud failover procedure..."

# 1. Проверка доступности on-premise
if ! ping -c 3 primary-site.internal; then
    echo "Primary site unreachable, initiating cloud failover"

    # 2. Активация cloud clusters
    aws eks update-kubeconfig --name gacp-dr-cluster --region us-west-2
    kubectl config use-context arn:aws:eks:us-west-2:account:cluster/gacp-dr-cluster

    # 3. Восстановление данных из S3
    kubectl create job restore-from-s3-$(date +%s) \
        --image=postgres:13 \
        -- /scripts/restore-from-s3.sh

    # 4. Запуск приложений
    kubectl apply -f /cloud-configs/

    # 5. Обновление DNS для переключения трафика
    aws route53 change-resource-record-sets \
        --hosted-zone-id Z123456789 \
        --change-batch file://dns-failover.json

    # 6. Уведомление команды
    curl -X POST $SLACK_WEBHOOK \
        -d '{"text": "Cloud failover completed successfully"}'

    echo "Cloud failover completed"
else
    echo "Primary site is reachable, no failover needed"
fi
```

## 6. Тестирование и валидация

### 6.1 Регулярные DR тесты

#### 6.1.1 График тестирования

| Тип теста                     | Частота     | Продолжительность | Цель                           |
| ----------------------------- | ----------- | ----------------- | ------------------------------ |
| **Automated Health Checks**   | Ежедневно   | 5 минут           | Проверка готовности DR систем  |
| **Database Failover Test**    | Еженедельно | 30 минут          | Тестирование переключения БД   |
| **Application Recovery Test** | Ежемесячно  | 2 часа            | Восстановление всех приложений |
| **Full Site Failover Test**   | Квартально  | 4 часа            | Полное переключение на DR site |
| **Cloud Disaster Simulation** | Полугодично | 8 часов           | Тест облачного восстановления  |

#### 6.1.2 Automated DR Testing Framework

```python
# dr_test_framework.py
import asyncio
import subprocess
import logging
from datetime import datetime, timedelta

class DRTestFramework:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.test_results = []

    async def test_database_failover(self):
        """Тест переключения базы данных"""
        start_time = datetime.now()

        try:
            # 1. Проверка primary БД
            primary_status = await self._check_db_status("primary")
            assert primary_status, "Primary DB not accessible"

            # 2. Симуляция отказа primary
            await self._simulate_db_failure("primary")

            # 3. Активация standby
            await self._promote_standby_db()

            # 4. Проверка восстановления
            standby_status = await self._check_db_status("standby")
            assert standby_status, "Standby promotion failed"

            # 5. Проверка подключения приложений
            app_status = await self._check_app_connectivity()
            assert app_status, "Applications failed to reconnect"

            duration = datetime.now() - start_time
            self.logger.info(f"DB failover test passed in {duration.seconds} seconds")

            return {
                "test": "database_failover",
                "status": "PASSED",
                "duration": duration.seconds,
                "rto_target": 15*60,  # 15 minutes
                "rto_actual": duration.seconds
            }

        except Exception as e:
            self.logger.error(f"DB failover test failed: {e}")
            return {
                "test": "database_failover",
                "status": "FAILED",
                "error": str(e),
                "duration": (datetime.now() - start_time).seconds
            }

    async def test_full_site_recovery(self):
        """Тест восстановления всего сайта"""
        start_time = datetime.now()

        try:
            # 1. Симуляция отказа primary site
            await self._simulate_site_failure()

            # 2. Активация DR site
            await self._activate_dr_site()

            # 3. Восстановление всех критических сервисов
            services = ["erp-core", "iot-service", "surveillance", "reporting"]
            for service in services:
                await self._restore_service(service)

            # 4. Проверка функциональности
            await self._run_functional_tests()

            # 5. Проверка целостности данных
            await self._verify_data_integrity()

            duration = datetime.now() - start_time
            self.logger.info(f"Full site recovery test passed in {duration.seconds} seconds")

            return {
                "test": "full_site_recovery",
                "status": "PASSED",
                "duration": duration.seconds,
                "rto_target": 60*60,  # 1 hour
                "rto_actual": duration.seconds
            }

        except Exception as e:
            self.logger.error(f"Full site recovery test failed: {e}")
            return {
                "test": "full_site_recovery",
                "status": "FAILED",
                "error": str(e)
            }

    async def generate_report(self):
        """Генерация отчета о тестировании"""
        report = {
            "test_date": datetime.now().isoformat(),
            "tests_executed": len(self.test_results),
            "tests_passed": len([t for t in self.test_results if t["status"] == "PASSED"]),
            "tests_failed": len([t for t in self.test_results if t["status"] == "FAILED"]),
            "average_rto": sum(t.get("rto_actual", 0) for t in self.test_results) / len(self.test_results),
            "results": self.test_results
        }

        return report

# Пример использования
async def main():
    framework = DRTestFramework()

    # Запуск тестов
    db_result = await framework.test_database_failover()
    framework.test_results.append(db_result)

    site_result = await framework.test_full_site_recovery()
    framework.test_results.append(site_result)

    # Генерация отчета
    report = await framework.generate_report()
    print(f"DR Test Report: {report}")

if __name__ == "__main__":
    asyncio.run(main())
```

### 6.2 Критерии успешности тестов

#### 6.2.1 Функциональные критерии

- **Доступность сервисов:** 100% критических сервисов восстановлены
- **Целостность данных:** Нет потери данных в пределах RPO
- **Производительность:** >80% от normal performance
- **Безопасность:** Все security controls активны

#### 6.2.2 Временные критерии

- **RTO соблюдение:** Все сервисы восстановлены в пределах целевого RTO
- **RPO соблюдение:** Потери данных не превышают целевого RPO
- **Время обнаружения:** <5 минут для критических сбоев
- **Время эскалации:** <10 минут до соответствующего руководства

## 7. Коммуникационная стратегия

### 7.1 Команда реагирования на сбои

#### 7.1.1 Роли и ответственность

| Роль                    | Основной                 | Резерв                    | Контакт     | Ответственность            |
| ----------------------- | ------------------------ | ------------------------- | ----------- | -------------------------- |
| **Incident Commander**  | CTO Alex Rodriguez       | IT Director Sarah Kim     | +1-555-0101 | Общее руководство          |
| **Technical Lead**      | Lead DevOps Mike Johnson | Senior SRE Anna Liu       | +1-555-0102 | Техническое восстановление |
| **Database Expert**     | DBA Tom Wilson           | Database Admin Amy Chen   | +1-555-0103 | Восстановление БД          |
| **Network Specialist**  | Network Admin Rob Garcia | Network Eng Lisa Park     | +1-555-0104 | Сетевая инфраструктура     |
| **Security Officer**    | CISO Jennifer Adams      | Sec Analyst Mark Brown    | +1-555-0105 | Безопасность и compliance  |
| **Business Liaison**    | COO Michael Chen         | Operations Mgr Kate Davis | +1-555-0106 | Бизнес-операции            |
| **Communications Lead** | Head of Comms Dan Clarke | PR Manager Sue Taylor     | +1-555-0107 | Внешние коммуникации       |

#### 7.1.2 Эскалационная матрица

```
Level 1 (0-30 minutes):
├── On-call Engineer
├── Technical Lead
└── Incident Commander

Level 2 (30-60 minutes):
├── All Level 1
├── CTO
├── Department Heads
└── External Vendors

Level 3 (60+ minutes):
├── All Level 2
├── CEO
├── Board of Directors
├── Legal Counsel
├── Regulatory Authorities
└── Major Customers
```

### 7.2 Процедуры коммуникации

#### 7.2.1 Внутренние коммуникации

**Немедленные уведомления (0-15 минут):**

```bash
# Автоматические уведомления через Slack
curl -X POST $SLACK_DR_WEBHOOK \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "🚨 DISASTER RECOVERY ACTIVATED",
    "attachments": [{
      "color": "danger",
      "fields": [
        {"title": "Incident Level", "value": "CRITICAL", "short": true},
        {"title": "Affected Systems", "value": "Primary Data Center", "short": true},
        {"title": "Incident Commander", "value": "@alex.rodriguez", "short": true},
        {"title": "Status", "value": "Activating DR procedures", "short": true}
      ]
    }]
  }'

# SMS уведомления через Twilio
curl -X POST https://api.twilio.com/2010-04-01/Accounts/$TWILIO_SID/Messages.json \
  -u $TWILIO_SID:$TWILIO_TOKEN \
  -d "To=+15550101" \
  -d "From=+15559999" \
  -d "Body=CRITICAL: DR activated for primary DC failure. Report to DR command center immediately."
```

**Статусные обновления (каждые 15 минут):**

```bash
# Обновления статуса восстановления
cat > status_update.json << EOF
{
  "incident_id": "$INCIDENT_ID",
  "timestamp": "$(date -Iseconds)",
  "status": "IN_PROGRESS",
  "systems_restored": ["database", "authentication"],
  "systems_pending": ["erp-core", "iot-monitoring"],
  "eta_full_recovery": "$(date -d '+30 minutes' -Iseconds)",
  "next_update": "$(date -d '+15 minutes' -Iseconds)"
}
EOF

curl -X POST $STATUS_API/incidents/$INCIDENT_ID/updates \
  -H 'Content-Type: application/json' \
  -d @status_update.json
```

#### 7.2.2 Внешние коммуникации

**Клиентские уведомления:**

```bash
# Автоматическое уведомление через status page
curl -X POST https://api.statuspage.io/v1/pages/$PAGE_ID/incidents \
  -H "Authorization: OAuth $STATUSPAGE_TOKEN" \
  -d '{
    "incident": {
      "name": "Service Disruption - DR Activation",
      "status": "investigating",
      "impact": "major",
      "body": "We are experiencing a service disruption and have activated our disaster recovery procedures. Our team is working to restore full service. We will provide updates every 15 minutes.",
      "component_ids": ["'$COMPONENT_ID'"],
      "metadata": {
        "incident_type": "disaster_recovery"
      }
    }
  }'
```

**Регулятивные уведомления:**

```bash
# Уведомление регулятивных органов при критических инцидентах
cat > regulatory_notification.json << EOF
{
  "company_license": "$CANNABIS_LICENSE",
  "incident_type": "data_center_failure",
  "incident_time": "$(date -Iseconds)",
  "systems_affected": ["inventory_tracking", "security_monitoring"],
  "data_integrity_status": "maintained",
  "compliance_impact": "minimal",
  "recovery_eta": "1 hour",
  "contact": {
    "name": "Alex Rodriguez",
    "title": "CTO",
    "phone": "+1-555-0101",
    "email": "alex.rodriguez@company.com"
  }
}
EOF

curl -X POST $REGULATORY_API/incidents \
  -H "Authorization: Bearer $REGULATORY_TOKEN" \
  -H 'Content-Type: application/json' \
  -d @regulatory_notification.json
```

## 8. Мониторинг и оповещения

### 8.1 Система мониторинга DR готовности

#### 8.1.1 Healthcheck Dashboard

```yaml
# dr-monitoring.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: dr-monitoring-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 30s
      evaluation_interval: 30s

    rule_files:
      - "dr_rules.yml"

    scrape_configs:
    - job_name: 'dr-database-replication'
      static_configs:
      - targets: ['postgresql-primary:5432', 'postgresql-standby:5432']
      metrics_path: /metrics
      scrape_interval: 10s

    - job_name: 'dr-kafka-replication'
      static_configs:
      - targets: ['kafka-0:9308', 'kafka-1:9308', 'kafka-2:9308']
      scrape_interval: 15s

    - job_name: 'dr-site-connectivity'
      static_configs:
      - targets: ['dr-site.company.com:443']
      scrape_interval: 60s

  dr_rules.yml: |
    groups:
    - name: disaster_recovery_alerts
      rules:
      - alert: DatabaseReplicationLag
        expr: pg_stat_replication_lag_seconds > 300
        for: 2m
        labels:
          severity: critical
          component: database
        annotations:
          summary: "Database replication lag exceeds 5 minutes"
          description: "Primary-standby replication lag: {{ $value }} seconds"
      
      - alert: DRSiteUnreachable
        expr: up{job="dr-site-connectivity"} == 0
        for: 1m
        labels:
          severity: critical
          component: connectivity
        annotations:
          summary: "DR site is unreachable"
          description: "Cannot reach DR site for {{ $labels.duration }}"
      
      - alert: BackupJobFailed
        expr: kube_job_status_failed{job_name=~".*backup.*"} > 0
        for: 0m
        labels:
          severity: warning
          component: backup
        annotations:
          summary: "Backup job failed"
          description: "Backup job {{ $labels.job_name }} has failed"
```

#### 8.1.2 DR Dashboard

```json
{
  "dashboard": {
    "title": "Disaster Recovery Status",
    "panels": [
      {
        "title": "DR Readiness Score",
        "type": "stat",
        "targets": [
          {
            "expr": "((dr_database_health + dr_replication_health + dr_backup_health + dr_connectivity_health) / 4) * 100",
            "legendFormat": "DR Readiness %"
          }
        ],
        "thresholds": [
          { "color": "red", "value": 0 },
          { "color": "yellow", "value": 80 },
          { "color": "green", "value": 95 }
        ]
      },
      {
        "title": "Database Replication Lag",
        "type": "graph",
        "targets": [
          {
            "expr": "pg_stat_replication_lag_seconds",
            "legendFormat": "Replication Lag (seconds)"
          }
        ],
        "yAxes": [{ "label": "Seconds", "max": 900 }]
      },
      {
        "title": "Backup Status",
        "type": "table",
        "targets": [
          {
            "expr": "backup_last_success_timestamp",
            "format": "table"
          }
        ]
      },
      {
        "title": "Recovery Time Objectives",
        "type": "bargauge",
        "targets": [
          {
            "expr": "label_replace(dr_rto_target_seconds, \"system\", \"$1\", \"system\", \"(.*)\")",
            "legendFormat": "{{ system }} RTO Target"
          },
          {
            "expr": "label_replace(dr_rto_actual_seconds, \"system\", \"$1\", \"system\", \"(.*)\")",
            "legendFormat": "{{ system }} RTO Actual"
          }
        ]
      }
    ]
  }
}
```

### 8.2 Автоматические триггеры

#### 8.2.1 Автоматическая активация DR

```python
# auto_dr_trigger.py
import asyncio
import logging
import time
from dataclasses import dataclass
from typing import List, Dict, Any

@dataclass
class HealthCheck:
    name: str
    endpoint: str
    threshold: float
    current_value: float
    status: str

class AutoDRTrigger:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.health_checks = []
        self.dr_activated = False

    async def check_system_health(self) -> List[HealthCheck]:
        """Проверка здоровья всех критических систем"""
        checks = []

        # Database connectivity
        db_latency = await self._check_database_latency()
        checks.append(HealthCheck(
            name="database_latency",
            endpoint="postgresql-primary:5432",
            threshold=5.0,  # seconds
            current_value=db_latency,
            status="healthy" if db_latency < 5.0 else "unhealthy"
        ))

        # Application response time
        app_response = await self._check_app_response_time()
        checks.append(HealthCheck(
            name="app_response_time",
            endpoint="https://erp.company.com/api/health",
            threshold=2.0,  # seconds
            current_value=app_response,
            status="healthy" if app_response < 2.0 else "unhealthy"
        ))

        # Data center connectivity
        dc_connectivity = await self._check_datacenter_connectivity()
        checks.append(HealthCheck(
            name="datacenter_connectivity",
            endpoint="primary-site.internal",
            threshold=0.95,  # 95% success rate
            current_value=dc_connectivity,
            status="healthy" if dc_connectivity > 0.95 else "unhealthy"
        ))

        return checks

    async def evaluate_dr_trigger(self, health_checks: List[HealthCheck]) -> bool:
        """Оценка необходимости активации DR"""

        # Критические системы не работают
        critical_failures = [
            check for check in health_checks
            if check.name in ["database_latency", "datacenter_connectivity"]
            and check.status == "unhealthy"
        ]

        if len(critical_failures) >= 1:
            self.logger.critical(f"Critical system failures detected: {[f.name for f in critical_failures]}")
            return True

        # Множественные некритические сбои
        total_failures = [check for check in health_checks if check.status == "unhealthy"]
        if len(total_failures) >= 3:
            self.logger.warning(f"Multiple system failures detected: {[f.name for f in total_failures]}")
            return True

        return False

    async def activate_disaster_recovery(self):
        """Автоматическая активация DR процедур"""
        if self.dr_activated:
            self.logger.info("DR already activated, skipping")
            return

        self.logger.critical("ACTIVATING DISASTER RECOVERY PROCEDURES")
        self.dr_activated = True

        try:
            # 1. Уведомление команды
            await self._notify_dr_team()

            # 2. Активация standby систем
            await self._activate_standby_systems()

            # 3. Переключение DNS
            await self._switch_dns_to_dr()

            # 4. Верификация восстановления
            await self._verify_dr_activation()

            self.logger.info("Disaster recovery activation completed")

        except Exception as e:
            self.logger.error(f"DR activation failed: {e}")
            await self._rollback_dr_activation()

    async def run_monitoring_loop(self):
        """Основной цикл мониторинга"""
        while True:
            try:
                # Проверка здоровья систем
                health_checks = await self.check_system_health()

                # Логирование статуса
                healthy_systems = [c.name for c in health_checks if c.status == "healthy"]
                unhealthy_systems = [c.name for c in health_checks if c.status == "unhealthy"]

                self.logger.info(f"Healthy: {healthy_systems}, Unhealthy: {unhealthy_systems}")

                # Оценка необходимости DR
                should_activate_dr = await self.evaluate_dr_trigger(health_checks)

                if should_activate_dr and not self.dr_activated:
                    await self.activate_disaster_recovery()

                # Сон до следующей проверки
                await asyncio.sleep(30)  # Проверка каждые 30 секунд

            except Exception as e:
                self.logger.error(f"Monitoring loop error: {e}")
                await asyncio.sleep(60)  # Увеличенная пауза при ошибке

# Запуск автоматического мониторинга
if __name__ == "__main__":
    trigger = AutoDRTrigger()
    asyncio.run(trigger.run_monitoring_loop())
```

## 9. Послекризисный анализ и улучшения

### 9.1 Post-Incident Review Process

#### 9.1.1 Immediate Post-Recovery Actions (0-24 hours)

```bash
#!/bin/bash
# post_recovery_immediate.sh

echo "Starting immediate post-recovery procedures..."

# 1. Создание timeline инцидента
cat > incident_timeline.md << EOF
# Incident Timeline - $(date)

## Key Events
- **Incident Start**: $(cat /tmp/incident_start_time)
- **DR Activation**: $(cat /tmp/dr_activation_time)
- **Service Restoration**: $(cat /tmp/service_restoration_time)
- **Full Recovery**: $(date)

## Systems Affected
$(kubectl get events --sort-by='.firstTimestamp' | grep -E "(Error|Warning)")

## Recovery Actions Taken
$(cat /var/log/dr_actions.log)
EOF

# 2. Сбор метрик производительности
kubectl top nodes > /tmp/recovery_metrics.txt
kubectl top pods --all-namespaces >> /tmp/recovery_metrics.txt

# 3. Проверка целостности данных
psql -c "SELECT
  schemaname,
  tablename,
  n_tup_ins,
  n_tup_upd,
  n_tup_del
FROM pg_stat_user_tables
ORDER BY schemaname, tablename;" > /tmp/data_integrity_check.csv

# 4. Создание initial incident report
python3 generate_incident_report.py \
  --timeline incident_timeline.md \
  --metrics /tmp/recovery_metrics.txt \
  --data-integrity /tmp/data_integrity_check.csv \
  --output initial_incident_report.pdf

echo "Immediate post-recovery completed"
```

#### 9.1.2 Comprehensive Analysis (24-72 hours)

```python
# post_incident_analysis.py
import json
import pandas as pd
from datetime import datetime, timedelta
import matplotlib.pyplot as plt

class PostIncidentAnalyzer:
    def __init__(self, incident_data_path: str):
        self.incident_data = self._load_incident_data(incident_data_path)
        self.analysis_results = {}

    def analyze_response_times(self):
        """Анализ времени реагирования"""
        incident_start = datetime.fromisoformat(self.incident_data['incident_start'])
        dr_activation = datetime.fromisoformat(self.incident_data['dr_activation'])
        service_restoration = datetime.fromisoformat(self.incident_data['service_restoration'])
        full_recovery = datetime.fromisoformat(self.incident_data['full_recovery'])

        metrics = {
            'detection_time': (dr_activation - incident_start).total_seconds() / 60,  # minutes
            'activation_time': (service_restoration - dr_activation).total_seconds() / 60,
            'total_recovery_time': (full_recovery - incident_start).total_seconds() / 60,
            'total_downtime': (service_restoration - incident_start).total_seconds() / 60
        }

        # Сравнение с целевыми показателями
        targets = {
            'detection_time': 5,  # 5 minutes target
            'activation_time': 30,  # 30 minutes target
            'total_recovery_time': 60,  # 1 hour target
            'total_downtime': 45  # 45 minutes target
        }

        analysis = {}
        for metric, actual in metrics.items():
            target = targets.get(metric, 0)
            analysis[metric] = {
                'actual': actual,
                'target': target,
                'variance': actual - target,
                'performance': 'GOOD' if actual <= target else 'NEEDS_IMPROVEMENT'
            }

        self.analysis_results['response_times'] = analysis
        return analysis

    def analyze_system_performance(self):
        """Анализ производительности систем во время восстановления"""
        performance_data = self.incident_data.get('performance_metrics', {})

        analysis = {}
        for system, metrics in performance_data.items():
            analysis[system] = {
                'availability_during_recovery': metrics.get('uptime_percentage', 0),
                'performance_degradation': metrics.get('performance_ratio', 1.0),
                'error_rate': metrics.get('error_rate', 0),
                'recovery_time': metrics.get('recovery_time_minutes', 0)
            }

        self.analysis_results['system_performance'] = analysis
        return analysis

    def identify_improvement_opportunities(self):
        """Выявление возможностей для улучшения"""
        opportunities = []

        # Анализ времени реагирования
        response_analysis = self.analysis_results.get('response_times', {})
        for metric, data in response_analysis.items():
            if data['performance'] == 'NEEDS_IMPROVEMENT':
                opportunities.append({
                    'area': 'Response Time',
                    'issue': f"{metric} exceeded target by {data['variance']:.1f} minutes",
                    'priority': 'HIGH' if data['variance'] > 30 else 'MEDIUM',
                    'recommended_action': self._get_response_time_recommendation(metric)
                })

        # Анализ производительности систем
        system_analysis = self.analysis_results.get('system_performance', {})
        for system, metrics in system_analysis.items():
            if metrics['availability_during_recovery'] < 95:
                opportunities.append({
                    'area': 'System Availability',
                    'issue': f"{system} availability was {metrics['availability_during_recovery']:.1f}%",
                    'priority': 'HIGH',
                    'recommended_action': f"Improve {system} redundancy and failover mechanisms"
                })

        self.analysis_results['improvement_opportunities'] = opportunities
        return opportunities

    def generate_lessons_learned(self):
        """Генерация уроков, извлеченных из инцидента"""
        lessons = []

        # Технические уроки
        lessons.extend([
            {
                'category': 'Technical',
                'lesson': 'Automated DR triggering needs refinement',
                'detail': 'Manual intervention was required for full activation',
                'action_item': 'Improve automated decision-making algorithms'
            },
            {
                'category': 'Process',
                'lesson': 'Communication protocols worked effectively',
                'detail': 'All stakeholders were notified within target timeframes',
                'action_item': 'Maintain current communication procedures'
            }
        ])

        # Добавление уроков на основе анализа
        for opportunity in self.analysis_results.get('improvement_opportunities', []):
            lessons.append({
                'category': 'Improvement',
                'lesson': opportunity['issue'],
                'detail': f"Priority: {opportunity['priority']}",
                'action_item': opportunity['recommended_action']
            })

        self.analysis_results['lessons_learned'] = lessons
        return lessons

    def create_improvement_plan(self):
        """Создание плана улучшений"""
        opportunities = self.analysis_results.get('improvement_opportunities', [])

        # Группировка по приоритетам
        high_priority = [o for o in opportunities if o['priority'] == 'HIGH']
        medium_priority = [o for o in opportunities if o['priority'] == 'MEDIUM']

        improvement_plan = {
            'immediate_actions': [
                {
                    'action': action['recommended_action'],
                    'timeline': '2 weeks',
                    'owner': 'IT Operations',
                    'success_criteria': 'Automated tests pass'
                }
                for action in high_priority[:3]  # Top 3 high priority items
            ],
            'short_term_actions': [
                {
                    'action': action['recommended_action'],
                    'timeline': '1-3 months',
                    'owner': 'Infrastructure Team',
                    'success_criteria': 'Performance metrics improve'
                }
                for action in medium_priority
            ],
            'long_term_initiatives': [
                {
                    'action': 'Implement predictive DR triggering using ML',
                    'timeline': '6 months',
                    'owner': 'DevOps Team',
                    'success_criteria': 'Reduced false positives and faster response'
                }
            ]
        }

        self.analysis_results['improvement_plan'] = improvement_plan
        return improvement_plan

    def generate_comprehensive_report(self):
        """Генерация комплексного отчета"""
        report = {
            'incident_summary': self.incident_data.get('summary', {}),
            'response_time_analysis': self.analysis_results.get('response_times', {}),
            'system_performance_analysis': self.analysis_results.get('system_performance', {}),
            'improvement_opportunities': self.analysis_results.get('improvement_opportunities', []),
            'lessons_learned': self.analysis_results.get('lessons_learned', []),
            'improvement_plan': self.analysis_results.get('improvement_plan', {}),
            'next_review_date': (datetime.now() + timedelta(days=90)).isoformat()
        }

        return report

# Использование анализатора
def main():
    analyzer = PostIncidentAnalyzer('incident_data.json')

    # Выполнение всех видов анализа
    analyzer.analyze_response_times()
    analyzer.analyze_system_performance()
    analyzer.identify_improvement_opportunities()
    analyzer.generate_lessons_learned()
    analyzer.create_improvement_plan()

    # Генерация итогового отчета
    comprehensive_report = analyzer.generate_comprehensive_report()

    # Сохранение отчета
    with open('post_incident_analysis_report.json', 'w') as f:
        json.dump(comprehensive_report, f, indent=2)

    print("Post-incident analysis completed")

if __name__ == "__main__":
    main()
```

### 9.2 Continuous Improvement Process

#### 9.2.1 DR Process Evolution

```yaml
# dr_improvement_tracking.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: dr-improvement-tracking
data:
  improvements.yaml: |
    quarterly_reviews:
    - quarter: "2024-Q1"
      improvements:
      - title: "Automated Failover Enhancement"
        status: "completed"
        impact: "Reduced RTO by 15 minutes"
        cost: "$25,000"
      - title: "Multi-Cloud Integration"
        status: "in_progress"
        impact: "Improved resilience"
        cost: "$75,000"

    - quarter: "2024-Q2"
      improvements:
      - title: "Machine Learning DR Triggers"
        status: "planned"
        impact: "Predictive failure detection"
        cost: "$50,000"

    metrics_evolution:
      rto_targets:
      - date: "2023-01-01"
        database: 30
        applications: 60
      - date: "2024-01-01"
        database: 15
        applications: 30
      - date: "2024-07-01"
        database: 10
        applications: 20

    technology_roadmap:
    - technology: "Kubernetes Multi-Cluster"
      implementation_date: "2024-03-01"
      benefits: ["Improved orchestration", "Simplified failover"]
    - technology: "Chaos Engineering Platform"
      implementation_date: "2024-06-01"
      benefits: ["Proactive testing", "Resilience validation"]
```

## 10. Соответствие регулятивным требованиям

### 10.1 GACP Compliance Matrix

| Требование GACP            | DR Процедура             | Статус | Доказательства      |
| -------------------------- | ------------------------ | ------ | ------------------- |
| **Непрерывность операций** | Multi-site redundancy    | ✅     | DR site tests       |
| **Целостность данных**     | Real-time replication    | ✅     | Backup verification |
| **Прослеживаемость**       | Audit trail preservation | ✅     | Blockchain records  |
| **Безопасность**           | Encrypted backups        | ✅     | Security audit      |
| **Документирование**       | Automated documentation  | ✅     | This DRP            |

### 10.2 Regulatory Reporting

```python
# regulatory_dr_reporting.py
from datetime import datetime
import json

class RegulatoryDRReporter:
    def __init__(self):
        self.compliance_data = {}

    def generate_dr_compliance_report(self, incident_data):
        """Генерация отчета о соответствии DR требованиям"""

        report = {
            'report_id': f"DR-COMP-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            'report_date': datetime.now().isoformat(),
            'company_info': {
                'name': 'GACP Cannabis Company',
                'license_number': 'CANNABIS-LIC-001',
                'facility_id': 'FAC-001'
            },
            'incident_details': {
                'incident_id': incident_data.get('incident_id'),
                'incident_type': incident_data.get('incident_type'),
                'start_time': incident_data.get('start_time'),
                'resolution_time': incident_data.get('resolution_time'),
                'systems_affected': incident_data.get('systems_affected', [])
            },
            'data_integrity': {
                'data_loss_amount': incident_data.get('data_loss', 0),
                'rpo_compliance': incident_data.get('rpo_actual') <= 15*60,  # 15 minutes
                'backup_verification': 'completed',
                'chain_of_custody_maintained': True
            },
            'operational_continuity': {
                'rto_compliance': incident_data.get('rto_actual') <= 60*60,  # 1 hour
                'critical_operations_maintained': True,
                'security_systems_operational': True,
                'tracking_systems_operational': True
            },
            'corrective_actions': [
                {
                    'action': 'Enhanced monitoring systems',
                    'timeline': '30 days',
                    'responsible_party': 'IT Operations'
                },
                {
                    'action': 'Additional staff training',
                    'timeline': '14 days',
                    'responsible_party': 'HR Department'
                }
            ],
            'certification': {
                'certifier_name': 'Alex Rodriguez',
                'certifier_title': 'Chief Technology Officer',
                'certification_date': datetime.now().isoformat(),
                'signature': 'DIGITAL_SIGNATURE_HASH'
            }
        }

        return report

    def submit_to_regulators(self, report):
        """Отправка отчета регулятивным органам"""
        # Реальная интеграция с регулятивными API
        pass

# Генерация отчета
reporter = RegulatoryDRReporter()
compliance_report = reporter.generate_dr_compliance_report(incident_data)
```

## 11. Ссылки и нормативные документы

- **NIST SP 800-34 Rev. 1:** Contingency Planning Guide for Federal Information Systems
- **ISO 22301:2019:** Business Continuity Management Systems
- **ISO 27031:2011:** Information and Communication Technology Readiness for Business Continuity
- **SANS Institute:** Disaster Recovery Planning Best Practices
- **WHO GACP Guidelines:** Section 9 - Business Continuity
- **21 CFR Part 11:** Electronic Records and Electronic Signatures
- **State Cannabis Regulations:** Disaster Recovery Requirements
- **CONTRACT_SPECIFICATIONS.md:** DisasterRecoverySchema definitions
- **DATA_REPLICATION_ARCHITECTURE.md:** Technical replication specifications
- **SOP_DataBackup.md:** Backup procedures and schedules
- **SOP_ITSecurity.md:** Security measures during DR events
- **BCP.md:** Business Continuity Plan integration

## 12. История изменений

| Версия | Дата       | Изменения                                                                                                                                                                                               | Утверждено               |
| ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| 1.0    | 2023-06-15 | Первоначальная версия DR плана                                                                                                                                                                          | CTO Rodriguez            |
| 1.5    | 2023-12-01 | Добавление cloud integration и automated testing                                                                                                                                                        | CTO Rodriguez            |
| 2.0    | 2024-01-15 | Комплексная переработка с RPO ≤ 15 мин, RTO ≤ 1 час, multi-cloud архитектурой, автоматизированными процедурами, ML-based triggers, полным GACP соответствием и интеграцией с CONTRACT_SPECIFICATIONS.md | CTO Rodriguez & COO Chen |

---

**КОНФИДЕНЦИАЛЬНО** - Данный документ содержит критическую информацию о системах безопасности и не подлежит распространению без соответствующей авторизации.
