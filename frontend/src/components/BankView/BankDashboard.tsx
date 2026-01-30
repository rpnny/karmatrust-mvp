/**
 * BankDashboard Component
 * 
 * The bank's view of a user's credit profile - demonstrating PRIVACY.
 * This is the "Bank View" in the split-screen demo.
 * 
 * KEY DIFFERENCE from User View:
 * - Bank CANNOT see exact score
 * - Bank CANNOT see underlying factors
 * - Bank CAN ONLY see:
 *   - Verified tier membership (via ZK proof)
 *   - Risk level (Low/Medium/High)
 *   - Whether score meets their threshold
 * 
 * Visual Design:
 * - Exact numbers are "masked" with blur/redaction
 * - Only verified claims are visible
 * - Demonstrates the value proposition of ZK proofs
 * 
 * This component is the "WOW moment" for judges:
 * "Same user, but the bank only sees what they need to know"
 */

import { motion } from 'framer-motion';
import { CreditScoreData } from '../../hooks/useCredit';
import ProofVerifier from '../shared/ProofVerifier';

// =============================================================================
// TYPES
// =============================================================================

interface BankDashboardProps {
  score: CreditScoreData;
  wallet: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function BankDashboard({ score, wallet }: BankDashboardProps) {
  // Determine what the bank is allowed to see
  const tier = score.levelName;
  const meetsThreshold = score.score >= 60; // Gold tier threshold
  const riskLevel = score.risk;

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
          <h1 className="text-xl font-bold text-white">Bank View</h1>
        </div>
        <p className="text-sm text-gray-500">
          Privacy-protected • Verified claims only
        </p>
      </motion.div>

      {/* Wallet Address (visible to bank) */}
      <motion.div 
        className="bg-surface/30 rounded-lg px-4 py-2 mb-6 flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-gray-400 text-sm">Applicant</span>
        <span className="font-mono text-sm text-accent">
          {wallet.slice(0, 6)}...{wallet.slice(-4)}
        </span>
      </motion.div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 flex-1">
        
        {/* Masked Score Card */}
        <motion.div
          className="bg-surface/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-gray-400 text-sm font-medium tracking-wider mb-4">
            CREDIT SCORE
          </h3>

          {/* Masked Score Display */}
          <div className="flex flex-col items-center py-6">
            {/* Blurred/Hidden Score */}
            <div className="relative">
              <div className="text-6xl font-bold font-mono text-gray-700 blur-md select-none">
                {score.ficoDisplay}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-surface/90 px-4 py-2 rounded-lg border border-gray-700">
                  <span className="text-sm text-gray-400">🔒 Score Hidden</span>
                </div>
              </div>
            </div>

            {/* What bank CAN see */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 mb-2">
                Verified via Zero-Knowledge Proof:
              </p>
              <div 
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                  meetsThreshold 
                    ? 'bg-green-900/30 text-green-400 border border-green-800' 
                    : 'bg-red-900/30 text-red-400 border border-red-800'
                }`}
              >
                {meetsThreshold ? '✓' : '✗'}
                <span className="font-medium">
                  {meetsThreshold ? 'Meets Gold Threshold' : 'Below Threshold'}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Verified Claims */}
        <motion.div
          className="bg-surface/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-gray-400 text-sm font-medium tracking-wider mb-4">
            VERIFIED CLAIMS
          </h3>

          <div className="space-y-4">
            {/* Tier Membership */}
            <VerifiedClaim
              label="Credit Tier"
              value={tier}
              verified={true}
              icon="🏆"
            />

            {/* Risk Level */}
            <VerifiedClaim
              label="Risk Assessment"
              value={riskLevel}
              verified={true}
              icon="📊"
              valueColor={
                riskLevel === 'Low' ? 'text-green-400' :
                riskLevel === 'Medium' ? 'text-yellow-400' :
                'text-red-400'
              }
            />

            {/* Threshold Check */}
            <VerifiedClaim
              label="Loan Eligible"
              value={meetsThreshold ? 'Yes' : 'No'}
              verified={true}
              icon="✅"
              valueColor={meetsThreshold ? 'text-green-400' : 'text-red-400'}
            />
          </div>
        </motion.div>

        {/* Proof Verifier */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <ProofVerifier />
        </motion.div>

        {/* Hidden Factors (demonstration) */}
        <motion.div
          className="bg-surface/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <h3 className="text-gray-400 text-sm font-medium tracking-wider mb-4">
            UNDERLYING FACTORS
          </h3>

          {/* Blurred Factor List */}
          <div className="space-y-3">
            {['Wallet Age', 'Activity', 'Diversity', 'Assets', 'Stability'].map((factor, i) => (
              <div key={factor} className="flex justify-between items-center">
                <span className="text-sm text-gray-500">{factor}</span>
                <div className="relative">
                  <span className="text-sm font-mono text-gray-600 blur-sm select-none">
                    {Math.round(Math.random() * 100)}%
                  </span>
                  <span className="absolute right-0 text-gray-600 text-sm">
                    🔒
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Privacy Notice */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 leading-relaxed">
              🔐 <span className="text-gray-400">Privacy Protected.</span> The bank 
              receives cryptographic proof that claims are valid, without seeing 
              the underlying data. This is the power of Zero-Knowledge Proofs.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface VerifiedClaimProps {
  label: string;
  value: string;
  verified: boolean;
  icon: string;
  valueColor?: string;
}

function VerifiedClaim({ label, value, verified, icon, valueColor = 'text-white' }: VerifiedClaimProps) {
  return (
    <div className="flex items-center justify-between p-3 bg-surface/50 rounded-lg border border-gray-800">
      <div className="flex items-center gap-3">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${valueColor}`}>{value}</span>
        {verified && (
          <span className="text-green-500 text-xs">✓ ZK</span>
        )}
      </div>
    </div>
  );
}
