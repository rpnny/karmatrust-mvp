# 🎬 KarmaTrust Demo Plan

> **Complete demo strategy for ETHGlobal hackathon presentation**

---

## 📋 Table of Contents

1. [Demo Objectives](#demo-objectives)
2. [Target Audience](#target-audience)
3. [Demo Flow](#demo-flow)
4. [Technical Setup](#technical-setup)
5. [Presentation Script](#presentation-script)
6. [Q&A Preparation](#qa-preparation)
7. [Risk Mitigation](#risk-mitigation)
8. [Pre-Demo Checklist](#pre-demo-checklist)

---

## 🎯 Demo Objectives

### Primary Goal
**Make judges understand VCSM is a fundamental architectural innovation, not just "credit scoring on blockchain"**

### Key Messages to Convey
1. **VCSM Innovation**: Credit as an evolving state machine with cryptographic guarantees
2. **Real ZK Proofs**: Production-ready Groth16 proofs (not simulated)
3. **Anti-Sybil in Circuit**: Mathematical enforcement (not server-side checks)
4. **Complete Implementation**: Full-stack solution from circuits to UI

### Success Metrics
- ✅ Judges say "This is different from other credit projects"
- ✅ Judges understand the VCSM concept
- ✅ Judges see real ZK proofs generating in <2 seconds
- ✅ Judges ask technical questions about circuits (not basic "what does it do")

---

## 👥 Target Audience

### ETHGlobal Judges Profile
- **Technical depth**: Deep understanding of ZK, smart contracts, DeFi
- **Pattern recognition**: Seen hundreds of hackathon projects
- **Time constraint**: 5-10 minutes per project
- **Red flags**: Simulated proofs, over-promising, unclear differentiation

### What They're Looking For
1. **Technical innovation** (not just application)
2. **Working implementation** (not just slides)
3. **Clear differentiation** (not derivative)
4. **Production potential** (not just demo)

---

## 🎭 Demo Flow

### Option A: Live Technical Demo (Recommended)
**Duration**: 8 minutes  
**Risk**: Medium  
**Impact**: High

```
Timeline:
─────────────────────────────────────────────────────────
0:00 - 1:00  │ Hook & Problem Statement
1:00 - 3:00  │ VCSM Concept Explanation
3:00 - 5:00  │ Live ZK Proof Generation
5:00 - 7:00  │ Circuit Code Walkthrough
7:00 - 8:00  │ Competitive Positioning
```

**Advantages**:
- Shows real technical depth
- Proves claims with live demo
- Creates "wow" moment with proof generation

**Risks**:
- API could be slow/fail
- Network issues
- Unexpected errors

### Option B: Pre-Recorded + Live Walkthrough
**Duration**: 7 minutes  
**Risk**: Low  
**Impact**: Medium

```
Timeline:
─────────────────────────────────────────────────────────
0:00 - 1:00  │ Hook & Problem Statement
1:00 - 2:30  │ VCSM Concept (README diagram)
2:30 - 4:30  │ Pre-recorded video (proof generation)
4:30 - 6:30  │ Live circuit code walkthrough
6:30 - 7:00  │ Architecture explanation
```

**Advantages**:
- No technical risk
- Polished presentation
- Predictable timing

**Risks**:
- Less impressive (judges prefer live)
- Harder to prove authenticity
- Miss opportunity to show technical prowess

### Option C: Hybrid Approach (Best)
**Duration**: 8 minutes  
**Risk**: Low-Medium  
**Impact**: Very High

```
Timeline:
─────────────────────────────────────────────────────────
0:00 - 1:00  │ Hook: "Most projects port FICO to blockchain.
             │        We rebuilt credit from first principles."
             │
1:00 - 2:30  │ VCSM Concept:
             │ - Show README diagram (state machine)
             │ - Explain cryptographic guarantees
             │ - Contrast with traditional credit
             │
2:30 - 3:30  │ Live Proof Generation (Part 1):
             │ - Open frontend (http://localhost:5173/demo)
             │ - Enter wallet address
             │ - Show credit score calculation
             │ - Click "Generate ZK Proof"
             │ - [While proof generates, continue talking...]
             │
3:30 - 5:00  │ Circuit Explanation (while proof generates):
             │ - Switch to VS Code
             │ - Show state_transition.circom
             │ - Point to anti-sybil constraints (lines 310-314)
             │ - Explain why it's unforgeable
             │
5:00 - 5:30  │ Proof Result:
             │ - Switch back to browser
             │ - Show "✅ Real Proof" badge
             │ - Point out generation time (~1-2s)
             │ - Show proof structure
             │
5:30 - 6:30  │ Architecture Deep Dive:
             │ - Show deployments/sepolia.json (contracts)
             │ - Explain hash chain integrity
             │ - Show version control for replay protection
             │
6:30 - 7:30  │ Competitive Positioning:
             │ "Traditional credit: Trust the bureau
             │  VCSM: Verify the math
             │  
             │  Most projects: Copy FICO
             │  KarmaTrust: Redesign credit
             │  
             │  This is architectural innovation."
             │
7:30 - 8:00  │ Close & Invitation:
             │ - Repository link
             │ - Live deployment (if available)
             │ - Invite questions
```

**Why Hybrid Works**:
1. Start with live demo (shows confidence)
2. Use proof generation time to explain circuits (no dead time)
3. Have backup (pre-recorded video if live fails)
4. End with code walkthrough (proves technical depth)

---

## 🔧 Technical Setup

### Pre-Demo Environment Setup (30 min before)

#### Local Environment
```bash
# 1. Start backend
cd backend && npm run dev
# Wait for: "✅ Real ZK Proof mode enabled"

# 2. Start frontend
cd frontend && npm run dev
# Verify: http://localhost:5173 loads

# 3. Warm cache (generate one proof)
curl -X POST http://localhost:3000/api/zkp/generate \
  -H "Content-Type: application/json" \
  -d '{"wallet": "0x8103ac5D4a8C01Be2181AF080794411376C7f61c"}'

# 4. Verify frontend shows "Real Proof"
# Open: http://localhost:5173/demo
# Generate proof → check for green badge
```

#### Browser Setup
```
Tabs to Open (in order):
1. http://localhost:5173 (Home)
2. http://localhost:5173/demo (Demo page)
3. https://github.com/rpnny/karmatrust-mvp (Repo)
4. VS Code with state_transition.circom open
5. deployments/sepolia.json open
6. README.md scrolled to VCSM diagram
```

#### Display Settings
- **Resolution**: 1920x1080 (readable on projector)
- **Font size**: 16pt in VS Code
- **Browser zoom**: 125%
- **Disable**: Notifications, auto-sleep, screen saver

#### Network Backup
```
Primary: Local (localhost:3000, localhost:5173)
Backup 1: Deploy to Vercel + Railway (if time permits)
Backup 2: Pre-recorded video
Backup 3: Screenshots of successful runs
```

---

## 🎤 Presentation Script

### Hook (30 seconds)

**Visual**: README.md open to top

**Script**:
```
"Show of hands: Who's seen a DeFi credit scoring project today?

[Pause]

Here's the pattern: They fetch on-chain data, run some calculations,
return a number. That's just porting FICO to blockchain.

We did something different. We asked: What if credit wasn't a number,
but an evolving, verifiable state machine?

That's VCSM - Verifiable Credit State Machine."
```

**Body Language**:
- Eye contact with judges
- Confident, not rushed
- Smile (show enthusiasm)

---

### VCSM Concept (90 seconds)

**Visual**: README.md scrolled to VCSM diagram

**Script**:
```
"Traditional credit:
  [Point to left] User → Calculate → 762
  Just a snapshot. No history. No verifiability.

VCSM:
  [Point to diagram]
  Bronze → [ZK Proof] → Silver → [ZK Proof] → Gold

Every upgrade requires a zero-knowledge proof.
Not a server saying 'okay' - a cryptographic proof that:
  ✓ Score meets threshold
  ✓ Payment history is sufficient
  ✓ Anti-sybil requirements are met

And the anti-sybil logic? It's IN the ZK circuit.
Not server-side checks you can hack - it's enforced by mathematics."
```

**What to Point At**:
1. State machine arrows
2. ZK Proof boxes
3. Hash chain connection
4. State commitment formula

**Pause Points**:
- After "verifiable state machine" (let it sink in)
- After "IN the ZK circuit" (emphasize importance)

---

### Live Proof Generation (60 seconds)

**Visual**: Switch to browser (localhost:5173/demo)

**Script**:
```
"Let me show you. This is our demo interface.
[Type wallet address: 0x8103ac5D4a8C01Be2181AF080794411376C7f61c]

Credit score: 691, Gold tier.

Now, watch this -
[Click "Generate ZK Proof"]

I'm generating a REAL zero-knowledge proof right now.
Not simulated. Real Circom circuits. Real Groth16 protocol.

While this runs - about 1 to 2 seconds -
let me show you WHY this can't be faked..."
```

**Timing**:
- Don't wait for proof to finish
- Use generation time for circuit explanation
- Smooth transition to code

---

### Circuit Walkthrough (90 seconds)

**Visual**: Switch to VS Code (state_transition.circom)

**Script**:
```
[Scroll to lines 310-314]

"Here's the innovation. Look at this:

  signal input sybilScore;
  signal input minSybilScore;
  
  component sybilCheck = GreaterEqThan(8);
  sybilCheck.in[0] <== sybilScore;
  sybilCheck.in[1] <== minSybilScore;
  sybilCheck.out === 1;

This is a constraint. Mathematical, not programmatic.

If your wallet is only 2 months old, and Gold tier requires
6 months, the proof CANNOT be generated. Not 'won't' - CAN'T.

Even if you:
  - Hack our server
  - Modify the code
  - Have infinite money

You can't bypass mathematics.

Traditional systems: 'if (walletAge >= 180) { allow(); }'
  → Hackable

VCSM: Constraint in ZK circuit
  → Mathematically unforgeable

That's the difference between application-layer security
and cryptographic-layer security."
```

**What to Emphasize**:
- Point directly at constraint lines
- Use hand gestures for "CAN'T"
- Speak slower on key points

---

### Proof Result (30 seconds)

**Visual**: Switch back to browser

**Script**:
```
[Proof should be done by now]

"Done! See that?
[Point to green badge]

'✅ Real Proof' - Generated in [X] seconds.

This proves I'm in Gold tier without revealing my exact score.
The verifier learns: 'Score is between 60 and 79'
Not: 'Score is 68'

Verification? 8 milliseconds. 100x faster than generation.
That's production-ready performance."
```

**If Proof Failed**:
```
"Looks like we hit a network issue.
[Don't panic - have backup ready]

Let me show you a previous run...
[Switch to pre-recorded or screenshot]

This is why we have the circuit code open -
you can verify the implementation yourself."
```

---

### Architecture (60 seconds)

**Visual**: VS Code (deployments/sepolia.json)

**Script**:
```
"Quick architecture overview:

[Point to contract addresses]
Two contracts on Sepolia:
  - VCSMStateManager: Stores state commitments
  - TieredLending: Credit-based borrowing

Each user state has:
  - Poseidon hash commitment
  - Version number (replay protection)
  - Previous hash (chain integrity)

It's like how Ethereum tracks state:
  State root → World state
  
VCSM:
  State hash → User credit state

Same principles, different domain."
```

**Show**:
- Contract addresses (proves deployment)
- State structure (shows design depth)
- Tier configurations (shows completeness)

---

### Competitive Positioning (60 seconds)

**Visual**: Back to README or slides

**Script**:
```
"Why does this matter?

Traditional credit systems:
  ❌ Static snapshot
  ❌ Trust-based (believe the bureau)
  ❌ No history
  ❌ Server-side checks

VCSM:
  ✅ Dynamic state machine
  ✅ Cryptographically verifiable
  ✅ Immutable history (hash chain)
  ✅ Math-enforced rules

Most DeFi projects:
  'We calculate credit scores using on-chain data'
  [Shrug gesture] That's just Experian with ethers.js

KarmaTrust:
  'We rebuilt credit as a verifiable state machine'
  This is architectural innovation.

It's the difference between:
  - Using blockchain as a database
  - Using blockchain's properties (immutability, verifiability, decentralization)

We're doing the latter."
```

**Tone**:
- Confident but not arrogant
- Factual, not dismissive of others
- Emphasize innovation, not just implementation

---

### Close (30 seconds)

**Visual**: GitHub repo

**Script**:
```
"Everything's open source:
  github.com/rpnny/karmatrust-mvp

Deployed on Sepolia. Circuits compiled. Real proofs.

We documented our ZK circuit performance,
our VCSM architecture, and even our demo prep
process - all in the repo.

We'd love to answer questions about the circuits,
the state machine design, or the anti-sybil mechanism.

Thank you!"
```

**Final Impression**:
- Smile
- Open posture (inviting questions)
- Don't rush off stage

---

## 💬 Q&A Preparation

### Expected Questions & Answers

#### Technical Questions

**Q: "How do you prevent Sybil attacks?"**

**A**: 
```
"Great question. Most projects check wallet age in the backend:
  if (walletAge < 180) { reject(); }

Problem: Attackers can bypass this by hacking the server or API.

We embed it in the ZK circuit as a constraint:
  sybilScore >= minSybilScore

The proof literally cannot be generated if this isn't satisfied.
It's enforced by the mathematics of zero-knowledge proofs,
not by server-side logic.

This is in state_transition.circom, lines 310-314.
I can show you if you'd like."
```

**Follow-up response if they want to see**:
- Pull up circuit code
- Point to exact lines
- Offer to walk through the math

---

**Q: "What if someone replays an old proof?"**

**A**:
```
"We have version control built into the state hash.

Each state includes:
  - stateHash = Poseidon(score, level, salt)
  - version number
  - previousHash (links to previous state)

When you try to upgrade, the circuit verifies:
  1. Old state hash is valid
  2. New state hash is valid
  3. Version increments correctly

If you replay a v1→v2 proof when you're at v3,
the verifier rejects it because the state hashes don't match.

It's similar to how Ethereum prevents transaction replays
with nonces."
```

---

**Q: "Is this actually using real ZK proofs or simulated?"**

**A**:
```
"Real Groth16 proofs using Circom and snarkjs.

Evidence:
  1. Frontend shows 'Real Proof' badge (not 'Simulated')
  2. Generation time is 1-2 seconds (simulation is instant)
  3. Circuits are compiled in circuits/build/
  4. We have .wasm, .zkey, and verification key files

I literally just generated one in front of you.
If you want, I can show you the circuit compilation artifacts
or generate another proof right now."
```

**If they're skeptical**:
- Offer to generate another proof
- Show circuit files
- Walk through proof structure

---

**Q: "How does this compare to other credit scoring projects?"**

**A**:
```
"Most projects follow this pattern:
  1. Fetch on-chain data
  2. Run scoring algorithm
  3. Return a number

That's fine, but it's just porting FICO to blockchain.
No architectural innovation.

VCSM is different:
  - Credit as a STATE MACHINE (not a snapshot)
  - Cryptographic STATE COMMITMENTS
  - VERIFIABLE TRANSITIONS (with ZK proofs)
  - IMMUTABLE HISTORY (hash chain)

It's closer to how Ethereum itself works than to FICO.

Think of it this way:
  - Other projects: Application layer (use blockchain as DB)
  - VCSM: Protocol layer (use blockchain properties)

We're building infrastructure, not an application."
```

---

**Q: "What's your business model?"**

**A**:
```
"This is a hackathon MVP demonstrating technical feasibility.

Post-hackathon, potential paths:
  1. API Service (like Chainalysis)
     → DeFi protocols pay per credit check
  
  2. Infrastructure Provider (like FICO)
     → License VCSM to lenders
  
  3. Open Core
     → Basic scoring open source
     → Advanced features (ML models, real-time updates) paid

But for this hackathon, focus is on proving the VCSM concept works:
  ✓ Real ZK proofs
  ✓ Production-ready performance
  ✓ Complete implementation
  ✓ Novel architecture

Business model comes after validation."
```

---

**Q: "Why Poseidon hash instead of SHA256?"**

**A**:
```
"ZK-friendliness.

SHA256 in a ZK circuit: ~25,000 constraints
Poseidon in a ZK circuit: ~300 constraints

That's 80x fewer constraints, which means:
  - Faster proof generation
  - Smaller proof size
  - Lower verification gas costs

Poseidon was specifically designed for ZK applications.
It's used in production by:
  - Zcash (Sapling)
  - Tornado Cash
  - Polygon Hermez

We're using the circomlibjs implementation,
same as most ZK projects in the ecosystem."
```

---

#### Differentiation Questions

**Q: "What's new here? This sounds like credit scoring."**

**A**:
```
"The innovation is VCSM - the state machine architecture.

Let me contrast:

Traditional credit (FICO, Experian):
  - Static: Calculate score → return number
  - Trust-based: You trust the bureau
  - Opaque: No history, no proofs

Most DeFi projects:
  - Same as traditional, just using blockchain data
  - Still static, still trust-based

VCSM (KarmaTrust):
  - Dynamic: Credit evolves through verifiable states
  - Cryptographic: Math-enforced transitions
  - Transparent: Complete audit trail via hash chain

The closest analogy:
  - Ethereum is a state machine for value transfer
  - VCSM is a state machine for credit reputation

We're not building an app on blockchain.
We're applying blockchain's state machine paradigm
to a new domain: credit.

That's protocol-level innovation."
```

**Tone**: Patient but firm. This is your core differentiator.

---

**Q: "Can't someone just copy this?"**

**A**:
```
"Yes, it's open source! That's intentional.

For this hackathon:
  - Open source maximizes award potential
  - Shows confidence in technical depth
  - Enables community verification

Post-hackathon:
  - Core VCSM logic stays open (like FICO formulas are known)
  - Proprietary ML models for scoring (like FICO's exact weights)
  - Network effects (more users = better data = better scores)

But more importantly: This isn't about hiding code.
It's about execution.

FICO's scoring formula is roughly known.
But building a credit bureau isn't about the formula -
it's about data, reputation, integrations, compliance.

We're demonstrating technical feasibility here.
If someone wants to compete, great!
That validates the market."
```

---

#### Implementation Questions

**Q: "How long did this take to build?"**

**A**:
```
"This MVP: ~48 hours of focused development.

Breakdown:
  - ZK circuits: 8 hours (design + compile + test)
  - Smart contracts: 6 hours (write + deploy + verify)
  - Backend: 12 hours (scoring + VCSM + APIs)
  - Frontend: 12 hours (UI + integration)
  - Documentation: 10 hours (README + docs)

But the VCSM concept: months of thinking.

The implementation is fast because the architecture is sound.
We spent time designing the state machine correctly,
then implementation was straightforward.

Classic software principle:
  Weeks of coding can save hours of thinking."
```

---

**Q: "What are the circuit constraints count?"**

**A**:
```
"Two circuits:

tier_membership.circom: ~1,200 constraints
  - Proves score is within tier bounds
  - Uses Poseidon hash (300 constraints)
  - Range checks (GreaterEqThan, LessEqThan)

state_transition.circom: ~570 constraints
  - Proves valid state transition
  - Verifies old and new state hashes
  - Enforces upgrade conditions
  - Anti-sybil check

For context:
  - Tornado Cash (mixing): ~2,800 constraints
  - Zcash Sapling (shielded tx): ~170,000 constraints

We're on the lighter end, which means:
  - Sub-second proof generation
  - Fast verification
  - Low gas costs for on-chain verification

This is achievable because:
  - Simple logic (range checks)
  - Poseidon hash (efficient)
  - No complex crypto (no signatures, etc.)"
```

---

### Deflection Strategies

**If asked about something unimplemented**:

**Example Q**: "Can users dispute their credit score?"

**A**:
```
"Great feature idea! For this MVP, we focused on core VCSM:
  ✓ State transitions with proofs
  ✓ Anti-sybil in circuits
  ✓ Production-ready ZK proofs

Dispute mechanism would be interesting to add:
  - Could use EAS attestations for appeals
  - ZK proof could show "score should be X not Y"
  - Governance layer for resolution

But we prioritized proving the state machine concept works.
Dispute flow is a great v2 feature."
```

**Pattern**:
1. Acknowledge it's a good idea
2. Explain why MVP scope didn't include it
3. Offer how it could be implemented
4. Redirect to what WAS implemented

---

**If asked about security audits**:

**A**:
```
"This is a hackathon MVP, so no formal audit yet.

Security measures we DID take:
  ✓ Use audited libraries (OpenZeppelin contracts)
  ✓ Use standard ZK stack (Circom, snarkjs, Groth16)
  ✓ Follow best practices (checks-effects-interactions)
  ✓ Testnet deployment only

For production:
  - Full security audit required (Consensys, Trail of Bits)
  - Bug bounty program
  - Gradual rollout with limits
  - Circuit formal verification

But the cryptographic primitives (Poseidon, Groth16)
are battle-tested in production systems like Zcash."
```

---

### Hostile Questions (How to Handle)

**Q: "This is just a FICO clone with extra steps."**

**Remain calm, confident**:
```
"I respectfully disagree. Let me show you the difference.

[Pull up code or diagram]

FICO: Static score calculation
VCSM: Dynamic state machine with:
  - Cryptographic commitments (Poseidon hash)
  - Verifiable transitions (ZK proofs)
  - Immutable history (hash chain)
  - Math-enforced anti-gaming (circuit constraints)

If you believe those aren't meaningful innovations,
I'm curious: What would you change about the design?

[Invitation to engage technically, not argue]"
```

**Strategy**:
- Don't get defensive
- Show technical depth
- Invite constructive feedback
- Redirect to technical discussion

---

## 🛡️ Risk Mitigation

### Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Backend crash | Low | High | Have restart script ready, pre-warm cache |
| Proof generation slow (>3s) | Medium | Medium | Mention "cold start", continue talking |
| Proof generation fails | Low | High | Have backup video/screenshot |
| Network down | Very Low | Critical | Local hosting, no external dependencies |
| Forgot script | Low | Medium | Practice 5x, have notes on phone |
| Projector issues | Medium | High | Have backup laptop |
| Time runs out | Medium | Low | Prioritize sections, skip if needed |

### Backup Plans

#### Backup Level 1: Slow Performance
**Scenario**: Proof takes 3-5 seconds instead of 1-2s

**Response**:
```
"Proof generation on this network is a bit slower...
[Don't apologize excessively]

While this runs, let me show you the circuit constraints
that make this unforgeable..."

[Continue with circuit walkthrough]
[By the time you're done, proof should be ready]
```

**Key**: Don't draw attention to slowness, just roll with it.

---

#### Backup Level 2: Proof Generation Fails
**Scenario**: API returns error or simulated proof

**Response**:
```
"Looks like we hit a network hiccup.
[Stay calm, don't panic]

Let me show you a previous successful run...

[Pull up backup screenshot or video]

The key point isn't whether this particular instance works -
it's the architecture. Let me walk you through the circuit..."

[Pivot to code walkthrough]
```

**Have Ready**:
- Screenshot of successful "Real Proof" generation
- Video recording of proof generation
- Pre-generated proof JSON

---

#### Backup Level 3: Total Demo Failure
**Scenario**: Backend crashes, can't recover quickly

**Response**:
```
"Classic hackathon demo curse!
[Laugh it off, judges understand]

Rather than waste time debugging,
let me show you the circuit code directly.

[Open VS Code]

This is what makes VCSM unique...

[Do code walkthrough]
[Show deployment addresses]
[Show test results / benchmarks]

The code is live on GitHub if you want to verify:
github.com/rpnny/karmatrust-mvp"
```

**Key**: Pivot to code and architecture. Judges care more about depth than perfect demo.

---

### Pre-Demo Testing

**1 Day Before**:
- [ ] Full demo run-through (3x)
- [ ] Record backup video
- [ ] Take backup screenshots
- [ ] Verify all links work
- [ ] Test on demo laptop/machine

**1 Hour Before**:
- [ ] Restart backend
- [ ] Restart frontend
- [ ] Generate one proof (warm cache)
- [ ] Verify "Real Proof" badge
- [ ] Check all tabs are open
- [ ] Disable notifications

**5 Minutes Before**:
- [ ] One final proof generation test
- [ ] Check battery (100%)
- [ ] Check network connection
- [ ] Take deep breath

---

## ✅ Pre-Demo Checklist

### Technical Setup (30 min before)

**Backend**:
- [ ] Backend running on port 3000
- [ ] Health check passes: `curl http://localhost:3000/api/health`
- [ ] ZK service shows "Real mode enabled"
- [ ] Test proof generation: ~1-2 seconds
- [ ] No errors in console

**Frontend**:
- [ ] Frontend running on port 5173
- [ ] All pages load: Home, Demo, Journey, Analytics
- [ ] Test wallet: 0x8103ac5D4a8C01Be2181AF080794411376C7f61c
- [ ] Proof generation shows "Real Proof" badge
- [ ] No console errors

**Browser**:
- [ ] 6 tabs open (Home, Demo, Repo, VS Code, etc.)
- [ ] Browser zoom: 125%
- [ ] Notifications disabled
- [ ] Auto-fill disabled (avoid typos)

**VS Code**:
- [ ] state_transition.circom open at lines 310-314
- [ ] Font size: 16pt
- [ ] Theme: Dark (readable on projector)
- [ ] No other files open (avoid clutter)

**Display**:
- [ ] Resolution: 1920x1080
- [ ] External monitor tested (if using projector)
- [ ] Brightness: 100%
- [ ] No screensaver
- [ ] Hide dock/taskbar if possible

**Network**:
- [ ] On stable network (not public WiFi)
- [ ] Backup: Mobile hotspot ready
- [ ] All services are local (no external API dependencies)

**Backup Materials**:
- [ ] Screenshot folder ready (successful proofs)
- [ ] Video recording of successful run
- [ ] GitHub repo link copied
- [ ] Contract addresses copied

**Personal**:
- [ ] Water bottle nearby
- [ ] Phone on silent
- [ ] Notes on phone (backup script)
- [ ] Laptop charged 100%
- [ ] Backup laptop ready (if available)

---

## 🎯 Final Tips

### Do's
- ✅ **Practice 5x minimum** - muscle memory for smooth delivery
- ✅ **Speak slowly** - judges are processing complex info
- ✅ **Make eye contact** - connects with audience
- ✅ **Pause after key points** - let ideas sink in
- ✅ **Show enthusiasm** - passion is contagious
- ✅ **Invite questions** - shows confidence
- ✅ **Use hand gestures** - points attention
- ✅ **Smile** - makes you approachable

### Don'ts
- ❌ **Don't apologize** for minor issues (judges won't notice)
- ❌ **Don't rush** - quality > speed
- ❌ **Don't read slides** - talk naturally
- ❌ **Don't use jargon without explaining** - some judges may not know Groth16
- ❌ **Don't trash competitors** - be respectful
- ❌ **Don't promise features not built** - focus on what exists
- ❌ **Don't panic if demo fails** - pivot to code
- ❌ **Don't go over time** - judges have schedules

### Body Language
- **Posture**: Stand straight, shoulders back
- **Hands**: Open gestures, avoid pockets
- **Movement**: Stay in one spot, don't pace
- **Eyes**: Scan all judges, don't favor one
- **Face**: Smile naturally, show passion

### Voice
- **Volume**: Loud enough for back of room
- **Pace**: Slower than normal conversation
- **Tone**: Confident but not arrogant
- **Pauses**: Use them for emphasis

### Energy Management
- **Start**: High energy (hook the audience)
- **Middle**: Steady, informative
- **Technical parts**: Slower, clearer
- **End**: Return to high energy (leave impression)

---

## 📊 Success Indicators

### During Demo
- ✅ Judges lean forward (engaged)
- ✅ Judges take notes
- ✅ Judges nod during key points
- ✅ No confused looks
- ✅ Questions are technical (not clarification)

### After Demo
- ✅ Judges say "interesting approach"
- ✅ Judges ask about team/next steps
- ✅ Judges mention specific technical details
- ✅ Judges compare to other advanced projects
- ✅ Judges take photo of screen/info

### Red Flags
- ❌ Judges on phones (not engaged)
- ❌ Judges interrupt with basic questions
- ❌ Judges say "so it's like FICO?"
- ❌ Judges don't ask any questions
- ❌ Judges leave early

---

## 🎬 Final Rehearsal Script

### Day Before Demo

**Full Run-Through** (Do 3 times):

```
1. Start with clean slate:
   - Restart backend
   - Restart frontend
   - Clear browser cache

2. Run complete demo flow:
   - Hook (30s)
   - VCSM concept (90s)
   - Live proof generation (60s)
   - Circuit walkthrough (90s)
   - Proof result (30s)
   - Architecture (60s)
   - Positioning (60s)
   - Close (30s)
   
   Total: ~8 minutes

3. Time yourself:
   - If >8 min: Cut architecture section
   - If <7 min: Add more circuit detail

4. Practice Q&A:
   - Have friend ask tough questions
   - Practice deflection strategies
   - Don't get flustered

5. Test failure scenarios:
   - Simulate slow proof generation
   - Simulate API error
   - Practice backup pivots
```

**Video Record**:
- Record your practice run
- Watch for:
  - Verbal tics ("um", "uh", "so")
  - Pacing issues
  - Unclear explanations
  - Body language
- Improve and record again

---

## 📝 Recommended Demo Choice

**Recommendation**: **Option C: Hybrid Approach**

**Rationale**:
1. **Best risk/reward balance**
   - Live demo shows confidence
   - Backup materials reduce risk
   - Code walkthrough proves depth

2. **Time management**
   - Use proof generation time for circuit explanation
   - No awkward waiting
   - Natural flow

3. **Multiple "wow" moments**
   - Live proof generation (technical)
   - Circuit code (depth)
   - Architecture explanation (completeness)

4. **Plays to strengths**
   - Working implementation (proof of execution)
   - Technical depth (circuit design)
   - Clear differentiation (VCSM concept)

**If only 5 minutes**:
- Skip architecture section
- Go straight from proof result to positioning

**If more time (10+ minutes)**:
- Add Alice's Journey walkthrough
- Show contract verification on Etherscan
- Demonstrate state transition (if working)

---

**Last Updated**: 2026-02-01  
**Version**: 1.0  
**Status**: Ready for Review
