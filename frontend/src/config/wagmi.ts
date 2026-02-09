/**
 * Wagmi Configuration
 * 
 * Configures wallet connection for KarmaTrust frontend.
 * Supports: MetaMask, WalletConnect, Coinbase Wallet
 * Networks: Base Sepolia (primary), Sepolia (fallback)
 */

import { http, createConfig } from 'wagmi';
import { baseSepolia, sepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// WalletConnect project ID - get yours at https://cloud.walletconnect.com
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

export const config = createConfig({
  chains: [baseSepolia, sepolia],
  connectors: [
    injected(), // MetaMask, Brave, etc.
    ...(WALLETCONNECT_PROJECT_ID
      ? [walletConnect({ projectId: WALLETCONNECT_PROJECT_ID })]
      : []),
  ],
  transports: {
    [baseSepolia.id]: http(import.meta.env.VITE_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'),
    [sepolia.id]: http(import.meta.env.VITE_SEPOLIA_RPC || 'https://ethereum-sepolia.gateway.tatum.io'),
  },
});

// Contract addresses from environment
export const CONTRACTS = {
  creditRegistryV2: import.meta.env.VITE_CREDIT_REGISTRY_V2_ADDRESS || '',
  lending: import.meta.env.VITE_LENDING_CONTRACT_ADDRESS || '',
  verifier: import.meta.env.VITE_VERIFIER_ADDRESS || '',
} as const;

// Contract ABIs (minimal)
export const CREDIT_REGISTRY_V2_ABI = [
  {
    inputs: [
      { name: '_pA', type: 'uint256[2]' },
      { name: '_pB', type: 'uint256[2][2]' },
      { name: '_pC', type: 'uint256[2]' },
      { name: '_pubSignals', type: 'uint256[4]' },
    ],
    name: 'submitProof',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getTier',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'canSubmitProof',
    outputs: [
      { name: 'canSubmit', type: 'bool' },
      { name: 'timeUntilNext', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export const LENDING_ABI = [
  {
    inputs: [{ name: 'amount', type: 'uint256' }],
    name: 'borrow',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'uint8' }],
    name: 'collateralRatio',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
