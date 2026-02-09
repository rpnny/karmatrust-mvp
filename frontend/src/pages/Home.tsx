/**
 * Home Page - Bloomberg/OKX Terminal Style
 * 
 * Professional landing page for KarmaTrust.
 * 
 * Design: Bloomberg terminal aesthetic + OKX tech vibes
 * - Dark background with animated particles
 * - Neon green primary color with glow effects
 * - Professional typography with animated numbers
 * - Glassmorphism cards
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import { TechBadge, LiveIndicator } from '../components/ui/StatusBadge';
import { PulseLoader } from '../components/ui/LoadingStates';
import { WalletConnect } from '../components/shared/WalletConnect';

// =============================================================================
// CONSTANTS
// =============================================================================

const EXAMPLE_WALLETS = [
  { name: 'Vitalik', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', icon: '👑' },
  { name: 'Alice', address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e', icon: '👤' },
  { name: 'Bob', address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', icon: '👨‍💼' },
];

const FEATURES = [
  { 
    icon: '🔐', 
    title: 'Zero Knowledge', 
    desc: 'Prove creditworthiness without revealing sensitive data',
    color: '#8b5cf6',
  },
  { 
    icon: '⚡', 
    title: 'On-Chain Verified', 
    desc: 'Cryptographically verified attestations via EAS',
    color: '#00ff88',
  },
  { 
    icon: '🛡️', 
    title: 'Anti-Sybil', 
    desc: 'Built into ZK circuits, mathematically impossible to game',
    color: '#ffd700',
  },
  { 
    icon: '🌉', 
    title: 'TradFi Bridge', 
    desc: 'Seamless FICO score translation to DeFi credit tiers',
    color: '#00d4ff',
  },
];

const TECH_STACK = [
  { name: 'Groth16', active: true },
  { name: 'Poseidon', active: true },
  { name: 'EAS', active: true },
  { name: 'Circom', active: false },
  { name: 'VCSM', active: true },
];


// =============================================================================
// FLOATING PARTICLES COMPONENT
// =============================================================================

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary/30 rounded-full"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
          }}
          animate={{
            y: [null, -20, 20],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}

// =============================================================================
// ANIMATED GRID BACKGROUND
// =============================================================================

function AnimatedGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient orbs */}
      <motion.div 
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div 
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[100px]"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 8, repeat: Infinity, delay: 2 }}
      />
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[120px]"
        animate={{
          rotate: [0, 360],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Grid pattern */}
      <motion.div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #00ff88 1px, transparent 1px),
            linear-gradient(to bottom, #00ff88 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
        animate={{
          backgroundPosition: ['0px 0px', '60px 60px'],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// =============================================================================
// TOP BAR
// =============================================================================

function TopBar() {
  return (
    <motion.div 
      className="absolute top-0 left-0 right-0 h-10 bg-surface/50 border-b border-gray-800/50 backdrop-blur-sm overflow-hidden"
      initial={{ y: -40 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <div className="h-full flex items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <LiveIndicator label="LIVE" />
          <span className="text-xs text-gray-500">Sepolia Testnet</span>
          <span className="text-xs text-gray-600">|</span>
          <span className="text-xs text-gray-500">ETHGlobal HackMoney 2026</span>
        </div>
        <WalletConnect />
      </div>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function Home() {
  const [wallet, setWallet] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredWallet, setHoveredWallet] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wallet) {
      setError('Please enter a wallet address');
      return;
    }
    
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      setError('Invalid Ethereum address format');
      return;
    }

    setError('');
    setIsLoading(true);
    
    // Simulate brief loading for smoother transition
    await new Promise(r => setTimeout(r, 500));
    navigate(`/demo/${wallet}`);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <AnimatedGrid />
      <FloatingParticles />
      
      {/* Top Bar */}
      <TopBar />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 pt-16">
        
        {/* Logo & Title */}
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Animated Logo */}
          <motion.div
            className="relative inline-block mb-6"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-accent/10 to-primary/20 rounded-2xl blur-xl"
              animate={{
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <h1 className="relative text-6xl md:text-8xl font-bold tracking-tight">
              <span className="text-primary drop-shadow-[0_0_30px_rgba(0,255,136,0.5)]">Karma</span>
              <span className="text-white">Trust</span>
            </h1>
          </motion.div>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-300 font-mono mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Credit Infrastructure for DeFi
          </motion.p>
          
          <motion.div
            className="flex items-center justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <span className="text-sm text-gray-500">Powered by</span>
            <div className="flex gap-2">
              {['VCSM', 'ZK-SNARKs', 'EAS'].map((tech, i) => (
                <motion.span
                  key={tech}
                  className="px-2 py-0.5 bg-surface/80 rounded text-xs font-mono text-gray-400 border border-gray-700/50"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                >
                  {tech}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* Main Input Card */}
        <motion.div 
          className="w-full max-w-xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <GlassCard variant="gradient" glow padding="lg">
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white">Analyze Wallet</h2>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  Sepolia Network
                </div>
              </div>

              {/* Input */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    value={wallet}
                    onChange={(e) => {
                      setWallet(e.target.value);
                      setError('');
                    }}
                    placeholder="0x..."
                    className="w-full bg-black/40 border-2 border-gray-700/50 rounded-xl px-5 py-4 text-white font-mono text-lg placeholder-gray-600 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  {wallet && /^0x[a-fA-F0-9]{40}$/.test(wallet) && (
                    <motion.div
                      className="absolute right-4 top-1/2 -translate-y-1/2"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                    >
                      <span className="text-primary text-xl">✓</span>
                    </motion.div>
                  )}
                </div>
                
                <AnimatePresence>
                  {error && (
                    <motion.p 
                      className="text-red-400 text-sm mt-2 flex items-center gap-1"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <span>⚠️</span> {error}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full relative overflow-hidden bg-gradient-to-r from-primary to-emerald-400 text-black py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-70"
                whileHover={{ scale: 1.02, boxShadow: '0 0 30px rgba(0, 255, 136, 0.4)' }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <PulseLoader size="sm" color="#000" />
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>Start Analysis</span>
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </span>
                )}
              </motion.button>
            </form>

            {/* Quick Access Wallets */}
            <div className="mt-8 pt-6 border-t border-gray-700/50">
              <p className="text-gray-500 text-xs mb-4 text-center uppercase tracking-wider">
                Demo Wallets
              </p>
              <div className="grid grid-cols-3 gap-3">
                {EXAMPLE_WALLETS.map((w) => (
                  <motion.button
                    key={w.name}
                    onClick={() => navigate(`/demo/${w.address}`)}
                    onMouseEnter={() => setHoveredWallet(w.name)}
                    onMouseLeave={() => setHoveredWallet(null)}
                    className="relative group flex flex-col items-center gap-2 p-4 bg-surface/50 rounded-xl border border-gray-700/50 hover:border-primary/30 transition-all"
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className="text-2xl">{w.icon}</span>
                    <span className="text-sm text-gray-300 font-medium">{w.name}</span>
                    
                    {/* Hover glow */}
                    <motion.div
                      className="absolute inset-0 rounded-xl bg-primary/5"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hoveredWallet === w.name ? 1 : 0 }}
                    />
                  </motion.button>
                ))}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Features Grid */}
        <motion.div 
          className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl w-full px-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.1 }}
            >
              <GlassCard 
                variant="default" 
                padding="md"
                className="h-full text-center group cursor-default"
              >
                <motion.div
                  className="text-4xl mb-4 inline-block"
                  whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.3 }}
                >
                  {feature.icon}
                </motion.div>
                <h3 
                  className="font-semibold mb-2 transition-colors"
                  style={{ color: feature.color }}
                >
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </motion.div>

        {/* Tech Stack */}
        <motion.div 
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-xs text-gray-600 mb-4 uppercase tracking-widest">Tech Stack</p>
          <div className="flex flex-wrap justify-center gap-2">
            {TECH_STACK.map((tech, i) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1 + i * 0.05 }}
              >
                <TechBadge tech={tech.name} active={tech.active} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 py-4 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <p className="text-gray-600 text-xs">
            ETHGlobal HackMoney 2026 • Built with Circom, SnarkJS & EAS
          </p>
        </motion.div>
      </footer>
    </div>
  );
}
