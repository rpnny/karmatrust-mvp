# KarmaTrust Architecture

## System Overview

KarmaTrust is a decentralized credit scoring infrastructure that combines:

1. **On-chain data analysis** for credit scoring
2. **Zero-knowledge proofs** for privacy-preserving verification
3. **EAS attestations** for on-chain credentials
4. **VCSM (Verifiable Credit State Machine)** for trustless state management

---

## Core Components

### 1. Credit Scoring Engine

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CREDIT SCORING PIPELINE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │   Data       │    │   Factor     │    │   Score      │               │
│  │   Fetch      │ ─► │  Calculation │ ─► │   Output     │               │
│  └──────────────┘    └──────────────┘    └──────────────┘               │
│         │                   │                   │                        │
│         ▼                   ▼                   ▼                        │
│  • Etherscan API     • Wallet Age         • Internal: 0-100              │
│  • RPC Provider      • TX Frequency       • FICO: 300-850               │
│  • Deterministic     • Protocol Diversity • Risk Level                   │
│    Fallback          • Asset Value        • Credit Tier                  │
│                      • Volatility                                        │
│                      • Risk Flags                                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Data Sources (Multi-layer Fallback)

| Layer | Source | Trust Level | Speed |
|-------|--------|-------------|-------|
| Primary | Etherscan API | 100 | 1-2s |
| Secondary | RPC Provider | 80 | 0.5s |
| Fallback | Deterministic | 20 | <0.1s |

**Why multi-layer?**
- Etherscan rate limits during hackathon demo
- RPC may timeout under load
- Deterministic ensures demo always works

---

### 2. VCSM (Verifiable Credit State Machine)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              VCSM DESIGN                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│                        ┌───────────────────┐                             │
│                        │    CreditState    │                             │
│                        ├───────────────────┤                             │
│                        │ stateId           │                             │
│                        │ userId            │                             │
│                        │ level (public)    │  ◄── Needed for DeFi        │
│                        │ score (private)   │  ◄── Never exposed          │
│                        │ stateHash         │  ◄── Poseidon commitment    │
│                        │ previousHash      │  ◄── Chain linking          │
│                        │ version           │  ◄── Replay protection      │
│                        │ attributes        │                             │
│                        └───────────────────┘                             │
│                                                                          │
│  State Hash Calculation:                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ stateHash = Poseidon(score, level, salt)                        │    │
│  │                                                                  │    │
│  │ Why Poseidon?                                                   │    │
│  │ • ~300 constraints in ZK circuit (vs SHA256's ~25,000)          │    │
│  │ • Native support for BN254 elliptic curve                       │    │
│  │ • Industry standard for ZK applications                          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### State Transitions

```
                    Upgrade (requires ZK proof)
    ┌──────────────────────────────────────────────────────┐
    │                                                       │
    ▼                                                       │
┌────────┐    ┌────────┐    ┌────────┐    ┌─────────┐    ┌─────────┐
│ Bronze │ ─► │ Silver │ ─► │  Gold  │ ─► │Platinum │ ─► │ Diamond │
│ (0-39) │    │(40-59) │    │(60-79) │    │ (80-89) │    │ (90-100)│
└────────┘    └────────┘    └────────┘    └─────────┘    └─────────┘
    │              │              │              │              │
    └──────────────┴──────────────┴──────────────┴──────────────┘
                           Downgrade (event-triggered)
```

#### Upgrade Requirements

| Target | Min Score | Min Payments | Max Debt | Sybil Score |
|--------|-----------|--------------|----------|-------------|
| Silver | 40 | 3 | 70% | 20 |
| Gold | 60 | 6 | 50% | 35 |
| Platinum | 80 | 12 | 40% | 50 |
| Diamond | 90 | 24 | 30% | 70 |

---

### 3. ZK Proof System

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           ZK ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    TIER MEMBERSHIP CIRCUIT                       │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │                                                                  │    │
│  │  Private Inputs (known only to prover):                         │    │
│  │  ┌─────────────────────────────────────────────────────────┐    │    │
│  │  │ • score: 75                                              │    │    │
│  │  │ • salt: random 256-bit value                            │    │    │
│  │  └─────────────────────────────────────────────────────────┘    │    │
│  │                                                                  │    │
│  │  Public Inputs (visible to verifier):                           │    │
│  │  ┌─────────────────────────────────────────────────────────┐    │    │
│  │  │ • tier: 3 (Gold)                                         │    │    │
│  │  │ • lowerBound: 60                                         │    │    │
│  │  │ • upperBound: 79                                         │    │    │
│  │  │ • commitment: Poseidon(score, salt)                     │    │    │
│  │  └─────────────────────────────────────────────────────────┘    │    │
│  │                                                                  │    │
│  │  Constraints:                                                   │    │
│  │  ┌─────────────────────────────────────────────────────────┐    │    │
│  │  │ 1. commitment === Poseidon(score, salt)  // Binding      │    │    │
│  │  │ 2. score >= lowerBound                   // Lower check  │    │    │
│  │  │ 3. score <= upperBound                   // Upper check  │    │    │
│  │  └─────────────────────────────────────────────────────────┘    │    │
│  │                                                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  Proof Output:                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ {                                                                │    │
│  │   "pi_a": [G1 point],                                           │    │
│  │   "pi_b": [G2 point],                                           │    │
│  │   "pi_c": [G1 point],                                           │    │
│  │   "publicSignals": [tier, lowerBound, upperBound, commitment]   │    │
│  │ }                                                                │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Anti-Sybil Integration

```circom
// This is the key innovation!
// Sybil score is a PRIVATE input - verifier doesn't see the value
// But the constraint FORCES it to be >= threshold

signal input sybilScore;          // Private: your actual sybil score
signal input minSybilScore;       // Public: requirement (e.g., 35 for Gold)

component sybilCheck = GreaterEqThan(8);
sybilCheck.in[0] <== sybilScore;
sybilCheck.in[1] <== minSybilScore;
sybilCheck.out === 1;  // If sybilScore < minSybilScore, proof FAILS

// Result: You prove you meet the requirement without revealing your score
```

---

### 4. Smart Contracts

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CONTRACT ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                    VCSMStateManager.sol                            │  │
│  ├───────────────────────────────────────────────────────────────────┤  │
│  │                                                                    │  │
│  │  Storage:                                                         │  │
│  │  mapping(address => UserState) public userStates;                 │  │
│  │                                                                    │  │
│  │  struct UserState {                                               │  │
│  │      bytes32 stateHash;   // Poseidon commitment (NOT score!)     │  │
│  │      uint8 level;         // Public: 0-5 (needed for DeFi)        │  │
│  │      uint64 version;      // Replay protection                    │  │
│  │      uint64 updatedAt;                                            │  │
│  │      bool initialized;                                            │  │
│  │  }                                                                │  │
│  │                                                                    │  │
│  │  Functions:                                                       │  │
│  │  • initializeState(bytes32 hash, uint8 level)                    │  │
│  │  • updateStateWithProof(bytes proof, bytes32 newHash, uint8 lvl) │  │
│  │  • getLevel(address user) → uint8                                 │  │
│  │                                                                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                    │                                     │
│                                    │ reads level                         │
│                                    ▼                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │         TieredLending.sol (⚠️ EXAMPLE - contracts/examples/)       │  │
│  ├───────────────────────────────────────────────────────────────────┤  │
│  │  Reference implementation showing how integrators can use VCSM    │  │
│  │  Collateral Ratios by Tier (YOUR protocol defines these):        │  │
│  │  ┌─────────────────────────────────────────────────────────────┐  │  │
│  │  │ Tier      │ Collateral │ Borrow 10 ETH │ Savings vs Bronze │  │  │
│  │  ├───────────┼────────────┼───────────────┼───────────────────┤  │  │
│  │  │ Bronze    │    150%    │   15.0 ETH    │        -          │  │  │
│  │  │ Silver    │    140%    │   14.0 ETH    │    1.0 ETH (7%)   │  │  │
│  │  │ Gold      │    125%    │   12.5 ETH    │    2.5 ETH (17%)  │  │  │
│  │  │ Platinum  │    115%    │   11.5 ETH    │    3.5 ETH (23%)  │  │  │
│  │  │ Diamond   │    110%    │   11.0 ETH    │    4.0 ETH (27%)  │  │  │
│  │  └─────────────────────────────────────────────────────────────┘  │  │
│  │                                                                    │  │
│  │  Key Functions:                                                   │  │
│  │  • borrow(uint256 amount) - uses caller's credit level            │  │
│  │  • repay(uint256 amount)  - returns collateral                    │  │
│  │  • calculateCollateral(uint256 amount, uint8 level)              │  │
│  │                                                                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 5. Frontend Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SPLIT-SCREEN DEMO                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────┬────────────────────────────┐            │
│  │       USER VIEW            │        BANK VIEW           │            │
│  │    (Full Information)      │   (Privacy Protected)      │            │
│  ├────────────────────────────┼────────────────────────────┤            │
│  │                            │                            │            │
│  │  ┌──────────────────────┐  │  ┌──────────────────────┐  │            │
│  │  │    Score: 762        │  │  │    Score: ???        │  │            │
│  │  │    [████████░░]      │  │  │    [░░░░░░░░░░]      │  │            │
│  │  │    Tier: Gold ✓      │  │  │    Tier: Gold ✓      │  │            │
│  │  └──────────────────────┘  │  └──────────────────────┘  │            │
│  │                            │                            │            │
│  │  Factors:                  │  Verification:             │            │
│  │  • Wallet Age: 95%         │  • Tier: ✓ Verified        │            │
│  │  • TX Freq: 88%            │  • Sybil: ✓ Passed         │            │
│  │  • Diversity: 72%          │  • Proof: ✓ Valid          │            │
│  │  • Value: 90%              │                            │            │
│  │                            │  Collateral Required:      │            │
│  │  Actions:                  │  125% (vs 150% standard)   │            │
│  │  [Generate ZK Proof]       │                            │            │
│  │  [Create Attestation]      │  [Verify Proof]            │            │
│  │  [View State]              │  [Check Attestation]       │            │
│  │                            │                            │            │
│  └────────────────────────────┴────────────────────────────┘            │
│                                                                          │
│  Design Language:                                                        │
│  • Bloomberg Terminal aesthetic (professional, data-dense)               │
│  • OKX tech feel (green accent on dark background)                      │
│  • JetBrains Mono font (readable, technical)                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Security Model

### What's Private

| Data | Stored | Exposed | Protection |
|------|--------|---------|------------|
| Exact score | Backend only | Never | Not on-chain |
| State hash | On-chain | Hash only | Poseidon commitment |
| Tier level | On-chain | Public | Needed for DeFi |
| ZK salt | User only | Never | Random per-state |

### Attack Resistance

| Attack | Traditional | KarmaTrust |
|--------|-------------|------------|
| Sybil (fake accounts) | Backend check (bypassable) | ZK circuit (math-guaranteed) |
| Score manipulation | Trust server | Hash commitment |
| Replay attack | Session tokens | Version counter |
| Data exposure | Risk of leaks | Hash-only storage |

---

## Performance Characteristics

| Operation | Time | Complexity |
|-----------|------|------------|
| Credit scoring | ~500ms | O(1) per wallet |
| State hash | ~50ms | O(1) Poseidon |
| ZK proof gen | ~2-3s | O(constraints) |
| ZK verification | ~10ms | O(1) pairing |
| EAS attestation | ~15s | 1 on-chain tx |

---

## Future Improvements

### MVP → Production

| Area | MVP | Production |
|------|-----|------------|
| Scoring factors | 8 | 20+ |
| Weight optimization | Hand-tuned | ML-optimized |
| Data sources | Etherscan + RPC | Dune + TheGraph + Chainlink |
| ZK proofs | Simulated | Real Groth16 |
| State storage | In-memory | On-chain |
| Multi-chain | Sepolia only | ETH + L2s |

---

**Architecture Version:** 1.0.0  
**Last Updated:** January 2026
