/**
 * ZK Proof API Routes
 * 
 * Endpoints:
 * - POST /api/zkp/generate  → Generate tier membership proof
 * - POST /api/zkp/verify    → Verify a proof
 * - GET /api/zkp/status     → Service status
 * 
 * These endpoints enable the core privacy feature:
 * Users can prove their tier without revealing exact score.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { zkProofService } from '../services/zkProof.js';
import { creditScoringService } from '../services/creditScoring.js';
import { CreditLevel, LEVEL_NAMES } from '../types/index.js';

const router = Router();

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const walletSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

const verifySchema = z.object({
  proof: z.object({
    pi_a: z.array(z.string()),
    pi_b: z.array(z.array(z.string())),
    pi_c: z.array(z.string()),
    publicSignals: z.array(z.string()).optional(),
  }),
  publicSignals: z.array(z.string()),
});

// =============================================================================
// ROUTES
// =============================================================================

/**
 * POST /api/zkp/generate
 * 
 * Generate a ZK proof for tier membership.
 * 
 * Request Body:
 * - wallet: Ethereum address to generate proof for
 * - tier: (optional) Specific tier to prove. If omitted, uses actual tier.
 * 
 * Response:
 * - proof: The ZK proof (pi_a, pi_b, pi_c)
 * - publicSignals: Public inputs (tier, lowerBound, upperBound, commitment)
 * - commitment: The score commitment (Poseidon hash)
 * - tier: The tier being proven
 * - tierName: Human-readable tier name
 * - isSimulated: Whether this is a simulation
 * 
 * This is the KEY PRIVACY FEATURE:
 * - User generates proof of tier membership
 * - Shares only the proof, not the score
 * - Verifier learns "user is in Gold tier"
 * - Verifier does NOT learn "user has score 75"
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { wallet, tier: requestedTier } = req.body;

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

    console.log(`[ZKP] Generating proof for ${wallet.slice(0, 10)}...`);
    const startTime = Date.now();

    // Get the user's actual credit score
    const scoreResult = await creditScoringService.calculateScore(wallet);
    const actualTier = scoreResult.level;

    // Determine which tier to prove
    // User can only prove their actual tier or lower
    let tierToProve = actualTier;
    if (requestedTier !== undefined) {
      const requested = parseInt(requestedTier);
      if (requested < 1 || requested > 5) {
        return res.status(400).json({
          success: false,
          error: 'Invalid tier. Must be 1-5.',
          meta: { timestamp: Date.now() },
        });
      }
      if (requested > actualTier) {
        return res.status(400).json({
          success: false,
          error: `Cannot prove tier ${requested}. Your actual tier is ${actualTier} (${LEVEL_NAMES[actualTier]}).`,
          meta: { timestamp: Date.now() },
        });
      }
      tierToProve = requested;
    }

    // Generate the proof
    const proofResult = await zkProofService.generateProof(
      scoreResult.score,
      tierToProve
    );

    const processingTime = Date.now() - startTime;
    console.log(`[ZKP] Proof generated in ${processingTime}ms (${proofResult.isSimulated ? 'simulated' : 'real'})`);

    return res.json({
      success: true,
      data: {
        proof: proofResult.proof,
        publicSignals: proofResult.publicSignals,
        commitment: proofResult.commitment,
        tier: tierToProve,
        tierName: LEVEL_NAMES[tierToProve],
        bounds: zkProofService.getTierBounds(tierToProve),
        isSimulated: proofResult.isSimulated,
      },
      meta: {
        timestamp: Date.now(),
        processingTimeMs: processingTime,
      },
    });

  } catch (error) {
    console.error('[ZKP] Error generating proof:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate proof',
      meta: { timestamp: Date.now() },
    });
  }
});

/**
 * POST /api/zkp/verify
 * 
 * Verify a ZK proof.
 * 
 * Request Body:
 * - proof: The ZK proof to verify
 * - publicSignals: Public inputs
 * 
 * Response:
 * - valid: Whether the proof is valid
 * - tier: The tier being proven
 * - tierName: Human-readable tier name
 * - bounds: The score range being proven
 * 
 * IMPORTANT: This is what banks/DeFi protocols would call.
 * They learn ONLY whether the proof is valid.
 * They do NOT learn the exact score.
 */
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const validation = verifySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid proof format',
        details: validation.error.errors,
        meta: { timestamp: Date.now() },
      });
    }

    const { proof, publicSignals } = validation.data;

    console.log('[ZKP] Verifying proof...');
    const startTime = Date.now();

    const result = await zkProofService.verifyProof(
      { ...proof, publicSignals },
      publicSignals
    );

    const processingTime = Date.now() - startTime;
    console.log(`[ZKP] Verification complete in ${processingTime}ms: ${result.valid ? 'VALID' : 'INVALID'}`);

    return res.json({
      success: true,
      data: {
        valid: result.valid,
        tier: result.tier,
        tierName: LEVEL_NAMES[result.tier],
        bounds: result.bounds,
        isSimulated: result.isSimulated,
        message: result.valid 
          ? `Proof verified: User is in ${LEVEL_NAMES[result.tier]} tier (score ${result.bounds.lower}-${result.bounds.upper})`
          : 'Proof verification failed',
      },
      meta: {
        timestamp: Date.now(),
        processingTimeMs: processingTime,
      },
    });

  } catch (error) {
    console.error('[ZKP] Error verifying proof:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify proof',
      meta: { timestamp: Date.now() },
    });
  }
});

/**
 * GET /api/zkp/status
 * 
 * Get ZKP service status and configuration.
 */
router.get('/status', (_req: Request, res: Response) => {
  const status = zkProofService.getStatus();

  return res.json({
    success: true,
    data: {
      ...status,
      tiers: Object.entries(LEVEL_NAMES)
        .filter(([key]) => parseInt(key) > 0)
        .map(([key, name]) => ({
          tier: parseInt(key),
          name,
          bounds: zkProofService.getTierBounds(parseInt(key) as CreditLevel),
        })),
      note: status.mode === 'simulation'
        ? 'Running in simulation mode. Proofs are structurally valid but not cryptographically secure.'
        : 'Running in real mode with compiled ZK circuits.',
    },
    meta: { timestamp: Date.now() },
  });
});

/**
 * GET /api/zkp/tiers
 * 
 * Get tier definitions and bounds.
 */
router.get('/tiers', (_req: Request, res: Response) => {
  const tiers = Object.entries(LEVEL_NAMES)
    .filter(([key]) => parseInt(key) > 0)
    .map(([key, name]) => ({
      tier: parseInt(key),
      name,
      bounds: zkProofService.getTierBounds(parseInt(key) as CreditLevel),
    }));

  return res.json({
    success: true,
    data: { tiers },
    meta: { timestamp: Date.now() },
  });
});

export default router;
