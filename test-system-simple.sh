#!/bin/bash

# KarmaTrust Simple System Test
# Quick validation of all critical components

echo "🧪 KarmaTrust System Test Starting..."
echo "========================================"
echo ""

API="http://localhost:3000/api"
WALLET="0x8103ac5D4a8C01Be2181AF080794411376C7f61c"
REPORT="SYSTEM_TEST_REPORT_$(date +%Y%m%d_%H%M%S).md"

PASSED=0
FAILED=0
WARNINGS=0

# Initialize report
cat > "$REPORT" << EOF
# 🧪 KarmaTrust System Test Report

**Date**: $(date '+%Y-%m-%d %H:%M:%S')  
**Project**: KarmaTrust (DAISY Bridge Architecture)

---

## Test Results

EOF

test_api() {
    local name="$1"
    local cmd="$2"
    local check="$3"
    
    echo -n "Testing $name... "
    
    result=$(eval "$cmd" 2>&1)
    
    if echo "$result" | grep -q "$check"; then
        echo "✅ PASS"
        ((PASSED++))
        echo "- ✅ $name: PASS" >> "$REPORT"
        return 0
    else
        echo "❌ FAIL"
        ((FAILED++))
        echo "- ❌ $name: FAIL" >> "$REPORT"
        echo "  \`\`\`" >> "$REPORT"
        echo "  $result" | head -3 >> "$REPORT"
        echo "  \`\`\`" >> "$REPORT"
        return 1
    fi
}

echo "1. Health & API Checks"
echo "----------------------"

test_api "Health Endpoint" \
    "curl -s $API/health" \
    "\"status\":\"ok\""

test_api "Credit Scoring" \
    "curl -s '$API/credit/score?wallet=$WALLET'" \
    "\"score\""

test_api "EAS Attestation" \
    "curl -s -X POST $API/credit/attest -H 'Content-Type: application/json' -d '{\"wallet\":\"$WALLET\",\"mode\":\"public\"}'" \
    "attestationId"

test_api "ZK Proof Generation" \
    "curl -s -X POST $API/zkp/generate -H 'Content-Type: application/json' -d '{\"wallet\":\"$WALLET\"}'" \
    "\"proof\""

test_api "VCSM Service" \
    "curl -s -X POST $API/vcsm/init -H 'Content-Type: application/json' -d '{\"userId\":\"$WALLET\"}'" \
    "state\\|already"

echo ""
echo "2. Performance Tests"
echo "-------------------"

# ZK Proof Speed Test
echo -n "ZK Proof Generation Speed... "
start=$(date +%s%N | cut -b1-13)
curl -s -X POST "$API/zkp/generate" -H "Content-Type: application/json" -d "{\"wallet\":\"$WALLET\"}" > /dev/null
end=$(date +%s%N | cut -b1-13)
zktime=$((end - start))

if [ $zktime -lt 5000 ]; then
    echo "✅ ${zktime}ms (FAST)"
    ((PASSED++))
    echo "- ✅ ZK Proof Speed: ${zktime}ms (FAST)" >> "$REPORT"
else
    echo "⚠️  ${zktime}ms (SLOW)"
    ((WARNINGS++))
    echo "- ⚠️ ZK Proof Speed: ${zktime}ms (SLOW)" >> "$REPORT"
fi

# Credit Score Speed Test
echo -n "Credit Scoring Speed... "
start=$(date +%s%N | cut -b1-13)
curl -s "$API/credit/score?wallet=$WALLET" > /dev/null
end=$(date +%s%N | cut -b1-13)
scoretime=$((end - start))

if [ $scoretime -lt 3000 ]; then
    echo "✅ ${scoretime}ms (FAST)"
    ((PASSED++))
    echo "- ✅ Credit Scoring Speed: ${scoretime}ms (FAST)" >> "$REPORT"
else
    echo "⚠️  ${scoretime}ms (SLOW)"
    ((WARNINGS++))
    echo "- ⚠️ Credit Scoring Speed: ${scoretime}ms (SLOW)" >> "$REPORT"
fi

echo ""
echo "3. Component Health"
echo "-------------------"

# Check circuits
if [ -f "circuits/build/tier_membership_final.zkey" ]; then
    echo "✅ tier_membership circuit compiled"
    ((PASSED++))
    echo "- ✅ tier_membership circuit: Compiled" >> "$REPORT"
else
    echo "⚠️  tier_membership circuit missing (using simulation)"
    ((WARNINGS++))
    echo "- ⚠️ tier_membership circuit: Missing (simulation mode)" >> "$REPORT"
fi

if [ -f "circuits/build/state_transition_final.zkey" ]; then
    echo "✅ state_transition circuit compiled"
    ((PASSED++))
    echo "- ✅ state_transition circuit: Compiled" >> "$REPORT"
else
    echo "⚠️  state_transition circuit missing (using simulation)"
    ((WARNINGS++))
    echo "- ⚠️ state_transition circuit: Missing (simulation mode)" >> "$REPORT"
fi

# Check deployments
if [ -f "deployments/sepolia.json" ]; then
    echo "✅ Smart contracts deployed"
    ((PASSED++))
    echo "- ✅ Smart contracts: Deployed to Sepolia" >> "$REPORT"
else
    echo "⚠️  No deployment file"
    ((WARNINGS++))
    echo "- ⚠️ Smart contracts: No deployment file" >> "$REPORT"
fi

# Check DAISY docs
if grep -q "DAISY" README.md 2>/dev/null && [ -f "docs/DAISY_ARCHITECTURE.md" ]; then
    echo "✅ DAISY branding complete"
    ((PASSED++))
    echo "- ✅ DAISY branding: Complete" >> "$REPORT"
else
    echo "⚠️  DAISY branding incomplete"
    ((WARNINGS++))
    echo "- ⚠️ DAISY branding: Incomplete" >> "$REPORT"
fi

echo ""
echo "4. Stress Test (10 requests)"
echo "----------------------------"

SUCCESS=0
for i in {1..10}; do
    if curl -s "$API/credit/score?wallet=$WALLET" | grep -q "\"score\""; then
        ((SUCCESS++))
        echo -n "."
    else
        echo -n "x"
    fi
done
echo ""

RATE=$((SUCCESS * 10))
if [ $SUCCESS -eq 10 ]; then
    echo "✅ All requests successful (100%)"
    ((PASSED++))
    echo "- ✅ Stress test: 10/10 (100%)" >> "$REPORT"
elif [ $SUCCESS -ge 8 ]; then
    echo "⚠️  $SUCCESS/10 requests successful (${RATE}%)"
    ((WARNINGS++))
    echo "- ⚠️ Stress test: $SUCCESS/10 (${RATE}%)" >> "$REPORT"
else
    echo "❌ Only $SUCCESS/10 requests successful (${RATE}%)"
    ((FAILED++))
    echo "- ❌ Stress test: $SUCCESS/10 (${RATE}%)" >> "$REPORT"
fi

# Finalize report
cat >> "$REPORT" << EOF

---

## Summary

- **Total Tests**: $((PASSED + FAILED + WARNINGS))
- **Passed**: $PASSED ✅
- **Failed**: $FAILED ❌
- **Warnings**: $WARNINGS ⚠️

### Assessment

EOF

SCORE=$((PASSED * 100 / (PASSED + FAILED + WARNINGS)))

if [ $FAILED -eq 0 ] && [ $SCORE -ge 90 ]; then
    echo "**✅ EXCELLENT**: System is production-ready for demo!" >> "$REPORT"
    RESULT="EXCELLENT"
elif [ $FAILED -eq 0 ] && [ $SCORE -ge 70 ]; then
    echo "**⚠️ GOOD**: System is functional with minor warnings" >> "$REPORT"
    RESULT="GOOD"
elif [ $FAILED -le 2 ]; then
    echo "**⚠️ ACCEPTABLE**: Address critical failures before demo" >> "$REPORT"
    RESULT="ACCEPTABLE"
else
    echo "**❌ NEEDS WORK**: Critical issues must be fixed" >> "$REPORT"
    RESULT="NEEDS WORK"
fi

cat >> "$REPORT" << EOF

### Demo Readiness: $SCORE%

EOF

if [ $FAILED -eq 0 ]; then
    cat >> "$REPORT" << EOF
✅ **Ready for demo**

All critical systems operational. System is stable and performant.

EOF
else
    cat >> "$REPORT" << EOF
⚠️ **Action required**

Address the $FAILED failed test(s) above before proceeding with demo.

EOF
fi

cat >> "$REPORT" << EOF
---

*Generated by KarmaTrust Test Suite v1.0*
EOF

echo ""
echo "========================================"
echo "📊 Test Summary"
echo "========================================"
echo "✅ Passed:   $PASSED"
echo "❌ Failed:   $FAILED"
echo "⚠️  Warnings: $WARNINGS"
echo "📈 Score:    $SCORE%"
echo "🎯 Result:   $RESULT"
echo ""
echo "📄 Report saved to: $REPORT"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "✅ All critical tests passed! System ready for demo."
    exit 0
else
    echo "⚠️  $FAILED test(s) failed. Review report for details."
    exit 1
fi
