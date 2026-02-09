/**
 * Reclaim Protocol API Routes
 * 
 * Handles zkTLS proof verification and credit data extraction.
 * This is the "TradFi data bridge" - users prove their off-chain 
 * financial data using Reclaim Protocol's zkTLS proofs.
 * 
 * Endpoints:
 * - GET  /api/reclaim/status     - Service status and available providers
 * - GET  /api/reclaim/providers  - List available data providers
 * - POST /api/reclaim/verify     - Verify a Reclaim proof
 * - POST /api/reclaim/translate  - Verify proof + translate to credit factor
 */

import { Router } from 'express';
import { ReclaimProviderService } from '../services/reclaimProvider';

const router = Router();
const reclaimService = new ReclaimProviderService();

/**
 * GET /api/reclaim/status
 * Returns service status and configuration
 */
router.get('/status', (_req, res) => {
  const status = reclaimService.getStatus();
  res.json({
    data: status,
    meta: { timestamp: Date.now() },
  });
});

/**
 * GET /api/reclaim/providers
 * Returns list of available data providers
 */
router.get('/providers', (_req, res) => {
  const providers = reclaimService.getProviders();
  res.json({
    data: providers,
    meta: { timestamp: Date.now(), count: providers.length },
  });
});

/**
 * POST /api/reclaim/verify
 * Verify a Reclaim zkTLS proof
 * 
 * Body: { proof: ReclaimProof }
 * Returns: { isValid, extractedData, error? }
 */
router.post('/verify', async (req, res) => {
  try {
    const { proof } = req.body;
    
    if (!proof) {
      return res.status(400).json({
        error: 'Missing proof in request body',
        meta: { timestamp: Date.now() },
      });
    }

    const result = await reclaimService.verifyProof(proof);
    
    res.json({
      data: result,
      meta: { timestamp: Date.now() },
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Verification failed: ' + err.message,
      meta: { timestamp: Date.now() },
    });
  }
});

/**
 * POST /api/reclaim/translate
 * Verify a Reclaim proof AND translate to credit factor.
 * This is the end-to-end "TradFi -> DeFi bridge" endpoint.
 * 
 * Body: { proof: ReclaimProof }
 * Returns: { verification, creditFactor }
 */
router.post('/translate', async (req, res) => {
  try {
    const { proof } = req.body;
    
    if (!proof) {
      return res.status(400).json({
        error: 'Missing proof in request body',
        meta: { timestamp: Date.now() },
      });
    }

    // Step 1: Verify the proof
    const verification = await reclaimService.verifyProof(proof);
    
    if (!verification.isValid || !verification.extractedData) {
      return res.json({
        data: {
          verification,
          creditFactor: null,
        },
        meta: { timestamp: Date.now() },
      });
    }

    // Step 2: Translate to credit factor
    const creditFactor = reclaimService.translateToCreditFactor(verification.extractedData);

    res.json({
      data: {
        verification,
        creditFactor,
      },
      meta: { timestamp: Date.now() },
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Translation failed: ' + err.message,
      meta: { timestamp: Date.now() },
    });
  }
});

export default router;
