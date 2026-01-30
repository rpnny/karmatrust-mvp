/**
 * Demo Page - Split Screen View
 * 
 * Core demonstration page showing two perspectives:
 * - Left: User View (full access to score, factors, proof generation)
 * - Right: Bank View (can only verify proofs, sees limited data)
 * 
 * This layout is KEY for hackathon demo:
 * It visually demonstrates zero-knowledge privacy in action.
 * 
 * Data Flow:
 * 1. User enters wallet → fetch score → display on left
 * 2. User generates ZK proof → transfers to right side
 * 3. Bank verifies proof → sees "Gold ✓" but score shows "???"
 */

import { useSearchParams, Link } from 'react-router-dom';

export default function Demo() {
  const [searchParams] = useSearchParams();
  const wallet = searchParams.get('wallet');

  // Shortened wallet display
  const shortWallet = wallet 
    ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
    : 'No wallet';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-surface-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-xl font-bold">
              <span className="text-primary">Karma</span>
              <span className="text-white">Trust</span>
            </span>
            <span className="text-text-muted text-sm opacity-0 group-hover:opacity-100 transition-opacity">
              ← Back
            </span>
          </Link>
          
          <div className="flex items-center gap-4">
            {/* Network indicator */}
            <div className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-text-secondary">Sepolia</span>
            </div>
            
            {/* Wallet display */}
            <div className="font-mono text-sm text-text-secondary">
              {shortWallet}
            </div>
          </div>
        </div>
      </header>

      {/* Main content - Split View */}
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* Left Side: User View */}
        <div className="flex-1 border-r border-surface-border p-6 lg:p-8">
          <div className="max-w-xl mx-auto">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">👤</span>
              <div>
                <h2 className="text-xl font-semibold">User View</h2>
                <p className="text-sm text-text-secondary">
                  Full access to your credit data
                </p>
              </div>
            </div>
            
            {/* Content placeholder - will be replaced with components */}
            <div className="space-y-6">
              {/* Score Card Placeholder */}
              <div className="card p-6">
                <div className="label mb-4">Credit Score</div>
                <div className="text-center py-8">
                  <div className="score-display mb-2">--</div>
                  <div className="text-text-secondary">Loading...</div>
                </div>
              </div>
              
              {/* Factors Placeholder */}
              <div className="card p-6">
                <div className="label mb-4">Score Factors</div>
                <div className="text-text-muted text-center py-8">
                  Factor breakdown will appear here
                </div>
              </div>
              
              {/* EAS Attestation Placeholder */}
              <div className="card p-6">
                <div className="label mb-4">📜 EAS Attestation</div>
                <div className="text-text-muted text-center py-4">
                  Create on-chain credential
                </div>
                <button className="btn-secondary w-full" disabled>
                  Create Attestation
                </button>
              </div>
              
              {/* ZK Proof Generator Placeholder */}
              <div className="card p-6">
                <div className="label mb-4">🔐 ZK Proof</div>
                <div className="text-text-muted text-center py-4">
                  Generate privacy-preserving proof
                </div>
                <button className="btn-primary w-full" disabled>
                  Generate ZK Proof
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Bank View */}
        <div className="flex-1 p-6 lg:p-8 bg-background-secondary/50">
          <div className="max-w-xl mx-auto">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🏦</span>
              <div>
                <h2 className="text-xl font-semibold text-accent">Bank View</h2>
                <p className="text-sm text-text-secondary">
                  Verify without seeing sensitive data
                </p>
              </div>
            </div>
            
            {/* Content placeholder */}
            <div className="space-y-6">
              {/* Proof Input Placeholder */}
              <div className="card p-6 border-accent/20">
                <div className="label text-accent mb-4">Proof Verification</div>
                <div className="text-text-muted text-center py-8">
                  Waiting for proof from user...
                </div>
              </div>
              
              {/* Verification Result Placeholder */}
              <div className="card p-6 border-accent/20">
                <div className="label text-accent mb-4">Verification Result</div>
                <div className="space-y-4 py-4">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Level</span>
                    <span className="text-text-muted">Pending</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Score</span>
                    <span className="privacy-mask">███████</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Sybil Check</span>
                    <span className="text-text-muted">Pending</span>
                  </div>
                </div>
              </div>
              
              {/* Privacy Notice */}
              <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                <p className="text-xs text-accent/80">
                  🔒 Privacy Protected: Bank can only verify tier membership.
                  Exact score, wallet balance, and transaction history remain hidden.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-border px-6 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-xs text-text-muted">
          <span>KarmaTrust MVP v0.1.0</span>
          <span>ETHGlobal Hackathon</span>
        </div>
      </footer>
    </div>
  );
}
