/**
 * LendingCard Component
 * 
 * Displays user's borrowing capacity and allows them to interact with the
 * TieredLending contract based on their credit tier.
 * 
 * Features:
 * - Shows current tier and collateral ratio
 * - Calculates required collateral for desired borrow amount
 * - Displays collateral savings vs Bronze tier
 * - Shows current loan position if active
 */

import { useState, useEffect } from 'react';

interface LendingCardProps {
  wallet: string;
  creditLevel: number;
}

interface TierConfig {
  tier: number;
  tierName: string;
  collateralRatio: number;
  maxBorrowAmount: string;
  interestRate: number;
  enabled: boolean;
}

interface LoanPosition {
  borrowed: string;
  collateral: string;
  tierAtBorrow: number;
  tierName: string;
  active: boolean;
}

interface CollateralCalc {
  borrowAmount: string;
  requiredCollateral: string;
  tier: number;
  tierName: string;
  collateralRatio: number;
}

interface Savings {
  tier: number;
  tierName: string;
  borrowAmount: string;
  baseCollateral: string;
  tierCollateral: string;
  savings: string;
  savingsPercent: number;
  message: string;
}

export default function LendingCard({ wallet, creditLevel }: LendingCardProps) {
  const [tierConfig, setTierConfig] = useState<TierConfig | null>(null);
  const [loanPosition, setLoanPosition] = useState<LoanPosition | null>(null);
  const [borrowAmount, setBorrowAmount] = useState('1.0');
  const [collateralCalc, setCollateralCalc] = useState<CollateralCalc | null>(null);
  const [savings, setSavings] = useState<Savings | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  // Fetch tier config and loan position
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get tier config
        const tierRes = await fetch(`/api/contracts/lending/tiers`);
        const tierData = await tierRes.json();
        if (tierData.success && tierData.data) {
          const userTier = tierData.data.find((t: TierConfig) => t.tier === (creditLevel || 1));
          setTierConfig(userTier || tierData.data[0]);
        }

        // Get loan position
        const posRes = await fetch(`/api/contracts/lending/position/${wallet}`);
        const posData = await posRes.json();
        if (posData.success) {
          setLoanPosition(posData.data);
        }
      } catch (error) {
        console.error('Error fetching lending data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (wallet) {
      fetchData();
    }
  }, [wallet, creditLevel]);

  // Calculate required collateral when borrow amount changes
  useEffect(() => {
    const calculateCollateral = async () => {
      if (!borrowAmount || isNaN(parseFloat(borrowAmount))) return;
      
      setCalculating(true);
      try {
        // Get collateral requirement
        const collRes = await fetch(
          `/api/contracts/lending/collateral?wallet=${wallet}&amount=${borrowAmount}`
        );
        const collData = await collRes.json();
        if (collData.success) {
          setCollateralCalc(collData.data);
        }

        // Get savings calculation
        const tier = creditLevel || 1;
        const savRes = await fetch(
          `/api/contracts/lending/savings?tier=${tier}&amount=${borrowAmount}`
        );
        const savData = await savRes.json();
        if (savData.success) {
          setSavings(savData.data);
        }
      } catch (error) {
        console.error('Error calculating collateral:', error);
      } finally {
        setCalculating(false);
      }
    };

    const debounce = setTimeout(calculateCollateral, 500);
    return () => clearTimeout(debounce);
  }, [borrowAmount, wallet, creditLevel]);

  if (loading) {
    return (
      <div className="bg-surface rounded-xl p-6 border border-gray-800">
        <h2 className="text-gray-400 text-sm mb-4">LENDING</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-primary">Loading...</div>
        </div>
      </div>
    );
  }

  if (!tierConfig) {
    return (
      <div className="bg-surface rounded-xl p-6 border border-gray-800">
        <h2 className="text-gray-400 text-sm mb-4">LENDING</h2>
        <p className="text-red-400 text-sm">Error loading tier config</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-6 border border-gray-800">
      <h2 className="text-gray-400 text-sm mb-4">TIERED LENDING</h2>
      
      {/* Current Tier Info */}
      <div className="mb-6 p-4 bg-background rounded-lg border border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm">Your Tier</span>
          <span className="text-primary font-bold">{tierConfig.tierName}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm">Collateral Ratio</span>
          <span className="text-white font-mono">{tierConfig.collateralRatio}%</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm">Max Borrow</span>
          <span className="text-white font-mono">{tierConfig.maxBorrowAmount}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-sm">Interest Rate</span>
          <span className="text-white font-mono">{tierConfig.interestRate}% APR</span>
        </div>
      </div>

      {/* Active Loan Position */}
      {loanPosition?.active && (
        <div className="mb-6 p-4 bg-yellow-900/20 rounded-lg border border-yellow-700/50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            <span className="text-yellow-400 font-semibold text-sm">ACTIVE LOAN</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-400 mb-1">Borrowed</div>
              <div className="text-white font-mono">{parseFloat(loanPosition.borrowed).toFixed(4)} ETH</div>
            </div>
            <div>
              <div className="text-gray-400 mb-1">Collateral</div>
              <div className="text-white font-mono">{parseFloat(loanPosition.collateral).toFixed(4)} ETH</div>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-400">
            Borrowed at {loanPosition.tierName} tier
          </div>
        </div>
      )}

      {/* Borrow Calculator */}
      {!loanPosition?.active && (
        <>
          <div className="mb-4">
            <label className="block text-gray-400 text-sm mb-2">Borrow Amount (ETH)</label>
            <input
              type="number"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
              step="0.1"
              min="0.01"
              max={parseFloat(tierConfig.maxBorrowAmount)}
              className="w-full bg-background border border-gray-700 rounded-lg px-4 py-2 text-white font-mono focus:border-primary focus:outline-none"
              placeholder="1.0"
            />
          </div>

          {/* Collateral Calculation */}
          {calculating && (
            <div className="text-center py-4 text-gray-400 text-sm animate-pulse">
              Calculating...
            </div>
          )}

          {!calculating && collateralCalc && (
            <div className="space-y-4">
              {/* Required Collateral */}
              <div className="p-4 bg-background rounded-lg border border-gray-700">
                <div className="text-gray-400 text-sm mb-2">Required Collateral</div>
                <div className="text-2xl font-bold text-primary font-mono">
                  {parseFloat(collateralCalc.requiredCollateral).toFixed(4)} ETH
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {collateralCalc.collateralRatio}% of borrow amount
                </div>
              </div>

              {/* Savings Display */}
              {savings && savings.savingsPercent > 0 && (
                <div className="p-4 bg-green-900/20 rounded-lg border border-green-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-green-400 font-semibold text-sm">SAVINGS</span>
                  </div>
                  <div className="text-white text-sm mb-2">
                    Save <span className="font-bold text-green-400">{parseFloat(savings.savings).toFixed(4)} ETH</span> collateral
                  </div>
                  <div className="text-xs text-gray-400">
                    {savings.savingsPercent}% less than Bronze tier
                  </div>
                </div>
              )}

              {/* Borrow Button */}
              <button
                className="w-full bg-primary text-black font-semibold py-3 rounded-lg hover:bg-primary/80 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled
              >
                Borrow (Coming Soon)
              </button>

              <p className="text-xs text-gray-500 text-center">
                MVP: Contract interaction UI will be added in Day 2
              </p>
            </div>
          )}
        </>
      )}

      {/* Contract Links */}
      <div className="mt-6 pt-4 border-t border-gray-800">
        <a
          href={`https://sepolia.etherscan.io/address/0x37bA854436157064F6d502DBA620778336116725`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-primary transition flex items-center justify-center gap-1"
        >
          View Contract on Etherscan
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
