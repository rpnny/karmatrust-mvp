/**
 * UserDashboard Component
 * 
 * The main dashboard view for users showing their complete credit profile.
 * This is the "User View" in the split-screen demo.
 * 
 * Displays:
 * - Credit score gauge (FICO-style)
 * - Factor breakdown chart
 * - EAS attestation status
 * - VCSM state info (coming soon)
 * 
 * Design: Full transparency - users see ALL their data
 * Contrast: Bank view only sees verified claims
 */

import { motion } from 'framer-motion';
import ScoreCard from '../shared/ScoreCard';
import FactorChart from '../shared/FactorChart';
import AttestationCard from '../shared/AttestationCard';
import ProofCard from '../shared/ProofCard';
import { CreditScoreData } from '../../hooks/useCredit';

// =============================================================================
// TYPES
// =============================================================================

interface UserDashboardProps {
  score: CreditScoreData;
  wallet: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function UserDashboard({ score, wallet }: UserDashboardProps) {
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
          Full credit profile • All data visible to you
        </p>
      </motion.div>

      {/* Wallet Address */}
      <motion.div 
        className="bg-surface/30 rounded-lg px-4 py-2 mb-6 flex items-center justify-between"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <span className="text-gray-400 text-sm">Wallet</span>
        <span className="font-mono text-sm text-primary">
          {wallet.slice(0, 6)}...{wallet.slice(-4)}
        </span>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 flex-1">
        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <ScoreCard
            score={score.score}
            ficoDisplay={score.ficoDisplay}
            level={score.level}
            levelName={score.levelName}
            risk={score.risk}
            dataSource={score.dataSource}
            trustLevel={score.trustLevel}
          />
        </motion.div>

        {/* Factor Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <FactorChart factors={score.factors} />
        </motion.div>

        {/* EAS Attestation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
        >
          <AttestationCard wallet={wallet} />
        </motion.div>

        {/* ZK Proof Generator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
        >
          <ProofCard 
            wallet={wallet} 
            currentTier={score.level}
            currentTierName={score.levelName}
          />
        </motion.div>

        {/* Additional Info Section */}
        <motion.div
          className="bg-surface/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="text-gray-400 text-sm font-medium tracking-wider mb-4">
            DATA TRANSPARENCY
          </h3>
          
          <div className="space-y-3">
            <InfoRow 
              label="Score Version" 
              value={score.meta?.version || '0.1.0-mvp'} 
            />
            <InfoRow 
              label="Data Source" 
              value={score.dataSource} 
            />
            <InfoRow 
              label="Trust Level" 
              value={`${score.trustLevel}%`} 
            />
            <InfoRow 
              label="Timestamp" 
              value={new Date(score.timestamp).toLocaleString()} 
            />
          </div>

          {/* Privacy Notice */}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <p className="text-xs text-gray-500 leading-relaxed">
              💡 <span className="text-gray-400">You see everything.</span> The bank view 
              only sees verified claims through ZK proofs – they cannot access your 
              exact score or underlying data.
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-300 font-mono">{value}</span>
    </div>
  );
}
