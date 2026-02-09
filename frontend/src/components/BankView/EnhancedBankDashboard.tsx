/**
 * Enhanced Bank/Protocol Dashboard - Bloomberg/OKX Style
 * 
 * Focus: ZK Proof Verification & Tier Data
 * Professional financial terminal aesthetic
 * 
 * Bank/Protocol receives ZK proof from user and verifies it to get:
 * - Credit tier (without seeing exact score)
 * - Verification status (cryptographically proven)
 * 
 * Design: Bloomberg terminal + OKX professional trading interface
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditScoreData } from '../../hooks/useCredit';
import DataTerminal from '../ui/DataTerminal';
import { TierBadge, VerificationBadge } from '../ui/StatusBadge';
import { Spinner, ZKLoader } from '../ui/LoadingStates';

// =============================================================================
// TYPES
// =============================================================================

interface EnhancedBankDashboardProps {
  score: CreditScoreData;
  wallet: string;
}

interface VerificationResult {
  valid: boolean;
  tier: number;
  tierName: string;
  bounds: {
    lower: number;
    upper: number;
  };
  message: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function EnhancedBankDashboard({ 
  score, 
  wallet
}: EnhancedBankDashboardProps) {
  const [proofInput, setProofInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState('');

  const handleVerifyProof = async () => {
    if (!proofInput.trim()) {
      setError('Please paste a ZK proof');
      return;
    }

    setVerifying(true);
    setError('');
    setVerificationResult(null);
    setVerificationProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setVerificationProgress(prev => Math.min(prev + 15, 90));
    }, 200);

    try {
      const proofData = JSON.parse(proofInput);

      const response = await fetch('http://localhost:3000/api/zkp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proofData),
      });

      const data = await response.json();

      clearInterval(progressInterval);
      setVerificationProgress(100);

      if (data.success && data.data.valid) {
        await new Promise(r => setTimeout(r, 300)); // Brief pause for animation
        setVerificationResult({
          valid: true,
          tier: data.data.tier,
          tierName: data.data.tierName,
          bounds: data.data.bounds,
          message: data.data.message,
        });
      } else {
        setError(data.data?.message || 'Proof verification failed');
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error('Verification error:', err);
      setError(err.message || 'Invalid proof format');
    } finally {
      setVerifying(false);
    }
  };

  const handleReset = () => {
    setProofInput('');
    setVerificationResult(null);
    setError('');
    setVerificationProgress(0);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center border border-accent/20"
              whileHover={{ scale: 1.1, rotate: -5 }}
            >
              <span className="text-xl">🏦</span>
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-white">Verification Terminal</h1>
              <p className="text-xs text-gray-500">ZK-protected credit verification</p>
            </div>
          </div>
          <VerificationBadge 
            status={verificationResult ? 'verified' : verifying ? 'generating' : 'pending'} 
            label={verificationResult ? 'Verified' : verifying ? 'Processing' : 'Awaiting Proof'}
          />
        </div>
      </motion.div>

      {/* Applicant Info Bar */}
      <motion.div 
        className="flex items-center justify-between bg-black/30 rounded-lg px-4 py-2 mb-6 border border-gray-800/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
          <span className="text-xs text-gray-500">Applicant</span>
        </div>
        <span className="font-mono text-sm text-white">
          {wallet.slice(0, 6)}...{wallet.slice(-4)}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2 py-1 bg-gray-900/40 text-gray-400 rounded border border-gray-700/50">
            Demo ref: {score.levelName}
          </span>
          <span className="text-xs px-2 py-1 bg-purple-900/30 text-purple-300 rounded border border-purple-700/50">
            🔐 Private
          </span>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
        <AnimatePresence mode="wait">
          {!verificationResult ? (
            <motion.div
              key="input"
              className="space-y-5"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: 0.2 }}
            >
              {/* Explanation Card */}
              <DataTerminal
                title="ZK Verification"
                icon="🔐"
                status="pending"
                highlight="purple"
              >
                <div className="space-y-4">
                  <p className="text-sm text-gray-300">
                    Verify a user's credit tier without seeing their exact score or transaction history.
                  </p>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { icon: '✓', text: 'Cryptographic tier verification', color: 'text-green-400' },
                      { icon: '✓', text: 'Instant verification result', color: 'text-green-400' },
                      { icon: '✓', text: 'On-chain proof validation', color: 'text-green-400' },
                      { icon: '✗', text: 'Cannot see exact credit score', color: 'text-gray-500' },
                      { icon: '✗', text: 'Cannot see transaction history', color: 'text-gray-500' },
                    ].map((item, i) => (
                      <motion.div 
                        key={i}
                        className="flex items-center gap-2 text-xs"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                      >
                        <span className={item.color}>{item.icon}</span>
                        <span className={item.color}>{item.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </DataTerminal>

              {/* Proof Input Area */}
              <motion.div 
                className="bg-gradient-to-br from-purple-900/10 via-black/30 to-blue-900/10 rounded-xl p-5 border border-purple-800/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <span>📋</span>
                    <span>Paste ZK Proof</span>
                  </h3>
                  <span className="text-xs text-gray-500 font-mono">JSON format</span>
                </div>
                
                <div className="relative mb-4">
                  <textarea
                    value={proofInput}
                    onChange={(e) => {
                      setProofInput(e.target.value);
                      setError('');
                    }}
                    placeholder='{"proof": {...}, "publicSignals": [...]}'
                    rows={8}
                    className="w-full bg-black/50 border-2 border-gray-700/50 rounded-xl px-4 py-3 text-white font-mono text-xs focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 resize-none transition-all"
                  />
                  {proofInput && (
                    <motion.button
                      onClick={() => setProofInput('')}
                      className="absolute top-2 right-2 text-gray-500 hover:text-white p-1 rounded transition-colors"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      ✕
                    </motion.button>
                  )}
                </div>

                {/* Verification Progress (when verifying) */}
                {verifying && (
                  <motion.div 
                    className="mb-4"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <ZKLoader stage="verifying" progress={verificationProgress} />
                  </motion.div>
                )}

                <motion.button
                  onClick={handleVerifyProof}
                  disabled={verifying || !proofInput.trim()}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: verifying ? 1 : 1.02, boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)' }}
                  whileTap={{ scale: verifying ? 1 : 0.98 }}
                >
                  {verifying ? (
                    <span className="flex items-center justify-center gap-2">
                      <Spinner size={20} color="#fff" />
                      <span>Verifying Proof...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>⚡</span>
                      <span>Verify ZK Proof</span>
                    </span>
                  )}
                </motion.button>

                {/* Error Message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      className="mt-4 p-4 bg-red-900/20 border border-red-700/50 rounded-xl"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <p className="text-sm text-red-400 flex items-center gap-2">
                        <span>❌</span> {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Demo Flow Helper */}
              <motion.div 
                className="bg-gradient-to-r from-yellow-900/10 to-orange-900/10 border border-yellow-800/30 rounded-xl p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-xs text-yellow-400 flex items-start gap-2">
                  <span className="text-lg">💡</span>
                  <span>
                    <strong>Demo Flow:</strong> User View → Generate ZK Proof → Copy JSON → Paste here → Verify
                  </span>
                </p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              className="space-y-5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              {/* Success Banner */}
              <motion.div 
                className="relative bg-gradient-to-r from-green-900/20 via-emerald-900/20 to-green-900/20 border-2 border-green-600/50 rounded-2xl p-6 overflow-hidden"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                {/* Animated background */}
                <div className="absolute inset-0 overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                
                <div className="relative flex items-center justify-center gap-4">
                  <motion.span 
                    className="text-5xl"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                  >
                    ✅
                  </motion.span>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-green-400">Proof Verified!</h3>
                    <p className="text-sm text-gray-400 mt-1">{verificationResult.message}</p>
                  </div>
                </div>
              </motion.div>

              {/* Verified Tier Card */}
              <DataTerminal
                title="Verified Credit Tier"
                icon="🏆"
                status="verified"
                highlight="primary"
              >
                <div className="text-center py-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.3 }}
                  >
                    <TierBadge tier={verificationResult.tierName} size="lg" showGlow />
                  </motion.div>
                  
                  <div className="mt-6 grid grid-cols-3 gap-4">
                    <div className="bg-black/30 rounded-xl p-4 border border-gray-800/50">
                      <div className="text-xs text-gray-500 mb-1">Tier Level</div>
                      <div className="text-3xl font-bold text-accent font-mono">{verificationResult.tier}</div>
                    </div>
                    <div className="bg-black/30 rounded-xl p-4 border border-gray-800/50">
                      <div className="text-xs text-gray-500 mb-1">Lower Bound</div>
                      <div className="text-3xl font-bold text-white font-mono">{verificationResult.bounds.lower}</div>
                    </div>
                    <div className="bg-black/30 rounded-xl p-4 border border-gray-800/50">
                      <div className="text-xs text-gray-500 mb-1">Upper Bound</div>
                      <div className="text-3xl font-bold text-white font-mono">{verificationResult.bounds.upper}</div>
                    </div>
                  </div>
                  
                  <p className="mt-4 text-xs text-gray-500">
                    User's exact score is hidden. Only tier membership is cryptographically proven.
                  </p>
                </div>
              </DataTerminal>

              {/* Integration Guide */}
              <DataTerminal
                title="Integration Guide"
                icon="💡"
                highlight="accent"
              >
                <div className="space-y-4">
                  <div className="bg-black/30 rounded-lg p-4 border border-gray-800/50">
                    <p className="text-sm text-white font-medium mb-2">
                      ✅ Verified: <span className="text-primary">{verificationResult.tierName}</span>
                    </p>
                    <p className="text-xs text-gray-400">
                      Use this tier to apply your lending policies:
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-gray-500">
                      {['Set collateral requirements', 'Define interest rates', 'Determine max borrow amounts', 'Apply risk management rules'].map((item, i) => (
                        <motion.li 
                          key={item}
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + i * 0.1 }}
                        >
                          <span className="text-primary">•</span> {item}
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                    <p className="text-accent font-semibold text-xs mb-2">🏦 Example Code</p>
                    <pre className="text-[11px] text-gray-300 font-mono overflow-x-auto">
{`if (tier >= 3) { // Gold+
  maxLTV = 80%;
  interestRate = BASE - 1%;
} else {
  maxLTV = 60%;
  interestRate = BASE;
}`}
                    </pre>
                  </div>
                </div>
              </DataTerminal>

              {/* Privacy Note */}
              <motion.div 
                className="bg-purple-900/20 border border-purple-700/50 rounded-xl p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <p className="text-xs text-gray-300 flex items-start gap-2">
                  <span className="text-lg">🔒</span>
                  <span>
                    <strong className="text-white">Privacy Protected:</strong> You verified the user's tier without learning their exact credit score, transaction history, or wallet activity. Zero-knowledge cryptography ensures data privacy.
                  </span>
                </p>
              </motion.div>

              {/* Reset Button */}
              <motion.button
                onClick={handleReset}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-all border border-gray-700/50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Verify Another Proof
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
