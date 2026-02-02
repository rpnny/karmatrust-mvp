/**
 * CredentialManager Component
 * 
 * Allows users to choose between two credential modes:
 * 1. Public Mode - EAS with visible score (transparency)
 * 2. Privacy Mode - Commitment + ZK proof (privacy)
 * 
 * This is the main UI for demonstrating the dual-mode design.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =============================================================================
// TYPES
// =============================================================================

type CredentialMode = 'public' | 'privacy' | null;

interface PublicAttestation {
  attestationId: string;
  explorerUrl: string;
  score: number;
  level: string;
  txHash?: string;
}

interface PrivacyAttestation {
  attestationId: string;
  explorerUrl: string;
  commitment: string;
  salt: string;
  minTier: number;
  txHash?: string;
}

interface ZKProofData {
  proof: any;
  publicSignals: number[];
  proofString: string;
}

interface CredentialManagerProps {
  wallet: string;
  score: number;
  ficoDisplay: number;
  level: number;
  levelName: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// =============================================================================
// COMPONENT
// =============================================================================

export default function CredentialManager({
  wallet,
  score,
  ficoDisplay,
  level,
  levelName,
}: CredentialManagerProps) {
  const [selectedMode, setSelectedMode] = useState<CredentialMode>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Attestation results
  const [publicAttestation, setPublicAttestation] = useState<PublicAttestation | null>(null);
  const [privacyAttestation, setPrivacyAttestation] = useState<PrivacyAttestation | null>(null);
  const [zkProof, setZkProof] = useState<ZKProofData | null>(null);
  const [generatingProof, setGeneratingProof] = useState(false);

  /**
   * Create public attestation (plaintext score)
   */
  const createPublicAttestation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/credit/attest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet }),
      });

      const data = await response.json();

      if (data.success) {
        setPublicAttestation({
          attestationId: data.data.attestation.attestationId,
          explorerUrl: data.data.attestation.explorerUrl,
          score: ficoDisplay,
          level: levelName,
          txHash: data.data.attestation.txHash,
        });
      } else {
        setError(data.error || 'Failed to create attestation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Create privacy attestation (commitment-based)
   */
  const createPrivacyAttestation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/credit/attest-commitment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet }),
      });

      const data = await response.json();

      if (data.success) {
        setPrivacyAttestation({
          attestationId: data.data.attestation.attestationId,
          explorerUrl: data.data.attestation.explorerUrl,
          commitment: data.data.commitment,
          salt: data.data.salt,
          minTier: data.data.attestation.minTier,
          txHash: data.data.attestation.txHash,
        });
      } else {
        setError(data.error || 'Failed to create attestation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate ZK Proof (after privacy attestation created)
   */
  const generateZKProof = async () => {
    if (!privacyAttestation) return;

    setGeneratingProof(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/zkp/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          wallet,
          minTier: level  // Current tier
        }),
      });

      const data = await response.json();

      if (data.success) {
        setZkProof({
          proof: data.data.proof,
          publicSignals: data.data.publicSignals,
          proofString: data.data.proofString,
        });
      } else {
        setError(data.error || 'Failed to generate ZK proof');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setGeneratingProof(false);
    }
  };

  /**
   * Handle mode selection and credential creation
   */
  const handleModeSelect = async (mode: CredentialMode) => {
    setSelectedMode(mode);
    setError(null);
    setZkProof(null); // Reset proof when changing mode

    if (mode === 'public') {
      await createPublicAttestation();
    } else if (mode === 'privacy') {
      await createPrivacyAttestation();
    }
  };

  return (
    <div className="bg-surface rounded-xl p-6 border border-gray-800">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Choose Credential Mode</h3>
        <p className="text-sm text-gray-400">
          How do you want to prove your creditworthiness?
        </p>
      </div>

      {/* Mode Selection */}
      {!selectedMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Public Mode Button */}
          <motion.button
            onClick={() => handleModeSelect('public')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="relative p-6 rounded-lg border-2 border-gray-700 bg-gray-900 hover:border-primary hover:bg-primary/5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl">👁️</span>
              <div>
                <h4 className="font-semibold text-white mb-1">🌐 Public Mode</h4>
                <p className="text-xs text-primary mb-2">EAS On-Chain Attestation</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span className="text-gray-300">Publicly verifiable on EASScan</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span className="text-gray-300">Best rates for high scores</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">✗</span>
                <span className="text-gray-400">Score visible to everyone</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-800/50 rounded">
              <p className="text-xs text-yellow-400 font-mono">
                ⚠️ Score {ficoDisplay} will be PUBLIC
              </p>
            </div>
          </motion.button>

          {/* Privacy Mode Button */}
          <motion.button
            onClick={() => handleModeSelect('privacy')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            className="relative p-6 rounded-lg border-2 border-gray-700 bg-gray-900 hover:border-accent hover:bg-accent/5 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start gap-3 mb-3">
              <span className="text-3xl">🔐</span>
              <div>
                <h4 className="font-semibold text-white mb-1">🔒 Privacy Mode</h4>
                <p className="text-xs text-accent mb-2">Commitment + ZK Proof</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span className="text-gray-300">Score remains private</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span className="text-gray-300">Cryptographically verifiable</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">✓</span>
                <span className="text-gray-300">On-chain commitment anchor</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-green-900/20 border border-green-800/50 rounded">
              <p className="text-xs text-green-400 font-mono">
                ✓ Only "{levelName}" tier visible
              </p>
            </div>
          </motion.button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-12"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400">Creating attestation...</p>
          </div>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg"
        >
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => {
              setSelectedMode(null);
              setError(null);
            }}
            className="mt-2 text-primary hover:underline text-sm"
          >
            Try again
          </button>
        </motion.div>
      )}

      {/* Public Attestation Result */}
      <AnimatePresence>
        {publicAttestation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4"
          >
            <div className="p-6 bg-primary/10 border border-primary/30 rounded-lg">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-3xl">✅</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">Public Attestation Created</h4>
                  <p className="text-sm text-gray-400">
                    Your score is now publicly visible on the blockchain
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Attestation ID</p>
                  <p className="font-mono text-xs text-white break-all">
                    {publicAttestation.attestationId}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-500">Score (Public)</p>
                    <p className="text-lg font-bold text-primary">{publicAttestation.score}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Level (Public)</p>
                    <p className="text-lg font-bold text-primary">{publicAttestation.level}</p>
                  </div>
                </div>

                {publicAttestation.txHash && (
                  <div>
                    <p className="text-gray-500">Transaction</p>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${publicAttestation.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline font-mono break-all"
                    >
                      {publicAttestation.txHash}
                    </a>
                  </div>
                )}

                <a
                  href={publicAttestation.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-primary text-black py-2 rounded-lg hover:bg-primary/80 transition font-medium"
                >
                  View on EASScan ↗
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Privacy Attestation Result */}
      <AnimatePresence>
        {privacyAttestation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4"
          >
            <div className="p-6 bg-accent/10 border border-accent/30 rounded-lg">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-3xl">🔐</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-white mb-1">Privacy Attestation Created</h4>
                  <p className="text-sm text-gray-400">
                    Your score is private. Only the commitment is on-chain.
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-500">Attestation ID</p>
                  <p className="font-mono text-xs text-white break-all">
                    {privacyAttestation.attestationId}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-500">Commitment (Public on-chain)</p>
                  <p className="font-mono text-xs text-white break-all">
                    {privacyAttestation.commitment}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ✓ Cannot be reversed to get score
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-gray-500">Min Tier (Public)</p>
                    <p className="text-lg font-bold text-accent">{privacyAttestation.minTier}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Exact Score</p>
                    <p className="text-lg font-bold text-gray-500">🔒 Hidden</p>
                  </div>
                </div>

                <div className="p-3 bg-yellow-900/20 border border-yellow-800/50 rounded">
                  <p className="text-xs text-yellow-400 font-bold mb-1">⚠️ IMPORTANT: Store Your Salt</p>
                  <p className="text-xs text-gray-400 mb-2">
                    You need the salt to generate ZK proofs. Save it somewhere safe!
                  </p>
                  <p className="font-mono text-xs text-white break-all bg-black/30 p-2 rounded">
                    {privacyAttestation.salt}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(privacyAttestation.salt);
                    }}
                    className="mt-2 w-full text-center bg-yellow-800 text-yellow-100 py-1 rounded hover:bg-yellow-700 transition text-xs"
                  >
                    📋 Copy Salt
                  </button>
                </div>

                {privacyAttestation.txHash && (
                  <div>
                    <p className="text-gray-500">Transaction</p>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${privacyAttestation.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent hover:underline font-mono break-all"
                    >
                      {privacyAttestation.txHash}
                    </a>
                  </div>
                )}

                <a
                  href={privacyAttestation.explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-accent text-black py-2 rounded-lg hover:bg-accent/80 transition font-medium"
                >
                  View on EASScan ↗
                </a>

                {/* Generate ZK Proof Button */}
                {!zkProof && (
                  <button
                    onClick={generateZKProof}
                    disabled={generatingProof}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 mt-4"
                  >
                    {generatingProof ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generating ZK Proof...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>🔐 Generate ZK Proof</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* ZK Proof Result (if generated) */}
            {zkProof && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-6 bg-green-900/20 border border-green-800 rounded-lg"
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-3xl">✅</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white mb-1">ZK Proof Generated!</h4>
                    <p className="text-sm text-gray-400">
                      Copy this proof and share it with banks for verification
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500 mb-2">Proof String (Copy & Share):</p>
                    <div className="bg-black/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                      <p className="font-mono text-xs text-white break-all">
                        {zkProof.proofString}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(zkProof.proofString);
                      }}
                      className="mt-2 w-full text-center bg-green-800 text-green-100 py-2 rounded hover:bg-green-700 transition font-medium"
                    >
                      📋 Copy Proof
                    </button>
                  </div>

                  <div className="p-3 bg-blue-900/20 border border-blue-800 rounded">
                    <p className="text-xs text-blue-400">
                      💡 <span className="font-semibold">How to use:</span> Paste this proof in the Bank View's "Verify Proof" tab. The bank can verify your tier without seeing your exact score!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Button */}
      {selectedMode && !loading && (publicAttestation || privacyAttestation) && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => {
            setSelectedMode(null);
            setPublicAttestation(null);
            setPrivacyAttestation(null);
            setZkProof(null);
            setError(null);
          }}
          className="mt-4 w-full text-center text-gray-400 hover:text-white text-sm py-2 border border-gray-800 rounded-lg hover:border-gray-700 transition"
        >
          ← Try Other Mode
        </motion.button>
      )}
    </div>
  );
}
