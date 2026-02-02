/**
 * Enhanced Bank/Protocol Dashboard - PRIVACY-FIRST DESIGN
 * 
 * KEY PRINCIPLE: Bank CANNOT access user data directly!
 * 
 * Bank can only receive information through two channels:
 * 1. Public EAS Attestation (user chose transparency for best rates)
 * 2. ZK Proof Verification (privacy-preserving, only reveals tier)
 * 
 * This is the CORE VALUE PROPOSITION of KarmaTrust:
 * - Users maintain full control over their credit data
 * - Banks get verifiable proof without seeing sensitive details
 * - Bridge translates between TradFi and DeFi seamlessly
 * 
 * Demo Flow:
 * - User generates Public/Privacy attestation in User View
 * - Bank enters Attestation ID to view data OR verifies ZK Proof
 * - Bank cannot "query by wallet" - that would defeat privacy!
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditScoreData } from '../../hooks/useCredit';
import ProofVerifier from '../shared/ProofVerifier';

// =============================================================================
// TYPES
// =============================================================================

interface EnhancedBankDashboardProps {
  score: CreditScoreData;  // For demo comparison only
  wallet: string;
}

interface AttestationData {
  type: 'public' | 'privacy';
  attestationId: string;
  wallet: string;
  // Public mode data
  ficoScore?: number;
  internalScore?: number;
  tier: number;
  tierName: string;
  riskRating?: string;
  // Privacy mode data
  commitment?: string;
  // Bridge translation
  collateralRatio: number;
  collateralSavings?: string;
  timestamp: number;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function EnhancedBankDashboard({ 
  score, 
  wallet
}: EnhancedBankDashboardProps) {
  const [activeTab, setActiveTab] = useState<'access' | 'overview' | 'verify'>('access');
  const [attestationData, setAttestationData] = useState<AttestationData | null>(null);
  const [loadingAttestation, setLoadingAttestation] = useState(false);
  const [attestationError, setAttestationError] = useState<string>('');
  const [inputAttestationId, setInputAttestationId] = useState('');

  // Fetch attestation by ID (this is how banks access data)
  const fetchAttestationById = async (attestationId: string) => {
    setLoadingAttestation(true);
    setAttestationError('');

    try {
      // In real implementation, this would query EAS on-chain
      // For demo, we'll simulate with backend API
      const response = await fetch(`/api/credit/attestation/${attestationId}`);
      const data = await response.json();

      if (data.success) {
        setAttestationData(data.data);
        setActiveTab('overview');
      } else {
        setAttestationError(data.error || 'Attestation not found');
      }
    } catch (err) {
      setAttestationError('Failed to fetch attestation. Please check the ID.');
    } finally {
      setLoadingAttestation(false);
    }
  };

  const handleAccessAttestation = () => {
    if (!inputAttestationId.trim()) {
      setAttestationError('Please enter an Attestation ID');
      return;
    }
    fetchAttestationById(inputAttestationId.trim());
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
          <h1 className="text-xl font-bold text-white">Institutional View</h1>
          <span className="px-2 py-0.5 bg-purple-900/30 border border-purple-700 rounded text-xs text-purple-300">
            🔒 Privacy-First
          </span>
        </div>
        <p className="text-sm text-gray-500">
          Access user credit data through attestations or ZK proofs only
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div 
        className="flex gap-2 mb-6 bg-surface/30 rounded-lg p-1"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <TabButton 
          active={activeTab === 'access'} 
          onClick={() => setActiveTab('access')}
          icon="🔑"
          label="Access Data"
        />
        <TabButton 
          active={activeTab === 'overview'} 
          onClick={() => setActiveTab('overview')}
          icon="📊"
          label="Overview"
          disabled={!attestationData}
        />
        <TabButton 
          active={activeTab === 'verify'} 
          onClick={() => setActiveTab('verify')}
          icon="🔐"
          label="Verify ZK Proof"
        />
      </motion.div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'access' && (
            <AccessTab 
              wallet={wallet}
              inputAttestationId={inputAttestationId}
              setInputAttestationId={setInputAttestationId}
              handleAccessAttestation={handleAccessAttestation}
              loadingAttestation={loadingAttestation}
              attestationError={attestationError}
            />
          )}
          {activeTab === 'overview' && attestationData && (
            <OverviewTab 
              attestationData={attestationData}
              demoScore={score}
            />
          )}
          {activeTab === 'verify' && (
            <VerifyTab />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// =============================================================================
// TAB COMPONENTS
// =============================================================================

function AccessTab({ 
  wallet,
  inputAttestationId,
  setInputAttestationId,
  handleAccessAttestation,
  loadingAttestation,
  attestationError
}: {
  wallet: string;
  inputAttestationId: string;
  setInputAttestationId: (value: string) => void;
  handleAccessAttestation: () => void;
  loadingAttestation: boolean;
  attestationError: string;
}) {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      {/* Explanation Card */}
      <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <span className="text-3xl">🔒</span>
          <div>
            <h3 className="text-white font-semibold mb-2">Privacy-First Access Control</h3>
            <p className="text-sm text-gray-300 mb-4">
              Banks cannot directly query user credit data. Users must explicitly share their attestation ID or provide a ZK proof.
            </p>
            <div className="space-y-2 text-xs text-gray-400">
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span><span className="text-white font-medium">Public Attestation:</span> User shares full data for best rates</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span><span className="text-white font-medium">Privacy Attestation:</span> User shares tier only via ZK proof</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                <span><span className="text-gray-500">Query by Wallet:</span> NOT allowed - protects user privacy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attestation ID Input */}
      <div className="bg-surface/50 rounded-xl p-6 border border-gray-800">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <span>🆔</span>
          <span>Enter Attestation ID</span>
        </h3>
        <p className="text-sm text-gray-400 mb-4">
          Ask the user to share their EAS Attestation ID from the User View
        </p>
        
        <div className="mb-4">
          <input
            type="text"
            value={inputAttestationId}
            onChange={(e) => setInputAttestationId(e.target.value)}
            placeholder="0x..."
            className="w-full bg-black/30 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <button
          onClick={handleAccessAttestation}
          disabled={loadingAttestation}
          className="w-full py-3 bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 text-white font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loadingAttestation ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Fetching Attestation...</span>
            </>
          ) : (
            <>
              <span>🔍</span>
              <span>Access Credit Data</span>
            </>
          )}
        </button>

        {attestationError && (
          <motion.div
            className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-sm text-red-300">❌ {attestationError}</p>
          </motion.div>
        )}
      </div>

      {/* Demo Helper */}
      <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-4">
        <p className="text-xs text-yellow-400">
          💡 <span className="font-semibold">Demo Tip:</span> Go to the User View (left side) → Generate a credential → Copy the Attestation ID → Paste it here
        </p>
      </div>

      {/* Current Applicant (for demo context only) */}
      <div className="bg-surface/30 rounded-xl p-4 border border-gray-800">
        <p className="text-xs text-gray-500 mb-2">Demo Context (Not visible to bank in production):</p>
        <p className="text-sm text-gray-400">
          Applicant: <span className="font-mono text-white">{wallet.slice(0, 6)}...{wallet.slice(-4)}</span>
        </p>
      </div>
    </motion.div>
  );
}

function OverviewTab({ 
  attestationData,
  demoScore
}: {
  attestationData: AttestationData;
  demoScore: CreditScoreData;
}) {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      {/* Attestation Type Banner */}
      <div className={`rounded-xl p-4 border-2 ${
        attestationData.type === 'public' 
          ? 'bg-primary/10 border-primary/30' 
          : 'bg-purple-900/20 border-purple-700'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Attestation Type</p>
            <p className="text-lg font-bold text-white">
              {attestationData.type === 'public' ? '👁️ Public Mode' : '🔐 Privacy Mode'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Credit Tier</p>
            <p className="text-2xl font-bold text-primary">{attestationData.tierName}</p>
          </div>
        </div>
      </div>

      {/* Data Display - Different for Public vs Privacy */}
      {attestationData.type === 'public' ? (
        <>
          {/* Bridge Translation - Full Data */}
          <div className="bg-gradient-to-br from-bridge/10 via-surface/50 to-tradfi/10 rounded-2xl p-6 border-2 border-bridge/30">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🌉</span>
              <h3 className="text-white font-semibold">Bridge Translation</h3>
              <span className="px-2 py-0.5 bg-green-900/30 border border-green-700 rounded text-xs text-green-300">
                Full Access
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* TradFi View */}
              <div className="bg-tradfi/10 border border-tradfi/30 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-3">TradFi Format</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">FICO Score</p>
                    <p className="text-2xl font-bold text-tradfi">{attestationData.ficoScore}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Risk Rating</p>
                    <p className="text-sm font-semibold text-white">{attestationData.riskRating}</p>
                  </div>
                </div>
              </div>

              {/* DeFi View */}
              <div className="bg-defi/10 border border-defi/30 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-3">DeFi Format</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500">Credit Tier</p>
                    <p className="text-xl font-bold text-defi">{attestationData.tierName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Collateral Ratio</p>
                    <p className="text-lg font-semibold text-white">{attestationData.collateralRatio}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Collateral Savings */}
          <div className="bg-green-900/20 border border-green-800 rounded-xl p-4">
            <p className="text-sm text-green-400">
              💰 With {attestationData.tierName} tier: {attestationData.collateralSavings || 'Calculated savings based on tier'}
            </p>
          </div>
        </>
      ) : (
        <>
          {/* Privacy Mode - Limited Data */}
          <div className="bg-purple-900/20 border border-purple-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🔐</span>
              <h3 className="text-white font-semibold">Privacy-Preserved Credit Data</h3>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-purple-900/30 border border-purple-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-2">Verified Tier</p>
                  <p className="text-xl font-bold text-purple-300">{attestationData.tierName}</p>
                </div>
                <div className="bg-purple-900/30 border border-purple-800 rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-2">Collateral Ratio</p>
                  <p className="text-xl font-bold text-purple-300">{attestationData.collateralRatio}%</p>
                </div>
              </div>

              <div className="bg-black/30 border border-purple-900 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2">Exact Score</p>
                <p className="text-sm text-gray-500">🔒 Hidden (Privacy Mode)</p>
              </div>

              <div className="bg-black/30 border border-purple-900 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-2">Commitment Hash</p>
                <p className="text-xs font-mono text-gray-400 break-all">{attestationData.commitment}</p>
                <p className="text-xs text-gray-500 mt-2">
                  ✓ Verifiable on-chain, cannot be reversed to reveal score
                </p>
              </div>
            </div>
          </div>

          <div className="bg-blue-900/20 border border-blue-800 rounded-xl p-4">
            <p className="text-xs text-gray-300">
              💡 <span className="text-white font-medium">Privacy Verification:</span> User can generate a ZK proof to verify their tier without revealing the exact score. Go to "Verify ZK Proof" tab to check.
            </p>
          </div>
        </>
      )}

      {/* EAS Attestation Details */}
      <div className="bg-surface/50 rounded-xl p-4 border border-gray-800">
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
              href={`https://sepolia.easscan.org/attestation/${attestationData.attestationId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-mono"
            >
              {attestationData.attestationId.slice(0, 10)}...
            </a>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Wallet</span>
            <span className="text-white font-mono">{attestationData.wallet.slice(0, 6)}...{attestationData.wallet.slice(-4)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function VerifyTab() {
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="bg-purple-900/20 border border-purple-700 rounded-xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-3xl">🔐</span>
          <div>
            <h3 className="text-white font-semibold mb-2">ZK Proof Verification</h3>
            <p className="text-sm text-gray-300">
              Verify a user's credit tier without seeing their exact score or transaction history.
            </p>
          </div>
        </div>
      </div>

      <ProofVerifier />
    </motion.div>
  );
}

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

function TabButton({ 
  active, 
  onClick, 
  icon, 
  label,
  disabled = false
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: string; 
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
        transition-all font-medium text-sm
        disabled:opacity-30 disabled:cursor-not-allowed
        ${active 
          ? 'bg-primary text-black' 
          : 'text-gray-400 hover:text-white hover:bg-surface/50'
        }
      `}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
