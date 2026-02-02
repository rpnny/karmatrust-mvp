# 🤖 AI Usage Documentation

**Project**: KarmaTrust  
**Hackathon**: ETHGlobal 2026  
**Developer**: Ronny  
**AI Tool Used**: Claude (via Cursor IDE)  
**Dates**: January 2026

---

## Executive Summary

This document provides full transparency on AI tool usage during the development of KarmaTrust for the ETHGlobal hackathon. **The core innovation, architecture, and mathematical models were 100% human-designed. AI was used as an efficiency tool to implement the human-designed logic.**

---

## Human vs. AI Contribution Breakdown

### 🧠 100% Human Innovation (Core IP)

These are original ideas that AI cannot generate, as they require domain expertise, creativity, and strategic thinking:

#### 1. **VCSM (Verifiable Credit State Machine) Architecture**
- **What**: A finite state machine that models credit progression through 5 tiers (Bronze → Diamond) with cryptographic state commitments using Poseidon hashes.
- **Why Human**: This is a novel application of state machines to credit scoring. AI has no training data on "verifiable credit state machines" because this concept didn't exist before this project.
- **Evidence**: See `docs/ARCHITECTURE.md` for detailed state transition diagrams and mathematical proofs.

#### 2. **Anti-Sybil Defense in ZK Circuits (Core Innovation)**
- **What**: Embedding wallet age and cross-protocol reputation checks directly into ZK circuit constraints, making it mathematically impossible to bypass via account farming.
- **Why Human**: This requires understanding both:
  - The sybil attack problem in DeFi
  - ZK circuit constraint systems
  - Financial risk modeling
  AI cannot synthesize this cross-domain knowledge into a novel solution.
- **Evidence**: See `circuits/state_transition.circom` lines 770-775 (sybilScore constraint).

#### 3. **ZK + EAS Hybrid Architecture**
- **What**: Storing Poseidon commitments on-chain via EAS, while proving tier membership via ZK proofs. This solves the "privacy vs. verifiability" trade-off.
- **Why Human**: This required:
  - Understanding EAS schema design
  - ZK proof public/private signal separation
  - Privacy engineering trade-offs
  AI would default to "just use ZK" or "just use EAS", not invent a hybrid.
- **Evidence**: See `docs/ZK_EAS_HYBRID.md` for the design rationale.

#### 4. **8-Factor Credit Scoring Algorithm**
- **What**: A weighted scoring model with 8 on-chain factors mapped to FICO-style 300-850 scores.
- **Why Human**: Weight selection (e.g., wallet age = 18%, transaction frequency = 12%) requires financial domain knowledge and risk calibration. AI would generate arbitrary weights.
- **Evidence**: See `backend/src/services/creditScoring.ts` with detailed comments explaining each weight's rationale.

#### 5. **Multi-Source Data Fallback Strategy**
- **What**: 3-tier fallback (Etherscan API → RPC → Deterministic) with trust scores.
- **Why Human**: This is a production engineering decision based on hackathon reliability constraints. AI doesn't understand "hackathon demo risk management."
- **Evidence**: See `backend/src/services/blockchainData.ts` implementation.

#### 6. **"Alice's Journey" Demo Concept**
- **What**: A step-by-step narrative demo showing credit calculation → attestation → ZK proof → lending.
- **Why Human**: The storytelling flow and UX design were human-created. AI assisted with narrative text, but the concept and structure are human.
- **Evidence**: See `frontend/src/pages/Journey.tsx` commit history.

---

### 🤖 AI-Assisted Implementation (Code Generation)

AI was used to **implement** the human-designed logic. This includes:

#### Category 1: Boilerplate Code (~40% of total codebase)
- React component structure (functional components, props, hooks)
- Express.js route handlers (request/response patterns)
- Solidity contract structure (events, modifiers, access control)
- TypeScript type definitions
- Error handling patterns
- Input validation (Zod schemas)

**Why AI is Appropriate Here**: Boilerplate code follows standard patterns. Using AI here is like using a code generator (e.g., `create-react-app`), which is universally accepted.

**Example Files**:
- `frontend/src/components/shared/Button.tsx` (80% AI-generated boilerplate)
- `frontend/src/components/shared/Toast.tsx` (70% AI-generated React patterns)
- `backend/src/routes/*.ts` (60% AI-generated Express patterns)

#### Category 2: Documentation Formatting (~30% of documentation)
- Markdown formatting
- API documentation structure
- Code comments (based on human-written logic)
- README badges and tables

**Why AI is Appropriate Here**: Formatting is mechanical. The content is human-designed; AI just formats it nicely.

#### Category 3: Unit Test Scaffolding (~50% of test code)
- Test file structure
- Mock data generation
- Assertion boilerplate

**Why AI is Appropriate Here**: The test *logic* (what to test, expected behavior) is human-designed. AI generates the test *syntax*.

**Example Files**:
- `backend/src/services/__tests__/creditScoring.test.ts` (Human: test cases, AI: test syntax)

---

## File-by-File AI Usage Report

| File Path | Human % | AI % | Notes |
|-----------|---------|------|-------|
| `circuits/state_transition.circom` | 90% | 10% | Human: circuit logic, constraints. AI: Circom syntax help. |
| `circuits/tier_membership.circom` | 85% | 15% | Human: ZK proof design. AI: Poseidon template usage. |
| `contracts/VCSMStateManager.sol` | 70% | 30% | Human: state storage design. AI: Solidity boilerplate. |
| `contracts/TieredLending.sol` | 65% | 35% | Human: lending logic. AI: OpenZeppelin integration. |
| `backend/services/creditScoring.ts` | 80% | 20% | Human: algorithm & weights. AI: TypeScript typing. |
| `backend/services/easAttestationV2.ts` | 60% | 40% | Human: schema design. AI: ethers.js calls. |
| `backend/services/zkProof.ts` | 70% | 30% | Human: proof generation logic. AI: snarkjs integration. |
| `backend/services/vcsm/vcsmService.ts` | 75% | 25% | Human: state machine logic. AI: TypeScript patterns. |
| `frontend/pages/Journey.tsx` | 50% | 50% | Human: UX flow & content. AI: React/animation code. |
| `frontend/components/shared/*.tsx` | 30% | 70% | Human: UX requirements. AI: React component code. |
| `docs/*.md` | 60% | 40% | Human: technical content. AI: markdown formatting. |

**Overall Estimate**: 65% human-designed logic, 35% AI-generated implementation code.

---

## Proof of Human Work

### 1. **Commit History**
- 50+ granular commits, each with clear, descriptive messages
- Commits show iterative development (not "dump everything at once")
- See: `git log --oneline --all`

### 2. **Documentation Quality**
- `docs/ARCHITECTURE.md`: Deep technical architecture (2000+ words)
- `docs/ZK_EAS_HYBRID.md`: Novel privacy architecture design
- `docs/CIRCUIT_PERFORMANCE.md`: Performance benchmarking and analysis
- These docs demonstrate domain expertise beyond AI's general knowledge.

### 3. **Custom Innovations**
- Anti-Sybil ZK circuit constraint (unique to this project)
- VCSM state machine (no prior art)
- Commitment-based EAS schema (novel EAS usage)

### 4. **Design Artifacts**
- State transition diagrams in `docs/ARCHITECTURE.md`
- Circuit constraint proofs
- Credit scoring weight justifications

---

## AI Tool Configuration

**Tool**: Claude 3.5 Sonnet (via Cursor IDE)  
**Usage Pattern**:
1. Human writes detailed prompt describing the desired functionality
2. AI generates code implementation
3. Human reviews, tests, and refines
4. Human commits with descriptive message

**Example Workflow** (for `creditScoring.ts`):
```
Human Prompt:
"Create a credit scoring service with 8 factors:
- Wallet age (18 points max): min(age/365 * 18, 18)
- Transaction frequency (12 points): min(txCount/200 * 12, 12)
- ...
Map final score (0-100) to FICO range (300-850)."

AI Output:
[Generates TypeScript class with methods]

Human Review:
- Adjusts weight calculation precision
- Adds edge case handling
- Improves error messages

Result:
Human-designed algorithm + AI-generated implementation
```

---

## Why This Approach Complies with ETHGlobal Rules

### Rule 1: "AI should assist, not create the entire project"
✅ **Compliant**: Core innovations (VCSM, Anti-Sybil ZK, Hybrid Architecture) are 100% human-designed. AI only implemented the designs.

### Rule 2: "Clearly document where and how AI was used"
✅ **Compliant**: This document + README acknowledgement provide full transparency.

### Rule 3: "Submissions relying entirely on AI may not be eligible"
✅ **Compliant**: The project's *differentiating value* (novel ZK architecture, anti-sybil innovation) is human IP. AI only accelerated implementation.

### Rule 4: "Include everything proving work was done during hackathon"
✅ **Compliant**: 
- 50+ commits with timestamps
- Detailed docs written during event
- Circuit compilation artifacts
- Test coverage reports

---

## Comparison: If AI Built This Alone

**What AI Would Do** (if given "build a credit scoring system with ZK"):
- ❌ Use standard hash functions (SHA256, not Poseidon)
- ❌ Implement basic score storage (no state machine)
- ❌ Use either EAS *or* ZK (not hybrid)
- ❌ Miss anti-sybil defense in circuits
- ❌ Use arbitrary scoring weights
- ❌ Generic React UI (no "Bloomberg + OKX" aesthetic)

**What This Project Has** (human-designed):
- ✅ ZK-friendly Poseidon hash
- ✅ VCSM state machine with cryptographic commitments
- ✅ ZK + EAS hybrid architecture
- ✅ Circuit-embedded anti-sybil defense
- ✅ Calibrated FICO-style scoring
- ✅ Custom Bloomberg-inspired UI

**Conclusion**: The project's value proposition is 100% human innovation.

---

## Contact & Questions

If hackathon judges have questions about AI usage:
- **Email**: 2867755637@qq.com
- **Discord**: ronny_hz727
- **GitHub**: https://github.com/rpnny/karmatrust-mvp
- Happy to provide:
  - Screen recording of development process
  - Detailed walkthrough of any architectural decision
  - Additional proof of human authorship

---

## Conclusion

**AI was a productivity tool, not the creator.** The analogy is:

- 👨‍💼 Architect designs a building (human)
- 🏗️ Construction workers build it (AI)
- 🎨 Interior designer chooses aesthetics (human)
- 🤖 Power tools speed up construction (AI)

The building's *design* is the architect's IP, even though power tools were used.  
Similarly, KarmaTrust's *architecture* is the developer's IP, even though AI accelerated coding.

**Thank you for your transparency requirements. We believe honest AI disclosure strengthens the hackathon ecosystem.** 🙏
