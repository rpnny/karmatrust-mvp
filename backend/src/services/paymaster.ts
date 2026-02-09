/**
 * Paymaster Service
 * 
 * Gas sponsorship for KarmaTrust users on Base Sepolia.
 * Sponsors the gas cost of proof submissions to CreditRegistryV2,
 * removing the barrier for new users who don't have testnet ETH.
 * 
 * Architecture:
 * - User generates a ZK proof
 * - User sends the proof to the Paymaster API
 * - Paymaster validates the proof off-chain
 * - Paymaster submits the tx on behalf of the user (meta-transaction)
 * - User's tier is updated without them spending gas
 * 
 * Security:
 * - Rate limiting: 1 sponsored tx per user per 24 hours
 * - Budget cap: Max daily gas spend limit
 * - Proof validation: Only sponsors valid ZK proofs
 */

import { ethers } from 'ethers';

// =============================================================================
// TYPES
// =============================================================================

interface SponsoredTx {
  userAddress: string;
  tier: number;
  txHash: string;
  gasUsed: string;
  timestamp: number;
}

interface SponsorshipResult {
  success: boolean;
  txHash?: string;
  gasUsed?: string;
  error?: string;
}

interface PaymasterStatus {
  configured: boolean;
  balance: string;
  dailyBudget: string;
  dailySpent: string;
  sponsoredToday: number;
  totalSponsored: number;
}

// =============================================================================
// PAYMASTER SERVICE
// =============================================================================

export class PaymasterService {
  private signer: ethers.Wallet | null = null;
  private provider: ethers.JsonRpcProvider;
  private registryAddress: string;
  private registryAbi: string[];
  
  // Rate limiting
  private sponsoredTxs: Map<string, SponsoredTx[]> = new Map();
  private readonly MAX_DAILY_SPONSORSHIPS = 50;
  private readonly MAX_PER_USER_DAILY = 1;
  private readonly DAILY_GAS_BUDGET = ethers.parseEther('0.1'); // 0.1 ETH daily budget
  
  // Stats
  private dailyGasSpent = 0n;
  private totalSponsored = 0;
  private lastResetDay = 0;

  constructor() {
    const rpcUrl = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
    const privateKey = process.env.PAYMASTER_PRIVATE_KEY || process.env.PRIVATE_KEY;
    this.registryAddress = process.env.CREDIT_REGISTRY_V2_ADDRESS || '';
    
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    this.registryAbi = [
      'function submitProof(uint[2] calldata _pA, uint[2][2] calldata _pB, uint[2] calldata _pC, uint[4] calldata _pubSignals) external',
      'function getTier(address user) external view returns (uint8)',
      'function canSubmitProof(address user) external view returns (bool canSubmit, uint256 timeUntilNext)',
    ];

    if (privateKey && this.registryAddress) {
      this.signer = new ethers.Wallet(privateKey, this.provider);
      console.log('[Paymaster] Configured. Sponsor address:', this.signer.address);
    } else {
      console.log('[Paymaster] Not configured. Set PAYMASTER_PRIVATE_KEY and CREDIT_REGISTRY_V2_ADDRESS.');
    }
  }

  /**
   * Sponsor a proof submission for a user.
   * The paymaster submits the proof on behalf of the user.
   */
  async sponsorProofSubmission(
    userAddress: string,
    proof: {
      pA: [string, string];
      pB: [[string, string], [string, string]];
      pC: [string, string];
      pubSignals: [string, string, string, string];
    }
  ): Promise<SponsorshipResult> {
    try {
      // Check configuration
      if (!this.signer || !this.registryAddress) {
        return { success: false, error: 'Paymaster not configured' };
      }

      // Reset daily counters if new day
      this.resetDailyIfNeeded();

      // Rate limiting checks
      const rateLimitError = this.checkRateLimit(userAddress);
      if (rateLimitError) {
        return { success: false, error: rateLimitError };
      }

      // Budget check
      if (this.dailyGasSpent >= this.DAILY_GAS_BUDGET) {
        return { success: false, error: 'Daily gas budget exhausted. Try again tomorrow.' };
      }

      // Check if user can submit proof (24h cooldown on contract)
      const registry = new ethers.Contract(this.registryAddress, this.registryAbi, this.signer);
      const [canSubmit, timeUntilNext] = await registry.canSubmitProof(userAddress);
      if (!canSubmit) {
        return { 
          success: false, 
          error: `User must wait ${Math.ceil(Number(timeUntilNext) / 3600)} more hours before next proof.` 
        };
      }

      // Format proof for contract
      const pA = proof.pA.map(BigInt) as [bigint, bigint];
      const pB = proof.pB.map(row => row.map(BigInt)) as [[bigint, bigint], [bigint, bigint]];
      const pC = proof.pC.map(BigInt) as [bigint, bigint];
      const pubSignals = proof.pubSignals.map(BigInt) as [bigint, bigint, bigint, bigint];

      // Estimate gas
      const gasEstimate = await registry.submitProof.estimateGas(pA, pB, pC, pubSignals);
      const gasLimit = gasEstimate * 120n / 100n; // 20% buffer

      // Submit transaction
      console.log(`[Paymaster] Sponsoring proof for ${userAddress.slice(0, 10)}... (gas: ~${gasEstimate})`);
      
      const tx = await registry.submitProof(pA, pB, pC, pubSignals, { gasLimit });
      const receipt = await tx.wait();

      if (!receipt || receipt.status !== 1) {
        return { success: false, error: 'Transaction reverted' };
      }

      // Record sponsorship
      const gasUsed = receipt.gasUsed.toString();
      const gasCost = BigInt(receipt.gasUsed) * BigInt(receipt.gasPrice ?? 0);
      this.dailyGasSpent = this.dailyGasSpent + gasCost;
      this.totalSponsored++;

      const sponsoredTx: SponsoredTx = {
        userAddress,
        tier: Number(pubSignals[0]),
        txHash: tx.hash,
        gasUsed,
        timestamp: Date.now(),
      };

      if (!this.sponsoredTxs.has(userAddress)) {
        this.sponsoredTxs.set(userAddress, []);
      }
      this.sponsoredTxs.get(userAddress)!.push(sponsoredTx);

      console.log(`[Paymaster] Sponsored! TX: ${tx.hash} | Gas: ${gasUsed}`);

      return {
        success: true,
        txHash: tx.hash,
        gasUsed,
      };
    } catch (err: any) {
      console.error('[Paymaster] Sponsorship failed:', err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Check rate limiting for a user
   */
  private checkRateLimit(userAddress: string): string | null {
    // Global daily limit
    const todaysTxs = this.getTodaysSponsorships();
    if (todaysTxs >= this.MAX_DAILY_SPONSORSHIPS) {
      return 'Daily sponsorship limit reached. Try again tomorrow.';
    }

    // Per-user daily limit
    const userTxs = this.sponsoredTxs.get(userAddress) || [];
    const todayStart = new Date().setHours(0, 0, 0, 0);
    const userTxsToday = userTxs.filter(tx => tx.timestamp >= todayStart);
    
    if (userTxsToday.length >= this.MAX_PER_USER_DAILY) {
      return 'You have already used your daily sponsored transaction. Try again tomorrow.';
    }

    return null;
  }

  /**
   * Count today's total sponsorships
   */
  private getTodaysSponsorships(): number {
    const todayStart = new Date().setHours(0, 0, 0, 0);
    let count = 0;
    for (const txs of this.sponsoredTxs.values()) {
      count += txs.filter(tx => tx.timestamp >= todayStart).length;
    }
    return count;
  }

  /**
   * Reset daily counters if new day
   */
  private resetDailyIfNeeded(): void {
    const today = new Date().setHours(0, 0, 0, 0);
    if (today > this.lastResetDay) {
      this.dailyGasSpent = 0n;
      this.lastResetDay = today;
    }
  }

  /**
   * Get paymaster status
   */
  async getStatus(): Promise<PaymasterStatus> {
    let balance = '0';
    if (this.signer) {
      try {
        const bal = await this.provider.getBalance(this.signer.address);
        balance = ethers.formatEther(bal);
      } catch {
        balance = 'unknown';
      }
    }

    return {
      configured: !!this.signer,
      balance,
      dailyBudget: ethers.formatEther(this.DAILY_GAS_BUDGET),
      dailySpent: ethers.formatEther(this.dailyGasSpent),
      sponsoredToday: this.getTodaysSponsorships(),
      totalSponsored: this.totalSponsored,
    };
  }
}
