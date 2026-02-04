# KarmaTrust Demo Script (3 Minutes)

**Target Audience**: ETHGlobal HackMoney 2026 Judges  
**Duration**: 3 minutes  
**Format**: Live demo with backup screenshots  

---

## Pre-Demo Checklist (5 minutes before)

```bash
# 1. Start backend (if not running)
cd backend && npm run dev

# 2. Start frontend (if not running)  
cd frontend && npm run dev

# 3. Warm up API cache (IMPORTANT!)
./scripts/warmup.sh

# 4. Open browser tabs
# - http://localhost:5173 (Demo page)
# - http://localhost:5173/demo (Split view)
```

---

## Demo Flow (3 Minutes)

### Opening (0:00 - 0:20)

**Say**:
> "KarmaTrust bridges TradFi and DeFi through verifiable credit infrastructure. We're not a lending protocol - we're the credit data layer that banks and DeFi protocols both trust."

**Show**: Homepage with tagline "Credit Infrastructure for TradFi & DeFi"

---

### Part 1: Real Data Demo (0:20 - 1:00)

**Action**: Click on "Bob" example wallet

**Say**:
> "Let me show you real Ethereum mainnet data. This is Bob's wallet - we're analyzing his actual on-chain history right now."

**Wait**: ~3 seconds (cached) or show loading

**Point out**:
- Score: 82 (Platinum tier)
- Data Source: "etherscan" with trustLevel: 100
- 8 factors breakdown

**Say**:
> "8 factors: wallet age, transaction frequency, protocol diversity, asset value, and more. All from real blockchain data - no simulations."

---

### Part 2: Split View - Privacy Demo (1:00 - 1:45)

**Action**: Navigate to `/demo` split view

**Say**:
> "Now watch the magic. On the left is what the USER sees - full data. On the right is what the BANK sees."

**Action**: Click "Generate ZK Proof"

**Wait**: 1-3 seconds for proof generation

**Point out**:
- Left side: Score 82 visible
- Right side: Score hidden, only "Platinum Tier ✓"

**Say**:
> "The bank learns 'this user is Platinum tier' but NOT their exact score. Real Groth16 zero-knowledge proof - generated in under 3 seconds."

---

### Part 3: Technical Differentiator (1:45 - 2:20)

**Say**:
> "What makes us different? Three things:"

**Point 1** (show VCSM state):
> "First, VCSM - Verifiable Credit State Machine. Credit isn't just a number. It's an evolving state with cryptographic proof of every transition."

**Point 2** (show proof details):
> "Second, real ZK circuits. Not simulated. Groth16 proofs with Poseidon hashing. Anti-sybil logic embedded directly in the circuit - mathematically enforced."

**Point 3** (show EAS):
> "Third, dual-mode credentials. Users choose: public EAS attestation for maximum credibility, or ZK proof for privacy. Both on-chain verifiable."

---

### Part 4: Market Position (2:20 - 2:50)

**Say**:
> "We're not competing with Aave or Compound. We're the infrastructure they need. Think FICO for DeFi, or SWIFT for credit."

**Show**: Architecture diagram (if time)

> "Traditional banks understand FICO scores. DeFi protocols understand on-chain tiers. We translate between both worlds."

---

### Closing (2:50 - 3:00)

**Say**:
> "KarmaTrust - credit infrastructure that both TradFi and DeFi can trust. Powered by DAISY: Decentralized Attestation Infrastructure Secured by Zero-Knowledge proofs."

**End with**: Logo or GitHub URL

---

## Backup Screenshots

In case of technical issues, have these ready:

1. `screenshots/score-result.png` - Credit score display
2. `screenshots/split-view.png` - User vs Bank view
3. `screenshots/zk-proof.png` - Proof generation result
4. `screenshots/eas-attestation.png` - On-chain attestation

---

## Q&A Preparation

### Technical Questions

**Q: "Is the ZK proof real or simulated?"**
> A: "100% real. Groth16 proof system with compiled Circom circuits. Check the console - `isSimulated: false`. Generation time 1-3 seconds, verification ~10ms."

**Q: "Where does the data come from?"**
> A: "Etherscan API V2 for Ethereum mainnet. trustLevel: 100 means authoritative source. We also have RPC fallback and deterministic baseline for resilience."

**Q: "How is this different from Spectral or Credefi?"**
> A: "Three key differences: 1) VCSM state machine approach vs static scoring, 2) Real ZK proofs not simulations, 3) We're infrastructure, not a protocol - we provide data, institutions make decisions."

**Q: "What about the anti-sybil mechanism?"**
> A: "It's embedded in the ZK circuit itself. Even if you have infinite money, you can't fake a 2-year wallet age. The proof mathematically cannot be generated if constraints fail."

### Business Questions

**Q: "Who are your customers?"**
> A: "Two sides: TradFi institutions wanting to enter DeFi (banks, credit agencies), and DeFi protocols needing institutional-grade credit data (Aave, Compound)."

**Q: "What's the business model?"**
> A: "API subscription for queries, white-label solutions for banks, and potentially a data marketplace for aggregated credit insights."

**Q: "Why would banks trust on-chain data?"**
> A: "Because it's verifiable and transparent. Traditional credit bureaus are black boxes. Our data is on-chain, auditable, and cryptographically proven."

---

## Demo Environment Checklist

| Item | Status |
|------|--------|
| Backend running (port 3000) | [ ] |
| Frontend running (port 5173) | [ ] |
| API warmup completed | [ ] |
| Browser tabs prepared | [ ] |
| Backup screenshots ready | [ ] |
| Network connection stable | [ ] |

---

## Emergency Recovery

### If API is slow:
- Use Bob address (fastest, ~3s)
- Explain: "Processing 1,308 real transactions"

### If ZK proof fails:
- Refresh and retry
- Show the proof structure from previous successful attempt
- Explain: "Circuit is loaded, just needs retry"

### If everything fails:
- Use backup screenshots
- Focus on architecture explanation
- Show GitHub README with diagrams

---

## Key Messages to Emphasize

1. **"Infrastructure, not protocol"** - We provide data, not lending decisions
2. **"Real ZK, not simulated"** - Groth16, Poseidon, Circom
3. **"TradFi + DeFi bridge"** - FICO ↔ On-chain tiers
4. **"Dual-mode credentials"** - Public (EAS) or Private (ZK)
5. **"Anti-sybil in circuit"** - Mathematically enforced

---

**Good luck with your demo!** 🚀
