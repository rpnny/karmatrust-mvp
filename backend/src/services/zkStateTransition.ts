/**
 * ZK State Transition Service
 * 
 * Generates zero-knowledge proofs for credit state transitions (upgrades/downgrades).
 * 
 * What this proves:
 * "I upgraded from Silver to Gold legitimately" WITHOUT revealing:
 * - Exact old score
 * - Exact new score
 * - Salt (randomness)
 * - Payment history details
 * - Debt ratio details
 * 
 * The circuit verifies:
 * 1. Old state hash is correct
 * 2. New state hash is correct
 * 3. New score meets minimum for target level
 * 4. On-time payments meet minimum
 * 5. Debt ratio is below maximum
 * 6. Sybil score meets minimum (ANTI-GAMING!)
 * 7. Upgrade direction is valid
 * 
 * Key Innovation: Anti-Sybil in ZK Circuit
 * Even if you have money, you can't bypass wallet age requirements
 * because they're enforced cryptographically in the circuit.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { CreditState } from '../types/index.js';
import { saltToBigInt } from './vcsm/creditState.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Navigate from backend/src/services/ to project root
const PROJECT_ROOT = path.resolve(__dirname, '../../../');

// =============================================================================
// CONFIGURATION
// =============================================================================

const CIRCUIT_PATHS = {
  wasm: path.join(PROJECT_ROOT, 'circuits/build/state_transition_js/state_transition.wasm'),
  zkey: path.join(PROJECT_ROOT, 'circuits/build/state_transition_final.zkey'),
  vkey: path.join(PROJECT_ROOT, 'circuits/build/state_transition_vkey.json'),
};

// =============================================================================
// TYPES
// =============================================================================

interface StateTransitionInput {
  // Private inputs
  oldScore: string;
  newScore: string;
  salt: string;
  onTimePayments: string;
  debtRatio: string;
  sybilScore: string;
  
  // Public inputs
  oldStateHash: string;
  newStateHash: string;
  fromLevel: string;
  toLevel: string;
  minScoreRequired: string;
  minPaymentsRequired: string;
  maxDebtRatioAllowed: string;
  minSybilScore: string;
}

interface StateTransitionProof {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    protocol: string;
    curve: string;
  };
  publicSignals: string[];
  circuitId: string;
  proofId: string;
  generationTime: number;
  constraints: number;
  isSimulated: boolean;
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class ZKStateTransitionService {
  private snarkjs: any = null;
  private constraintCount: number = 1378; // Actual constraint count from circuit

  constructor() {
    this.checkCircuitAvailability();
  }

  /**
   * Check if compiled circuits are available - throws if missing
   */
  private async checkCircuitAvailability() {
    const wasmExists = fs.existsSync(CIRCUIT_PATHS.wasm);
    const zkeyExists = fs.existsSync(CIRCUIT_PATHS.zkey);
    const vkeyExists = fs.existsSync(CIRCUIT_PATHS.vkey);

    console.log('[ZK-StateTransition] Checking circuit files:');
    console.log(`[ZK-StateTransition]   WASM: ${wasmExists ? '✅' : '❌'}`);
    console.log(`[ZK-StateTransition]   ZKEY: ${zkeyExists ? '✅' : '❌'}`);
    console.log(`[ZK-StateTransition]   VKEY: ${vkeyExists ? '✅' : '❌'}`);

    if (!wasmExists || !zkeyExists || !vkeyExists) {
      const missing = [
        !wasmExists && CIRCUIT_PATHS.wasm,
        !zkeyExists && CIRCUIT_PATHS.zkey,
        !vkeyExists && CIRCUIT_PATHS.vkey,
      ].filter(Boolean);
      
      const error = new Error(
        'State transition circuit files not found!\n' +
        'Missing files:\n' +
        missing.map(f => `  - ${f}`).join('\n') +
        '\n\nRun: cd circuits && npm run build:circuits'
      );
      console.error('[ZK-StateTransition] ❌ FATAL:', error.message);
      throw error;
    }

    try {
      this.snarkjs = await import('snarkjs');
      console.log('[ZK-StateTransition] ✅ State transition service initialized');
    } catch (error) {
      console.error('[ZK-StateTransition] ❌ Failed to load snarkjs:', error);
      throw new Error('Failed to initialize snarkjs');
    }
  }

  /**
   * Generate a ZK proof for state transition
   * 
   * @param fromState - Current credit state
   * @param toState - Target credit state
   * @param circuitParams - Transition rule parameters
   * @param sybilScore - Anti-gaming score (0-100)
   * @returns ZK proof and metadata
   */
  async generateTransitionProof(
    fromState: CreditState,
    toState: CreditState,
    circuitParams: any,
    sybilScore: number
  ): Promise<StateTransitionProof> {
    const startTime = Date.now();

    // Prepare circuit inputs
    const input: StateTransitionInput = {
      // Private inputs
      oldScore: fromState.score.toString(),
      newScore: toState.score.toString(),
      salt: saltToBigInt(toState.salt).toString(),
      onTimePayments: (toState.attributes.onTimePayments || 0).toString(),
      debtRatio: (toState.attributes.debtRatio || 0).toString(),
      sybilScore: Math.floor(sybilScore).toString(),
      
      // Public inputs
      oldStateHash: fromState.stateHash,
      newStateHash: toState.stateHash,
      fromLevel: fromState.level.toString(),
      toLevel: toState.level.toString(),
      minScoreRequired: (circuitParams?.minScoreRequired || 0).toString(),
      minPaymentsRequired: (circuitParams?.minPaymentsRequired || 0).toString(),
      maxDebtRatioAllowed: (circuitParams?.maxDebtRatioAllowed || 100).toString(),
      minSybilScore: (circuitParams?.minSybilScore || 0).toString(),
    };

    console.log(`[ZK-StateTransition] Generating proof for ${fromState.level} → ${toState.level}`);
    console.log('[ZK-StateTransition] Computing witness...');
    
    // Generate witness and proof
    const { proof, publicSignals } = await this.snarkjs.groth16.fullProve(
      input,
      CIRCUIT_PATHS.wasm,
      CIRCUIT_PATHS.zkey
    );

    const generationTime = Date.now() - startTime;
    console.log(`[ZK-StateTransition] ✅ Proof generated in ${generationTime}ms`);

    return {
      proof: {
        pi_a: proof.pi_a.slice(0, 2).map(String),
        pi_b: proof.pi_b.slice(0, 2).map((row: any[]) => row.slice(0, 2).reverse().map(String)),
        pi_c: proof.pi_c.slice(0, 2).map(String),
        protocol: proof.protocol || 'groth16',
        curve: proof.curve || 'bn128',
      },
      publicSignals: publicSignals.map(String),
      circuitId: 'state_transition',
      proofId: `proof_${crypto.randomUUID()}`,
      generationTime,
      constraints: this.constraintCount,
      isSimulated: false,
    };
  }

  /**
   * Verify a state transition proof
   * 
   * @param proof - The ZK proof to verify
   * @param publicSignals - Public signals from proof generation
   * @returns Whether the proof is valid
   */
  async verifyProof(proof: any, publicSignals: string[]): Promise<boolean> {
    try {
      // Load verification key
      const vKey = JSON.parse(fs.readFileSync(CIRCUIT_PATHS.vkey, 'utf-8'));
      
      // Verify proof
      const isValid = await this.snarkjs.groth16.verify(vKey, publicSignals, proof);
      
      console.log(`[ZK-StateTransition] Proof verification: ${isValid ? 'VALID ✅' : 'INVALID ❌'}`);
      
      return isValid;
    } catch (error: any) {
      console.error('[ZK-StateTransition] Verification failed:', error.message);
      return false;
    }
  }

  /**
   * Get circuit info for debugging/monitoring
   */
  getCircuitInfo() {
    return {
      circuitId: 'state_transition',
      constraints: this.constraintCount,
      paths: CIRCUIT_PATHS,
    };
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const zkStateTransitionService = new ZKStateTransitionService();
