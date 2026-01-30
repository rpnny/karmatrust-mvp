/**
 * Core Type Definitions for KarmaTrust
 * 
 * This file defines all shared types used across the backend.
 * 
 * Type Design Philosophy:
 * 1. Strong typing for all domain concepts
 * 2. Enums for finite value sets (levels, risks)
 * 3. Interfaces for structured data
 * 4. Helper functions for type conversions
 */

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Risk Level
 * 
 * Maps to traditional credit risk assessment:
 * - Low: Excellent credit, minimal risk
 * - Medium: Good credit, some risk
 * - High: Poor credit, high risk
 */
export type RiskLevel = 'Low' | 'Medium' | 'High';

/**
 * Credit Level (VCSM States)
 * 
 * Five-tier system inspired by credit card tiers:
 * - UNVERIFIED (0): Not yet assessed
 * - BRONZE (1): Score 0-39
 * - SILVER (2): Score 40-59
 * - GOLD (3): Score 60-79
 * - PLATINUM (4): Score 80-89
 * - DIAMOND (5): Score 90-100
 * 
 * Why these names?
 * - Familiar to users (credit card tiers)
 * - Clear progression (Bronze → Diamond)
 * - Works well for UI display
 */
export enum CreditLevel {
  UNVERIFIED = 0,
  BRONZE = 1,
  SILVER = 2,
  GOLD = 3,
  PLATINUM = 4,
  DIAMOND = 5,
}

/**
 * Level name mapping for display
 */
export const LEVEL_NAMES: Record<CreditLevel, string> = {
  [CreditLevel.UNVERIFIED]: 'Unverified',
  [CreditLevel.BRONZE]: 'Bronze',
  [CreditLevel.SILVER]: 'Silver',
  [CreditLevel.GOLD]: 'Gold',
  [CreditLevel.PLATINUM]: 'Platinum',
  [CreditLevel.DIAMOND]: 'Diamond',
};

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Score Factors
 * 
 * Normalized factors (0-1) used for scoring and display.
 * Each factor contributes to the final credit score.
 */
export interface ScoreFactors {
  wallet_age: number;           // 0-1: Account age (max at 2 years)
  transaction_frequency: number; // 0-1: TX count (max at 500)
  protocol_diversity: number;   // 0-1: Protocols used (max at 20)
  asset_value: number;          // 0-1: ETH value (max at 100)
  volatility: number;           // 0-1: Behavioral volatility (lower is better)
  stability: number;            // 0-1: Recent activity pattern
}

/**
 * Credit Score
 * 
 * Complete credit assessment result.
 */
export interface CreditScore {
  score: number;                // Internal score: 0-100
  level: CreditLevel;           // Tier: 0-5
  levelName: string;            // Display name: "Gold"
  risk: RiskLevel;              // Risk assessment
  factors: ScoreFactors;        // Factor breakdown
  wallet: string;               // Ethereum address
  timestamp: number;            // Assessment time
  dataSource?: string;          // Where data came from
  trustLevel?: number;          // Data source trust (0-100)
  meta?: {
    dataSource: string;
    version: string;
  };
}

/**
 * Wallet Analysis
 * 
 * Raw on-chain data fetched from blockchain.
 * Used as input for credit scoring.
 */
export interface WalletAnalysis {
  transactionCount: number;
  uniqueProtocols: number;
  totalValue: number;           // ETH balance
  volatility: number;           // 0-1 calculated
  firstTransaction: number;     // Unix timestamp
  lastTransaction: number;      // Unix timestamp
  highRiskInteractions: number;
  scamConnections: boolean;
  mixerUsage: boolean;
}

/**
 * VCSM Credit State
 * 
 * Verifiable Credit State Machine state.
 * Represents a user's credit state at a point in time.
 */
export interface CreditState {
  stateId: string;              // UUID
  userId: string;               // Wallet address
  level: CreditLevel;           // Current tier
  score: number;                // Internal score (private)
  stateHash: string;            // Poseidon(score, level, salt)
  previousHash: string;         // Chain link
  salt: string;                 // Random salt for hash
  version: number;              // Replay protection
  timestamp: number;            // State creation time
  attributes: {
    onTimePayments: number;
    defaultCount: number;
    debtRatio: number;
    kycVerified: boolean;
  };
}

/**
 * EAS Attestation Result
 * 
 * Result from creating an EAS attestation.
 */
export interface AttestationResult {
  attestationId: string;        // bytes32 UID
  explorerUrl: string;          // EASScan URL
  schemaId: string;             // Schema UID
  recipient: string;            // Attested wallet
  txHash?: string;              // Transaction hash (if real)
  blockNumber?: number;         // Block number (if real)
  isSimulated?: boolean;        // Whether this is a simulation
}

/**
 * ZK Proof
 * 
 * Zero-knowledge proof structure (Groth16).
 */
export interface ZKProof {
  pi_a: string[];               // G1 point
  pi_b: string[][];             // G2 point
  pi_c: string[];               // G1 point
  publicSignals: string[];      // Public inputs
  protocol?: string;            // "groth16"
  curve?: string;               // "bn128"
}

/**
 * API Response Wrapper
 * 
 * Standard response format for all API endpoints.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    timestamp: number;
    version?: string;
    processingTimeMs?: number;
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Convert internal score (0-100) to credit level
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
 * Convert internal score (0-100) to risk level
 */
export function scoreToRisk(score: number): RiskLevel {
  if (score >= 70) return 'Low';
  if (score >= 50) return 'Medium';
  return 'High';
}

/**
 * Convert internal score (0-100) to FICO-style display (300-850)
 * 
 * Why FICO display?
 * - Banks understand 300-850 range
 * - Users familiar with FICO from traditional credit
 * - Makes demo more relatable
 * 
 * Formula: FICO = 300 + (internal_score * 5.5)
 * - Internal 0 → FICO 300 (worst)
 * - Internal 50 → FICO 575 (average)
 * - Internal 100 → FICO 850 (best)
 */
export function scoreToFICO(internalScore: number): number {
  const fico = 300 + (internalScore * 5.5);
  return Math.round(Math.max(300, Math.min(850, fico)));
}

/**
 * Convert FICO score back to internal (for thresholds)
 */
export function ficoToScore(ficoScore: number): number {
  const internal = (ficoScore - 300) / 5.5;
  return Math.round(Math.max(0, Math.min(100, internal)));
}

/**
 * Get level thresholds for upgrade requirements
 */
export function getLevelThresholds(level: CreditLevel): {
  minScore: number;
  minPayments: number;
  maxDebtRatio: number;
  minSybilScore: number;
} {
  const thresholds: Record<CreditLevel, {
    minScore: number;
    minPayments: number;
    maxDebtRatio: number;
    minSybilScore: number;
  }> = {
    [CreditLevel.UNVERIFIED]: { minScore: 0, minPayments: 0, maxDebtRatio: 100, minSybilScore: 0 },
    [CreditLevel.BRONZE]: { minScore: 0, minPayments: 0, maxDebtRatio: 100, minSybilScore: 0 },
    [CreditLevel.SILVER]: { minScore: 40, minPayments: 3, maxDebtRatio: 70, minSybilScore: 20 },
    [CreditLevel.GOLD]: { minScore: 60, minPayments: 6, maxDebtRatio: 50, minSybilScore: 35 },
    [CreditLevel.PLATINUM]: { minScore: 80, minPayments: 12, maxDebtRatio: 40, minSybilScore: 50 },
    [CreditLevel.DIAMOND]: { minScore: 90, minPayments: 24, maxDebtRatio: 30, minSybilScore: 70 },
  };

  return thresholds[level];
}
