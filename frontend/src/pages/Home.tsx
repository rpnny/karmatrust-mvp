/**
 * Home Page
 * 
 * Entry point for KarmaTrust demo.
 * Users enter their wallet address to get credit score.
 * 
 * Features:
 * - Wallet address input with validation
 * - Quick access to example addresses (Vitalik, Paradigm)
 * - Navigation to /demo after input
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Example wallets for quick testing
const EXAMPLE_WALLETS = [
  { name: 'Vitalik', address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045' },
  { name: 'Paradigm', address: '0x1db3439a222c519ab44bb1144fc28167b4fa6ee6' },
];

export default function Home() {
  const [wallet, setWallet] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wallet && wallet.startsWith('0x')) {
      navigate(`/demo?wallet=${wallet}`);
    }
  };

  const handleQuickSelect = (address: string) => {
    navigate(`/demo?wallet=${address}`);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* Logo */}
        <h1 className="text-5xl md:text-6xl font-bold mb-2">
          <span className="text-primary">Karma</span>
          <span className="text-white">Trust</span>
        </h1>
        
        {/* Tagline */}
        <p className="text-text-secondary text-lg mb-12">
          On-chain credit scoring with zero-knowledge privacy
        </p>
        
        {/* Input form */}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="Enter wallet address (0x...)"
              className="input flex-1"
            />
            <button
              type="submit"
              disabled={!wallet || !wallet.startsWith('0x')}
              className="btn-primary whitespace-nowrap"
            >
              Check Credit →
            </button>
          </div>
        </form>
        
        {/* Quick access */}
        <div className="flex items-center justify-center gap-4 text-sm">
          <span className="text-text-muted">Quick access:</span>
          {EXAMPLE_WALLETS.map((w) => (
            <button
              key={w.name}
              onClick={() => handleQuickSelect(w.address)}
              className="text-primary hover:text-primary/80 hover:underline transition-colors"
            >
              {w.name}
            </button>
          ))}
        </div>
        
        {/* Features preview */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 text-left">
            <div className="text-2xl mb-2">📊</div>
            <h3 className="font-semibold mb-1">Credit Score</h3>
            <p className="text-sm text-text-secondary">
              FICO-style 0-100 score based on on-chain activity
            </p>
          </div>
          <div className="card p-6 text-left">
            <div className="text-2xl mb-2">🔐</div>
            <h3 className="font-semibold mb-1">ZK Privacy</h3>
            <p className="text-sm text-text-secondary">
              Prove your tier without revealing exact score
            </p>
          </div>
          <div className="card p-6 text-left">
            <div className="text-2xl mb-2">🛡️</div>
            <h3 className="font-semibold mb-1">Anti-Sybil</h3>
            <p className="text-sm text-text-secondary">
              Wallet age constraints enforced in ZK circuit
            </p>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-4 text-text-muted text-xs">
        Built for ETHGlobal | MIT License | MVP v0.1.0
      </div>
    </div>
  );
}
