#!/bin/bash

# =============================================================================
# KarmaTrust Full System Test Suite
# Tests all components + stress testing + generates detailed report
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
PASSED=0
FAILED=0
WARNINGS=0
START_TIME=$(date +%s)

# Report file
REPORT_FILE="TEST_REPORT_$(date +%Y%m%d_%H%M%S).md"

# =============================================================================
# Helper Functions
# =============================================================================

print_header() {
    echo -e "\n${BLUE}============================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}============================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASSED++))
}

print_failure() {
    echo -e "${RED}✗ $1${NC}"
    echo -e "${RED}  Error: $2${NC}"
    ((FAILED++))
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
    ((WARNINGS++))
}

log_to_report() {
    echo "$1" >> "$REPORT_FILE"
}

# =============================================================================
# Initialize Report
# =============================================================================

initialize_report() {
    cat > "$REPORT_FILE" << EOF
# 🧪 KarmaTrust System Test Report

**Generated**: $(date '+%Y-%m-%d %H:%M:%S')  
**Test Suite Version**: 1.0.0  
**Project**: KarmaTrust (DAISY Architecture)

---

## Executive Summary

EOF
}

# =============================================================================
# Pre-flight Checks
# =============================================================================

preflight_checks() {
    print_header "Pre-flight Checks"
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js installed: $NODE_VERSION"
        log_to_report "- ✅ Node.js: $NODE_VERSION"
    else
        print_failure "Node.js not found" "Install Node.js first"
        log_to_report "- ❌ Node.js: Not installed"
        exit 1
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm installed: $NPM_VERSION"
        log_to_report "- ✅ npm: $NPM_VERSION"
    else
        print_failure "npm not found" "Install npm first"
        log_to_report "- ❌ npm: Not installed"
        exit 1
    fi
    
    # Check backend directory
    if [ -d "backend" ]; then
        print_success "Backend directory found"
        log_to_report "- ✅ Backend directory exists"
    else
        print_failure "Backend directory not found" "Run from project root"
        log_to_report "- ❌ Backend directory not found"
        exit 1
    fi
    
    # Check frontend directory
    if [ -d "frontend" ]; then
        print_success "Frontend directory found"
        log_to_report "- ✅ Frontend directory exists"
    else
        print_warning "Frontend directory not found"
        log_to_report "- ⚠️ Frontend directory not found"
    fi
    
    # Check circuits directory
    if [ -d "circuits/build" ]; then
        print_success "Circuits build directory found"
        log_to_report "- ✅ Circuits compiled"
    else
        print_warning "Circuits not compiled"
        log_to_report "- ⚠️ Circuits not compiled (may fallback to simulation)"
    fi
    
    # Check backend dependencies
    if [ -d "backend/node_modules" ]; then
        print_success "Backend dependencies installed"
        log_to_report "- ✅ Backend dependencies installed"
    else
        print_warning "Backend dependencies not installed, installing now..."
        log_to_report "- ⚠️ Backend dependencies missing, installing..."
        cd backend && npm install && cd ..
        print_success "Backend dependencies installed"
    fi
}

# =============================================================================
# Backend API Tests
# =============================================================================

test_backend_api() {
    print_header "Backend API Tests"
    
    log_to_report "\n## Backend API Tests\n"
    
    API_BASE="http://localhost:3000/api"
    TEST_WALLET="0x8103ac5D4a8C01Be2181AF080794411376C7f61c"
    
    # Test 1: Health Check
    echo "Testing health endpoint..."
    HEALTH_RESPONSE=$(curl -s "$API_BASE/health" || echo "ERROR")
    
    if [[ "$HEALTH_RESPONSE" == *"healthy"* ]]; then
        print_success "Health check passed"
        log_to_report "- ✅ Health endpoint: OK"
    else
        print_failure "Health check failed" "$HEALTH_RESPONSE"
        log_to_report "- ❌ Health endpoint: Failed"
    fi
    
    # Test 2: Credit Score Calculation
    echo "Testing credit score endpoint..."
    CREDIT_RESPONSE=$(curl -s -X POST "$API_BASE/credit/score" \
        -H "Content-Type: application/json" \
        -d "{\"wallet\":\"$TEST_WALLET\"}" || echo "ERROR")
    
    if [[ "$CREDIT_RESPONSE" == *"score"* ]] && [[ "$CREDIT_RESPONSE" == *"success\":true"* ]]; then
        SCORE=$(echo "$CREDIT_RESPONSE" | grep -o '"score":[0-9]*' | grep -o '[0-9]*')
        print_success "Credit score calculation: $SCORE points"
        log_to_report "- ✅ Credit scoring: Score=$SCORE"
    else
        print_failure "Credit score calculation failed" "$CREDIT_RESPONSE"
        log_to_report "- ❌ Credit scoring: Failed"
    fi
    
    # Test 3: EAS Attestation (Public Mode)
    echo "Testing EAS attestation (public mode)..."
    ATTEST_RESPONSE=$(curl -s -X POST "$API_BASE/credit/attest" \
        -H "Content-Type: application/json" \
        -d "{\"wallet\":\"$TEST_WALLET\",\"mode\":\"public\"}" || echo "ERROR")
    
    if [[ "$ATTEST_RESPONSE" == *"attestationId"* ]] || [[ "$ATTEST_RESPONSE" == *"simulated"* ]]; then
        print_success "EAS attestation generated"
        log_to_report "- ✅ EAS attestation: Generated"
        
        if [[ "$ATTEST_RESPONSE" == *"simulated"* ]]; then
            print_warning "EAS in simulation mode (expected for hackathon)"
            log_to_report "  - ⚠️ Mode: Simulated"
        else
            log_to_report "  - ✅ Mode: Real on-chain"
        fi
    else
        print_failure "EAS attestation failed" "$ATTEST_RESPONSE"
        log_to_report "- ❌ EAS attestation: Failed"
    fi
    
    # Test 4: ZK Proof Generation
    echo "Testing ZK proof generation..."
    ZK_START=$(date +%s%N | cut -b1-13)
    
    ZK_RESPONSE=$(curl -s -X POST "$API_BASE/zkp/generate" \
        -H "Content-Type: application/json" \
        -d "{\"wallet\":\"$TEST_WALLET\"}" || echo "ERROR")
    
    ZK_END=$(date +%s%N | cut -b1-13)
    ZK_TIME=$((ZK_END - ZK_START))
    
    if [[ "$ZK_RESPONSE" == *"proof"* ]] && [[ "$ZK_RESPONSE" == *"success\":true"* ]]; then
        IS_SIMULATED=$(echo "$ZK_RESPONSE" | grep -o '"isSimulated":[^,]*' | grep -o 'true\|false')
        
        if [ "$IS_SIMULATED" = "false" ]; then
            print_success "Real ZK proof generated in ${ZK_TIME}ms"
            log_to_report "- ✅ ZK proof: Real proof in ${ZK_TIME}ms"
        else
            print_warning "ZK proof in simulation mode"
            log_to_report "- ⚠️ ZK proof: Simulated (${ZK_TIME}ms)"
        fi
    else
        print_failure "ZK proof generation failed" "$ZK_RESPONSE"
        log_to_report "- ❌ ZK proof: Failed"
    fi
    
    # Test 5: VCSM State Initialization
    echo "Testing VCSM state initialization..."
    VCSM_RESPONSE=$(curl -s -X POST "$API_BASE/vcsm/initialize" \
        -H "Content-Type: application/json" \
        -d "{\"wallet\":\"$TEST_WALLET\"}" || echo "ERROR")
    
    if [[ "$VCSM_RESPONSE" == *"state"* ]] && [[ "$VCSM_RESPONSE" == *"success\":true"* ]]; then
        print_success "VCSM state initialized"
        log_to_report "- ✅ VCSM initialization: OK"
    else
        print_failure "VCSM initialization failed" "$VCSM_RESPONSE"
        log_to_report "- ❌ VCSM initialization: Failed"
    fi
    
    # Test 6: Contract Info
    echo "Testing smart contract info..."
    CONTRACT_RESPONSE=$(curl -s "$API_BASE/contracts/info" || echo "ERROR")
    
    if [[ "$CONTRACT_RESPONSE" == *"VCSMStateManager"* ]]; then
        print_success "Smart contract info retrieved"
        log_to_report "- ✅ Contract info: Retrieved"
    else
        print_failure "Contract info retrieval failed" "$CONTRACT_RESPONSE"
        log_to_report "- ❌ Contract info: Failed"
    fi
}

# =============================================================================
# Stress Testing
# =============================================================================

stress_test() {
    print_header "Stress Testing"
    
    log_to_report "\n## Stress Testing\n"
    
    API_BASE="http://localhost:3000/api"
    CONCURRENT_REQUESTS=5
    TOTAL_REQUESTS=20
    
    print_warning "Running $TOTAL_REQUESTS requests with $CONCURRENT_REQUESTS concurrent connections..."
    
    # Test wallets
    TEST_WALLETS=(
        "0x8103ac5D4a8C01Be2181AF080794411376C7f61c"
        "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb6"
        "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed"
        "0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359"
    )
    
    SUCCESS_COUNT=0
    FAILURE_COUNT=0
    TOTAL_TIME=0
    
    for i in $(seq 1 $TOTAL_REQUESTS); do
        WALLET_INDEX=$((i % 5))
        WALLET="${TEST_WALLETS[$WALLET_INDEX]}"
        
        START=$(date +%s%N | cut -b1-13)
        
        RESPONSE=$(curl -s -X POST "$API_BASE/credit/score" \
            -H "Content-Type: application/json" \
            -d "{\"wallet\":\"$WALLET\"}" 2>/dev/null || echo "ERROR")
        
        END=$(date +%s%N | cut -b1-13)
        ELAPSED=$((END - START))
        TOTAL_TIME=$((TOTAL_TIME + ELAPSED))
        
        if [[ "$RESPONSE" == *"success\":true"* ]]; then
            ((SUCCESS_COUNT++))
            echo -n "."
        else
            ((FAILURE_COUNT++))
            echo -n "x"
        fi
        
        # Add small delay between requests
        sleep 0.1
    done
    
    echo ""
    
    AVG_TIME=$((TOTAL_TIME / TOTAL_REQUESTS))
    SUCCESS_RATE=$((SUCCESS_COUNT * 100 / TOTAL_REQUESTS))
    
    print_success "Completed $TOTAL_REQUESTS requests"
    print_success "Success: $SUCCESS_COUNT/$TOTAL_REQUESTS ($SUCCESS_RATE%)"
    print_success "Average response time: ${AVG_TIME}ms"
    
    log_to_report "### Stress Test Results\n"
    log_to_report "- Total requests: $TOTAL_REQUESTS"
    log_to_report "- Successful: $SUCCESS_COUNT ($SUCCESS_RATE%)"
    log_to_report "- Failed: $FAILURE_COUNT"
    log_to_report "- Average response time: ${AVG_TIME}ms"
    
    if [ $SUCCESS_RATE -ge 95 ]; then
        print_success "System stability: EXCELLENT"
        log_to_report "- **Stability**: ✅ EXCELLENT (≥95%)"
    elif [ $SUCCESS_RATE -ge 80 ]; then
        print_warning "System stability: GOOD"
        log_to_report "- **Stability**: ⚠️ GOOD (80-95%)"
    else
        print_failure "System stability: POOR" "Success rate below 80%"
        log_to_report "- **Stability**: ❌ POOR (<80%)"
    fi
}

# =============================================================================
# Performance Benchmarks
# =============================================================================

benchmark_performance() {
    print_header "Performance Benchmarks"
    
    log_to_report "\n## Performance Benchmarks\n"
    
    API_BASE="http://localhost:3000/api"
    TEST_WALLET="0x8103ac5D4a8C01Be2181AF080794411376C7f61c"
    
    # Benchmark 1: Credit Scoring Speed
    echo "Benchmarking credit scoring (10 iterations)..."
    SCORE_TIMES=()
    
    for i in {1..10}; do
        START=$(date +%s%N | cut -b1-13)
        curl -s -X POST "$API_BASE/credit/score" \
            -H "Content-Type: application/json" \
            -d "{\"wallet\":\"$TEST_WALLET\"}" > /dev/null
        END=$(date +%s%N | cut -b1-13)
        
        ELAPSED=$((END - START))
        SCORE_TIMES+=($ELAPSED)
    done
    
    # Calculate average
    TOTAL=0
    for time in "${SCORE_TIMES[@]}"; do
        TOTAL=$((TOTAL + time))
    done
    AVG_SCORE_TIME=$((TOTAL / 10))
    
    print_success "Credit scoring avg: ${AVG_SCORE_TIME}ms"
    log_to_report "- Credit scoring: ${AVG_SCORE_TIME}ms average"
    
    # Benchmark 2: ZK Proof Generation Speed
    echo "Benchmarking ZK proof generation (3 iterations)..."
    ZK_TIMES=()
    
    for i in {1..3}; do
        START=$(date +%s%N | cut -b1-13)
        curl -s -X POST "$API_BASE/zkp/generate" \
            -H "Content-Type: application/json" \
            -d "{\"wallet\":\"$TEST_WALLET\"}" > /dev/null
        END=$(date +%s%N | cut -b1-13)
        
        ELAPSED=$((END - START))
        ZK_TIMES+=($ELAPSED)
    done
    
    # Calculate average
    TOTAL=0
    for time in "${ZK_TIMES[@]}"; do
        TOTAL=$((TOTAL + time))
    done
    AVG_ZK_TIME=$((TOTAL / 3))
    
    print_success "ZK proof generation avg: ${AVG_ZK_TIME}ms"
    log_to_report "- ZK proof generation: ${AVG_ZK_TIME}ms average"
    
    # Performance evaluation
    log_to_report "\n### Performance Evaluation\n"
    
    if [ $AVG_SCORE_TIME -le 2000 ]; then
        log_to_report "- Credit scoring: ✅ FAST (<2s)"
    elif [ $AVG_SCORE_TIME -le 5000 ]; then
        log_to_report "- Credit scoring: ⚠️ ACCEPTABLE (2-5s)"
    else
        log_to_report "- Credit scoring: ❌ SLOW (>5s)"
    fi
    
    if [ $AVG_ZK_TIME -le 3000 ]; then
        log_to_report "- ZK proof: ✅ FAST (<3s)"
    elif [ $AVG_ZK_TIME -le 10000 ]; then
        log_to_report "- ZK proof: ⚠️ ACCEPTABLE (3-10s)"
    else
        log_to_report "- ZK proof: ❌ SLOW (>10s)"
    fi
}

# =============================================================================
# Component Health Checks
# =============================================================================

component_health() {
    print_header "Component Health Checks"
    
    log_to_report "\n## Component Health\n"
    
    # Check circuit files
    echo "Checking circuit files..."
    if [ -f "circuits/build/tier_membership_final.zkey" ]; then
        print_success "tier_membership circuit compiled"
        log_to_report "- ✅ tier_membership.circom: Compiled"
    else
        print_warning "tier_membership circuit not found"
        log_to_report "- ⚠️ tier_membership.circom: Missing (using simulation)"
    fi
    
    if [ -f "circuits/build/state_transition_final.zkey" ]; then
        print_success "state_transition circuit compiled"
        log_to_report "- ✅ state_transition.circom: Compiled"
    else
        print_warning "state_transition circuit not found"
        log_to_report "- ⚠️ state_transition.circom: Missing (using simulation)"
    fi
    
    # Check smart contracts
    echo "Checking smart contract deployments..."
    if [ -f "deployments/sepolia.json" ]; then
        print_success "Smart contracts deployed to Sepolia"
        log_to_report "- ✅ Smart contracts: Deployed to Sepolia"
        
        # Extract contract addresses
        VCSM_ADDRESS=$(grep -o '"VCSMStateManager":"0x[^"]*' deployments/sepolia.json | cut -d'"' -f4)
        LENDING_ADDRESS=$(grep -o '"TieredLending":"0x[^"]*' deployments/sepolia.json | cut -d'"' -f4)
        
        if [ -n "$VCSM_ADDRESS" ]; then
            log_to_report "  - VCSMStateManager: \`$VCSM_ADDRESS\`"
        fi
        
        if [ -n "$LENDING_ADDRESS" ]; then
            log_to_report "  - TieredLending: \`$LENDING_ADDRESS\`"
        fi
    else
        print_warning "No deployment file found"
        log_to_report "- ⚠️ Smart contracts: No deployment file"
    fi
    
    # Check documentation
    echo "Checking documentation..."
    DOC_COUNT=$(find docs -name "*.md" 2>/dev/null | wc -l)
    
    if [ "$DOC_COUNT" -ge 10 ]; then
        print_success "Documentation complete ($DOC_COUNT files)"
        log_to_report "- ✅ Documentation: $DOC_COUNT files"
    else
        print_warning "Documentation incomplete ($DOC_COUNT files)"
        log_to_report "- ⚠️ Documentation: $DOC_COUNT files (expected 10+)"
    fi
}

# =============================================================================
# Demo Readiness Check
# =============================================================================

demo_readiness() {
    print_header "Demo Readiness Check"
    
    log_to_report "\n## Demo Readiness\n"
    
    DEMO_SCORE=0
    MAX_SCORE=10
    
    # 1. Backend running
    if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
        print_success "Backend is running"
        log_to_report "- ✅ Backend server: Running"
        ((DEMO_SCORE++))
    else
        print_failure "Backend not running" "Start backend with 'npm start'"
        log_to_report "- ❌ Backend server: Not running"
    fi
    
    # 2. ZK proofs working
    ZK_TEST=$(curl -s -X POST "http://localhost:3000/api/zkp/generate" \
        -H "Content-Type: application/json" \
        -d '{"wallet":"0x8103ac5D4a8C01Be2181AF080794411376C7f61c"}' || echo "ERROR")
    
    if [[ "$ZK_TEST" == *"proof"* ]]; then
        print_success "ZK proof generation working"
        log_to_report "- ✅ ZK proofs: Working"
        ((DEMO_SCORE++))
    else
        print_failure "ZK proof generation failed" "Check circuits"
        log_to_report "- ❌ ZK proofs: Failed"
    fi
    
    # 3. EAS attestation working
    EAS_TEST=$(curl -s -X POST "http://localhost:3000/api/credit/attest" \
        -H "Content-Type: application/json" \
        -d '{"wallet":"0x8103ac5D4a8C01Be2181AF080794411376C7f61c"}' || echo "ERROR")
    
    if [[ "$EAS_TEST" == *"attestationId"* ]] || [[ "$EAS_TEST" == *"simulated"* ]]; then
        print_success "EAS attestation working"
        log_to_report "- ✅ EAS attestation: Working"
        ((DEMO_SCORE++))
    else
        print_failure "EAS attestation failed" "Check EAS integration"
        log_to_report "- ❌ EAS attestation: Failed"
    fi
    
    # 4. VCSM working
    VCSM_TEST=$(curl -s -X POST "http://localhost:3000/api/vcsm/initialize" \
        -H "Content-Type: application/json" \
        -d '{"wallet":"0x8103ac5D4a8C01Be2181AF080794411376C7f61c"}' || echo "ERROR")
    
    if [[ "$VCSM_TEST" == *"state"* ]]; then
        print_success "VCSM initialization working"
        log_to_report "- ✅ VCSM: Working"
        ((DEMO_SCORE++))
    else
        print_failure "VCSM initialization failed" "Check VCSM service"
        log_to_report "- ❌ VCSM: Failed"
    fi
    
    # 5. Credit scoring working
    SCORE_TEST=$(curl -s -X POST "http://localhost:3000/api/credit/score" \
        -H "Content-Type: application/json" \
        -d '{"wallet":"0x8103ac5D4a8C01Be2181AF080794411376C7f61c"}' || echo "ERROR")
    
    if [[ "$SCORE_TEST" == *"score"* ]]; then
        print_success "Credit scoring working"
        log_to_report "- ✅ Credit scoring: Working"
        ((DEMO_SCORE++))
    else
        print_failure "Credit scoring failed" "Check scoring service"
        log_to_report "- ❌ Credit scoring: Failed"
    fi
    
    # 6. README updated with DAISY
    if grep -q "DAISY" README.md 2>/dev/null; then
        print_success "README updated with DAISY branding"
        log_to_report "- ✅ README: DAISY branding present"
        ((DEMO_SCORE++))
    else
        print_warning "README missing DAISY branding"
        log_to_report "- ⚠️ README: Missing DAISY branding"
    fi
    
    # 7. DAISY architecture doc exists
    if [ -f "docs/DAISY_ARCHITECTURE.md" ]; then
        print_success "DAISY architecture documentation exists"
        log_to_report "- ✅ DAISY docs: Present"
        ((DEMO_SCORE++))
    else
        print_warning "DAISY architecture doc missing"
        log_to_report "- ⚠️ DAISY docs: Missing"
    fi
    
    # 8. Smart contracts deployed
    if [ -f "deployments/sepolia.json" ]; then
        print_success "Smart contracts deployed"
        log_to_report "- ✅ Contracts: Deployed"
        ((DEMO_SCORE++))
    else
        print_warning "No contract deployment file"
        log_to_report "- ⚠️ Contracts: No deployment file"
    fi
    
    # 9. Circuits compiled
    if [ -f "circuits/build/tier_membership_final.zkey" ]; then
        print_success "Circuits compiled"
        log_to_report "- ✅ Circuits: Compiled"
        ((DEMO_SCORE++))
    else
        print_warning "Circuits not compiled"
        log_to_report "- ⚠️ Circuits: Not compiled"
    fi
    
    # 10. Git repo clean
    if git status --short 2>/dev/null | grep -q .; then
        print_warning "Uncommitted changes in repo"
        log_to_report "- ⚠️ Git status: Uncommitted changes"
    else
        print_success "Git repo clean"
        log_to_report "- ✅ Git status: Clean"
        ((DEMO_SCORE++))
    fi
    
    # Calculate readiness
    READINESS_PERCENT=$((DEMO_SCORE * 100 / MAX_SCORE))
    
    log_to_report "\n### Demo Readiness Score: $DEMO_SCORE/$MAX_SCORE ($READINESS_PERCENT%)\n"
    
    if [ $READINESS_PERCENT -ge 90 ]; then
        print_success "Demo readiness: EXCELLENT ($READINESS_PERCENT%)"
        log_to_report "**Assessment**: ✅ EXCELLENT - Ready for demo!"
    elif [ $READINESS_PERCENT -ge 70 ]; then
        print_warning "Demo readiness: GOOD ($READINESS_PERCENT%)"
        log_to_report "**Assessment**: ⚠️ GOOD - Minor issues to address"
    else
        print_failure "Demo readiness: NEEDS WORK ($READINESS_PERCENT%)" "Address critical issues"
        log_to_report "**Assessment**: ❌ NEEDS WORK - Critical issues present"
    fi
}

# =============================================================================
# Finalize Report
# =============================================================================

finalize_report() {
    END_TIME=$(date +%s)
    TOTAL_DURATION=$((END_TIME - START_TIME))
    
    log_to_report "\n---\n"
    log_to_report "\n## Test Summary\n"
    log_to_report "- **Total Tests**: $((PASSED + FAILED))"
    log_to_report "- **Passed**: $PASSED ✅"
    log_to_report "- **Failed**: $FAILED ❌"
    log_to_report "- **Warnings**: $WARNINGS ⚠️"
    log_to_report "- **Duration**: ${TOTAL_DURATION}s"
    log_to_report "\n---\n"
    
    # Recommendations
    log_to_report "\n## Recommendations\n"
    
    if [ $FAILED -eq 0 ]; then
        log_to_report "✅ **All critical tests passed!** System is ready for demo.\n"
    else
        log_to_report "⚠️ **$FAILED test(s) failed.** Address the following before demo:\n"
    fi
    
    if [ $WARNINGS -gt 0 ]; then
        log_to_report "\n### Areas for Improvement:\n"
        log_to_report "- Review warnings above for non-critical issues"
        log_to_report "- Consider addressing warnings for optimal demo experience"
    fi
    
    log_to_report "\n---\n"
    log_to_report "\n## Next Steps\n"
    log_to_report "1. Review this report: \`$REPORT_FILE\`"
    log_to_report "2. Address any critical failures (❌)"
    log_to_report "3. Consider fixing warnings (⚠️) if time permits"
    log_to_report "4. Run test suite again to verify fixes"
    log_to_report "5. Proceed with demo preparation"
    log_to_report "\n**Good luck with your demo! 🚀**\n"
    
    echo ""
    print_header "Test Report Generated"
    echo -e "Report saved to: ${GREEN}$REPORT_FILE${NC}"
    echo ""
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    clear
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║                                                       ║"
    echo "║     KarmaTrust Full System Test Suite                ║"
    echo "║     DAISY Architecture Validation                     ║"
    echo "║                                                       ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    initialize_report
    
    preflight_checks
    test_backend_api
    stress_test
    benchmark_performance
    component_health
    demo_readiness
    
    finalize_report
    
    echo ""
    print_header "Test Suite Complete"
    
    echo -e "\n${BLUE}Summary:${NC}"
    echo -e "  ${GREEN}Passed:${NC}   $PASSED"
    echo -e "  ${RED}Failed:${NC}   $FAILED"
    echo -e "  ${YELLOW}Warnings:${NC} $WARNINGS"
    echo ""
    
    if [ $FAILED -eq 0 ]; then
        echo -e "${GREEN}✓ All tests passed! System is ready for demo.${NC}\n"
        exit 0
    else
        echo -e "${RED}✗ Some tests failed. Review the report for details.${NC}\n"
        exit 1
    fi
}

# Run main function
main
