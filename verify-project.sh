#!/bin/bash

# KarmaTrust Project Integrity Checker
# Verifies that all essential files exist

echo "═══════════════════════════════════════════════════════════"
echo "  🔍 KarmaTrust Project Integrity Check"
echo "═══════════════════════════════════════════════════════════"
echo ""

PASS=0
FAIL=0

# Function to check file existence
check_file() {
    if [ -f "$1" ]; then
        echo "  ✅ $1"
        ((PASS++))
    else
        echo "  ❌ $1 (MISSING)"
        ((FAIL++))
    fi
}

# Function to check directory existence
check_dir() {
    if [ -d "$1" ]; then
        echo "  ✅ $1/"
        ((PASS++))
    else
        echo "  ❌ $1/ (MISSING)"
        ((FAIL++))
    fi
}

echo "📄 Root Files:"
check_file "README.md"
check_file "package.json"
check_file "LICENSE"
check_file "TESTING.md"

echo ""
echo "📂 Documentation:"
check_file "docs/API.md"
check_file "docs/ARCHITECTURE.md"
check_file "docs/DEPLOYMENT.md"

echo ""
echo "🔧 Backend:"
check_file "backend/package.json"
check_file "backend/tsconfig.json"
check_file "backend/src/index.ts"
check_file "backend/src/app.ts"
check_dir  "backend/src/types"
check_dir  "backend/src/routes"
check_dir  "backend/src/services"
check_file "backend/src/services/creditScoring.ts"
check_file "backend/src/services/easAttestation.ts"
check_file "backend/src/services/blockchainData.ts"
check_file "backend/src/services/zkProof.ts"
check_dir  "backend/src/services/vcsm"
check_file "backend/src/services/vcsm/creditState.ts"
check_file "backend/src/services/vcsm/transitionRules.ts"
check_file "backend/src/services/vcsm/vcsmService.ts"

echo ""
echo "🎨 Frontend:"
check_file "frontend/package.json"
check_file "frontend/tsconfig.json"
check_file "frontend/vite.config.ts"
check_file "frontend/tailwind.config.js"
check_file "frontend/index.html"
check_file "frontend/src/main.tsx"
check_file "frontend/src/App.tsx"
check_dir  "frontend/src/pages"
check_file "frontend/src/pages/Home.tsx"
check_file "frontend/src/pages/Demo.tsx"
check_dir  "frontend/src/components"
check_dir  "frontend/src/components/UserView"
check_dir  "frontend/src/components/BankView"
check_dir  "frontend/src/components/shared"
check_file "frontend/src/hooks/useCredit.ts"

echo ""
echo "📜 Smart Contracts:"
check_file "contracts/package.json"
check_file "contracts/hardhat.config.ts"
check_file "contracts/contracts/VCSMStateManager.sol"
check_file "contracts/contracts/TieredLending.sol"
check_file "contracts/scripts/deploy.ts"
check_dir  "contracts/test"

echo ""
echo "⚡ ZK Circuits:"
check_file "circuits/package.json"
check_file "circuits/tier_membership.circom"
check_dir  "circuits/build"
check_dir  "circuits/ptau"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  📊 Results"
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ Passed: $PASS"
echo "  ❌ Failed: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "  🎉 All essential files present!"
    echo "  ✓ Project structure is complete"
    echo ""
    echo "  Next steps:"
    echo "  1. Install Node.js 20+ from https://nodejs.org/"
    echo "  2. Run: cd backend && npm install && npm run dev"
    echo "  3. Run: cd frontend && npm install && npm run dev"
    echo "  4. Follow TESTING.md for full test suite"
    exit 0
else
    echo "  ⚠️  Some files are missing!"
    echo "  Please check the missing files above."
    exit 1
fi

echo "═══════════════════════════════════════════════════════════"
