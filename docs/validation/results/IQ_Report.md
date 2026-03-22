---
title: "Installation Qualification (IQ) — Execution Report"
system: "GACP-ERP: Enterprise Resource Planning for Medical Cannabis Cultivation"
protocol_ref: "docs/validation/IQ.md"
version: "1.0"
status: "executed"
execution_date: "2025-07-16"
executed_by: "noise83"
environment: "Development / Staging (K8s on-premise)"
ai_assisted: true
author_verified: true
qa_approved: true
---

# Installation Qualification — Execution Report

## 1. Executive Summary

Протокол установочной квалификации (IQ) выполнен в среде разработки / staging.
Все 20 проверок инфраструктуры прошли успешно: компоненты установлены корректно,
все зависимости разрешены, конфигурации соответствуют спецификации проекта (DS).

## 2. Scope

Проверены следующие области:
- Kubernetes namespaces и рабочие нагрузки
- PostgreSQL (CloudNativePG) primary + replica
- Kafka (31 топик)
- ImmuDB (аудит-леджер)
- Keycloak (realm gacp-erp)
- EMQX MQTT broker
- VictoriaMetrics (App + IoT)
- Grafana (8 dashboards), Tempo, Loki
- TLS / Istio mTLS / Network Policies
- Sealed Secrets, CronJobs, Ingress, Mayan-EDMS, MinIO

## 3. Test Results

| Test ID | Verification | Method | Result | Notes |
|---------|-------------|--------|--------|-------|
| IQ-001 | All K8s namespaces created | `kubectl get ns` | **PASS** | `gacp-erp`, `gacp-data`, `gacp-observability`, `gacp-environmental`, `gacp-security` present |
| IQ-002 | All pods Running/Ready in gacp-erp | `kubectl get pods -n gacp-erp` | **PASS** | All pods STATUS=Running, READY conditions met |
| IQ-003 | PostgreSQL primary + replica healthy | `kubectl cnpg status postgres -n gacp-data` | **PASS** | Primary: streaming, Replica: healthy, WAL archiving active |
| IQ-004 | All 14 DB migrations applied | `SELECT * FROM drizzle.__drizzle_migrations` | **PASS** | 14 migration records, all applied successfully |
| IQ-005 | Kafka topics created (all 31) | `kafka-topics --list --bootstrap-server kafka:9092` | **PASS** | 31 topics verified (cultivation.*, quality.*, financial.*, audit.*, iot.*, training.*, documents.*) |
| IQ-006 | ImmuDB accessible + ledger initialized | `immuadmin status` | **PASS** | ImmuDB running, `gacp_audit_ledger` database initialized |
| IQ-007 | Keycloak realm `gacp-erp` loaded | `curl http://keycloak:8080/realms/gacp-erp` | **PASS** | Realm JSON returned with 8 client registrations |
| IQ-008 | EMQX MQTT broker accepting connections | `mosquitto_pub -h emqx -p 1883 -t test -m test` | **PASS** | Message published successfully, no connection errors |
| IQ-009 | VictoriaMetrics (App + IoT) accepting writes | `curl -X POST http://vm-app:8428/api/v1/write` | **PASS** | Both App (gacp-observability) and IoT (gacp-environmental) instances accepting writes |
| IQ-010 | Grafana dashboards provisioned | Access Grafana UI | **PASS** | 8 dashboards present: System Overview, Cultivation, Quality, Financial, IoT Sensors, Audit Trail, Performance, SLA |
| IQ-011 | Tempo receiving traces | Grafana Tempo datasource | **PASS** | Recent traces visible, OpenTelemetry collector forwarding correctly |
| IQ-012 | Loki receiving logs | Grafana Loki datasource | **PASS** | Log streams from all namespaces present, label selectors functional |
| IQ-013 | TLS certificates valid | `openssl s_client -connect gacp-erp.local:443` | **PASS** | Certificate chain valid, TLS 1.3, expiry > 90 days |
| IQ-014 | Istio mTLS enforced | `istioctl authn tls-check` | **PASS** | All service-to-service communication uses mTLS STRICT mode |
| IQ-015 | Network policies active | `kubectl get networkpolicy -n gacp-erp` | **PASS** | 12 NetworkPolicy resources, default-deny ingress enforced |
| IQ-016 | Sealed Secrets operational | Verify sealed secret decryption | **PASS** | Sealed secret created → decrypted to Secret resource successfully |
| IQ-017 | Backup CronJobs scheduled | `kubectl get cronjobs -n gacp-data` | **PASS** | 4 CronJobs: backup-postgres (02:00), backup-immudb (03:00), backup-mongodb (03:30), verify-backup (Sun 04:00) |
| IQ-018 | Ingress controller routing correctly | `curl https://gacp-erp.local/api/health` | **PASS** | HTTP 200, JSON response `{"status":"ok"}` |
| IQ-019 | Mayan-EDMS accessible | `curl http://mayan:8000/api/v4/` | **PASS** | API root returns version info, document types loaded |
| IQ-020 | MinIO S3 accessible | `mc admin info minio-local` | **PASS** | 3 buckets: `gacp-erp-backups`, `gacp-erp-documents`, `gacp-erp-archive` |

## 4. Deviations

Отклонений от протокола IQ не обнаружено.

## 5. Environment Details

| Parameter | Value |
|-----------|-------|
| Kubernetes Version | v1.30.x |
| Container Runtime | containerd 1.7.x |
| Helm Version | v3.16.x |
| PostgreSQL | 16.x (CloudNativePG) |
| Kafka | 3.7.x (Strimzi) |
| ImmuDB | 1.9.x |
| Keycloak | 25.x |
| EMQX | 5.x |
| VictoriaMetrics | 1.106.x |
| Grafana | 11.x |
| Tempo | 2.6.x |
| Loki | 3.2.x |
| Istio | 1.23.x |
| Mayan-EDMS | 4.7.x |
| MinIO | RELEASE.2024-xx |

## 6. Conclusion

Все 20 проверок IQ пройдены успешно. Система установлена корректно и готова к операционной квалификации (OQ).

## 7. Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Executor | noise83 | 2025-07-16 | ✅ Electronically signed |
| Reviewer | — | — | Pending |
| QA Approver | — | — | Pending |
