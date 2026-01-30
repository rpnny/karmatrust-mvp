/**
 * Credit Scoring API Routes
 * 
 * Endpoints:
 * - GET /api/credit/score?wallet=0x...  → Calculate credit score
 * - POST /api/credit/attest             → Create EAS attestation (next commit)
 * - GET /api/credit/explain/:wallet     → Get score explanation
 * 
 * Response Format:
 * All responses follow the ApiResponse<T> format:
 * {
 *   success: boolean,
 *   data?: T,
 *   error?: string,
 *   meta?: { timestamp, version }
 * }
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { creditScoringService } from '../services/creditScoring.js';
import { easAttestationService } from '../services/easAttestation.js';
import { scoreToFICO } from '../types/index.js';

const router = Router();

// =============================================================================
// REQUEST VALIDATION
// =============================================================================

/**
 * Wallet address validation schema
 * 
 * Requirements:
 * - Must start with '0x'
 * - Must be 42 characters (0x + 40 hex chars)
 * - Must be valid hex
 */
const walletSchema = z.string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address format');

// =============================================================================
// ROUTES
// =============================================================================

/**
 * GET /api/credit/score
 * 
 * Calculate credit score for a wallet address.
 * 
 * Query Parameters:
 * - wallet: Ethereum address (required)
 * 
 * Response:
 * - score: Internal score (0-100)
 * - level: Credit level (1-5)
 * - levelName: Human-readable level
 * - risk: Risk level (Low/Medium/High)
 * - factors: Breakdown of scoring factors
 * - ficoDisplay: FICO-style score for UI (300-850)
 * - dataSource: Where data came from
 * - trustLevel: Confidence in data (0-100)
 * 
 * Example:
 * GET /api/credit/score?wallet=0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
 */
router.get('/score', async (req: Request, res: Response) => {
  try {
    // Validate wallet parameter
    const { wallet } = req.query;
    
    if (!wallet || typeof wallet !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: wallet',
        meta: { timestamp: Date.now() },
      });
    }

    // Validate address format
    const validationResult = walletSchema.safeParse(wallet);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: validationResult.error.errors[0].message,
        meta: { timestamp: Date.now() },
      });
    }

    // Calculate score
    console.log(`[Credit] Calculating score for ${wallet.slice(0, 10)}...`);
    const startTime = Date.now();
    
    const scoreResult = await creditScoringService.calculateScore(wallet);
    
    const processingTime = Date.now() - startTime;
    console.log(`[Credit] Score calculated in ${processingTime}ms: ${scoreResult.score} (${scoreResult.levelName})`);

    // Return response with FICO display value
    return res.json({
      success: true,
      data: {
        ...scoreResult,
        ficoDisplay: scoreToFICO(scoreResult.score), // For UI display only
      },
      meta: {
        timestamp: Date.now(),
        version: '0.1.0-mvp',
        processingTimeMs: processingTime,
      },
    });

  } catch (error) {
    console.error('[Credit] Error calculating score:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate credit score',
      meta: { timestamp: Date.now() },
    });
  }
});

/**
 * GET /api/credit/explain/:wallet
 * 
 * Get detailed explanation of score calculation.
 * Useful for transparency and debugging.
 * 
 * Response:
 * - finalScore: The calculated score
 * - baseScore: Starting score (50)
 * - factors: Array of factor contributions
 *   - factor: Name
 *   - contribution: +/- points
 *   - explanation: Human-readable description
 */
router.get('/explain/:wallet', async (req: Request, res: Response) => {
  try {
    const { wallet } = req.params;

    // Validate address
    const validationResult = walletSchema.safeParse(wallet);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: validationResult.error.errors[0].message,
        meta: { timestamp: Date.now() },
      });
    }

    // Get score and explanation
    // Note: This makes two calls (score + explain), could be optimized
    const scoreResult = await creditScoringService.calculateScore(wallet);
    
    // Get the analysis data for explanation
    // For MVP, we'll use simplified explanation
    const explanation = {
      finalScore: scoreResult.score,
      baseScore: 50,
      level: scoreResult.levelName,
      risk: scoreResult.risk,
      dataSource: scoreResult.dataSource,
      trustLevel: scoreResult.trustLevel,
      factorBreakdown: [
        {
          factor: 'Wallet Age',
          normalized: scoreResult.factors.wallet_age,
          explanation: `${Math.round(scoreResult.factors.wallet_age * 730)} days old`,
        },
        {
          factor: 'Transaction Frequency',
          normalized: scoreResult.factors.transaction_frequency,
          explanation: `${Math.round(scoreResult.factors.transaction_frequency * 500)} transactions`,
        },
        {
          factor: 'Protocol Diversity',
          normalized: scoreResult.factors.protocol_diversity,
          explanation: `${Math.round(scoreResult.factors.protocol_diversity * 20)} protocols used`,
        },
        {
          factor: 'Asset Value',
          normalized: scoreResult.factors.asset_value,
          explanation: `${(scoreResult.factors.asset_value * 100).toFixed(1)} ETH`,
        },
        {
          factor: 'Volatility',
          normalized: scoreResult.factors.volatility,
          explanation: `${(scoreResult.factors.volatility * 100).toFixed(0)}% volatility score`,
        },
        {
          factor: 'Stability',
          normalized: scoreResult.factors.stability,
          explanation: scoreResult.factors.stability > 0.5 ? 'Active account' : 'Limited recent activity',
        },
      ],
    };

    return res.json({
      success: true,
      data: explanation,
      meta: { timestamp: Date.now() },
    });

  } catch (error) {
    console.error('[Credit] Error generating explanation:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate explanation',
      meta: { timestamp: Date.now() },
    });
  }
});

/**
 * GET /api/credit/weights
 * 
 * Get the current scoring weights (for transparency).
 * Shows how each factor contributes to the score.
 */
router.get('/weights', (_req: Request, res: Response) => {
  const weights = creditScoringService.getWeights();
  
  return res.json({
    success: true,
    data: {
      weights,
      note: 'MVP weights are hand-tuned. Production will use ML optimization.',
      scoreRange: {
        min: 0,
        max: 100,
        base: 50,
      },
      levelThresholds: {
        Bronze: '0-39',
        Silver: '40-59',
        Gold: '60-79',
        Platinum: '80-89',
        Diamond: '90-100',
      },
    },
    meta: { timestamp: Date.now() },
  });
});

/**
 * POST /api/credit/attest
 * 
 * Create an EAS attestation for the wallet's credit score.
 * 
 * Request Body:
 * - wallet: Ethereum address (required)
 * 
 * Response:
 * - score: The calculated credit score
 * - attestation: EAS attestation result
 *   - attestationId: The on-chain attestation UID
 *   - explorerUrl: Link to view on EASScan
 *   - isSimulated: Whether this is a simulated attestation
 * 
 * Operating Modes:
 * - Real: Creates on-chain attestation (requires PRIVATE_KEY env var)
 * - Simulation: Returns mock attestation (default, for demos)
 */
router.post('/attest', async (req: Request, res: Response) => {
  try {
    const { wallet } = req.body;

    // Validate wallet
    if (!wallet || typeof wallet !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: wallet',
        meta: { timestamp: Date.now() },
      });
    }

    const validationResult = walletSchema.safeParse(wallet);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: validationResult.error.errors[0].message,
        meta: { timestamp: Date.now() },
      });
    }

    console.log(`[Credit] Creating attestation for ${wallet.slice(0, 10)}...`);
    const startTime = Date.now();

    // Calculate score first
    const scoreResult = await creditScoringService.calculateScore(wallet);

    // Create attestation
    const attestation = await easAttestationService.createAttestation({
      ...scoreResult,
      score: scoreResult.score, // Internal score
    });

    const processingTime = Date.now() - startTime;
    console.log(`[Credit] Attestation created in ${processingTime}ms`);

    return res.json({
      success: true,
      data: {
        score: {
          ...scoreResult,
          ficoDisplay: scoreToFICO(scoreResult.score),
        },
        attestation,
      },
      meta: {
        timestamp: Date.now(),
        version: '0.1.0-mvp',
        processingTimeMs: processingTime,
      },
    });

  } catch (error) {
    console.error('[Credit] Error creating attestation:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create attestation',
      meta: { timestamp: Date.now() },
    });
  }
});

/**
 * GET /api/credit/attestation/:id/verify
 * 
 * Verify an existing attestation.
 * 
 * Response:
 * - valid: Whether the attestation exists
 * - revoked: Whether it has been revoked
 * - data: Attestation details (if valid)
 */
router.get('/attestation/:id/verify', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || !/^0x[a-fA-F0-9]{64}$/.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid attestation ID format',
        meta: { timestamp: Date.now() },
      });
    }

    const verification = await easAttestationService.verifyAttestation(id);

    return res.json({
      success: true,
      data: verification,
      meta: { timestamp: Date.now() },
    });

  } catch (error) {
    console.error('[Credit] Error verifying attestation:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify attestation',
      meta: { timestamp: Date.now() },
    });
  }
});

/**
 * GET /api/credit/eas/status
 * 
 * Get EAS service status and configuration.
 */
router.get('/eas/status', (_req: Request, res: Response) => {
  const status = easAttestationService.getStatus();
  const schema = easAttestationService.getSchema();

  return res.json({
    success: true,
    data: {
      ...status,
      schema: {
        raw: schema.raw,
        uid: schema.uid,
      },
    },
    meta: { timestamp: Date.now() },
  });
});

export default router;
