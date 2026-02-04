#!/bin/bash

# =============================================================================
# KarmaTrust API Warmup Script
# =============================================================================
# 
# Purpose: Pre-warm the API cache before Demo Day presentations
# 
# What it does:
# 1. Calls credit score API for all demo addresses
# 2. Populates the 5-minute cache
# 3. Ensures fast responses during the actual demo
#
# Run this 2-3 minutes before your presentation!
#
# Usage:
#   ./scripts/warmup.sh
#   ./scripts/warmup.sh --quiet    # Minimal output
#   ./scripts/warmup.sh --verbose  # Show full API responses
# =============================================================================

set -e

# Configuration
API_BASE="${API_BASE:-http://localhost:3000}"
QUIET=false
VERBOSE=false

# Demo addresses
VITALIK="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
ALICE="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
BOB="0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse arguments
for arg in "$@"; do
  case $arg in
    --quiet|-q)
      QUIET=true
      ;;
    --verbose|-v)
      VERBOSE=true
      ;;
  esac
done

# Helper functions
log() {
  if [ "$QUIET" != "true" ]; then
    echo -e "$1"
  fi
}

log_success() {
  log "${GREEN}✅ $1${NC}"
}

log_info() {
  log "${BLUE}ℹ️  $1${NC}"
}

log_warning() {
  log "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Banner
if [ "$QUIET" != "true" ]; then
  echo ""
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║           🏆 KarmaTrust API Warmup Script                    ║"
  echo "║                                                              ║"
  echo "║   Pre-warming cache for Demo Day presentations               ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  echo ""
fi

# Check if backend is running
log_info "Checking backend status..."
if ! curl -s "$API_BASE/api/health" > /dev/null 2>&1; then
  log_error "Backend is not running at $API_BASE"
  log_info "Start the backend first: cd backend && npm run dev"
  exit 1
fi
log_success "Backend is running"

# Warmup function
warmup_address() {
  local name=$1
  local address=$2
  local start_time=$(date +%s%N)
  
  log_info "Warming up $name ($address)..."
  
  local response=$(curl -s "$API_BASE/api/credit/score?wallet=$address")
  local end_time=$(date +%s%N)
  local duration=$(( (end_time - start_time) / 1000000 ))
  
  # Parse response
  local success=$(echo "$response" | jq -r '.success')
  local score=$(echo "$response" | jq -r '.data.score')
  local level=$(echo "$response" | jq -r '.data.levelName')
  local datasource=$(echo "$response" | jq -r '.data.dataSource')
  
  if [ "$success" == "true" ]; then
    log_success "$name: Score $score ($level) - ${duration}ms - Source: $datasource"
    if [ "$VERBOSE" == "true" ]; then
      echo "$response" | jq '.data | {score, levelName, factors}'
    fi
    return 0
  else
    log_error "$name: Failed to fetch score"
    return 1
  fi
}

# Main warmup process
log ""
log "📊 Starting warmup process..."
log ""

# Track results
TOTAL=0
SUCCESS=0
FAILED=0

# Warmup each address
for pair in "Bob:$BOB" "Vitalik:$VITALIK" "Alice:$ALICE"; do
  name="${pair%%:*}"
  address="${pair##*:}"
  TOTAL=$((TOTAL + 1))
  
  if warmup_address "$name" "$address"; then
    SUCCESS=$((SUCCESS + 1))
  else
    FAILED=$((FAILED + 1))
  fi
  
  # Small delay between requests
  sleep 1
done

# Summary
log ""
log "═══════════════════════════════════════════════════════════════"
log ""

if [ $FAILED -eq 0 ]; then
  log_success "All $SUCCESS addresses warmed up successfully!"
  log ""
  log_info "Cache is now active (TTL: 5 minutes)"
  log_info "You can start your demo presentation!"
else
  log_warning "$SUCCESS/$TOTAL addresses warmed up"
  log_error "$FAILED addresses failed"
fi

log ""

# Verify cache is working
log_info "Verifying cache..."
START=$(date +%s%N)
curl -s "$API_BASE/api/credit/score?wallet=$BOB" > /dev/null
END=$(date +%s%N)
CACHE_TIME=$(( (END - START) / 1000000 ))

if [ $CACHE_TIME -lt 500 ]; then
  log_success "Cache verified! Response time: ${CACHE_TIME}ms (expected < 500ms)"
else
  log_warning "Cache may not be working. Response time: ${CACHE_TIME}ms"
fi

log ""
log "═══════════════════════════════════════════════════════════════"
log ""

# Exit with appropriate code
if [ $FAILED -eq 0 ]; then
  exit 0
else
  exit 1
fi
