/**
 * VCSM Transition Rules
 * 
 * Defines the rules for credit level transitions.
 * 
 * Upgrade Rules:
 * To upgrade from one tier to the next, user must meet ALL conditions:
 * - Minimum score for target tier
 * - Minimum on-time payments
 * - Maximum debt ratio
 * - Minimum sybil score (anti-gaming)
 * 
 * Why these conditions?
 * 1. Score: Basic creditworthiness
 * 2. Payments: Proven track record
 * 3. Debt Ratio: Not over-leveraged
 * 4. Sybil Score: Prevent fake accounts from upgrading
 * 
 * The SYBIL SCORE in ZK is our KEY INNOVATION:
 * - Anti-gaming logic is enforced IN THE CIRCUIT
 * - Cannot be bypassed by backend manipulation
 * - Even with money, can't buy your way to Diamond
 */

import { CreditLevel, CreditState } from '../../types/index.js';

// =============================================================================
// TYPES
// =============================================================================

export interface TransitionRule {
  id: string;
  name: string;
  fromLevel: CreditLevel | 'ANY';
  toLevel: CreditLevel;
  conditions: {
    minScore: number;
    minOnTimePayments: number;
    maxDebtRatio: number;    // Percentage (0-100)
    minWalletAgeDays?: number;
  };
  // Parameters for ZK circuit verification
  circuitParams: {
    minScoreRequired: number;
    minPaymentsRequired: number;
    maxDebtRatioAllowed: number;
    minSybilScore: number;   // Anti-gaming score threshold
  };
}

export interface TransitionResult {
  allowed: boolean;
  rule?: TransitionRule;
  failedConditions?: string[];
  requiresProof: boolean;
}

// =============================================================================
// UPGRADE RULES
// =============================================================================

/**
 * Upgrade rules for each tier transition
 * 
 * Each tier has progressively stricter requirements:
 * - Higher score threshold
 * - More payment history
 * - Lower debt ratio
 * - Higher sybil score (anti-gaming)
 */
export const UPGRADE_RULES: TransitionRule[] = [
  {
    id: 'UPGRADE_BRONZE_TO_SILVER',
    name: 'Bronze → Silver',
    fromLevel: CreditLevel.BRONZE,
    toLevel: CreditLevel.SILVER,
    conditions: {
      minScore: 40,
      minOnTimePayments: 3,
      maxDebtRatio: 70,
      minWalletAgeDays: 90,
    },
    circuitParams: {
      minScoreRequired: 40,
      minPaymentsRequired: 3,
      maxDebtRatioAllowed: 70,
      minSybilScore: 20,  // Basic sybil protection
    },
  },
  {
    id: 'UPGRADE_SILVER_TO_GOLD',
    name: 'Silver → Gold',
    fromLevel: CreditLevel.SILVER,
    toLevel: CreditLevel.GOLD,
    conditions: {
      minScore: 60,
      minOnTimePayments: 6,
      maxDebtRatio: 50,
      minWalletAgeDays: 180,
    },
    circuitParams: {
      minScoreRequired: 60,
      minPaymentsRequired: 6,
      maxDebtRatioAllowed: 50,
      minSybilScore: 35,  // Moderate sybil protection
    },
  },
  {
    id: 'UPGRADE_GOLD_TO_PLATINUM',
    name: 'Gold → Platinum',
    fromLevel: CreditLevel.GOLD,
    toLevel: CreditLevel.PLATINUM,
    conditions: {
      minScore: 80,
      minOnTimePayments: 12,
      maxDebtRatio: 40,
      minWalletAgeDays: 365,
    },
    circuitParams: {
      minScoreRequired: 80,
      minPaymentsRequired: 12,
      maxDebtRatioAllowed: 40,
      minSybilScore: 50,  // Strong sybil protection
    },
  },
  {
    id: 'UPGRADE_PLATINUM_TO_DIAMOND',
    name: 'Platinum → Diamond',
    fromLevel: CreditLevel.PLATINUM,
    toLevel: CreditLevel.DIAMOND,
    conditions: {
      minScore: 90,
      minOnTimePayments: 24,
      maxDebtRatio: 30,
      minWalletAgeDays: 730, // 2 years
    },
    circuitParams: {
      minScoreRequired: 90,
      minPaymentsRequired: 24,
      maxDebtRatioAllowed: 30,
      minSybilScore: 70,  // Maximum sybil protection
    },
  },
];

// =============================================================================
// DOWNGRADE RULES
// =============================================================================

/**
 * Events that trigger downgrades
 * 
 * These are penalty rules for bad behavior:
 * - Late payments
 * - Defaults
 * - Fraud detection
 */
export const DOWNGRADE_EVENTS = {
  LATE_PAYMENT_30_DAYS: {
    levelDrop: 1,
    description: 'Payment 30+ days late',
  },
  DEFAULT_90_DAYS: {
    levelDrop: 2,
    description: 'Payment 90+ days late (default)',
  },
  FRAUD_DETECTED: {
    levelDrop: 5, // Drop to UNVERIFIED
    description: 'Fraudulent activity detected',
  },
};

// =============================================================================
// RULE EVALUATION
// =============================================================================

/**
 * Find the applicable upgrade rule for a transition
 */
export function findUpgradeRule(
  fromLevel: CreditLevel,
  toLevel: CreditLevel
): TransitionRule | undefined {
  return UPGRADE_RULES.find(
    rule => rule.fromLevel === fromLevel && rule.toLevel === toLevel
  );
}

/**
 * Find a rule by its ID
 */
export function findRuleById(ruleId: string): TransitionRule | undefined {
  return UPGRADE_RULES.find(rule => rule.id === ruleId);
}

/**
 * Check if a transition is allowed based on current state
 * 
 * @param currentState - User's current credit state
 * @param targetLevel - Desired target level
 * @param sybilScore - User's anti-gaming score (from SybilDefenseService)
 * @returns TransitionResult with detailed failure reasons if not allowed
 */
export function checkTransitionAllowed(
  currentState: CreditState,
  targetLevel: CreditLevel,
  sybilScore: number = 50
): TransitionResult {
  // Cannot downgrade via upgrade rules
  if (targetLevel <= currentState.level) {
    return {
      allowed: false,
      failedConditions: ['Cannot upgrade to same or lower level'],
      requiresProof: false,
    };
  }

  // Must upgrade one level at a time
  if (targetLevel !== currentState.level + 1) {
    return {
      allowed: false,
      failedConditions: ['Must upgrade one level at a time'],
      requiresProof: false,
    };
  }

  // Find applicable rule
  const rule = findUpgradeRule(currentState.level, targetLevel);
  if (!rule) {
    return {
      allowed: false,
      failedConditions: ['No upgrade rule found for this transition'],
      requiresProof: false,
    };
  }

  // Check all conditions
  const failedConditions: string[] = [];

  // Score check
  if (currentState.score < rule.conditions.minScore) {
    failedConditions.push(
      `Score ${currentState.score} < required ${rule.conditions.minScore}`
    );
  }

  // Payment history check
  if (currentState.attributes.onTimePayments < rule.conditions.minOnTimePayments) {
    failedConditions.push(
      `Payments ${currentState.attributes.onTimePayments} < required ${rule.conditions.minOnTimePayments}`
    );
  }

  // Debt ratio check
  if (currentState.attributes.debtRatio > rule.conditions.maxDebtRatio) {
    failedConditions.push(
      `Debt ratio ${currentState.attributes.debtRatio}% > max ${rule.conditions.maxDebtRatio}%`
    );
  }

  // Sybil score check (CRITICAL: anti-gaming)
  if (sybilScore < rule.circuitParams.minSybilScore) {
    failedConditions.push(
      `Sybil score ${sybilScore} < required ${rule.circuitParams.minSybilScore} (anti-gaming protection)`
    );
  }

  if (failedConditions.length > 0) {
    return {
      allowed: false,
      rule,
      failedConditions,
      requiresProof: true,
    };
  }

  return {
    allowed: true,
    rule,
    requiresProof: true, // All upgrades require ZK proof
  };
}

/**
 * Calculate sybil score penalty for downgrade
 * 
 * When a user is downgraded, their effective sybil score is also reduced.
 * This makes it harder to quickly recover from a downgrade.
 */
export function calculateDowngradePenalty(
  event: keyof typeof DOWNGRADE_EVENTS,
  currentLevel: CreditLevel
): {
  newLevel: CreditLevel;
  sybilPenalty: number;
} {
  const downgrade = DOWNGRADE_EVENTS[event];
  const newLevel = Math.max(
    CreditLevel.UNVERIFIED,
    currentLevel - downgrade.levelDrop
  ) as CreditLevel;

  // Sybil penalty is proportional to severity
  const sybilPenalty = downgrade.levelDrop * 10;

  return { newLevel, sybilPenalty };
}

/**
 * Get all upgrade rules for display
 */
export function getAllUpgradeRules(): TransitionRule[] {
  return UPGRADE_RULES;
}

/**
 * Get requirements for a specific level
 */
export function getLevelRequirements(level: CreditLevel): TransitionRule | undefined {
  // Find the rule where toLevel matches
  return UPGRADE_RULES.find(rule => rule.toLevel === level);
}
