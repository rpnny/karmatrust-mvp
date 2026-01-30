/**
 * Credit Score Hook
 * 
 * React hook for fetching and managing credit score data.
 * 
 * Features:
 * - Auto-fetch on wallet change
 * - Loading and error states
 * - Refetch capability
 * - TypeScript types
 * 
 * Usage:
 * const { score, loading, error, refetch } = useCredit(walletAddress);
 */

import { useState, useEffect, useCallback } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface ScoreFactors {
  wallet_age: number;
  transaction_frequency: number;
  protocol_diversity: number;
  asset_value: number;
  volatility: number;
  stability: number;
}

export interface CreditScoreData {
  score: number;
  level: number;
  levelName: string;
  risk: 'Low' | 'Medium' | 'High';
  factors: ScoreFactors;
  wallet: string;
  timestamp: number;
  ficoDisplay: number;
  dataSource: string;
  trustLevel: number;
  meta?: {
    dataSource: string;
    version: string;
  };
}

export interface UseCreditResult {
  score: CreditScoreData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// =============================================================================
// API CONFIGURATION
// =============================================================================

const API_BASE = import.meta.env.VITE_API_URL || '/api';

// =============================================================================
// HOOK
// =============================================================================

export function useCredit(wallet: string | null): UseCreditResult {
  const [score, setScore] = useState<CreditScoreData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScore = useCallback(async () => {
    if (!wallet) {
      setScore(null);
      setError(null);
      return;
    }

    // Validate wallet format
    if (!/^0x[a-fA-F0-9]{40}$/.test(wallet)) {
      setError('Invalid wallet address format');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/credit/score?wallet=${wallet}`);
      const data = await response.json();

      if (data.success) {
        setScore(data.data);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch credit score');
        setScore(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setScore(null);
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  // Auto-fetch when wallet changes
  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  return {
    score,
    loading,
    error,
    refetch: fetchScore,
  };
}

// =============================================================================
// ADDITIONAL HOOKS
// =============================================================================

/**
 * Hook for fetching score explanation
 */
export function useCreditExplain(wallet: string | null) {
  const [explanation, setExplanation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExplanation = useCallback(async () => {
    if (!wallet) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/credit/explain/${wallet}`);
      const data = await response.json();
      
      if (data.success) {
        setExplanation(data.data);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  useEffect(() => {
    fetchExplanation();
  }, [fetchExplanation]);

  return { explanation, loading, error, refetch: fetchExplanation };
}

export default useCredit;
