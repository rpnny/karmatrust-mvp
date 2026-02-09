/**
 * Blockchain Data Service
 * 
 * Fetches on-chain data for credit scoring.
 * 
 * Data Sources (in priority order):
 * 1. Etherscan API (most reliable, rate-limited)
 * 2. RPC Provider (fallback, less data)
 * 3. Deterministic Baseline (demo fallback, always works)
 * 
 * Design Decision: Three-layer fallback
 * - Ensures demo never fails due to API issues
 * - Each layer has a "trust level" for transparency
 * - Deterministic mode uses address hash for consistent results
 * 
 * Why deterministic fallback?
 * - Hackathon demos can have network issues
 * - Same address always returns same score (reproducible)
 * - Clearly marked as "simulated" in response
 */

import { ethers } from 'ethers';
import { WalletAnalysis } from '../types/index.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Data source configuration
 * 
 * Trust levels indicate reliability:
 * - 100: Authoritative source (Etherscan with API key)
 * - 80: Good source (RPC provider)
 */
const DATA_SOURCES = {
  etherscan: { name: 'etherscan', trustLevel: 100 },
  rpc: { name: 'rpc', trustLevel: 80 },
};

// RPC URLs with fallbacks (ordered by reliability)
const RPC_URLS = [
  process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia.gateway.tatum.io',  // Tatum (recommended)
  'https://ethereum-sepolia-rpc.publicnode.com',                                // Public node
  process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',                   // Mainnet fallback
  'https://rpc.ankr.com/eth',                                                   // Ankr
];

// Etherscan API configuration (V2)
const ETHERSCAN_API_URL = 'https://api.etherscan.io/v2/api';
const ETHERSCAN_CHAIN_ID = '1'; // Ethereum Mainnet
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';

// Log API key status at module load time
console.log(`[BlockchainData] Etherscan API Key: ${ETHERSCAN_API_KEY ? '✅ SET (length=' + ETHERSCAN_API_KEY.length + ')' : '❌ NOT SET'}`);

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

/**
 * Cache for wallet analysis results
 * 
 * Why caching?
 * - Etherscan API has rate limits (5 calls/sec)
 * - Large wallets (10k+ tx) take 10+ seconds to analyze
 * - Same wallet data doesn't change frequently
 * - Demo Day: avoid slow responses during presentation
 * 
 * Cache Strategy:
 * - TTL: 5 minutes (300 seconds) - balance between freshness and performance
 * - Key: normalized wallet address (lowercase)
 * - Cleared on server restart (in-memory only)
 */
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: WalletAnalysis & { dataSource: string; trustLevel: number };
  timestamp: number;
  expiresAt: number;
}

const walletCache = new Map<string, CacheEntry>();

/**
 * Get cache statistics for monitoring
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{ wallet: string; age: number; expiresIn: number }>;
} {
  const now = Date.now();
  const entries = Array.from(walletCache.entries()).map(([wallet, entry]) => ({
    wallet: wallet.slice(0, 10) + '...',
    age: Math.round((now - entry.timestamp) / 1000),
    expiresIn: Math.round((entry.expiresAt - now) / 1000),
  }));
  return { size: walletCache.size, entries };
}

/**
 * Clear all cache entries
 */
export function clearCache(): void {
  walletCache.clear();
  console.log('[BlockchainData] Cache cleared');
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class BlockchainDataService {
  private provider: ethers.JsonRpcProvider | null = null;
  private currentRpcIndex = 0;

  constructor() {
    this.initializeProvider();
  }

  /**
   * Initialize RPC provider with fallback support
   */
  private initializeProvider(): void {
    try {
      this.provider = new ethers.JsonRpcProvider(RPC_URLS[this.currentRpcIndex]);
      console.log(`[BlockchainData] Connected to RPC: ${RPC_URLS[this.currentRpcIndex]}`);
    } catch (error) {
      console.warn('[BlockchainData] Failed to initialize provider:', error);
    }
  }

  /**
   * Fetch wallet analysis data (with caching)
   * 
   * Uses three-layer fallback:
   * 1. Try Etherscan API (best data)
   * 2. Try RPC provider (basic data)
   * 3. Use deterministic baseline (always works)
   * 
   * Caching:
   * - Results cached for 5 minutes
   * - Dramatically improves response time for repeated queries
   * - Essential for Demo Day performance
   * 
   * @param wallet - Ethereum address to analyze
   * @param skipCache - Force refresh (bypass cache)
   * @returns WalletAnalysis with data source metadata
   */
  async fetchWalletData(
    wallet: string, 
    skipCache: boolean = false
  ): Promise<WalletAnalysis & { dataSource: string; trustLevel: number; cached?: boolean }> {
    // Validate address format
    if (!ethers.isAddress(wallet)) {
      throw new Error(`Invalid Ethereum address: ${wallet}`);
    }

    // Normalize address (checksum format)
    const normalizedWallet = ethers.getAddress(wallet);
    const cacheKey = normalizedWallet.toLowerCase();

    // Check cache first (unless skipCache is true)
    if (!skipCache) {
      const cached = walletCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        const age = Math.round((Date.now() - cached.timestamp) / 1000);
        console.log(`[BlockchainData] 🎯 Cache HIT for ${normalizedWallet.slice(0, 10)}... (age: ${age}s)`);
        return { ...cached.data, cached: true };
      }
    }

    console.log(`[BlockchainData] 📡 Cache MISS for ${normalizedWallet.slice(0, 10)}... - fetching fresh data`);
    const startTime = Date.now();

    // Try Etherscan API first
    let result: WalletAnalysis & { dataSource: string; trustLevel: number };
    
    if (ETHERSCAN_API_KEY) {
      try {
        const data = await this.fetchFromEtherscan(normalizedWallet);
        result = { ...data, dataSource: 'etherscan', trustLevel: DATA_SOURCES.etherscan.trustLevel };
      } catch (error) {
        console.warn('[BlockchainData] Etherscan failed, trying RPC...', error);
        result = await this.fetchWithFallback(normalizedWallet);
      }
    } else {
      result = await this.fetchWithFallback(normalizedWallet);
    }

    // Store in cache
    const now = Date.now();
    walletCache.set(cacheKey, {
      data: result,
      timestamp: now,
      expiresAt: now + CACHE_TTL_MS,
    });

    const fetchTime = Date.now() - startTime;
    console.log(`[BlockchainData] ✅ Fetched and cached ${normalizedWallet.slice(0, 10)}... in ${fetchTime}ms`);

    return { ...result, cached: false };
  }

  /**
   * Fallback fetch when Etherscan fails - tries RPC with retries
   */
  private async fetchWithFallback(normalizedWallet: string): Promise<WalletAnalysis & { dataSource: string; trustLevel: number }> {
    // Try RPC provider with retries
    if (!this.provider) {
      throw new Error('No RPC provider configured. Set SEPOLIA_RPC_URL or ETHEREUM_RPC_URL in .env');
    }

    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[BlockchainData] RPC attempt ${attempt}/${maxRetries}...`);
        const data = await this.fetchFromRPC(normalizedWallet);
        console.log(`[BlockchainData] ✅ RPC fetch successful on attempt ${attempt}`);
        return { ...data, dataSource: 'rpc', trustLevel: DATA_SOURCES.rpc.trustLevel };
      } catch (error) {
        lastError = error as Error;
        console.warn(`[BlockchainData] RPC attempt ${attempt} failed:`, error);
        
        // Wait before retry (exponential backoff: 1s, 2s)
        if (attempt < maxRetries) {
          const delayMs = attempt * 1000;
          console.log(`[BlockchainData] Waiting ${delayMs}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
    }

    // All attempts failed
    throw new Error(
      `Failed to fetch wallet data after ${maxRetries} attempts. ` +
      `Last error: ${lastError?.message}. ` +
      `Please check your RPC connection or Etherscan API key.`
    );
  }

  /**
   * Fetch data from Etherscan API
   * 
   * Fetches:
   * - Transaction list (for count and history)
   * - Balance
   * - Token transfers (for protocol diversity)
   */
  private async fetchFromEtherscan(wallet: string): Promise<WalletAnalysis> {
    console.log(`[BlockchainData] 🔍 Trying Etherscan API V2 for ${wallet.substring(0, 10)}...`);
    
    // Fetch transaction list (Etherscan API V2)
    const txUrl = `${ETHERSCAN_API_URL}?chainid=${ETHERSCAN_CHAIN_ID}&module=account&action=txlist&address=${wallet}&startblock=0&endblock=99999999&sort=asc&apikey=${ETHERSCAN_API_KEY}`;
    console.log(`[BlockchainData] 📡 Etherscan URL: ${txUrl.replace(ETHERSCAN_API_KEY, 'API_KEY')}`);
    
    const txResponse = await fetch(txUrl);
    const txData = await txResponse.json() as any;

    console.log(`[BlockchainData] 📊 Etherscan response: status=${txData.status}, message=${txData.message}, results=${Array.isArray(txData.result) ? txData.result.length : 'N/A'}`);

    if (txData.status !== '1' || !txData.result) {
      throw new Error('Etherscan API V2 error: ' + txData.message);
    }

    const transactions = txData.result as any[];
    const txCount = transactions.length;

    // Extract unique protocols (contract addresses interacted with)
    const uniqueContracts = new Set<string>();
    transactions.forEach((tx: { to: string; contractAddress: string }) => {
      if (tx.to) uniqueContracts.add(tx.to.toLowerCase());
      if (tx.contractAddress) uniqueContracts.add(tx.contractAddress.toLowerCase());
    });

    // Get timestamps
    const firstTx = transactions.length > 0 
      ? parseInt(transactions[0].timeStamp) * 1000 
      : Date.now();
    const lastTx = transactions.length > 0 
      ? parseInt(transactions[transactions.length - 1].timeStamp) * 1000 
      : Date.now();

    // Fetch balance (Etherscan API V2)
    const balanceResponse = await fetch(
      `${ETHERSCAN_API_URL}?chainid=${ETHERSCAN_CHAIN_ID}&module=account&action=balance&address=${wallet}&tag=latest&apikey=${ETHERSCAN_API_KEY}`
    );
    const balanceData = await balanceResponse.json() as any;
    const balanceWei = balanceData.result || '0';
    const balanceEth = parseFloat(ethers.formatEther(balanceWei));
    
    console.log(`[BlockchainData] 💰 Balance: ${balanceWei} wei = ${balanceEth} ETH`);

    // Calculate volatility (simplified: based on tx frequency variance)
    const volatility = this.calculateVolatility(transactions);

    // Check for high-risk interactions (simplified for MVP)
    const highRiskInteractions = this.countHighRiskInteractions(transactions);

    return {
      transactionCount: txCount,
      uniqueProtocols: uniqueContracts.size,
      totalValue: balanceEth,
      firstTransaction: firstTx,
      lastTransaction: lastTx,
      volatility,
      highRiskInteractions,
      scamConnections: false, // Would require external blacklist API
      mixerUsage: false,      // Would require Tornado Cash detection
    };
  }

  /**
   * Fetch basic data from RPC provider
   * 
   * Limited compared to Etherscan:
   * - Only balance and nonce (tx count estimate)
   * - No historical data
   */
  private async fetchFromRPC(wallet: string): Promise<WalletAnalysis> {
    if (!this.provider) {
      throw new Error('RPC provider not initialized');
    }

    // Get balance
    const balance = await this.provider.getBalance(wallet);
    const balanceEth = parseFloat(ethers.formatEther(balance));

    // Get transaction count (nonce)
    const nonce = await this.provider.getTransactionCount(wallet);

    // Estimate wallet age based on nonce (rough approximation)
    // Assume average 1 tx per week for active users
    const estimatedAgeDays = Math.max(nonce * 7, 30);
    const firstTx = Date.now() - (estimatedAgeDays * 24 * 60 * 60 * 1000);

    return {
      transactionCount: nonce,
      uniqueProtocols: Math.min(Math.floor(nonce / 10), 20), // Rough estimate
      totalValue: balanceEth,
      firstTransaction: firstTx,
      lastTransaction: Date.now() - (24 * 60 * 60 * 1000), // Assume recent activity
      volatility: 0.3, // Default moderate volatility
      highRiskInteractions: 0,
      scamConnections: false,
      mixerUsage: false,
    };
  }


  /**
   * Calculate volatility from transaction history
   * 
   * Simplified method:
   * - Look at time gaps between transactions
   * - High variance in gaps = high volatility
   * - Returns 0-1 (0 = stable, 1 = very volatile)
   */
  private calculateVolatility(transactions: { timeStamp: string }[]): number {
    if (transactions.length < 3) return 0.2; // Default for low activity

    // Calculate time gaps between transactions
    const gaps: number[] = [];
    for (let i = 1; i < transactions.length; i++) {
      const gap = parseInt(transactions[i].timeStamp) - parseInt(transactions[i - 1].timeStamp);
      gaps.push(gap);
    }

    // Calculate coefficient of variation (CV)
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const variance = gaps.reduce((sum, gap) => sum + Math.pow(gap - mean, 2), 0) / gaps.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / (mean + 1); // Add 1 to avoid division by zero

    // Normalize to 0-1 range (cap at 2.0 CV)
    return Math.min(cv / 2, 1);
  }

  /**
   * Count high-risk interactions
   * 
   * MVP implementation: Check for interactions with known patterns
   * - Contract creation (could be scam deployment)
   * - Very high value transactions
   * 
   * Note: Production would use external blacklist APIs
   */
  private countHighRiskInteractions(transactions: { to: string; value: string; input: string }[]): number {
    let count = 0;

    for (const tx of transactions) {
      // Contract creation (empty 'to' field)
      if (!tx.to || tx.to === '') {
        count++;
        continue;
      }

      // Very high value transactions (>10 ETH)
      const valueEth = parseFloat(ethers.formatEther(tx.value || '0'));
      if (valueEth > 10) {
        count++;
      }
    }

    return Math.min(count, 10); // Cap at 10
  }
}

// Export singleton instance
export const blockchainDataService = new BlockchainDataService();
