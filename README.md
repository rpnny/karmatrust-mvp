# 🏆 KarmaTrust

> **DeFi's FICO Score + Zero-Knowledge Privacy**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![Status](https://img.shields.io/badge/status-MVP-yellow.svg)]()
[![Network](https://img.shields.io/badge/network-Sepolia-purple.svg)]()
[![ETHGlobal](https://img.shields.io/badge/hackathon-ETHGlobal-brightgreen.svg)]()

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

## 🎯 The Problem

| Problem | Current Pain | Impact |
|---------|-------------|--------|
| **Over-collateralization** | Borrow $100 → Need $150+ collateral | Capital inefficiency |
| **Privacy Violation** | Prove creditworthiness → Expose entire wallet | Identity risk |
| **Sybil Attacks** | Backend anti-gaming → Easily bypassed | System gaming |
| **No Standard** | No FICO for DeFi → Banks don't trust | Adoption barrier |

## 💡 Our Solution: Dual-Mode Credentials

KarmaTrust provides **two ways** to prove creditworthiness. Users choose based on their priorities:

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

## ⭐ Key Innovation: Anti-Sybil in ZK Circuit

**This is our core differentiator.**

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
Body: { "score": 75, "targetTier": 3 }

# Verify proof
POST /api/zkp/verify
Body: { "proof": {...}, "publicSignals": [...] }
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

| Operation | Time | Notes |
|-----------|------|-------|
| Credit score calculation | ~500ms | With RPC fallback |
| ZK proof generation | ~2-3s | Groth16, simulated |
| EAS attestation | ~15s | On-chain transaction |
| State transition | ~1s | In-memory (MVP) |

---

## 🗺️ Roadmap

### MVP (Hackathon) ✅
- [x] 8-factor credit scoring
- [x] Split-screen demo UI
- [x] ZK tier membership proof
- [x] EAS attestations
- [x] VCSM state machine
- [x] Smart contracts

### Post-Hackathon
- [ ] 20+ scoring factors with ML weights
- [ ] Production ZK circuit compilation
- [ ] Multi-chain support (Base, Arbitrum)
- [ ] Real-time data pipeline
- [ ] B2B API portal
- [ ] Security audit

---

## 💼 Business Model

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          REVENUE STREAMS                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. B2B API Subscription                                                 │
│     └── DeFi protocols pay per query (like Chainalysis)                  │
│                                                                          │
│  2. On-chain Verification Fees                                           │
│     └── Gas fee sharing for ZK proof verification                        │
│                                                                          │
│  3. Premium Attestations                                                 │
│     └── Enhanced credentials for institutions                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🤝 Team

Built with ❤️ for ETHGlobal

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
