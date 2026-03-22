---
title: "Scaling Runbook"
system: "GACP-ERP"
version: "1.0"
last_updated: "2025-07-16"
---

# Scaling Runbook

## 1. Horizontal Pod Autoscaler (HPA) Configuration

### 1.1 Current HPA Settings

| Service | Min Replicas | Max Replicas | CPU Target | Memory Target |
|---------|-------------|-------------|------------|---------------|
| api-gateway | 2 | 8 | 70% | 80% |
| cultivation-service | 2 | 6 | 70% | 80% |
| quality-service | 2 | 6 | 70% | 80% |
| financial-service | 2 | 4 | 70% | 80% |
| workforce-service | 2 | 4 | 70% | 80% |
| analytics-service | 2 | 4 | 70% | 80% |
| web-portal | 2 | 6 | 70% | 80% |

### 1.2 Check HPA Status

```bash
kubectl get hpa -n gacp-erp
kubectl describe hpa <service-name> -n gacp-erp
```

## 2. Manual Scaling

### 2.1 Scale Up

```bash
# Scale specific service
kubectl scale deployment <service-name> -n gacp-erp --replicas=<N>

# Example: scale API gateway to 6 replicas
kubectl scale deployment api-gateway -n gacp-erp --replicas=6
```

### 2.2 Scale Down

```bash
# Scale back to minimum
kubectl scale deployment <service-name> -n gacp-erp --replicas=2
```

### 2.3 Temporary HPA Override

```bash
# Increase max replicas temporarily
kubectl patch hpa <service-name> -n gacp-erp \
  --type merge -p '{"spec":{"maxReplicas":12}}'

# Reset after event
kubectl patch hpa <service-name> -n gacp-erp \
  --type merge -p '{"spec":{"maxReplicas":8}}'
```

## 3. When to Scale

| Indicator | Threshold | Action |
|-----------|-----------|--------|
| CPU utilization sustained > 70% | 5+ min | HPA auto-scales (verify) |
| Memory utilization > 80% | Sustained | HPA auto-scales (verify) |
| P95 latency > 500ms | 3+ min | Manual scale + investigate |
| Error rate > 2% | Sustained | Scale up + investigate root cause |
| Scheduled high-traffic event | Pre-event | Pre-scale manually |
| Harvest season (peak) | Seasonal | Increase min replicas |

## 4. Database Scaling

### 4.1 PostgreSQL Read Replicas

```bash
# Check current replica count
kubectl get cluster postgres -n gacp-data -o jsonpath='{.spec.instances}'

# Scale replicas (CloudNativePG)
kubectl patch cluster postgres -n gacp-data \
  --type merge -p '{"spec":{"instances":5}}'
```

### 4.2 Kafka Partitions

```bash
# Increase partitions for high-throughput topic
kubectl exec -n gacp-data kafka-0 -- \
  kafka-topics --alter --topic iot.sensor-readings \
  --partitions 12 --bootstrap-server localhost:9092
```

## 5. Resource Monitoring

```bash
# Node resource usage
kubectl top nodes

# Pod resource usage
kubectl top pods -n gacp-erp --sort-by=cpu

# Check pending pods (insufficient resources)
kubectl get pods -n gacp-erp --field-selector=status.phase=Pending
```

## 6. Capacity Planning

| Resource | Current | Threshold | Action |
|----------|---------|-----------|--------|
| Cluster CPU | Monitor | > 70% sustained | Add worker nodes |
| Cluster Memory | Monitor | > 75% sustained | Add worker nodes |
| PV Storage (PostgreSQL) | 500Gi | > 80% used | Expand PVC |
| PV Storage (VictoriaMetrics) | 500Gi App / 2Ti IoT | > 80% | Expand PVC |
| PV Storage (MinIO) | 1Ti | > 80% | Add disk / expand |
