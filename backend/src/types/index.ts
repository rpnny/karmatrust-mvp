/**
 * KarmaTrust Core Type Definitions
 * 
 * This file contains all shared types used across the backend.
 * 
 * Design Decision: Internal Score (0-100) as Single Source of Truth
 * - All business logic uses internal score
 * - FICO (300-850) is only for frontend display
 * - This avoids confusion between two score systems
 */

// =============================================================================
// CREDIT SCORING
// =============================================================================

/**
 * Risk Level
 * 
 * Aligned with credit levels:
 * - Low: Diamond (90-100) & Platinum (80-89)
 * - Medium: Gold (60-79)
 * - High: Silver (40-59) & Bronze (0-39)
 */
export type RiskLevel = 'Low' | 'Medium' | 'High';

/**
 * Credit Level Enum
 * 
 * Score boundaries (internal score 0-100):
 * - Bronze: 0-39 (beginners, high risk)
 * - Silver: 40-59 (average users)
 * - Gold: 60-79 (good standing)
 * - Platinum: 80-89 (excellent)
 * - Diamond: 90-100 (top tier)
 * 
 * Why these thresholds?
 * - Each level spans ~20 points for clear differentiation
 * - Top 2 tiers (80+) get "Low" risk for premium benefits
 * - Mirrors traditional credit tier systems
 */
export enum CreditLevel {
  BRONZE = 1,
  SILVER = 2,
  GOLD = 3,
  PLATINUM = 4,
  DIAMOND = 5,
}

/**
 * Score Factor Breakdown
 * 
 * Each factor is normalized to 0-1 range for visualization.
 * These are derived from wallet analysis data.
 */
export interface ScoreFactors {
  wallet_age: number;            // Time since first transaction
  transaction_frequency: number;  // Activity level
  protocol_diversity: number;     // Number of protocols used
  asset_value: number;           // Total asset value in ETH
  volatility: number;            // Asset price fluctuation
  stability: number;             // Account activity consistency
}

/**
 * Credit Score Result
 * 
 * The main output of the credit scoring service.
 * 
 * Note: `score` is the internal score (0-100).
 * Frontend can convert to FICO using: 300 + (score * 5.5)
 */
export interface CreditScore {
  score: number;          // Internal score 0-100 (core value)
  level: CreditLevel;     // Derived from score
  levelName: string;      // Human-readable level name
  risk: RiskLevel;        // Derived from score
  factors: ScoreFactors;  // Factor breakdown for UI
  wallet: string;         // Ethereum address
  timestamp: number;      // Unix timestamp (ms)
  meta?: {
    dataSource: string;   // 'etherscan' | 'rpc' | 'deterministic'
    version: string;      // Algorithm version
  };
}

// =============================================================================
// WALLET ANALYSIS
// =============================================================================

/**
 * Wallet Analysis Data
 * 
 * Raw data fetched from blockchain, used as input for scoring.
 * This is the intermediate data before score calculation.
 */
export interface WalletAnalysis {
  // Basic metrics
  transactionCount: number;      // Total transactions
  uniqueProtocols: number;       // Distinct protocols interacted
  totalValue: number;            // Total asset value (ETH)
  
  // Time-based
  firstTransaction: number;      // Timestamp of first tx
  lastTransaction: number;       // Timestamp of last tx
  
  // Risk indicators
  volatility: number;            // 0-1 (higher = more volatile)
  highRiskInteractions: number;  // Count of risky protocol uses
  scamConnections: boolean;      // Has interacted with known scams
  mixerUsage: boolean;           // Has used mixing services
}

// =============================================================================
// VCSM (Verifiable Credit State Machine)
// =============================================================================

/**
 * Credit State
 * 
 * The core state structure of VCSM.
 * 
 * Key concepts:
 * - stateHash: Poseidon(score, level, salt) - cryptographic commitment
 * - previousHash: Links to parent state (chain structure)
 * - version: Monotonically increasing (prevents replay)
 * - sybilScore: Anti-gaming metric (enforced in ZK circuit)
 */
export interface CreditState {
  // Identifiers
  stateId: string;               // Unique state ID (UUID)
  userId: string;                // User wallet address
  
  // Credit data
  score: number;                 // Internal score 0-100 (private)
  level: CreditLevel;            // Credit level (public)
  
  // Cryptographic commitments
  stateHash: string;             // Poseidon(score, level, salt)
  previousHash: string;          // Link to previous state
  salt: string;                  // Random salt for privacy
  
  // Versioning
  version: number;               // State version (monotonic)
  timestamp: number;             // Last update time
  
  // Anti-sybil
  sybilScore: number;            // 0-100, used in ZK constraints
}

/**
 * State Transition Rule
 * 
 * Defines conditions for upgrading credit levels.
 * 
 * Key innovation: circuitParams are enforced IN the ZK circuit,
 * meaning they cannot be bypassed by modifying client code.
 */
export interface TransitionRule {
  id: string;                    // Rule identifier
  name: string;                  // Human-readable name
  fromLevel: CreditLevel | 'ANY';
  toLevel: CreditLevel;
  
  // Conditions (checked in backend)
  conditions: {
    minScore?: number;           // Minimum score required
    minOnTimePayments?: number;  // Payment history (future)
    maxDebtRatio?: number;       // Debt ratio (future)
  };
  
  // ZK circuit parameters (enforced cryptographically!)
  circuitParams?: {
    minScoreRequired: number;    // Enforced in circuit
    minPaymentsRequired: number; // Enforced in circuit
    maxDebtRatioAllowed: number; // Enforced in circuit
    minSybilScore: number;       // ANTI-SYBIL: Enforced in circuit!
  };
}

/**
 * State Transition Result
 */
export interface TransitionResult {
  fromLevel: string;
  toLevel: string;
  proof: ZKProof | SimulatedProof;
  newState: CreditState;
}

// =============================================================================
// ZK PROOFS
// =============================================================================

/**
 * ZK Proof Structure (Groth16)
 * 
 * Generated by snarkjs, verified on-chain or off-chain.
 */
export interface ZKProof {
  proof: {
    pi_a: string[];              // First proof element
    pi_b: string[][];            // Second proof element (2D)
    pi_c: string[];              // Third proof element
  };
  publicSignals: string[];       // Public inputs to circuit
  circuitId: string;             // Which circuit generated this
  proofId: string;               // Unique proof identifier
}

/**
 * Simulated Proof (for demo when circuit not compiled)
 */
export interface SimulatedProof {
  simulated: true;
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  publicSignals: string[];
}

/**
 * Proof Verification Result
 */
export interface VerificationResult {
  valid: boolean;
  verifiedClaims: {
    level?: string;              // e.g., ">= Gold"
    sybilCheck?: string;         // "passed" | "failed"
  };
  timestamp: number;
}

// =============================================================================
// EAS (Ethereum Attestation Service)
// =============================================================================

/**
 * EAS Attestation Result
 * 
 * Returned after creating an on-chain attestation.
 */
export interface AttestationResult {
  attestationId: string;         // bytes32 UID
  explorerUrl: string;           // EASScan URL
  schemaId: string;              // Schema identifier
  recipient: string;             // Attestation recipient
  txHash?: string;               // Transaction hash (if real)
  isSimulated: boolean;          // True if no PRIVATE_KEY
}

/**
 * Attestation Data (decoded from on-chain)
 */
export interface AttestationData {
  attester: string;
  recipient: string;
  wallet: string;
  score: number;
  level: CreditLevel;
  risk: RiskLevel;
  timestamp: number;
  isValid: boolean;
}

// =============================================================================
// API RESPONSE
// =============================================================================

/**
 * Standard API Response Wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    timestamp: number;
    version: string;
  };
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Level name mapping
 */
export const LEVEL_NAMES: Record<CreditLevel, string> = {
  [CreditLevel.BRONZE]: 'Bronze',
  [CreditLevel.SILVER]: 'Silver',
  [CreditLevel.GOLD]: 'Gold',
  [CreditLevel.PLATINUM]: 'Platinum',
  [CreditLevel.DIAMOND]: 'Diamond',
};

/**
 * Convert score to level
 * 
 * Why these thresholds?
 * - Diamond (90+): Top 10% users, exceptional on-chain history
 * - Platinum (80-89): Top 20%, excellent standing
 * - Gold (60-79): Top 50%, good users
 * - Silver (40-59): Average, building history
 * - Bronze (0-39): New or risky users
 */
export function scoreToLevel(score: number): CreditLevel {
  if (score >= 90) return CreditLevel.DIAMOND;
  if (score >= 80) return CreditLevel.PLATINUM;
  if (score >= 60) return CreditLevel.GOLD;
  if (score >= 40) return CreditLevel.SILVER;
  return CreditLevel.BRONZE;
}

/**
 * Convert score to risk
 * 
 * Aligned with level boundaries:
 * - Low: Score >= 80 (Platinum, Diamond)
 * - Medium: Score >= 60 (Gold)
 * - High: Score < 60 (Silver, Bronze)
 */
export function scoreToRisk(score: number): RiskLevel {
  if (score >= 80) return 'Low';
  if (score >= 60) return 'Medium';
  return 'High';
}

/**
 * Convert internal score to FICO display
 * 
 * Formula: FICO = 300 + (internalScore * 5.5)
 * - Score 0 → FICO 300
 * - Score 100 → FICO 850
 * 
 * Note: This is ONLY for display. All logic uses internal score.
 */
export function scoreToFICO(score: number): number {
  return Math.round(300 + score * 5.5);
}
