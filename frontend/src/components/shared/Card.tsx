/**
 * Enhanced Card Component
 * 
 * Provides beautiful card variants with hover effects
 * and micro-interactions for premium feel.
 */

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'surface' | 'elevated' | 'bordered';
  hover?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  variant = 'default',
  hover = false,
  clickable = false,
  onClick,
  padding = 'md',
  className = '',
}: CardProps) {
  const baseClasses = 'rounded-2xl transition-all duration-300';
  
  const variantClasses = {
    default: 'bg-surface/50 backdrop-blur-sm',
    surface: 'bg-surface',
    elevated: 'bg-surface/70 backdrop-blur-sm shadow-xl',
    bordered: 'bg-surface/30 backdrop-blur-sm border border-gray-800',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClasses = hover
    ? 'hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10'
    : '';

  const clickableClasses = clickable
    ? 'cursor-pointer active:scale-[0.98]'
    : '';

  const Component = clickable || hover ? motion.div : 'div';

  const motionProps = clickable || hover
    ? {
        whileHover: { y: -4, scale: 1.01 },
        whileTap: clickable ? { scale: 0.98 } : undefined,
      }
    : {};

  return (
    <Component
      onClick={clickable ? onClick : undefined}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${hoverClasses}
        ${clickableClasses}
        ${className}
      `}
      {...motionProps}
    >
      {children}
    </Component>
  );
}

/**
 * Stat Card - For displaying key metrics
 */
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function StatCard({
  label,
  value,
  icon,
  trend,
  trendValue,
  variant = 'default',
}: StatCardProps) {
  const variantColors = {
    default: 'text-primary',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
  };

  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <Card variant="bordered" hover padding="lg">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-400 text-sm font-medium tracking-wider uppercase mb-2">
            {label}
          </p>
          <p className={`text-4xl font-bold ${variantColors[variant]} mb-1`}>
            {value}
          </p>
          {trend && trendValue && (
            <p className={`text-sm font-medium ${trendColors[trend]}`}>
              <span>{trendIcons[trend]}</span> {trendValue}
            </p>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 p-3 bg-surface rounded-xl">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

/**
 * Feature Card - For showcasing features or benefits
 */
interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  highlight?: boolean;
}

export function FeatureCard({
  icon,
  title,
  description,
  highlight = false,
}: FeatureCardProps) {
  return (
    <Card
      variant="bordered"
      hover
      padding="lg"
      className={highlight ? 'border-primary shadow-lg shadow-primary/20' : ''}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${
            highlight ? 'bg-primary/20' : 'bg-surface'
          }`}
        >
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
      </div>
    </Card>
  );
}

/**
 * Info Card - For displaying information with icon and action
 */
interface InfoCardProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
}

export function InfoCard({
  icon,
  title,
  description,
  action,
  variant = 'info',
}: InfoCardProps) {
  const variantColors = {
    info: 'border-blue-500/50 bg-blue-900/20',
    success: 'border-green-500/50 bg-green-900/20',
    warning: 'border-yellow-500/50 bg-yellow-900/20',
    error: 'border-red-500/50 bg-red-900/20',
  };

  const iconColors = {
    info: 'text-blue-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
  };

  return (
    <Card
      variant="bordered"
      padding="md"
      className={variantColors[variant]}
    >
      <div className="flex items-start gap-4">
        <div className={`flex-shrink-0 ${iconColors[variant]}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-white mb-1">{title}</h4>
          {description && (
            <p className="text-sm text-gray-400">{description}</p>
          )}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </Card>
  );
}
