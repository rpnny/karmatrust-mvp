/**
 * Enhanced User Dashboard
 * 
 * User's view of their credit profile with ZK proof generation capability.
 * 
 * Features:
 * - Full credit data visibility
 * - Generate ZK Proof button
 * - EAS attestation display
 * - Bridge format preview
 * 
 * Design: Web3 dark theme, unified with Bank View
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditScoreData } from '../../hooks/useCredit';

// =============================================================================
// TYPES
// =============================================================================

interface EnhancedUserDashboardProps {
  score: CreditScoreData;
  wallet: string;
  onGenerateProof?: (proofData: any) => void;
  zkProofGenerated?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function EnhancedUserDashboard({ 
  score, 
  wallet,
  onGenerateProof,
  zkProofGenerated = false
}: EnhancedUserDashboardProps) {
  const [generating, setGenerating] = useState(false);
  const [showProofDetails, setShowProofDetails] = useState(false);

  const handleGenerateProof = async () => {
    setGenerating(true);
    
    // Simulate ZK proof generation (in real app, call snarkjs)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockProofData = {
      proof: {
        pi_a: ['0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')],
        pi_b: [['0x...', '0x...'], ['0x...', '0x...']],
        pi_c: ['0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')],
      },
      publicSignals: [score.level],
      timestamp: Date.now(),
    };
    
    onGenerateProof?.(mockProofData);
    setGenerating(false);
    setShowProofDetails(true);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          <h1 className="text-xl font-bold text-white">User View</h1>
        </div>
        <p className="text-sm text-gray-500">
          Full credit profile • Generate ZK proofs for privacy
        </p>
      </motion.div>

      {/* Wallet Info */}
      <motion.div 
        className="bg-surface/50 rounded-xl p-4 mb-6 border border-gray-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Your Wallet</span>
          <span className="font-mono text-sm text-white">
            {wallet.slice(0, 6)}...{wallet.slice(-4)}
          </span>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="space-y-6 flex-1 overflow-y-auto">
        
        {/* Credit Score Card */}
        <motion.div
          className="bg-gradient-to-br from-primary/10 via-surface/50 to-accent/10 rounded-2xl p-6 border border-primary/30"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">Your Credit Score</div>
            <div className="text-6xl font-bold text-primary mb-4">{score.ficoDisplay}</div>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="px-4 py-2 bg-primary/20 border border-primary/40 rounded-lg">
                <div className="text-xs text-gray-400">Tier</div>
                <div className="text-lg font-semibold text-primary">{score.levelName}</div>
              </div>
              <div className="px-4 py-2 bg-accent/20 border border-accent/40 rounded-lg">
                <div className="text-xs text-gray-400">Risk</div>
                <div className="text-lg font-semibold text-accent">{score.risk}</div>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Internal Score: {score.score}/100 • Data: {score.dataSource}
            </p>
          </div>
        </motion.div>

        {/* Factor Breakdown */}
        <motion.div
          className="bg-surface/50 rounded-xl p-6 border border-gray-800"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>Factor Breakdown</span>
          </h3>
          <div className="space-y-3">
            {Object.entries(score.factors).map(([key, value]) => (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">{formatFactorName(key)}</span>
                  <span className="text-white font-medium">{value.toFixed(1)}</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className="bg-primary rounded-full h-2 transition-all"
                    style={{ width: `${(value / getMaxValue(key)) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ZK Proof Generation */}
        <motion.div
          className={`rounded-2xl p-6 border-2 ${
            zkProofGenerated 
              ? 'bg-green-900/20 border-green-700' 
              : 'bg-purple-900/20 border-purple-700'
          }`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-start gap-4 mb-4">
            <span className="text-3xl">{zkProofGenerated ? '✅' : '🔐'}</span>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">
                Zero-Knowledge Proof
              </h3>
              <p className="text-sm text-gray-400">
                {zkProofGenerated 
                  ? 'Proof generated! Banks can verify your tier without seeing your data.'
                  : 'Generate a cryptographic proof to share your tier privately with banks.'}
              </p>
            </div>
          </div>

          {!zkProofGenerated ? (
            <button
              onClick={handleGenerateProof}
              disabled={generating}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating Proof...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Generate ZK Proof</span>
                </>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="bg-surface/50 rounded-lg p-3 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Proof System</span>
                  <span className="text-white font-mono">Groth16</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Circuit</span>
                  <span className="text-white font-mono">tier_membership</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Proven Tier</span>
                  <span className="text-primary font-semibold">{score.levelName}</span>
                </div>
              </div>
              
              <button
                onClick={() => setShowProofDetails(!showProofDetails)}
                className="w-full text-sm text-gray-400 hover:text-white transition"
              >
                {showProofDetails ? '▼ Hide' : '▶ Show'} Proof Details
              </button>

              <AnimatePresence>
                {showProofDetails && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-black/50 rounded-lg p-3 overflow-hidden"
                  >
                    <div className="text-xs font-mono text-gray-400 break-all">
                      <div className="mb-2 text-gray-500">Proof Hash:</div>
                      0x{Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* EAS Attestation */}
        <motion.div
          className="bg-surface/50 rounded-xl p-4 border border-gray-800"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span>⛓️</span>
              <span className="text-sm font-semibold text-white">EAS Attestation</span>
            </div>
            <span className="text-xs px-2 py-0.5 bg-green-900/30 text-green-400 border border-green-800 rounded">
              ✓ On-Chain
            </span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Attestation ID</span>
              <a 
                href={`https://sepolia.easscan.org/attestation/${score.attestationId || '0x...'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-mono"
              >
                {score.attestationId?.slice(0, 10) || '0x1a2b3c'}...
              </a>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Network</span>
              <span className="text-white">Sepolia</span>
            </div>
          </div>
        </motion.div>

        {/* Info Box */}
        <motion.div
          className="bg-blue-900/20 border border-blue-800 rounded-xl p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-sm text-gray-300">
            💡 <span className="text-white font-medium">Privacy Tip:</span> Generate a ZK proof to prove your credit tier to banks without revealing your exact score or transaction history.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatFactorName(key: string): string {
  const names: Record<string, string> = {
    walletAge: 'Wallet Age',
    txFrequency: 'Activity',
    protocolDiversity: 'Diversity',
    assetValue: 'Assets',
    volatility: 'Stability',
    scamRisk: 'Safety',
    liquidityScore: 'Liquidity',
    antiSybilScore: 'Anti-Sybil',
  };
  return names[key] || key;
}

function getMaxValue(key: string): number {
  // Max values for different factors
  const maxValues: Record<string, number> = {
    walletAge: 15,
    txFrequency: 10,
    protocolDiversity: 8,
    assetValue: 10,
    volatility: 7,
    scamRisk: 0, // Negative factor
    liquidityScore: 5,
    antiSybilScore: 50,
  };
  return maxValues[key] || 10;
}
