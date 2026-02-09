/**
 * Reclaim Protocol Provider
 * 
 * Plan B for TLSNotary - uses Reclaim Protocol for data provenance.
 * Reclaim Protocol enables users to prove data from any website
 * using zkTLS proofs without revealing the underlying data.
 * 
 * Use cases for KarmaTrust:
 * 1. Prove bank balance from banking website (TradFi credit data)
 * 2. Prove FICO score from credit bureau website
 * 3. Prove DeFi positions from protocol dashboards
 * 4. Prove employment/income data from payroll platforms
 * 
 * Architecture:
 * - User visits data source (bank, credit bureau)
 * - Reclaim SDK generates a zkTLS proof of the data
 * - Backend verifies the proof and extracts credit-relevant data
 * - Score is updated with verified TradFi data points
 * 
 * @see https://docs.reclaimprotocol.org/
 */

import { ethers } from 'ethers';

// =============================================================================
// TYPES
// =============================================================================

interface ReclaimProof {
  /** Unique identifier for the proof */
  identifier: string;
  /** Claim info (provider, parameters, context) */
  claimData: {
    provider: string;
    parameters: string;
    context: string;
    /** Extracted data from the proof */
    extractedData: Record<string, string>;
    /** Timestamp of proof generation */
    timestamp: number;
    /** Owner's Ethereum address */
    owner: string;
  };
  /** Cryptographic signatures for verification */
  signatures: string[];
  /** Witnesses who attested to the proof */
  witnesses: {
    id: string;
    url: string;
  }[];
}

interface VerifiedCreditData {
  source: string;
  dataType: 'bank_balance' | 'credit_score' | 'defi_position' | 'income';
  value: number;
  currency?: string;
  verifiedAt: number;
  proofId: string;
  confidence: number; // 0-100
}

interface ReclaimVerificationResult {
  isValid: boolean;
  extractedData: VerifiedCreditData | null;
  error?: string;
}

// =============================================================================
// RECLAIM PROVIDER CONFIGURATIONS
// =============================================================================

/**
 * Provider configurations for different data sources.
 * Each provider defines how to extract credit-relevant data from a specific source.
 */
const PROVIDER_CONFIGS: Record<string, {
  name: string;
  dataType: VerifiedCreditData['dataType'];
  description: string;
  extractValue: (data: Record<string, string>) => number;
  confidence: number;
}> = {
  // Bank balance verification
  'bank-balance': {
    name: 'Bank Balance',
    dataType: 'bank_balance',
    description: 'Proves total balance across bank accounts',
    extractValue: (data) => {
      const balance = parseFloat(data['balance'] || data['total_balance'] || '0');
      return Math.max(0, balance);
    },
    confidence: 95,
  },
  
  // Credit score verification (e.g., from Credit Karma, Experian)
  'credit-score': {
    name: 'Credit Score',
    dataType: 'credit_score',
    description: 'Proves FICO or VantageScore from credit bureau',
    extractValue: (data) => {
      const score = parseInt(data['score'] || data['credit_score'] || '0', 10);
      return Math.min(850, Math.max(300, score));
    },
    confidence: 98,
  },
  
  // DeFi position verification
  'defi-position': {
    name: 'DeFi Position',
    dataType: 'defi_position',
    description: 'Proves DeFi portfolio value from protocol dashboard',
    extractValue: (data) => {
      const value = parseFloat(data['total_value'] || data['portfolio'] || '0');
      return Math.max(0, value);
    },
    confidence: 90,
  },
  
  // Income verification
  'income-verification': {
    name: 'Income Verification',
    dataType: 'income',
    description: 'Proves monthly/annual income from payroll platform',
    extractValue: (data) => {
      const income = parseFloat(data['monthly_income'] || data['salary'] || '0');
      return Math.max(0, income);
    },
    confidence: 92,
  },
};

// =============================================================================
// RECLAIM PROVIDER SERVICE
// =============================================================================

export class ReclaimProviderService {
  private appId: string;
  private appSecret: string;
  private isConfigured: boolean;

  constructor() {
    this.appId = process.env.RECLAIM_APP_ID || '';
    this.appSecret = process.env.RECLAIM_APP_SECRET || '';
    this.isConfigured = !!(this.appId && this.appSecret);

    if (this.isConfigured) {
      console.log('[Reclaim] Provider configured with app ID:', this.appId.slice(0, 8) + '...');
    } else {
      console.log('[Reclaim] Not configured. Set RECLAIM_APP_ID and RECLAIM_APP_SECRET to enable.');
      console.log('[Reclaim] Using verification-only mode (can verify proofs but not create sessions).');
    }
  }

  /**
   * Verify a Reclaim proof and extract credit-relevant data.
   * This is the core function - it verifies the zkTLS proof
   * and translates the verified data into our credit model.
   */
  async verifyProof(proof: ReclaimProof): Promise<ReclaimVerificationResult> {
    try {
      console.log('[Reclaim] Verifying proof:', proof.identifier);

      // Step 1: Verify proof structure
      if (!proof.claimData || !proof.signatures || proof.signatures.length === 0) {
        return { isValid: false, extractedData: null, error: 'Invalid proof structure' };
      }

      // Step 2: Verify proof is not expired (max 24 hours old)
      const proofAge = Date.now() - proof.claimData.timestamp;
      const MAX_PROOF_AGE = 24 * 60 * 60 * 1000; // 24 hours
      if (proofAge > MAX_PROOF_AGE) {
        return { isValid: false, extractedData: null, error: 'Proof expired (older than 24 hours)' };
      }

      // Step 3: Verify cryptographic signatures
      const signatureValid = await this.verifySignatures(proof);
      if (!signatureValid) {
        return { isValid: false, extractedData: null, error: 'Invalid proof signatures' };
      }

      // Step 4: Extract and validate data based on provider
      const providerConfig = PROVIDER_CONFIGS[proof.claimData.provider];
      if (!providerConfig) {
        return { isValid: false, extractedData: null, error: `Unknown provider: ${proof.claimData.provider}` };
      }

      const value = providerConfig.extractValue(proof.claimData.extractedData);

      const verifiedData: VerifiedCreditData = {
        source: providerConfig.name,
        dataType: providerConfig.dataType,
        value,
        verifiedAt: Date.now(),
        proofId: proof.identifier,
        confidence: providerConfig.confidence,
      };

      console.log(`[Reclaim] Verified: ${providerConfig.name} = ${value} (confidence: ${providerConfig.confidence}%)`);

      return { isValid: true, extractedData: verifiedData };
    } catch (err: any) {
      console.error('[Reclaim] Verification error:', err.message);
      return { isValid: false, extractedData: null, error: err.message };
    }
  }

  /**
   * Verify the cryptographic signatures of a Reclaim proof.
   * The signatures prove that Reclaim witnesses attested to the data.
   */
  private async verifySignatures(proof: ReclaimProof): Promise<boolean> {
    try {
      // Construct the message that was signed
      const message = ethers.solidityPackedKeccak256(
        ['string', 'string', 'string', 'uint256'],
        [
          proof.claimData.provider,
          proof.claimData.parameters,
          JSON.stringify(proof.claimData.extractedData),
          proof.claimData.timestamp,
        ]
      );

      // Verify at least one valid signature from a known witness
      for (const signature of proof.signatures) {
        try {
          const recoveredAddress = ethers.verifyMessage(
            ethers.getBytes(message),
            signature
          );

          // Check if recovered address matches any witness
          const isKnownWitness = proof.witnesses.some(
            (w) => w.id.toLowerCase() === recoveredAddress.toLowerCase()
          );

          if (isKnownWitness) {
            return true;
          }
        } catch {
          // Try next signature
          continue;
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * Translate verified Reclaim data into credit score adjustments.
   * This is the "TradFi -> DeFi" bridge component.
   */
  translateToCreditFactor(verifiedData: VerifiedCreditData): {
    factor: string;
    score: number;
    weight: number;
    description: string;
  } {
    switch (verifiedData.dataType) {
      case 'bank_balance':
        // Higher bank balance -> higher asset_value factor
        const balanceScore = Math.min(100, (verifiedData.value / 100000) * 100);
        return {
          factor: 'asset_value',
          score: balanceScore,
          weight: 0.15,
          description: `Verified bank balance: $${verifiedData.value.toLocaleString()}`,
        };

      case 'credit_score':
        // Direct FICO translation
        const ficoScore = Math.min(100, ((verifiedData.value - 300) / 550) * 100);
        return {
          factor: 'tradfi_credit',
          score: ficoScore,
          weight: 0.25, // High weight for verified credit score
          description: `Verified FICO: ${verifiedData.value}`,
        };

      case 'defi_position':
        // DeFi portfolio value -> protocol diversity + asset value
        const defiScore = Math.min(100, (verifiedData.value / 50000) * 100);
        return {
          factor: 'protocol_diversity',
          score: defiScore,
          weight: 0.1,
          description: `Verified DeFi position: $${verifiedData.value.toLocaleString()}`,
        };

      case 'income':
        // Income -> stability factor
        const incomeScore = Math.min(100, (verifiedData.value / 10000) * 100);
        return {
          factor: 'stability',
          score: incomeScore,
          weight: 0.2,
          description: `Verified monthly income: $${verifiedData.value.toLocaleString()}`,
        };

      default:
        return {
          factor: 'unknown',
          score: 0,
          weight: 0,
          description: 'Unknown data type',
        };
    }
  }

  /**
   * Get available providers and their status
   */
  getProviders(): {
    id: string;
    name: string;
    description: string;
    dataType: string;
    confidence: number;
  }[] {
    return Object.entries(PROVIDER_CONFIGS).map(([id, config]) => ({
      id,
      name: config.name,
      description: config.description,
      dataType: config.dataType,
      confidence: config.confidence,
    }));
  }

  /**
   * Get service status
   */
  getStatus(): {
    configured: boolean;
    mode: 'full' | 'verify-only';
    providers: number;
  } {
    return {
      configured: this.isConfigured,
      mode: this.isConfigured ? 'full' : 'verify-only',
      providers: Object.keys(PROVIDER_CONFIGS).length,
    };
  }
}
