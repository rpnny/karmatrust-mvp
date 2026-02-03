/**
 * FactorChart Component
 * 
 * Displays the breakdown of scoring factors as horizontal progress bars.
 * 
 * Design: Inspired by Bloomberg terminal data visualization
 * 
 * Why this design?
 * - Each factor clearly labeled with value
 * - Progress bars show relative strength
 * - Color coding: green (good) → yellow (medium) → red (bad)
 * - Tooltips explain what each factor means
 * 
 * Factors displayed:
 * - Wallet Age: Time since first transaction
 * - Transaction Frequency: How often the wallet transacts
 * - Protocol Diversity: Number of DeFi protocols used
 * - Asset Value: ETH holdings
 * - Volatility: Behavioral consistency (lower is better)
 * - Stability: Recent activity pattern
 */

import { motion } from 'framer-motion';

// =============================================================================
// TYPES
// =============================================================================

interface ScoreFactors {
  wallet_age: number;
  transaction_frequency: number;
  protocol_diversity: number;
  asset_value: number;
  volatility: number;
  stability: number;
}

interface FactorChartProps {
  factors: ScoreFactors;
  showLabels?: boolean;
}

// =============================================================================
// FACTOR CONFIGURATION
// =============================================================================

interface FactorConfig {
  key: keyof ScoreFactors;
  label: string;
  description: string;
  icon: string;
  isInverse?: boolean; // true = lower is better (e.g., volatility)
}

const FACTOR_CONFIGS: FactorConfig[] = [
  {
    key: 'wallet_age',
    label: 'Wallet Age',
    description: 'Account history length (1+ year = max)',
    icon: '📅',
  },
  {
    key: 'transaction_frequency',
    label: 'Activity',
    description: 'Transaction frequency (200+ tx = max)',
    icon: '⚡',
  },
  {
    key: 'protocol_diversity',
    label: 'Diversity',
    description: 'DeFi protocols used (15+ = max)',
    icon: '🔀',
  },
  {
    key: 'asset_value',
    label: 'Assets',
    description: 'ETH holdings (50+ ETH = max)',
    icon: '💎',
  },
  {
    key: 'stability',
    label: 'Stability',
    description: 'Recent activity pattern',
    icon: '📊',
  },
  {
    key: 'volatility',
    label: 'Volatility',
    description: 'Behavioral consistency (lower is better)',
    icon: '📉',
    isInverse: true,
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get color based on value and whether lower is better
 */
function getFactorColor(value: number, isInverse: boolean = false): string {
  const effectiveValue = isInverse ? 1 - value : value;
  
  if (effectiveValue >= 0.7) return '#00ff88'; // Green
  if (effectiveValue >= 0.4) return '#ffd700'; // Yellow
  return '#ff6b6b'; // Red
}

/**
 * Format value for display
 */
function formatValue(value: number): string {
  return `${Math.round(value * 100)}%`;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function FactorChart({ factors, showLabels = true }: FactorChartProps) {
  return (
    <div className="bg-surface/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-gray-400 text-sm font-medium tracking-wider">
          SCORE FACTORS
        </h2>
        <span className="text-xs text-gray-600">
          Hover for details
        </span>
      </div>

      {/* Factor Bars */}
      <div className="space-y-4">
        {FACTOR_CONFIGS.map((config, index) => {
          const value = factors[config.key];
          const color = getFactorColor(value, config.isInverse);

          return (
            <motion.div
              key={config.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group"
              title={config.description}
            >
              {/* Label Row */}
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{config.icon}</span>
                  <span className="text-sm text-gray-300 font-medium">
                    {config.label}
                  </span>
                </div>
                <span 
                  className="text-sm font-mono font-medium"
                  style={{ color }}
                >
                  {formatValue(value)}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ 
                    backgroundColor: color,
                    boxShadow: `0 0 10px ${color}40`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${value * 100}%` }}
                  transition={{ 
                    delay: index * 0.1 + 0.3, 
                    duration: 0.8,
                    ease: 'easeOut',
                  }}
                />
              </div>

              {/* Tooltip (on hover) */}
              {showLabels && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1">
                  <p className="text-xs text-gray-500">
                    {config.description}
                  </p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-800">
        <div className="flex justify-center gap-6 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#00ff88]" />
            <span className="text-gray-500">Strong (70%+)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#ffd700]" />
            <span className="text-gray-500">Medium (40-70%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#ff6b6b]" />
            <span className="text-gray-500">Weak (&lt;40%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
