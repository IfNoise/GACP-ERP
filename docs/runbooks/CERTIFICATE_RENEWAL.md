---
title: "Certificate Renewal Runbook"
system: "GACP-ERP"
version: "1.0"
last_updated: "2025-07-16"
---

# Certificate Renewal Runbook

## 1. cert-manager Auto-Renewal

cert-manager handles automatic renewal for all internal TLS certificates.

### 1.1 Verify cert-manager Status

```bash
# Check cert-manager pods
kubectl get pods -n cert-manager

# List all certificates
kubectl get certificates -A

# Check certificate status
kubectl describe certificate gacp-erp-tls -n gacp-erp
```

### 1.2 Certificate Inventory

| Certificate | Issuer | Validity | Auto-Renew | Namespace |
|-------------|--------|----------|------------|-----------|
| gacp-erp-tls | letsencrypt-prod / internal-ca | 90 days | Yes (cert-manager) | gacp-erp |
| postgres-tls | internal-ca | 365 days | Yes (cert-manager) | gacp-data |
| kafka-tls | internal-ca | 365 days | Yes (Strimzi) | gacp-data |
| immudb-tls | internal-ca | 365 days | Yes (cert-manager) | gacp-data |
| emqx-tls | internal-ca | 365 days | Yes (cert-manager) | gacp-environmental |
| istio-ca | istiod | 10 years | Yes (Istio) | istio-system |

### 1.3 Renewal Monitoring

```bash
# Check certificates expiring within 30 days
kubectl get certificates -A -o json | \
  jq -r '.items[] | select(.status.notAfter) |
    "\(.metadata.namespace)/\(.metadata.name): \(.status.notAfter)"' | \
  while read line; do
    echo "$line"
  done

# cert-manager renewal events
kubectl get events -n cert-manager --sort-by='.lastTimestamp' | grep -i renew
```

## 2. Manual Certificate Renewal

### 2.1 Force Renewal via cert-manager

```bash
# Delete the secret to trigger re-issuance
kubectl delete secret gacp-erp-tls -n gacp-erp

# Or use cmctl
cmctl renew gacp-erp-tls -n gacp-erp

# Verify new certificate
kubectl get certificate gacp-erp-tls -n gacp-erp
openssl s_client -connect gacp-erp.local:443 < /dev/null 2>/dev/null | \
  openssl x509 -noout -dates
```

### 2.2 External Certificate Renewal

For certificates not managed by cert-manager (e.g., purchased wildcard certs):

```bash
# 1. Obtain new certificate from CA
# 2. Create TLS secret
kubectl create secret tls external-tls \
  -n gacp-erp \
  --cert=path/to/tls.crt \
  --key=path/to/tls.key \
  --dry-run=client -o yaml | \
  kubeseal --controller-namespace kube-system \
  --controller-name sealed-secrets > external-tls-sealed.yaml

# 3. Apply sealed secret
kubectl apply -f external-tls-sealed.yaml

# 4. Restart ingress to pick up new cert
kubectl rollout restart deployment/ingress-nginx-controller -n ingress-nginx
```

## 3. Troubleshooting

| Issue | Diagnosis | Resolution |
|-------|-----------|------------|
| Certificate not renewing | `kubectl describe certificate <name>` → check Events | Check Issuer status, DNS challenge |
| ACME challenge failing | `kubectl get challenges -A` | Verify DNS or HTTP solver config |
| Expired certificate | `openssl s_client` shows expired | Force renewal (delete secret) |
| mTLS handshake failure | `istioctl authn tls-check` | Check PeerAuthentication policy |

## 4. Alerting

Grafana alert: `cert_expiry_days < 14` → P2 alert to on-call.

```yaml
# VictoriaMetrics alerting rule
- alert: CertificateExpiringSoon
  expr: certmanager_certificate_expiration_timestamp_seconds - time() < 14 * 24 * 3600
  for: 1h
  labels:
    severity: warning
  annotations:
    summary: "Certificate {{ $labels.name }} expiring in < 14 days"
```
