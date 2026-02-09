/**
 * Submit Proof Hook
 * 
 * Handles the full V2 proof submission flow from the browser:
 * 1. Score wallet via backend API
 * 2. Generate ZK proof via backend API
 * 3. Submit proof to CreditRegistryV2 contract (user signs)
 * 4. Wait for on-chain verification
 */

import { useState, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS, CREDIT_REGISTRY_V2_ABI } from '../config/wagmi';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ProofSubmissionState {
  step: 'idle' | 'scoring' | 'proving' | 'submitting' | 'confirming' | 'success' | 'error';
  score?: number;
  tier?: number;
  tierName?: string;
  proofTime?: number;
  txHash?: string;
  error?: string;
  gasUsed?: string;
}

export function useSubmitProof() {
  const [state, setState] = useState<ProofSubmissionState>({ step: 'idle' });
  
  const { writeContractAsync } = useWriteContract();
  const { data: receipt } = useWaitForTransactionReceipt({
    hash: state.txHash as `0x${string}` | undefined,
  });

  const submitProof = useCallback(async (walletAddress: string) => {
    try {
      // Step 1: Score wallet
      setState({ step: 'scoring' });
      const scoreRes = await fetch(`${API_BASE}/api/credit/score?wallet=${walletAddress}`);
      if (!scoreRes.ok) throw new Error('Failed to score wallet');
      const scoreData = await scoreRes.json();
      const { score, tier, tierName } = scoreData.data;
      
      setState({ step: 'proving', score, tier, tierName });

      // Step 2: Generate ZK proof
      const proofRes = await fetch(`${API_BASE}/api/zkp/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score, tier }),
      });
      if (!proofRes.ok) throw new Error('Failed to generate proof');
      const proofData = await proofRes.json();
      const { proof, publicSignals, generationTime } = proofData.data;

      setState({ step: 'submitting', score, tier, tierName, proofTime: generationTime });

      // Step 3: Format proof for Solidity and submit
      const pA: [bigint, bigint] = [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])];
      const pB: [[bigint, bigint], [bigint, bigint]] = [
        [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
        [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])],
      ];
      const pC: [bigint, bigint] = [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])];
      const signals: [bigint, bigint, bigint, bigint] = [
        BigInt(publicSignals[0]),
        BigInt(publicSignals[1]),
        BigInt(publicSignals[2]),
        BigInt(publicSignals[3]),
      ];

      const txHash = await writeContractAsync({
        address: CONTRACTS.creditRegistryV2 as `0x${string}`,
        abi: CREDIT_REGISTRY_V2_ABI,
        functionName: 'submitProof',
        args: [pA, pB, pC, signals],
      });

      setState({ step: 'confirming', score, tier, tierName, proofTime: generationTime, txHash });

    } catch (err: any) {
      setState(prev => ({
        ...prev,
        step: 'error',
        error: err.message || 'Unknown error',
      }));
    }
  }, [writeContractAsync]);

  // Update state when receipt arrives
  if (receipt && state.step === 'confirming') {
    setState(prev => ({
      ...prev,
      step: 'success',
      gasUsed: receipt.gasUsed.toString(),
    }));
  }

  const reset = useCallback(() => {
    setState({ step: 'idle' });
  }, []);

  return {
    ...state,
    submitProof,
    reset,
    isLoading: ['scoring', 'proving', 'submitting', 'confirming'].includes(state.step),
  };
}
