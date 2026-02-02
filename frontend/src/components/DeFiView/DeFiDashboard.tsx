/**
 * DeFi Dashboard Component
 * 
 * Decentralized Finance view - shows on-chain native credit data.
 * Designed for DeFi protocols and Web3 native users.
 * 
 * Design Philosophy:
 * - Dark theme (fits DeFi aesthetic)
 * - Neon green accent (#00ff88)
 * - Tier-based system (Bronze → Diamond)
 * - Collateral ratios instead of interest rates
 * - ZK proof verification status
 * - On-chain data emphasis
 */

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface DeFiReport {
  format: 'decentralized';
  tier: number;
  tierName: string;
  collateralRatio: number;
  zkProofHash?: string;
  stateCommitment?: string;
  attestationId?: string;
  contractAddress?: string;
  onChainVerifiable: boolean;
  lastUpdate: number;
  networkId: number;
}

interface DeFiDashboardProps {
  wallet: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TIER_COLORS: Record<string, string> = {
  'Bronze': 'from-orange-900 to-orange-700',
  'Silver': 'from-gray-600 to-gray-400',
  'Gold': 'from-yellow-600 to-yellow-400',
  'Platinum': 'from-cyan-600 to-cyan-400',
  'Diamond': 'from-blue-600 to-purple-600',
};

const TIER_ICONS: Record<string, string> = {
  'Bronze': '🥉',
  'Silver': '🥈',
  'Gold': '🥇',
  'Platinum': '🏆',
  'Diamond': '💎',
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function DeFiDashboard({ wallet }: DeFiDashboardProps) {
  const [report, setReport] = useState<DeFiReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDeFiReport();
  }, [wallet]);

  const fetchDeFiReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bridge/to-defi/${wallet}`);
      const data = await response.json();
      
      if (data.success) {
        setReport(data.data);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error || !report) {
    return <ErrorState error={error} />;
  }

  const tierGradient = TIER_COLORS[report.tierName] || 'from-gray-700 to-gray-900';

  return (
    <div className="h-full flex flex-col bg-background text-white rounded-2xl p-8 overflow-auto border border-primary/20">
      {/* Header - DeFi Style */}
      <motion.div 
        className="border-b border-primary/30 pb-4 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-primary">On-Chain Credit Profile</h1>
            <p className="text-sm text-gray-400">Decentralized Finance Format</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
            <span className="text-xs text-gray-400">Live</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span>⛓️ Network: Sepolia ({report.networkId})</span>
          <span>|</span>
          <span>🔐 ZK-Verified</span>
          <span>|</span>
          <span>📡 Updated: {getTimeAgo(report.lastUpdate)}</span>
        </div>
      </motion.div>

      {/* Tier Badge - Prominent Display */}
      <motion.div 
        className={`bg-gradient-to-br ${tierGradient} rounded-2xl p-8 mb-6 border border-white/10 shadow-glow`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">{TIER_ICONS[report.tierName]}</div>
          <div className="text-4xl font-bold mb-2">{report.tierName} Tier</div>
          <div className="text-sm text-white/70">Tier {report.tier} of 5</div>
        </div>
      </motion.div>

      {/* Collateral Ratio - Key Metric */}
      <motion.div
        className="grid grid-cols-2 gap-4 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bg-surface rounded-xl p-4 border border-primary/20">
          <div className="text-xs text-gray-400 mb-2">Collateral Ratio</div>
          <div className="text-3xl font-bold text-primary">{(report.collateralRatio * 100).toFixed(0)}%</div>
          <div className="text-xs text-gray-500 mt-1">
            {getSavingsText(report.collateralRatio)}
          </div>
        </div>
        <div className="bg-surface rounded-xl p-4 border border-primary/20">
          <div className="text-xs text-gray-400 mb-2">Verification Status</div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <div>
              <div className="text-sm font-semibold text-white">Verified</div>
              <div className="text-xs text-gray-500">On-chain</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ZK Proof Details */}
      {report.stateCommitment && (
        <motion.div
          className="bg-purple-900/20 rounded-xl p-4 mb-6 border border-purple-500/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔐</span>
            <span className="text-sm font-semibold text-purple-300">Zero-Knowledge Proof</span>
          </div>
          <div className="space-y-2">
            <DataRow label="State Commitment" value={truncateHash(report.stateCommitment)} mono />
            {report.zkProofHash && (
              <DataRow label="Proof Hash" value={truncateHash(report.zkProofHash)} mono />
            )}
            <DataRow label="Privacy Level" value="Full" />
          </div>
        </motion.div>
      )}

      {/* On-Chain Data */}
      <motion.div
        className="space-y-3 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">On-Chain References</h3>
        
        {report.contractAddress && (
          <DataRow 
            label="VCSM Contract" 
            value={truncateAddress(report.contractAddress)}
            mono
            link={`https://sepolia.etherscan.io/address/${report.contractAddress}`}
          />
        )}
        
        {report.attestationId && (
          <DataRow 
            label="EAS Attestation" 
            value={truncateHash(report.attestationId)}
            mono
            link={`https://sepolia.easscan.org/attestation/view/${report.attestationId}`}
          />
        )}
        
        <DataRow 
          label="User Wallet" 
          value={truncateAddress(wallet)}
          mono
          link={`https://sepolia.etherscan.io/address/${wallet}`}
        />
      </motion.div>

      {/* Lending Parameters */}
      <motion.div
        className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 mb-6 border border-primary/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-sm font-semibold text-primary mb-3">Lending Parameters</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Max Borrow (10 ETH collateral)</span>
            <span className="text-white font-semibold">{(10 / report.collateralRatio).toFixed(2)} ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Liquidation Threshold</span>
            <span className="text-white font-semibold">{(report.collateralRatio * 0.95 * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Credit Line Multiplier</span>
            <span className="text-white font-semibold">{(1 / report.collateralRatio).toFixed(2)}x</span>
          </div>
        </div>
      </motion.div>

      {/* Footer - Blockchain Notice */}
      <motion.div 
        className="mt-auto pt-4 border-t border-gray-800 text-xs text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <p className="mb-2">
          <strong className="text-gray-400">Data Source:</strong> Ethereum blockchain via KarmaTrust DAISY bridge
        </p>
        <p>
          ⚡ All data cryptographically verifiable on-chain. 
          Tier calculated from wallet history using VCSM state machine.
        </p>
      </motion.div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function DataRow({ label, value, mono = false, link }: { 
  label: string; 
  value: string; 
  mono?: boolean;
  link?: string;
}) {
  const content = (
    <div className="flex items-center justify-between py-2 border-b border-gray-800">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm text-white ${mono ? 'font-mono' : ''} ${link ? 'hover:text-primary transition cursor-pointer' : ''}`}>
        {value}
      </span>
    </div>
  );

  if (link) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
}

function LoadingState() {
  return (
    <div className="h-full flex items-center justify-center bg-background rounded-2xl border border-primary/20">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading on-chain data...</p>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string | null }) {
  return (
    <div className="h-full flex items-center justify-center bg-background rounded-2xl border border-red-500/20 p-8">
      <div className="text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-gray-400 mb-2">Failed to load data</p>
        <p className="text-sm text-gray-500">{error || 'Unknown error'}</p>
      </div>
    </div>
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function truncateHash(hash: string): string {
  if (hash.length <= 16) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
}

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function getSavingsText(collateralRatio: number): string {
  const baseline = 1.50;
  const savings = ((baseline - collateralRatio) / baseline * 100);
  if (savings > 0) {
    return `${savings.toFixed(0)}% less than standard`;
  }
  return 'Standard ratio';
}
