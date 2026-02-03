/**
 * Home Page
 * 
 * Landing page for KarmaTrust.
 * 
 * Design: Bloomberg terminal aesthetic + OKX tech vibes
 * - Dark background with subtle gradients
 * - Neon green primary color
 * - Professional typography
 * 
 * Features:
 * - Wallet input with validation
 * - Quick access to example wallets
 * - Animated background effects
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

// =============================================================================
// CONSTANTS
// =============================================================================

const EXAMPLE_WALLETS = [
  { name: 'Vitalik', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', icon: '👑' },
  { name: 'Alice', address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', icon: '👤' },
  { name: 'Bob', address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', icon: '👨‍💼' },
];

const FEATURES = [
  { icon: '🔐', title: 'ZK Privacy', desc: 'Prove creditworthiness without revealing data' },
  { icon: '⚡', title: 'On-Chain', desc: 'Verifiable attestations via EAS' },
  { icon: '🛡️', title: 'Anti-Sybil', desc: 'Built into ZK circuits, impossible to game' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export default function Home() {
  const [wallet, setWallet] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate wallet format
    if (!wallet) {
      setError('Please enter a wallet address');
      return;
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      setError('Invalid Ethereum address format');
      return;
    }

    setError('');
    navigate(`/demo/${wallet}`);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(to right, #00ff88 1px, transparent 1px),
              linear-gradient(to bottom, #00ff88 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        {/* Logo & Title */}
        <motion.div 
          className="text-center mb-12"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-6xl md:text-7xl font-bold mb-4">
            <span className="text-primary">Karma</span>
            <span className="text-white">Trust</span>
          </h1>
          <p className="text-xl text-gray-400 font-mono">
            The DeFi-TradFi Bridge
          </p>
          <p className="text-sm text-gray-600 mt-2">
            VCSM • ZK Proofs • EAS • Bridge Translation
          </p>
        </motion.div>

        {/* Wallet Input Card */}
        <motion.div 
          className="w-full max-w-xl bg-surface/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-800"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <form onSubmit={handleSubmit}>
            {/* Input */}
            <div className="mb-4">
              <label className="block text-gray-400 text-sm mb-2">
                Enter Wallet Address
              </label>
              <input
                type="text"
                value={wallet}
                onChange={(e) => {
                  setWallet(e.target.value);
                  setError('');
                }}
                placeholder="0x..."
                className="w-full bg-background border border-gray-700 rounded-xl px-4 py-4 text-white font-mono placeholder-gray-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition"
              />
              {error && (
                <p className="text-red-400 text-sm mt-2">{error}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-primary text-black py-4 rounded-xl font-semibold text-lg hover:bg-primary/90 transition transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Analyze Credit Score →
            </button>
          </form>

          {/* Example Wallets */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-gray-500 text-sm mb-3 text-center">Quick Access</p>
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLE_WALLETS.map((w) => (
                <button
                  key={w.name}
                  onClick={() => navigate(`/demo/${w.address}`)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-surface rounded-lg text-sm text-gray-300 hover:text-primary hover:border-primary border border-gray-700 transition"
                >
                  <span>{w.icon}</span>
                  <span>{w.name}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div 
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="text-center p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            >
              <span className="text-4xl mb-3 block">{feature.icon}</span>
              <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
              <p className="text-gray-500 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Tech Stack Badge */}
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p className="text-xs text-gray-600 mb-2">Powered by</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Poseidon Hash', 'Groth16', 'EAS', 'Circom'].map((tech) => (
              <span 
                key={tech}
                className="px-3 py-1 bg-surface rounded-full text-xs text-gray-500 border border-gray-800"
              >
                {tech}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 py-4 text-center text-gray-600 text-xs">
        <p>ETHGlobal Hackathon 2026 • MIT License</p>
      </footer>
    </div>
  );
}
