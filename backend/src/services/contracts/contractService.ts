/**
 * KarmaTrust Contract Service
 * 
 * Provides high-level interface for interacting with deployed smart contracts:
 * - VCSMStateManager: Credit state management
 * - TieredLending: Credit-based lending operations
 */

import { ethers } from 'ethers';
import {
  SEPOLIA_CONTRACTS,
  VCSM_STATE_MANAGER_ABI,
  TIERED_LENDING_ABI,
  CHAIN_CONFIG,
  TIER_INFO,
  getContractExplorerUrl,
  getTxExplorerUrl,
} from './contractConfig.js';

export class ContractService {
  private provider: ethers.Provider;
  private signer: ethers.Signer | null = null;
  private vcsmContract: ethers.Contract;
  private lendingContract: ethers.Contract;
  private isReadOnly: boolean = true;

  constructor() {
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(CHAIN_CONFIG.rpcUrl);

    // Initialize contracts (read-only by default)
    this.vcsmContract = new ethers.Contract(
      SEPOLIA_CONTRACTS.VCSMStateManager,
      VCSM_STATE_MANAGER_ABI,
      this.provider
    );

    this.lendingContract = new ethers.Contract(
      SEPOLIA_CONTRACTS.TieredLending,
      TIERED_LENDING_ABI,
      this.provider
    );

    // Try to initialize signer for write operations
    this.initializeSigner();
  }

  private initializeSigner(): void {
    const privateKey = process.env.PRIVATE_KEY;
    if (privateKey) {
      try {
        const pk = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
        this.signer = new ethers.Wallet(pk, this.provider);
        
        // Re-initialize contracts with signer
        this.vcsmContract = new ethers.Contract(
          SEPOLIA_CONTRACTS.VCSMStateManager,
          VCSM_STATE_MANAGER_ABI,
          this.signer
        );
        
        this.lendingContract = new ethers.Contract(
          SEPOLIA_CONTRACTS.TieredLending,
          TIERED_LENDING_ABI,
          this.signer
        );
        
        this.isReadOnly = false;
        console.log('[Contracts] Write mode enabled ✅');
      } catch (error) {
        console.error('[Contracts] Failed to initialize signer:', error);
        console.log('[Contracts] Running in read-only mode');
      }
    } else {
      console.log('[Contracts] No PRIVATE_KEY found, running in read-only mode');
    }
  }

  // =========================================================================
  // VCSM State Manager Methods
  // =========================================================================

  /**
   * Get user's credit state from contract
   */
  async getUserState(userAddress: string) {
    try {
      const [stateHash, level, version, updatedAt, initialized] = await this.vcsmContract.getState(userAddress);
      
      return {
        stateHash,
        level: Number(level),
        levelName: TIER_INFO[Number(level) as keyof typeof TIER_INFO]?.name || 'Unverified',
        version: Number(version),
        updatedAt: Number(updatedAt),
        initialized,
        contractAddress: SEPOLIA_CONTRACTS.VCSMStateManager,
        explorerUrl: getContractExplorerUrl('VCSMStateManager'),
      };
    } catch (error: any) {
      console.error('[Contracts] Error getting user state:', error);
      throw new Error(`Failed to get user state: ${error.message}`);
    }
  }

  /**
   * Attest a new state for a user (requires signer)
   */
  async attestUserState(userAddress: string, stateHash: string, level: number) {
    if (this.isReadOnly) {
      throw new Error('Write operations not available (no PRIVATE_KEY)');
    }

    try {
      const tx = await this.vcsmContract.attestState(userAddress, stateHash, level);
      const receipt = await tx.wait();
      
      return {
        success: true,
        txHash: receipt.hash,
        explorerUrl: getTxExplorerUrl(receipt.hash),
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error: any) {
      console.error('[Contracts] Error attesting state:', error);
      throw new Error(`Failed to attest state: ${error.message}`);
    }
  }

  /**
   * Get total number of users
   */
  async getTotalUsers(): Promise<number> {
    try {
      const total = await this.vcsmContract.totalUsers();
      return Number(total);
    } catch (error: any) {
      console.error('[Contracts] Error getting total users:', error);
      return 0;
    }
  }

  // =========================================================================
  // Tiered Lending Methods
  // =========================================================================

  /**
   * Get user's loan position
   */
  async getLoanPosition(userAddress: string) {
    try {
      const [borrowed, collateral, tierAtBorrow, borrowTime, active] = 
        await this.lendingContract.getPosition(userAddress);
      
      return {
        borrowed: ethers.formatEther(borrowed),
        collateral: ethers.formatEther(collateral),
        tierAtBorrow: Number(tierAtBorrow),
        tierName: TIER_INFO[Number(tierAtBorrow) as keyof typeof TIER_INFO]?.name || 'Unknown',
        borrowTime: Number(borrowTime),
        active,
        contractAddress: SEPOLIA_CONTRACTS.TieredLending,
        explorerUrl: getContractExplorerUrl('TieredLending'),
      };
    } catch (error: any) {
      console.error('[Contracts] Error getting loan position:', error);
      throw new Error(`Failed to get loan position: ${error.message}`);
    }
  }

  /**
   * Calculate required collateral for a borrow amount
   */
  async calculateRequiredCollateral(userAddress: string, borrowAmountETH: string) {
    try {
      const borrowAmount = ethers.parseEther(borrowAmountETH);
      const [collateral, tier, ratioBps] = await this.lendingContract.calculateRequiredCollateral(
        userAddress,
        borrowAmount
      );
      
      return {
        borrowAmount: borrowAmountETH,
        requiredCollateral: ethers.formatEther(collateral),
        tier: Number(tier),
        tierName: TIER_INFO[Number(tier) as keyof typeof TIER_INFO]?.name || 'Bronze',
        collateralRatio: Number(ratioBps) / 100, // Convert bps to percentage
        collateralRatioBps: Number(ratioBps),
      };
    } catch (error: any) {
      console.error('[Contracts] Error calculating collateral:', error);
      throw new Error(`Failed to calculate collateral: ${error.message}`);
    }
  }

  /**
   * Get tier configuration
   */
  async getTierConfig(tier: number) {
    try {
      const [collateralRatioBps, maxBorrowAmount, interestRateBps, enabled] = 
        await this.lendingContract.getTierConfig(tier);
      
      return {
        tier,
        tierName: TIER_INFO[tier as keyof typeof TIER_INFO]?.name || 'Unknown',
        collateralRatio: Number(collateralRatioBps) / 100,
        collateralRatioBps: Number(collateralRatioBps),
        maxBorrowAmount: ethers.formatEther(maxBorrowAmount),
        interestRate: Number(interestRateBps) / 100,
        interestRateBps: Number(interestRateBps),
        enabled,
      };
    } catch (error: any) {
      console.error('[Contracts] Error getting tier config:', error);
      throw new Error(`Failed to get tier config: ${error.message}`);
    }
  }

  /**
   * Calculate collateral savings compared to base tier
   */
  async getCollateralSavings(tier: number, borrowAmountETH: string) {
    try {
      const borrowAmount = ethers.parseEther(borrowAmountETH);
      const [baseCollateral, tierCollateral, savings, savingsPercent] = 
        await this.lendingContract.getCollateralSavings(tier, borrowAmount);
      
      return {
        tier,
        tierName: TIER_INFO[tier as keyof typeof TIER_INFO]?.name || 'Unknown',
        borrowAmount: borrowAmountETH,
        baseCollateral: ethers.formatEther(baseCollateral),
        tierCollateral: ethers.formatEther(tierCollateral),
        savings: ethers.formatEther(savings),
        savingsPercent: Number(savingsPercent),
        message: `As ${TIER_INFO[tier as keyof typeof TIER_INFO]?.name}, you save ${Number(savingsPercent)}% collateral!`,
      };
    } catch (error: any) {
      console.error('[Contracts] Error getting collateral savings:', error);
      throw new Error(`Failed to get collateral savings: ${error.message}`);
    }
  }

  /**
   * Get lending protocol stats
   */
  async getLendingStats() {
    try {
      const totalBorrowed = await this.lendingContract.totalBorrowed();
      const totalCollateral = await this.lendingContract.totalCollateral();
      
      return {
        totalBorrowed: ethers.formatEther(totalBorrowed),
        totalCollateral: ethers.formatEther(totalCollateral),
        totalLoans: 0, // TODO: Add counter in contract
        contractAddress: SEPOLIA_CONTRACTS.TieredLending,
        explorerUrl: getContractExplorerUrl('TieredLending'),
      };
    } catch (error: any) {
      console.error('[Contracts] Error getting lending stats:', error);
      return {
        totalBorrowed: '0',
        totalCollateral: '0',
        totalLoans: 0,
        contractAddress: SEPOLIA_CONTRACTS.TieredLending,
        explorerUrl: getContractExplorerUrl('TieredLending'),
      };
    }
  }

  // =========================================================================
  // Utility Methods
  // =========================================================================

  /**
   * Get contract addresses and explorer links
   */
  getContractInfo() {
    return {
      network: CHAIN_CONFIG.name,
      chainId: CHAIN_CONFIG.chainId,
      contracts: {
        VCSMStateManager: {
          address: SEPOLIA_CONTRACTS.VCSMStateManager,
          explorerUrl: getContractExplorerUrl('VCSMStateManager'),
        },
        TieredLending: {
          address: SEPOLIA_CONTRACTS.TieredLending,
          explorerUrl: getContractExplorerUrl('TieredLending'),
        },
      },
      tierInfo: TIER_INFO,
      isReadOnly: this.isReadOnly,
    };
  }

  /**
   * Check if contracts are accessible
   */
  async healthCheck(): Promise<boolean> {
    try {
      await Promise.all([
        this.vcsmContract.totalUsers(),
        this.lendingContract.totalBorrowed(),
      ]);
      return true;
    } catch (error) {
      console.error('[Contracts] Health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const contractService = new ContractService();
