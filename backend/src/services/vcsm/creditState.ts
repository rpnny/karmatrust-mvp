/**
 * Credit State Management
 * 
 * Handles the creation and management of VCSM (Verifiable Credit State Machine) states.
 * 
 * What is VCSM?
 * A state machine where each user's credit is modeled as a state that can transition
 * between levels (Bronze → Silver → Gold → Platinum → Diamond).
 * 
 * Key Concepts:
 * 1. State Hash: Poseidon(score, level, salt) - cryptographic commitment
 * 2. Hash Chain: Each state links to previous state (like blockchain)
 * 3. Version: Replay protection (cannot reuse old states)
 * 4. Attributes: Payment history, debt ratio, etc.
 * 
 * Why Poseidon Hash?
 * - ZK-friendly (~300 constraints vs SHA256's ~25000)
 * - Native to BN254 curve used by Groth16
 * - Can be verified inside ZK circuits
 * 
 * State Transition:
 * oldState → [verify conditions + ZK proof] → newState
 * Each transition creates a new state with updated hash chain.
 */

import { buildPoseidon } from 'circomlibjs';
import { CreditState, CreditLevel, LEVEL_NAMES } from '../../types/index.js';

// =============================================================================
// POSEIDON INITIALIZATION
// =============================================================================

let poseidon: any = null;
let poseidonF: any = null;

/**
 * Initialize Poseidon hash function
 * Lazy initialization to avoid blocking startup
 */
export async function initPoseidon() {
  if (!poseidon) {
    poseidon = await buildPoseidon();
    poseidonF = poseidon.F;
    console.log('[VCSM] Poseidon hash initialized ✅');
  }
  return { poseidon, F: poseidonF };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert internal score (0-100) to credit level
 * 
 * Level thresholds:
 * - Bronze: 0-39
 * - Silver: 40-59
 * - Gold: 60-79
 * - Platinum: 80-89
 * - Diamond: 90-100
 */
export function scoreToLevel(score: number): CreditLevel {
  if (score < 0) return CreditLevel.UNVERIFIED;
  if (score < 40) return CreditLevel.BRONZE;
  if (score < 60) return CreditLevel.SILVER;
  if (score < 80) return CreditLevel.GOLD;
  if (score < 90) return CreditLevel.PLATINUM;
  return CreditLevel.DIAMOND;
}

/**
 * Generate cryptographically secure random salt
 * 
 * Salt ensures:
 * - Each state hash is unique
 * - Cannot precompute hash tables
 * - Privacy of score even if hash is public
 */
export function generateSalt(): string {
  const bytes = new Uint8Array(31); // Poseidon field element limit
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Convert hex salt string to BigInt for Poseidon
 */
export function saltToBigInt(salt: string): bigint {
  // Truncate to ensure it fits in field
  const truncated = salt.slice(0, 62);
  return BigInt('0x' + truncated);
}

/**
 * Compute state hash using Poseidon
 * 
 * hash = Poseidon(score, level, salt)
 * 
 * This creates a cryptographic commitment to the state.
 * - Cannot reverse to get score
 * - Can verify in ZK circuit
 * - Different salt = different hash (even for same score)
 */
export async function computeStateHash(
  score: number,
  level: CreditLevel,
  salt: bigint
): Promise<string> {
  const { poseidon, F } = await initPoseidon();
  
  const hash = poseidon([
    BigInt(score),
    BigInt(level),
    salt
  ]);
  
  return F.toString(hash);
}

/**
 * Create initial credit state for a new user
 * 
 * @param userId - Wallet address
 * @param initialScore - Starting score (default 50)
 */
export async function createInitialState(
  userId: string,
  initialScore: number = 50
): Promise<CreditState> {
  const salt = generateSalt();
  const level = scoreToLevel(initialScore);
  const saltBigInt = saltToBigInt(salt);
  const stateHash = await computeStateHash(initialScore, level, saltBigInt);

  const state: CreditState = {
    stateId: crypto.randomUUID(),
    userId,
    level,
    score: initialScore,
    stateHash,
    previousHash: '0', // Genesis state has no previous
    salt,
    version: 1,
    timestamp: Date.now(),
    attributes: {
      onTimePayments: 0,
      defaultCount: 0,
      debtRatio: 0,
      kycVerified: false,
    },
  };

  return state;
}

/**
 * Create a new state from an existing state (for transitions)
 * 
 * This maintains the hash chain:
 * newState.previousHash = oldState.stateHash
 */
export async function createTransitionState(
  previousState: CreditState,
  newScore: number,
  attributeUpdates?: Partial<CreditState['attributes']>
): Promise<CreditState> {
  const salt = generateSalt();
  const level = scoreToLevel(newScore);
  const saltBigInt = saltToBigInt(salt);
  const stateHash = await computeStateHash(newScore, level, saltBigInt);

  const newAttributes = {
    ...previousState.attributes,
    ...attributeUpdates,
  };

  const state: CreditState = {
    stateId: crypto.randomUUID(),
    userId: previousState.userId,
    level,
    score: newScore,
    stateHash,
    previousHash: previousState.stateHash, // Link to previous state
    salt,
    version: previousState.version + 1,    // Increment version
    timestamp: Date.now(),
    attributes: newAttributes,
  };

  return state;
}

/**
 * Verify state hash is correctly computed
 * 
 * Used to validate states before accepting transitions.
 */
export async function verifyStateHash(state: CreditState): Promise<boolean> {
  try {
    const expectedHash = await computeStateHash(
      state.score,
      state.level,
      saltToBigInt(state.salt)
    );
    return expectedHash === state.stateHash;
  } catch {
    return false;
  }
}

/**
 * Format state for API response (hide sensitive data)
 */
export function formatStateForResponse(state: CreditState): {
  stateId: string;
  level: CreditLevel;
  levelName: string;
  stateHash: string;
  version: number;
  timestamp: number;
  attributes: CreditState['attributes'];
} {
  return {
    stateId: state.stateId,
    level: state.level,
    levelName: LEVEL_NAMES[state.level],
    stateHash: state.stateHash,
    version: state.version,
    timestamp: state.timestamp,
    attributes: state.attributes,
  };
}
