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
import { CreditState } from '../types/index.js';
import { saltToBigInt } from './vcsm/creditState.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

const CIRCUIT_PATHS = {
  wasm: path.resolve('../circuits/build/state_transition_js/state_transition.wasm'),
  zkey: path.resolve('../circuits/build/state_transition_final.zkey'),
  vkey: path.resolve('../circuits/build/state_transition_vkey.json'),
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
  private isSimulation: boolean = true;
  private snarkjs: any = null;
  private constraintCount: number = 573; // From circuit compilation

  constructor() {
    this.checkCircuitAvailability();
  }

  /**
   * Check if compiled circuits are available
   */
  private async checkCircuitAvailability() {
    try {
      const wasmExists = fs.existsSync(CIRCUIT_PATHS.wasm);
      const zkeyExists = fs.existsSync(CIRCUIT_PATHS.zkey);
      const vkeyExists = fs.existsSync(CIRCUIT_PATHS.vkey);

      if (wasmExists && zkeyExists && vkeyExists) {
        this.snarkjs = await import('snarkjs');
        this.isSimulation = false;
        console.log('[ZK-StateTransition] Real mode enabled ✅');
        console.log(`[ZK-StateTransition] Circuits loaded from: ${path.dirname(CIRCUIT_PATHS.wasm)}`);
      } else {
        console.log('[ZK-StateTransition] Simulation mode (circuits not available)');
        if (!wasmExists) console.log(`[ZK-StateTransition] Missing: ${CIRCUIT_PATHS.wasm}`);
        if (!zkeyExists) console.log(`[ZK-StateTransition] Missing: ${CIRCUIT_PATHS.zkey}`);
        if (!vkeyExists) console.log(`[ZK-StateTransition] Missing: ${CIRCUIT_PATHS.vkey}`);
      }
    } catch (error: any) {
      console.log('[ZK-StateTransition] Simulation mode:', error.message);
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

    if (this.isSimulation) {
      return this.generateSimulatedProof(input, startTime);
    }

    return this.generateRealProof(input, startTime);
  }

  /**
   * Generate a real ZK proof using snarkjs
   */
  private async generateRealProof(
    input: StateTransitionInput,
    startTime: number
  ): Promise<StateTransitionProof> {
    try {
      console.log('[ZK-StateTransition] Computing witness...');
      
      // Generate witness
      const { proof, publicSignals } = await this.snarkjs.groth16.fullProve(
        input,
        CIRCUIT_PATHS.wasm,
        CIRCUIT_PATHS.zkey
      );

      const generationTime = Date.now() - startTime;
      console.log(`[ZK-StateTransition] Proof generated in ${generationTime}ms ✅`);

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
    } catch (error: any) {
      console.error('[ZK-StateTransition] Proof generation failed:', error.message);
      // Fallback to simulation
      console.log('[ZK-StateTransition] Falling back to simulation mode');
      return this.generateSimulatedProof(input, startTime);
    }
  }

  /**
   * Generate a simulated proof (for demos without circuits)
   */
  private generateSimulatedProof(
    input: StateTransitionInput,
    startTime: number
  ): StateTransitionProof {
    const generationTime = Date.now() - startTime + 500; // Add 500ms to simulate real proof time

    return {
      proof: {
        pi_a: ['1', '2'],
        pi_b: [['1', '2'], ['3', '4']],
        pi_c: ['5', '6'],
        protocol: 'groth16',
        curve: 'bn128',
      },
      publicSignals: [
        input.oldStateHash,
        input.newStateHash,
        input.fromLevel,
        input.toLevel,
        input.minScoreRequired,
        input.minPaymentsRequired,
        input.maxDebtRatioAllowed,
        input.minSybilScore,
      ],
      circuitId: 'state_transition',
      proofId: `simulated_${crypto.randomUUID()}`,
      generationTime,
      constraints: this.constraintCount,
      isSimulated: true,
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
    if (this.isSimulation) {
      // In simulation mode, always return true
      console.log('[ZK-StateTransition] Simulation mode: proof verification skipped');
      return true;
    }

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
      isSimulation: this.isSimulation,
      constraints: this.constraintCount,
      paths: this.isSimulation ? null : CIRCUIT_PATHS,
    };
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const zkStateTransitionService = new ZKStateTransitionService();
