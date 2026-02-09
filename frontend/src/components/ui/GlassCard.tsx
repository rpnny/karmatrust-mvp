/**
 * Glass Card Component
 * 
 * OKX-style glassmorphism card with hover effects and animations.
 */

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'accent' | 'purple' | 'gradient';
  hover?: boolean;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const VARIANTS = {
  default: {
    bg: 'rgba(26, 26, 26, 0.6)',
    border: 'rgba(255, 255, 255, 0.05)',
    glow: 'transparent',
  },
  primary: {
    bg: 'rgba(0, 255, 136, 0.05)',
    border: 'rgba(0, 255, 136, 0.15)',
    glow: 'rgba(0, 255, 136, 0.2)',
  },
  accent: {
    bg: 'rgba(255, 215, 0, 0.05)',
    border: 'rgba(255, 215, 0, 0.15)',
    glow: 'rgba(255, 215, 0, 0.2)',
  },
  purple: {
    bg: 'rgba(139, 92, 246, 0.05)',
    border: 'rgba(139, 92, 246, 0.15)',
    glow: 'rgba(139, 92, 246, 0.2)',
  },
  gradient: {
    bg: 'linear-gradient(135deg, rgba(0, 255, 136, 0.05) 0%, rgba(255, 215, 0, 0.05) 100%)',
    border: 'rgba(255, 255, 255, 0.1)',
    glow: 'rgba(0, 255, 136, 0.1)',
  },
};

const PADDING = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
};

export default function GlassCard({
  children,
  variant = 'default',
  hover = true,
  glow = false,
  padding = 'md',
  className = '',
  ...props
}: GlassCardProps) {
  const config = VARIANTS[variant];

  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-2xl backdrop-blur-xl
        ${PADDING[padding]} ${className}
      `}
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        boxShadow: glow ? `0 0 40px ${config.glow}` : 'none',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? {
        scale: 1.01,
        borderColor: 'rgba(255, 255, 255, 0.15)',
        transition: { duration: 0.2 },
      } : undefined}
      transition={{ duration: 0.4 }}
      {...props}
    >
      {/* Subtle shine effect on hover */}
      {hover && (
        <motion.div
          className="absolute inset-0 opacity-0 pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, transparent 100%)',
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}

// =============================================================================
// GRADIENT BORDER CARD
// =============================================================================

interface GradientBorderCardProps {
  children: ReactNode;
  gradient?: string;
  className?: string;
}

export function GradientBorderCard({
  children,
  gradient = 'from-primary via-accent to-primary',
  className = '',
}: GradientBorderCardProps) {
  return (
    <div className={`relative p-[1px] rounded-2xl overflow-hidden ${className}`}>
      {/* Animated gradient border */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-r ${gradient}`}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{ backgroundSize: '200% 200%' }}
      />
      
      {/* Inner content */}
      <div className="relative bg-surface rounded-2xl p-6">
        {children}
      </div>
    </div>
  );
}
