# 🔐 Privacy Mode User Guide

**Complete guide to using KarmaTrust's Privacy Mode for maximum privacy protection**

---

## 🎯 What is Privacy Mode?

Privacy Mode allows you to **prove your creditworthiness without revealing your exact score**. Instead of publishing your score on-chain, you:

1. Store a cryptographic **commitment** on-chain (cannot be reversed)
2. Keep your **salt** private (your secret key)
3. Generate **Zero-Knowledge Proofs** to prove claims about your score

**Result**: Banks can verify you meet their requirements, but they never learn your exact score.

---

## 🔄 Complete Workflow

### **Step 1: Create a Privacy Attestation**

When you first join KarmaTrust, create a Privacy Mode attestation:

```bash
POST /api/credit/attest-commitment
Body: { "wallet": "0x..." }

Response:
{
  "score": {
    "internal": 75,      # Keep this private!
    "fico": 712,
    "level": 3,
    "levelName": "Gold"
  },
  "commitment": "0x13b86165cf75f68b...",  # Public (on-chain)
  "salt": "0xbf7a20efbb35a757...",        # ⚠️ MUST STORE THIS!
  "attestation": {
    "attestationId": "0xabc...",
    "explorerUrl": "https://sepolia.easscan.org/...",
    "minTier": 3,
    "isSimulated": false
  }
}
```

#### ⚠️ **CRITICAL: Store Your Salt!**

**The salt is like a password for your credit score.** You need it to generate ZK proofs later.

**Where to store it:**
- ✅ Password manager (1Password, LastPass, Bitwarden)
- ✅ Encrypted local file
- ✅ Secure notes app
- ❌ **NEVER** share it with anyone
- ❌ **NEVER** post it publicly

**What if you lose it?**
- You cannot generate proofs anymore
- You'll need to create a new attestation (with a new salt)

---

### **Step 2: Verify Your On-Chain Commitment**

Your commitment is now on the Sepolia blockchain. Anyone can see it, but it reveals nothing about your score!

**Visit EASScan:**
```
https://sepolia.easscan.org/attestation/view/{attestationId}
```

**What's visible:**
```
Schema: Credit Score Commitment V2
Data:
  ├── commitment: 0x13b86165cf75f68b... ✅ Public (irreversible)
  ├── minTier: 3                        ✅ Public (Gold tier)
  └── timestamp: 1706500000             ✅ Public
```

**What's hidden:**
```
❌ Exact score: 75 (not on-chain!)
❌ Salt: 0xbf7a20ef... (you keep it!)
❌ Any other attributes
```

**Key point**: Even if someone knows you're in the "Gold" tier (60-79 range), they don't know if you're at 60 or 79. That's a huge privacy gain!

---

### **Step 3: Generate a ZK Proof (Privacy Mode)**

When you want to prove something to a bank, generate a ZK proof using your salt:

#### **Option A: Via Frontend**

1. Go to the Demo page
2. Scroll to "ZK PROOF" section
3. Click "🔐 Privacy Mode" tab
4. Paste your **salt**
5. Paste your **commitment** (from EASScan or your attestation response)
6. Click "Generate ZK Proof (Privacy Mode)"

#### **Option B: Via API**

```bash
POST /api/zkp/generate
Body: {
  "wallet": "0x...",
  "salt": "0xbf7a20efbb35a757...",      # From Step 1
  "commitment": "0x13b86165cf75f68b..."  # From Step 1 or EASScan
}

Response:
{
  "success": true,
  "data": {
    "proof": {
      "pi_a": [...],
      "pi_b": [...],
      "pi_c": [...]
    },
    "publicSignals": [
      "0x13b86165cf75f68b...",  # Commitment (matches on-chain)
      "3",                       # Tier (Gold)
      "60",                      # Lower bound
      "79"                       # Upper bound
    ],
    "commitment": "0x13b86165cf75f68b...",
    "salt": "0xbf7a20efbb35a757...",
    "tier": 3,
    "tierName": "Gold",
    "isSimulated": false
  },
  "meta": {
    "processingTimeMs": 1103
  }
}
```

**What happens internally:**

1. Backend fetches your current score: `75`
2. Backend computes: `Poseidon(75, your_salt)`
3. Backend verifies: `computed_commitment == provided_commitment`
   - ✅ If match: Your salt is correct, proceed
   - ❌ If mismatch: Your salt is wrong, reject
4. Backend generates ZK proof: "I know a score in [60, 79] that matches the on-chain commitment"
5. Proof is returned (valid for ~10 minutes)

---

### **Step 4: Share Proof with Bank**

Send the ZK proof to the bank. The bank will:

1. **Read your commitment** from EASScan (public, on-chain)
2. **Verify the ZK proof** against the commitment
3. **Learn only**: "This user has a Gold tier score (60-79)"
4. **NOT learn**: "This user has exactly 75"

**Bank verification (pseudo-code):**

```typescript
const commitment = readFromEAS(userAddress);  // 0x13b86165cf75f68b...
const isValid = verifyZKProof(proof, commitment, tier=3);

if (isValid) {
  // ✅ Cryptographic guarantee: User's score is in [60, 79]
  // ✅ Commitment matches on-chain record
  // ✅ User knows the correct salt (possession proof)
  approveLoan();
} else {
  // ❌ Proof is invalid or manipulated
  rejectLoan();
}
```

**Key benefits:**
- ✅ Bank never sees your exact score
- ✅ Bank has cryptographic proof you meet requirements
- ✅ You control what information to reveal (tier level)
- ✅ Impossible to forge or manipulate

---

## 🆚 Privacy Mode vs. Public Mode

| Feature | Public Mode | Privacy Mode |
|---------|-------------|--------------|
| **Score Visibility** | ❌ Public (anyone can see) | ✅ Hidden (cryptographically) |
| **On-Chain Data** | Exact FICO score | Only commitment + minTier |
| **ZK Proof Required** | Optional (score already visible) | ✅ Mandatory (only way to verify) |
| **Salt Management** | Not needed | ⚠️ Must store securely |
| **Privacy Level** | Low | High |
| **Flexibility** | Fixed tier | Can prove any tier ≤ actual |
| **Use Case** | Best rates for high scores | Maximum privacy |

---

## 🔧 Advanced Features

### **Proving Lower Tiers**

You can prove a **lower** tier than your actual tier for privacy:

```bash
# Actual tier: Gold (3), but prove only Silver (2)
POST /api/zkp/generate
Body: {
  "wallet": "0x...",
  "tier": 2,           # Request Silver proof
  "salt": "...",
  "commitment": "..."
}

Response:
{
  "tierName": "Silver",
  "bounds": { "lower": 40, "upper": 59 }
}
```

**Why do this?**
- You only need Silver tier for a loan
- Revealing Gold would show you're "overqualified"
- Banks might charge you less if they think you're Silver

**Limitation:**
- ❌ Cannot prove a higher tier than your actual tier
- ✅ Can prove your actual tier or any tier below it

### **Re-using the Same Commitment**

You can generate **multiple proofs** with the same salt and commitment:

```bash
# Proof 1: Prove Gold tier to Bank A
POST /api/zkp/generate
Body: { "wallet": "...", "tier": 3, "salt": "...", "commitment": "..." }

# Proof 2: Prove Silver tier to Bank B (same salt/commitment!)
POST /api/zkp/generate
Body: { "wallet": "...", "tier": 2, "salt": "...", "commitment": "..." }
```

**As long as your score doesn't change**, your salt and commitment remain valid!

**When to create a new attestation:**
- Your score changes significantly (e.g., Bronze → Gold)
- You want to update your on-chain minTier
- You lost your salt (need to start over)

---

## 🛡️ Security Best Practices

### **1. Protect Your Salt**
```
Salt = Password for your credit score
Lose it → Cannot generate proofs
Leak it → Privacy compromised
```

### **2. Verify Commitment On-Chain**
```
Before generating proofs, verify your commitment is actually on EASScan:
https://sepolia.easscan.org/attestation/view/{attestationId}

Ensure:
✓ Schema matches "Credit Score Commitment V2"
✓ Commitment value matches what you received
✓ minTier is correct
```

### **3. Don't Reuse Salts**
```
❌ Never use the same salt for multiple attestations
✅ Backend generates a new random salt each time
✅ Each attestation is independent
```

### **4. Monitor Your Attestations**
```
Keep a record of:
- Attestation IDs
- Salts (encrypted)
- Creation dates
- Associated commitments

This helps you track which proofs are valid.
```

---

## 🐛 Troubleshooting

### **Error: "Commitment mismatch"**

**Cause**: The salt you provided doesn't match the on-chain commitment.

**Solutions**:
1. ✅ Double-check you copied the correct salt (no spaces, full hex string)
2. ✅ Ensure you're using the commitment from the **same attestation**
3. ✅ Verify your wallet address hasn't changed
4. ✅ If all else fails, create a new attestation

### **Error: "Cannot prove tier X. Your actual tier is Y."**

**Cause**: You're trying to prove a tier higher than your actual tier.

**Solution**:
- You can only prove your actual tier or lower
- Example: If you're Silver (2), you can prove Bronze (1) or Silver (2), but not Gold (3)

### **Error: "Invalid salt format"**

**Cause**: Salt is not in the correct format.

**Expected format**:
```
✅ 0xbf7a20efbb35a75711f6212dc3abbc7ee0e003afaa92f2bddacdefe052c48186
✅ bf7a20efbb35a75711f6212dc3abbc7ee0e003afaa92f2bddacdefe052c48186
❌ 0x123 (too short)
❌ abc (not hex)
```

---

## 📊 Example: Alice's Journey with Privacy Mode

### **Day 1: First-Time Setup**

Alice wants to borrow on KarmaTrust but values her privacy.

1. **Creates Privacy Attestation**
   ```
   Score: 72 (Gold tier)
   Receives: salt + commitment
   ```

2. **Stores Salt Securely**
   ```
   Saves salt in 1Password
   Verifies commitment on EASScan
   ```

3. **What's Public**
   ```
   ✓ Commitment: 0x13b86165...
   ✓ minTier: 3 (Gold)
   ```

4. **What's Private**
   ```
   ✗ Exact score: 72
   ✗ Salt: 0xbf7a20ef...
   ```

### **Day 7: Loan Application**

Alice applies for a loan at DeFi Bank.

1. **Generates ZK Proof**
   ```
   Uses her stored salt
   Proves: "I'm in Gold tier (60-79)"
   ```

2. **Submits Proof**
   ```
   Bank verifies proof
   Bank checks commitment on-chain
   Bank approves loan with 110% collateral (Gold tier rate)
   ```

3. **Privacy Preserved**
   ```
   Bank knows: Alice is Gold tier
   Bank doesn't know: Alice has exactly 72
   ```

### **Day 30: Second Loan**

Alice applies for another loan at a different bank.

1. **Re-uses Same Salt**
   ```
   Her score is still 72
   Same commitment is still on-chain
   Generates new proof with same salt
   ```

2. **Different Strategy**
   ```
   This loan only needs Silver tier
   Proves Silver (tier 2) instead of Gold
   Gets better interest rate (bank thinks she's Silver)
   ```

3. **Flexibility**
   ```
   One attestation → Multiple use cases
   Control what you reveal
   ```

---

## 🎓 Technical Deep Dive

### **Why Poseidon Hash?**

- ✅ **ZK-Friendly**: Only ~100 constraints (vs. SHA-256 ~27,000)
- ✅ **Fast**: Proof generation in 1-3 seconds
- ✅ **Secure**: Collision-resistant, one-way function
- ✅ **Ethereum-Compatible**: Works with Groth16 + BN128 curve

### **Why 256-bit Salt?**

```
Brute-force attacks:
- Without salt: 101 possible scores (0-100) → brute-force in seconds
- With 256-bit salt: 2^256 possibilities → infeasible

Computation:
2^256 = 10^77 operations
If attacker has 1 billion GPUs, each doing 1 trillion hashes/sec:
Still takes: 10^54 years (universe age: 10^10 years)
```

### **Circuit Constraints**

Our `tier_membership.circom` circuit:

```circom
template TierMembershipProof() {
  // Inputs (private)
  signal input score;
  signal input salt;
  
  // Inputs (public)
  signal input commitment;
  signal input lowerBound;
  signal input upperBound;
  
  // 1. Verify commitment
  component hasher = Poseidon(2);
  hasher.inputs[0] <== score;
  hasher.inputs[1] <== salt;
  hasher.out === commitment;  // ← Constraint 1
  
  // 2. Verify bounds
  assert(score >= lowerBound);  // ← Constraint 2
  assert(score <= upperBound);  // ← Constraint 3
}
```

**Total constraints**: ~150 (very efficient!)

---

## 🚀 Future Enhancements

### **Coming Soon**:
- ✅ Multi-tier proofs (prove "at least Silver AND at most Gold")
- ✅ Time-locked proofs (proof valid for 30 days only)
- ✅ Delegated proof generation (let a service generate proofs with your permission)
- ✅ Recovery mechanism (social recovery for lost salts)

---

## 📚 Further Reading

- [ZK + EAS Hybrid Architecture](./ZK_EAS_HYBRID.md)
- [VCSM Innovation](./VCSM_INNOVATION.md)
- [Circuit Performance](./CIRCUIT_PERFORMANCE.md)
- [API Documentation](./API.md)

---

**Privacy Mode is the future of on-chain credit scoring. Welcome to trustless, privacy-preserving DeFi!** 🔐✨
