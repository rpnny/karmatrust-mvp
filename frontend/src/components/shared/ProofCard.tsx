/**
 * ProofCard Component - Bloomberg/OKX Style
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
import { TierBadge, VerificationBadge } from '../ui/StatusBadge';
import { ZKLoader } from '../ui/LoadingStates';
import DataTerminal from '../ui/DataTerminal';

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
  error?: string;
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
  
  // Privacy Mode state
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [userSalt, setUserSalt] = useState('');
  const [userCommitment, setUserCommitment] = useState('');

  /**
   * Generate a new ZK proof
   */
  const generateProof = async () => {
    setLoading(true);
    setError(null);
    setProcessingTime(null);

    try {
      // Build request body
      const requestBody: any = { wallet };
      
      // Privacy Mode: Include salt and commitment
      if (isPrivacyMode) {
        if (!userSalt || !userCommitment) {
          setError('Privacy Mode requires both salt and commitment');
          setLoading(false);
          return;
        }
        requestBody.salt = userSalt;
        requestBody.commitment = userCommitment;
      }

      const response = await fetch(`${API_BASE}/zkp/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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
    <DataTerminal
      title="ZK Proof Generator"
      icon="🔐"
      status={proof ? 'verified' : loading ? 'pending' : 'pending'}
      highlight="purple"
    >
      <AnimatePresence mode="wait">
        {/* Not yet generated */}
        {!proof && !loading && (
          <motion.div
            key="generate"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center py-4"
          >
            {/* Icon with glow */}
            <motion.div 
              className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4 border border-purple-500/30"
              animate={{ 
                boxShadow: ['0 0 20px rgba(139, 92, 246, 0.2)', '0 0 40px rgba(139, 92, 246, 0.4)', '0 0 20px rgba(139, 92, 246, 0.2)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.span 
                className="text-4xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                🔐
              </motion.span>
            </motion.div>

            {/* Info */}
            <h3 className="text-white font-semibold mb-1">Generate ZK Proof</h3>
            <p className="text-gray-500 text-xs text-center mb-6 max-w-xs">
              Prove you're in <TierBadge tier={currentTierName} size="sm" /> tier 
              (tier #{currentTier}) without revealing your exact score
            </p>

            {/* Mode Selection */}
            <div className="w-full max-w-md mb-4">
              <div className="flex gap-1 p-1 bg-black/40 rounded-xl border border-gray-700/50">
                <motion.button
                  onClick={() => setIsPrivacyMode(false)}
                  className={`relative flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    !isPrivacyMode ? 'text-white' : 'text-gray-400 hover:text-white'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  {!isPrivacyMode && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg"
                      layoutId="modeToggle"
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    <span>🌐</span> Public
                  </span>
                </motion.button>
                <motion.button
                  onClick={() => setIsPrivacyMode(true)}
                  className={`relative flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isPrivacyMode ? 'text-black' : 'text-gray-400 hover:text-white'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  {isPrivacyMode && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-accent to-yellow-400 rounded-lg"
                      layoutId="modeToggle"
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                    <span>🔐</span> Privacy
                  </span>
                </motion.button>
              </div>
            </div>

            {/* Privacy Mode Inputs */}
            <AnimatePresence>
              {isPrivacyMode && (
                <motion.div 
                  className="w-full max-w-md space-y-3 mb-4"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <p className="text-xs text-accent text-center">
                    Use the salt and commitment from your Privacy Attestation
                  </p>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Salt</label>
                    <input
                      type="text"
                      value={userSalt}
                      onChange={(e) => setUserSalt(e.target.value)}
                      placeholder="0x3d7f42a1c8e9b5d2..."
                      className="w-full bg-black/40 border-2 border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-xs font-mono placeholder-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Commitment</label>
                    <input
                      type="text"
                      value={userCommitment}
                      onChange={(e) => setUserCommitment(e.target.value)}
                      placeholder="0x14620111291356635582..."
                      className="w-full bg-black/40 border-2 border-gray-700/50 rounded-lg px-3 py-2.5 text-white text-xs font-mono placeholder-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/20 transition-all"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Generate Button */}
            <motion.button
              onClick={generateProof}
              className={`w-full max-w-md py-3.5 rounded-xl font-bold text-sm transition-all ${
                isPrivacyMode
                  ? 'bg-gradient-to-r from-accent to-yellow-400 text-black'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
              }`}
              whileHover={{ scale: 1.02, boxShadow: isPrivacyMode ? '0 0 30px rgba(255, 215, 0, 0.3)' : '0 0 30px rgba(139, 92, 246, 0.3)' }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="flex items-center justify-center gap-2">
                <span>⚡</span>
                Generate ZK Proof {isPrivacyMode && '(Privacy)'}
              </span>
            </motion.button>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.p 
                  className="text-red-400 text-sm mt-4 text-center"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  ❌ {error}
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="py-8"
          >
            <ZKLoader stage="proving" progress={50} />
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
            {/* Success Banner */}
            <motion.div 
              className={`rounded-xl p-4 border-2 ${
                proof.isSimulated 
                  ? 'bg-purple-900/20 border-purple-600/50' 
                  : 'bg-gradient-to-r from-green-900/20 via-emerald-900/20 to-green-900/20 border-green-600/50'
              }`}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
            >
              <div className="flex items-center justify-center gap-3">
                <motion.span 
                  className="text-3xl"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring' }}
                >
                  {proof.isSimulated ? '🔮' : '✅'}
                </motion.span>
                <div className="text-center">
                  <h3 className={`font-bold ${proof.isSimulated ? 'text-purple-400' : 'text-green-400'}`}>
                    {proof.isSimulated ? 'Simulated Proof' : 'Real ZK Proof Generated!'}
                  </h3>
                  {processingTime && !proof.isSimulated && (
                    <p className="text-xs text-green-500">
                      ⚡ {(processingTime / 1000).toFixed(2)}s via Groth16
                    </p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* What this proves */}
            <div className="bg-black/30 rounded-xl p-4 border border-gray-700/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Proof Statement</span>
                <VerificationBadge status={proof.isSimulated ? 'pending' : 'verified'} />
              </div>
              <p className="text-white text-lg font-medium">
                "My score is in range{' '}
                <span className="font-mono text-primary">{proof.bounds.lower}</span>
                {' - '}
                <span className="font-mono text-primary">{proof.bounds.upper}</span>"
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Exact score remains hidden • <TierBadge tier={proof.tierName} size="sm" />
              </p>
            </div>

            {/* Public Signals Grid */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Tier', value: proof.tier, sub: proof.tierName },
                { label: 'Lower', value: proof.bounds.lower, sub: 'bound' },
                { label: 'Upper', value: proof.bounds.upper, sub: 'bound' },
              ].map((item, i) => (
                <motion.div 
                  key={item.label}
                  className="bg-black/30 rounded-lg p-3 text-center border border-gray-800/50"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                  <div className="text-xl font-bold font-mono text-white">{item.value}</div>
                  <div className="text-xs text-gray-600">{item.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* Commitment */}
            <div className="bg-black/30 rounded-lg p-3 border border-gray-800/50">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Commitment Hash</span>
                <span className="text-xs font-mono text-gray-400">
                  {proof.commitment.slice(0, 20)}...
                </span>
              </div>
            </div>

            {/* Proof Preview */}
            <div className="bg-black/30 rounded-lg p-3 border border-gray-800/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500">Proof Data (for verifier)</span>
                <motion.button
                  onClick={copyProof}
                  className={`text-xs px-2 py-1 rounded transition ${
                    copied 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'text-purple-400 hover:bg-purple-500/10'
                  }`}
                  whileTap={{ scale: 0.95 }}
                >
                  {copied ? '✓ Copied!' : 'Copy JSON'}
                </motion.button>
              </div>
              <pre className="text-[10px] text-gray-600 font-mono overflow-hidden max-h-16 leading-tight">
                {`{"proof":{"pi_a":["${proof.proof.pi_a[0].slice(0,20)}...`}
              </pre>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <motion.button
                onClick={copyProof}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-bold text-sm"
                whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' }}
                whileTap={{ scale: 0.98 }}
              >
                {copied ? '✓ Copied to Clipboard!' : '📋 Copy Full Proof'}
              </motion.button>
              <motion.button
                onClick={() => setProof(null)}
                className="px-4 py-3 bg-gray-800/50 text-gray-400 hover:text-white rounded-xl font-medium transition-colors border border-gray-700/50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                New
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </DataTerminal>
  );
}

