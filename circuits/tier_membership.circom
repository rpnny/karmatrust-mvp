/**
 * Tier Membership ZK Circuit
 * 
 * Proves: "My credit score is within a certain tier range"
 * WITHOUT revealing the exact score.
 * 
 * This is the CORE PRIVACY INNOVATION of KarmaTrust.
 * 
 * Example:
 * - User has score 75 (private)
 * - User proves "I'm in Gold tier (60-79)" (public)
 * - Verifier learns ONLY that user qualifies for Gold
 * - Verifier does NOT learn the exact score
 * 
 * Circuit Inputs:
 * - Private: score, salt
 * - Public: tier, lowerBound, upperBound, commitment
 * 
 * Constraints:
 * 1. commitment = Poseidon(score, salt)  → Binds score to commitment
 * 2. score >= lowerBound                 → Score is high enough
 * 3. score <= upperBound                 → Score is not too high
 * 
 * Why Poseidon Hash?
 * - ZK-friendly: ~300 constraints vs SHA256's ~25000
 * - Native to BN254 curve used by Groth16
 * - Standard in ZK ecosystem (used by Tornado Cash, Semaphore)
 */

pragma circom 2.1.6;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/bitify.circom";

/**
 * TierMembershipProof Template
 * 
 * Proves membership in a credit tier without revealing exact score.
 * 
 * @param n - Number of bits for score representation (8 bits = 0-255)
 */
template TierMembershipProof(n) {
    // =========================================================================
    // SIGNALS
    // =========================================================================
    
    // Private inputs (known only to prover)
    signal input score;           // The actual credit score (0-100)
    signal input salt;            // Random salt for commitment
    
    // Public inputs (visible to verifier)
    signal input tier;            // Tier number (1-5)
    signal input lowerBound;      // Tier's minimum score
    signal input upperBound;      // Tier's maximum score
    signal input commitment;      // Poseidon(score, salt) - binds score
    
    // =========================================================================
    // CONSTRAINT 1: Verify Commitment
    // =========================================================================
    // 
    // The commitment is a cryptographic binding of the score.
    // This prevents the prover from lying about their score.
    // 
    // commitment = Poseidon(score, salt)
    //
    // Why include salt?
    // - Without salt, commitment would be deterministic
    // - Attacker could precompute commitments for all 0-100 scores
    // - Salt makes each commitment unique and unpredictable
    
    component hasher = Poseidon(2);
    hasher.inputs[0] <== score;
    hasher.inputs[1] <== salt;
    
    // Constraint: computed hash must equal public commitment
    commitment === hasher.out;
    
    // =========================================================================
    // CONSTRAINT 2: Score >= Lower Bound
    // =========================================================================
    //
    // Proves the score is at least the tier's minimum.
    // 
    // Example: Gold tier requires score >= 60
    // If user has score 75, this constraint passes.
    // If user has score 55, this constraint fails.
    
    component greaterEq = GreaterEqThan(n);
    greaterEq.in[0] <== score;
    greaterEq.in[1] <== lowerBound;
    
    // Constraint: comparison must output 1 (true)
    greaterEq.out === 1;
    
    // =========================================================================
    // CONSTRAINT 3: Score <= Upper Bound
    // =========================================================================
    //
    // Proves the score doesn't exceed the tier's maximum.
    // 
    // Example: Gold tier has score <= 79
    // If user has score 75, this constraint passes.
    // If user has score 85, this constraint fails.
    //
    // Note: Upper bound check prevents users from claiming lower tiers
    // to get benefits meant for "underdogs" (if such benefits existed).
    
    component lessEq = LessEqThan(n);
    lessEq.in[0] <== score;
    lessEq.in[1] <== upperBound;
    
    // Constraint: comparison must output 1 (true)
    lessEq.out === 1;
    
    // =========================================================================
    // OUTPUT
    // =========================================================================
    // 
    // No explicit output signal needed.
    // The proof itself is the output - if it verifies, the claim is true.
    // 
    // The verifier learns:
    // - The user's score IS within [lowerBound, upperBound]
    // - The commitment IS correctly formed
    // 
    // The verifier does NOT learn:
    // - The exact score
    // - The salt value
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
//
// Public signals are what the verifier can see.
// Private signals are known only to the prover.
//
// Tier definitions:
// - Bronze (1): 0-39
// - Silver (2): 40-59
// - Gold (3): 60-79
// - Platinum (4): 80-89
// - Diamond (5): 90-100

component main {public [tier, lowerBound, upperBound, commitment]} = TierMembershipProof(8);
