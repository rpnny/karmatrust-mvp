/**
 * CredentialModeSelector Component
 * 
 * Allows users to choose between:
 * 1. Public Mode - EAS Attestation with visible score
 * 2. Privacy Mode - ZK Proof without revealing exact score
 * 
 * This addresses the privacy paradox:
 * - EAS attestations are PUBLIC on-chain (anyone can see the score)
 * - ZK proofs are PRIVATE (only prove tier membership)
 * 
 * Users should choose based on their needs:
 * - High score users → Public mode (show off for better rates)
 * - Privacy-conscious → ZK proof mode (prove eligibility without exposing score)
 */

import { useState } from 'react';
import { motion } from 'framer-motion';

// =============================================================================
// TYPES
// =============================================================================

type CredentialMode = 'public' | 'privacy';

interface CredentialModeSelectorProps {
  onModeSelect: (mode: CredentialMode) => void;
  score: number;
  tierName: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function CredentialModeSelector({ 
  onModeSelect, 
  score, 
  tierName 
}: CredentialModeSelectorProps) {
  const [selectedMode, setSelectedMode] = useState<CredentialMode | null>(null);

  const handleModeSelect = (mode: CredentialMode) => {
    setSelectedMode(mode);
    onModeSelect(mode);
  };

  return (
    <div className="bg-surface rounded-xl p-6 border border-gray-800">
      <h3 className="text-lg font-semibold text-white mb-2">Choose Credential Mode</h3>
      <p className="text-sm text-gray-400 mb-6">
        How do you want to prove your creditworthiness?
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Public Mode */}
        <motion.button
          onClick={() => handleModeSelect('public')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`relative p-6 rounded-lg border-2 transition-all text-left ${
            selectedMode === 'public'
              ? 'border-primary bg-primary/10'
              : 'border-gray-700 bg-gray-900 hover:border-gray-600'
          }`}
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
              <span className="text-gray-300">Trusted by banks & DeFi protocols</span>
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
              ⚠️ Your score ({score}) will be PUBLIC on blockchain
            </p>
          </div>
        </motion.button>

        {/* Privacy Mode */}
        <motion.button
          onClick={() => handleModeSelect('privacy')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`relative p-6 rounded-lg border-2 transition-all text-left ${
            selectedMode === 'privacy'
              ? 'border-accent bg-accent/10'
              : 'border-gray-700 bg-gray-900 hover:border-gray-600'
          }`}
        >
          <div className="flex items-start gap-3 mb-3">
            <span className="text-3xl">🔐</span>
            <div>
              <h4 className="font-semibold text-white mb-1">🔒 Privacy Mode</h4>
              <p className="text-xs text-accent mb-2">Zero-Knowledge Proof</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span className="text-gray-300">Score remains private (hidden)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span className="text-gray-300">Cryptographically verifiable</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 mt-0.5">✓</span>
              <span className="text-gray-300">Anti-sybil protection in circuit</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-yellow-400 mt-0.5">!</span>
              <span className="text-gray-400">Only proves tier membership</span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-green-900/20 border border-green-800/50 rounded">
            <p className="text-xs text-green-400 font-mono">
              ✓ Banks see: "{tierName} tier" (not exact score)
            </p>
          </div>
        </motion.button>
      </div>

      {selectedMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-gray-900 border border-gray-800 rounded-lg"
        >
          <h4 className="text-sm font-semibold text-white mb-2">
            {selectedMode === 'public' ? '🌐 Public Mode Selected' : '🔒 Privacy Mode Selected'}
          </h4>
          <p className="text-xs text-gray-400">
            {selectedMode === 'public' 
              ? 'Creating an on-chain EAS attestation. Your score will be publicly visible on Sepolia EASScan.'
              : 'Generating a zero-knowledge proof. Your exact score will remain private, banks will only see your tier.'}
          </p>
        </motion.div>
      )}
    </div>
  );
}
