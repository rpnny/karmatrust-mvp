/**
 * Skeleton Loading Component
 * 
 * Provides beautiful loading placeholders while content is being fetched.
 * Creates a professional loading experience that maintains layout and reduces
 * perceived load time.
 */

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%]';
  
  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: '',
    rounded: 'rounded-xl',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'circular' ? height : '100%'),
    height: height || (variant === 'text' ? '1rem' : '100%'),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
}

/**
 * Skeleton Card - Pre-composed skeleton for card layouts
 */
export function SkeletonCard() {
  return (
    <div className="bg-surface/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 space-y-4">
      <Skeleton variant="text" width="60%" height="1.5rem" />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="80%" />
      <div className="pt-4">
        <Skeleton variant="rounded" height="2.5rem" />
      </div>
    </div>
  );
}

/**
 * Skeleton Score Card - For credit score display
 */
export function SkeletonScoreCard() {
  return (
    <div className="bg-surface/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 flex flex-col items-center space-y-4">
      <Skeleton variant="text" width="120px" height="1rem" className="mb-2" />
      <Skeleton variant="circular" width="192px" height="192px" />
      <Skeleton variant="text" width="100px" height="1rem" />
    </div>
  );
}

/**
 * Skeleton Chart - For data visualizations
 */
export function SkeletonChart() {
  return (
    <div className="bg-surface/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 space-y-4">
      <Skeleton variant="text" width="150px" height="1.25rem" />
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton variant="text" width="100px" />
            <Skeleton variant="rectangular" height="8px" className="flex-1 rounded-full" />
            <Skeleton variant="text" width="40px" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton Table Row
 */
export function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-gray-800">
      <Skeleton variant="circular" width="40px" height="40px" />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="40%" height="0.75rem" />
      </div>
      <Skeleton variant="rounded" width="80px" height="32px" />
    </div>
  );
}

/**
 * Skeleton Stats Grid - For dashboard stats
 */
export function SkeletonStatsGrid() {
  return (
    <div className="grid grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-surface/50 backdrop-blur-sm rounded-xl p-6 border border-gray-800 space-y-3">
          <Skeleton variant="text" width="80px" height="0.875rem" />
          <Skeleton variant="text" width="120px" height="2.5rem" />
          <Skeleton variant="text" width="60px" height="0.75rem" />
        </div>
      ))}
    </div>
  );
}
