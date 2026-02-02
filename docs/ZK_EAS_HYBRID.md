# 🔐 ZK + EAS Hybrid Architecture

**The Best of Both Worlds: Privacy + On-Chain Verifiability**

---

## 🎯 Core Concept

```
┌─────────────────────────────────────────────────────────────┐
│  Problem: Current design has a privacy paradox              │
│                                                             │
│  ❌ Option A: EAS with plaintext score                     │
│     → On-chain verifiable BUT no privacy                   │
│                                                             │
│  ❌ Option B: ZK proof only                                │
│     → Privacy BUT no on-chain anchor                       │
│                                                             │
│  ✅ Solution: ZK + EAS Hybrid                              │
│     → EAS stores COMMITMENT (not score)                    │
│     → ZK proof references commitment                       │
│     → Privacy + On-chain verifiability!                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture

### Traditional EAS (Current)

```
EAS Attestation (On-Chain):
  ├── score: 762 ← ❌ PUBLICLY VISIBLE
  ├── level: "Gold"
  └── timestamp: 1706500000

Problem: Anyone can see exact score on blockchain!
```

### ZK-Friendly EAS (Improved)

```
EAS Attestation (On-Chain):
  ├── commitment: 0x14620111... ← ✅ Poseidon(score, salt)
  ├── minTier: 3 ← ✅ Only minimum tier
  └── timestamp: 1706500000

Score Privacy: ✅ Exact score hidden
ZK Compatible: ✅ Commitment used as public input
On-Chain: ✅ Verifiable attestation exists
```

---

## 🔄 Complete Flow

### Step 1: User Creates Commitment Attestation

```bash
# User requests attestation
POST /api/credit/attest-commitment
Body: { "wallet": "0x8103ac5D4a8C01Be2181AF080794411376C7f61c" }

# Server response
{
  "score": {
    "internal": 75,           # Keep this private!
    "fico": 712,
    "level": 3,
    "levelName": "Gold"
  },
  "commitment": "0x14620111291356635582878145521374913512573769864401976371218276764629908892142",
  "salt": "0x3d7f42a1...",     # ⚠️ MUST STORE THIS!
  "attestation": {
    "attestationId": "0xabc...",
    "explorerUrl": "https://sepolia.easscan.org/attestation/view/0xabc...",
    "commitment": "0x14620111...",
    "minTier": 3,
    "isSimulated": false
  },
  "warning": "IMPORTANT: Store the salt value! You need it to generate ZK proofs."
}
```

**What's On-Chain** (visible to everyone):
- ✅ Commitment: `0x14620111...` (cannot reverse to get score)
- ✅ Minimum Tier: `3` (user is at least Gold)
- ✅ Timestamp: `1706500000`

**What's Off-Chain** (only user knows):
- 🔒 Exact Score: `75`
- 🔒 Salt: `0x3d7f42a1...`

---

### Step 2: User Generates ZK Proof

```bash
# User generates proof (client-side or via API)
POST /api/zkp/generate
Body: {
  "wallet": "0x8103ac5D4a8C01Be2181AF080794411376C7f61c",
  "score": 75,              # Private input
  "salt": "0x3d7f42a1...",  # Private input
  "targetTier": 3           # Public claim
}

# Response
{
  "proof": {
    "pi_a": ["13183526...", "20565538...", "1"],
    "pi_b": [...],
    "pi_c": [...],
    "protocol": "groth16",
    "curve": "bn128"
  },
  "publicSignals": [
    "3",                  # tier (Gold)
    "60",                 # lowerBound
    "79",                 # upperBound
    "0x14620111..."       # commitment (from EAS!)
  ],
  "commitment": "0x14620111...",
  "isSimulated": false
}
```

**Public Signals** (what the bank sees):
- Tier: `3` (Gold)
- Bounds: `60-79`
- Commitment: `0x14620111...` (matches EAS!)

**Private Inputs** (hidden from bank):
- Exact score: `75`
- Salt: `0x3d7f42a1...`

---

### Step 3: Bank Verifies

```javascript
// Bank's verification process

// 1. Read commitment from EAS (on-chain)
const easAttestation = await eas.getAttestation("0xabc...");
const onChainCommitment = easAttestation.data.commitment;
// → "0x14620111..."

// 2. Verify ZK proof
POST /api/zkp/verify
Body: {
  "proof": { ... },
  "publicSignals": [
    "3",              // tier
    "60",             // lowerBound
    "79",             // upperBound
    "0x14620111..."   // commitment
  ]
}

Response: {
  "valid": true,
  "tier": 3,
  "tierName": "Gold",
  "bounds": { "lower": 60, "upper": 79 },
  "message": "Proof verified: User is in Gold tier (score 60-79)"
}

// 3. Cross-check commitment
if (publicSignals[3] === onChainCommitment) {
  // ✅ Commitment in proof matches EAS attestation
  // ✅ User's score is in Gold tier (60-79)
  // ✅ KarmaTrust attested to this commitment
  
  // Approve loan with Gold tier rates
  approveLoan(user, tier=3, collateral=125%);
}
```

**Bank's Knowledge**:
- ✅ User has a score in Gold tier (60-79)
- ✅ Score was attested by KarmaTrust (via EAS)
- ✅ Commitment is on-chain (immutable)
- ❌ Bank does NOT know exact score (could be 60, 70, or 79)

---

## 🔒 Privacy Analysis

### What's Public

| Data | Visibility | Can Infer |
|------|-----------|-----------|
| Commitment | Public on-chain | ❌ Cannot reverse to score |
| Min Tier | Public on-chain | ✅ User is ≥ Gold (≥60) |
| Timestamp | Public on-chain | ✅ When attested |
| Attestation UID | Public on-chain | ✅ Attestation exists |

### What's Private

| Data | Known By | Leaked? |
|------|---------|---------|
| Exact Score (75) | Only user | ❌ Never revealed |
| Salt | Only user | ❌ Never revealed |
| Wallet history | Only user | ❌ Not exposed |

### Attack Resistance

**Q: Can someone brute-force the commitment?**

**A**: No.

```
Commitment = Poseidon(score, salt)

Score range: 0-100 (101 possibilities)
Salt space: 2^256 (effectively infinite)

Total combinations: 101 × 2^256 ≈ 1.2 × 10^79

Even at 1 trillion guesses/second:
Time to crack = 3.8 × 10^61 years
(Universe age = 1.4 × 10^10 years)

Conclusion: Computationally infeasible
```

**Q: Can banks collude to deanonymize users?**

**A**: No, because:
- Commitment is bound to a specific salt
- Each attestation uses a fresh salt
- Banks only see tier ranges, not exact scores
- No correlation possible across attestations

---

## 🎯 Use Cases

### Case 1: Privacy-Conscious High Earner

```
User Profile:
  - Score: 850 (Diamond)
  - Assets: $10M portfolio
  - Goal: Get loan without exposing wealth

Flow:
  1. Create commitment attestation
     → EAS shows: commitment + "Diamond tier"
  2. Generate ZK proof
     → Proves: "Score is 90-100"
  3. Bank approves Diamond rates
     → WITHOUT learning exact $10M

Result: ✅ Best rates + Privacy preserved
```

### Case 2: Marginal Credit User

```
User Profile:
  - Score: 610 (Silver)
  - Goal: Qualify for loan without stigma

Flow:
  1. Create commitment attestation
     → EAS shows: commitment + "Silver tier"
  2. Generate ZK proof
     → Proves: "Score is 40-59"
  3. Bank sees: "Meets Silver threshold"
     → WITHOUT seeing "barely made it (610)"

Result: ✅ Qualified + No reputation damage
```

### Case 3: DeFi Protocol Integration

```
Smart Contract Scenario:
  - Protocol: Aave/Compound
  - Requirement: Automated under-collateralization

Flow:
  1. User submits attestation UID
  2. Contract reads EAS on-chain
     → Verifies: commitment + minTier exist
  3. Contract verifies ZK proof on-chain
     → Groth16 verification (gas: ~280k)
  4. Integrator's contract (e.g., lending protocol) can grant benefits
     → Example: lower collateral ratio based on verified tier

Result: ✅ Trustless + On-chain + Private + Integrator decides policy
```

---

## 📊 Comparison Table

| Feature | V1 (Plaintext) | V2 (Commitment) |
|---------|----------------|-----------------|
| **Privacy** | ❌ Score public | ✅ Score hidden |
| **On-Chain** | ✅ Verifiable | ✅ Verifiable |
| **ZK Compatible** | ⚠️ Not needed | ✅ Native support |
| **Gas Cost** | ~$0.50 | ~$0.50 (same) |
| **Trust Model** | Trust attestor | Trust attestor + math |
| **Revocable** | ✅ Yes | ✅ Yes |
| **Smart Contract** | ✅ Easy read | ⚠️ ZK verify needed |
| **User Experience** | Simple | Medium (store salt) |

---

## 🛠️ Implementation

### Backend API

```javascript
// Create commitment attestation
POST /api/credit/attest-commitment
Body: { "wallet": "0x..." }

// Generate ZK proof (references commitment)
POST /api/zkp/generate
Body: {
  "wallet": "0x...",
  "score": 75,          // Private
  "salt": "0x...",      // Private
  "targetTier": 3
}

// Verify ZK proof
POST /api/zkp/verify
Body: {
  "proof": { ... },
  "publicSignals": [ tier, lower, upper, commitment ]
}
```

### Smart Contract

```solidity
// Verify commitment attestation + ZK proof
function borrowWithZKProof(
    bytes32 attestationUID,
    bytes calldata zkProof,
    uint8 claimedTier
) external {
    // 1. Read EAS attestation
    Attestation memory att = eas.getAttestation(attestationUID);
    require(att.recipient == msg.sender);
    
    // 2. Decode commitment from attestation data
    (bytes32 commitment, uint8 minTier,) = abi.decode(
        att.data,
        (bytes32, uint8, uint64)
    );
    
    // 3. Verify ZK proof
    require(
        zkpVerifier.verifyTierMembershipProof(
            zkProof,
            claimedTier,
            commitment  // Public signal matches EAS!
        ),
        "Invalid ZK proof"
    );
    
    // 4. Grant loan based on tier
    _approveLoan(msg.sender, claimedTier);
}
```

---

## ✅ Advantages

1. **Privacy**: Exact score never revealed
2. **Verifiability**: Commitment anchored on-chain via EAS
3. **Trustless**: ZK proof mathematically guarantees claim
4. **Revocable**: EAS attestations can be revoked if fraud detected
5. **Standard**: Uses EAS (Coinbase, Gitcoin) + Groth16 (ZCash)
6. **Flexible**: Works for both privacy and transparency use cases

---

## 🚀 Deployment Status

| Component | Status | Network |
|-----------|--------|---------|
| EAS V1 (plaintext) | ✅ Deployed | Sepolia |
| EAS V2 (commitment) | ⚠️ Code ready | Not deployed |
| ZK Circuit | ✅ Compiled | Local |
| Backend API V2 | ✅ Implemented | Localhost |
| Frontend UI | ⏳ TODO | - |

**Next Steps**:
1. Register V2 schema on EAS Schema Registry
2. Deploy commitment attestation flow
3. Update frontend to support both modes
4. Add user guide for salt management

---

## 📚 Further Reading

- [EAS Documentation](https://docs.attest.sh/)
- [Poseidon Hash Paper](https://eprint.iacr.org/2019/458.pdf)
- [Groth16 Protocol](https://eprint.iacr.org/2016/260.pdf)
- [Commitment Schemes](https://en.wikipedia.org/wiki/Commitment_scheme)

---

**Built with ❤️ for ETHGlobal Hackathon**
