/**
 * Demo Page - Bloomberg Terminal Style Split View
 * 
 * The main demonstration page for the hackathon.
 * Shows User View and Bank View side-by-side with professional styling.
 * 
 * Design: Bloomberg terminal + OKX professional trading interface
 * - Real-time data terminal aesthetic
 * - Glassmorphism panels
 * - Smooth animations and transitions
 * - Professional data visualization
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCredit } from '../hooks/useCredit';
import EnhancedUserDashboard from '../components/UserView/EnhancedUserDashboard';
import EnhancedBankDashboard from '../components/BankView/EnhancedBankDashboard';
import GlassCard from '../components/ui/GlassCard';
import { LiveIndicator } from '../components/ui/StatusBadge';
import { Spinner } from '../components/ui/LoadingStates';
import { WalletConnect } from '../components/shared/WalletConnect';

// =============================================================================
// CONSTANTS
// =============================================================================

const EXAMPLE_WALLETS = [
  { name: 'Vitalik', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
  { name: 'Alice', address: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e' },
  { name: 'Bob', address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B' },
];

const TECH_INDICATORS = [
  { name: 'VCSM', status: 'active' },
  { name: 'ZK-SNARK', status: 'active' },
  { name: 'EAS', status: 'active' },
  { name: 'Bridge', status: 'active' },
];

// =============================================================================
// ANIMATED BACKGROUND
// =============================================================================

function TerminalBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Gradient orbs */}
      <motion.div 
        className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[150px]"
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div 
        className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-accent/3 rounded-full blur-[150px]"
        animate={{
          opacity: [0.3, 0.5, 0.3],
          scale: [1.1, 1, 1.1],
        }}
        transition={{ duration: 10, repeat: Infinity, delay: 3 }}
      />
      
      {/* Grid */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #00ff88 1px, transparent 1px),
            linear-gradient(to bottom, #00ff88 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
      
      {/* Scan line effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent"
        animate={{ y: ['-100%', '100%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// =============================================================================
// TOP NAVIGATION BAR
// =============================================================================

interface NavBarProps {
  inputWallet: string;
  setInputWallet: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onRefresh: () => void;
  onExampleClick: (address: string) => void;
  isLoading: boolean;
}

function NavBar({ 
  inputWallet, 
  setInputWallet, 
  onSubmit, 
  onRefresh, 
  onExampleClick,
  isLoading 
}: NavBarProps) {
  const navigate = useNavigate();

  return (
    <motion.nav 
      className="border-b border-gray-800/50 bg-surface/80 backdrop-blur-xl sticky top-0 z-50"
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-[1800px] mx-auto px-4">
        <div className="h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <motion.button 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 hover:opacity-80 transition group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-primary text-xl font-bold tracking-tight">
              KarmaTrust
            </span>
            <span className="text-[10px] text-gray-400 bg-gray-800/80 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
              Terminal
            </span>
          </motion.button>

          {/* Tech Status Indicators */}
          <div className="hidden lg:flex items-center gap-3">
            {TECH_INDICATORS.map((tech, i) => (
              <motion.div
                key={tech.name}
                className="flex items-center gap-1.5"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-mono text-gray-400">{tech.name}</span>
              </motion.div>
            ))}
          </div>

          {/* Wallet Input */}
          <form onSubmit={onSubmit} className="flex items-center gap-2">
            <div className="relative">
              <input
                type="text"
                value={inputWallet}
                onChange={(e) => setInputWallet(e.target.value)}
                placeholder="Enter wallet address..."
                className="w-80 bg-black/40 border border-gray-700/50 rounded-lg px-4 py-2 text-sm text-white font-mono placeholder-gray-600 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all"
              />
              {inputWallet && /^0x[a-fA-F0-9]{40}$/.test(inputWallet) && (
                <motion.span 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-primary"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  ✓
                </motion.span>
              )}
            </div>
            
            <motion.button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-emerald-400 text-black px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-all"
              whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(0,255,136,0.3)' }}
              whileTap={{ scale: 0.97 }}
            >
              {isLoading ? <Spinner size={16} color="#000" /> : 'Analyze'}
            </motion.button>
            
            <motion.button
              type="button"
              onClick={onRefresh}
              className="text-gray-400 hover:text-primary p-2 rounded-lg hover:bg-gray-800/50 transition-all"
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </motion.button>
          </form>

          {/* Example Wallets */}
          <div className="hidden xl:flex items-center gap-1">
            <span className="text-xs text-gray-600 mr-2">Demo:</span>
            {EXAMPLE_WALLETS.map((w, i) => (
              <motion.button
                key={w.name}
                onClick={() => onExampleClick(w.address)}
                className="px-3 py-1.5 text-xs rounded-lg text-gray-400 hover:text-primary hover:bg-primary/5 border border-transparent hover:border-primary/20 transition-all font-medium"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                whileHover={{ scale: 1.05 }}
              >
                {w.name}
              </motion.button>
            ))}
          </div>

          {/* Wallet Connection */}
          <WalletConnect />

          {/* Live Indicator */}
          <LiveIndicator label="LIVE" />
        </div>
      </div>
    </motion.nav>
  );
}

// =============================================================================
// VIEW TOGGLE (MOBILE)
// =============================================================================

interface ViewToggleProps {
  view: 'user' | 'bank';
  setView: (v: 'user' | 'bank') => void;
}

function ViewToggle({ view, setView }: ViewToggleProps) {
  return (
    <div className="inline-flex bg-surface/80 rounded-xl p-1 border border-gray-800/50 backdrop-blur-sm">
      <motion.button
        onClick={() => setView('user')}
        className={`relative px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
          view === 'user' ? 'text-black' : 'text-gray-400 hover:text-white'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        {view === 'user' && (
          <motion.div
            className="absolute inset-0 bg-primary rounded-lg"
            layoutId="viewToggle"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          <span>👤</span> User View
        </span>
      </motion.button>
      <motion.button
        onClick={() => setView('bank')}
        className={`relative px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
          view === 'bank' ? 'text-black' : 'text-gray-400 hover:text-white'
        }`}
        whileTap={{ scale: 0.95 }}
      >
        {view === 'bank' && (
          <motion.div
            className="absolute inset-0 bg-accent rounded-lg"
            layoutId="viewToggle"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
        <span className="relative z-10 flex items-center gap-2">
          <span>🏦</span> Bank View
        </span>
      </motion.button>
    </div>
  );
}

// =============================================================================
// EMPTY STATE
// =============================================================================

function EmptyState({ onExampleClick }: { onExampleClick: (addr: string) => void }) {
  return (
    <motion.div 
      className="flex items-center justify-center min-h-[70vh]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <GlassCard variant="default" padding="lg" className="max-w-lg text-center">
        <motion.div
          className="text-6xl mb-6"
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🔍
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-3">Enter a Wallet Address</h2>
        <p className="text-gray-400 mb-6">
          Analyze any Ethereum wallet to generate a credit score, create ZK proofs, and demonstrate the full KarmaTrust pipeline.
        </p>
        
        <div className="space-y-3">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Or try a demo wallet</p>
          <div className="flex flex-wrap justify-center gap-2">
            {EXAMPLE_WALLETS.map((w) => (
              <motion.button
                key={w.name}
                onClick={() => onExampleClick(w.address)}
                className="flex items-center gap-2 px-4 py-2 bg-surface/80 rounded-lg border border-gray-700/50 hover:border-primary/30 transition-all"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="text-gray-300">{w.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// =============================================================================
// ERROR STATE
// =============================================================================

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <motion.div 
      className="flex items-center justify-center min-h-[70vh]"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <GlassCard variant="default" padding="lg" className="max-w-md text-center border-red-800/30">
        <motion.div
          className="text-5xl mb-4"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 0.5 }}
        >
          ⚠️
        </motion.div>
        <h2 className="text-xl font-bold text-red-400 mb-2">Analysis Failed</h2>
        <p className="text-gray-400 text-sm mb-6">{error}</p>
        <motion.button
          onClick={onRetry}
          className="px-6 py-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 font-medium hover:bg-red-500/30 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Try Again
        </motion.button>
      </GlassCard>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function Demo() {
  const { wallet: urlWallet } = useParams<{ wallet?: string }>();
  const navigate = useNavigate();
  
  const [inputWallet, setInputWallet] = useState(urlWallet || '');
  const [activeWallet, setActiveWallet] = useState(urlWallet || '');
  const [mobileView, setMobileView] = useState<'user' | 'bank'>('user');

  const { score, loading, error, refetch } = useCredit(activeWallet);

  // Handle wallet submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputWallet && /^0x[a-fA-F0-9]{40}$/.test(inputWallet)) {
      setActiveWallet(inputWallet);
      navigate(`/demo/${inputWallet}`, { replace: true });
    }
  };

  // Handle example wallet click
  const handleExampleClick = (address: string) => {
    setInputWallet(address);
    setActiveWallet(address);
    navigate(`/demo/${address}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Animated Background */}
      <TerminalBackground />

      {/* Navigation */}
      <NavBar
        inputWallet={inputWallet}
        setInputWallet={setInputWallet}
        onSubmit={handleSubmit}
        onRefresh={refetch}
        onExampleClick={handleExampleClick}
        isLoading={loading}
      />

      {/* Main Content */}
      <main className="relative z-10 max-w-[1800px] mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* Loading State */}
          {loading && (
            <motion.div 
              key="loading"
              className="flex items-center justify-center min-h-[70vh]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-center">
                <Spinner size={60} />
                <motion.p 
                  className="mt-6 text-gray-400 font-mono"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Analyzing wallet activity...
                </motion.p>
                <p className="mt-2 text-xs text-gray-600">
                  Computing 8-factor credit score
                </p>
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {error && !loading && (
            <ErrorState key="error" error={error} onRetry={refetch} />
          )}

          {/* Empty State */}
          {!activeWallet && !loading && !error && (
            <EmptyState key="empty" onExampleClick={handleExampleClick} />
          )}

          {/* Split Screen View */}
          {score && !loading && !error && (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {/* Wallet Info Header */}
              <motion.div 
                className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-gray-700/50">
                    <span className="text-2xl">👛</span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">Analyzing Wallet</p>
                    <p className="font-mono text-white">
                      {activeWallet.slice(0, 8)}...{activeWallet.slice(-6)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-surface/50 rounded-lg border border-gray-700/50">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    <span className="text-xs text-gray-400">Sepolia Testnet</span>
                  </div>
                  <div className="px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
                    <span className="text-xs text-primary font-medium">{score.levelName}</span>
                  </div>
                </div>
              </motion.div>

              {/* Mobile View Toggle */}
              <div className="lg:hidden mb-6 flex justify-center">
                <ViewToggle view={mobileView} setView={setMobileView} />
              </div>

              {/* Split Screen */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: User View */}
                <motion.div
                  className={`lg:block ${mobileView === 'user' ? 'block' : 'hidden'}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <GlassCard 
                    variant="primary" 
                    padding="lg" 
                    className="min-h-[700px]"
                    hover={false}
                  >
                    <EnhancedUserDashboard score={score} wallet={activeWallet} />
                  </GlassCard>
                </motion.div>

                {/* Center Divider (Desktop) */}
                <div className="hidden lg:flex absolute left-1/2 top-[400px] -translate-x-1/2 z-20">
                  <motion.div 
                    className="bg-surface/90 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-4 shadow-xl"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    whileHover={{ scale: 1.1, rotate: 10 }}
                  >
                    <motion.span 
                      className="text-3xl block"
                      animate={{ 
                        scale: [1, 1.2, 1],
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ⚡
                    </motion.span>
                  </motion.div>
                </div>

                {/* Right: Bank View */}
                <motion.div
                  className={`lg:block ${mobileView === 'bank' ? 'block' : 'hidden'}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <GlassCard 
                    variant="accent" 
                    padding="lg" 
                    className="min-h-[700px]"
                    hover={false}
                  >
                    <EnhancedBankDashboard score={score} wallet={activeWallet} />
                  </GlassCard>
                </motion.div>
              </div>

              {/* Tech Stack Banner */}
              <motion.div 
                className="mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <GlassCard variant="gradient" padding="md">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-center md:text-left">
                      <h3 className="text-lg font-bold text-white mb-1">
                        Complete Infrastructure Demo
                      </h3>
                      <p className="text-sm text-gray-400">
                        Privacy-preserving credit verification powered by zero-knowledge proofs
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-2">
                      {[
                        { name: 'Bridge', color: '#00d4ff', desc: 'TradFi ↔ DeFi' },
                        { name: 'VCSM', color: '#00ff88', desc: 'State Machine' },
                        { name: 'ZK-SNARK', color: '#8b5cf6', desc: 'Privacy' },
                        { name: 'EAS', color: '#ffd700', desc: 'Attestations' },
                      ].map((tech) => (
                        <motion.div
                          key={tech.name}
                          className="px-3 py-2 rounded-lg border text-center"
                          style={{ 
                            borderColor: `${tech.color}30`,
                            backgroundColor: `${tech.color}10`,
                          }}
                          whileHover={{ scale: 1.05, y: -2 }}
                        >
                          <div className="text-xs font-bold" style={{ color: tech.color }}>
                            {tech.name}
                          </div>
                          <div className="text-[10px] text-gray-500">{tech.desc}</div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-800/30 mt-12 py-6">
        <div className="max-w-[1800px] mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-primary font-bold">KarmaTrust</span>
              <span className="text-xs text-gray-600">ETHGlobal HackMoney 2026</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>Poseidon</span>
              <span>•</span>
              <span>Groth16</span>
              <span>•</span>
              <span>EAS</span>
              <span>•</span>
              <span>Sepolia</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
