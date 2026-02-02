/**
 * Contract Routes
 * 
 * Endpoints for interacting with KarmaTrust smart contracts on Sepolia.
 * 
 * Routes:
 * - GET /api/contracts/info - Contract addresses and info
 * - GET /api/contracts/state/:wallet - User's credit state
 * - GET /api/contracts/lending/position/:wallet - Loan position
 * - GET /api/contracts/lending/collateral - Calculate required collateral
 * - GET /api/contracts/lending/savings - Calculate collateral savings
 * - GET /api/contracts/lending/stats - Protocol stats
 * - GET /api/contracts/lending/tiers - All tier configs
 * - POST /api/contracts/attest-state - Attest a new credit state (requires key)
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { isAddress } from 'ethers';
import { contractService } from '../services/contracts/contractService.js';

const router = Router();

// =========================================================================
// REQUEST VALIDATORS
// =========================================================================

const addressValidator = z.string().refine(
  (addr) => isAddress(addr),
  { message: 'Invalid Ethereum address' }
);

const walletSchema = z.object({
  wallet: addressValidator,
});

const collateralQuerySchema = z.object({
  wallet: addressValidator,
  amount: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid amount'),
});

const savingsQuerySchema = z.object({
  tier: z.string().regex(/^[1-5]$/, 'Tier must be 1-5'),
  amount: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid amount'),
});

const attestStateSchema = z.object({
  wallet: addressValidator,
  stateHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid state hash'),
  level: z.number().int().min(1).max(5),
});

// =========================================================================
// ROUTES
// =========================================================================

/**
 * GET /api/contracts/info
 * Get contract addresses and network info
 */
router.get('/info', (req: Request, res: Response) => {
  try {
    const info = contractService.getContractInfo();
    res.json({
      success: true,
      data: info,
      meta: {
        timestamp: Date.now(),
        version: '1.0.0',
      },
    });
  } catch (error: any) {
    console.error('[API/Contracts] Error getting info:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/contracts/health
 * Check if contracts are accessible
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const isHealthy = await contractService.healthCheck();
    res.json({
      success: true,
      data: {
        healthy: isHealthy,
        timestamp: Date.now(),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/contracts/state/:wallet
 * Get user's credit state from VCSM contract
 */
router.get('/state/:wallet', async (req: Request, res: Response) => {
  try {
    const { wallet } = walletSchema.parse({ wallet: req.params.wallet });
    
    const state = await contractService.getUserState(wallet);
    
    res.json({
      success: true,
      data: state,
      meta: {
        timestamp: Date.now(),
        source: 'sepolia-contract',
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: error.errors,
      });
    }
    
    console.error('[API/Contracts] Error getting state:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/contracts/attest-state
 * Attest a new credit state for a user (requires PRIVATE_KEY)
 */
router.post('/attest-state', async (req: Request, res: Response) => {
  try {
    const { wallet, stateHash, level } = attestStateSchema.parse(req.body);
    
    const result = await contractService.attestUserState(wallet, stateHash, level);
    
    res.json({
      success: true,
      data: result,
      meta: {
        timestamp: Date.now(),
        action: 'state_attested',
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: error.errors,
      });
    }
    
    console.error('[API/Contracts] Error attesting state:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/contracts/lending/position/:wallet
 * Get user's loan position
 */
router.get('/lending/position/:wallet', async (req: Request, res: Response) => {
  try {
    const { wallet } = walletSchema.parse({ wallet: req.params.wallet });
    
    const position = await contractService.getLoanPosition(wallet);
    
    res.json({
      success: true,
      data: position,
      meta: {
        timestamp: Date.now(),
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: error.errors,
      });
    }
    
    console.error('[API/Contracts] Error getting position:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/contracts/lending/collateral?wallet=0x...&amount=1.5
 * Calculate required collateral for a borrow amount
 */
router.get('/lending/collateral', async (req: Request, res: Response) => {
  try {
    const { wallet, amount } = collateralQuerySchema.parse(req.query);
    
    const calculation = await contractService.calculateRequiredCollateral(wallet, amount);
    
    res.json({
      success: true,
      data: calculation,
      meta: {
        timestamp: Date.now(),
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: error.errors,
      });
    }
    
    console.error('[API/Contracts] Error calculating collateral:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/contracts/lending/savings?tier=3&amount=10
 * Calculate collateral savings for a tier
 */
router.get('/lending/savings', async (req: Request, res: Response) => {
  try {
    const { tier, amount } = savingsQuerySchema.parse(req.query);
    
    const savings = await contractService.getCollateralSavings(parseInt(tier), amount);
    
    res.json({
      success: true,
      data: savings,
      meta: {
        timestamp: Date.now(),
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        details: error.errors,
      });
    }
    
    console.error('[API/Contracts] Error calculating savings:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/contracts/lending/stats
 * Get protocol-wide lending statistics
 */
router.get('/lending/stats', async (req: Request, res: Response) => {
  try {
    const stats = await contractService.getLendingStats();
    
    res.json({
      success: true,
      data: stats,
      meta: {
        timestamp: Date.now(),
      },
    });
  } catch (error: any) {
    console.error('[API/Contracts] Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/contracts/lending/tiers
 * Get all tier configurations
 */
router.get('/lending/tiers', async (req: Request, res: Response) => {
  try {
    const tiers = await Promise.all([
      contractService.getTierConfig(1),
      contractService.getTierConfig(2),
      contractService.getTierConfig(3),
      contractService.getTierConfig(4),
      contractService.getTierConfig(5),
    ]);
    
    res.json({
      success: true,
      data: tiers,
      meta: {
        timestamp: Date.now(),
        count: tiers.length,
      },
    });
  } catch (error: any) {
    console.error('[API/Contracts] Error getting tiers:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
