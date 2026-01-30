/**
 * AttestationCard Component
 * 
 * Displays EAS attestation status and allows creating new attestations.
 * 
 * Features:
 * - Create attestation button
 * - Loading state with animation
 * - Display attestation ID (truncated)
 * - Link to EASScan explorer
 * - Simulation mode indicator
 * 
 * Why EAS Attestations?
 * - On-chain verifiable proof of credit score
 * - Third parties can verify without trusting us
 * - Standard format understood by DeFi protocols
 * - Revocable if fraud detected
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =============================================================================
// TYPES
// =============================================================================

interface AttestationData {
  attestationId: string;
  explorerUrl: string;
  schemaId: string;
  recipient: string;
  txHash?: string;
  blockNumber?: number;
  isSimulated?: boolean;
}

interface AttestationCardProps {
  wallet: string;
  onAttestationCreated?: (attestation: AttestationData) => void;
}

// =============================================================================
// API CONFIGURATION
// =============================================================================

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// =============================================================================
// COMPONENT
// =============================================================================

export default function AttestationCard({ wallet, onAttestationCreated }: AttestationCardProps) {
  const [attestation, setAttestation] = useState<AttestationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a new attestation
   */
  const createAttestation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/credit/attest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet }),
      });

      const data = await response.json();

      if (data.success) {
        setAttestation(data.data.attestation);
        onAttestationCreated?.(data.data.attestation);
      } else {
        setError(data.error || 'Failed to create attestation');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Copy attestation ID to clipboard
   */
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="bg-surface/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-gray-400 text-sm font-medium tracking-wider">
          EAS ATTESTATION
        </h2>
        {attestation?.isSimulated && (
          <span className="text-xs bg-yellow-900/30 text-yellow-500 px-2 py-0.5 rounded-full border border-yellow-800/50">
            Simulated
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Not yet created */}
        {!attestation && !loading && (
          <motion.div
            key="create"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center py-8"
          >
            {/* Info */}
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <span className="text-3xl">📜</span>
            </div>
            <p className="text-gray-400 text-sm text-center mb-6 max-w-xs">
              Create an on-chain attestation to prove your credit score to third parties
            </p>

            {/* Create Button */}
            <button
              onClick={createAttestation}
              className="bg-primary text-black px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Create Attestation
            </button>

            {/* Error */}
            {error && (
              <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
            )}
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center py-8"
          >
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-gray-400 text-sm mt-4 animate-pulse">
              Creating attestation...
            </p>
            <p className="text-gray-600 text-xs mt-2">
              This may take a few seconds
            </p>
          </motion.div>
        )}

        {/* Attestation Created */}
        {attestation && !loading && (
          <motion.div
            key="created"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Success Badge */}
            <div className="flex items-center justify-center gap-2 py-2">
              <div className="w-8 h-8 rounded-full bg-green-900/30 flex items-center justify-center">
                <span className="text-green-400">✓</span>
              </div>
              <span className="text-green-400 font-medium">
                Attestation Created
              </span>
            </div>

            {/* Attestation ID */}
            <div className="bg-surface/50 rounded-lg p-4 border border-gray-800">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-500 text-xs">Attestation ID</span>
                <button
                  onClick={() => copyToClipboard(attestation.attestationId)}
                  className="text-gray-500 hover:text-primary text-xs transition"
                >
                  Copy
                </button>
              </div>
              <p className="font-mono text-sm text-white break-all">
                {attestation.attestationId.slice(0, 20)}...{attestation.attestationId.slice(-8)}
              </p>
            </div>

            {/* Details */}
            <div className="space-y-2">
              {attestation.txHash && (
                <DetailRow 
                  label="Transaction" 
                  value={`${attestation.txHash.slice(0, 10)}...`}
                />
              )}
              {attestation.blockNumber && (
                <DetailRow 
                  label="Block" 
                  value={`#${attestation.blockNumber}`}
                />
              )}
              <DetailRow 
                label="Status" 
                value={attestation.isSimulated ? 'Simulated' : 'On-Chain'}
                valueColor={attestation.isSimulated ? 'text-yellow-400' : 'text-green-400'}
              />
            </div>

            {/* View on EASScan */}
            <a
              href={attestation.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-surface hover:bg-gray-800 text-primary py-3 rounded-xl transition border border-gray-800"
            >
              View on EASScan ↗
            </a>

            {/* Create Another */}
            <button
              onClick={() => setAttestation(null)}
              className="block w-full text-center text-gray-500 hover:text-gray-300 text-sm py-2 transition"
            >
              Create Another
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function DetailRow({ 
  label, 
  value, 
  valueColor = 'text-gray-300' 
}: { 
  label: string; 
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`font-mono ${valueColor}`}>{value}</span>
    </div>
  );
}
