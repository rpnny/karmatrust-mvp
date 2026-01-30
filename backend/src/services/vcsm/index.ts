/**
 * VCSM Module Exports
 */

export { vcsmService, VCSMService } from './vcsmService.js';
export {
  createInitialState,
  createTransitionState,
  computeStateHash,
  verifyStateHash,
  formatStateForResponse,
  scoreToLevel,
  generateSalt,
  saltToBigInt,
  initPoseidon,
} from './creditState.js';
export {
  UPGRADE_RULES,
  DOWNGRADE_EVENTS,
  findUpgradeRule,
  findRuleById,
  checkTransitionAllowed,
  getAllUpgradeRules,
  getLevelRequirements,
  calculateDowngradePenalty,
} from './transitionRules.js';
export type { TransitionRule, TransitionResult } from './transitionRules.js';
