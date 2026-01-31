/**
 * Wallet Connect Component
 * 
 * Provides wallet connection UI with support for MetaMask and WalletConnect.
 * Displays connected wallet address and allows disconnection.
 */

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { motion } from 'framer-motion';
import { Button } from './Button';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3"
      >
        {/* Connected Address */}
        <div className="bg-surface/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-700 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <span className="text-sm font-mono text-gray-300">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>

        {/* Disconnect Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => disconnect()}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          }
          iconPosition="left"
        >
          Disconnect
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
      {connectors.map((connector) => (
        <Button
          key={connector.id}
          onClick={() => connect({ connector })}
          loading={isPending}
          variant="primary"
          size="md"
          fullWidth
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          }
          iconPosition="left"
        >
          Connect {connector.name}
        </Button>
      ))}
    </div>
  );
}

/**
 * Compact Wallet Button (for header/navbar)
 */
export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <motion.button
        onClick={() => disconnect()}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="bg-surface/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-gray-700 hover:border-primary transition-all flex items-center gap-2"
      >
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-sm font-mono text-white">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </motion.button>
    );
  }

  return (
    <Button
      onClick={() => connectors[0] && connect({ connector: connectors[0] })}
      variant="primary"
      size="sm"
      icon={
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      }
      iconPosition="left"
    >
      Connect Wallet
    </Button>
  );
}
