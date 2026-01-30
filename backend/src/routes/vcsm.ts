/**
 * VCSM API Routes
 * 
 * Endpoints for the Verifiable Credit State Machine:
 * - POST /api/vcsm/init          → Initialize user state
 * - GET /api/vcsm/state/:userId  → Get current state
 * - POST /api/vcsm/transition    → Execute upgrade transition
 * - GET /api/vcsm/simulate       → Simulate transition (check requirements)
 * - GET /api/vcsm/history/:userId → Get state history
 * - GET /api/vcsm/rules          → Get upgrade rules
 * - GET /api/vcsm/verify/:userId → Verify hash chain
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { vcsmService, formatStateForResponse, getAllUpgradeRules } from '../services/vcsm/index.js';
import { creditScoringService } from '../services/creditScoring.js';
import { LEVEL_NAMES, CreditLevel } from '../types/index.js';

const router = Router();

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const walletSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

const initSchema = z.object({
  userId: walletSchema,
  initialScore: z.number().min(0).max(100).optional(),
});

const transitionSchema = z.object({
  userId: walletSchema,
  ruleId: z.string(),
  newScore: z.number().min(0).max(100).optional(),
  sybilScore: z.number().min(0).max(100).optional(),
  evidence: z.object({
    eventType: z.string(),
    eventData: z.record(z.any()),
  }).optional(),
});

// =============================================================================
// ROUTES
// =============================================================================

/**
 * POST /api/vcsm/init
 * 
 * Initialize credit state for a user.
 * If wallet provided, calculates initial score from chain data.
 */
router.post('/init', async (req: Request, res: Response) => {
  try {
    const validation = initSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: validation.error.errors[0].message,
        meta: { timestamp: Date.now() },
      });
    }

    const { userId, initialScore } = validation.data;

    // If no score provided, calculate from chain data
    let score = initialScore;
    if (score === undefined) {
      try {
        const creditScore = await creditScoringService.calculateScore(userId);
        score = creditScore.score;
      } catch {
        score = 50; // Default mid-range
      }
    }

    console.log(`[VCSM] Initializing state for ${userId.slice(0, 10)} with score ${score}`);

    const state = await vcsmService.initializeState(userId, score);

    return res.json({
      success: true,
      data: formatStateForResponse(state),
      meta: { timestamp: Date.now() },
    });

  } catch (error) {
    console.error('[VCSM] Init error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize state',
      meta: { timestamp: Date.now() },
    });
  }
});

/**
 * GET /api/vcsm/state/:userId
 * 
 * Get current credit state for a user.
 * Returns formatted state (hides internal data like salt).
 */
router.get('/state/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const validation = walletSchema.safeParse(userId);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
        meta: { timestamp: Date.now() },
      });
    }

    const state = vcsmService.getState(userId);
    if (!state) {
      return res.status(404).json({
        success: false,
        error: 'State not found. Call POST /api/vcsm/init first.',
        meta: { timestamp: Date.now() },
      });
    }

    return res.json({
      success: true,
      data: formatStateForResponse(state),
      meta: { timestamp: Date.now() },
    });

  } catch (error) {
    console.error('[VCSM] Get state error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get state',
      meta: { timestamp: Date.now() },
    });
  }
});

/**
 * POST /api/vcsm/transition
 * 
 * Execute a state transition (upgrade).
 * Requires meeting all conditions in the rule.
 * Generates ZK proof for the transition.
 */
router.post('/transition', async (req: Request, res: Response) => {
  try {
    const validation = transitionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: validation.error.errors[0].message,
        meta: { timestamp: Date.now() },
      });
    }

    const { userId, ruleId, newScore, sybilScore, evidence } = validation.data;

    // Get current score if not provided
    let scoreToUse = newScore;
    if (scoreToUse === undefined) {
      try {
        const creditScore = await creditScoringService.calculateScore(userId);
        scoreToUse = creditScore.score;
      } catch {
        return res.status(400).json({
          success: false,
          error: 'Could not determine new score. Please provide newScore parameter.',
          meta: { timestamp: Date.now() },
        });
      }
    }

    console.log(`[VCSM] Transition request: ${userId.slice(0, 10)}, rule=${ruleId}, score=${scoreToUse}`);

    const result = await vcsmService.executeTransition(
      userId,
      ruleId,
      scoreToUse,
      sybilScore || 50,
      evidence
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        data: {
          currentState: result.fromState ? formatStateForResponse(result.fromState) : null,
        },
        meta: { timestamp: Date.now() },
      });
    }

    return res.json({
      success: true,
      data: {
        fromLevel: LEVEL_NAMES[result.fromState.level],
        toLevel: LEVEL_NAMES[result.toState!.level],
        fromState: formatStateForResponse(result.fromState),
        toState: formatStateForResponse(result.toState!),
        proof: result.proof ? {
          available: true,
          publicSignals: result.proof.publicSignals,
        } : {
          available: false,
        },
      },
      meta: { timestamp: Date.now() },
    });

  } catch (error) {
    console.error('[VCSM] Transition error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to execute transition',
      meta: { timestamp: Date.now() },
    });
  }
});

/**
 * GET /api/vcsm/simulate
 * 
 * Simulate a transition without executing.
 * Shows what's needed to reach target level.
 */
router.get('/simulate', async (req: Request, res: Response) => {
  try {
    const { userId, targetLevel, sybilScore } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: userId',
        meta: { timestamp: Date.now() },
      });
    }

    const target = parseInt(targetLevel as string) || 3; // Default to Gold
    const sybil = parseInt(sybilScore as string) || 50;

    const result = await vcsmService.simulateTransition(userId, target as CreditLevel, sybil);

    return res.json({
      success: true,
      data: {
        ...result,
        currentLevelName: LEVEL_NAMES[result.currentLevel],
        targetLevelName: LEVEL_NAMES[result.targetLevel],
      },
      meta: { timestamp: Date.now() },
    });

  } catch (error) {
    console.error('[VCSM] Simulate error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to simulate transition',
      meta: { timestamp: Date.now() },
    });
  }
});

/**
 * GET /api/vcsm/history/:userId
 * 
 * Get state transition history for a user.
 */
router.get('/history/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const history = vcsmService.getStateHistory(userId);
    
    if (history.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No history found',
        meta: { timestamp: Date.now() },
      });
    }

    return res.json({
      success: true,
      data: {
        userId,
        totalTransitions: history.length - 1, // Subtract genesis state
        states: history.map(formatStateForResponse),
      },
      meta: { timestamp: Date.now() },
    });

  } catch (error) {
    console.error('[VCSM] History error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get history',
      meta: { timestamp: Date.now() },
    });
  }
});

/**
 * GET /api/vcsm/verify/:userId
 * 
 * Verify hash chain integrity for a user.
 */
router.get('/verify/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await vcsmService.verifyHashChain(userId);

    return res.json({
      success: true,
      data: {
        userId,
        chainValid: result.valid,
        chainLength: result.chainLength,
        brokenAt: result.brokenAt,
        message: result.valid 
          ? 'Hash chain is valid and unbroken'
          : `Hash chain broken at position ${result.brokenAt}`,
      },
      meta: { timestamp: Date.now() },
    });

  } catch (error) {
    console.error('[VCSM] Verify error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify chain',
      meta: { timestamp: Date.now() },
    });
  }
});

/**
 * GET /api/vcsm/rules
 * 
 * Get all upgrade rules and requirements.
 */
router.get('/rules', (_req: Request, res: Response) => {
  const rules = getAllUpgradeRules();

  return res.json({
    success: true,
    data: {
      rules: rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        fromLevel: rule.fromLevel,
        fromLevelName: typeof rule.fromLevel === 'number' ? LEVEL_NAMES[rule.fromLevel] : 'ANY',
        toLevel: rule.toLevel,
        toLevelName: LEVEL_NAMES[rule.toLevel],
        conditions: rule.conditions,
        zkRequirements: rule.circuitParams,
      })),
      levels: Object.entries(LEVEL_NAMES)
        .filter(([key]) => parseInt(key) > 0)
        .map(([key, name]) => ({
          level: parseInt(key),
          name,
        })),
    },
    meta: { timestamp: Date.now() },
  });
});

/**
 * GET /api/vcsm/stats
 * 
 * Get VCSM service statistics.
 */
router.get('/stats', (_req: Request, res: Response) => {
  const stats = vcsmService.getStats();

  return res.json({
    success: true,
    data: stats,
    meta: { timestamp: Date.now() },
  });
});

export default router;
