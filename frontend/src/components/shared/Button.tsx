/**
 * Enhanced Button Component
 * 
 * Provides beautiful button variants with micro-interactions
 * and loading states for better UX.
 */

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  iconPosition = 'right',
  className = '',
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 relative overflow-hidden';
  
  const variantClasses = {
    primary: 'bg-primary text-black hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/40',
    secondary: 'bg-accent text-black hover:bg-accent/90 shadow-lg shadow-accent/20 hover:shadow-accent/40',
    outline: 'bg-transparent text-primary border-2 border-primary hover:bg-primary/10',
    ghost: 'bg-transparent text-gray-300 hover:bg-surface hover:text-primary',
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const widthClass = fullWidth ? 'w-full' : '';
  
  const isDisabled = disabled || loading;

  return (
    <motion.button
      onClick={isDisabled ? undefined : onClick}
      disabled={isDisabled}
      whileHover={isDisabled ? undefined : { scale: 1.02 }}
      whileTap={isDisabled ? undefined : { scale: 0.98 }}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${widthClass}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {/* Loading Spinner */}
      {loading && (
        <motion.div
          className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}

      {/* Icon Left */}
      {icon && iconPosition === 'left' && !loading && (
        <span className="flex-shrink-0">{icon}</span>
      )}

      {/* Children */}
      <span>{children}</span>

      {/* Icon Right */}
      {icon && iconPosition === 'right' && !loading && (
        <span className="flex-shrink-0">{icon}</span>
      )}

      {/* Ripple Effect */}
      {!isDisabled && (
        <motion.span
          className="absolute inset-0 bg-white/20"
          initial={{ scale: 0, opacity: 1 }}
          whileTap={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}
    </motion.button>
  );
}

/**
 * Icon Button - Circular button for icons only
 */
interface IconButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function IconButton({
  children,
  onClick,
  variant = 'ghost',
  size = 'md',
  disabled = false,
  className = '',
}: IconButtonProps) {
  const variantClasses = {
    primary: 'bg-primary text-black hover:bg-primary/90',
    secondary: 'bg-surface text-primary hover:bg-surface/80',
    ghost: 'bg-transparent text-gray-400 hover:text-primary hover:bg-surface/50',
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <motion.button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.1 }}
      whileTap={disabled ? undefined : { scale: 0.9 }}
      className={`
        inline-flex items-center justify-center rounded-full transition-all duration-200
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
}
