/**
 * ZK Proof Generator
 * 
 * Independent module for generating ZK proofs
 * Allows users to prove their credit tier without revealing exact score
 * 
 * Flow:
 * 1. User selects minimum tier they want to prove
 * 2. Click "Generate ZK Proof"
 * 3. Backend generates Groth16 proof via SnarkJS
 * 4. Display proof string for copying
 */

import { useState } from 'react';
import { motion } from 'framer-motion';

interface ZKProofGeneratorProps {
  wallet: string;
  currentTier: number;
  currentTierName: string;
}

interface ZKProofData {
  proof: any;
  publicSignals: string[];
  proofString: string;
}

const TIER_OPTIONS = [
  { value: 1, name: 'Bronze', color: 'from-orange-900 to-orange-700' },
  { value: 2, name: 'Silver', color: 'from-gray-600 to-gray-400' },
  { value: 3, name: 'Gold', color: 'from-yellow-600 to-yellow-400' },
  { value: 4, name: 'Platinum', color: 'from-purple-600 to-purple-400' },
  { value: 5, name: 'Diamond', color: 'from-blue-400 to-cyan-300' },
];

export default function ZKProofGenerator({ 
  wallet, 
  currentTier,
  currentTierName 
}: ZKProofGeneratorProps) {
  const [selectedTier, setSelectedTier] = useState<number>(currentTier);
  const [zkProof, setZkProof] = useState<ZKProofData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string>('');

  const handleGenerateProof = async () => {
    setGenerating(true);
    setError('');
    setZkProof(null);

    try {
      // Normalize address to lowercase to avoid checksum issues
      const normalizedWallet = wallet.toLowerCase();
      
      const response = await fetch('http://localhost:3000/api/zkp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: normalizedWallet,
          tier: selectedTier,
        }),
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate proof');
      }

      // Backend returns { success: true, data: { proof, publicSignals, ... } }
      // Create proof string for display and copying
      const proofString = JSON.stringify({
        proof: data.data.proof,
        publicSignals: data.data.publicSignals,
      }, null, 2);

      setZkProof({
        proof: data.data.proof,
        publicSignals: data.data.publicSignals,
        proofString: proofString,
      });
    } catch (err: any) {
      console.error('Proof generation error:', err);
      setError(err.message || 'Failed to generate ZK proof');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyProof = () => {
    if (zkProof?.proofString) {
      navigator.clipboard.writeText(zkProof.proofString);
      alert('✓ Proof copied to clipboard!');
    }
  };

  const handleReset = () => {
    setZkProof(null);
    setError('');
    setSelectedTier(currentTier);
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-purple-900/20 via-surface/50 to-blue-900/20 rounded-xl p-6 border border-purple-800/50"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔐</span>
          <div>
            <h3 className="text-lg font-bold text-white">ZK Proof Generator</h3>
            <p className="text-xs text-gray-400">Prove your tier without revealing your score</p>
          </div>
        </div>
        <div className="px-3 py-1.5 bg-purple-900/30 border border-purple-700 rounded-lg">
          <div className="text-xs text-gray-400">Your Tier</div>
          <div className="text-sm font-bold text-purple-300">{currentTierName}</div>
        </div>
      </div>

      {!zkProof ? (
        <>
          {/* Tier Selection */}
          <div className="mb-6">
            <label className="block text-sm text-gray-300 mb-3">
              Select minimum tier to prove:
            </label>
            <div className="grid grid-cols-5 gap-2">
              {TIER_OPTIONS.map((tier) => (
                <button
                  key={tier.value}
                  onClick={() => setSelectedTier(tier.value)}
                  disabled={tier.value > currentTier || generating}
                  className={`
                    relative p-3 rounded-lg border-2 transition-all text-center
                    ${tier.value > currentTier 
                      ? 'opacity-30 cursor-not-allowed bg-gray-800 border-gray-700' 
                      : selectedTier === tier.value
                        ? 'border-purple-500 bg-purple-900/30 scale-105'
                        : 'border-gray-700 bg-surface hover:border-purple-700'
                    }
                  `}
                >
                  <div className="text-xs text-gray-400 mb-1">Tier {tier.value}</div>
                  <div className="text-sm font-bold text-white">{tier.name}</div>
                  {tier.value > currentTier && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                      <span className="text-xs text-red-400">🔒</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 You can only prove tiers at or below your current tier ({currentTierName})
            </p>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateProof}
            disabled={generating}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating ZK Proof...</span>
              </>
            ) : (
              <>
                <span>⚡</span>
                <span>Generate ZK Proof</span>
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <motion.div
              className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-sm text-red-300">❌ {error}</p>
            </motion.div>
          )}

          {/* Info */}
          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
            <p className="text-xs text-gray-300">
              🔒 <span className="text-white font-medium">Privacy Guaranteed:</span> The proof proves you meet the tier requirement without revealing your exact score, transaction history, or any other sensitive data.
            </p>
          </div>
        </>
      ) : (
        <>
          {/* Success State */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {/* Success Header */}
            <div className="mb-4 p-4 bg-green-900/30 border border-green-700 rounded-xl text-center">
              <div className="text-3xl mb-2">✓</div>
              <div className="text-lg font-bold text-green-300 mb-1">ZK Proof Generated!</div>
              <div className="text-sm text-gray-300">
                Proving tier: <span className="font-bold text-white">{TIER_OPTIONS.find(t => t.value === selectedTier)?.name}</span>
              </div>
            </div>

            {/* Proof Display */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-gray-300 font-medium">Proof String:</label>
                <button
                  onClick={handleCopyProof}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                >
                  <span>📋</span>
                  <span>Copy Proof</span>
                </button>
              </div>
              <div className="bg-black/50 rounded-lg p-4 border border-gray-700 max-h-40 overflow-y-auto">
                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap break-all">
                  {zkProof.proofString}
                </pre>
              </div>
            </div>

            {/* Instructions */}
            <div className="mb-4 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">
                📤 <span className="text-white font-medium">Next Step:</span>
              </p>
              <ol className="text-xs text-gray-400 space-y-1 ml-4">
                <li>1. Copy the proof string above</li>
                <li>2. Go to the <span className="text-white font-medium">Bank View</span> (right side)</li>
                <li>3. Navigate to the <span className="text-purple-300 font-medium">"Verify Proof"</span> tab</li>
                <li>4. Paste the proof and click verify</li>
              </ol>
            </div>

            {/* Reset Button */}
            <button
              onClick={handleReset}
              className="w-full py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-all"
            >
              Generate Another Proof
            </button>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
