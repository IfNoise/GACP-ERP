---
title: "Secret Rotation Runbook"
system: "GACP-ERP"
version: "1.0"
last_updated: "2025-07-16"
---

# Secret Rotation Runbook

## 1. Sealed Secrets Re-encryption

### 1.1 Re-seal All Secrets

When the Sealed Secrets controller key rotates (every 30 days by default):

```bash
# Verify controller key status
kubectl get secret -n kube-system -l sealedsecrets.bitnami.com/sealed-secrets-key

# Re-encrypt all sealed secrets with new key
for f in k8s/sealed-secrets/*.yaml; do
  echo "Re-sealing: $f"
  kubeseal --controller-namespace kube-system \
    --controller-name sealed-secrets \
    --re-encrypt < "$f" > "$f.tmp" && mv "$f.tmp" "$f"
done

# Apply re-encrypted secrets
kubectl apply -f k8s/sealed-secrets/
```

### 1.2 Verify Decryption

```bash
# Check that secrets are properly decrypted
kubectl get secrets -n gacp-erp | grep Opaque
kubectl get secrets -n gacp-data | grep Opaque
```

## 2. Database Password Rotation

### 2.1 PostgreSQL Password Rotation

```bash
# 1. Generate new password
NEW_PW=$(openssl rand -base64 32)

# 2. Update password in PostgreSQL
kubectl exec -n gacp-data deploy/postgres-primary -- \
  psql -U postgres -c "ALTER USER gacp PASSWORD '${NEW_PW}';"

# 3. Create new sealed secret
echo -n "${NEW_PW}" | kubectl create secret generic postgres-credentials \
  -n gacp-erp \
  --from-literal=password="${NEW_PW}" \
  --dry-run=client -o yaml | \
  kubeseal --controller-namespace kube-system \
  --controller-name sealed-secrets > k8s/sealed-secrets/postgres-credentials.yaml

# 4. Apply new sealed secret
kubectl apply -f k8s/sealed-secrets/postgres-credentials.yaml

# 5. Rolling restart of all services
kubectl rollout restart deployment -n gacp-erp

# 6. Verify connectivity
kubectl logs -n gacp-erp deploy/api-gateway --tail=20 | grep -i "database\|connection"
```

### 2.2 ImmuDB Password Rotation

```bash
# 1. Generate new password
NEW_PW=$(openssl rand -base64 32)

# 2. Update ImmuDB admin password
kubectl exec -n gacp-data deploy/immudb -- \
  immuadmin user changepassword immudb

# 3. Update sealed secret and restart audit-consumer
# (same pattern as PostgreSQL)
```

## 3. JWT Key Rotation

### 3.1 Keycloak JWT Signing Key

```bash
# Keycloak rotates RS256 keys automatically.
# To force rotation:

# 1. Access Keycloak admin console
# Realm Settings → Keys → Providers → rsa-generated → rotate

# 2. Or via API:
KEYCLOAK_URL="https://keycloak.gacp-erp.local"
ADMIN_TOKEN=$(curl -s -X POST "$KEYCLOAK_URL/realms/master/protocol/openid-connect/token" \
  -d "grant_type=client_credentials&client_id=admin-cli&client_secret=${KC_SECRET}" | jq -r '.access_token')

curl -X POST "$KEYCLOAK_URL/admin/realms/gacp-erp/keys" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"

# 3. Services will pick up new JWKS automatically via JWKS endpoint
# No service restart needed (public key fetched at token validation time)
```

### 3.2 API Gateway JWT Verification

```bash
# Verify JWKS endpoint is serving new key
curl -s https://keycloak.gacp-erp.local/realms/gacp-erp/protocol/openid-connect/certs | jq '.keys | length'

# Should show 2 keys during rotation, then 1 after grace period
```

## 4. Rotation Schedule

| Secret | Rotation Period | Method | Downtime |
|--------|----------------|--------|----------|
| Sealed Secrets key | 30 days | Automatic (controller) | None |
| PostgreSQL password | 90 days | Manual (this runbook) | Rolling restart (~30s) |
| ImmuDB password | 90 days | Manual (this runbook) | Rolling restart (~30s) |
| JWT signing keys | 30 days | Automatic (Keycloak) | None |
| Kafka SASL credentials | 90 days | Manual + Strimzi User | Rolling restart |
| EMQX credentials | 90 days | Manual | None (hot reload) |
| MinIO access keys | 90 days | Manual | Rolling restart |

## 5. Emergency Rotation

If a secret is compromised:

1. **Immediately** rotate the compromised secret (steps above)
2. Invalidate all active sessions: `kubectl exec -n gacp-erp deploy/keycloak -- /opt/keycloak/bin/kcadm.sh update realms/gacp-erp -s 'notBefore='$(date +%s)`
3. Review audit logs for unauthorized access
4. Create security incident per `docs/runbooks/INCIDENT_RESPONSE.md`
5. Notify compliance team if GxP data potentially affected
