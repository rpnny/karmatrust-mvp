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

// Circuit file paths (relative to project root)
const CIRCUIT_PATHS = {
  wasm: process.env.CIRCUIT_WASM_PATH || '../circuits/build/tier_membership_js/tier_membership.wasm',
  zkey: process.env.CIRCUIT_ZKEY_PATH || '../circuits/build/tier_membership_final.zkey',
  vkey: '../circuits/build/verification_key.json',
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
  private isSimulation: boolean = true;
  private snarkjs: any = null;

  constructor() {
    this.checkCircuitAvailability();
  }

  /**
   * Check if compiled circuits are available
   */
  private async checkCircuitAvailability() {
    try {
      // Check if circuit files exist
      const wasmExists = fs.existsSync(path.resolve(CIRCUIT_PATHS.wasm));
      const zkeyExists = fs.existsSync(path.resolve(CIRCUIT_PATHS.zkey));

      if (wasmExists && zkeyExists) {
        // Dynamically import snarkjs
        this.snarkjs = await import('snarkjs');
        this.isSimulation = false;
        console.log('[ZKP] Real mode enabled ✅');
      } else {
        console.log('[ZKP] Simulation mode (circuits not compiled)');
        console.log(`[ZKP] Expected: ${CIRCUIT_PATHS.wasm}, ${CIRCUIT_PATHS.zkey}`);
      }
    } catch (error) {
      console.log('[ZKP] Simulation mode (snarkjs not available)');
    }
  }

  /**
   * Generate a ZK proof for tier membership
   * 
   * @param score - The actual credit score (0-100)
   * @param tier - The tier to prove membership in
   * @returns ZK proof and public signals
   */
  async generateProof(
    score: number,
    tier: CreditLevel
  ): Promise<{
    proof: ZKProof;
    publicSignals: string[];
    commitment: string;
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

    // Generate salt and commitment
    const salt = this.generateSalt();
    const commitment = await this.computeCommitment(score, salt);

    console.log(`[ZKP] Generating proof: score=${score}, tier=${CreditLevel[tier]}`);

    if (this.isSimulation) {
      return this.generateSimulatedProof(score, tier, salt, commitment);
    }

    return this.generateRealProof(score, tier, salt, commitment);
  }

  /**
   * Generate a simulated proof (for demos)
   * 
   * Simulated proofs have the same structure as real proofs but with
   * predictable values. They can be "verified" in simulation mode.
   */
  private async generateSimulatedProof(
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
    const bounds = TIER_BOUNDS[tier];

    // Generate deterministic "proof" values based on inputs
    const hash = this.simpleHash(`${score}-${tier}-${salt}`);

    const proof: ZKProof = {
      pi_a: [
        '0x' + hash.slice(0, 64),
        '0x' + hash.slice(64, 128) || hash.slice(0, 64),
        '1',
      ],
      pi_b: [
        ['0x' + hash.slice(0, 32), '0x' + hash.slice(32, 64)],
        ['0x' + hash.slice(64, 96) || hash.slice(0, 32), '0x' + hash.slice(96, 128) || hash.slice(32, 64)],
        ['1', '0'],
      ],
      pi_c: [
        '0x' + hash.slice(0, 64),
        '0x' + hash.slice(64, 128) || hash.slice(0, 64),
        '1',
      ],
      publicSignals: [
        tier.toString(),
        bounds.lower.toString(),
        bounds.upper.toString(),
        commitment,
      ],
      protocol: 'groth16',
      curve: 'bn128',
    };

    return {
      proof,
      publicSignals: proof.publicSignals,
      commitment,
      isSimulated: true,
    };
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

    try {
      // Generate proof
      const { proof, publicSignals } = await this.snarkjs.groth16.fullProve(
        input,
        path.resolve(CIRCUIT_PATHS.wasm),
        path.resolve(CIRCUIT_PATHS.zkey)
      );

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
      };
    } catch (error) {
      console.error('[ZKP] Real proof generation failed, falling back to simulation:', error);
      return this.generateSimulatedProof(score, tier, salt, commitment);
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

    if (this.isSimulation) {
      // In simulation mode, we do basic validation
      const valid = this.validateSimulatedProof(proof, publicSignals);
      return { valid, tier, bounds, isSimulated: true };
    }

    try {
      // Load verification key
      const vkeyPath = path.resolve(CIRCUIT_PATHS.vkey);
      const vkey = JSON.parse(fs.readFileSync(vkeyPath, 'utf8'));

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

      return { valid, tier, bounds, isSimulated: false };
    } catch (error) {
      console.error('[ZKP] Verification error:', error);
      // Fallback to simulation validation
      const valid = this.validateSimulatedProof(proof, publicSignals);
      return { valid, tier, bounds, isSimulated: true };
    }
  }

  /**
   * Validate a simulated proof (basic structure check)
   */
  private validateSimulatedProof(proof: ZKProof, publicSignals: string[]): boolean {
    // Check proof structure
    if (!proof.pi_a || proof.pi_a.length !== 3) return false;
    if (!proof.pi_b || proof.pi_b.length !== 3) return false;
    if (!proof.pi_c || proof.pi_c.length !== 3) return false;
    if (!publicSignals || publicSignals.length < 4) return false;

    // Check tier is valid
    const tier = parseInt(publicSignals[0]);
    if (tier < 1 || tier > 5) return false;

    // Check bounds are valid
    const lower = parseInt(publicSignals[1]);
    const upper = parseInt(publicSignals[2]);
    if (lower > upper) return false;

    return true;
  }

  /**
   * Compute Poseidon commitment: hash(score, salt)
   */
  async computeCommitment(score: number, salt: bigint): Promise<string> {
    const { poseidon, F } = await initPoseidon();
    const hash = poseidon([BigInt(score), salt]);
    return F.toString(hash);
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
   * Simple hash function for simulation (not cryptographically secure)
   */
  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    // Extend to 256 hex characters
    let result = Math.abs(hash).toString(16);
    while (result.length < 256) {
      result = result + Math.abs(hash * (result.length + 1)).toString(16);
    }
    
    return result.slice(0, 256);
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
    mode: 'real' | 'simulation';
    circuitsAvailable: boolean;
  } {
    return {
      mode: this.isSimulation ? 'simulation' : 'real',
      circuitsAvailable: !this.isSimulation,
    };
  }
}

// Export singleton instance
export const zkProofService = new ZKProofService();
