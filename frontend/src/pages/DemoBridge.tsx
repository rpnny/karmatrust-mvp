/**
 * Bridge Demo Page - Triple View
 * 
 * THE showcase page for KarmaTrust's bridge positioning.
 * Shows TradFi, DAISY Bridge, and DeFi side-by-side-by-side.
 * 
 * Layout:
 * ┌──────────────┬──────────────┬──────────────┐
 * │  TradFi View │ Bridge Layer │  DeFi View   │
 * │              │              │              │
 * │ 🏦 Banking   │   🌼 DAISY   │  ⛓️ Protocol │
 * │ FICO: 647    │  Translating │  Tier: Gold  │
 * │ BBB Rating   │      ↔️       │  125% ratio  │
 * │              │              │              │
 * └──────────────┴──────────────┴──────────────┘
 * 
 * Purpose: Show that DAISY speaks BOTH languages simultaneously
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import TradFiDashboard from '../components/TradFiView/TradFiDashboard';
import BridgeLayer from '../components/BridgeView/BridgeLayer';
import DeFiDashboard from '../components/DeFiView/DeFiDashboard';

// =============================================================================
// CONSTANTS
// =============================================================================

const EXAMPLE_WALLETS = [
  { name: 'Vitalik', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
  { name: 'Test High', address: '0x1234567890123456789012345678901234567890' },
  { name: 'Test Low', address: '0xabcdefABCDEF12345678901234567890ABCDEF12' },
];

// =============================================================================
// COMPONENT
// =============================================================================

export default function DemoBridge() {
  const { wallet: urlWallet } = useParams<{ wallet?: string }>();
  const navigate = useNavigate();
  
  const [inputWallet, setInputWallet] = useState(urlWallet || '');
  const [activeWallet, setActiveWallet] = useState(urlWallet || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputWallet && /^0x[a-fA-F0-9]{40}$/.test(inputWallet)) {
      setActiveWallet(inputWallet);
      navigate(`/bridge/${inputWallet}`, { replace: true });
    }
  };

  const handleExampleClick = (address: string) => {
    setInputWallet(address);
    setActiveWallet(address);
    navigate(`/bridge/${address}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <nav className="border-b border-gray-800 bg-surface/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 hover:opacity-80 transition"
            >
              <span className="text-bridge text-xl font-bold">KarmaTrust</span>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                BRIDGE DEMO
              </span>
            </button>

            {/* Wallet Input */}
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={inputWallet}
                onChange={(e) => setInputWallet(e.target.value)}
                placeholder="0x..."
                className="w-64 bg-surface border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white font-mono placeholder-gray-500 focus:border-bridge focus:outline-none"
              />
              <button
                type="submit"
                className="bg-bridge text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-bridge/80 transition"
              >
                Analyze
              </button>
            </form>

            {/* Example Wallets */}
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-xs text-gray-500">Try:</span>
              {EXAMPLE_WALLETS.map((w) => (
                <button
                  key={w.name}
                  onClick={() => handleExampleClick(w.address)}
                  className="text-xs text-bridge hover:text-bridge/80 transition"
                >
                  {w.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-4 py-6">
        {/* Empty State */}
        {!activeWallet && (
          <motion.div 
            className="flex items-center justify-center h-96"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-center">
              <div className="text-6xl mb-4">🌉</div>
              <h2 className="text-2xl font-bold text-bridge mb-2">Bridge Demo</h2>
              <p className="text-gray-400 mb-6 max-w-lg">
                Enter a wallet address to see how DAISY translates credit data
                <br />
                between Traditional Finance and DeFi formats
              </p>
              <div className="flex items-center justify-center gap-8 text-sm">
                <div className="text-center">
                  <div className="text-3xl mb-2">🏦</div>
                  <div className="text-tradfi font-semibold">TradFi</div>
                  <div className="text-gray-500">FICO Scores</div>
                </div>
                <div className="text-4xl text-bridge">⟷</div>
                <div className="text-center">
                  <div className="text-3xl mb-2">🌼</div>
                  <div className="text-bridge font-semibold">DAISY</div>
                  <div className="text-gray-500">Translation</div>
                </div>
                <div className="text-4xl text-bridge">⟷</div>
                <div className="text-center">
                  <div className="text-3xl mb-2">⛓️</div>
                  <div className="text-primary font-semibold">DeFi</div>
                  <div className="text-gray-500">Tiers & ZK</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Triple View Layout */}
        {activeWallet && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* View Labels */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-tradfi/10 border border-tradfi/30 rounded-lg px-4 py-2">
                  <span className="text-2xl">🏦</span>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-tradfi">Traditional Finance</div>
                    <div className="text-xs text-gray-400">Banking Format</div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-bridge/10 border border-bridge/30 rounded-lg px-4 py-2">
                  <span className="text-2xl">🌼</span>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-bridge">DAISY Bridge</div>
                    <div className="text-xs text-gray-400">Translation Layer</div>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-lg px-4 py-2">
                  <span className="text-2xl">⛓️</span>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-primary">DeFi Protocol</div>
                    <div className="text-xs text-gray-400">On-Chain Format</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Three Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-[700px]">
              {/* Left: TradFi View */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <TradFiDashboard wallet={activeWallet} />
              </motion.div>

              {/* Center: Bridge Layer */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
              >
                <BridgeLayer wallet={activeWallet} direction="both" />
              </motion.div>

              {/* Right: DeFi View */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <DeFiDashboard wallet={activeWallet} />
              </motion.div>
            </div>

            {/* Explanation Banner */}
            <motion.div 
              className="mt-6 bg-gradient-to-r from-tradfi/10 via-bridge/10 to-primary/10 rounded-xl p-6 border border-gray-800"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">
                  🌉 Same Data, Two Languages
                </h3>
                <p className="text-gray-400 max-w-3xl mx-auto">
                  Traditional banks see familiar <span className="text-tradfi font-semibold">FICO scores</span> and bond ratings. 
                  DeFi protocols see <span className="text-primary font-semibold">tier systems</span> and collateral ratios. 
                  <span className="text-bridge font-semibold"> DAISY</span> translates between both - connecting two worlds that couldn't talk before.
                </p>
              </div>
            </motion.div>

            {/* Navigation to Other Demos */}
            <motion.div 
              className="mt-4 flex justify-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <button
                onClick={() => navigate(`/demo/${activeWallet}`)}
                className="text-sm text-gray-400 hover:text-white transition"
              >
                Switch to Dual View Demo →
              </button>
            </motion.div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 py-6">
        <div className="max-w-[1600px] mx-auto px-4 text-center text-gray-500 text-sm">
          <p>KarmaTrust Bridge Demo • ETHGlobal Hackathon 2026</p>
          <p className="mt-1 text-xs text-gray-600">
            Connecting TradFi and DeFi through DAISY infrastructure
          </p>
        </div>
      </footer>
    </div>
  );
}
