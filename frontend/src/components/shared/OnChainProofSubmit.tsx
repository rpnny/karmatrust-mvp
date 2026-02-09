/**
 * On-Chain Proof Submission Component
 * 
 * Allows connected wallet users to submit their ZK proof
 * directly to the CreditRegistryV2 contract for on-chain verification.
 * 
 * Flow: Score -> ZK Proof -> On-Chain Submit -> Tier Updated
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../../hooks/useWallet';
import { useSubmitProof } from '../../hooks/useSubmitProof';

const STEP_LABELS = {
  idle: 'Submit Proof On-Chain',
  scoring: 'Scoring wallet...',
  proving: 'Generating ZK proof...',
  submitting: 'Confirm in wallet...',
  confirming: 'Waiting for confirmation...',
  success: 'Tier updated on-chain!',
  error: 'Submission failed',
} as const;

const TIER_COLORS: Record<number, string> = {
  1: 'from-amber-600 to-amber-400',
  2: 'from-gray-400 to-gray-200',
  3: 'from-yellow-500 to-yellow-300',
  4: 'from-cyan-500 to-cyan-300',
  5: 'from-purple-500 to-purple-300',
};

export const OnChainProofSubmit: React.FC = () => {
  const { address, isConnected, tier, tierName, canSubmitProof, timeUntilNextProof, refetchTier } = useWallet();
  const { step, score, tierName: proofTierName, proofTime, txHash, error, gasUsed, submitProof, reset, isLoading } = useSubmitProof();

  if (!isConnected || !address) {
    return (
      <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
        <p className="text-gray-400 text-sm">Connect wallet to submit proof on-chain</p>
      </div>
    );
  }

  return (
    <motion.div
      className="p-5 bg-white/5 rounded-xl border border-white/10"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">On-Chain ZK Verification</h3>
        {tier !== undefined && tier > 0 && (
          <span className={`px-2 py-0.5 rounded-md text-xs font-medium bg-gradient-to-r ${TIER_COLORS[tier] || ''} text-black`}>
            Current: {tierName}
          </span>
        )}
      </div>

      {/* Current Status */}
      {tier !== undefined && (
        <div className="mb-4 text-xs text-gray-400">
          {tier === 0 ? (
            <p>No tier yet. Submit a proof to get your first tier.</p>
          ) : (
            <p>Your on-chain tier: <span className="text-white font-medium">{tierName}</span></p>
          )}
        </div>
      )}

      {/* Cooldown Warning */}
      {canSubmitProof === false && timeUntilNextProof !== undefined && timeUntilNextProof > 0 && (
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-400 text-xs">
            Cooldown active. Next proof in {Math.ceil(timeUntilNextProof / 3600)}h {Math.ceil((timeUntilNextProof % 3600) / 60)}m
          </p>
        </div>
      )}

      {/* Progress Steps */}
      {step !== 'idle' && step !== 'error' && (
        <div className="mb-4 space-y-2">
          {(['scoring', 'proving', 'submitting', 'confirming', 'success'] as const).map((s, i) => {
            const isActive = s === step;
            const isDone = ['scoring', 'proving', 'submitting', 'confirming', 'success'].indexOf(step) > i;
            
            return (
              <motion.div
                key={s}
                className={`flex items-center gap-2 text-xs ${
                  isActive ? 'text-cyan-400' : isDone ? 'text-green-400' : 'text-gray-600'
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                {isDone ? (
                  <span className="text-green-400">&#10003;</span>
                ) : isActive ? (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    &#8635;
                  </motion.span>
                ) : (
                  <span className="text-gray-600">&#9675;</span>
                )}
                <span>{STEP_LABELS[s]}</span>
                {s === 'scoring' && isDone && score && (
                  <span className="text-gray-500 ml-auto">Score: {score}</span>
                )}
                {s === 'proving' && isDone && proofTime && (
                  <span className="text-gray-500 ml-auto">{proofTime}ms</span>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Success */}
      {step === 'success' && (
        <motion.div
          className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <p className="text-green-400 text-sm font-medium mb-1">Tier verified on-chain!</p>
          <p className="text-green-400/70 text-xs">Tier: {proofTierName} | Gas: {gasUsed}</p>
          {txHash && (
            <a
              href={`https://sepolia.basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-cyan-400 hover:underline mt-1 block"
            >
              View on BaseScan &rarr;
            </a>
          )}
        </motion.div>
      )}

      {/* Error */}
      {step === 'error' && error && (
        <motion.div
          className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Action Button */}
      <motion.button
        onClick={() => {
          if (step === 'success' || step === 'error') {
            reset();
            refetchTier();
          } else {
            submitProof(address);
          }
        }}
        disabled={isLoading || canSubmitProof === false}
        className={`w-full py-3 rounded-lg font-medium text-sm transition-all ${
          step === 'success'
            ? 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'
            : step === 'error'
            ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
            : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-400 hover:to-blue-400'
        } disabled:opacity-50`}
        whileHover={!isLoading ? { scale: 1.02 } : undefined}
        whileTap={!isLoading ? { scale: 0.98 } : undefined}
      >
        {step === 'success' ? 'Done - Reset' : step === 'error' ? 'Try Again' : STEP_LABELS[step]}
      </motion.button>
    </motion.div>
  );
};
