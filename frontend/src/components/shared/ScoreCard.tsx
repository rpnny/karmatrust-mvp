/**
 * ScoreCard Component
 * 
 * Displays the credit score in a visually appealing gauge format.
 * 
 * Design: Bloomberg terminal aesthetic with OKX glow effects
 * 
 * Features:
 * - Animated circular gauge
 * - Color-coded risk levels (green/yellow/red)
 * - FICO display score (300-850 for familiarity)
 * - Level badge with glow effect
 * 
 * Why FICO display?
 * - Banks and users understand 300-850 range
 * - Internal score (0-100) is too abstract for demos
 * - Mapping: ficoScore = 300 + (internalScore * 5.5)
 */

import { motion } from 'framer-motion';

// =============================================================================
// TYPES
// =============================================================================

interface ScoreCardProps {
  score: number;           // Internal score (0-100)
  ficoDisplay: number;     // FICO-style (300-850)
  level: number;           // 1-5
  levelName: string;       // "Bronze" | "Silver" | etc.
  risk: 'Low' | 'Medium' | 'High';
  dataSource?: string;
  trustLevel?: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const LEVEL_COLORS: Record<string, string> = {
  Bronze: '#cd7f32',
  Silver: '#c0c0c0',
  Gold: '#ffd700',
  Platinum: '#e5e4e2',
  Diamond: '#b9f2ff',
};

const RISK_COLORS = {
  Low: '#00ff88',
  Medium: '#ffd700',
  High: '#ff4444',
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function ScoreCard({
  score,
  ficoDisplay,
  level,
  levelName,
  risk,
  dataSource,
  trustLevel,
}: ScoreCardProps) {
  // Calculate gauge percentage (based on FICO 300-850 range)
  const percentage = ((ficoDisplay - 300) / 550) * 100;
  const color = RISK_COLORS[risk];
  const levelColor = LEVEL_COLORS[levelName] || '#00ff88';

  // SVG gauge parameters
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-surface/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-gray-400 text-sm font-medium tracking-wider">
          CREDIT SCORE
        </h2>
        {dataSource && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {dataSource}
            </span>
            {trustLevel !== undefined && (
              <span 
                className={`text-xs px-2 py-0.5 rounded-full ${
                  trustLevel >= 80 ? 'bg-green-900/50 text-green-400' :
                  trustLevel >= 50 ? 'bg-yellow-900/50 text-yellow-400' :
                  'bg-gray-800 text-gray-400'
                }`}
              >
                {trustLevel}% trust
              </span>
            )}
          </div>
        )}
      </div>

      {/* Gauge */}
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="96"
              cy="96"
              r={radius}
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <motion.circle
              cx="96"
              cy="96"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{
                filter: `drop-shadow(0 0 8px ${color}40)`,
              }}
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              className="text-5xl font-bold font-mono"
              style={{ color }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              {ficoDisplay}
            </motion.span>
            <span className="text-xs text-gray-500 mt-1">FICO Score</span>
          </div>
        </div>

        {/* Risk Badge */}
        <motion.div 
          className={`mt-4 px-4 py-1.5 rounded-full text-sm font-medium`}
          style={{ 
            backgroundColor: `${color}20`,
            color,
            boxShadow: `0 0 20px ${color}30`,
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          {risk} Risk
        </motion.div>

        {/* Level Badge */}
        <motion.div 
          className="mt-4 flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <div 
            className="w-3 h-3 rounded-full"
            style={{ 
              backgroundColor: levelColor,
              boxShadow: `0 0 10px ${levelColor}`,
            }}
          />
          <span className="text-gray-300 text-sm font-medium">
            Level {level}: {levelName}
          </span>
        </motion.div>

        {/* Internal score (smaller, for reference) */}
        <div className="mt-4 text-xs text-gray-600">
          Internal: {score}/100
        </div>
      </div>
    </div>
  );
}
