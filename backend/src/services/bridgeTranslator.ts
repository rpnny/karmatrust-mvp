/**
 * Bridge Translator Service
 * 
 * Translates credit data between TradFi and DeFi formats.
 * This is the core of KarmaTrust's bridge positioning.
 * 
 * Key Concept:
 * - TradFi speaks FICO (300-850)
 * - DeFi speaks Tiers (Bronze/Silver/Gold)
 * - This service is the translator
 */

import { 
  CreditScore, 
  CreditLevel, 
  TradFiReport, 
  DeFiReport,
  scoreToFICO,
  ficoToScore,
  LEVEL_NAMES 
} from '../types/index.js';

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Collateral ratio mapping
 * Higher credit = lower collateral required
 */
const COLLATERAL_RATIOS: Record<CreditLevel, number> = {
  [CreditLevel.UNVERIFIED]: 2.00,  // 200%
  [CreditLevel.BRONZE]: 1.50,      // 150%
  [CreditLevel.SILVER]: 1.40,      // 140%
  [CreditLevel.GOLD]: 1.25,        // 125%
  [CreditLevel.PLATINUM]: 1.15,    // 115%
  [CreditLevel.DIAMOND]: 1.10,     // 110%
};

/**
 * Bond-style risk rating mapping
 * Maps FICO scores to traditional credit ratings
 */
function ficoToRiskRating(ficoScore: number): 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC' {
  if (ficoScore >= 800) return 'AAA';
  if (ficoScore >= 740) return 'AA';
  if (ficoScore >= 670) return 'A';
  if (ficoScore >= 580) return 'BBB';
  if (ficoScore >= 500) return 'BB';
  if (ficoScore >= 400) return 'B';
  return 'CCC';
}

/**
 * Payment history descriptor
 */
function scoreToPaymentHistory(score: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}

// =============================================================================
// BRIDGE TRANSLATOR CLASS
// =============================================================================

export class BridgeTranslator {
  /**
   * Translate to Traditional Finance Format
   * 
   * Takes blockchain-native credit score and converts to
   * familiar banking format (FICO, bond ratings, etc.)
   */
  public translateToTradFi(creditScore: CreditScore): TradFiReport {
    const ficoScore = scoreToFICO(creditScore.score);
    const riskRating = ficoToRiskRating(ficoScore);
    const paymentHistory = scoreToPaymentHistory(creditScore.score);

    // Calculate TradFi-style metrics from on-chain factors
    const creditUtilization = Math.round((1 - creditScore.factors.stability) * 100);
    const accountAge = Math.round(creditScore.factors.wallet_age * 24); // Convert to months (max 2 years)
    
    // Simulated negative marks based on risk
    const derogatoriesCount = creditScore.risk === 'High' ? 2 : creditScore.risk === 'Medium' ? 1 : 0;
    const inquiriesLast12Months = Math.floor(Math.random() * 3); // Simulated
    const publicRecords = creditScore.risk === 'High' ? 1 : 0;

    return {
      format: 'traditional',
      ficoScore,
      riskRating,
      creditUtilization,
      accountAge,
      paymentHistory,
      derogatoriesCount,
      inquiriesLast12Months,
      publicRecords,
      reportDate: new Date().toISOString(),
      reportId: `TR-${Date.now()}-${creditScore.wallet.slice(2, 8)}`.toUpperCase(),
    };
  }

  /**
   * Translate to DeFi Format
   * 
   * Takes credit score and converts to DeFi-native format
   * (tiers, collateral ratios, on-chain commitments)
   */
  public translateToDeFi(creditScore: CreditScore): DeFiReport {
    const tier = creditScore.level;
    const tierName = LEVEL_NAMES[tier];
    const collateralRatio = COLLATERAL_RATIOS[tier];

    return {
      format: 'decentralized',
      tier,
      tierName,
      collateralRatio,
      zkProofHash: creditScore.meta?.zkProofHash,
      stateCommitment: creditScore.meta?.stateCommitment,
      attestationId: creditScore.meta?.attestationId,
      contractAddress: process.env.VCSM_CONTRACT_ADDRESS,
      onChainVerifiable: true,
      lastUpdate: creditScore.timestamp,
      networkId: 11155111, // Sepolia
    };
  }

  /**
   * Bidirectional Translation
   * 
   * Returns both formats for comparison and bridge demo
   */
  public translateBoth(creditScore: CreditScore): {
    tradfi: TradFiReport;
    defi: DeFiReport;
    bridge: {
      internalScore: number;
      ficoEquivalent: number;
      tierEquivalent: string;
      collateralSavings: string;
    };
  } {
    const tradfi = this.translateToTradFi(creditScore);
    const defi = this.translateToDeFi(creditScore);

    // Calculate savings vs standard collateral
    const standardCollateral = 1.50; // 150% baseline
    const optimizedCollateral = defi.collateralRatio;
    const savingsPercent = ((standardCollateral - optimizedCollateral) / standardCollateral * 100).toFixed(1);

    return {
      tradfi,
      defi,
      bridge: {
        internalScore: creditScore.score,
        ficoEquivalent: tradfi.ficoScore,
        tierEquivalent: defi.tierName,
        collateralSavings: `${savingsPercent}%`,
      },
    };
  }

  /**
   * FICO to Tier Conversion
   * 
   * For traditional banks wanting to understand DeFi tiers
   */
  public ficoToTier(ficoScore: number): { 
    tier: CreditLevel; 
    tierName: string; 
    collateralRatio: number; 
  } {
    const internalScore = ficoToScore(ficoScore);
    let tier: CreditLevel;

    if (internalScore < 40) tier = CreditLevel.BRONZE;
    else if (internalScore < 60) tier = CreditLevel.SILVER;
    else if (internalScore < 80) tier = CreditLevel.GOLD;
    else if (internalScore < 90) tier = CreditLevel.PLATINUM;
    else tier = CreditLevel.DIAMOND;

    return {
      tier,
      tierName: LEVEL_NAMES[tier],
      collateralRatio: COLLATERAL_RATIOS[tier],
    };
  }

  /**
   * Tier to FICO Conversion
   * 
   * For DeFi protocols wanting to communicate with TradFi
   */
  public tierToFico(tier: CreditLevel): { 
    ficoMin: number; 
    ficoMax: number; 
    ficoMid: number; 
  } {
    const ranges: Record<CreditLevel, { min: number; max: number }> = {
      [CreditLevel.UNVERIFIED]: { min: 300, max: 300 },
      [CreditLevel.BRONZE]: { min: 300, max: 520 },
      [CreditLevel.SILVER]: { min: 520, max: 630 },
      [CreditLevel.GOLD]: { min: 630, max: 740 },
      [CreditLevel.PLATINUM]: { min: 740, max: 795 },
      [CreditLevel.DIAMOND]: { min: 795, max: 850 },
    };

    const range = ranges[tier];
    return {
      ficoMin: range.min,
      ficoMax: range.max,
      ficoMid: Math.round((range.min + range.max) / 2),
    };
  }

  /**
   * Generate comparison summary
   * 
   * Useful for educational purposes and bridge demo
   */
  public generateComparisonSummary(creditScore: CreditScore): {
    wallet: string;
    tradfiView: string;
    defiView: string;
    bridgeExplanation: string;
  } {
    const tradfi = this.translateToTradFi(creditScore);
    const defi = this.translateToDeFi(creditScore);

    return {
      wallet: creditScore.wallet,
      tradfiView: `FICO ${tradfi.ficoScore} (${tradfi.riskRating}) - ${tradfi.paymentHistory} payment history`,
      defiView: `${defi.tierName} Tier - ${(defi.collateralRatio * 100)}% collateral ratio`,
      bridgeExplanation: `DAISY translates this wallet's on-chain activity into both formats. ` +
        `Traditional banks see familiar FICO ${tradfi.ficoScore}. ` +
        `DeFi protocols see ${defi.tierName} tier requiring ${(defi.collateralRatio * 100)}% collateral. ` +
        `Same data, two languages.`,
    };
  }
}

// Export singleton instance
export const bridgeTranslator = new BridgeTranslator();
