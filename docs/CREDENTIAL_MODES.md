# 🔐 Credential Modes: Public vs Privacy

## 📋 Table of Contents

1. [The Privacy Paradox](#the-privacy-paradox)
2. [Mode Comparison](#mode-comparison)
3. [Technical Implementation](#technical-implementation)
4. [Use Cases](#use-cases)
5. [Design Rationale](#design-rationale)
6. [FAQ](#faq)

---

## 🤔 The Privacy Paradox

### The Question

> **"If EAS attestations contain the actual score, doesn't that defeat the purpose of ZK proofs?"**

### The Answer

**No—it's intentional design.** KarmaTrust provides **two modes** because users have **different privacy needs**.

This is not a bug; it's a **feature** that gives users choice.

---

## 📊 Mode Comparison

| Feature | 🌐 Public Mode (EAS) | 🔒 Privacy Mode (ZK) |
|---------|---------------------|---------------------|
| **Credential Type** | On-chain EAS Attestation | Zero-Knowledge Proof |
| **Score Visibility** | Public (anyone can see) | Hidden (mathematically private) |
| **Data Disclosed** | Exact score (e.g., 762) | Only tier (e.g., "Gold+") |
| **Verification** | Read from EASScan | Verify ZK proof |
| **Trust Model** | Trust attestor (KarmaTrust) | Trust math (ZK circuits) |
| **Gas Cost** | ~$0.50 (one-time) | Free (off-chain proof) |
| **Revocability** | Yes (can be revoked) | No (proof is immutable) |
| **Best For** | High scores, seeking best rates | Privacy-conscious users |

---

## 🏗️ Technical Implementation

### Public Mode (EAS Attestation)

**Schema**:
```solidity
// Registered on Sepolia
// UID: 0x80ede33b42c6a99e8a4aa30fbae0e0931b1da0f4bd69a616a088bda53d3f8aad

uint16 score;      // 300-850 (FICO-style)
string level;      // "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond"
```

**Data Encoding**:
```javascript
{
  score: 762,        // ← PUBLICLY VISIBLE ON BLOCKCHAIN
  level: "Gold"      // ← PUBLICLY VISIBLE ON BLOCKCHAIN
}
```

**Example**: https://sepolia.easscan.org/attestation/view/0xdbc95...

**Privacy**: ❌ None (by design)

---

### Privacy Mode (ZK Proof)

**Circuit**: `tier_membership.circom`

```circom
// Private inputs (hidden from verifier)
signal input score;     // The actual score (e.g., 762)
signal input salt;      // Random blinding factor

// Public inputs (visible to verifier)
signal input tier;          // Claimed tier (e.g., 3 = Gold)
signal input lowerBound;    // Tier's min score (60)
signal input upperBound;    // Tier's max score (79)
signal input commitment;    // Poseidon(score, salt)

// Constraints (mathematically enforced)
commitment === Poseidon(score, salt);     // Bind score to commitment
score >= lowerBound;                      // Score is high enough
score <= upperBound;                      // Score is not too high
```

**What the Bank Sees**:
```javascript
{
  tier: 3,                                // "User is in Gold tier"
  lowerBound: 60,                         // "Gold requires 60+"
  upperBound: 79,                         // "Gold caps at 79"
  commitment: "0x14620111..."             // Cryptographic binding
  // Actual score (762) is NEVER revealed!
}
```

**Privacy**: ✅ Full (score hidden, tier proven)

---

## 🎯 Use Cases

### When to Use Public Mode

#### Case 1: High Score Flex
```
User: Score 820 (Platinum)
Goal: Get lowest possible interest rate
Choice: Public EAS Attestation

Reasoning:
- High score is an ASSET, not a liability
- Banks offer best rates to top-tier borrowers
- Transparency builds trust
- No privacy concerns (score is impressive)
```

#### Case 2: Regulatory Compliance
```
User: Applying to regulated lender
Goal: Meet KYC/AML requirements
Choice: Public EAS Attestation

Reasoning:
- Regulators require transparent audit trail
- On-chain attestation provides immutable record
- Verifiable by authorities without our API
```

#### Case 3: DeFi Protocol Integration
```
User: Interacting with Aave/Compound
Goal: Programmatic under-collateralization
Choice: Public EAS Attestation

Reasoning:
- Smart contracts can read EAS data on-chain
- No off-chain ZK verification needed
- Gas-efficient for automated systems
```

---

### When to Use Privacy Mode

#### Case 1: Marginal Credit
```
User: Score 610 (mid-Silver)
Goal: Qualify for loan without revealing low score
Choice: ZK Proof

Reasoning:
- Score is marginal (not impressive)
- Banks learn "Silver tier" (passes threshold)
- Exact score (610) remains hidden
- User avoids stigma of "below average" score
```

#### Case 2: Privacy-Conscious Whale
```
User: Score 850, $10M portfolio
Goal: Prove creditworthiness without exposing wealth
Choice: ZK Proof

Reasoning:
- High score would reveal large asset holdings
- Security risk (targeted phishing/attacks)
- ZK proof shows "Diamond tier" without exposing $10M
```

#### Case 3: Competitive Advantage
```
User: Professional trader
Goal: Maintain trading strategy secrecy
Choice: ZK Proof

Reasoning:
- Public score reveals trading patterns
- Competitors can't analyze wallet history
- Still qualifies for institutional rates
```

---

## 🧠 Design Rationale

### Why Not Privacy-Only?

**Considered**: Making ALL credentials ZK-based (no public option)

**Rejected because**:
1. **Gas costs**: On-chain ZK verification is expensive
2. **Complexity**: Smart contracts struggle with ZK proof parsing
3. **User choice**: Some users WANT to show off high scores
4. **Trust models**: Banks may prefer attestations over ZK proofs

### Why Not Public-Only?

**Considered**: Making ALL credentials EAS-based (no ZK option)

**Rejected because**:
1. **Privacy**: Forces users to dox entire wallet history
2. **Innovation**: Doesn't showcase ZK technology
3. **Competition**: No differentiation from existing credit systems
4. **Sybil**: Can't embed anti-gaming constraints on-chain

### The Hybrid Approach

**Best of Both Worlds**:

```
          User Needs Spectrum
          
    Privacy         ←→         Transparency
    
    ZK Proof                   EAS Attestation
    (Mode 2)                   (Mode 1)
    
    - Score hidden             - Score public
    - Tier proven              - Exact value shown
    - Off-chain                - On-chain
    - Free                     - Gas cost
    - Self-sovereign           - Revocable
```

Users slide along this spectrum based on their situation.

---

## 🎭 Real-World Analogy

### Public Mode = LinkedIn Profile
- You proudly display credentials
- Anyone can see your achievements
- Builds reputation and trust
- Used when seeking opportunities

### Privacy Mode = Background Check
- Employer learns "candidate passed check"
- Exact details remain confidential
- Legally compliant without over-disclosure
- Used when privacy matters

**KarmaTrust**: We give users both options. You choose what to share, when, and with whom.

---

## ❓ FAQ

### Q: Can't banks just ignore ZK proofs and demand public attestations?

**A**: Yes, but that's a feature, not a bug.

- **Traditional finance** (high trust) → May require public attestation
- **DeFi protocols** (code is law) → Can accept ZK proofs via smart contracts
- **Privacy-focused lenders** → May prefer ZK to minimize data liability

The market decides which credential type has value.

### Q: Why would a user with a high score use ZK instead of EAS?

**A**: Privacy reasons:

1. **Security**: High score implies large assets → phishing target
2. **Competition**: Professional traders don't want to reveal strategies
3. **Negotiation**: Revealing exact score removes leverage ("I know you're desperate for loans")
4. **Future-proofing**: Score is public forever; life situations change

### Q: Can I create both credential types for the same score?

**A**: Yes! They're complementary, not exclusive.

```
User Workflow:
1. Calculate score: 762 (Gold)
2. Create EAS attestation → For DeFi protocol (public)
3. Generate ZK proof → For private lender (private)
4. Use appropriate credential for each context
```

### Q: How do I know which mode to use?

**A**: Ask yourself:

| Question | Yes → | No → |
|----------|-------|------|
| Is my score excellent (>740)? | Public | Privacy |
| Do I need smart contract integration? | Public | Privacy |
| Am I applying to traditional banks? | Public | Privacy |
| Do I value privacy over convenience? | Privacy | Public |
| Am I comfortable with permanent record? | Public | Privacy |

**Default recommendation**: Start with Privacy mode. You can always create a public attestation later, but you can't un-publish once it's on-chain.

---

## 📚 Further Reading

- [EAS Documentation](https://docs.attest.sh/)
- [Zero-Knowledge Proofs Explained](https://z.cash/technology/zksnarks/)
- [Poseidon Hash (ZK-friendly)](https://www.poseidon-hash.info/)
- [Selective Disclosure in SSI](https://www.w3.org/TR/vc-data-model/#selective-disclosure)

---

**Built with ❤️ for ETHGlobal Hackathon**
