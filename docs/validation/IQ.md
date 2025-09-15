---
title: "Installation Qualification (IQ)"
system: "ERP for GACP-Compliant Cannabis Cultivation"
version: "1.0"
status: "approved"
last_updated: "2025-09-15"
approved_by: "System Administrat##### VictoriaMetrics Installation for Application Metrics

```bash
# Install VictoriaMetrics cluster for application metrics
helm install victoria-metrics-app vm/victoria-metrics-##### VictoriaMetrics for IoT Time-Se##### EMQX for IoT Communication

```bash
# Install EMQX enterprise MQTT broker for IoT device communication
helm install emqx emqx/emqx \
  --namespace gacp-environmental \
  --set emqxConfig.EMQX_AUTHENTICATION__1__BACKEND="built_in_database" \
  --set emqxConfig.EMQX_AUTHENTICATION__1__MECHANISM="password_based" \
  --set persistence.enabled=true \
  --set persistence.size="100Gi" \
  --set replicaCount=3

# Verify EMQX installation
kubectl get pods -n gacp-environmental | grep emqx
```

**Expected Result**: EMQX cluster running with authentication and persistence

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: _________________ **Date**: _________________

##### Telegraf for IoT Data Collection

```bash
# Install Telegraf for collecting IoT sensor data
helm install telegraf influxdata/telegraf \
  --namespace gacp-environmental \
  --set config.inputs.mqtt_consumer.servers[0]="tcp://emqx:1883" \
  --set config.outputs.prometheus_client.listen=":9273" \
  --set config.outputs.http.url="http://victoria-metrics-iot-vminsert:8480/api/v1/write"

# Verify Telegraf installation
kubectl get pods -n gacp-environmental | grep telegraf
```

**Expected Result**: Telegraf running and configured with EMQX input and VictoriaMetrics output

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: _________________ **Date**: _________________
# Install separate VictoriaMetrics cluster for IoT/environmental data
helm install victoria-metrics-iot vm/victoria-metrics-cluster \
  --namespace gacp-environmental \
  --set vmselect.replicaCount=2 \
  --set vminsert.replicaCount=2 \
  --set vmstorage.replicaCount=3 \
  --set vmstorage.persistentVolume.size="2Ti" \
  --set vmselect.extraArgs.search.maxQueryDuration="1h"

# Verify VictoriaMetrics IoT installation
kubectl get pods -n gacp-environmental | grep victoria-metrics
```

**Expected Result**: VictoriaMetrics IoT cluster running with 2Ti storage

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: _________________ **Date**: _________________space gacp-observability \
  --set vmselect.replicaCount=2 \
  --set vminsert.replicaCount=2 \
  --set vmstorage.replicaCount=3 \
  --set vmstorage.persistentVolume.size="500Gi" \
  --set vmselect.extraArgs.search.maxQueryDuration="10m"

# Verify VictoriaMetrics installation
kubectl get pods -n gacp-observability | grep victoria-metrics
```

**Expected Result**: VictoriaMetrics cluster components running (vmselect, vminsert, vmstorage)

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: _________________ **Date**: _________________egulatory_scope: "FDA 21 CFR Part 11, EU GMP Annex 11, GACP Guidelines"
---

## Installation Qualification (IQ) Protocol

## 1. Purpose

Данный протокол устанавливает процедуры для проверки правильной установки всех компонентов ERP-системы для GACP-совместимого производства каннабиса, включая четкое разграничение между системными метриками приложений и бизнес-метриками среды выращивания.

## 2. Scope

### 2.1 Application Infrastructure

- **Backend Services**: NestJS API, микросервисы
- **Frontend Applications**: Next.js веб-интерфейс
- **Containerization**: Docker/Kubernetes кластер
- **Databases**: PostgreSQL (основные данные), ImmuDB (audit trail)
- **WORM Storage**: Неизменяемое хранилище для GxP compliance
- **Authentication/Authorization**: Keycloak SSO
- **CI/CD Pipelines**: Автоматизированное развертывание

### 2.2 Observability Stack (Application Metrics)

- **Application Monitoring**: VictoriaMetrics cluster для application metrics
- **Distributed Tracing**: Tempo + OpenTelemetry (OTEL)
- **Application Logging**: Loki для централизованных логов
- **Metrics Collection**: OpenTelemetry Collector
- **Visualization**: Grafana для application observability

### 2.3 Business/Environmental Metrics (Cultivation Environment)

- **IoT Message Broker**: EMQX для MQTT коммуникации
- **IoT Data Collection**: Telegraf для сбора метрик с сенсоров
- **Time-Series Database**: Отдельный VictoriaMetrics кластер для IoT данных
- **Environmental Dashboards**: Отдельный Grafana инстанс для cultivation monitoring
- **Real-time Alerting**: VictoriaMetrics AlertManager для критических условий

## 3. Pre-Installation Requirements

### 3.1 Infrastructure Prerequisites

| Component          | Requirement                        | Verification Method        |
| ------------------ | ---------------------------------- | -------------------------- |
| Kubernetes Cluster | v1.28+                             | `kubectl version`          |
| Docker Registry    | Private registry available         | Registry connectivity test |
| Storage Classes    | SSD for databases, HDD for logs    | `kubectl get storageclass` |
| Network Policies   | Micro-segmentation configured      | Network security scan      |
| SSL Certificates   | Valid certificates for all domains | Certificate validation     |

### 3.2 Resource Allocation

#### Application Infrastructure Resources

```yaml
Resources:
  Backend:
    CPU: 2-4 cores per instance
    Memory: 4-8GB per instance
    Storage: 100GB SSD
  Frontend:
    CPU: 1-2 cores
    Memory: 2-4GB
    Storage: 20GB SSD
  PostgreSQL:
    CPU: 4-8 cores
    Memory: 16-32GB
    Storage: 500GB SSD
  ImmuDB:
    CPU: 2-4 cores
    Memory: 8-16GB
    Storage: 200GB SSD
```

#### Observability Stack Resources

```yaml
Observability:
  VictoriaMetrics_App:
    CPU: 4-8 cores
    Memory: 16-32GB
    Storage: 500GB SSD (application metrics retention)
  Tempo:
    CPU: 2-4 cores
    Memory: 8-16GB
    Storage: 200GB SSD (traces retention)
  Loki:
    CPU: 4-8 cores
    Memory: 16-32GB
    Storage: 1TB SSD (logs retention)
  OpenTelemetry_Collector:
    CPU: 2-4 cores
    Memory: 4-8GB
    Storage: 50GB SSD
  Grafana_App:
    CPU: 2-4 cores
    Memory: 4-8GB
    Storage: 50GB SSD
```

#### Environmental Monitoring Resources

```yaml
Environmental:
  VictoriaMetrics_IoT:
    CPU: 4-8 cores
    Memory: 16-32GB
    Storage: 2TB SSD (long-term IoT data retention)
  EMQX:
    CPU: 2-4 cores
    Memory: 4-8GB
    Storage: 100GB SSD (MQTT persistence)
  Telegraf:
    CPU: 1-2 cores
    Memory: 2-4GB
    Storage: 20GB SSD
  Grafana_Environmental:
    CPU: 2-4 cores
    Memory: 4-8GB
    Storage: 50GB SSD
```

## 4. Installation Steps

### 4.1 Core Infrastructure Installation

#### Step IQ-001: Kubernetes Namespace Creation

```bash
# Create namespaces with proper isolation
kubectl create namespace gacp-erp
kubectl create namespace gacp-observability
kubectl create namespace gacp-environmental
kubectl create namespace gacp-security

# Verify namespace creation
kubectl get namespaces | grep gacp
```

**Expected Result**: 4 namespaces created successfully

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\*\*\***\_**\*\*\*\***
**Comments**: \***\*\*\*\*\***\*\*\*\*\***\*\*\*\*\***\_\***\*\*\*\*\***\*\*\*\*\***\*\*\*\*\***

#### Step IQ-002: Database Installation and Configuration

##### PostgreSQL Primary Database

```bash
# Install PostgreSQL with HA configuration
helm install postgresql-primary bitnami/postgresql \
  --namespace gacp-erp \
  --set auth.postgresPassword="secure_password" \
  --set primary.persistence.size="500Gi" \
  --set metrics.enabled=true

# Verify installation
kubectl get pods -n gacp-erp | grep postgresql
```

**Expected Result**: PostgreSQL pod running, metrics endpoint available

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\*\*\***\_**\*\*\*\***

##### ImmuDB for Audit Trail

```bash
# Install ImmuDB for immutable audit records
helm install immudb codenotary/immudb \
  --namespace gacp-erp \
  --set persistence.size="200Gi" \
  --set auth.enabled=true

# Verify ImmuDB installation
kubectl get pods -n gacp-erp | grep immudb
```

**Expected Result**: ImmuDB pod running, authentication enabled

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\*\*\***\_**\*\*\*\***

#### Step IQ-003: Application Observability Stack

##### Prometheus Installation

```bash
# Install Prometheus for application metrics
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace gacp-observability \
  --set prometheus.prometheusSpec.retention="30d" \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage="200Gi"

# Verify Prometheus installation
kubectl get pods -n gacp-observability | grep prometheus
```

**Expected Result**: Prometheus operator and server running

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\*\*\***\_**\*\*\*\***

##### Application Grafana Dashboard

````bash
##### Application Grafana Dashboard

```bash
# Install Grafana for application observability
helm install grafana-app grafana/grafana \
  --namespace gacp-observability \
  --set adminPassword="secure_grafana_password" \
  --set persistence.enabled=true \
  --set persistence.size="50Gi"

# Configure Grafana datasources for application monitoring
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: grafana-app-datasources
  namespace: gacp-observability
data:
  datasources.yaml: |
    apiVersion: 1
    datasources:
    - name: VictoriaMetrics-App
      type: prometheus
      url: http://victoria-metrics-app-vmselect:8481/select/0/prometheus
      access: proxy
      isDefault: true
    - name: Tempo
      type: tempo
      url: http://tempo-query:3100
      access: proxy
    - name: Loki
      type: loki
      url: http://loki:3100
      access: proxy
EOF
````

**Expected Result**: Grafana configured with VictoriaMetrics, Tempo, and Loki datasources

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\*\*\***\_**\*\*\*\***

##### OpenTelemetry Collector Installation

```bash
# Install OpenTelemetry Collector for metrics and traces
helm install otel-collector open-telemetry/opentelemetry-collector \
  --namespace gacp-observability \
  --set config.exporters.prometheusremotewrite.endpoint="http://victoria-metrics-app-vminsert:8480/api/v1/write" \
  --set config.exporters.tempo.endpoint="http://tempo:14250"

# Verify OpenTelemetry Collector installation
kubectl get pods -n gacp-observability | grep otel-collector
```

**Expected Result**: OpenTelemetry Collector running and configured

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\*\*\***\_**\*\*\*\***

##### Tempo Installation for Distributed Tracing

```bash
# Install Tempo for distributed tracing
helm install tempo grafana/tempo \
  --namespace gacp-observability \
  --set persistence.enabled=true \
  --set persistence.size="200Gi" \
  --set config.storage.trace.backend="local" \
  --set config.storage.trace.local.path="/var/tempo"

# Verify Tempo installation
kubectl get pods -n gacp-observability | grep tempo
```

**Expected Result**: Tempo running with persistence enabled

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\*\*\***\_**\*\*\*\***

##### Loki Installation for Application Logs

```bash
# Install Loki for centralized logging
helm install loki grafana/loki \
  --namespace gacp-observability \
  --set persistence.enabled=true \
  --set persistence.size="1Ti" \
  --set config.limits_config.retention_period="720h"

# Install Promtail for log collection
helm install promtail grafana/promtail \
  --namespace gacp-observability \
  --set config.lokiAddress="http://loki:3100/loki/api/v1/push"

# Verify Loki installation
kubectl get pods -n gacp-observability | grep -E "(loki|promtail)"
```

**Expected Result**: Loki and Promtail running, logs being collected

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\*\*\***\_**\*\*\*\***

**Expected Result**: Grafana configured with application datasources

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\*\*\***\_**\*\*\*\***

##### Distributed Tracing (Jaeger)

```bash
# Install Jaeger for distributed tracing
kubectl apply -f https://github.com/jaegertracing/jaeger-operator/releases/download/v1.47.0/jaeger-operator.yaml -n gacp-observability

# Create Jaeger instance
kubectl apply -f - <<EOF
apiVersion: jaegertracing.io/v1
kind: Jaeger
metadata:
  name: gacp-jaeger
  namespace: gacp-observability
spec:
  strategy: production
  storage:
    type: elasticsearch
    elasticsearch:
      nodeCount: 3
      storage:
        size: 100Gi
EOF
```

**Expected Result**: Jaeger collector and query services running

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\*\*\***\_**\*\*\*\***

#### Step IQ-004: Environmental Monitoring Stack

##### InfluxDB for IoT Metrics

```bash
# Install InfluxDB for time-series environmental data
helm install influxdb influxdata/influxdb2 \
  --namespace gacp-environmental \
  --set persistence.size="2Ti" \
  --set adminUser.password="secure_influx_password" \
  --set adminUser.retention_policy="8760h"

# Verify InfluxDB installation
kubectl get pods -n gacp-environmental | grep influxdb
```

**Expected Result**: InfluxDB 2.x running with persistence

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\*\*\***\_**\*\*\*\***

##### MQTT Broker for IoT Communication

```bash
# Install MQTT broker for IoT device communication
helm install mqtt-broker bitnami/emqx \
  --namespace gacp-environmental \
  --set auth.enabled=true \
  --set persistence.enabled=true \
  --set persistence.size="50Gi"

# Verify MQTT broker
kubectl get pods -n gacp-environmental | grep emqx
```

**Expected Result**: MQTT broker running with authentication

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\*\*\***\_**\*\*\*\***

##### Environmental Grafana Dashboard

```bash
# Install separate Grafana instance for environmental metrics
helm install environmental-grafana grafana/grafana \
  --namespace gacp-environmental \
  --set adminPassword="secure_grafana_password" \
  --set persistence.enabled=true \
  --set persistence.size="50Gi"

# Configure VictoriaMetrics datasource for environmental data
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: environmental-grafana-datasources
  namespace: gacp-environmental
data:
  datasources.yaml: |
    apiVersion: 1
    datasources:
    - name: VictoriaMetrics-Environmental
      type: prometheus
      url: http://victoria-metrics-iot-vmselect:8481/select/0/prometheus
      access: proxy
      isDefault: true
    - name: Telegraf-Metrics
      type: prometheus
      url: http://telegraf:9273/metrics
      access: proxy
EOF
```

**Expected Result**: Environmental Grafana with VictoriaMetrics and Telegraf datasources

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\*\*\***\_**\*\*\*\***

### 4.2 Application Deployment

#### Step IQ-005: Backend Services Deployment

```bash
# Deploy GACP-ERP backend services
kubectl apply -f k8s/backend-deployment.yaml -n gacp-erp

# Verify backend deployment
kubectl get deployments -n gacp-erp
kubectl get pods -n gacp-erp | grep backend
```

**Expected Result**: All backend services running and healthy

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\*\*\***\_**\*\*\*\***

#### Step IQ-006: Frontend Application Deployment

```bash
# Deploy frontend application
kubectl apply -f k8s/frontend-deployment.yaml -n gacp-erp

# Verify frontend deployment
kubectl get deployments -n gacp-erp | grep frontend
```

**Expected Result**: Frontend application running and accessible

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\*\*\***\_**\*\*\*\***

### 4.3 Security and Authentication

#### Step IQ-007: Keycloak SSO Installation

```bash
# Install Keycloak for authentication
helm install keycloak bitnami/keycloak \
  --namespace gacp-security \
  --set auth.adminUser="admin" \
  --set auth.adminPassword="secure_keycloak_password" \
  --set postgresql.enabled=true

# Verify Keycloak installation
kubectl get pods -n gacp-security | grep keycloak
```

**Expected Result**: Keycloak running with PostgreSQL backend

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\*\*\***\_**\*\*\*\***

## 5. Configuration Verification

### 5.1 Application Monitoring Configuration

#### Step IQ-008: Verify Application Metrics Collection

```bash
# Check VictoriaMetrics application metrics collection
kubectl port-forward -n gacp-observability svc/victoria-metrics-app-vmselect 8481:8481 &
curl "http://localhost:8481/select/0/prometheus/api/v1/query?query=up{job=~'gacp-.*'}"
```

**Expected Metrics**:

- Application response times
- Database connection pools
- JVM/Node.js memory usage
- HTTP request rates
- Error rates

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\*\*\***\_**\*\*\*\***

#### Step IQ-009: Verify Distributed Tracing

```bash
# Check Tempo is collecting traces
kubectl port-forward -n gacp-observability svc/tempo-query 3100:3100 &
curl http://localhost:3100/api/search/tags
```

**Expected Traces**:

- API endpoint traces
- Database query traces
- Inter-service communication
- Authentication flows

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\*\*\***\_**\*\*\*\***

### 5.2 Environmental Monitoring Configuration

#### Step IQ-010: Verify IoT Data Ingestion

```bash
# Check VictoriaMetrics IoT is receiving environmental data
kubectl port-forward -n gacp-environmental svc/victoria-metrics-iot-vmselect 8481:8481 &
curl "http://localhost:8481/select/0/prometheus/api/v1/query?query=telegraf_mqtt_consumer_messages_received_total"
```

**Expected Metrics**:

- telegraf_mqtt_consumer_messages_received_total
- cultivation_temperature
- cultivation_humidity
- cultivation_ph_level
- cultivation_light_intensity

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\*\*\***\_**\*\*\*\***

#### Step IQ-011: Verify EMQX Connectivity

```bash
# Test EMQX broker connectivity
kubectl port-forward -n gacp-environmental svc/emqx 1883:1883 &
mosquitto_pub -h localhost -p 1883 -t "test/cultivation/sensor" -m '{"temperature":23.5,"humidity":65.2,"timestamp":"2025-09-15T10:00:00Z"}'
mosquitto_sub -h localhost -p 1883 -t "test/cultivation/sensor" -C 1
```

**Expected Result**: Message published and received successfully

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\*\*\***\_**\*\*\*\***

## 6. Security Verification

### 6.1 Network Security

#### Step IQ-012: Verify Network Policies

```bash
# Check network isolation between namespaces
kubectl get networkpolicies --all-namespaces
kubectl describe networkpolicy -n gacp-erp
```

**Expected Policies**:

- Deny all inter-namespace traffic by default
- Allow specific application-to-database communication
- Allow monitoring access to metrics endpoints
- Block direct access to environmental data from application namespace

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\*\*\***\_**\*\*\*\***

### 6.2 Authentication Integration

#### Step IQ-013: Verify SSO Integration

```bash
# Test Keycloak integration with applications
curl -d "client_id=gacp-erp" \
     -d "username=testuser" \
     -d "password=testpass" \
     -d "grant_type=password" \
     "http://keycloak.gacp-security.svc.cluster.local:8080/auth/realms/gacp/protocol/openid-connect/token"
```

**Expected Result**: Valid JWT token returned

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\*\*\***\_**\*\*\*\***

## 7. Data Separation Verification

### 7.1 Application vs Environmental Data Separation

#### Step IQ-014: Verify Metric Namespace Isolation

```bash
# Verify application metrics are in Prometheus
kubectl exec -n gacp-observability deployment/prometheus-server -- \
  promtool query instant 'up{job=~"gacp-.*"}'

# Verify environmental metrics are in InfluxDB
kubectl exec -n gacp-environmental deployment/influxdb -- \
  influx query 'from(bucket:"cultivation") |> range(start:-1h) |> limit(n:1)'
```

**Expected Result**:

- Application metrics only in Prometheus
- Environmental metrics only in InfluxDB
- No cross-contamination of data

**Verification**: ☐ Pass ☐ Fail ☐ N/A
**Tester**: **\*\*\*\***\_**\*\*\*\*** **Date**: **\*\*\*\***\_**\*\*\*\***

## 8. Acceptance Criteria

### 8.1 Infrastructure Acceptance

| Criteria                                       | Status        | Comments |
| ---------------------------------------------- | ------------- | -------- |
| All Kubernetes namespaces created and isolated | ☐ Pass ☐ Fail |          |
| PostgreSQL and ImmuDB operational              | ☐ Pass ☐ Fail |          |
| Application observability stack functional     | ☐ Pass ☐ Fail |          |
| Environmental monitoring stack operational     | ☐ Pass ☐ Fail |          |
| Network security policies enforced             | ☐ Pass ☐ Fail |          |
| Authentication system integrated               | ☐ Pass ☐ Fail |          |

### 8.2 Data Separation Acceptance

| Criteria                                   | Status        | Comments |
| ------------------------------------------ | ------------- | -------- |
| Application metrics isolated in Prometheus | ☐ Pass ☐ Fail |          |
| Environmental data isolated in InfluxDB    | ☐ Pass ☐ Fail |          |
| Separate Grafana instances configured      | ☐ Pass ☐ Fail |          |
| No data cross-contamination verified       | ☐ Pass ☐ Fail |          |
| Proper access controls implemented         | ☐ Pass ☐ Fail |          |

### 8.3 Security Acceptance

| Criteria                                    | Status        | Comments |
| ------------------------------------------- | ------------- | -------- |
| SSL/TLS encryption enabled for all services | ☐ Pass ☐ Fail |          |
| Authentication required for all endpoints   | ☐ Pass ☐ Fail |          |
| Audit trail capture functional              | ☐ Pass ☐ Fail |          |
| Data at rest encryption enabled             | ☐ Pass ☐ Fail |          |
| GxP compliance measures active              | ☐ Pass ☐ Fail |          |

## 9. Sign-off

| Role                 | Name | Signature | Date |
| -------------------- | ---- | --------- | ---- |
| System Administrator |      |           |      |
| QA Manager           |      |           |      |
| IT Security Officer  |      |           |      |
| Validation Engineer  |      |           |      |
| Project Manager      |      |           |      |

**Installation Qualification Status**: ☐ PASSED ☐ FAILED ☐ PASSED WITH DEVIATIONS

**Deviations (if any)**:

---

---

**Recommendations**:

---

---
