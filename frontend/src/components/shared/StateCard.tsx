/**
 * StateCard Component
 * 
 * Displays VCSM (Verifiable Credit State Machine) state information.
 * 
 * Shows:
 * - Current level with badge
 * - State hash (Poseidon commitment)
 * - Version number (replay protection)
 * - Hash chain visualization
 * - Upgrade path to next level
 * 
 * Design: Shows the "blockchain" aspect of credit state
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

// =============================================================================
// TYPES
// =============================================================================

interface VCSMState {
  stateId: string;
  level: number;
  levelName: string;
  stateHash: string;
  version: number;
  timestamp: number;
  attributes: {
    onTimePayments: number;
    defaultCount: number;
    debtRatio: number;
    kycVerified: boolean;
  };
}

interface StateCardProps {
  wallet: string;
  currentLevel: number;
  currentLevelName: string;
}

// =============================================================================
// API CONFIGURATION
// =============================================================================

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// Level colors
const LEVEL_COLORS: Record<string, string> = {
  Unverified: '#666666',
  Bronze: '#cd7f32',
  Silver: '#c0c0c0',
  Gold: '#ffd700',
  Platinum: '#e5e4e2',
  Diamond: '#b9f2ff',
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function StateCard({ wallet, currentLevelName }: StateCardProps) {
  const [state, setState] = useState<VCSMState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize or fetch VCSM state
   */
  const initializeState = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to get existing state first
      let response = await fetch(`${API_BASE}/vcsm/state/${wallet}`);
      let data = await response.json();

      if (!data.success && response.status === 404) {
        // Initialize new state
        response = await fetch(`${API_BASE}/vcsm/init`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: wallet }),
        });
        data = await response.json();
      }

      if (data.success) {
        setState(data.data);
      } else {
        setError(data.error || 'Failed to initialize state');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    if (wallet) {
      initializeState();
    }
  }, [wallet]);

  const levelColor = LEVEL_COLORS[currentLevelName] || '#00ff88';

  return (
    <div className="bg-surface/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-gray-400 text-sm font-medium tracking-wider">
          VCSM STATE
        </h2>
        <span className="text-xs text-gray-600">Verifiable Credit State Machine</span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="text-center py-6">
          <p className="text-red-400 text-sm mb-3">{error}</p>
          <button
            onClick={initializeState}
            className="text-primary text-sm hover:underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* State Display */}
      {state && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Level Badge */}
          <div className="flex items-center justify-center py-4">
            <div 
              className="flex items-center gap-3 px-6 py-3 rounded-xl border"
              style={{ 
                borderColor: levelColor + '40',
                backgroundColor: levelColor + '10',
              }}
            >
              <div 
                className="w-4 h-4 rounded-full"
                style={{ 
                  backgroundColor: levelColor,
                  boxShadow: `0 0 15px ${levelColor}`,
                }}
              />
              <span className="text-2xl font-bold" style={{ color: levelColor }}>
                {state.levelName}
              </span>
              <span className="text-gray-500 text-sm">
                Level {state.level}
              </span>
            </div>
          </div>

          {/* State Details */}
          <div className="bg-surface/50 rounded-lg p-4 border border-gray-800 space-y-3">
            <DetailRow 
              label="State Hash" 
              value={`${state.stateHash.slice(0, 12)}...`}
              mono
              tooltip="Poseidon(score, level, salt)"
            />
            <DetailRow 
              label="Version" 
              value={`v${state.version}`}
              tooltip="Replay protection counter"
            />
            <DetailRow 
              label="Last Updated" 
              value={new Date(state.timestamp).toLocaleString()}
            />
          </div>

          {/* Attributes */}
          <div className="bg-surface/50 rounded-lg p-4 border border-gray-800">
            <p className="text-gray-500 text-xs mb-3">Credit Attributes</p>
            <div className="grid grid-cols-2 gap-3">
              <AttributeBadge 
                label="Payments" 
                value={state.attributes.onTimePayments.toString()}
                icon="✓"
              />
              <AttributeBadge 
                label="Defaults" 
                value={state.attributes.defaultCount.toString()}
                icon="✗"
                negative={state.attributes.defaultCount > 0}
              />
              <AttributeBadge 
                label="Debt Ratio" 
                value={`${state.attributes.debtRatio}%`}
                icon="📊"
              />
              <AttributeBadge 
                label="KYC" 
                value={state.attributes.kycVerified ? 'Yes' : 'No'}
                icon="🪪"
              />
            </div>
          </div>

          {/* Hash Chain Visualization */}
          <div className="bg-surface/50 rounded-lg p-4 border border-gray-800">
            <p className="text-gray-500 text-xs mb-3">Hash Chain</p>
            <div className="flex items-center gap-2 text-xs font-mono overflow-x-auto">
              <span className="text-gray-600">Genesis</span>
              {Array.from({ length: Math.min(state.version, 5) }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-gray-700">→</span>
                  <span 
                    className={`px-2 py-1 rounded ${
                      i === state.version - 1 
                        ? 'bg-primary/20 text-primary' 
                        : 'bg-gray-800 text-gray-500'
                    }`}
                  >
                    v{i + 1}
                  </span>
                </div>
              ))}
              {state.version > 5 && (
                <span className="text-gray-600">...</span>
              )}
            </div>
          </div>

          {/* Tech Note */}
          <p className="text-xs text-gray-600 text-center">
            State secured by Poseidon hash • ZK-verifiable
          </p>
        </motion.div>
      )}

      {/* Not Initialized */}
      {!state && !loading && !error && (
        <div className="text-center py-6">
          <p className="text-gray-500 text-sm mb-4">
            Initialize your credit state to enable upgrades
          </p>
          <button
            onClick={initializeState}
            className="bg-primary text-black px-6 py-2 rounded-xl font-medium hover:bg-primary/90 transition"
          >
            Initialize State
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function DetailRow({ 
  label, 
  value, 
  mono = false,
  tooltip,
}: { 
  label: string; 
  value: string;
  mono?: boolean;
  tooltip?: string;
}) {
  return (
    <div className="flex justify-between items-center" title={tooltip}>
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm text-gray-300 ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function AttributeBadge({ 
  label, 
  value, 
  icon,
  negative = false,
}: { 
  label: string; 
  value: string;
  icon: string;
  negative?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
      negative ? 'bg-red-900/20' : 'bg-gray-800/50'
    }`}>
      <span>{icon}</span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm font-medium ${negative ? 'text-red-400' : 'text-gray-300'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}
