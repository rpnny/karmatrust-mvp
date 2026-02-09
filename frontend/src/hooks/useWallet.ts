/**
 * Wallet Connection Hook
 * 
 * Provides wallet connection state and actions using wagmi.
 * Handles: connect, disconnect, chain switching, tier reading.
 */

import { useAccount, useConnect, useDisconnect, useReadContract, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { CONTRACTS, CREDIT_REGISTRY_V2_ABI } from '../config/wagmi';

const TIER_NAMES = ['Unrated', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'] as const;

export function useWallet() {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  // Read user's credit tier from contract
  const { data: tier, refetch: refetchTier } = useReadContract({
    address: CONTRACTS.creditRegistryV2 as `0x${string}`,
    abi: CREDIT_REGISTRY_V2_ABI,
    functionName: 'getTier',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACTS.creditRegistryV2,
    },
  });

  // Check if user can submit proof
  const { data: canSubmitData } = useReadContract({
    address: CONTRACTS.creditRegistryV2 as `0x${string}`,
    abi: CREDIT_REGISTRY_V2_ABI,
    functionName: 'canSubmitProof',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!CONTRACTS.creditRegistryV2,
    },
  });

  const isWrongChain = chain && chain.id !== baseSepolia.id;

  const connectWallet = () => {
    const injected = connectors.find(c => c.id === 'injected');
    if (injected) {
      connect({ connector: injected });
    } else if (connectors[0]) {
      connect({ connector: connectors[0] });
    }
  };

  const switchToBase = () => {
    if (switchChain) {
      switchChain({ chainId: baseSepolia.id });
    }
  };

  return {
    // State
    address,
    isConnected,
    isConnecting,
    chain,
    isWrongChain,
    
    // Credit data
    tier: tier !== undefined ? Number(tier) : undefined,
    tierName: tier !== undefined ? TIER_NAMES[Number(tier)] || 'Unknown' : undefined,
    canSubmitProof: canSubmitData ? (canSubmitData as [boolean, bigint])[0] : undefined,
    timeUntilNextProof: canSubmitData ? Number((canSubmitData as [boolean, bigint])[1]) : undefined,
    
    // Actions
    connectWallet,
    disconnect,
    switchToBase,
    refetchTier,
    
    // Utils
    connectors,
    shortAddress: address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '',
  };
}
