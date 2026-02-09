/**
 * Status Badge Components
 * 
 * Professional status indicators for various states.
 * Includes animated pulse effects and color coding.
 */

import { motion } from 'framer-motion';

// =============================================================================
// TIER BADGE
// =============================================================================

interface TierBadgeProps {
  tier: string;
  size?: 'sm' | 'md' | 'lg';
  showGlow?: boolean;
}

const TIER_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  Bronze: { color: '#cd7f32', bg: 'rgba(205, 127, 50, 0.1)', border: 'rgba(205, 127, 50, 0.3)' },
  Silver: { color: '#c0c0c0', bg: 'rgba(192, 192, 192, 0.1)', border: 'rgba(192, 192, 192, 0.3)' },
  Gold: { color: '#ffd700', bg: 'rgba(255, 215, 0, 0.1)', border: 'rgba(255, 215, 0, 0.3)' },
  Platinum: { color: '#e5e4e2', bg: 'rgba(229, 228, 226, 0.1)', border: 'rgba(229, 228, 226, 0.3)' },
  Diamond: { color: '#b9f2ff', bg: 'rgba(185, 242, 255, 0.1)', border: 'rgba(185, 242, 255, 0.3)' },
};

const SIZE_CLASSES = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-2 text-base',
};

export function TierBadge({ tier, size = 'md', showGlow = false }: TierBadgeProps) {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.Bronze;

  return (
    <motion.span
      className={`
        inline-flex items-center font-semibold rounded-full ${SIZE_CLASSES[size]}
        ${showGlow ? 'animate-pulse-glow' : ''}
      `}
      style={{
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        boxShadow: showGlow ? `0 0 20px ${config.color}40` : 'none',
      }}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
    >
      {tier === 'Diamond' && <span className="mr-1">💎</span>}
      {tier === 'Platinum' && <span className="mr-1">🏆</span>}
      {tier === 'Gold' && <span className="mr-1">🥇</span>}
      {tier === 'Silver' && <span className="mr-1">🥈</span>}
      {tier === 'Bronze' && <span className="mr-1">🥉</span>}
      {tier}
    </motion.span>
  );
}

// =============================================================================
// VERIFICATION BADGE
// =============================================================================

interface VerificationBadgeProps {
  status: 'verified' | 'pending' | 'failed' | 'generating';
  label?: string;
}

export function VerificationBadge({ status, label }: VerificationBadgeProps) {
  const configs = {
    verified: {
      icon: '✓',
      color: '#00ff88',
      bg: 'rgba(0, 255, 136, 0.1)',
      border: 'rgba(0, 255, 136, 0.3)',
      text: label || 'Verified',
    },
    pending: {
      icon: '⏳',
      color: '#ffd700',
      bg: 'rgba(255, 215, 0, 0.1)',
      border: 'rgba(255, 215, 0, 0.3)',
      text: label || 'Pending',
    },
    failed: {
      icon: '✗',
      color: '#ff4444',
      bg: 'rgba(255, 68, 68, 0.1)',
      border: 'rgba(255, 68, 68, 0.3)',
      text: label || 'Failed',
    },
    generating: {
      icon: '⚡',
      color: '#8b5cf6',
      bg: 'rgba(139, 92, 246, 0.1)',
      border: 'rgba(139, 92, 246, 0.3)',
      text: label || 'Generating',
    },
  };

  const config = configs[status];

  return (
    <motion.span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
      style={{
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
      }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      {status === 'generating' ? (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          {config.icon}
        </motion.span>
      ) : (
        <span>{config.icon}</span>
      )}
      {config.text}
    </motion.span>
  );
}

// =============================================================================
// LIVE INDICATOR
// =============================================================================

interface LiveIndicatorProps {
  label?: string;
  color?: string;
}

export function LiveIndicator({ label = 'LIVE', color = '#00ff88' }: LiveIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <motion.div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <span className="text-xs font-mono" style={{ color }}>
        {label}
      </span>
    </div>
  );
}

// =============================================================================
// TECH STACK BADGE
// =============================================================================

interface TechBadgeProps {
  tech: string;
  active?: boolean;
}

export function TechBadge({ tech, active = false }: TechBadgeProps) {
  return (
    <motion.span
      className={`
        inline-flex items-center px-3 py-1 rounded-lg text-xs font-mono
        ${active 
          ? 'bg-primary/20 text-primary border border-primary/30' 
          : 'bg-surface text-gray-400 border border-gray-700'
        }
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {tech}
    </motion.span>
  );
}
