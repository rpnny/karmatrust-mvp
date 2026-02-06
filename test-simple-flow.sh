#!/bin/bash

# Simple test to verify the complete flow works
set -e

API="http://localhost:3000"
WALLET="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"

echo "=========================================="
echo "🧪 Simple Flow Test"
echo "=========================================="
echo ""

# Step 1: Create commitment attestation
echo "Step 1: Creating commitment attestation..."
ATTEST_JSON=$(curl -s -X POST $API/api/credit/attest-commitment \
  -H "Content-Type: application/json" \
  -d "{\"wallet\":\"$WALLET\"}")

echo "$ATTEST_JSON" > /tmp/attest_response.json

ATTESTATION_ID=$(echo "$ATTEST_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['attestation']['attestationId'])")
COMMITMENT=$(echo "$ATTEST_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['commitment'])")
SALT=$(echo "$ATTEST_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['salt'])")

echo "✅ Attestation created"
echo "   ID: $ATTESTATION_ID"
echo "   Commitment: $COMMITMENT"
echo "   Salt: $SALT"
echo ""

# Step 2: Generate ZK proof using same salt
echo "Step 2: Generating ZK proof with salt from attestation..."
PROOF_JSON=$(curl -s -X POST $API/api/zkp/generate \
  -H "Content-Type: application/json" \
  -d "{\"wallet\":\"$WALLET\",\"salt\":\"$SALT\",\"commitment\":\"$COMMITMENT\"}")

echo "$PROOF_JSON" > /tmp/proof_response.json

PROOF_COMMITMENT=$(echo "$PROOF_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['commitment'])")
TIER=$(echo "$PROOF_JSON" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['tier'])")

echo "✅ Proof generated"
echo "   Tier: $TIER"
echo "   Proof commitment: $PROOF_COMMITMENT"
echo ""

# Check if commitments match
if [ "$COMMITMENT" = "$PROOF_COMMITMENT" ]; then
  echo "✅ Commitments match!"
else
  echo "❌ Commitment mismatch!"
  echo "   Attestation: $COMMITMENT"
  echo "   Proof:       $PROOF_COMMITMENT"
  exit 1
fi

echo ""
echo "=========================================="
echo "✅ Basic flow works!"
echo "=========================================="
