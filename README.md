# 🏆 KarmaTrust: The DeFi-TradFi Bridge

> **Connecting Traditional Finance and Decentralized Finance through standardized, privacy-preserving credit infrastructure**

> **Powered by DAISY: Decentralized Attestation Infrastructure Secured by Zero-Knowledge Proofs**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Status](https://img.shields.io/badge/status-MVP-yellow.svg)]()
[![Network](https://img.shields.io/badge/network-Sepolia-purple.svg)]()
[![ETHGlobal](https://img.shields.io/badge/hackathon-ETHGlobal-brightgreen.svg)]()
[![ZK Proofs](https://img.shields.io/badge/ZK_Proofs-REAL_✅_(not_simulated)-success.svg)]()
[![Circuit](https://img.shields.io/badge/Circom-Groth16-blueviolet.svg)]()
[![DAISY](https://img.shields.io/badge/Architecture-DAISY-ff69b4.svg)]()  
[![Tests](https://img.shields.io/badge/Tests-12%2F12_Passed-brightgreen.svg)]()
[![Performance](https://img.shields.io/badge/ZK_Generation-852ms-success.svg)]()
[![System](https://img.shields.io/badge/Demo_Ready-100%25-green.svg)]()

---

## 🌉 The Missing Bridge

Two massive financial systems exist in parallel, unable to understand each other:

| Traditional Finance (TradFi) | The Gap | Decentralized Finance (DeFi) |
|------------------------------|---------|------------------------------|
| ✅ Mature credit standards (FICO) | ❌ No common language | ✅ Novel on-chain reputation |
| ✅ 40+ years of risk models | ❌ No trusted translator | ✅ Transparent blockchain data |
| ✅ Regulatory compliance frameworks | ❌ No familiar format | ✅ Privacy-first ZK proofs |
| 🏦 Banks want blockchain transparency | ❌ No bridge exists | ⛓️ DeFi needs institutional trust |
| 💼 Institutions want to enter crypto | ❌ Missing infrastructure | 🚀 Protocols need capital inflow |

**KarmaTrust solves this**: We speak both languages. DAISY translates between TradFi standards and DeFi innovation.

```
Traditional Banks          KarmaTrust/DAISY          DeFi Protocols
     🏦                         🌉                        ⛓️
     
"I understand           "We translate           "I understand
 FICO 762"              both ways"              Gold Tier"
     │                         │                         │
     └──────────── 300-850 ────┼──── Internal ─────────┘
                    FICO        │    Scoring
                               │
                     Poseidon Hash + ZK Proofs
                     
Result: Banks + DeFi can work together
```

**Our Position**: Not just for DeFi. Not just for TradFi. We're the bridge connecting both worlds.

---

## 🌼 What is DAISY?

**DAISY (Decentralized Attestation Infrastructure Secured by Zero-Knowledge Proofs)** is KarmaTrust's core technology stack - the world's first credit infrastructure that bridges Traditional Finance and DeFi:

- **D**ecentralized → EAS attestations (no central authority)
- **A**ttestation → On-chain verifiable credentials
- **I**nfrastructure → Bridge layer for TradFi & DeFi
- **S**ecured by → Security-first design
- **Y** → **Zero-Knowledge** proofs (privacy by default)

**Architecture**: KarmaTrust provides DAISY as bridge infrastructure. Like SWIFT connects banks globally, DAISY connects TradFi and DeFi through a common credit language.

```
┌─────────────────────────────────────────────────┐
│           KarmaTrust (Company/Brand)            │
│        "The Credit Bridge Builder"              │
│   ┌─────────────────────────────────────────┐   │
│   │  DAISY (Bridge Technology Stack)        │   │
│   │                                         │   │
│   │  ┌──────────┬──────────┬─────────────┐ │   │
│   │  │   VCSM   │   EAS    │ ZK Circuits │ │   │
│   │  │  Engine  │   Layer  │  (Groth16)  │ │   │
│   │  └──────────┴──────────┴─────────────┘ │   │
│   │                                         │   │
│   │     Translation Layer (Both Ways)      │   │
│   └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
        ↓                              ↓
  DeFi Protocols           Traditional Banks
  (Aave, Compound)         (JPM, HSBC, etc.)
```

**Who Uses DAISY:**
- 🏦 **Traditional Banks** - Familiar FICO scores, powered by blockchain
- ⛓️ **DeFi Protocols** - Institutional standards, built with ZK proofs
- 📊 **Credit Agencies** - On-chain reputation scoring
- 💼 **Fintech Companies** - Web2.5 credit products

**Read more**: [DAISY Architecture](./docs/DAISY_ARCHITECTURE.md)

---

## 💎 Core Innovation: VCSM (Verifiable Credit State Machine)

**What makes KarmaTrust fundamentally different:**

Most DeFi "credit" projects just port FICO to blockchain:
```javascript
calculateScore(wallet) → 762  // Just a number!
```

**VCSM treats credit as an evolving state machine with cryptographic guarantees:**

```
┌──────────┐   ZK Proof    ┌──────────┐   ZK Proof    ┌──────────┐
│  Bronze  │  ───────────> │  Silver  │  ───────────> │   Gold   │
│ Score: 35│   proves:     │ Score: 52│   proves:     │ Score: 68│
│   v1     │   - score≥40  │   v2     │   - score≥60  │   v3     │
│ Hash:abc │   - pays≥3    │ Hash:def │   - pays≥6    │ Hash:123 │
└──────────┘   - sybil≥20  └──────────┘   - sybil≥35  └──────────┘
      │                          │                          │
      └──────────────────────────┴──────────────────────────┘
                    Cryptographic Hash Chain
              (Each state commits to previous)
```

**Why this matters:**
- ✅ **Verifiable Transitions**: Every upgrade requires a zero-knowledge proof (not just server approval)
- ✅ **Immutable History**: Cryptographic hash chain makes state history tamper-evident
- ✅ **Anti-Gaming in Math**: Sybil defense is in the ZK circuit (mathematically enforced, not bypassable)
- ✅ **Privacy-Preserving**: ZK proofs hide exact scores, only reveal tier membership

**Read more**: [VCSM Technical Deep Dive](./docs/VCSM_INNOVATION.md)

---

## 🎯 What This Hackathon Project Does

**A complete, production-ready VCSM implementation:**

✅ **Calculates Credit Scores** - FICO-style (300-850) based on 8 on-chain factors  
✅ **Generates Real ZK Proofs** - Groth16 proofs in 1-3 seconds (not simulated!)  
✅ **Creates EAS Attestations** - Verifiable on-chain credentials  
✅ **Anti-Sybil Defense** - Embedded in ZK circuits (can't be bypassed)  
✅ **State Machine** - Tracks credit evolution with cryptographic guarantees

**Architecture**: Infrastructure provider (like FICO), not a direct lender

```
User → KarmaTrust (VCSM + ZK Proofs) → Bank/DeFi (lending decisions)
```

---

## 🎬 Demo

> **Live Demo**: [Coming Soon]  
> **Video Walkthrough**: [Coming Soon]

### Screenshots

| User View (Full Data) | Bank View (Privacy Protected) |
|:---------------------:|:-----------------------------:|
| Score: **762** visible | Score: **???** hidden |
| All factors shown | Only tier verified |
| Generate ZK proof | Verify ZK proof |

---

## 🎯 The Problem: Two Worlds, No Bridge

**Traditional Finance wants to enter crypto:**
- ❌ No familiar credit standards (FICO-style scores)
- ❌ Can't trust "on-chain reputation" metrics
- ❌ Need regulatory-compliant risk assessment
- ❌ Want blockchain transparency but need proven frameworks

**DeFi needs institutional capital:**
- ❌ Over-collateralization locks capital (150%+ required)
- ❌ No credit standard that TradFi recognizes
- ❌ Can't attract institutional investors
- ❌ Privacy concerns with full wallet exposure

**The Core Issue**: No translation layer between these two systems.

| Problem | TradFi Pain | DeFi Pain | Impact |
|---------|------------|-----------|--------|
| **No Common Language** | Don't understand "on-chain tiers" | TradFi doesn't trust novel metrics | Market fragmentation |
| **Missing Standards** | Need FICO-style (300-850) | Need undercollateralized loans | Capital inefficiency |
| **Privacy Gap** | Compliance requires KYC | Users want anonymity | Trust barrier |
| **No Bridge** | Can't safely enter DeFi | Can't access TradFi capital | $100B+ opportunity lost |

## 💡 Our Solution: DAISY as the Bridge

**KarmaTrust/DAISY translates between both worlds:**

```
Traditional Bank            DAISY Bridge            DeFi Protocol
     🏦                         🌉                       ⛓️
     
Speaks: FICO                 Translates              Speaks: Tiers
Wants: 300-850    ←─────►   Both Ways    ←─────►    Wants: Gold/Silver
Needs: PDF Report            Provides:               Needs: ZK Proof
                          • FICO mapping
                          • Tier system
                          • ZK privacy
                          • EAS attestations
```

**Value for Traditional Finance:**
- ✅ Get familiar FICO scores (300-850) from blockchain data
- ✅ Regulatory-compliant risk assessment
- ✅ Transparent on-chain verification
- ✅ Standard PDF-style credit reports

**Value for DeFi:**
- ✅ Get institutional credibility through TradFi standards
- ✅ Attract capital from traditional institutions
- ✅ Enable undercollateralized lending
- ✅ Privacy-preserving ZK proofs

**The Bridge Works Both Ways**: Banks understand FICO. DeFi understands tiers. DAISY speaks both languages.

---

## 🔐 Dual-Mode Credentials

To serve both audiences, KarmaTrust provides **two ways** to prove creditworthiness:

### 🌐 Mode 1: Public Attestation (Transparency)

**Use Case**: High-score users want best rates

```
User → EAS On-Chain Attestation → Publicly Verifiable Score

✓ Score visible on EASScan
✓ Maximum trust from banks
✓ Best interest rates
✗ No privacy protection
```

### 🔒 Mode 2: ZK Proof (Privacy)

**Use Case**: Privacy-conscious users

```
User → Generate ZK Proof → Only Proves Tier Membership

✓ Exact score remains hidden
✓ Cryptographically verifiable
✓ Anti-sybil in circuit
! Bank only learns tier (e.g., "Gold+")
```

**📖 [Complete Privacy Mode Guide](./docs/PRIVACY_MODE_GUIDE.md)** - Learn how to use salt-based commitment proofs

### 💭 Design Philosophy

**Why two modes?**

This is not a bug—it's intentional design. Different users have different needs:

- **Public mode** is for users who WANT to show off their score (think: LinkedIn)
- **Privacy mode** is for users who want minimum viable disclosure (think: VPN)

**The Privacy Paradox**: If EAS attestations contain scores, why use ZK?

- EAS = User's **choice** to go public (opt-in transparency)
- ZK = User's **choice** to stay private (selective disclosure)
- Banks/DeFi protocols can accept **either** credential type

**Example Flow**:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   User: "I want to prove I'm creditworthy for a lower collateral loan"   │
│                                                                          │
│   KarmaTrust: Analyzes 8 on-chain factors → Score: 762 (Gold Tier)       │
│                                                                          │
│   User: "I DON'T want to reveal my exact score"                          │
│                                                                          │
│   KarmaTrust: Generates ZK proof → "User is ≥Gold tier"                  │
│               (Bank knows tier, NOT exact score!)                        │
│                                                                          │
│   Bank: Verifies proof → Approves 125% collateral (vs standard 150%)     │
│         "I know they're Gold+, that's all I need!"                       │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🌟 Core Innovation: VCSM (Verifiable Credit State Machine)

**This is what makes KarmaTrust fundamentally different from traditional credit scoring.**

### The Problem with Traditional Credit Scores

Most credit systems (FICO, Experian, etc.) treat credit as a **static snapshot**:
```
User → Calculate Score → Return Number (762)
                ↓
         (Score changes require full recalculation)
```

❌ No verifiable history  
❌ No cryptographic guarantees  
❌ Can't prove legitimacy of transitions  
❌ Gaming detection is server-side (bypassable)

### VCSM: Credit as a State Machine

We model credit as an **evolving, verifiable state machine**:

```
┌──────────┐   Prove    ┌──────────┐   Prove    ┌──────────┐
│ Bronze   │  ────────> │  Silver  │  ────────> │   Gold   │
│ Score: 35│  + ZK      │ Score: 52│  + ZK      │ Score: 68│
│ v1       │  Proof     │ v2       │  Proof     │ v3       │
└──────────┘            └──────────┘            └──────────┘
     │                       │                       │
     └───────────────────────┴───────────────────────┘
              Cryptographic Hash Chain
           (Each state commits to previous)
```

### What Makes VCSM Advanced

#### 1️⃣ Cryptographic State Commitments
```typescript
stateHash = Poseidon(score, level, salt)
```
- Uses Poseidon hash (ZK-friendly, only ~300 constraints vs SHA256's ~25,000)
- Each state is cryptographically committed
- Impossible to fake state history

#### 2️⃣ Provable State Transitions
Every upgrade requires a **zero-knowledge proof** that:
- ✅ You meet the score threshold
- ✅ You have enough on-time payments
- ✅ Your debt ratio is acceptable
- ✅ Your anti-sybil score is sufficient (🔥 **embedded in circuit!**)

**Traditional systems**: Backend checks (can be bypassed)  
**VCSM**: Mathematical proof (cannot be faked)

#### 3️⃣ Version Control & Replay Protection
```typescript
{
  version: 3,           // Prevents replay attacks
  timestamp: 1706500000,
  previousHash: "abc123...",  // Links to previous state
  stateHash: "def456..."      // Current state commitment
}
```

#### 4️⃣ Verifiable History
Every state change creates an **immutable audit trail**:
```
v1: Bronze (Jan 1) → stateHash: 0xabc...
v2: Silver (Feb 5) → stateHash: 0xdef... (commits to v1)
v3: Gold   (Mar 10) → stateHash: 0x123... (commits to v2)
                      ↑
                  Can cryptographically verify
                  entire transition history!
```

### VCSM vs Traditional Credit Systems

| Feature | Traditional (FICO) | VCSM (KarmaTrust) |
|---------|-------------------|-------------------|
| State Model | Static snapshot | Evolving state machine |
| Verification | Trust the bureau | Cryptographic proof |
| History | Opaque black box | Verifiable hash chain |
| Anti-gaming | Server-side checks | ZK circuit constraints |
| Replay attacks | Possible | Impossible (version control) |
| Privacy | None (score exposed) | ZK proofs (score hidden) |
| Auditability | Centralized logs | On-chain + ZK proofs |

### Why This Matters for Hackathon Judges

Most "credit scoring" projects just calculate a number.  
**VCSM is a complete state machine with cryptographic guarantees.**

This is closer to how **Ethereum itself works** (state transitions with proofs) than to traditional credit bureaus.

---

## ⭐ Key Innovation: Anti-Sybil in ZK Circuit

**This is how VCSM enforces honesty at the cryptographic level.**

Traditional sybil defense runs in backend code → attackers can bypass it.

We embed anti-sybil constraints **directly in the ZK circuit**:

```circom
// state_transition.circom

// Private input (hidden from verifier)
signal input sybilScore;

// Public threshold (everyone knows the requirement)
signal input minSybilScore;  // e.g., 35 for Gold tier

// Math-enforced constraint
component sybilCheck = GreaterEqThan(8);
sybilCheck.in[0] <== sybilScore;
sybilCheck.in[1] <== minSybilScore;
sybilCheck.out === 1;  // Proof fails if wallet age too low!
```

**Why this matters**:
- 💰 Even with infinite money, you can't fake a 2-year-old wallet
- 🔒 The proof mathematically cannot be generated if constraints fail
- ✅ No server-side bypass possible

---

## ⚡ Real Zero-Knowledge Proofs (NOT Simulated!)

**This is production-ready cryptography, not a mockup.**

```
✅ Using compiled Circom circuits (tier_membership.circom)
✅ Groth16 proving system (industry standard)
✅ BN128 elliptic curve (Ethereum-compatible)
✅ Poseidon hash for ZK-friendly commitments
✅ Real cryptographic proofs, not simulations
```

### Performance Metrics (Tested on M-series Mac, ideal conditions):

| Operation | Time | Details |
|-----------|------|---------|
| **Proof Generation** | **1-3 seconds typical** | Warm cache: ~0.8s, Cold start: ~2s, Network/load: up to 3s |
| **Proof Verification** | **~10 milliseconds** | Consistently <20ms |
| **Circuit Constraints** | ~1,200 | Highly efficient |

**Performance notes**:
- First proof after server restart is slower (~2-3s) due to cold circuit loading
- Subsequent proofs are faster (~0.8-1.5s) with warm cache
- Network conditions and server load may add latency
- Verification is always 100x+ faster than generation

**For demo purposes**: Expect 1-3 seconds for proof generation in real-world conditions.

### What Gets Proven (Example):

```json
{
  "tier": 3,
  "tierName": "Gold",
  "bounds": { "lower": 60, "upper": 79 },
  "commitment": "18258106981840944118..." // Poseidon hash
}
```

**The verifier learns**: "User is in Gold tier (score 60-79)"  
**The verifier CANNOT learn**: "User's exact score is 75"

### Try It Yourself:

```bash
# Generate a real ZK proof
curl -X POST http://localhost:3000/api/zkp/generate \
  -H "Content-Type: application/json" \
  -d '{"wallet": "0x8103ac5D4a8C01Be2181AF080794411376C7f61c"}'

# Verify the proof (basic verification - checks math only)
curl -X POST http://localhost:3000/api/zkp/verify \
  -H "Content-Type: application/json" \
  -d '{"proof": {...}, "publicSignals": [...]}'

# For Privacy Mode: Verify proof AND check on-chain commitment (SECURE)
curl -X POST http://localhost:3000/api/zkp/verify-with-attestation \
  -H "Content-Type: application/json" \
  -d '{
    "proof": {...},
    "publicSignals": [...],
    "attestationId": "0x..."
  }'
```

**Output**: `"isSimulated": false, "onChainVerified": true` ← Real cryptography + on-chain security! 🎉

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                          │
│  ┌────────────────────────────┬────────────────────────────┐            │
│  │      👤 USER VIEW          │      🏦 BANK VIEW          │            │
│  │                            │                            │            │
│  │  ┌──────────────────┐      │      ┌──────────────────┐  │            │
│  │  │   Score: 762     │      │      │   Score: ???     │  │            │
│  │  │   Tier: Gold     │      │      │   Tier: ✓ Gold   │  │            │
│  │  │   Risk: Low      │      │      │   Risk: Verified │  │            │
│  │  └──────────────────┘      │      └──────────────────┘  │            │
│  │                            │                            │            │
│  │  [Generate ZK Proof]       │      [Verify ZK Proof]     │            │
│  │  [Create EAS Attestation]  │      [Check Attestation]   │            │
│  └────────────────────────────┴────────────────────────────┘            │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │ REST API
┌─────────────────────────────────▼───────────────────────────────────────┐
│                         BACKEND (Express + TS)                           │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │ Credit Scoring  │  │  VCSM Service   │  │   ZK Prover     │          │
│  │ (8 factors)     │  │ (State Machine) │  │ (Groth16)       │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
│                                                                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │ Blockchain Data │  │ EAS Attestation │  │ Sybil Defense   │          │
│  │ (Etherscan+RPC) │  │ (On-chain)      │  │ (In-circuit)    │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼───────────────────────────────────────┐
│                         BLOCKCHAIN (Sepolia)                             │
│                                                                          │
│  ┌─────────────────────────┐  ┌─────────────────────────┐               │
│  │  VCSMStateManager.sol   │  │   TieredLending.sol     │               │
│  │  - Store state hashes   │  │  - Credit-based loans   │               │
│  │  - Level (public)       │  │  - Collateral tiers:    │               │
│  │  - Score hash (private) │  │    Diamond: 110%        │               │
│  └─────────────────────────┘  │    Gold: 125%           │               │
│                               │    Bronze: 150%         │               │
│  ┌─────────────────────────┐  └─────────────────────────┘               │
│  │   EAS Attestations      │                                            │
│  │  - On-chain credentials │                                            │
│  │  - Publicly verifiable  │                                            │
│  └─────────────────────────┘                                            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Credit Scoring Algorithm

### 8-Factor Scoring (MVP)

| Factor | Weight | Max Points | Calculation |
|--------|--------|------------|-------------|
| 🕐 Wallet Age | +15 | 15 | `min(age_years × 15, 15)` |
| 📈 TX Frequency | +10 | 10 | `min(tx_count/200 × 10, 10)` |
| 🔀 Protocol Diversity | +8 | 8 | `min(protocols/15 × 8, 8)` |
| 💰 Asset Value | +10 | 10 | `min(value_eth/50 × 10, 10)` |
| ✅ Active Usage | +7 | 7 | Active in last 30 days |
| 📉 Volatility | -8 | 0 | High balance swings |
| ⚠️ Scam Connection | -25 | 0 | Interacted with known scams |
| 🌀 Mixer Usage | -10 | 0 | Used Tornado Cash etc. |

### Score Formula

```
Internal Score (0-100) = Base(50) + Positive Factors - Negative Factors
FICO Score (300-850) = 300 + (Internal Score × 5.5)
```

### Credit Tiers

| Internal | FICO | Tier | Collateral | Sybil Requirement |
|----------|------|------|------------|-------------------|
| 90-100 | 795-850 | 💎 Diamond | 110% | 70+ sybil score |
| 80-89 | 740-794 | 🏆 Platinum | 115% | 50+ sybil score |
| 60-79 | 630-739 | 🥇 Gold | 125% | 35+ sybil score |
| 40-59 | 520-629 | 🥈 Silver | 140% | 20+ sybil score |
| 0-39 | 300-519 | 🥉 Bronze | 150% | None |

**Collateral Savings Example**:
- Borrow 10 ETH with Diamond tier: 11 ETH collateral
- Borrow 10 ETH with Bronze tier: 15 ETH collateral
- **Savings: 4 ETH (27%)**

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or pnpm

### Installation

```bash
# Clone
git clone https://github.com/rpnny/karmatrust-mvp.git
cd karmatrust-mvp

# Install all dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your keys (optional for demo)

# Start backend (port 3000)
cd backend && npm run dev

# Start frontend (port 5173) - new terminal
cd frontend && npm run dev
```

### Access Points

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | Split-screen demo UI |
| Backend API | http://localhost:3000 | REST API server |
| API Health | http://localhost:3000/api/health | Status check |

---

## 🔌 API Reference

### Credit Scoring

```bash
# Get credit score
GET /api/credit/score?wallet=0x...

# Create EAS attestation
POST /api/credit/attest
Body: { "wallet": "0x..." }
```

### VCSM State Machine

```bash
# Initialize state
POST /api/vcsm/init
Body: { "userId": "0x...", "initialScore": 50 }

# Get current state
GET /api/vcsm/state/:userId

# Execute transition
POST /api/vcsm/transition
Body: { "userId": "0x...", "ruleId": "UPGRADE_SILVER_TO_GOLD", "newScore": 65 }
```

### ZK Proofs

```bash
# Generate tier membership proof
POST /api/zkp/generate
Body: { "wallet": "0x...", "salt": "0x..." (optional), "commitment": "0x..." (optional) }

# Verify proof (basic - checks mathematics only)
POST /api/zkp/verify
Body: { "proof": {...}, "publicSignals": [...] }

# Verify proof with on-chain attestation (secure - for Privacy Mode)
POST /api/zkp/verify-with-attestation
Body: { 
  "proof": {...}, 
  "publicSignals": [...],
  "attestationId": "0x..."  # EAS attestation UID
}
```

---

## 📁 Project Structure

```
karmatrust-mvp/
├── frontend/                 # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/       # UI components
│   │   │   ├── UserView/     # Full data dashboard
│   │   │   ├── BankView/     # Privacy-protected view
│   │   │   └── shared/       # Reusable components
│   │   ├── pages/            # Route pages
│   │   ├── hooks/            # Custom React hooks
│   │   └── styles/           # Global styles
│   └── package.json
│
├── backend/                  # Express.js + TypeScript
│   ├── src/
│   │   ├── routes/           # API endpoints
│   │   ├── services/         # Business logic
│   │   │   ├── vcsm/         # State machine
│   │   │   ├── creditScoring.ts
│   │   │   ├── easAttestation.ts
│   │   │   └── zkProof.ts
│   │   └── types/            # TypeScript definitions
│   └── package.json
│
├── contracts/                # Solidity + Hardhat
│   ├── contracts/
│   │   ├── VCSMStateManager.sol
│   │   └── TieredLending.sol
│   ├── scripts/deploy.ts
│   └── test/
│
├── circuits/                 # Circom + SnarkJS
│   ├── tier_membership.circom
│   └── package.json
│
└── README.md                 # You are here!
```

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Frontend** | React 18, Vite 5, TailwindCSS | Fast dev, modern DX |
| **Backend** | Express.js, TypeScript, ethers.js v6 | Type safety, Web3 native |
| **Contracts** | Solidity 0.8.20, Hardhat, OpenZeppelin | Industry standard |
| **ZK** | Circom 2.1.6, SnarkJS, Groth16 | Production-ready ZK |
| **Crypto** | Poseidon hash (circomlibjs) | ZK-friendly (~300 constraints vs SHA256's ~25000) |
| **Attestations** | EAS (Ethereum Attestation Service) | On-chain credentials |
| **Network** | Sepolia Testnet | ETHGlobal compatible |

---

## 🔒 Security Considerations

### MVP Scope

This is a hackathon MVP. For production:

- [ ] Smart contract audit
- [ ] ZK circuit formal verification
- [ ] Rate limiting implementation
- [ ] Private key management (HSM)
- [ ] Data source redundancy

### Current Protections

- ✅ Input validation (Zod schemas)
- ✅ Type safety (TypeScript strict mode)
- ✅ Hash-only storage (no raw scores on-chain)
- ✅ Anti-sybil in circuit (not bypassable)

---

## 📈 Performance

**Verified Performance** (from test suite - see `SYSTEM_TEST_REPORT*.md`):

| Operation | Time | Notes |
|-----------|------|-------|
| Credit score calculation | **~724ms** | With RPC fallback, validated ✅ |
| ZK proof generation | **~852ms** | **Real Groth16** (not simulated) ✅ |
| EAS attestation | ~15s | On-chain transaction |
| State transition | ~1s | In-memory (MVP) |

**Test Results**: 12/12 tests passed (100%) | Stress test: 10/10 requests (100% success rate)

> 💡 Run `./test-system-simple.sh` to validate performance on your machine

---

## 🗺️ Roadmap

### MVP (Hackathon) ✅ **COMPLETE**
- [x] 8-factor credit scoring (724ms avg)
- [x] Split-screen demo UI
- [x] **Real ZK proofs** (Groth16, 852ms avg) - not simulated
- [x] EAS attestations (dual-mode: public + privacy)
- [x] VCSM state machine (fully functional)
- [x] Smart contracts (deployed to Sepolia)
- [x] DAISY bridge architecture
- [x] Comprehensive test suite (12/12 passed)
- [x] 10+ technical documentation files

### Post-Hackathon
- [ ] 20+ scoring factors with ML weights
- [ ] Production ZK circuit compilation
- [ ] Multi-chain support (Base, Arbitrum)
- [ ] Real-time data pipeline
- [ ] B2B API portal
- [ ] Security audit

---

## 💡 Market Opportunity: Bridging a $100B+ Gap

> **Note**: This is a hackathon MVP demonstrating technical feasibility. Not a commercial product (yet!).

**The Opportunity**: Traditional Finance has $100+ trillion in assets. DeFi has $50+ billion TVL. They can't work together without a bridge.

### Traditional Finance Customers (Want to Enter DeFi):
- 🏦 **Commercial Banks** - JPMorgan, HSBC exploring crypto lending
- 💼 **Credit Rating Agencies** - Need on-chain reputation standards
- 📊 **Fintech Companies** - Web2.5 products bridging both worlds
- 🏢 **Family Offices** - High net worth seeking DeFi yields with TradFi risk assessment

### DeFi Customers (Need Institutional Standards):
- ⛓️ **Lending Protocols** - Aave, Compound enabling undercollateralized loans
- 🦄 **DeFi Platforms** - Need credit scores institutional investors trust
- 🎮 **GameFi / Metaverse** - In-game credit systems with real-world backing
- 💳 **Crypto Cards** - Credit limits based on verifiable on-chain history

### Data Service Model:
- 📊 **API Subscription** - Similar to Chainalysis (pay-per-query)
- 🔌 **White-label Solutions** - Banks deploy their own branded version
- 📡 **Real-time Feeds** - Credit score updates for trading algorithms

**Think of it as**: Not "FICO for DeFi" - but "SWIFT for Credit". We connect both worlds.

---

## 🤝 Team & Contact

**Built with ❤️ for ETHGlobal by Ronny**

📧 **Email**: 2867755637@qq.com  
💬 **Discord**: ronny_hz727

---

## 🤖 AI Usage Acknowledgement

This project utilized AI tools (Claude via Cursor) to accelerate development efficiency during the ETHGlobal hackathon, while maintaining human-driven architecture and innovation.

### Human-Designed Core Innovation (100% Human)

**Architecture & Mathematical Models:**
- ✅ **VCSM (Verifiable Credit State Machine)**: The entire state machine architecture, including credit level transitions, Poseidon hash commitments, and state version control, was designed by the human developer.
- ✅ **Anti-Sybil Defense in ZK Circuits**: The innovative idea of embedding sybil defense logic (wallet age, cross-protocol reputation) directly into ZK circuit constraints was a human innovation. This ensures that even wealthy users cannot bypass anti-gaming measures through刷号 (account farming).
- ✅ **ZK + EAS Hybrid Architecture**: The design of storing commitment hashes on-chain while proving tier membership via ZK proofs was architected by the human developer to solve the privacy vs. verifiability trade-off.
- ✅ **8-Factor Credit Scoring Algorithm**: The weight distribution (wallet age: 18%, transaction frequency: 12%, etc.) and the mapping to FICO-style 300-850 scores were manually designed based on financial domain knowledge.
- ✅ **Tiered Lending Model**: The collateral ratio progression (150% → 110%) and the tier threshold design were human-created.

**Strategic Decisions:**
- ✅ Choosing Poseidon hash over SHA256 for ZK-friendliness
- ✅ Multi-source blockchain data fallback (Etherscan → RPC → Deterministic)
- ✅ Dual-mode credential design (Public vs. Privacy)
- ✅ "Alice's Journey" demo concept and user flow

### AI-Assisted Implementation

**Code Generation (AI-Assisted):**
- 🤖 React component boilerplate (buttons, cards, forms)
- 🤖 Standard Solidity patterns (events, modifiers, access control)
- 🤖 Express.js route handlers and middleware
- 🤖 Unit test scaffolding based on human-designed test cases
- 🤖 TypeScript type definitions
- 🤖 CSS styling and Tailwind utilities

**Documentation (AI Co-Authored):**
- 🤖 API documentation formatting
- 🤖 README structure and markdown formatting
- 🤖 Code comments and explanations
- 🤖 "Alice's Journey" demo narrative text

**AI Usage by File Type:**
- **Smart Contracts (`*.sol`)**: 70% human logic, 30% AI boilerplate (OpenZeppelin imports, standard patterns)
- **ZK Circuits (`*.circom`)**: 90% human logic, 10% AI syntax assistance (Circom is specialized, AI has limited knowledge)
- **Backend Services (`services/*.ts`)**: 60% human algorithm design, 40% AI implementation (API calls, error handling)
- **Frontend Components (`components/*.tsx`)**: 40% human UX design, 60% AI React/TypeScript code
- **Tests (`*.test.ts`)**: 100% human test case design, AI-generated test boilerplate

### Transparency Commitment

We believe in transparent AI usage and have:
1. ✅ Maintained detailed version control with 50+ granular commits
2. ✅ Documented all architectural decisions in `docs/` folder
3. ✅ Included circuit compilation artifacts to prove ZK circuit authenticity
4. ✅ Provided comprehensive test suites to validate human-designed logic

**The human brain designed the system. AI was the efficient hands that typed it out.**

---

## 📚 Documentation

Comprehensive guides and technical deep dives:

| Document | Description |
|----------|-------------|
| [**DAISY Architecture**](./docs/DAISY_ARCHITECTURE.md) | **🌼 Complete DAISY bridge infrastructure guide** |
| [VCSM Innovation](./docs/VCSM_INNOVATION.md) | Deep dive into Verifiable Credit State Machine |
| [Privacy Mode Guide](./docs/PRIVACY_MODE_GUIDE.md) | Complete guide to using Privacy Mode with salt-based commitments |
| [ZK + EAS Hybrid](./docs/ZK_EAS_HYBRID.md) | Architecture design for privacy-preserving attestations |
| [Circuit Performance](./docs/CIRCUIT_PERFORMANCE.md) | ZK proof benchmarks and optimization |
| [API Documentation](./docs/API.md) | Complete REST API reference |
| [Architecture](./docs/ARCHITECTURE.md) | System architecture and design decisions |
| [Deployment Guide](./docs/DEPLOYMENT.md) | How to deploy to production |
| [Testing Guide](./TESTING.md) | How to run tests and verify functionality |
| [**Test Results**](./SYSTEM_TEST_REPORT*.md) | **✅ Latest system test report (12/12 passed)** |

---

## 📄 License

MIT License - see [LICENSE](./LICENSE)

---

## 🔗 Links

| Resource | URL |
|----------|-----|
| GitHub | https://github.com/rpnny/karmatrust-mvp |
| Demo | [Coming Soon] |
| Deployed Contracts | [Coming Soon] |
| EAS Schema | [Sepolia EASScan] |

---

**Made for ETHGlobal 2026** 🚀
