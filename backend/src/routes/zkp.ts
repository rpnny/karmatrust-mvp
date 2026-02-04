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
import { isAddress } from 'ethers';
import { zkProofService } from '../services/zkProof.js';
import { creditScoringService } from '../services/creditScoring.js';
import { easAttestationServiceV2 } from '../services/easAttestationV2.js';
import { CreditLevel, LEVEL_NAMES } from '../types/index.js';

const router = Router();

// =============================================================================
// VALIDATION SCHEMAS
// =============================================================================

const walletSchema = z.string().refine(
  (addr) => isAddress(addr),
  { message: 'Invalid Ethereum address' }
);

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
 * - salt: (optional) User-provided salt for Privacy Mode
 * - commitment: (optional) Expected commitment from EAS for Privacy Mode
 * 
 * Response:
 * - proof: The ZK proof (pi_a, pi_b, pi_c)
 * - publicSignals: Public inputs (tier, lowerBound, upperBound, commitment)
 * - commitment: The score commitment (Poseidon hash)
 * - salt: The salt used (returned for verification)
 * - tier: The tier being proven
 * - tierName: Human-readable tier name
 * - isSimulated: Whether this is a simulation
 * 
 * Two modes:
 * 1. Public Mode: Generate new salt (default)
 * 2. Privacy Mode: Use provided salt + commitment (validates against EAS)
 * 
 * This is the KEY PRIVACY FEATURE:
 * - User generates proof of tier membership
 * - Shares only the proof, not the score
 * - Verifier learns "user is in Gold tier"
 * - Verifier does NOT learn "user has score 75"
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { wallet, tier: requestedTier, salt, commitment } = req.body;

    // Validate wallet - provide clear error message with example
    if (!wallet || typeof wallet !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: wallet. Please provide an Ethereum address.',
        hint: 'Example request body: { "wallet": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" }',
        meta: { timestamp: Date.now() },
      });
    }

    const validationResult = walletSchema.safeParse(wallet);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format. Must be a valid 0x-prefixed address.',
        provided: wallet,
        hint: 'Example: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
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

    // Determine mode (Public or Privacy)
    const isPrivacyMode = !!(salt && commitment);
    if (isPrivacyMode) {
      console.log(`[ZKP] Privacy Mode enabled: Verifying provided salt against commitment`);
    }

    // Generate the proof
    const proofResult = await zkProofService.generateProof(
      scoreResult.score,
      tierToProve,
      salt,          // Optional: User-provided salt for Privacy Mode
      commitment     // Optional: Expected commitment for validation
    );

    const processingTime = Date.now() - startTime;
    console.log(`[ZKP] Proof generated in ${processingTime}ms (${proofResult.isSimulated ? 'simulated' : 'real'})`);

    return res.json({
      success: true,
      data: {
        proof: proofResult.proof,
        publicSignals: proofResult.publicSignals,
        commitment: proofResult.commitment,
        salt: proofResult.salt,
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
 * POST /api/zkp/verify-with-attestation
 * 
 * Verify a ZK proof AND check commitment on-chain (SECURE version).
 * 
 * This is the CORRECT way to verify Privacy Mode proofs:
 * 1. Verify ZK proof is mathematically valid
 * 2. Read commitment from on-chain EAS attestation
 * 3. Verify proof's commitment matches on-chain commitment
 * 4. Check attestation hasn't been revoked
 * 
 * Request Body:
 * - proof: The ZK proof to verify
 * - publicSignals: Public inputs (tier, bounds, commitment)
 * - attestationId: The EAS attestation UID to verify against
 * 
 * Response:
 * - valid: Whether ALL checks passed
 * - tier: The tier being proven
 * - onChainVerified: Whether commitment was verified on-chain
 * - reason: Why verification failed (if applicable)
 * 
 * SECURITY:
 * Without this on-chain check, users could generate fake commitments.
 * This endpoint prevents forgery by anchoring proofs to on-chain attestations.
 */
router.post('/verify-with-attestation', async (req: Request, res: Response) => {
  try {
    const { proof, publicSignals, attestationId } = req.body;

    // Validate required fields
    if (!proof || !publicSignals || !attestationId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: proof, publicSignals, attestationId',
        meta: { timestamp: Date.now() },
      });
    }

    console.log(`[ZKP] Verifying proof with on-chain attestation: ${attestationId.slice(0, 20)}...`);
    const startTime = Date.now();

    // Step 1: Verify ZK proof mathematics
    console.log('[ZKP] Step 1: Verifying ZK proof...');
    const proofResult = await zkProofService.verifyProof(
      { ...proof, publicSignals },
      publicSignals
    );

    if (!proofResult.valid) {
      console.log('[ZKP] ❌ ZK proof verification failed');
      return res.json({
        success: true,
        data: {
          valid: false,
          reason: 'Invalid ZK proof - cryptographic verification failed',
          tier: proofResult.tier,
          tierName: LEVEL_NAMES[proofResult.tier],
          onChainVerified: false,
        },
        meta: {
          timestamp: Date.now(),
          processingTimeMs: Date.now() - startTime,
        },
      });
    }

    console.log('[ZKP] ✅ ZK proof is mathematically valid');

    // Step 2: Read commitment from on-chain attestation
    console.log('[ZKP] Step 2: Reading on-chain attestation...');
    const onChainData = await easAttestationServiceV2.getCommitmentAttestation(attestationId);

    if (!onChainData) {
      console.log('[ZKP] ❌ Attestation not found on-chain');
      return res.json({
        success: true,
        data: {
          valid: false,
          reason: 'Attestation not found on-chain - may not exist or invalid ID',
          tier: proofResult.tier,
          tierName: LEVEL_NAMES[proofResult.tier],
          onChainVerified: false,
        },
        meta: {
          timestamp: Date.now(),
          processingTimeMs: Date.now() - startTime,
        },
      });
    }

    console.log('[ZKP] ✅ Attestation found on-chain');

    // Step 3: Verify commitment matches
    console.log('[ZKP] Step 3: Verifying commitment match...');
    const proofCommitment = publicSignals[3]; // commitment is the 4th public signal
    
    if (onChainData.commitment !== proofCommitment) {
      console.log('[ZKP] ❌ Commitment mismatch');
      console.log(`[ZKP]   Proof commitment:    ${proofCommitment}`);
      console.log(`[ZKP]   On-chain commitment: ${onChainData.commitment}`);
      return res.json({
        success: true,
        data: {
          valid: false,
          reason: 'Commitment mismatch - proof does not match on-chain attestation',
          tier: proofResult.tier,
          tierName: LEVEL_NAMES[proofResult.tier],
          onChainVerified: false,
        },
        meta: {
          timestamp: Date.now(),
          processingTimeMs: Date.now() - startTime,
        },
      });
    }

    console.log('[ZKP] ✅ Commitment matches on-chain attestation');

    // Step 4: Check attestation hasn't been revoked
    console.log('[ZKP] Step 4: Checking revocation status...');
    if (onChainData.revoked) {
      console.log('[ZKP] ❌ Attestation has been revoked');
      return res.json({
        success: true,
        data: {
          valid: false,
          reason: 'Attestation has been revoked - no longer valid',
          tier: proofResult.tier,
          tierName: LEVEL_NAMES[proofResult.tier],
          onChainVerified: false,
        },
        meta: {
          timestamp: Date.now(),
          processingTimeMs: Date.now() - startTime,
        },
      });
    }

    console.log('[ZKP] ✅ Attestation is not revoked');

    // All checks passed! 🎉
    const processingTime = Date.now() - startTime;
    console.log(`[ZKP] 🎉 ALL CHECKS PASSED in ${processingTime}ms`);
    console.log(`[ZKP]   ✓ ZK proof valid`);
    console.log(`[ZKP]   ✓ Attestation exists on-chain`);
    console.log(`[ZKP]   ✓ Commitment matches`);
    console.log(`[ZKP]   ✓ Not revoked`);

    return res.json({
      success: true,
      data: {
        valid: true,
        tier: proofResult.tier,
        tierName: LEVEL_NAMES[proofResult.tier],
        bounds: proofResult.bounds,
        onChainVerified: true,
        attestationId,
        recipient: onChainData.recipient,
        minTier: onChainData.minTier,
        isSimulated: proofResult.isSimulated,
        message: `Proof and on-chain commitment verified: User is in ${LEVEL_NAMES[proofResult.tier]} tier (score ${proofResult.bounds.lower}-${proofResult.bounds.upper})`,
      },
      meta: {
        timestamp: Date.now(),
        processingTimeMs: processingTime,
      },
    });

  } catch (error) {
    console.error('[ZKP] Error in verify-with-attestation:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Verification failed',
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
