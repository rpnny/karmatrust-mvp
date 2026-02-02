# 🌼 DAISY Architecture

**DAISY: Decentralized Attestation Infrastructure Secured by Zero-Knowledge Proofs**

---

## 📖 Table of Contents

- [Overview](#overview)
- [Why "DAISY"?](#why-daisy)
- [Architecture Layers](#architecture-layers)
- [Core Components](#core-components)
- [Security Model](#security-model)
- [Integration Guide](#integration-guide)
- [Comparison](#comparison)

---

## Overview

DAISY is KarmaTrust's core technology stack - the bridge infrastructure connecting Traditional Finance and DeFi through standardized, privacy-preserving credit scoring.

**The Bridge Architecture**:
1. **EAS Attestations** (Decentralized Attestation Layer) - On-chain verifiable credentials
2. **VCSM State Machine** (Infrastructure Layer) - Credit as an evolving state machine
3. **Groth16 ZK Circuits** (Security Layer) - Privacy-preserving proofs
4. **Translation Layer** (NEW) - Bidirectional TradFi ↔️ DeFi conversion

**Design Philosophy**: Bridge the gap between two massive financial systems that couldn't communicate before. Security, privacy, and verifiability are architectural guarantees, not features.

---

## Why "DAISY"?

### The Acronym

```
D - Decentralized        → No central credit bureau
A - Attestation          → EAS integration for on-chain credentials
I - Infrastructure       → Bridge layer connecting TradFi & DeFi
S - Secured by           → Security-first design
Y - Zero-Knowledge       → Privacy by default (Groth16 ZK proofs)
```

### The Symbolism

- **Daisy Chain**: A technical term for connecting components in series - perfectly describes both our cryptographic hash chain (VCSM) and our bridge connecting two financial systems
- **Bridge Builder**: DAISY connects TradFi and DeFi, enabling communication between systems that couldn't talk before
- **Universal Standard**: Like SWIFT for international payments, DAISY for cross-system credit
- **Simple & Memorable**: Easy to reference in developer documentation and integrations

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                          │
│   LEFT: TradFi Banks          RIGHT: DeFi Protocols         │
│   (FICO, Ratings, Reports)    (Tiers, Ratios, ZK Proofs)    │
│                                                              │
│   Both consume DAISY via REST API or SDK                     │
├─────────────────────────────────────────────────────────────┤
│                  DAISY Bridge API Layer                      │
│                                                              │
│  TradFi Endpoints:            DeFi Endpoints:                │
│  • /bridge/to-tradfi         • /bridge/to-defi              │
│  • /credit/score (FICO)      • /zkp/generate                │
│                                                              │
│  Common:                                                     │
│  • /bridge/both              • /vcsm/transition             │
├─────────────────────────────────────────────────────────────┤
│                  DAISY Core Components                       │
│  ┌──────────────┬────────────────┬───────────────────────┐ │
│  │  VCSM Engine │   EAS Layer    │   ZK Circuit Layer    │ │
│  │              │                │                       │ │
│  │ • State mgmt │ • Public mode  │ • tier_membership.circom│
│  │ • Transitions│ • Privacy mode │ • state_transition.circom│
│  │ • Hash chain │ • Schema reg.  │ • Anti-sybil constraints│
│  │ • Rules      │ • Commitments  │ • Poseidon hash       │ │
│  └──────────────┴────────────────┴───────────────────────┘ │
│                                                              │
│              Bridge Translator Service (NEW)                 │
│              • TradFi Format ←→ DeFi Format                  │
│              • FICO ←→ Tier conversion                       │
├─────────────────────────────────────────────────────────────┤
│                  Smart Contract Layer                        │
│  VCSMStateManager.sol  |  TieredLending.sol (deployed)     │
├─────────────────────────────────────────────────────────────┤
│                   Blockchain Layer                           │
│         Ethereum (Sepolia testnet, Mainnet ready)           │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Decentralized Attestation (EAS Integration)

**Purpose**: On-chain, publicly verifiable credentials

**Implementation**:
- **Public Mode**: Traditional EAS attestations with visible credit scores
  ```
  Schema: (uint16 score, string level)
  Example: (762, "Gold")
  ```

- **Privacy Mode**: Commitment-based attestations (ZK-friendly)
  ```
  Schema: (bytes32 commitment, uint8 minTier, uint64 timestamp)
  commitment = Poseidon(score, salt)
  ```

**Location**: `backend/src/services/easAttestationV2.ts`

**Innovation**: First EAS schema designed specifically for ZK proof compatibility

---

### 2. Infrastructure (VCSM Engine)

**Purpose**: Treat credit as an evolving state machine with cryptographic guarantees

**Key Features**:
- **State Representation**:
  ```typescript
  {
    score: number,
    level: CreditLevel,
    salt: bigint,
    stateHash: string,  // Poseidon(score, level, salt, attributes)
    version: number,
    attributes: { onTimePayments, daysActive, ... }
  }
  ```

- **Transition Rules**: 
  - Bronze → Silver: score ≥ 40, payments ≥ 3, sybilScore ≥ 20
  - Silver → Gold: score ≥ 60, payments ≥ 6, sybilScore ≥ 35
  - Gold → Platinum: score ≥ 75, payments ≥ 10, sybilScore ≥ 45
  - Platinum → Diamond: score ≥ 85, payments ≥ 15, sybilScore ≥ 50

- **Cryptographic Hash Chain**:
  ```
  State v1 → State v2 → State v3
     ↓          ↓          ↓
  Hash(v1)   Hash(v2)   Hash(v3)
     └──────────┴──────────┘
      Each state commits to all previous history
  ```

**Location**: `backend/src/services/vcsm/`

**Innovation**: First state-machine approach to credit scoring (not just a snapshot score)

---

### 3. Secured by Zero-Knowledge Proofs

**Purpose**: Privacy-preserving verification + anti-sybil defense

**Circuits**:

1. **tier_membership.circom** (280 constraints)
   - Proves: "User belongs to tier X without revealing exact score"
   - Inputs (private): score, salt
   - Inputs (public): commitment, minTier
   - Output: Valid proof if score ≥ tier threshold AND Poseidon(score, salt) = commitment

2. **state_transition.circom** (450 constraints)
   - Proves: "User legitimately upgraded from tier X to tier Y"
   - Anti-sybil logic embedded in circuit constraints (lines 310-314)
   - Validates: score change, payment count, wallet age, sybil score

**Proving System**: Groth16
- Proof Generation: 1-3 seconds (typical)
- Proof Verification: ~8ms
- Proof Size: ~200 bytes

**Location**: `circuits/`

**Innovation**: First ZK credit system with anti-sybil defense in circuit constraints (mathematically enforced)

---

## Security Model

### Threat Model & Mitigations

| Threat | Traditional Credit | DAISY Defense |
|--------|-------------------|---------------|
| **Fake scores** | Trust the bureau | Cryptographic verification (VCSM hash chain) |
| **Sybil attacks** | Backend checks (bypassable) | Circuit constraints (mathematically enforced) |
| **Privacy leaks** | Full disclosure required | ZK proofs (selective disclosure) |
| **History tampering** | Database modifications possible | Immutable hash chain |
| **Centralization** | Single point of failure | Decentralized (EAS + blockchain) |

### Cryptographic Primitives

- **Hash Function**: Poseidon (ZK-friendly, 8-10x fewer constraints than SHA256)
- **Proving System**: Groth16 (trusted setup via Powers of Tau)
- **Elliptic Curve**: BN128 (Ethereum-compatible)
- **Circuit Compiler**: Circom 2.0
- **Proof Generator**: SnarkJS

---

## Integration Guide

### For DeFi Protocols

**Step 1**: Query user's credit via DAISY API

```javascript
// Get user's credit score and tier
const response = await fetch('https://api.karmatrust.xyz/credit/score', {
  method: 'POST',
  body: JSON.stringify({ wallet: userAddress })
});

const { score, level, levelName } = await response.json();
// score: 762, level: 3, levelName: "Gold"
```

**Step 2**: Verify credentials

```javascript
// Option A: Verify EAS attestation (public mode)
const attestation = await EAS.getAttestation(attestationId);

// Option B: Verify ZK proof (privacy mode)
const isValid = await verifyZKProof(proof, publicSignals);
```

**Step 3**: Apply credit-based logic

```javascript
// Reduce collateral ratio for creditworthy users
const collateralRatio = level >= CreditLevel.Gold ? 1.25 : 1.50;
// Gold tier users: 125% collateral
// Others: 150% collateral
```

### DAISY SDK (Coming Soon)

```javascript
import { DaisyClient } from '@karmatrust/daisy-sdk';

const daisy = new DaisyClient({ apiKey: 'your-key' });

// Get credit score
const credit = await daisy.getScore(wallet);

// Generate ZK proof
const proof = await daisy.generateProof(wallet, CreditLevel.Gold);

// Verify proof
const isValid = await daisy.verifyProof(proof);
```

---

## Comparison

### DAISY vs. Traditional Credit Systems

| Feature | Traditional (FICO) | DAISY Bridge |
|---------|-------------------|--------------|
| **Trust Model** | Trust the bureau | Verify the math |
| **Privacy** | Full disclosure | Zero-knowledge proofs |
| **Verifiability** | Opaque algorithm | Open-source circuits |
| **Sybil Defense** | Manual review | Circuit constraints |
| **State Tracking** | Snapshot scores | State machine + hash chain |
| **Decentralization** | Centralized | On-chain (EAS + blockchain) |
| **Integration** | Proprietary APIs | Open REST API + SDK |
| **Language** | FICO only | **Both FICO & Tiers** ⭐ |
| **Market** | TradFi only | **TradFi + DeFi** ⭐ |

### DAISY vs. Other DeFi Credit Projects

| Project | Market | Privacy | Bridge | Verifiability |
|---------|--------|---------|--------|---------------|
| **DAISY** | **TradFi + DeFi** ⭐ | ✅ ZK proofs | ✅ Both formats | ✅ Hash chain |
| Project A | DeFi only | ❌ Public | ❌ DeFi-only | ❌ Trust-based |
| Project B | DeFi only | ❌ Public | ❌ Novel metrics | ❌ Opaque |
| Project C | DeFi only | ❌ Public | ❌ No TradFi format | ⚠️ Oracle trust |

**DAISY's Unique Value**: 
- ⭐ Only bridge connecting TradFi and DeFi
- ⭐ Speaks both languages (FICO & Tiers)
- ⭐ Serves both markets simultaneously
- ✅ Cryptographic guarantees at every layer

### Market Position

```
Other Projects:           DAISY:
   DeFi                TradFi ←→ DeFi
    │                     │
    │                  Bridge
    │                  Position
    ↓                     ↓
  $50B              $100T + $50B
  market            opportunity
```

---

## Performance Metrics

| Metric | Value | Notes |
|--------|-------|-------|
| ZK Proof Generation | 1-3s | tier_membership circuit |
| ZK Proof Verification | ~8ms | On-chain or off-chain |
| State Transition Proof | 2-4s | state_transition circuit |
| Proof Size | ~200 bytes | Groth16 compressed |
| Circuit Constraints | 280-450 | Optimized for speed |
| Gas Cost (Verify) | ~250k gas | If verified on-chain |

---

## Roadmap

### Phase 1: Hackathon MVP ✅ (Complete)
- VCSM engine
- Real ZK proofs (Groth16)
- EAS integration (dual-mode)
- Frontend demo
- Smart contracts deployed (Sepolia)

### Phase 2: Mainnet Launch (Q2 2026)
- Mainnet deployment
- DAISY SDK release
- Production API
- Audits (smart contracts + circuits)

### Phase 3: Ecosystem Growth (Q3 2026)
- Protocol integrations (Aave, Compound)
- "Built with DAISY" program
- Developer grants
- Governance token launch

### Phase 4: Advanced Features (Q4 2026)
- Multi-chain support (Base, Optimism, Arbitrum)
- Machine learning credit models
- Credit derivatives marketplace
- DAISY DAO

---

## Technical Resources

- **GitHub**: https://github.com/rpnny/karmatrust-mvp
- **Circuits**: `./circuits/`
- **Smart Contracts**: `./contracts/`
- **Backend**: `./backend/src/`
- **Frontend**: `./frontend/src/`

**Related Documentation**:
- [VCSM Technical Deep Dive](./VCSM_INNOVATION.md)
- [ZK + EAS Hybrid Design](./ZK_EAS_HYBRID.md)
- [Privacy Mode Guide](./PRIVACY_MODE_GUIDE.md)
- [Circuit Performance](./CIRCUIT_PERFORMANCE.md)

---

## Contact & Support

- **Email**: [Your Email]
- **Discord**: [ETHGlobal Server]
- **Twitter**: [Your Twitter]

---

## Conclusion

**DAISY is not just another credit score.**

It's a complete cryptographic infrastructure that makes credit scoring:
- ✅ **Decentralized** (no central authority)
- ✅ **Private** (zero-knowledge proofs)
- ✅ **Verifiable** (open-source circuits)
- ✅ **Secure** (anti-sybil in circuits)
- ✅ **Composable** (REST API + SDK)

**Built for DeFi. Secured by math. Verified by anyone.**

🌼 **That's DAISY. That's KarmaTrust.**

---

*Last Updated: February 2026*
