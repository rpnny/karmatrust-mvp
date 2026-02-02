/**
 * Demo Page - Split Screen View
 * 
 * The main demonstration page for the hackathon.
 * Shows User View and Bank View side-by-side.
 * 
 * Purpose:
 * This is THE key demo page for judges. It demonstrates:
 * 1. User sees full data (transparency)
 * 2. Bank sees only verified claims (privacy via ZK)
 * 3. Same data, different access levels
 * 
 * Layout:
 * ┌────────────────┬────────────────┐
 * │   USER VIEW    │   BANK VIEW    │
 * │  (Full Data)   │ (ZK Protected) │
 * │                │                │
 * │  Score: 762    │  Score: 🔒     │
 * │  Factors: ...  │  Tier: Gold ✓  │
 * │                │                │
 * └────────────────┴────────────────┘
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCredit } from '../hooks/useCredit';
import EnhancedUserDashboard from '../components/UserView/EnhancedUserDashboard';
import EnhancedBankDashboard from '../components/BankView/EnhancedBankDashboard';

// =============================================================================
// CONSTANTS
// =============================================================================

const EXAMPLE_WALLETS = [
  { name: 'Vitalik', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
  { name: 'Test 1', address: '0x1234567890123456789012345678901234567890' },
  { name: 'Test 2', address: '0xabcdefABCDEF12345678901234567890ABCDEF12' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export default function Demo() {
  const { wallet: urlWallet } = useParams<{ wallet?: string }>();
  const navigate = useNavigate();
  
  // State for wallet input
  const [inputWallet, setInputWallet] = useState(urlWallet || '');
  const [activeWallet, setActiveWallet] = useState(urlWallet || '');

  // Fetch credit score
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
      {/* Top Navigation Bar */}
      <nav className="border-b border-gray-800 bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:opacity-80 transition"
            >
              <span className="text-primary text-xl font-bold">KarmaTrust</span>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                DEMO
              </span>
            </button>

            {/* Wallet Input */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={inputWallet}
                onChange={(e) => setInputWallet(e.target.value)}
                placeholder="0x..."
                className="w-64 bg-surface border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono placeholder-gray-500 focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                className="bg-primary text-black px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/80 transition"
              >
                Analyze
              </button>
              <button
                type="button"
                onClick={refetch}
                className="text-gray-400 hover:text-white p-2 transition"
                title="Refresh"
              >
                ↻
              </button>
            </form>

            {/* Example Wallets */}
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs text-gray-500">Try:</span>
              {EXAMPLE_WALLETS.map((w) => (
                <button
                  key={w.name}
                  onClick={() => handleExampleClick(w.address)}
                  className="text-xs text-primary hover:text-primary/80 transition"
                >
                  {w.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Loading State */}
        {loading && (
          <motion.div 
            className="flex items-center justify-center h-96"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-gray-400">Analyzing wallet...</p>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div 
            className="flex items-center justify-center h-96"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 max-w-md text-center">
              <p className="text-red-400 mb-2">Error</p>
              <p className="text-gray-400 text-sm">{error}</p>
              <button
                onClick={refetch}
                className="mt-4 text-primary hover:underline text-sm"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {!activeWallet && !loading && (
          <motion.div 
            className="flex items-center justify-center h-96"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center">
              <p className="text-4xl mb-4">👆</p>
              <p className="text-gray-400 mb-2">Enter a wallet address to analyze</p>
              <p className="text-gray-600 text-sm">
                Or click one of the example wallets above
              </p>
            </div>
          </motion.div>
        )}

        {/* Split Screen View */}
        {score && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* View Toggle (Mobile) */}
            <div className="lg:hidden mb-4 flex justify-center">
              <ViewToggle />
            </div>

            {/* Split Screen */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: User View */}
              <div className="bg-surface/30 rounded-2xl p-6 border border-primary/20 min-h-[600px]">
                <EnhancedUserDashboard 
                  score={score} 
                  wallet={activeWallet}
                />
              </div>

              {/* Divider (Desktop) */}
              <div className="hidden lg:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="bg-surface border border-gray-700 rounded-full p-3">
                  <span className="text-2xl">⚡</span>
                </div>
              </div>

              {/* Right: Bank/Protocol View */}
              <div className="bg-surface/30 rounded-2xl p-6 border border-accent/20 min-h-[600px]">
                <EnhancedBankDashboard 
                  score={score} 
                  wallet={activeWallet}
                />
              </div>
            </div>


            {/* Feature Explanation Banner */}
            <motion.div 
              className="mt-6 bg-gradient-to-r from-primary/10 via-surface to-accent/10 rounded-xl p-6 border border-gray-800"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">
                  🏆 Complete Tech Stack Demo
                </h3>
                <p className="text-gray-400 max-w-3xl mx-auto">
                  <span className="text-bridge font-semibold">Bridge:</span> TradFi ↔️ DeFi format translation • 
                  <span className="text-primary font-semibold"> VCSM:</span> State machine evolution • 
                  <span className="text-purple-400 font-semibold"> ZK:</span> Privacy-preserving proofs • 
                  <span className="text-accent font-semibold"> EAS:</span> On-chain attestations
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>KarmaTrust MVP • ETHGlobal Hackathon 2026</p>
          <p className="mt-1 text-xs text-gray-600">
            Powered by Poseidon Hash, Groth16 ZK-SNARKs, and EAS Attestations
          </p>
        </div>
      </footer>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function ViewToggle() {
  const [view, setView] = useState<'user' | 'bank'>('user');

  return (
    <div className="inline-flex bg-surface rounded-lg p-1 border border-gray-800">
      <button
        onClick={() => setView('user')}
        className={`px-4 py-1.5 rounded-md text-sm transition ${
          view === 'user'
            ? 'bg-primary text-black'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        User View
      </button>
      <button
        onClick={() => setView('bank')}
        className={`px-4 py-1.5 rounded-md text-sm transition ${
          view === 'bank'
            ? 'bg-accent text-black'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        Bank View
      </button>
    </div>
  );
}
