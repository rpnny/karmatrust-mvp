/**
 * ProofVerifier Component
 * 
 * Verifies ZK proofs - this is what banks would use.
 * 
 * User Flow:
 * 1. Bank receives proof from user (copy/paste or API)
 * 2. Bank pastes proof into verifier
 * 3. Verifier checks proof validity
 * 4. Bank learns: "User is in Gold tier" or "Invalid proof"
 * 
 * What the bank learns:
 * - Whether the proof is valid
 * - What tier the user claims
 * - The score range for that tier
 * 
 * What the bank does NOT learn:
 * - The exact score
 * - Any other user data
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =============================================================================
// TYPES
// =============================================================================

interface VerificationResult {
  valid: boolean;
  tier: number;
  tierName: string;
  bounds: { lower: number; upper: number };
  isSimulated: boolean;
  message: string;
}

// =============================================================================
// API CONFIGURATION
// =============================================================================

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// =============================================================================
// COMPONENT
// =============================================================================

export default function ProofVerifier() {
  const [proofInput, setProofInput] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Verify the pasted proof
   */
  const verifyProof = async () => {
    if (!proofInput.trim()) {
      setError('Please paste a proof to verify');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Parse the proof JSON
      let parsedProof;
      try {
        parsedProof = JSON.parse(proofInput);
      } catch {
        setError('Invalid JSON format. Please paste a valid proof.');
        setLoading(false);
        return;
      }

      // Verify the proof
      const response = await fetch(`${API_BASE}/zkp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proof: parsedProof.proof,
          publicSignals: parsedProof.publicSignals || parsedProof.proof?.publicSignals,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error || 'Verification failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Reset the verifier
   */
  const reset = () => {
    setProofInput('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="bg-surface/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-gray-400 text-sm font-medium tracking-wider">
          PROOF VERIFIER
        </h2>
        <span className="text-xs text-accent">Bank Tool</span>
      </div>

      <AnimatePresence mode="wait">
        {/* Input State */}
        {!result && (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Info */}
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="text-lg">🔍</span>
              <span>Paste a ZK proof to verify tier membership</span>
            </div>

            {/* Textarea */}
            <textarea
              value={proofInput}
              onChange={(e) => {
                setProofInput(e.target.value);
                setError(null);
              }}
              placeholder='{"proof": {...}, "publicSignals": [...]}'
              className="w-full h-32 bg-background border border-gray-700 rounded-xl px-4 py-3 text-sm font-mono text-gray-300 placeholder-gray-600 focus:border-accent focus:outline-none resize-none"
            />

            {/* Error */}
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            {/* Button */}
            <button
              onClick={verifyProof}
              disabled={loading || !proofInput.trim()}
              className="w-full bg-accent text-black py-3 rounded-xl font-semibold hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Verifying...' : 'Verify Proof'}
            </button>
          </motion.div>
        )}

        {/* Result State */}
        {result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Result Badge */}
            <div className={`flex items-center justify-center gap-3 py-4 rounded-xl ${
              result.valid 
                ? 'bg-green-900/20 border border-green-800/30' 
                : 'bg-red-900/20 border border-red-800/30'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                result.valid ? 'bg-green-900/50' : 'bg-red-900/50'
              }`}>
                <span className="text-2xl">{result.valid ? '✓' : '✗'}</span>
              </div>
              <div>
                <p className={`font-semibold ${result.valid ? 'text-green-400' : 'text-red-400'}`}>
                  {result.valid ? 'PROOF VALID' : 'PROOF INVALID'}
                </p>
                {result.isSimulated && (
                  <p className="text-xs text-gray-500">Simulated verification</p>
                )}
              </div>
            </div>

            {/* Verified Claims (if valid) */}
            {result.valid && (
              <div className="bg-surface/50 rounded-lg p-4 border border-gray-800">
                <p className="text-gray-500 text-xs mb-3">Verified Claims</p>
                <div className="space-y-3">
                  <VerifiedClaim 
                    label="Credit Tier"
                    value={result.tierName}
                    verified
                  />
                  <VerifiedClaim 
                    label="Score Range"
                    value={`${result.bounds.lower} - ${result.bounds.upper}`}
                    verified
                  />
                  <VerifiedClaim 
                    label="Proof Type"
                    value="Groth16 ZK-SNARK"
                    verified
                  />
                </div>
              </div>
            )}

            {/* What bank knows */}
            <div className="bg-accent/5 rounded-lg p-4 border border-accent/20">
              <p className="text-accent text-sm font-medium mb-2">
                🏦 As a verifier, you now know:
              </p>
              <p className="text-gray-300 text-sm">
                {result.valid 
                  ? `This user's credit score is between ${result.bounds.lower} and ${result.bounds.upper} (${result.tierName} tier).`
                  : 'This proof is invalid. The user may be attempting fraud.'}
              </p>
              <p className="text-gray-500 text-xs mt-2">
                {result.valid 
                  ? 'You do NOT know their exact score.'
                  : 'Do not proceed with any credit decisions.'}
              </p>
            </div>

            {/* Reset Button */}
            <button
              onClick={reset}
              className="w-full text-gray-500 hover:text-gray-300 py-2 transition"
            >
              Verify Another Proof
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function VerifiedClaim({ 
  label, 
  value, 
  verified 
}: { 
  label: string; 
  value: string;
  verified: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-white font-medium">{value}</span>
        {verified && (
          <span className="text-green-500 text-xs">✓ ZK</span>
        )}
      </div>
    </div>
  );
}
