/**
 * ProofCard Component
 * 
 * Generates and displays ZK proofs for tier membership.
 * 
 * This is the CORE PRIVACY DEMO component.
 * 
 * User Flow:
 * 1. User clicks "Generate Proof"
 * 2. Backend creates ZK proof of tier membership
 * 3. User sees proof details (can share with banks)
 * 4. Bank can verify proof without seeing score
 * 
 * What the proof contains (PUBLIC):
 * - Tier number (e.g., 3 = Gold)
 * - Score bounds (e.g., 60-79)
 * - Commitment (hash of score)
 * 
 * What the proof hides (PRIVATE):
 * - Exact score
 * - Salt value
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =============================================================================
// TYPES
// =============================================================================

interface ProofData {
  proof: {
    pi_a: string[];
    pi_b: string[][];
    pi_c: string[];
    publicSignals: string[];
  };
  publicSignals: string[];
  commitment: string;
  tier: number;
  tierName: string;
  bounds: { lower: number; upper: number };
  isSimulated: boolean;
}

interface ProofResponse {
  success: boolean;
  data: ProofData;
  meta?: {
    timestamp: number;
    processingTimeMs: number;
  };
}

interface ProofCardProps {
  wallet: string;
  currentTier: number;
  currentTierName: string;
}

// =============================================================================
// API CONFIGURATION
// =============================================================================

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// =============================================================================
// COMPONENT
// =============================================================================

export default function ProofCard({ wallet, currentTier, currentTierName }: ProofCardProps) {
  const [proof, setProof] = useState<ProofData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [processingTime, setProcessingTime] = useState<number | null>(null);

  /**
   * Generate a new ZK proof
   */
  const generateProof = async () => {
    setLoading(true);
    setError(null);
    setProcessingTime(null);

    try {
      const response = await fetch(`${API_BASE}/zkp/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet }),
      });

      const data: ProofResponse = await response.json();

      if (data.success) {
        setProof(data.data);
        setProcessingTime(data.meta?.processingTimeMs || null);
      } else {
        setError(data.error || 'Failed to generate proof');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Copy proof to clipboard
   */
  const copyProof = async () => {
    if (!proof) return;

    const proofData = {
      proof: proof.proof,
      publicSignals: proof.publicSignals,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(proofData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-surface/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-gray-400 text-sm font-medium tracking-wider">
          ZK PROOF
        </h2>
        {proof && (
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            proof.isSimulated
              ? 'bg-purple-900/30 text-purple-400 border-purple-800/50'
              : 'bg-green-900/30 text-green-400 border-green-800/50 animate-pulse'
          }`}>
            {proof.isSimulated ? 'Simulated' : '✅ Real Proof'}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Not yet generated */}
        {!proof && !loading && (
          <motion.div
            key="generate"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center py-6"
          >
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
              <span className="text-3xl">🔐</span>
            </div>

            {/* Info */}
            <p className="text-gray-400 text-sm text-center mb-2">
              Generate a zero-knowledge proof
            </p>
            <p className="text-gray-600 text-xs text-center mb-6 max-w-xs">
              Prove you're in <span className="text-purple-400">{currentTierName}</span> tier 
              without revealing your exact score
            </p>

            {/* Button */}
            <button
              onClick={generateProof}
              className="bg-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-purple-500 transition transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Generate ZK Proof
            </button>

            {/* Error */}
            {error && (
              <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
            )}
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-8"
          >
            {/* Animated icon */}
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-500/20 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl">🔐</span>
              </div>
            </div>
            <p className="text-gray-400 text-sm mt-4 animate-pulse">
              Generating proof...
            </p>
            <p className="text-gray-600 text-xs mt-2">
              Computing cryptographic constraints
            </p>
          </motion.div>
        )}

        {/* Proof Generated */}
        {proof && !loading && (
          <motion.div
            key="proof"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Success Badge */}
            <div className="flex flex-col items-center justify-center gap-2 py-2">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  proof.isSimulated ? 'bg-purple-900/30' : 'bg-green-900/30'
                }`}>
                  <span className={proof.isSimulated ? 'text-purple-400' : 'text-green-400'}>✓</span>
                </div>
                <span className={`font-medium ${
                  proof.isSimulated ? 'text-purple-400' : 'text-green-400'
                }`}>
                  {proof.isSimulated ? 'Simulated Proof Generated' : '🎉 Real ZK Proof Generated!'}
                </span>
              </div>
              {processingTime && !proof.isSimulated && (
                <p className="text-xs text-green-500">
                  ⚡ Generated in {(processingTime / 1000).toFixed(2)}s using Circom + Groth16
                </p>
              )}
            </div>

            {/* What this proves */}
            <div className={`rounded-lg p-4 border ${
              proof.isSimulated 
                ? 'bg-purple-900/20 border-purple-800/30' 
                : 'bg-green-900/20 border-green-800/30'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-sm font-medium ${
                  proof.isSimulated ? 'text-purple-300' : 'text-green-300'
                }`}>
                  This proof verifies:
                </p>
                {!proof.isSimulated && (
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                    Cryptographically Secure
                  </span>
                )}
              </div>
              <p className="text-white text-lg">
                "My score is between{' '}
                <span className={`font-mono ${proof.isSimulated ? 'text-purple-400' : 'text-green-400'}`}>
                  {proof.bounds.lower}
                </span>
                {' '}and{' '}
                <span className={`font-mono ${proof.isSimulated ? 'text-purple-400' : 'text-green-400'}`}>
                  {proof.bounds.upper}
                </span>"
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Without revealing the exact score
                {!proof.isSimulated && ' • Verified using Groth16 protocol'}
              </p>
            </div>

            {/* Public Signals */}
            <div className="bg-surface/50 rounded-lg p-4 border border-gray-800">
              <p className="text-gray-500 text-xs mb-2">Public Signals (visible to verifier)</p>
              <div className="space-y-2">
                <DetailRow label="Tier" value={`${proof.tier} (${proof.tierName})`} />
                <DetailRow label="Range" value={`${proof.bounds.lower} - ${proof.bounds.upper}`} />
                <DetailRow 
                  label="Commitment" 
                  value={`${proof.commitment.slice(0, 16)}...`} 
                  mono 
                />
              </div>
            </div>

            {/* Proof Preview */}
            <div className="bg-surface/50 rounded-lg p-4 border border-gray-800">
              <div className="flex justify-between items-center mb-2">
                <p className="text-gray-500 text-xs">Proof Data (share with verifier)</p>
                <button
                  onClick={copyProof}
                  className="text-xs text-purple-400 hover:text-purple-300 transition"
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="text-xs text-gray-600 font-mono overflow-hidden max-h-20">
                {JSON.stringify(proof.proof.pi_a.slice(0, 2), null, 2)}...
              </pre>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={copyProof}
                className="flex-1 bg-purple-600 text-white py-2.5 rounded-xl font-medium hover:bg-purple-500 transition"
              >
                {copied ? '✓ Copied!' : 'Copy Proof'}
              </button>
              <button
                onClick={() => setProof(null)}
                className="px-4 text-gray-500 hover:text-gray-300 transition"
              >
                New
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function DetailRow({ 
  label, 
  value, 
  mono = false 
}: { 
  label: string; 
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`text-gray-300 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}
