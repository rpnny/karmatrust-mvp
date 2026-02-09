/**
 * Data Terminal Component
 * 
 * Bloomberg-style data terminal for displaying key metrics.
 * Features:
 * - Real-time data updates
 * - Status indicators
 * - Professional grid layout
 */

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface DataTerminalProps {
  title: string;
  icon?: ReactNode;
  status?: 'live' | 'verified' | 'pending' | 'error';
  children: ReactNode;
  className?: string;
  highlight?: 'primary' | 'accent' | 'purple' | 'blue';
}

const STATUS_CONFIG = {
  live: { color: '#00ff88', label: 'LIVE', pulse: true },
  verified: { color: '#00ff88', label: 'VERIFIED', pulse: false },
  pending: { color: '#ffd700', label: 'PENDING', pulse: true },
  error: { color: '#ff4444', label: 'ERROR', pulse: false },
};

const HIGHLIGHT_COLORS = {
  primary: 'from-primary/5 to-transparent border-primary/20',
  accent: 'from-accent/5 to-transparent border-accent/20',
  purple: 'from-purple-500/5 to-transparent border-purple-500/20',
  blue: 'from-blue-500/5 to-transparent border-blue-500/20',
};

export default function DataTerminal({
  title,
  icon,
  status,
  children,
  className = '',
  highlight = 'primary',
}: DataTerminalProps) {
  const statusConfig = status ? STATUS_CONFIG[status] : null;

  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-xl border 
        bg-gradient-to-br ${HIGHLIGHT_COLORS[highlight]}
        backdrop-blur-sm ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800/50">
        <div className="flex items-center gap-2">
          {icon && <span className="text-lg">{icon}</span>}
          <span className="font-mono text-sm font-semibold text-white uppercase tracking-wide">
            {title}
          </span>
        </div>
        
        {statusConfig && (
          <div className="flex items-center gap-2">
            <div 
              className={`w-2 h-2 rounded-full ${statusConfig.pulse ? 'animate-pulse' : ''}`}
              style={{ backgroundColor: statusConfig.color }}
            />
            <span 
              className="text-xs font-mono"
              style={{ color: statusConfig.color }}
            >
              {statusConfig.label}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {children}
      </div>

      {/* Decorative corner accent */}
      <div 
        className="absolute top-0 right-0 w-20 h-20 opacity-10"
        style={{
          background: `radial-gradient(circle at top right, ${highlight === 'primary' ? '#00ff88' : highlight === 'accent' ? '#ffd700' : '#8b5cf6'}, transparent)`,
        }}
      />
    </motion.div>
  );
}

// Sub-component for data rows
interface DataRowProps {
  label: string;
  value: string | ReactNode;
  highlight?: boolean;
  mono?: boolean;
}

export function DataRow({ label, value, highlight = false, mono = false }: DataRowProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800/30 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span 
        className={`text-sm ${highlight ? 'text-primary' : 'text-white'} ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}

// Sub-component for metric display
interface MetricProps {
  label: string;
  value: string | number;
  change?: number;
  prefix?: string;
  suffix?: string;
}

export function Metric({ label, value, change, prefix = '', suffix = '' }: MetricProps) {
  return (
    <div className="text-center">
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-2xl font-bold text-white font-mono">
        {prefix}{value}{suffix}
      </div>
      {change !== undefined && (
        <div className={`text-xs mt-1 ${change >= 0 ? 'text-primary' : 'text-red-400'}`}>
          {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
        </div>
      )}
    </div>
  );
}
