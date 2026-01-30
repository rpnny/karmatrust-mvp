# 🏆 KarmaTrust

> **On-chain credit scoring with zero-knowledge privacy**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-MVP-yellow.svg)
![Network](https://img.shields.io/badge/network-Sepolia-purple.svg)

## 🎯 What is KarmaTrust?

KarmaTrust is a decentralized credit infrastructure that:

1. **Analyzes on-chain behavior** to generate credit scores (FICO-style 0-100)
2. **Uses ZK proofs** to verify credit levels **without exposing exact scores**
3. **Embeds anti-sybil constraints in ZK circuits** (math-guaranteed, not bypassable)

### The Problem

- DeFi requires **150%+ collateral** for loans (capital inefficiency)
- Proving creditworthiness **exposes your entire wallet** (privacy violation)
- Traditional sybil checks are **backend-only** (can be bypassed)

### Our Solution

```
User: "I'm Gold tier (score 60-79)"
Bank: "Prove it without showing your exact score"
User: *generates ZK proof*
Bank: *verifies* "Confirmed: ≥Gold tier, sybil check passed"
Bank: "I don't know if you're 61 or 79, but you qualify!"
```

## ⭐ Key Innovation: Anti-Sybil in ZK Circuit

```circom
// Even with money, you can't fake wallet age!
component sybilCheck = GreaterEqThan(8);
sybilCheck.in[0] <== sybilScore;
sybilCheck.in[1] <== minSybilScore;  // e.g., 35 for Gold
sybilCheck.out === 1;  // Math-guaranteed!
```

**Why this matters**: Traditional sybil checks can be bypassed by modifying frontend code or calling APIs directly. Our approach enforces constraints **inside the ZK circuit** - if your wallet age is too low, the proof simply cannot be generated.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                      │
│  ┌──────────────────────────┬──────────────────────────┐        │
│  │    👤 User View          │    🏦 Bank View          │        │
│  │  - Full score visible    │  - Only tier verified    │        │
│  │  - All factors shown     │  - Score shows ???       │        │
│  │  - Generate ZK proof     │  - Verify ZK proof       │        │
│  └──────────────────────────┴──────────────────────────┘        │
└────────────────────────────────────────────────────────────────┘
                              │
┌────────────────────────────▼────────────────────────────────────┐
│                    Backend (Express + TypeScript)                │
│  - Credit scoring (8 core factors)                               │
│  - VCSM state machine                                            │
│  - ZK proof generation/verification                              │
│  - EAS attestation service                                       │
└────────────────────────────────────────────────────────────────┘
                              │
┌────────────────────────────▼────────────────────────────────────┐
│                    Blockchain (Sepolia)                          │
│  - VCSMStateManager.sol (state storage)                          │
│  - ZKPVerifier.sol (on-chain verification)                       │
│  - EAS attestations                                              │
└────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/rpnny/karmatrust-mvp.git
cd karmatrust-mvp

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development servers
npm run dev
```

### Access

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

## 📊 Credit Scoring (MVP - 8 Factors)

| Factor | Weight | Description |
|--------|--------|-------------|
| Wallet Age | +15 | Time-based trust signal |
| TX Frequency | +10 | Activity level |
| Protocol Diversity | +8 | DeFi experience |
| Asset Value | +10 | Financial capacity |
| Active Usage | +7 | Recent activity bonus |
| Volatility | -8 | Risk indicator |
| Scam Connection | -25 | Red flag penalty |
| Mixer Usage | -10 | Privacy concern |

**Note**: This MVP uses hand-tuned weights. Production version will use ML optimization.

## 🔐 Credit Levels

| Score | Level | Risk |
|-------|-------|------|
| 90-100 | 💎 Diamond | Low |
| 80-89 | 🏆 Platinum | Low |
| 60-79 | 🥇 Gold | Medium |
| 40-59 | 🥈 Silver | High |
| 0-39 | 🥉 Bronze | High |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite 5, TailwindCSS, Framer Motion |
| Backend | Express.js, TypeScript, ethers.js v6 |
| Contracts | Solidity 0.8.20, Hardhat, OpenZeppelin |
| ZK Circuits | Circom 2.1.6, SnarkJS, Groth16 |
| Blockchain | Sepolia Testnet |

## 📁 Project Structure

```
karmatrust-mvp/
├── frontend/          # React + Vite frontend
├── backend/           # Express.js API server
├── contracts/         # Solidity smart contracts
├── circuits/          # Circom ZK circuits
└── docs/              # Documentation
```

## 🚧 MVP Status

This is a **hackathon MVP** demonstrating the core concept.

### ✅ Included
- Credit scoring with 8 factors
- Real on-chain data fetching
- ZK proof generation (tier membership)
- EAS attestations (Sepolia)
- Split-screen demo UI

### ⏳ Post-Hackathon Roadmap
- [ ] 12+ advanced factors
- [ ] ML weight optimization
- [ ] Multi-chain support
- [ ] Production data pipeline
- [ ] Security audit

## 📄 License

MIT License - see [LICENSE](./LICENSE)

## 🤝 Team

Built with ❤️ for ETHGlobal

---

**Demo**: [Coming Soon]  
**Deployed Contracts**: [Coming Soon]  
**Technical Blog**: [Coming Soon]
