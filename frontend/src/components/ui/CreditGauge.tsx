/**
 * Credit Gauge Component
 * 
 * OKX/Bloomberg-style circular credit score gauge.
 * Features:
 * - Animated arc fill
 * - Glowing effect
 * - Tier color coding
 * - Smooth number animation
 */

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CreditGaugeProps {
  score: number;        // 0-100 internal score
  ficoScore: number;    // 300-850 FICO display
  tier: string;
  className?: string;
}

const TIER_COLORS: Record<string, string> = {
  Bronze: '#cd7f32',
  Silver: '#c0c0c0',
  Gold: '#ffd700',
  Platinum: '#e5e4e2',
  Diamond: '#b9f2ff',
};

export default function CreditGauge({ 
  score, 
  ficoScore, 
  tier,
  className = '' 
}: CreditGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedFico, setAnimatedFico] = useState(300);
  
  const color = TIER_COLORS[tier] || '#00ff88';
  const percentage = Math.min(score / 100, 1);
  const circumference = 2 * Math.PI * 120; // radius = 120
  const strokeDashoffset = circumference * (1 - percentage * 0.75); // 270 degrees max

  useEffect(() => {
    // Animate numbers
    const duration = 1500;
    const steps = 60;
    const scoreStep = score / steps;
    const ficoStep = (ficoScore - 300) / steps;
    
    let current = 0;
    const interval = setInterval(() => {
      current++;
      setAnimatedScore(Math.min(Math.round(scoreStep * current), score));
      setAnimatedFico(Math.min(Math.round(300 + ficoStep * current), ficoScore));
      
      if (current >= steps) clearInterval(interval);
    }, duration / steps);

    return () => clearInterval(interval);
  }, [score, ficoScore]);

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Glow Effect */}
      <div 
        className="absolute w-64 h-64 rounded-full blur-3xl opacity-30"
        style={{ backgroundColor: color }}
      />
      
      {/* SVG Gauge */}
      <svg width="280" height="280" viewBox="0 0 280 280" className="transform -rotate-[135deg]">
        {/* Background Arc */}
        <circle
          cx="140"
          cy="140"
          r="120"
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75} ${circumference}`}
        />
        
        {/* Animated Fill Arc */}
        <motion.circle
          cx="140"
          cy="140"
          r="120"
          fill="none"
          stroke={color}
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.75} ${circumference}`}
          initial={{ strokeDashoffset: circumference * 0.75 }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{
            filter: `drop-shadow(0 0 10px ${color})`,
          }}
        />
        
        {/* Tick marks */}
        {[0, 25, 50, 75, 100].map((tick) => {
          const angle = (tick / 100) * 270 - 135;
          const rad = (angle * Math.PI) / 180;
          const x1 = 140 + 105 * Math.cos(rad);
          const y1 = 140 + 105 * Math.sin(rad);
          const x2 = 140 + 115 * Math.cos(rad);
          const y2 = 140 + 115 * Math.sin(rad);
          return (
            <line
              key={tick}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#444"
              strokeWidth="2"
              className="transform rotate-[135deg] origin-center"
            />
          );
        })}
      </svg>

      {/* Center Content */}
      <div className="absolute flex flex-col items-center">
        {/* FICO Score */}
        <motion.div
          className="text-6xl font-bold font-mono"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {animatedFico}
        </motion.div>
        
        {/* Tier Badge */}
        <motion.div
          className="mt-2 px-4 py-1 rounded-full text-sm font-semibold"
          style={{ 
            backgroundColor: `${color}20`,
            border: `1px solid ${color}40`,
            color,
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          {tier}
        </motion.div>
        
        {/* Internal Score */}
        <motion.div
          className="mt-3 text-xs text-gray-500 font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Internal: {animatedScore}/100
        </motion.div>
      </div>
    </div>
  );
}
