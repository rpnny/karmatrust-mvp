/**
 * Wagmi Configuration
 * 
 * Sets up Web3 wallet connection with support for:
 * - MetaMask
 * - WalletConnect
 * - Coinbase Wallet
 * - Injected wallets
 */

import { createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// WalletConnect Project ID (for production, use your own)
const WALLETCONNECT_PROJECT_ID = 'demo-project-id';

export const config = createConfig({
  chains: [sepolia, mainnet],
  connectors: [
    injected({
      target: 'metaMask',
    }),
    walletConnect({
      projectId: WALLETCONNECT_PROJECT_ID,
      showQrModal: true,
    }),
  ],
  transports: {
    [sepolia.id]: http('https://ethereum-sepolia-rpc.publicnode.com'),
    [mainnet.id]: http('https://eth.llamarpc.com'),
  },
});
