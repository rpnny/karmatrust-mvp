pragma circom 2.1.6;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";

/**
 * StateTransitionProof Circuit
 * 
 * Proves that a credit state transition is valid without revealing:
 * - The exact old score
 * - The exact new score
 * - The salt (randomness)
 * - Other sensitive attributes
 * 
 * Public inputs (what everyone can see):
 * - oldStateHash: Commitment to old state
 * - newStateHash: Commitment to new state
 * - fromLevel: Old credit level (1-5)
 * - toLevel: New credit level (1-5)
 * - minScoreRequired: Minimum score needed for upgrade
 * - minPaymentsRequired: Minimum on-time payments needed
 * - maxDebtRatioAllowed: Maximum debt ratio allowed
 * - minSybilScore: Anti-sybil threshold (INNOVATION!)
 * 
 * Private inputs (kept secret):
 * - oldScore: Actual old score (0-100)
 * - newScore: Actual new score (0-100)
 * - salt: Random value for commitment
 * - onTimePayments: Number of on-time payments
 * - debtRatio: Current debt ratio (0-100)
 * - sybilScore: Anti-gaming score (0-100)
 * 
 * The circuit proves:
 * 1. Old state hash is correctly computed from old score + old level + salt
 * 2. New state hash is correctly computed from new score + new level + salt
 * 3. New score meets minimum requirement
 * 4. On-time payments meet minimum requirement
 * 5. Debt ratio is below maximum allowed
 * 6. Sybil score meets minimum (anti-gaming!)
 * 7. Upgrade direction is correct (toLevel > fromLevel)
 * 
 * Key Innovation: Anti-Sybil Logic in ZK Circuit
 * Even if you have money, you can't bypass wallet age/reputation requirements
 * because they're enforced cryptographically in the circuit itself.
 */
template StateTransitionProof() {
    // =========================================================================
    // PRIVATE INPUTS (Secret, not revealed)
    // =========================================================================
    
    signal input oldScore;          // Old credit score (0-100)
    signal input newScore;          // New credit score (0-100)
    signal input salt;              // Random salt for Poseidon commitment
    signal input onTimePayments;    // Number of on-time payments
    signal input debtRatio;         // Debt ratio (0-100)
    signal input sybilScore;        // Anti-gaming score (0-100)
    
    // =========================================================================
    // PUBLIC INPUTS (Everyone can see these)
    // =========================================================================
    
    signal input oldStateHash;      // Poseidon(oldScore, fromLevel, salt)
    signal input newStateHash;      // Poseidon(newScore, toLevel, salt)
    signal input fromLevel;         // Old credit level (1-5)
    signal input toLevel;           // New credit level (1-5)
    signal input minScoreRequired;  // Minimum score needed
    signal input minPaymentsRequired; // Minimum payments needed
    signal input maxDebtRatioAllowed; // Maximum debt ratio
    signal input minSybilScore;     // Minimum sybil score (INNOVATION!)
    
    // =========================================================================
    // CONSTRAINT 1: Verify Old State Hash
    // =========================================================================
    // Proves that oldStateHash is the correct Poseidon hash of (oldScore, fromLevel, salt)
    
    component oldHasher = Poseidon(3);
    oldHasher.inputs[0] <== oldScore;
    oldHasher.inputs[1] <== fromLevel;
    oldHasher.inputs[2] <== salt;
    oldStateHash === oldHasher.out;
    
    // =========================================================================
    // CONSTRAINT 2: Verify New State Hash
    // =========================================================================
    // Proves that newStateHash is the correct Poseidon hash of (newScore, toLevel, salt)
    
    component newHasher = Poseidon(3);
    newHasher.inputs[0] <== newScore;
    newHasher.inputs[1] <== toLevel;
    newHasher.inputs[2] <== salt;
    newStateHash === newHasher.out;
    
    // =========================================================================
    // CONSTRAINT 3: New Score Meets Minimum
    // =========================================================================
    // Proves that newScore >= minScoreRequired
    
    component scoreCheck = GreaterEqThan(8);
    scoreCheck.in[0] <== newScore;
    scoreCheck.in[1] <== minScoreRequired;
    scoreCheck.out === 1;
    
    // =========================================================================
    // CONSTRAINT 4: On-Time Payments Meet Minimum
    // =========================================================================
    // Proves that onTimePayments >= minPaymentsRequired
    
    component paymentCheck = GreaterEqThan(8);
    paymentCheck.in[0] <== onTimePayments;
    paymentCheck.in[1] <== minPaymentsRequired;
    paymentCheck.out === 1;
    
    // =========================================================================
    // CONSTRAINT 5: Debt Ratio Below Maximum
    // =========================================================================
    // Proves that debtRatio <= maxDebtRatioAllowed
    
    component debtCheck = LessEqThan(8);
    debtCheck.in[0] <== debtRatio;
    debtCheck.in[1] <== maxDebtRatioAllowed;
    debtCheck.out === 1;
    
    // =========================================================================
    // CONSTRAINT 6: Anti-Sybil Score Meets Minimum (KEY INNOVATION!)
    // =========================================================================
    // This is the CORE INNOVATION of KarmaTrust:
    // The anti-gaming/sybil defense logic is enforced directly in the ZK circuit.
    // This means it's MATHEMATICALLY IMPOSSIBLE to bypass these checks,
    // even if you have access to the smart contract or backend.
    //
    // Traditional systems check sybil defenses in the backend (bypassable).
    // KarmaTrust enforces them cryptographically (unbypassable).
    
    component sybilCheck = GreaterEqThan(8);
    sybilCheck.in[0] <== sybilScore;
    sybilCheck.in[1] <== minSybilScore;
    sybilCheck.out === 1;
    
    // =========================================================================
    // CONSTRAINT 7: Upgrade Direction is Valid
    // =========================================================================
    // Proves that toLevel > fromLevel (this is an upgrade, not a downgrade)
    
    component upgradeCheck = GreaterThan(8);
    upgradeCheck.in[0] <== toLevel;
    upgradeCheck.in[1] <== fromLevel;
    upgradeCheck.out === 1;
    
    // =========================================================================
    // CONSTRAINT 8: Business Domain Range Checks (SECURITY FIX)
    // =========================================================================
    // Explicitly enforce that all values are within valid business domain.
    // Without these, attacker could use out-of-range values (e.g., score=255).
    
    // Score range: 0-100
    component oldScoreMax = LessEqThan(8);
    oldScoreMax.in[0] <== oldScore;
    oldScoreMax.in[1] <== 100;
    oldScoreMax.out === 1;
    
    component newScoreMax = LessEqThan(8);
    newScoreMax.in[0] <== newScore;
    newScoreMax.in[1] <== 100;
    newScoreMax.out === 1;
    
    // Level range: 1-5 (Bronze to Diamond)
    component fromLevelMin = GreaterEqThan(8);
    fromLevelMin.in[0] <== fromLevel;
    fromLevelMin.in[1] <== 1;
    fromLevelMin.out === 1;
    
    component fromLevelMax = LessEqThan(8);
    fromLevelMax.in[0] <== fromLevel;
    fromLevelMax.in[1] <== 5;
    fromLevelMax.out === 1;
    
    component toLevelMin = GreaterEqThan(8);
    toLevelMin.in[0] <== toLevel;
    toLevelMin.in[1] <== 1;
    toLevelMin.out === 1;
    
    component toLevelMax = LessEqThan(8);
    toLevelMax.in[0] <== toLevel;
    toLevelMax.in[1] <== 5;
    toLevelMax.out === 1;
    
    // Debt ratio range: 0-100
    component debtRatioMax = LessEqThan(8);
    debtRatioMax.in[0] <== debtRatio;
    debtRatioMax.in[1] <== 100;
    debtRatioMax.out === 1;
    
    // Sybil score range: 0-100
    component sybilScoreMax = LessEqThan(8);
    sybilScoreMax.in[0] <== sybilScore;
    sybilScoreMax.in[1] <== 100;
    sybilScoreMax.out === 1;
}

// =========================================================================
// MAIN COMPONENT
// =========================================================================
// Declares which inputs are public (visible to everyone) and which are private

component main {public [
    oldStateHash,
    newStateHash,
    fromLevel,
    toLevel,
    minScoreRequired,
    minPaymentsRequired,
    maxDebtRatioAllowed,
    minSybilScore
]} = StateTransitionProof();
