#!/bin/bash
# Register custom domains in Zitadel instance for development
# This allows zitadel-login to resolve the instance via 'localhost' domain

set -e

ZITADEL_URL="${ZITADEL_URL:-http://localhost:8080}"
INSTANCE_ID="${ZITADEL_INSTANCE_ID:-367766028245008390}"

echo "Waiting for Zitadel to be ready..."
for i in {1..30}; do
  if curl -s "${ZITADEL_URL}/ready" > /dev/null 2>&1; then
    echo "Zitadel is ready"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "Zitadel did not become ready in time"
    exit 1
  fi
  sleep 2
done

echo "Attempting to register custom domain 'localhost'..."

# Try to add localhost as a custom domain using Zitadel Admin API
# This requires authentication - would need service account or admin token
# For now, this is a placeholder for the actual implementation
curl -X POST \
  "${ZITADEL_URL}/management/v1/instances/${INSTANCE_ID}/domains" \
  -H "Content-Type: application/json" \
  -d '{
    "domain": "localhost",
    "isPrimary": false
  }' \
  2>/dev/null || echo "Note: Custom domain registration requires authentication. Manual setup may be needed."

echo "Done"
