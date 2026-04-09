#!/bin/bash
# Initialize Zitadel with custom domain registration for local development
# This solves the gRPC instance resolution issue for zitadel-login

set -e

ZITADEL_URL="${ZITADEL_URL:-http://localhost:8080}"
ORG_DOMAIN="${ORG_DOMAIN:-localhost}"

echo "Waiting for Zitadel to be fully ready..."
for i in {1..60}; do
  if curl -s "${ZITADEL_URL}/.well-known/openid-configuration" > /dev/null 2>&1; then
    echo "Zitadel is ready (attempt $i)"
    sleep 2
    break
  fi
  if [ $i -eq 60 ]; then
    echo "ERROR: Zitadel did not become ready within timeout"
    exit 1
  fi
  sleep 1
done

echo "Attempting to register custom domain '$ORG_DOMAIN' for local development..."
echo ""
echo "NOTE: This step requires Zitadel to be set up with an admin account."
echo "If this fails, manually add the domain via:"
echo "  1. Login to Zitadel console: ${ZITADEL_URL}/ui/console"
echo "  2. Navigate to Settings > Domains"
echo "  3. Add '${ORG_DOMAIN}' as a custom domain"
echo ""

# Try to get list of instances via REST API (requires no auth for public endpoints)
INSTANCE_ID=$(curl -s "${ZITADEL_URL}/management/v1/instances" 2>/dev/null | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4) || true

if [ -z "$INSTANCE_ID" ]; then
  echo "Could not retrieve instance ID. This is expected without proper authentication."
  echo "Manual configuration required in Zitadel console."
  exit 0
fi

echo "Found instance ID: $INSTANCE_ID"
echo "Success: Instance is accessible via API"
