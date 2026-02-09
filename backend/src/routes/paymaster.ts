/**
 * Paymaster API Routes
 * 
 * Gas sponsorship endpoints for CreditRegistryV2 proof submissions.
 * Allows users to submit ZK proofs without paying gas.
 * 
 * Endpoints:
 * - GET  /api/paymaster/status   - Paymaster status (balance, limits)
 * - POST /api/paymaster/sponsor  - Sponsor a proof submission
 */

import { Router } from 'express';
import { PaymasterService } from '../services/paymaster';

const router = Router();
const paymasterService = new PaymasterService();

/**
 * GET /api/paymaster/status
 * Returns paymaster status, balance, and daily usage
 */
router.get('/status', async (_req, res) => {
  try {
    const status = await paymasterService.getStatus();
    res.json({
      data: status,
      meta: { timestamp: Date.now() },
    });
  } catch (err: any) {
    res.status(500).json({
      error: 'Failed to get status: ' + err.message,
      meta: { timestamp: Date.now() },
    });
  }
});

/**
 * POST /api/paymaster/sponsor
 * Sponsor a proof submission for a user.
 * The paymaster submits the proof on-chain on behalf of the user.
 * 
 * Body: {
 *   userAddress: string,
 *   proof: {
 *     pA: [string, string],
 *     pB: [[string, string], [string, string]],
 *     pC: [string, string],
 *     pubSignals: [string, string, string, string]
 *   }
 * }
 */
router.post('/sponsor', async (req, res) => {
  try {
    const { userAddress, proof } = req.body;

    if (!userAddress || !proof) {
      return res.status(400).json({
        error: 'Missing userAddress or proof in request body',
        meta: { timestamp: Date.now() },
      });
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      return res.status(400).json({
        error: 'Invalid Ethereum address',
        meta: { timestamp: Date.now() },
      });
    }

    // Validate proof structure
    if (!proof.pA || !proof.pB || !proof.pC || !proof.pubSignals) {
      return res.status(400).json({
        error: 'Invalid proof structure. Expected: { pA, pB, pC, pubSignals }',
        meta: { timestamp: Date.now() },
      });
    }

    const result = await paymasterService.sponsorProofSubmission(userAddress, proof);

    if (result.success) {
      res.json({
        data: result,
        meta: { timestamp: Date.now() },
      });
    } else {
      res.status(400).json({
        error: result.error,
        meta: { timestamp: Date.now() },
      });
    }
  } catch (err: any) {
    res.status(500).json({
      error: 'Sponsorship failed: ' + err.message,
      meta: { timestamp: Date.now() },
    });
  }
});

export default router;
