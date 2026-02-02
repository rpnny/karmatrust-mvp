/**
 * Bridge Layer Component
 * 
 * The centerpiece of the Bridge Demo - shows DAISY translation in action.
 * 
 * Visual Concept:
 * - DAISY logo/branding
 * - Animated data flow arrows
 * - Real-time translation display
 * - Conversion formulas shown
 * 
 * Design:
 * - Hot pink (#ff69b4) theme
 * - Glowing effects
 * - Bidirectional arrows
 * - Math formulas visible
 */

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface BridgeData {
  internalScore: number;
  ficoEquivalent: number;
  tierEquivalent: string;
  collateralSavings: string;
}

interface BridgeLayerProps {
  wallet: string;
  direction?: 'both' | 'toDefi' | 'toTradfi';
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function BridgeLayer({ wallet, direction = 'both' }: BridgeLayerProps) {
  const [bridgeData, setBridgeData] = useState<BridgeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBridgeData();
  }, [wallet]);

  const fetchBridgeData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bridge/both/${wallet}`);
      const data = await response.json();
      
      if (data.success) {
        setBridgeData(data.data.bridge);
      }
    } catch (err) {
      console.error('Bridge fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!bridgeData) {
    return <ErrorState />;
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-bridge/20 via-surface to-bridge/10 rounded-2xl border-2 border-bridge/30 p-8 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full" 
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,105,180,0.3) 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* DAISY Logo */}
      <motion.div
        className="relative z-10 mb-8"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <div className="text-6xl mb-4">🌼</div>
          <div className="text-3xl font-bold text-bridge mb-2">DAISY</div>
          <div className="text-sm text-gray-400 max-w-xs">
            Decentralized Attestation Infrastructure
            <br />
            Secured by Zero-Knowledge
          </div>
        </div>
      </motion.div>

      {/* Translation Status */}
      <motion.div
        className="relative z-10 bg-surface/80 backdrop-blur-sm rounded-xl p-6 mb-6 border border-bridge/40 w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-3 h-3 bg-bridge rounded-full animate-pulse"></div>
          <span className="text-bridge font-semibold">Translation Layer Active</span>
        </div>

        {/* Translation Data */}
        <div className="space-y-3 text-sm">
          <TranslationRow 
            label="Internal Score" 
            value={bridgeData.internalScore.toString()}
            icon="📊"
          />
          <div className="border-t border-bridge/20 my-2"></div>
          
          <TranslationRow 
            label="FICO Equivalent" 
            value={bridgeData.ficoEquivalent.toString()}
            icon="🏦"
            color="text-tradfi"
          />
          <TranslationRow 
            label="Tier Equivalent" 
            value={bridgeData.tierEquivalent}
            icon="⛓️"
            color="text-primary"
          />
          <div className="border-t border-bridge/20 my-2"></div>
          
          <TranslationRow 
            label="Collateral Savings" 
            value={bridgeData.collateralSavings}
            icon="💰"
            highlight
          />
        </div>
      </motion.div>

      {/* Translation Formula */}
      <motion.div
        className="relative z-10 bg-black/40 backdrop-blur-sm rounded-lg px-6 py-4 border border-bridge/20 max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="text-center space-y-2">
          <div className="text-xs text-gray-500 mb-2">Translation Formula</div>
          <div className="font-mono text-sm text-bridge">
            FICO = 300 + (Internal × 5.5)
          </div>
          <div className="text-xs text-gray-400">
            {bridgeData.internalScore} → {bridgeData.ficoEquivalent} (FICO)
          </div>
          <div className="text-xs text-gray-400">
            {bridgeData.internalScore} → {bridgeData.tierEquivalent} (Tier)
          </div>
        </div>
      </motion.div>

      {/* Bidirectional Arrows */}
      {direction === 'both' && (
        <>
          <motion.div
            className="absolute left-8 top-1/2 transform -translate-y-1/2"
            animate={{ x: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div className="text-4xl opacity-50">←</div>
          </motion.div>
          <motion.div
            className="absolute right-8 top-1/2 transform -translate-y-1/2"
            animate={{ x: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div className="text-4xl opacity-50">→</div>
          </motion.div>
        </>
      )}

      {/* Glowing Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-bridge/20 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function TranslationRow({ 
  label, 
  value, 
  icon, 
  color = 'text-white',
  highlight = false 
}: { 
  label: string; 
  value: string; 
  icon: string;
  color?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${highlight ? 'bg-bridge/10 -mx-2 px-2 py-1 rounded' : ''}`}>
      <div className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-gray-400">{label}</span>
      </div>
      <span className={`font-semibold ${color} ${highlight ? 'text-lg' : ''}`}>{value}</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="h-full flex items-center justify-center bg-surface rounded-2xl border border-bridge/20">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-spin">🌼</div>
        <p className="text-bridge">Initializing bridge...</p>
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="h-full flex items-center justify-center bg-surface rounded-2xl border border-bridge/20">
      <div className="text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-gray-400">Bridge unavailable</p>
      </div>
    </div>
  );
}
