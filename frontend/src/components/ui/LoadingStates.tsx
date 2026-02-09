/**
 * Loading State Components
 * 
 * Professional loading animations for various states.
 * OKX/Bloomberg-style spinners and progress indicators.
 */

import { motion } from 'framer-motion';

// =============================================================================
// PULSE LOADER
// =============================================================================

interface PulseLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function PulseLoader({ size = 'md', color = '#00ff88' }: PulseLoaderProps) {
  const sizes = { sm: 8, md: 12, lg: 16 };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="rounded-full"
          style={{ width: s, height: s, backgroundColor: color }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
    </div>
  );
}

// =============================================================================
// SPINNING LOADER
// =============================================================================

interface SpinnerProps {
  size?: number;
  color?: string;
  thickness?: number;
}

export function Spinner({ size = 40, color = '#00ff88', thickness = 3 }: SpinnerProps) {
  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    >
      <svg viewBox="0 0 50 50" className="w-full h-full">
        {/* Track */}
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="#1a1a1a"
          strokeWidth={thickness}
        />
        {/* Active arc */}
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray="60 40"
          style={{
            filter: `drop-shadow(0 0 5px ${color})`,
          }}
        />
      </svg>
    </motion.div>
  );
}

// =============================================================================
// PROGRESS BAR
// =============================================================================

interface ProgressBarProps {
  progress: number;
  label?: string;
  showPercentage?: boolean;
  color?: string;
  animated?: boolean;
}

export function ProgressBar({
  progress,
  label,
  showPercentage = true,
  color = '#00ff88',
  animated = true,
}: ProgressBarProps) {
  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between mb-2 text-sm">
          {label && <span className="text-gray-400">{label}</span>}
          {showPercentage && (
            <span className="font-mono" style={{ color }}>
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}`,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: animated ? 0.8 : 0, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// =============================================================================
// SKELETON LOADER
// =============================================================================

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

export function Skeleton({ 
  width = '100%', 
  height = 20, 
  rounded = 'md',
  className = '',
}: SkeletonProps) {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <motion.div
      className={`bg-gray-800 ${roundedClasses[rounded]} ${className}`}
      style={{ width, height }}
      animate={{
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// =============================================================================
// FULL PAGE LOADER
// =============================================================================

interface PageLoaderProps {
  message?: string;
  subMessage?: string;
}

export function PageLoader({ 
  message = 'Loading...', 
  subMessage 
}: PageLoaderProps) {
  return (
    <motion.div
      className="fixed inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Logo animation */}
      <motion.div
        className="mb-8"
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <Spinner size={60} />
      </motion.div>

      {/* Text */}
      <motion.h2
        className="text-xl font-mono text-white mb-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {message}
      </motion.h2>

      {subMessage && (
        <motion.p
          className="text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {subMessage}
        </motion.p>
      )}

      {/* Decorative dots */}
      <motion.div 
        className="mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <PulseLoader />
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// ZK PROOF GENERATION LOADER
// =============================================================================

interface ZKLoaderProps {
  stage?: 'computing' | 'proving' | 'verifying' | 'complete';
  progress?: number;
}

export function ZKLoader({ stage = 'computing', progress = 0 }: ZKLoaderProps) {
  const stages = {
    computing: { label: 'Computing witness...', color: '#8b5cf6' },
    proving: { label: 'Generating ZK proof...', color: '#00ff88' },
    verifying: { label: 'Verifying proof...', color: '#ffd700' },
    complete: { label: 'Proof complete!', color: '#00ff88' },
  };

  const config = stages[stage];

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Stage indicator */}
      <div className="flex items-center justify-center gap-3 mb-4">
        {stage !== 'complete' ? (
          <Spinner size={24} color={config.color} />
        ) : (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-2xl"
          >
            ✅
          </motion.div>
        )}
        <span className="font-mono text-sm" style={{ color: config.color }}>
          {config.label}
        </span>
      </div>

      {/* Progress bar */}
      <ProgressBar progress={progress} color={config.color} showPercentage={false} />

      {/* Stage steps */}
      <div className="flex justify-between mt-4 text-xs">
        {Object.keys(stages).map((s, i) => {
          const isActive = Object.keys(stages).indexOf(stage) >= i;
          return (
            <div
              key={s}
              className={`flex flex-col items-center ${isActive ? 'text-white' : 'text-gray-600'}`}
            >
              <motion.div
                className={`w-3 h-3 rounded-full mb-1 ${isActive ? 'bg-primary' : 'bg-gray-700'}`}
                animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.5 }}
              />
              <span className="capitalize">{s}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
