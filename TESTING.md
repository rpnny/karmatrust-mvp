# KarmaTrust Testing Guide

## 🎯 Pre-Testing Checklist

### 1. Install Node.js

```bash
# Check if Node.js is installed
node --version  # Should be v20+
npm --version   # Should be v10+

# If not installed, download from:
# https://nodejs.org/ (LTS version recommended)
```

---

## 🚀 Quick Start Testing

### Phase 1: Backend Testing

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# Expected output:
# ═══════════════════════════════════════════════════════════
#   🏆 KarmaTrust API Server
# ═══════════════════════════════════════════════════════════
#   ✓ Server running on port 3000
#   ✓ Environment: development
```

**Keep this terminal open!**

---

### Phase 2: Backend API Testing

Open a **NEW terminal** and test the endpoints:

#### Test 1: Health Check

```bash
curl http://localhost:3000/api/health
```

**Expected:**
```json
{
  "status": "ok",
  "timestamp": 1706500000000,
  "version": "1.0.0"
}
```

✅ **Pass Criteria:** Returns 200 status with JSON response

---

#### Test 2: Credit Score Calculation

```bash
# Test with Vitalik's address
curl "http://localhost:3000/api/credit/score?wallet=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "score": 762,
    "internalScore": 84,
    "risk": "Low",
    "level": 4,
    "levelName": "Platinum",
    "factors": {
      "walletAge": 0.95,
      "transactionFrequency": 0.88,
      ...
    },
    "timestamp": 1706500000000,
    "wallet": "0xd8dA..."
  }
}
```

✅ **Pass Criteria:** 
- Returns score between 300-850
- Risk level is "Low", "Medium", or "High"
- All factors are numbers between 0-1

---

#### Test 3: EAS Attestation (Simulation Mode)

```bash
curl -X POST http://localhost:3000/api/credit/attest \
  -H "Content-Type: application/json" \
  -d '{"wallet": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"}'
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "score": { ... },
    "attestation": {
      "attestationId": "0x...",
      "explorerUrl": "https://sepolia.easscan.org/attestation/view/0x...",
      "mode": "simulation"
    }
  }
}
```

✅ **Pass Criteria:** Returns attestation ID (simulated is OK)

---

#### Test 4: VCSM State Initialization

```bash
curl -X POST http://localhost:3000/api/vcsm/init \
  -H "Content-Type: application/json" \
  -d '{"userId": "0xTEST123", "initialScore": 50}'
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "stateId": "uuid-here",
    "level": 2,
    "levelName": "Silver",
    "score": 50,
    "stateHash": "12345...",
    "version": 1
  }
}
```

✅ **Pass Criteria:** Returns valid state with hash

---

#### Test 5: ZK Proof Generation (Simulated)

```bash
curl -X POST http://localhost:3000/api/zkp/generate \
  -H "Content-Type: application/json" \
  -d '{"score": 75, "targetTier": 3}'
```

**Expected:**
```json
{
  "success": true,
  "data": {
    "proof": {
      "pi_a": [...],
      "pi_b": [...],
      "pi_c": [...]
    },
    "publicSignals": [...],
    "simulated": true
  }
}
```

✅ **Pass Criteria:** Returns proof structure

---

### Phase 3: Frontend Testing

In a **NEW terminal** (keep backend running):

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Expected output:
#   VITE v5.0.8  ready in 500 ms
#
#   ➜  Local:   http://localhost:5173/
#   ➜  Network: use --host to expose
```

---

### Phase 4: Frontend UI Testing

Open browser: http://localhost:5173

#### Test 1: Home Page

**Check:**
- [ ] "KarmaTrust" logo visible
- [ ] Wallet address input box visible
- [ ] "查询信用 →" button visible
- [ ] Quick links: "Vitalik", "Paradigm" visible

**Action:** Click "Vitalik" link

✅ **Pass:** Navigates to `/dashboard/0xd8dA...`

---

#### Test 2: Dashboard - User View

**Check:**
- [ ] Score gauge displays (e.g., 762)
- [ ] FICO Score label visible
- [ ] Risk level badge shows (Low/Medium/High)
- [ ] Factor bars display with percentages
- [ ] All factor names formatted correctly

**Expected Factors:**
- Wallet Age: ~95%
- Transaction Frequency: ~88%
- Protocol Diversity: ~72%
- Asset Value: ~90%
- Active Usage: ~100%
- Volatility: ~15%

✅ **Pass:** All UI elements render, no console errors

---

#### Test 3: Dashboard - Attestation Card

**Action:** Click "Create Attestation" button

**Check:**
- [ ] Button shows "创建中..." during loading
- [ ] After ~1s, shows attestation details
- [ ] Attestation ID displayed
- [ ] "查看 EASScan ↗" link visible
- [ ] Link format: `https://sepolia.easscan.org/attestation/view/0x...`

✅ **Pass:** Attestation created successfully

---

#### Test 4: Dashboard - State Card (VCSM)

**Check:**
- [ ] Current level displayed (e.g., "Platinum")
- [ ] State hash visible
- [ ] Version number shown
- [ ] "Trigger Transition" button visible

**Action:** Click "Trigger Transition"

**Expected:** Modal or state updates

✅ **Pass:** State transition can be triggered

---

#### Test 5: Split-Screen (User vs Bank View)

**Navigate to:** `/demo`

**Check:**
- [ ] Left side: User View
  - Score fully visible (e.g., 762)
  - All factors displayed
- [ ] Right side: Bank View
  - Score shows "???" or masked
  - Only tier verified checkmark
  - "Verify Proof" button visible

✅ **Pass:** Privacy contrast clearly demonstrated

---

### Phase 5: Browser Console Testing

Open DevTools (F12) → Console

**Check for:**
- [ ] No red errors
- [ ] API calls show 200 status
- [ ] Fetch requests to `/api/credit/score` succeed

**Network Tab:**
- [ ] `/api/credit/score` returns in < 2s
- [ ] Response size reasonable (< 5KB)

✅ **Pass:** No errors, API responsive

---

## 🐛 Common Issues & Fixes

### Issue 1: Backend won't start

**Error:** `command not found: npm`

**Fix:**
```bash
# Install Node.js first
# Download from: https://nodejs.org/
```

---

### Issue 2: Port 3000 already in use

**Error:** `EADDRINUSE: address already in use :::3000`

**Fix:**
```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in backend/.env
PORT=3001
```

---

### Issue 3: CORS errors in frontend

**Error:** `Access-Control-Allow-Origin`

**Fix:**
- Ensure backend is running on port 3000
- Check `backend/src/app.ts` has `cors()` middleware
- Verify `frontend/vite.config.ts` proxy settings:
  ```ts
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true
    }
  }
  ```

---

### Issue 4: TypeScript errors

**Error:** `Cannot find module 'xyz'`

**Fix:**
```bash
# Re-install dependencies
rm -rf node_modules package-lock.json
npm install
```

---

### Issue 5: Blank page in frontend

**Check:**
1. Console for errors
2. Backend is running
3. API health endpoint responds

**Fix:**
```bash
# Restart frontend
cd frontend
npm run dev
```

---

## 📊 Test Results Template

```
═══════════════════════════════════════════════════════════
  KARMATRUST TEST RESULTS
═══════════════════════════════════════════════════════════

Backend Tests:
  ✓ Health check                    [PASS]
  ✓ Credit score calculation        [PASS]
  ✓ EAS attestation                 [PASS]
  ✓ VCSM initialization             [PASS]
  ✓ ZK proof generation             [PASS]

Frontend Tests:
  ✓ Home page render                [PASS]
  ✓ Dashboard navigation            [PASS]
  ✓ Score gauge display             [PASS]
  ✓ Factor charts                   [PASS]
  ✓ Attestation creation            [PASS]
  ✓ State transitions               [PASS]
  ✓ Split-screen demo               [PASS]

Performance:
  ✓ API response time < 2s          [PASS]
  ✓ Frontend load time < 1s         [PASS]
  ✓ No console errors               [PASS]

Overall: 13/13 PASSED ✅
═══════════════════════════════════════════════════════════
```

---

## 🎬 Demo Presentation Checklist

Before showing to judges:

### Setup
- [ ] Backend running (no errors in terminal)
- [ ] Frontend running (http://localhost:5173)
- [ ] Browser DevTools closed (cleaner demo)
- [ ] Window layout prepared (half screen each)

### Demo Flow
1. **Home Screen** (5s)
   - "This is KarmaTrust, on-chain credit with ZK privacy"

2. **Click Vitalik** (3s)
   - "Let's analyze Vitalik's wallet"

3. **Dashboard - User View** (15s)
   - "User sees full score: 762 (Platinum tier)"
   - "Based on 8 on-chain factors"
   - Point to each factor

4. **Create Attestation** (10s)
   - Click button
   - "This creates an on-chain EAS credential"
   - Show EASScan link

5. **Navigate to Demo** (10s)
   - Show split-screen
   - "**Left:** User sees everything"
   - "**Right:** Bank only sees tier verification"

6. **Explain Innovation** (20s)
   - "The key: anti-sybil check is IN the ZK circuit"
   - Show code snippet if time
   - "Even with money, you can't fake wallet age"

7. **Value Proposition** (10s)
   - "Diamond tier: 110% collateral vs 150% standard"
   - "That's 27% capital savings!"

**Total: ~73 seconds** (leaves buffer for questions)

---

## 🔧 Advanced Testing (Optional)

### Contract Testing

```bash
cd contracts
npm install
npx hardhat test

# Expected: All tests pass
```

### Circuit Compilation

```bash
cd circuits
npm install

# This requires circom installed globally
circom tier_membership.circom --r1cs --wasm --sym

# Expected: Files in build/
```

---

## ✅ Test Sign-Off

**Tested by:** _____________  
**Date:** _____________  
**All tests passed:** ☐ Yes  ☐ No  
**Ready for demo:** ☐ Yes  ☐ No  

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

**Last Updated:** January 2026
