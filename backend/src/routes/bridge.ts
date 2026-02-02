/**
 * Bridge API Routes
 * 
 * Endpoints for translating credit data between TradFi and DeFi formats.
 * This is the core API for KarmaTrust's bridge positioning.
 * 
 * Routes:
 * - GET /api/bridge/to-tradfi/:wallet - Get TradFi format
 * - GET /api/bridge/to-defi/:wallet - Get DeFi format
 * - GET /api/bridge/both/:wallet - Get both formats
 * - GET /api/bridge/compare/:wallet - Get comparison summary
 */

import { Router, Request, Response } from 'express';
import { calculateCreditScore } from '../services/creditScoring.js';
import { bridgeTranslator } from '../services/bridgeTranslator.js';
import type { ApiResponse } from '../types/index.js';

const router = Router();

// =============================================================================
// ROUTE HANDLERS
// =============================================================================

/**
 * GET /api/bridge/to-tradfi/:wallet
 * 
 * Translate credit score to Traditional Finance format
 * Returns FICO score, bond ratings, payment history, etc.
 */
router.get('/to-tradfi/:wallet', async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;
    
    if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format',
      } as ApiResponse);
    }

    // Calculate credit score from blockchain data
    const creditScore = await calculateCreditScore(wallet);
    
    // Translate to TradFi format
    const tradfiReport = bridgeTranslator.translateToTradFi(creditScore);

    res.json({
      success: true,
      data: tradfiReport,
      meta: {
        timestamp: Date.now(),
        version: '1.0.0',
        wallet,
        bridge: 'TradFi format generated from on-chain data',
      },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Bridge to-tradfi error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate TradFi report',
    } as ApiResponse);
  }
});

/**
 * GET /api/bridge/to-defi/:wallet
 * 
 * Translate credit score to DeFi format
 * Returns tier, collateral ratio, ZK proof hash, etc.
 */
router.get('/to-defi/:wallet', async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;
    
    if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format',
      } as ApiResponse);
    }

    // Calculate credit score
    const creditScore = await calculateCreditScore(wallet);
    
    // Translate to DeFi format
    const defiReport = bridgeTranslator.translateToDeFi(creditScore);

    res.json({
      success: true,
      data: defiReport,
      meta: {
        timestamp: Date.now(),
        version: '1.0.0',
        wallet,
        bridge: 'DeFi format generated from credit score',
      },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Bridge to-defi error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate DeFi report',
    } as ApiResponse);
  }
});

/**
 * GET /api/bridge/both/:wallet
 * 
 * Get both TradFi and DeFi formats for comparison
 * This is used in the Bridge Demo UI
 */
router.get('/both/:wallet', async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;
    
    if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format',
      } as ApiResponse);
    }

    // Calculate credit score
    const creditScore = await calculateCreditScore(wallet);
    
    // Get both formats
    const both = bridgeTranslator.translateBoth(creditScore);

    res.json({
      success: true,
      data: both,
      meta: {
        timestamp: Date.now(),
        version: '1.0.0',
        wallet,
        bridge: 'Both formats generated - ready for bridge demo',
      },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Bridge both error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate reports',
    } as ApiResponse);
  }
});

/**
 * GET /api/bridge/compare/:wallet
 * 
 * Get comparison summary in human-readable format
 * Useful for educational purposes and demo narration
 */
router.get('/compare/:wallet', async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;
    
    if (!wallet || !/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wallet address format',
      } as ApiResponse);
    }

    // Calculate credit score
    const creditScore = await calculateCreditScore(wallet);
    
    // Get comparison summary
    const summary = bridgeTranslator.generateComparisonSummary(creditScore);

    res.json({
      success: true,
      data: summary,
      meta: {
        timestamp: Date.now(),
        version: '1.0.0',
        bridge: 'Human-readable comparison',
      },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Bridge compare error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate comparison',
    } as ApiResponse);
  }
});

/**
 * GET /api/bridge/fico-to-tier/:fico
 * 
 * Helper endpoint: Convert FICO score to DeFi tier
 * For TradFi institutions exploring DeFi equivalents
 */
router.get('/fico-to-tier/:fico', (req: Request, res: Response) => {
  try {
    const ficoScore = parseInt(req.params.fico, 10);
    
    if (isNaN(ficoScore) || ficoScore < 300 || ficoScore > 850) {
      return res.status(400).json({
        success: false,
        error: 'Invalid FICO score (must be 300-850)',
      } as ApiResponse);
    }

    const result = bridgeTranslator.ficoToTier(ficoScore);

    res.json({
      success: true,
      data: {
        input: { ficoScore },
        output: result,
        explanation: `FICO ${ficoScore} maps to ${result.tierName} tier with ${(result.collateralRatio * 100)}% collateral`,
      },
      meta: {
        timestamp: Date.now(),
        bridge: 'FICO → Tier conversion',
      },
    } as ApiResponse);
  } catch (error: any) {
    console.error('FICO to tier error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to convert FICO to tier',
    } as ApiResponse);
  }
});

/**
 * GET /api/bridge/tier-to-fico/:tier
 * 
 * Helper endpoint: Convert DeFi tier to FICO range
 * For DeFi protocols communicating with TradFi
 */
router.get('/tier-to-fico/:tier', (req: Request, res: Response) => {
  try {
    const tierName = req.params.tier.toLowerCase();
    const tierMap: Record<string, number> = {
      'bronze': 1,
      'silver': 2,
      'gold': 3,
      'platinum': 4,
      'diamond': 5,
    };

    const tierNumber = tierMap[tierName];
    if (tierNumber === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tier (must be bronze/silver/gold/platinum/diamond)',
      } as ApiResponse);
    }

    const result = bridgeTranslator.tierToFico(tierNumber);

    res.json({
      success: true,
      data: {
        input: { tier: tierName },
        output: result,
        explanation: `${tierName.charAt(0).toUpperCase() + tierName.slice(1)} tier corresponds to FICO ${result.ficoMin}-${result.ficoMax} (mid: ${result.ficoMid})`,
      },
      meta: {
        timestamp: Date.now(),
        bridge: 'Tier → FICO conversion',
      },
    } as ApiResponse);
  } catch (error: any) {
    console.error('Tier to FICO error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to convert tier to FICO',
    } as ApiResponse);
  }
});

export default router;
