/**
 * Credit Scoring Service (MVP - 8 Factors)
 * 
 * Calculates credit scores based on on-chain wallet activity.
 * 
 * Algorithm Overview:
 * ------------------
 * score = BASE_SCORE(50) + positive_factors - negative_penalties
 * Range: [0, 100]
 * 
 * Design Philosophy:
 * -----------------
 * 1. Time-based factors are most important (can't be faked)
 * 2. Activity indicates genuine usage (not just holding)
 * 3. Diversity shows DeFi experience (not single-protocol user)
 * 4. Penalties are harsh for risky behavior (scam = -25)
 * 
 * Why These Weights?
 * -----------------
 * - WALLET_AGE (15): Time is the most trustworthy signal
 *   Reference: FICO's "length of credit history" is 15% of score
 *   
 * - TX_FREQUENCY (10): Active users are more reliable
 *   Threshold: 200+ tx for max score (filters bots that do few tx)
 *   
 * - PROTOCOL_DIVERSITY (8): DeFi veterans know risks
 *   Threshold: 15+ protocols for max (Uniswap, Aave, etc.)
 *   
 * - ASSET_VALUE (10): Financial capacity matters
 *   Threshold: 50 ETH for max (meaningful amount)
 *   
 * - SCAM_CONNECTION (-25): Zero tolerance for fraud
 *   One interaction = major penalty (2+ tier drop)
 *   
 * MVP Note:
 * --------
 * These weights are hand-tuned for demonstration.
 * Production version will use ML optimization with real default data.
 */

import { 
  CreditScore, 
  CreditLevel, 
  RiskLevel, 
  ScoreFactors, 
  WalletAnalysis,
  LEVEL_NAMES,
  scoreToLevel,
  scoreToRisk 
} from '../types/index.js';
import { blockchainDataService } from './blockchainData.js';

// =============================================================================
// WEIGHT CONFIGURATION
// =============================================================================

/**
 * Scoring weights configuration
 * 
 * Each weight is carefully chosen based on:
 * 1. Traditional credit scoring principles (FICO model)
 * 2. On-chain behavior patterns
 * 3. Anti-gaming considerations
 * 
 * Total possible positive: +50 (from base 50 to max 100)
 * Total possible negative: -50 (from base 50 to min 0)
 */
const WEIGHTS = {
  // Base score (starting point for all users)
  BASE_SCORE: 50,

  // ==========================================================================
  // POSITIVE FACTORS (max +50 total)
  // ==========================================================================

  /**
   * Wallet Age: +15 max
   * 
   * Why most important?
   * - Time cannot be faked or bought
   * - Older wallets have more history to verify
   * - Sybil attackers typically use new wallets
   * 
   * Calculation: min(ageInYears * 15, 15)
   * - 1 year old = +15 (max)
   * - 6 months old = +7.5
   * - Brand new = +0
   */
  WALLET_AGE: 15,

  /**
   * Transaction Frequency: +10 max
   * 
   * Why important?
   * - Active usage indicates genuine user
   * - Bots often have few transactions
   * - Regular activity shows commitment
   * 
   * Calculation: min(txCount/200 * 10, 10)
   * - 200+ tx = +10 (max)
   * - 100 tx = +5
   * - 0 tx = +0
   */
  TX_FREQUENCY: 10,

  /**
   * Protocol Diversity: +8 max
   * 
   * Why important?
   * - DeFi veterans use multiple protocols
   * - Diversification shows experience
   * - Single-protocol users may be bots
   * 
   * Calculation: min(protocols/15 * 8, 8)
   * - 15+ protocols = +8 (max)
   * - 7 protocols = +4
   */
  PROTOCOL_DIVERSITY: 8,

  /**
   * Asset Value: +10 max
   * 
   * Why important?
   * - Financial capacity for repayment
   * - Skin in the game
   * - Not the only factor (avoid plutocracy)
   * 
   * Calculation: min(valueETH/50 * 10, 10)
   * - 50+ ETH = +10 (max)
   * - 25 ETH = +5
   */
  ASSET_VALUE: 10,

  /**
   * Active Usage Bonus: +7 max
   * 
   * Why important?
   * - Recent activity shows engaged user
   * - Dormant accounts may be abandoned
   * 
   * Calculation: +7 if active in last 30 days
   */
  ACTIVE_USAGE: 7,

  // ==========================================================================
  // NEGATIVE FACTORS (max -50 total)
  // ==========================================================================

  /**
   * High Volatility Penalty: -8 max
   * 
   * Why penalize?
   * - Erratic behavior indicates risk
   * - Stable patterns are more predictable
   * 
   * Calculation: volatility * 8 (volatility is 0-1)
   */
  VOLATILITY_PENALTY: 8,

  /**
   * Scam Connection Penalty: -25
   * 
   * Why so harsh?
   * - Zero tolerance for fraud
   * - One interaction raises red flags
   * - Better safe than sorry
   * 
   * Note: MVP uses simplified detection
   * Production would use external blacklist APIs
   */
  SCAM_PENALTY: 25,

  /**
   * Mixer Usage Penalty: -10
   * 
   * Why penalize?
   * - Privacy is valid, but raises compliance concerns
   * - Banks may require this check
   * 
   * Note: Controversial - could be reconsidered
   */
  MIXER_PENALTY: 10,

  /**
   * Inactivity Penalty: -7
   * 
   * Why penalize?
   * - 90+ days inactive = stale account
   * - May indicate abandoned wallet
   * - Recent activity is preferred
   */
  INACTIVITY_PENALTY: 7,
};

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class CreditScoringService {
  /**
   * Calculate credit score for a wallet address
   * 
   * Process:
   * 1. Fetch on-chain data (with fallback)
   * 2. Compute base score + factors
   * 3. Apply positive adjustments
   * 4. Apply negative penalties
   * 5. Derive level and risk
   * 
   * @param wallet - Ethereum address
   * @returns Complete credit score with factors breakdown
   */
  async calculateScore(wallet: string): Promise<CreditScore & { dataSource: string; trustLevel: number; cached?: boolean }> {
    // Fetch wallet data (with three-layer fallback and caching)
    const analysisData = await blockchainDataService.fetchWalletData(wallet);
    const { dataSource, trustLevel, cached, ...analysis } = analysisData;

    // Calculate score and factors
    const { score, factors } = this.computeScore(analysis);

    // Derive level and risk
    const level = scoreToLevel(score);
    const risk = scoreToRisk(score);

    return {
      score,
      level,
      levelName: LEVEL_NAMES[level],
      risk,
      factors,
      wallet,
      timestamp: Date.now(),
      dataSource,
      trustLevel,
      cached, // Include cache status in response
      meta: {
        dataSource,
        version: '0.1.0-mvp',
        cached: cached ? 'hit' : 'miss',
      },
    };
  }

  /**
   * Compute score from wallet analysis
   * 
   * Returns both the final score and factor breakdown for UI
   */
  private computeScore(analysis: WalletAnalysis): { score: number; factors: ScoreFactors } {
    // Start with base score
    let score = WEIGHTS.BASE_SCORE;

    // Calculate individual factor contributions
    const now = Date.now();

    // ==========================================================================
    // POSITIVE FACTORS
    // ==========================================================================

    // 1. Wallet Age (0-1 normalized, max +15)
    const walletAgeDays = (now - analysis.firstTransaction) / (1000 * 60 * 60 * 24);
    const walletAgeYears = walletAgeDays / 365;
    const ageScore = Math.min(walletAgeYears * WEIGHTS.WALLET_AGE, WEIGHTS.WALLET_AGE);
    score += ageScore;

    // 2. Transaction Frequency (0-1 normalized, max +10)
    const txScore = Math.min(
      (analysis.transactionCount / 200) * WEIGHTS.TX_FREQUENCY, 
      WEIGHTS.TX_FREQUENCY
    );
    score += txScore;

    // 3. Protocol Diversity (0-1 normalized, max +8)
    const diversityScore = Math.min(
      (analysis.uniqueProtocols / 15) * WEIGHTS.PROTOCOL_DIVERSITY,
      WEIGHTS.PROTOCOL_DIVERSITY
    );
    score += diversityScore;

    // 4. Asset Value (0-1 normalized, max +10)
    const valueScore = Math.min(
      (analysis.totalValue / 50) * WEIGHTS.ASSET_VALUE,
      WEIGHTS.ASSET_VALUE
    );
    score += valueScore;

    // 5. Active Usage Bonus (+7 if active in last 30 days)
    const daysSinceLastTx = (now - analysis.lastTransaction) / (1000 * 60 * 60 * 24);
    const isActive = daysSinceLastTx <= 30;
    if (isActive) {
      score += WEIGHTS.ACTIVE_USAGE;
    }

    // ==========================================================================
    // NEGATIVE FACTORS
    // ==========================================================================

    // 6. Volatility Penalty (up to -8)
    const volatilityPenalty = analysis.volatility * WEIGHTS.VOLATILITY_PENALTY;
    score -= volatilityPenalty;

    // 7. Scam Connection (-25)
    if (analysis.scamConnections) {
      score -= WEIGHTS.SCAM_PENALTY;
    }

    // 8. Mixer Usage (-10)
    if (analysis.mixerUsage) {
      score -= WEIGHTS.MIXER_PENALTY;
    }

    // 9. Inactivity Penalty (-7 if 90+ days inactive)
    if (daysSinceLastTx > 90) {
      score -= WEIGHTS.INACTIVITY_PENALTY;
    }

    // ==========================================================================
    // CLAMP AND NORMALIZE
    // ==========================================================================

    // Ensure score is within [0, 100]
    score = Math.max(0, Math.min(100, Math.round(score)));

    // Calculate normalized factors (0-1) for UI display
    // NOTE: These must match the max thresholds used in scoring algorithm (WEIGHTS)
    const factors: ScoreFactors = {
      wallet_age: Math.min(walletAgeDays / 365, 1),           // Max at 1 year (matches WEIGHTS.WALLET_AGE)
      transaction_frequency: Math.min(analysis.transactionCount / 200, 1), // Max at 200 tx (matches WEIGHTS.TX_FREQUENCY)
      protocol_diversity: Math.min(analysis.uniqueProtocols / 15, 1),      // Max at 15 protocols (matches WEIGHTS.PROTOCOL_DIVERSITY)
      asset_value: Math.min(analysis.totalValue / 50, 1),     // Max at 50 ETH (matches WEIGHTS.ASSET_VALUE)
      volatility: analysis.volatility,                        // Already 0-1
      stability: isActive ? 1 : Math.max(0, 1 - (daysSinceLastTx - 30) / 180),
    };

    return { score, factors };
  }

  /**
   * Get scoring weights (for transparency/debugging)
   */
  getWeights(): typeof WEIGHTS {
    return { ...WEIGHTS };
  }

  /**
   * Explain score breakdown (for UI tooltip/explainability)
   * 
   * Returns human-readable explanation of each factor's contribution
   */
  explainScore(analysis: WalletAnalysis): Array<{
    factor: string;
    contribution: number;
    explanation: string;
  }> {
    const now = Date.now();
    const explanations = [];

    // Wallet Age
    const walletAgeDays = Math.floor((now - analysis.firstTransaction) / (1000 * 60 * 60 * 24));
    const ageContribution = Math.min((walletAgeDays / 365) * WEIGHTS.WALLET_AGE, WEIGHTS.WALLET_AGE);
    explanations.push({
      factor: 'Wallet Age',
      contribution: Math.round(ageContribution * 10) / 10,
      explanation: `Account is ${walletAgeDays} days old. ${walletAgeDays >= 365 ? 'Full bonus for 1+ year history.' : 'Builds trust over time.'}`,
    });

    // Transaction Frequency
    const txContribution = Math.min((analysis.transactionCount / 200) * WEIGHTS.TX_FREQUENCY, WEIGHTS.TX_FREQUENCY);
    explanations.push({
      factor: 'Transaction Frequency',
      contribution: Math.round(txContribution * 10) / 10,
      explanation: `${analysis.transactionCount} transactions. ${analysis.transactionCount >= 200 ? 'Active user with full bonus.' : 'More activity improves score.'}`,
    });

    // Protocol Diversity
    const diversityContribution = Math.min((analysis.uniqueProtocols / 15) * WEIGHTS.PROTOCOL_DIVERSITY, WEIGHTS.PROTOCOL_DIVERSITY);
    explanations.push({
      factor: 'Protocol Diversity',
      contribution: Math.round(diversityContribution * 10) / 10,
      explanation: `Interacted with ${analysis.uniqueProtocols} protocols. ${analysis.uniqueProtocols >= 15 ? 'DeFi veteran!' : 'Try more protocols.'}`,
    });

    // Asset Value
    const valueContribution = Math.min((analysis.totalValue / 50) * WEIGHTS.ASSET_VALUE, WEIGHTS.ASSET_VALUE);
    explanations.push({
      factor: 'Asset Value',
      contribution: Math.round(valueContribution * 10) / 10,
      explanation: `${analysis.totalValue.toFixed(2)} ETH in wallet. Shows financial capacity.`,
    });

    // Volatility (penalty)
    const volatilityPenalty = analysis.volatility * WEIGHTS.VOLATILITY_PENALTY;
    if (volatilityPenalty > 0) {
      explanations.push({
        factor: 'Volatility',
        contribution: -Math.round(volatilityPenalty * 10) / 10,
        explanation: `${(analysis.volatility * 100).toFixed(0)}% volatility. Stable behavior is preferred.`,
      });
    }

    // Scam Connection
    if (analysis.scamConnections) {
      explanations.push({
        factor: 'Scam Connection',
        contribution: -WEIGHTS.SCAM_PENALTY,
        explanation: 'Interacted with known scam address. Major red flag.',
      });
    }

    return explanations;
  }
}

// Export singleton instance
export const creditScoringService = new CreditScoringService();
