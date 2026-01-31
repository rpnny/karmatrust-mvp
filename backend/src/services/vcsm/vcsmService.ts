/**
 * VCSM (Verifiable Credit State Machine) Service
 * 
 * The core service managing credit state transitions.
 * 
 * Architecture:
 * ┌─────────────┐    ┌──────────────┐    ┌─────────────┐
 * │ API Request │ -> │ VCSM Service │ -> │ State Store │
 * └─────────────┘    └──────────────┘    └─────────────┘
 *                          │
 *                          ▼
 *                    ┌──────────────┐
 *                    │ ZK Proof Gen │ (for upgrades)
 *                    └──────────────┘
 * 
 * State Transitions:
 * 1. User requests upgrade
 * 2. Service checks conditions (score, payments, sybil)
 * 3. If allowed, generates ZK proof
 * 4. Creates new state with hash chain link
 * 5. Returns proof for on-chain submission
 * 
 * MVP Simplification:
 * - In-memory state storage (production would use DB)
 * - Simulated ZK proofs (production would compile circuits)
 * - Basic sybil scoring (production would be more sophisticated)
 */

import { CreditState, CreditLevel, LEVEL_NAMES, ZKProof } from '../../types/index.js';
import {
  createInitialState,
  createTransitionState,
  formatStateForResponse,
  verifyStateHash,
  saltToBigInt,
  computeStateHash,
} from './creditState.js';
import {
  findRuleById,
  checkTransitionAllowed,
  getAllUpgradeRules,
  TransitionRule,
} from './transitionRules.js';
import { zkProofService } from '../zkProof.js';
import { zkStateTransitionService } from '../zkStateTransition.js';

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class VCSMService {
  // In-memory state storage (MVP only - production uses DB)
  private states: Map<string, CreditState> = new Map();
  private stateHistory: Map<string, CreditState[]> = new Map();

  constructor() {
    console.log('[VCSM] Service initialized');
  }

  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================

  /**
   * Initialize a new credit state for a user
   * 
   * @param userId - Wallet address
   * @param initialScore - Starting score (default 50, mid-range)
   */
  async initializeState(
    userId: string,
    initialScore: number = 50
  ): Promise<CreditState> {
    // Check if already initialized
    if (this.states.has(userId)) {
      throw new Error('User already has a credit state. Use getState() instead.');
    }

    // Create initial state
    const state = await createInitialState(userId, initialScore);

    // Store state
    this.states.set(userId, state);
    this.stateHistory.set(userId, [state]);

    console.log(`[VCSM] Initialized state for ${userId.slice(0, 10)}: Level ${LEVEL_NAMES[state.level]}`);

    return state;
  }

  /**
   * Get current state for a user
   */
  getState(userId: string): CreditState | null {
    return this.states.get(userId) || null;
  }

  /**
   * Get state history for a user
   */
  getStateHistory(userId: string): CreditState[] {
    return this.stateHistory.get(userId) || [];
  }

  /**
   * Get or create state for a user
   * Convenience method that initializes if not exists
   */
  async getOrCreateState(
    userId: string,
    initialScore: number = 50
  ): Promise<CreditState> {
    const existing = this.states.get(userId);
    if (existing) return existing;

    return this.initializeState(userId, initialScore);
  }

  // ===========================================================================
  // STATE TRANSITIONS
  // ===========================================================================

  /**
   * Execute a state transition (upgrade)
   * 
   * @param userId - Wallet address
   * @param ruleId - The upgrade rule to apply
   * @param newScore - The new credit score
   * @param sybilScore - User's anti-gaming score
   * @param evidence - Supporting evidence for the transition
   */
  async executeTransition(
    userId: string,
    ruleId: string,
    newScore: number,
    sybilScore: number = 50,
    evidence?: {
      eventType: string;
      eventData: Record<string, any>;
    }
  ): Promise<{
    success: boolean;
    fromState: CreditState;
    toState?: CreditState;
    proof?: ZKProof;
    error?: string;
  }> {
    // Get current state
    const currentState = this.states.get(userId);
    if (!currentState) {
      return {
        success: false,
        fromState: null as any,
        error: 'User state not found. Call initializeState first.',
      };
    }

    // Find the rule
    const rule = findRuleById(ruleId);
    if (!rule) {
      return {
        success: false,
        fromState: currentState,
        error: `Rule ${ruleId} not found`,
      };
    }

    // Create a temporary state with new score to check conditions
    const tempState: CreditState = {
      ...currentState,
      score: newScore,
    };

    // Check if transition is allowed
    const check = checkTransitionAllowed(tempState, rule.toLevel, sybilScore);
    if (!check.allowed) {
      return {
        success: false,
        fromState: currentState,
        error: `Transition not allowed: ${check.failedConditions?.join(', ')}`,
      };
    }

    // Create new state first (needed for proof generation)
    const newState = await createTransitionState(currentState, newScore, evidence?.eventData as any);

    // Generate ZK proof for the state transition
    let proof: ZKProof | undefined;
    try {
      const transitionProof = await zkStateTransitionService.generateTransitionProof(
        currentState,
        newState,
        rule.circuitParams,
        sybilScore
      );
      
      // Convert to standard ZKProof format
      proof = {
        pi_a: transitionProof.proof.pi_a,
        pi_b: transitionProof.proof.pi_b,
        pi_c: transitionProof.proof.pi_c,
        protocol: transitionProof.proof.protocol,
        curve: transitionProof.proof.curve,
      } as ZKProof;
      
      console.log(`[VCSM] State transition proof generated: ${transitionProof.isSimulated ? 'SIMULATED' : 'REAL'}`);
      console.log(`[VCSM] Proof generation time: ${transitionProof.generationTime}ms`);
      console.log(`[VCSM] Circuit constraints: ${transitionProof.constraints}`);
    } catch (error) {
      console.warn('[VCSM] State transition proof generation failed, continuing without proof:', error);
    }

    // Update storage
    this.states.set(userId, newState);
    const history = this.stateHistory.get(userId) || [];
    history.push(newState);
    this.stateHistory.set(userId, history);

    console.log(`[VCSM] Transition: ${LEVEL_NAMES[currentState.level]} → ${LEVEL_NAMES[newState.level]}`);

    return {
      success: true,
      fromState: currentState,
      toState: newState,
      proof,
    };
  }

  /**
   * Simulate a transition without executing
   * Useful for UI to show what's needed for upgrade
   */
  async simulateTransition(
    userId: string,
    targetLevel: CreditLevel,
    sybilScore: number = 50
  ): Promise<{
    allowed: boolean;
    currentLevel: CreditLevel;
    targetLevel: CreditLevel;
    rule?: TransitionRule;
    failedConditions?: string[];
    requirements?: {
      minScore: number;
      minPayments: number;
      maxDebtRatio: number;
      minSybilScore: number;
    };
  }> {
    const state = this.states.get(userId);
    if (!state) {
      return {
        allowed: false,
        currentLevel: CreditLevel.UNVERIFIED,
        targetLevel,
        failedConditions: ['User state not found'],
      };
    }

    const check = checkTransitionAllowed(state, targetLevel, sybilScore);

    return {
      allowed: check.allowed,
      currentLevel: state.level,
      targetLevel,
      rule: check.rule,
      failedConditions: check.failedConditions,
      requirements: check.rule ? {
        minScore: check.rule.circuitParams.minScoreRequired,
        minPayments: check.rule.circuitParams.minPaymentsRequired,
        maxDebtRatio: check.rule.circuitParams.maxDebtRatioAllowed,
        minSybilScore: check.rule.circuitParams.minSybilScore,
      } : undefined,
    };
  }

  // ===========================================================================
  // STATE VERIFICATION
  // ===========================================================================

  /**
   * Verify a state's hash is correctly computed
   */
  async verifyState(state: CreditState): Promise<boolean> {
    return verifyStateHash(state);
  }

  /**
   * Verify hash chain integrity for a user
   * Checks that each state correctly links to its previous state
   */
  async verifyHashChain(userId: string): Promise<{
    valid: boolean;
    chainLength: number;
    brokenAt?: number;
  }> {
    const history = this.stateHistory.get(userId);
    if (!history || history.length === 0) {
      return { valid: true, chainLength: 0 };
    }

    // Verify each state's hash
    for (let i = 0; i < history.length; i++) {
      const state = history[i];
      
      // Verify hash is correctly computed
      const hashValid = await verifyStateHash(state);
      if (!hashValid) {
        return { valid: false, chainLength: history.length, brokenAt: i };
      }

      // Verify chain link (except for genesis state)
      if (i > 0) {
        const previousState = history[i - 1];
        if (state.previousHash !== previousState.stateHash) {
          return { valid: false, chainLength: history.length, brokenAt: i };
        }
      }
    }

    return { valid: true, chainLength: history.length };
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Update user attributes (payments, debt, etc.)
   * Does not change level - just updates metadata
   */
  async updateAttributes(
    userId: string,
    updates: Partial<CreditState['attributes']>
  ): Promise<CreditState> {
    const state = this.states.get(userId);
    if (!state) {
      throw new Error('User state not found');
    }

    // Create new state with updated attributes
    const newState = await createTransitionState(state, state.score, updates);
    
    // Keep same level (attribute update doesn't change level)
    newState.level = state.level;

    this.states.set(userId, newState);
    const history = this.stateHistory.get(userId) || [];
    history.push(newState);
    this.stateHistory.set(userId, history);

    return newState;
  }

  /**
   * Get all upgrade rules
   */
  getUpgradeRules(): TransitionRule[] {
    return getAllUpgradeRules();
  }

  /**
   * Get service statistics
   */
  getStats(): {
    totalUsers: number;
    levelDistribution: Record<string, number>;
  } {
    const levelDistribution: Record<string, number> = {};
    
    for (const state of this.states.values()) {
      const levelName = LEVEL_NAMES[state.level];
      levelDistribution[levelName] = (levelDistribution[levelName] || 0) + 1;
    }

    return {
      totalUsers: this.states.size,
      levelDistribution,
    };
  }
}

// Export singleton instance
export const vcsmService = new VCSMService();
