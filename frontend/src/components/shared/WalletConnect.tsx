/**
 * WalletConnect Component
 * 
 * Wallet connection button with status display.
 * Shows: connected address, chain, tier, connect/disconnect buttons.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWallet } from '../../hooks/useWallet';

const TIER_COLORS: Record<number, string> = {
  0: 'text-gray-400',
  1: 'text-amber-600',
  2: 'text-gray-300',
  3: 'text-yellow-400',
  4: 'text-cyan-400',
  5: 'text-purple-400',
};

export const WalletConnect: React.FC = () => {
  const {
    isConnected,
    isConnecting,
    isWrongChain,
    tier,
    tierName,
    shortAddress,
    connectWallet,
    disconnect,
    switchToBase,
  } = useWallet();

  if (!isConnected) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={connectWallet}
        disabled={isConnecting}
        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium text-sm hover:from-cyan-400 hover:to-blue-400 transition-all disabled:opacity-50"
      >
        {isConnecting ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Connecting...
          </span>
        ) : (
          'Connect Wallet'
        )}
      </motion.button>
    );
  }

  if (isWrongChain) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={switchToBase}
        className="px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg font-medium text-sm hover:bg-red-500/30 transition-all"
      >
        Switch to Base Sepolia
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        {/* Tier Badge */}
        {tier !== undefined && tier > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`px-2 py-1 rounded-md bg-white/5 border border-white/10 text-xs font-medium ${TIER_COLORS[tier] || 'text-white'}`}
          >
            {tierName}
          </motion.div>
        )}
        
        {/* Address & Disconnect */}
        <div className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-white/80 font-mono">{shortAddress}</span>
          <button
            onClick={() => disconnect()}
            className="ml-1 text-white/40 hover:text-red-400 transition-colors text-xs"
            title="Disconnect"
          >
            ✕
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
