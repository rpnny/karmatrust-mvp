# ⚡ Real ZK Proof Testing Guide

> **This is NOT a simulation. These are real cryptographic proofs using Circom + snarkjs.**

---

## 🎯 Quick Test (5 minutes)

### Prerequisites
- Backend running on `localhost:3000`
- Circuit files compiled in `circuits/build/`

### Test 1: Generate Real ZK Proof

```bash
curl -X POST http://localhost:3000/api/zkp/generate \
  -H "Content-Type: application/json" \
  -d '{"wallet": "0x8103ac5D4a8C01Be2181AF080794411376C7f61c"}' \
  | jq '.'
```

**Expected Output**:
```json
{
  "success": true,
  "data": {
    "proof": {
      "pi_a": ["12108589170971981768...", "20215954376622610442...", "1"],
      "pi_b": [...],
      "pi_c": [...]
    },
    "tier": 3,
    "tierName": "Gold",
    "bounds": { "lower": 60, "upper": 79 },
    "commitment": "18258106981840944118...",
    "isSimulated": false  ← REAL PROOF!
  },
  "meta": {
    "processingTimeMs": 1855  ← ~1.8 seconds
  }
}
```

**Key Indicators of Real Proof**:
- ✅ `"isSimulated": false`
- ✅ `processingTimeMs` between 1000-3000ms
- ✅ `pi_a`, `pi_b`, `pi_c` contain large numbers (field elements)
- ✅ `commitment` is a Poseidon hash (large integer)

---

### Test 2: Verify the Proof

Copy the proof from Test 1 and verify it:

```bash
curl -X POST http://localhost:3000/api/zkp/verify \
  -H "Content-Type: application/json" \
  -d '{
  "proof": {
    "pi_a": ["12108589170971981768...", "20215954376622610442...", "1"],
    "pi_b": [...],
    "pi_c": [...]
  },
  "publicSignals": ["3", "60", "79", "18258106981840944118..."]
}' \
  | jq '.'
```

**Expected Output**:
```json
{
  "success": true,
  "data": {
    "valid": true,  ← VERIFIED!
    "tier": 3,
    "tierName": "Gold",
    "isSimulated": false,  ← REAL VERIFICATION!
    "message": "Proof verified: User is in Gold tier (score 60-79)"
  },
  "meta": {
    "processingTimeMs": 9  ← Lightning fast!
  }
}
```

**Key Indicators of Real Verification**:
- ✅ `"valid": true`
- ✅ `"isSimulated": false`
- ✅ `processingTimeMs` < 50ms (usually ~9ms)
- ✅ Uses actual verification key from `circuits/build/verification_key.json`

---

### Test 3: Check ZK Service Status

```bash
curl http://localhost:3000/api/zkp/status | jq '.'
```

**Expected Output**:
```json
{
  "success": true,
  "data": {
    "mode": "real",  ← NOT "simulation"!
    "circuitsAvailable": true,
    "tiers": [...],
    "note": "Running in real mode with compiled ZK circuits."
  }
}
```

---

## 🧪 Advanced Testing

### Test Different Tiers

Try generating proofs for different wallet addresses to see different tiers:

```bash
# Bronze tier (low score)
curl -X POST http://localhost:3000/api/zkp/generate \
  -H "Content-Type: application/json" \
  -d '{"wallet": "0xabcdefABCDEF12345678901234567890ABCDEF12"}' \
  | jq '.data.tierName'

# Gold tier (high score)
curl -X POST http://localhost:3000/api/zkp/generate \
  -H "Content-Type: application/json" \
  -d '{"wallet": "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"}' \
  | jq '.data.tierName'
```

---

### Verify Backend Logs

Check backend terminal output during proof generation:

```
[ZKP] Generating proof for 0x8103ac5D...
[ZKP] Generating REAL ZK proof using snarkjs...
[ZKP] ✅ Real ZK proof generated successfully!
[ZKP] Proof generated in 1855ms (real)
```

---

## 📊 Performance Benchmarks

Run 10 proofs and average the time:

```bash
for i in {1..10}; do
  curl -s -X POST http://localhost:3000/api/zkp/generate \
    -H "Content-Type: application/json" \
    -d '{"wallet": "0x8103ac5D4a8C01Be2181AF080794411376C7f61c"}' \
    | jq '.meta.processingTimeMs'
done | awk '{sum+=$1} END {print "Average: " sum/NR "ms"}'
```

**Expected Average**: ~1800-2000ms

---

## 🔍 How to Tell if Circuits Are Loaded

### Check 1: Backend Startup Logs

Look for these messages when backend starts:

```
✅ Good (Real Mode):
[ZKP] Checking circuit files:
[ZKP]   WASM: /path/to/tier_membership.wasm → ✅
[ZKP]   ZKEY: /path/to/tier_membership_final.zkey → ✅
[ZKP] 🎉 Real ZK Proof mode enabled! Using actual Circom circuits.

❌ Bad (Simulation Mode):
[ZKP]   WASM: /path/to/tier_membership.wasm → ❌
[ZKP]   ZKEY: /path/to/tier_membership_final.zkey → ❌
[ZKP] ⚠️  Simulation mode (circuits not found)
```

### Check 2: File Existence

```bash
ls -lh circuits/build/tier_membership_final.zkey
ls -lh circuits/build/tier_membership_js/tier_membership.wasm
ls -lh circuits/build/verification_key.json
```

All three files must exist and have non-zero size.

### Check 3: API Response

```bash
curl http://localhost:3000/api/zkp/status | jq '.data.mode'
# Output: "real" (good) or "simulation" (bad)
```

---

## 🐛 Troubleshooting

### Issue: `"isSimulated": true` in response

**Cause**: Circuit files not found  
**Solution**:
```bash
cd circuits
npm run build:circuits
# Wait for compilation (2-5 minutes)
# Restart backend
```

### Issue: `"mode": "simulation"` in status

**Cause**: snarkjs not installed or circuit files missing  
**Solution**:
```bash
npm install snarkjs  # Install snarkjs
cd circuits && npm run build:circuits  # Compile circuits
```

### Issue: Proof generation takes < 100ms

**Cause**: Using simulation, not real proofs  
**Solution**: Check backend logs for circuit loading errors

---

## 🎉 Success Checklist

If all of these are true, you have REAL ZK proofs working:

- [x] `"isSimulated": false` in proof generation response
- [x] `"isSimulated": false` in proof verification response
- [x] `"mode": "real"` in status endpoint
- [x] Proof generation takes 1-3 seconds
- [x] Proof verification takes < 50ms
- [x] Backend logs show "✅ Real ZK proof generated successfully!"
- [x] Circuit files exist in `circuits/build/`

---

## 📚 Technical Details

### What Makes This Real?

1. **Compiled Circom Circuit**:
   - `tier_membership.circom` → `tier_membership.wasm`
   - Contains actual ZK constraints
   - Enforces mathematical relationships

2. **Trusted Setup (Powers of Tau)**:
   - `pot12_final.ptau` → `tier_membership_final.zkey`
   - Cryptographic parameters for proof generation

3. **Verification Key**:
   - `verification_key.json`
   - Used by snarkjs to verify proofs
   - Ensures only valid proofs are accepted

4. **Groth16 Protocol**:
   - Industry-standard ZK proving system
   - Used by Zcash, Filecoin, etc.
   - Produces succinct proofs (~200 bytes)

---

## 🏆 Demo Tips for Judges

1. **Show Backend Logs**:
   ```
   [ZKP] 🎉 Real ZK Proof mode enabled!
   [ZKP] ✅ Real ZK proof generated successfully!
   ```

2. **Show Performance**:
   ```
   Proof Generation: 1.8 seconds
   Proof Verification: 9 milliseconds
   ```

3. **Show isSimulated Flag**:
   ```json
   "isSimulated": false  ← Point this out!
   ```

4. **Compare to Competitors**:
   ```
   Most hackathons: "We'll add ZK later" (simulation)
   KarmaTrust: Real Circom circuits, real cryptography
   ```

---

**Last Updated**: 2026-01-31  
**Circuit Version**: tier_membership.circom v1.0  
**Proving System**: Groth16  
**Curve**: BN128

