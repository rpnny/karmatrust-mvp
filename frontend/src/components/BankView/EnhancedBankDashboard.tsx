/**
 * Enhanced Bank/Protocol Dashboard - INFRASTRUCTURE VIEW
 * 
 * Focus: ZK Proof Verification & Tier Data
 * 
 * Bank/Protocol receives ZK proof from user and verifies it to get:
 * - Credit tier (without seeing exact score)
 * - Verification status (cryptographically proven)
 * 
 * What This Component DOES NOT Show:
 * - Lending parameters (collateral, interest rates)
 * - Those are YOUR business decisions based on the tier
 * 
 * KarmaTrust provides the data. You make the lending decisions.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditScoreData } from '../../hooks/useCredit';

// =============================================================================
// TYPES
// =============================================================================

interface EnhancedBankDashboardProps {
  score: CreditScoreData;  // For demo reference only
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

    try {
      // Parse proof string
      const proofData = JSON.parse(proofInput);

      // Call verification API
      const response = await fetch('http://localhost:3000/api/zkp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proofData),
      });

      const data = await response.json();

      if (data.success && data.data.valid) {
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
          <div className="w-3 h-3 rounded-full bg-accent animate-pulse" />
          <h1 className="text-xl font-bold text-white">Bank / Protocol View</h1>
          <span className="px-2 py-0.5 bg-purple-900/30 border border-purple-700 rounded text-xs text-purple-300">
            🔐 ZK Verification
          </span>
        </div>
        <p className="text-sm text-gray-500">
          Verify user's credit tier without seeing their exact score
        </p>
      </motion.div>

      {/* Applicant Info */}
      <motion.div 
        className="bg-surface/50 rounded-xl p-4 mb-6 border border-gray-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">Applicant Address</span>
          <span className="font-mono text-sm text-white">
            {wallet.slice(0, 6)}...{wallet.slice(-4)}
          </span>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {!verificationResult ? (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Explanation */}
            <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <span className="text-3xl">🔐</span>
                <div>
                  <h3 className="text-white font-semibold mb-2">Privacy-Preserving Verification</h3>
                  <p className="text-sm text-gray-300 mb-3">
                    Ask the user to generate a ZK proof in the User View and share it with you.
                  </p>
                  <div className="space-y-2 text-xs text-gray-400">
                    <div className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Verify credit tier cryptographically</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-400">✓</span>
                      <span>Get verified tier data instantly</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-400">✗</span>
                      <span className="text-gray-500">Cannot see exact credit score</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Proof Input */}
            <div className="bg-gradient-to-br from-purple-900/20 via-surface/50 to-blue-900/20 rounded-xl p-6 border border-purple-800/50">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <span>📋</span>
                <span>Paste ZK Proof</span>
              </h3>
              
              <div className="mb-4">
                <textarea
                  value={proofInput}
                  onChange={(e) => setProofInput(e.target.value)}
                  placeholder='{"proof": {...}, "publicSignals": [...]}'
                  rows={8}
                  className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-xs focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <button
                onClick={handleVerifyProof}
                disabled={verifying}
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Proof...</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>Verify ZK Proof</span>
                  </>
                )}
              </button>

              {error && (
                <motion.div
                  className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-sm text-red-300">❌ {error}</p>
                </motion.div>
              )}
            </div>

            {/* Demo Helper */}
            <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-4">
              <p className="text-xs text-yellow-400">
                💡 <span className="font-semibold">Demo Flow:</span> User View → ZK Proof Generator → Generate Proof → Copy Proof → Paste here
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {/* Success Banner */}
            <div className="bg-gradient-to-r from-green-900/30 via-emerald-900/30 to-green-900/30 border-2 border-green-700 rounded-2xl p-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <span className="text-5xl">✅</span>
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-green-300">Proof Verified!</h3>
                  <p className="text-sm text-gray-300 mt-1">{verificationResult.message}</p>
                </div>
              </div>
            </div>

            {/* Verified Tier Info */}
            <div className="bg-gradient-to-br from-primary/10 via-surface/50 to-accent/10 rounded-2xl p-6 border-2 border-primary/30">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-400 mb-2">Verified Credit Tier</p>
                <p className="text-5xl font-bold text-primary mb-2">{verificationResult.tierName}</p>
                <p className="text-xs text-gray-500">
                  Score Range: {verificationResult.bounds.lower} - {verificationResult.bounds.upper}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-accent/20 border border-accent/40 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">Tier Level</p>
                  <p className="text-3xl font-bold text-accent">{verificationResult.tier}</p>
                </div>
                <div className="bg-primary/20 border border-primary/40 rounded-lg p-4 text-center">
                  <p className="text-xs text-gray-400 mb-1">Tier Name</p>
                  <p className="text-2xl font-bold text-primary">{verificationResult.tierName}</p>
                </div>
              </div>
              
              <div className="bg-surface/30 border border-border rounded-lg p-4 mt-4">
                <p className="text-xs text-gray-400 mb-1">Score Range</p>
                <p className="text-lg text-white font-mono">
                  {verificationResult.bounds.lower} - {verificationResult.bounds.upper}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  User's exact score is hidden. Only tier membership is proven.
                </p>
              </div>
            </div>

            {/* What You Can Do With This Data */}
            <div className="bg-gradient-to-br from-bridge/10 via-surface/50 to-primary/10 rounded-xl p-6 border border-bridge/30">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">💡</span>
                <h3 className="text-white font-semibold">What You Can Do With This Data</h3>
              </div>

              <div className="space-y-3 text-sm text-gray-300">
                <div className="bg-surface/30 border border-border/50 rounded-lg p-4">
                  <p className="font-semibold text-white mb-2">✅ Verified Credit Tier: {verificationResult.tierName}</p>
                  <p className="text-gray-400">
                    Use this tier to apply YOUR lending policies:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                    <li>Set your own collateral requirements</li>
                    <li>Define your interest rates</li>
                    <li>Determine max borrow amounts</li>
                    <li>Apply your risk management rules</li>
                  </ul>
                </div>

                <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                  <p className="text-accent font-semibold mb-2">🏦 Example Integration</p>
                  <code className="text-xs text-gray-300 block">
                    {`if (tier >= 3) { // Gold or better
  applyPremiumPolicy(user);
} else {
  applyStandardPolicy(user);
}`}
                  </code>
                </div>

                <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-xs text-gray-400">
                  💡 <span className="font-semibold text-white">Remember:</span> KarmaTrust provides infrastructure. 
                  Your institution makes the lending decisions.
                </div>
              </div>
            </div>

            {/* Privacy Note */}
            <div className="bg-purple-900/20 border border-purple-700 rounded-xl p-4">
              <p className="text-xs text-gray-300">
                🔒 <span className="text-white font-medium">Privacy Protected:</span> You verified the user's tier without learning their exact credit score, transaction history, or wallet activity. Zero-knowledge proof validated cryptographically.
              </p>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all"
            >
              Verify Another Proof
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
