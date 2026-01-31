/**
 * Toast Notification System
 * 
 * Provides elegant, non-intrusive notifications for user actions.
 * Automatically dismisses after a timeout, can be manually closed.
 */

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =============================================================================
// TYPES
// =============================================================================

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
}

// =============================================================================
// CONTEXT
// =============================================================================

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

// =============================================================================
// PROVIDER
// =============================================================================

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
}

export function ToastProvider({ children, maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    };

    setToasts((prev) => {
      const updated = [...prev, newToast];
      // Keep only the most recent toasts
      return updated.slice(-maxToasts);
    });

    // Auto-dismiss after duration
    if (newToast.duration) {
      setTimeout(() => {
        hideToast(id);
      }, newToast.duration);
    }
  };

  const hideToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
}

// =============================================================================
// CONTAINER
// =============================================================================

interface ToastContainerProps {
  toasts: Toast[];
  onClose: (id: string) => void;
}

function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// TOAST ITEM
// =============================================================================

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast.duration) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev - (100 / (toast.duration! / 100));
        return next > 0 ? next : 0;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [toast.duration]);

  const config = getToastConfig(toast.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
      className="pointer-events-auto"
    >
      <div
        className={`relative w-80 rounded-xl border-2 overflow-hidden backdrop-blur-sm shadow-xl ${config.containerClass}`}
      >
        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
          <div
            className={`h-full transition-all duration-100 ease-linear ${config.progressClass}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${config.iconBg}`}>
              {config.icon}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h4 className={`font-semibold text-sm ${config.titleClass}`}>{toast.title}</h4>
              {toast.message && <p className="text-xs text-gray-400 mt-1">{toast.message}</p>}
            </div>

            {/* Close Button */}
            <button
              onClick={() => onClose(toast.id)}
              className="flex-shrink-0 text-gray-400 hover:text-white transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// CONFIGURATION
// =============================================================================

function getToastConfig(type: ToastType) {
  const configs = {
    success: {
      containerClass: 'bg-green-900/90 border-green-500',
      iconBg: 'bg-green-500',
      titleClass: 'text-white',
      progressClass: 'bg-green-500',
      icon: (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      containerClass: 'bg-red-900/90 border-red-500',
      iconBg: 'bg-red-500',
      titleClass: 'text-white',
      progressClass: 'bg-red-500',
      icon: (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
    warning: {
      containerClass: 'bg-yellow-900/90 border-yellow-500',
      iconBg: 'bg-yellow-500',
      titleClass: 'text-white',
      progressClass: 'bg-yellow-500',
      icon: (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    info: {
      containerClass: 'bg-blue-900/90 border-blue-500',
      iconBg: 'bg-blue-500',
      titleClass: 'text-white',
      progressClass: 'bg-blue-500',
      icon: (
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  return configs[type];
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export const toast = {
  success: (title: string, message?: string, duration?: number) => ({
    type: 'success' as ToastType,
    title,
    message,
    duration,
  }),
  error: (title: string, message?: string, duration?: number) => ({
    type: 'error' as ToastType,
    title,
    message,
    duration,
  }),
  warning: (title: string, message?: string, duration?: number) => ({
    type: 'warning' as ToastType,
    title,
    message,
    duration,
  }),
  info: (title: string, message?: string, duration?: number) => ({
    type: 'info' as ToastType,
    title,
    message,
    duration,
  }),
};
