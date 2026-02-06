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
    // CONSTRAINT 4: Tier-Bounds Consistency (SECURITY FIX)
    // =========================================================================
    //
    // CRITICAL: Verify that tier matches the provided bounds.
    // Without this, attacker could provide Gold bounds but claim Diamond tier.
    //
    // Tier-to-bounds mapping:
    // - Bronze (1): 0-39
    // - Silver (2): 40-59
    // - Gold (3): 60-79
    // - Platinum (4): 80-89
    // - Diamond (5): 90-100
    //
    // We enforce this by checking each tier's expected bounds.
    
    // Check if tier is Bronze (1)
    component isTier1 = IsEqual();
    isTier1.in[0] <== tier;
    isTier1.in[1] <== 1;
    
    component checkBronzeLower = IsEqual();
    checkBronzeLower.in[0] <== lowerBound;
    checkBronzeLower.in[1] <== 0;
    
    component checkBronzeUpper = IsEqual();
    checkBronzeUpper.in[0] <== upperBound;
    checkBronzeUpper.in[1] <== 39;
    
    // Check if tier is Silver (2)
    component isTier2 = IsEqual();
    isTier2.in[0] <== tier;
    isTier2.in[1] <== 2;
    
    component checkSilverLower = IsEqual();
    checkSilverLower.in[0] <== lowerBound;
    checkSilverLower.in[1] <== 40;
    
    component checkSilverUpper = IsEqual();
    checkSilverUpper.in[0] <== upperBound;
    checkSilverUpper.in[1] <== 59;
    
    // Check if tier is Gold (3)
    component isTier3 = IsEqual();
    isTier3.in[0] <== tier;
    isTier3.in[1] <== 3;
    
    component checkGoldLower = IsEqual();
    checkGoldLower.in[0] <== lowerBound;
    checkGoldLower.in[1] <== 60;
    
    component checkGoldUpper = IsEqual();
    checkGoldUpper.in[0] <== upperBound;
    checkGoldUpper.in[1] <== 79;
    
    // Check if tier is Platinum (4)
    component isTier4 = IsEqual();
    isTier4.in[0] <== tier;
    isTier4.in[1] <== 4;
    
    component checkPlatinumLower = IsEqual();
    checkPlatinumLower.in[0] <== lowerBound;
    checkPlatinumLower.in[1] <== 80;
    
    component checkPlatinumUpper = IsEqual();
    checkPlatinumUpper.in[0] <== upperBound;
    checkPlatinumUpper.in[1] <== 89;
    
    // Check if tier is Diamond (5)
    component isTier5 = IsEqual();
    isTier5.in[0] <== tier;
    isTier5.in[1] <== 5;
    
    component checkDiamondLower = IsEqual();
    checkDiamondLower.in[0] <== lowerBound;
    checkDiamondLower.in[1] <== 90;
    
    component checkDiamondUpper = IsEqual();
    checkDiamondUpper.in[0] <== upperBound;
    checkDiamondUpper.in[1] <== 100;
    
    // Enforce: At least one tier must match with correct bounds
    // (tier1 AND bounds1) OR (tier2 AND bounds2) OR ... OR (tier5 AND bounds5)
    signal tier1Match;
    tier1Match <== isTier1.out * checkBronzeLower.out * checkBronzeUpper.out;
    
    signal tier2Match;
    tier2Match <== isTier2.out * checkSilverLower.out * checkSilverUpper.out;
    
    signal tier3Match;
    tier3Match <== isTier3.out * checkGoldLower.out * checkGoldUpper.out;
    
    signal tier4Match;
    tier4Match <== isTier4.out * checkPlatinumLower.out * checkPlatinumUpper.out;
    
    signal tier5Match;
    tier5Match <== isTier5.out * checkDiamondLower.out * checkDiamondUpper.out;
    
    // Sum of all matches must be exactly 1 (one tier matches)
    signal totalMatches;
    totalMatches <== tier1Match + tier2Match + tier3Match + tier4Match + tier5Match;
    totalMatches === 1;
    
    // =========================================================================
    // CONSTRAINT 5: Business Domain Range Checks (SECURITY FIX)
    // =========================================================================
    //
    // Ensure score is within business domain (0-100)
    // Without this, attacker could use score 255 with manipulated bounds
    
    component scoreMax = LessEqThan(n);
    scoreMax.in[0] <== score;
    scoreMax.in[1] <== 100;
    scoreMax.out === 1;
    
    // Ensure tier is within valid range (1-5)
    component tierMin = GreaterEqThan(n);
    tierMin.in[0] <== tier;
    tierMin.in[1] <== 1;
    tierMin.out === 1;
    
    component tierMax = LessEqThan(n);
    tierMax.in[0] <== tier;
    tierMax.in[1] <== 5;
    tierMax.out === 1;
    
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
    // - The tier and bounds are consistent (SECURITY: now enforced!)
    // - All values are within valid business domain
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
