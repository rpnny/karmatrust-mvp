/**
 * Credit Radar Chart
 * 
 * OKX-style radar chart for displaying credit scoring factors.
 * Shows all 6 factors in a visually appealing radial format.
 */

import { motion } from 'framer-motion';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface CreditRadarChartProps {
  // Accept strongly-typed factor objects (no index signature) and generic maps.
  factors: Partial<{
    wallet_age: number;
    transaction_frequency: number;
    protocol_diversity: number;
    asset_value: number;
    volatility: number;
    stability: number;
  }>;
  className?: string;
}

const FACTOR_LABELS: Record<string, string> = {
  wallet_age: 'Age',
  transaction_frequency: 'Activity',
  protocol_diversity: 'Diversity',
  asset_value: 'Assets',
  volatility: 'Stability',
  stability: 'Consistency',
};

export default function CreditRadarChart({ factors, className = '' }: CreditRadarChartProps) {
  // Transform factors to chart data
  const chartData = Object.entries(factors as Record<string, number>).map(([key, value]) => ({
    factor: FACTOR_LABELS[key] || key,
    value: Math.min(value * 100, 100), // Normalize to 0-100
    fullMark: 100,
  }));

  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      {/* Glow effect behind chart */}
      <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
      
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
          <defs>
            <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00ff88" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#00ff88" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          
          <PolarGrid 
            stroke="#2a2a2a" 
            strokeDasharray="3 3"
          />
          
          <PolarAngleAxis 
            dataKey="factor"
            tick={{ fill: '#888', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            axisLine={{ stroke: '#333' }}
          />
          
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]}
            tick={{ fill: '#555', fontSize: 9 }}
            axisLine={false}
          />
          
          <Radar
            name="Score"
            dataKey="value"
            stroke="#00ff88"
            fill="url(#radarGradient)"
            fillOpacity={0.6}
            strokeWidth={2}
            dot={{
              r: 4,
              fill: '#00ff88',
              strokeWidth: 2,
              stroke: '#0a0a0a',
            }}
            animationDuration={1500}
            animationEasing="ease-out"
          />
          
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              fontSize: '12px',
              fontFamily: 'JetBrains Mono',
            }}
            // Recharts v3 formatter value can be undefined; keep it resilient.
            formatter={(value) => [`${Number(value ?? 0).toFixed(0)}%`, 'Score']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
