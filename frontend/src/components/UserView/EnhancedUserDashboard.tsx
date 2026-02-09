/**
 * Enhanced User Dashboard - Bloomberg/OKX Style
 * 
 * User's view of their credit profile with REAL functionality:
 * - Professional credit gauge visualization
 * - Radar chart for factor breakdown
 * - Dual-Mode Credentials (Public vs Privacy)
 * - Real EAS attestation generation
 * - Real ZK proof generation via API
 * 
 * Design: Bloomberg terminal + OKX professional trading interface
 */

import { motion } from 'framer-motion';
import { CreditScoreData } from '../../hooks/useCredit';
import CredentialManager from '../shared/CredentialManager';
import ProofCard from '../shared/ProofCard';
import CreditGauge from '../ui/CreditGauge';
import CreditRadarChart from '../ui/CreditRadarChart';
import DataTerminal, { DataRow } from '../ui/DataTerminal';
import { TierBadge, LiveIndicator } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/LoadingStates';

// =============================================================================
// TYPES
// =============================================================================

interface EnhancedUserDashboardProps {
  score: CreditScoreData;
  wallet: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function EnhancedUserDashboard({ 
  score, 
  wallet
}: EnhancedUserDashboardProps) {
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
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center border border-primary/20"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <span className="text-xl">👤</span>
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-white">User Terminal</h1>
              <p className="text-xs text-gray-500">Full access to your credit data</p>
            </div>
          </div>
          <LiveIndicator label="REAL-TIME" color="#00ff88" />
        </div>
      </motion.div>

      {/* Wallet Info Bar */}
      <motion.div 
        className="flex items-center justify-between bg-black/30 rounded-lg px-4 py-2 mb-6 border border-gray-800/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-xs text-gray-500">Connected</span>
        </div>
        <span className="font-mono text-sm text-white">
          {wallet.slice(0, 6)}...{wallet.slice(-4)}
        </span>
        <TierBadge tier={score.levelName} size="sm" />
      </motion.div>

      {/* Main Content */}
      <div className="space-y-5 flex-1 overflow-y-auto pr-1 custom-scrollbar">
        
        {/* Credit Score Gauge - Hero Section */}
        <motion.div
          className="relative bg-gradient-to-br from-primary/5 via-black/30 to-accent/5 rounded-2xl p-6 border border-primary/20 overflow-hidden"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Background glow */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
          </div>
          
          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Gauge */}
            <CreditGauge
              score={score.score}
              ficoScore={score.ficoDisplay}
              tier={score.levelName}
              className="flex-shrink-0"
            />
            
            {/* Stats Grid */}
            <div className="flex-1 grid grid-cols-2 gap-3 w-full lg:w-auto">
              <motion.div 
                className="bg-black/40 rounded-xl p-4 border border-gray-800/50"
                whileHover={{ scale: 1.02, borderColor: 'rgba(0, 255, 136, 0.3)' }}
              >
                <div className="text-xs text-gray-500 mb-1">Internal Score</div>
                <div className="text-2xl font-bold font-mono text-white">{score.score}</div>
                <div className="text-xs text-gray-600">/ 100</div>
              </motion.div>
              
              <motion.div 
                className="bg-black/40 rounded-xl p-4 border border-gray-800/50"
                whileHover={{ scale: 1.02, borderColor: 'rgba(255, 215, 0, 0.3)' }}
              >
                <div className="text-xs text-gray-500 mb-1">Risk Level</div>
                <div className="text-2xl font-bold text-accent">{score.risk}</div>
                <div className="text-xs text-gray-600">{score.dataSource}</div>
              </motion.div>
              
              <motion.div 
                className="col-span-2 bg-black/40 rounded-xl p-4 border border-gray-800/50"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">Credit Strength</span>
                  <span className="text-xs font-mono text-primary">{score.score}%</span>
                </div>
                <ProgressBar progress={score.score} showPercentage={false} />
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Factor Analysis with Radar Chart */}
        <DataTerminal
          title="Factor Analysis"
          icon="📊"
          status="live"
          highlight="primary"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Radar Chart */}
            <CreditRadarChart factors={score.factors} className="h-[280px]" />
            
            {/* Factor List */}
            <div className="space-y-3">
              {Object.entries(score.factors).map(([key, value], index) => (
                <motion.div 
                  key={key}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">{formatFactorName(key)}</span>
                    <span className="text-white font-mono font-medium">
                      {(value * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="relative h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-emerald-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(value * 100, 100)}%` }}
                      transition={{ delay: 0.5 + index * 0.05, duration: 0.8 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </DataTerminal>

        {/* Dual-Mode Credential Manager */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <CredentialManager
            wallet={wallet}
            score={score.score}
            ficoDisplay={score.ficoDisplay}
            level={score.level}
            levelName={score.levelName}
          />
        </motion.div>

        {/* ZK Proof Generator */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <ProofCard
            wallet={wallet}
            currentTier={score.level}
            currentTierName={score.levelName}
          />
        </motion.div>

        {/* EAS Attestation Status */}
        <DataTerminal
          title="EAS Attestation"
          icon="⛓️"
          status="verified"
          highlight="purple"
        >
          <div className="space-y-1">
            <DataRow 
              label="Attestation ID" 
              value={
                <span className="text-xs text-gray-400">
                  Create via <span className="text-white">Credential Manager</span>
                </span>
              }
            />
            <DataRow label="Network" value="Sepolia Testnet" />
            <DataRow label="Schema" value="KarmaTrust Credit v1.0" />
          </div>
        </DataTerminal>

        {/* Privacy Tip */}
        <motion.div
          className="bg-gradient-to-r from-purple-900/20 via-blue-900/20 to-purple-900/20 border border-purple-800/30 rounded-xl p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          whileHover={{ borderColor: 'rgba(139, 92, 246, 0.5)' }}
        >
          <div className="flex items-start gap-3">
            <motion.span 
              className="text-2xl"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              💡
            </motion.span>
            <div>
              <p className="text-sm text-white font-medium mb-1">Privacy Mode</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Generate a ZK proof to prove your credit tier to banks without revealing your exact score or transaction history. Your financial privacy is protected by zero-knowledge cryptography.
              </p>
            </div>
          </div>
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
    wallet_age: 'Wallet Age',
    transaction_frequency: 'Activity',
    protocol_diversity: 'Diversity',
    asset_value: 'Assets',
    volatility: 'Stability',
    stability: 'Consistency',
    scamRisk: 'Safety',
    liquidityScore: 'Liquidity',
    antiSybilScore: 'Anti-Sybil',
  };
  return names[key] || key;
}
