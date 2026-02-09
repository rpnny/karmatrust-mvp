/**
 * ZK Proof Service
 * 
 * Generates and verifies zero-knowledge proofs for credit tier membership.
 * 
 * What this proves:
 * "I have a credit score in the range [X, Y]" WITHOUT revealing the exact score.
 * 
 * How it works:
 * 1. User has score (e.g., 75) and salt (random)
 * 2. User computes commitment = Poseidon(score, salt)
 * 3. User generates ZK proof that score is within tier bounds
 * 4. Verifier checks proof - learns only tier membership, not exact score
 * 
 * Operating Modes:
 * - REAL MODE: Uses actual Circom circuits and snarkjs (requires compiled circuits)
 * - SIMULATION MODE: Returns mock proof (for demos without circuit setup)
 * 
 * Why simulation mode?
 * - Circuit compilation requires Circom installed
 * - Ceremony setup takes time (Powers of Tau, contribution)
 * - Hackathon demos need to work out of the box
 * - Simulation proofs have same structure, just predictable values
 */

import { buildPoseidon } from 'circomlibjs';
import { ZKProof, CreditLevel } from '../types/index.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Navigate from backend/src/services/ to project root
const PROJECT_ROOT = path.resolve(__dirname, '../../../');

// =============================================================================
// CONFIGURATION
// =============================================================================

// Tier bounds for score ranges
const TIER_BOUNDS: Record<CreditLevel, { lower: number; upper: number }> = {
  [CreditLevel.UNVERIFIED]: { lower: 0, upper: 0 },
  [CreditLevel.BRONZE]: { lower: 0, upper: 39 },
  [CreditLevel.SILVER]: { lower: 40, upper: 59 },
  [CreditLevel.GOLD]: { lower: 60, upper: 79 },
  [CreditLevel.PLATINUM]: { lower: 80, upper: 89 },
  [CreditLevel.DIAMOND]: { lower: 90, upper: 100 },
};

// Circuit file paths (absolute from project root)
const CIRCUIT_PATHS = {
  wasm: process.env.CIRCUIT_WASM_PATH || path.join(PROJECT_ROOT, 'circuits/build/tier_membership_js/tier_membership.wasm'),
  zkey: process.env.CIRCUIT_ZKEY_PATH || path.join(PROJECT_ROOT, 'circuits/build/tier_membership_final.zkey'),
  vkey: path.join(PROJECT_ROOT, 'circuits/build/verification_key.json'),
};

// =============================================================================
// POSEIDON HASH INITIALIZATION
// =============================================================================

let poseidon: any = null;
let poseidonF: any = null;

async function initPoseidon() {
  if (!poseidon) {
    poseidon = await buildPoseidon();
    poseidonF = poseidon.F;
  }
  return { poseidon, F: poseidonF };
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class ZKProofService {
  private snarkjs: any = null;

  constructor() {
    this.checkCircuitAvailability();
  }

  /**
   * Check if compiled circuits are available
   * Throws error if not found - no simulation mode
   */
  private async checkCircuitAvailability() {
    // Check if circuit files exist (CIRCUIT_PATHS are already absolute)
    const wasmExists = fs.existsSync(CIRCUIT_PATHS.wasm);
    const zkeyExists = fs.existsSync(CIRCUIT_PATHS.zkey);

    console.log('[ZKP] Checking circuit files:');
    console.log(`[ZKP]   WASM: ${CIRCUIT_PATHS.wasm} → ${wasmExists ? '✅' : '❌'}`);
    console.log(`[ZKP]   ZKEY: ${CIRCUIT_PATHS.zkey} → ${zkeyExists ? '✅' : '❌'}`);

    if (!wasmExists || !zkeyExists) {
      const error = new Error(
        'ZK circuit files not found! Required files:\n' +
        `  - WASM: ${CIRCUIT_PATHS.wasm}\n` +
        `  - ZKEY: ${CIRCUIT_PATHS.zkey}\n` +
        'Run: cd circuits && npm run build:circuits'
      );
      console.error('[ZKP] ❌ FATAL:', error.message);
      throw error;
    }

    try {
      // Dynamically import snarkjs
      this.snarkjs = await import('snarkjs');
      console.log('[ZKP] ✅ ZK Proof service initialized with real circuits.');
    } catch (error) {
      console.error('[ZKP] ❌ Failed to load snarkjs:', error);
      throw new Error('Failed to initialize snarkjs. Is it installed? Run: npm install');
    }
  }

  /**
   * Generate a ZK proof for tier membership
   * 
   * @param score - The actual credit score (0-100)
   * @param tier - The tier to prove membership in
   * @param providedSalt - (Optional) User-provided salt for Privacy Mode
   * @param expectedCommitment - (Optional) Expected commitment to verify against (from EAS)
   * @returns ZK proof and public signals
   * 
   * Two modes:
   * 1. Public Mode: Generate new salt (backward compatible)
   * 2. Privacy Mode: Use providedSalt and verify against expectedCommitment
   */
  async generateProof(
    score: number,
    tier: CreditLevel,
    providedSalt?: string,
    expectedCommitment?: string
  ): Promise<{
    proof: ZKProof;
    publicSignals: string[];
    commitment: string;
    salt: string;
    isSimulated: boolean;
  }> {
    // Validate inputs
    if (tier === CreditLevel.UNVERIFIED) {
      throw new Error('Cannot generate proof for UNVERIFIED tier');
    }

    const bounds = TIER_BOUNDS[tier];
    if (score < bounds.lower || score > bounds.upper) {
      throw new Error(`Score ${score} is not in tier ${CreditLevel[tier]} (${bounds.lower}-${bounds.upper})`);
    }

    let salt: bigint;
    let commitment: string;
    let saltHex: string;

    // Privacy Mode: Use user-provided salt
    if (providedSalt && expectedCommitment) {
      console.log(`[ZKP] Privacy Mode: Using provided salt`);
      
      // Parse salt (support both hex and decimal string formats)
      try {
        if (providedSalt.startsWith('0x')) {
          salt = BigInt(providedSalt);
          saltHex = providedSalt;
        } else {
          // Assume it's a hex string without 0x prefix
          salt = BigInt('0x' + providedSalt);
          saltHex = '0x' + providedSalt;
        }
      } catch (e) {
        throw new Error(`Invalid salt format: ${providedSalt}`);
      }

      // Compute commitment with provided salt
      commitment = await this.computeCommitment(score, salt);

      // Verify commitment matches expected (from EAS)
      if (commitment !== expectedCommitment) {
        console.error(`[ZKP] Commitment mismatch!`);
        console.error(`[ZKP]   Expected: ${expectedCommitment}`);
        console.error(`[ZKP]   Computed: ${commitment}`);
        console.error(`[ZKP]   Score: ${score}, Salt: ${saltHex}`);
        throw new Error('Commitment mismatch! The salt does not match the on-chain commitment. Please check your salt value.');
      }

      console.log(`[ZKP] Commitment verified ✅`);
    } 
    // Public Mode: Generate new salt (backward compatible)
    else {
      console.log(`[ZKP] Public Mode: Generating new salt`);
      salt = this.generateSalt();
      saltHex = '0x' + salt.toString(16).padStart(64, '0');
      commitment = await this.computeCommitment(score, salt);
    }

    console.log(`[ZKP] Generating proof: score=${score}, tier=${CreditLevel[tier]}, commitment=${commitment.slice(0, 20)}...`);

    // Always generate real proofs - no simulation fallback
    const result = await this.generateRealProof(score, tier, salt, commitment);
    return { ...result, salt: saltHex };
  }

  /**
   * Generate a real ZK proof using snarkjs
   */
  private async generateRealProof(
    score: number,
    tier: CreditLevel,
    salt: bigint,
    commitment: string
  ): Promise<{
    proof: ZKProof;
    publicSignals: string[];
    commitment: string;
    isSimulated: boolean;
  }> {
    if (!this.snarkjs) {
      throw new Error('snarkjs not initialized');
    }

    const bounds = TIER_BOUNDS[tier];

    // Prepare circuit inputs
    const input = {
      score: score.toString(),
      salt: salt.toString(),
      tier: tier.toString(),
      lowerBound: bounds.lower.toString(),
      upperBound: bounds.upper.toString(),
      commitment: commitment,
    };

    console.log('[ZKP] Generating REAL ZK proof using snarkjs...');
    // Generate proof (CIRCUIT_PATHS are already absolute)
    const { proof, publicSignals } = await this.snarkjs.groth16.fullProve(
      input,
      CIRCUIT_PATHS.wasm,
      CIRCUIT_PATHS.zkey
    );
    console.log('[ZKP] ✅ Real ZK proof generated successfully!');

    return {
      proof: {
        pi_a: proof.pi_a.map(String),
        pi_b: proof.pi_b.map((row: any[]) => row.map(String)),
        pi_c: proof.pi_c.map(String),
        publicSignals: publicSignals.map(String),
        protocol: 'groth16',
        curve: 'bn128',
      },
      publicSignals: publicSignals.map(String),
      commitment,
      isSimulated: false,
    }
  }

  /**
   * Verify a ZK proof
   * 
   * @param proof - The proof to verify
   * @param publicSignals - Public signals (tier, bounds, commitment)
   * @returns Whether the proof is valid
   */
  async verifyProof(
    proof: ZKProof,
    publicSignals: string[]
  ): Promise<{
    valid: boolean;
    tier: CreditLevel;
    bounds: { lower: number; upper: number };
    isSimulated: boolean;
  }> {
    // Parse public signals
    const tier = parseInt(publicSignals[0]) as CreditLevel;
    const bounds = {
      lower: parseInt(publicSignals[1]),
      upper: parseInt(publicSignals[2]),
    };

    console.log(`[ZKP] Verifying proof for tier ${CreditLevel[tier]}`);
    console.log('[ZKP] Verifying REAL ZK proof...');
    
    // Load verification key (CIRCUIT_PATHS.vkey is already absolute)
    const vkey = JSON.parse(fs.readFileSync(CIRCUIT_PATHS.vkey, 'utf8'));

    // Verify using snarkjs
    const valid = await this.snarkjs.groth16.verify(
      vkey,
      publicSignals,
      {
        pi_a: proof.pi_a,
        pi_b: proof.pi_b,
        pi_c: proof.pi_c,
      }
    );

    console.log(`[ZKP] ${valid ? '✅' : '❌'} Proof verification result: ${valid}`);
    return { valid, tier, bounds, isSimulated: false };
  }

  /**
   * Compute Poseidon commitment: hash(score, salt)
   * MUST match the implementation in easAttestationV2.ts
   */
  async computeCommitment(score: number, salt: bigint): Promise<string> {
    const { poseidon, F } = await initPoseidon();
    const hash = poseidon([BigInt(score), salt]);
    // IMPORTANT: Use padStart(64, '0') to ensure consistent hex format
    // This MUST match easAttestationV2.computeCommitment()
    return '0x' + F.toString(hash, 16).padStart(64, '0');
  }

  /**
   * Generate a random salt
   */
  private generateSalt(): bigint {
    // Generate 31 bytes of randomness (Poseidon field element limit)
    const bytes = new Uint8Array(31);
    crypto.getRandomValues(bytes);
    
    let hex = '0x';
    for (const byte of bytes) {
      hex += byte.toString(16).padStart(2, '0');
    }
    
    return BigInt(hex);
  }

  /**
   * Get tier bounds
   */
  getTierBounds(tier: CreditLevel): { lower: number; upper: number } {
    return TIER_BOUNDS[tier];
  }

  /**
   * Get service status
   */
  getStatus(): {
    mode: 'real';
    circuitsAvailable: true;
  } {
    return {
      mode: 'real',
      circuitsAvailable: true,
    };
  }
}

// Export singleton instance
export const zkProofService = new ZKProofService();
