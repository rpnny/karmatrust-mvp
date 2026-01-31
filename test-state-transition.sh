#!/bin/bash

# Test State Transition ZK Proof Generation
# This tests if the state_transition circuit is properly loaded

echo "═══════════════════════════════════════════════════════════"
echo "Testing State Transition ZK Proof (Bronze → Silver)"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Use a valid Ethereum address for testing
# Generate a unique one by appending timestamp to last digit
TIMESTAMP=$(date +%s)
LAST_DIGIT=$((TIMESTAMP % 10))
WALLET="0x810${LAST_DIGIT}ac5D4a8C01Be2181AF080794411376C7f61c"

echo "Step 1: Initialize user credit state as Bronze (score 35)..."
INIT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/vcsm/init \
  -H "Content-Type: application/json" \
  -d "{\"userId\": \"$WALLET\", \"initialScore\": 35}")

echo "$INIT_RESPONSE" | jq '.'
echo ""

SUCCESS=$(echo "$INIT_RESPONSE" | jq -r '.success')
if [ "$SUCCESS" != "true" ]; then
  echo "❌ Failed to initialize state"
  exit 1
fi

LEVEL=$(echo "$INIT_RESPONSE" | jq -r '.data.levelName')
echo "✅ State initialized: $LEVEL"
echo ""

echo "Step 2: Attempt state transition (Bronze → Silver)..."
echo "Requirements: score≥40, onTimePayments≥3, debtRatio≤70, sybilScore≥20"
echo "Providing: score=45, onTimePayments=5, debtRatio=50"
echo ""
echo "This will trigger state_transition circuit loading..."
echo ""

TRANSITION_RESPONSE=$(curl -s -X POST http://localhost:3000/api/vcsm/transition \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"$WALLET\",
    \"ruleId\": \"UPGRADE_BRONZE_TO_SILVER\",
    \"newScore\": 45,
    \"sybilScore\": 25,
    \"evidence\": {
      \"eventType\": \"SCORE_IMPROVED\",
      \"eventData\": {
        \"onTimePayments\": 5,
        \"debtRatio\": 50,
        \"reason\": \"test_transition\"
      }
    }
  }")

echo "$TRANSITION_RESPONSE" | jq '.'
echo ""

# Check if proof is real or simulated
SUCCESS=$(echo "$TRANSITION_RESPONSE" | jq -r '.success')
IS_SIMULATED=$(echo "$TRANSITION_RESPONSE" | jq -r '.data.isSimulated // true')
FROM_LEVEL=$(echo "$TRANSITION_RESPONSE" | jq -r '.data.fromLevel')
TO_LEVEL=$(echo "$TRANSITION_RESPONSE" | jq -r '.data.toLevel')

echo "═══════════════════════════════════════════════════════════"

if [ "$SUCCESS" != "true" ]; then
  echo "❌ Transition failed"
  ERROR=$(echo "$TRANSITION_RESPONSE" | jq -r '.error')
  echo "   Error: $ERROR"
elif [ "$IS_SIMULATED" == "false" ]; then
  echo "✅ REAL ZK Proof Generated for State Transition!"
  echo "   Transition: $FROM_LEVEL → $TO_LEVEL"
  echo "   Circuit: state_transition.circom"
  echo "   Protocol: Groth16"
  echo ""
  echo "   This means:"
  echo "   ✅ Circuit files were found at correct paths"
  echo "   ✅ snarkjs successfully loaded"
  echo "   ✅ Proof generation is working"
  echo "   ✅ Path fix was successful!"
else
  echo "⚠️  Simulated Proof (circuit files not found)"
  echo "   Transition: $FROM_LEVEL → $TO_LEVEL"
  echo ""
  echo "   This means:"
  echo "   ❌ Circuit files not at expected paths"
  echo "   ❌ Falling back to simulation mode"
  echo "   ❌ Path fix did not work"
  echo ""
  echo "   Expected paths (from PROJECT_ROOT):"
  echo "   - circuits/build/state_transition_js/state_transition.wasm"
  echo "   - circuits/build/state_transition_final.zkey"
  echo "   - circuits/build/state_transition_vkey.json"
  echo ""
  echo "   Debug: Check backend logs for path resolution"
fi
echo "═══════════════════════════════════════════════════════════"
