import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CreditScoreCard from '../components/shared/CreditScoreCard';
import ProofCard from '../components/shared/ProofCard';

// Demo script with subtitles
const demoScript = [
  {
    step: 0,
    duration: 3000,
    subtitle: "Meet Alice. She wants to borrow 10 ETH from a DeFi protocol.",
    leftAction: 'idle',
    rightAction: 'idle',
    leftHighlight: null,
    rightHighlight: null,
  },
  {
    step: 1,
    duration: 4000,
    subtitle: "Traditional DeFi requires 150% collateral (15 ETH) because they know nothing about her.",
    leftAction: 'show-problem',
    rightAction: 'show-problem',
    leftHighlight: null,
    rightHighlight: null,
  },
  {
    step: 2,
    duration: 3000,
    subtitle: "Alice uses KarmaTrust to calculate her credit score...",
    leftAction: 'calculate-score',
    rightAction: 'waiting',
    leftHighlight: 'score',
    rightHighlight: null,
  },
  {
    step: 3,
    duration: 5000,
    subtitle: "Alice's score: 742 (Gold Tier). Excellent credit! ← Only Alice knows this. Bank still sees NOTHING.",
    leftAction: 'show-score',
    rightAction: 'waiting',
    leftHighlight: 'score-details',
    rightHighlight: 'no-data',
  },
  {
    step: 4,
    duration: 4000,
    subtitle: "Now Alice generates a Zero-Knowledge Proof...",
    leftAction: 'generate-proof',
    rightAction: 'waiting',
    leftHighlight: 'proof-generation',
    rightHighlight: null,
  },
  {
    step: 5,
    duration: 6000,
    subtitle: "Real ZK proof generated in ~1-2 seconds. The proof will prove Gold tier WITHOUT revealing her exact score (742).",
    leftAction: 'show-proof',
    rightAction: 'waiting',
    leftHighlight: 'proof-result',
    rightHighlight: null,
  },
  {
    step: 6,
    duration: 4000,
    subtitle: "Alice submits the proof to the bank... Bank is verifying (8ms). Bank STILL doesn't know her tier yet.",
    leftAction: 'submit-proof',
    rightAction: 'receiving-proof',
    leftHighlight: null,
    rightHighlight: null,
  },
  {
    step: 7,
    duration: 5000,
    subtitle: "✅ Verification complete! NOW bank learns: 'Gold Tier'. Bank still DON'T know: Her exact score (742).",
    leftAction: 'proof-submitted',
    rightAction: 'verified',
    leftHighlight: 'alice-sees-all',
    rightHighlight: 'bank-sees-tier',
  },
  {
    step: 8,
    duration: 6000,
    subtitle: "Result: Alice only needs 125% collateral (12.5 ETH). She saves 2.5 ETH ($8,750)!",
    leftAction: 'show-savings',
    rightAction: 'show-savings',
    leftHighlight: 'savings',
    rightHighlight: 'savings',
  },
  {
    step: 9,
    duration: 4000,
    subtitle: "This is Zero-Knowledge Credit: Prove creditworthiness, hide sensitive data. Privacy + Better rates.",
    leftAction: 'final',
    rightAction: 'final',
    leftHighlight: null,
    rightHighlight: null,
  },
];

interface DualDemoProps {}

export default function DualDemo({}: DualDemoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [wallet] = useState('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'); // Alice's wallet

  // Credit score state
  const [creditScore, setCreditScore] = useState<any>(null);
  const [loadingScore, setLoadingScore] = useState(false);

  // ZK Proof state
  const [zkProof, setZkProof] = useState<any>(null);
  const [generatingProof, setGeneratingProof] = useState(false);
  const [proofSubmitted, setProofSubmitted] = useState(false);

  // Auto-play demo
  useEffect(() => {
    if (!isPlaying) return;

    const currentScriptStep = demoScript[currentStep];
    if (!currentScriptStep) {
      setIsPlaying(false);
      return;
    }

    // Execute actions for this step
    executeStepActions(currentScriptStep);

    // Move to next step after duration
    const timer = setTimeout(() => {
      if (currentStep < demoScript.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        setIsPlaying(false); // End of demo
      }
    }, currentScriptStep.duration);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStep]);

  const executeStepActions = (scriptStep: typeof demoScript[0]) => {
    switch (scriptStep.step) {
      case 2:
        // Calculate credit score
        fetchCreditScore();
        break;
      case 4:
        // Generate ZK proof
        generateZKProof();
        break;
      case 6:
        // Submit proof
        setProofSubmitted(true);
        break;
      default:
        break;
    }
  };

  const fetchCreditScore = async () => {
    setLoadingScore(true);
    try {
      const response = await fetch(`/api/credit/score?wallet=${wallet}`);
      const data = await response.json();
      if (data.success) {
        setCreditScore(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch credit score:', error);
    } finally {
      setLoadingScore(false);
    }
  };

  const generateZKProof = async () => {
    setGeneratingProof(true);
    try {
      const response = await fetch('/api/zkp/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet }),
      });
      const data = await response.json();
      if (data.success) {
        setZkProof(data.data);
      }
    } catch (error) {
      console.error('Failed to generate proof:', error);
    } finally {
      setGeneratingProof(false);
    }
  };

  const startDemo = () => {
    setIsPlaying(true);
    setCurrentStep(0);
    setCreditScore(null);
    setZkProof(null);
    setProofSubmitted(false);
  };

  const pauseDemo = () => {
    setIsPlaying(false);
  };

  const resetDemo = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setCreditScore(null);
    setZkProof(null);
    setProofSubmitted(false);
  };

  const currentSubtitle = demoScript[currentStep]?.subtitle || '';
  const leftHighlight = demoScript[currentStep]?.leftHighlight;
  const rightHighlight = demoScript[currentStep]?.rightHighlight;

  return (
    <div className="min-h-screen bg-background text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary">KarmaTrust Dual Demo</h1>
              <p className="text-sm text-gray-400">Privacy-Preserving Credit System</p>
            </div>
            <div className="flex gap-3">
              {!isPlaying ? (
                <button
                  onClick={startDemo}
                  className="bg-primary text-black px-6 py-2 rounded-lg font-semibold hover:bg-primary/80 transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                  Start Demo
                </button>
              ) : (
                <button
                  onClick={pauseDemo}
                  className="bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-600 transition flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zM12.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75a.75.75 0 00-.75-.75h-1.5z" />
                  </svg>
                  Pause
                </button>
              )}
              <button
                onClick={resetDemo}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600 transition"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1 bg-gray-800">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: '0%' }}
          animate={{ width: `${((currentStep + 1) / demoScript.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Subtitle Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-900 border-b border-gray-800 py-4"
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-primary font-bold">{currentStep + 1}</span>
              </div>
              <p className="text-lg text-white">{currentSubtitle}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dual Screen Layout */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT SCREEN - USER VIEW (Alice) */}
          <motion.div
            className={`border-2 rounded-xl p-6 transition-all ${
              leftHighlight ? 'border-primary shadow-lg shadow-primary/50' : 'border-gray-800'
            }`}
            animate={{
              scale: leftHighlight ? 1.02 : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-primary">USER VIEW</h2>
                <p className="text-sm text-gray-400">Alice's Perspective</p>
              </div>
              <div className="px-3 py-1 bg-primary/20 rounded-full">
                <span className="text-primary text-sm font-semibold">Full Access</span>
              </div>
            </div>

            {/* User View Content */}
            <div className="space-y-6">
              {/* Initial State - Show placeholder */}
              {currentStep < 2 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-surface rounded-lg p-8 flex flex-col items-center justify-center min-h-[400px]"
                >
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center">
                      <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">Alice</p>
                      <p className="text-gray-400 text-sm mt-2">Wallet: 0x742d...0bEb</p>
                      <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-lg">
                        <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-primary text-sm font-semibold">Full Access</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-gray-300 font-medium">Alice can see:</p>
                      <div className="text-sm text-gray-400 space-y-1">
                        <p>✓ Exact credit score</p>
                        <p>✓ All score factors</p>
                        <p>✓ Complete transaction history</p>
                        <p>✓ Wallet balance</p>
                      </div>
                    </div>
                    {currentStep === 0 && (
                      <p className="text-primary text-sm font-semibold animate-pulse">
                        👆 Click "Start Demo" above to begin
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Credit Score Section */}
              {currentStep >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {loadingScore ? (
                    <div className="bg-surface rounded-lg p-6 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : creditScore ? (
                    <div className="bg-surface rounded-lg p-6">
                      <h3 className="text-sm text-gray-400 mb-2">CREDIT SCORE</h3>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-5xl font-bold text-primary">
                          {creditScore.ficoDisplay || creditScore.score}
                        </span>
                        <span className="text-gray-400">/ 850</span>
                      </div>
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          creditScore.risk === 'Low' ? 'bg-green-900 text-green-400' :
                          creditScore.risk === 'Medium' ? 'bg-yellow-900 text-yellow-400' :
                          'bg-red-900 text-red-400'
                        }`}>
                          {creditScore.risk} Risk
                        </span>
                        <span className="px-3 py-1 bg-accent/20 rounded-full text-accent text-sm font-semibold">
                          {creditScore.levelName} Tier
                        </span>
                      </div>
                      <div className="border-t border-gray-700 pt-4 space-y-2">
                        <p className="text-xs text-gray-500">Score Breakdown (Alice sees everything):</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Wallet Age:</span>
                            <span className="text-white">✅ +18pt</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Transactions:</span>
                            <span className="text-white">✅ +12pt</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Protocols:</span>
                            <span className="text-white">✅ +8pt</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Asset Value:</span>
                            <span className="text-white">✅ +10pt</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                        <p className="text-xs text-primary">🔒 Private - Only Alice can see these details</p>
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              )}

              {/* ZK Proof Section */}
              {currentStep >= 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {generatingProof ? (
                    <div className="bg-surface rounded-lg p-6">
                      <h3 className="text-sm text-gray-400 mb-4">GENERATING ZK PROOF</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <p className="text-gray-400">Creating cryptographic proof that:</p>
                          <div className="space-y-1 pl-4">
                            <p className="text-white">✓ Score is in Gold tier (60-79)</p>
                            <p className="text-white">✓ NOT revealing exact score ({creditScore?.score || 742})</p>
                            <p className="text-white">✓ Wallet age meets requirements</p>
                            <p className="text-white">✓ Anti-sybil check passed</p>
                          </div>
                          <p className="text-gray-500 text-xs mt-4">🧮 Using Circom + Groth16 + BN128</p>
                        </div>
                      </div>
                    </div>
                  ) : zkProof ? (
                    <div className="bg-surface rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm text-gray-400">ZK PROOF</h3>
                        {!zkProof.isSimulated && (
                          <span className="px-2 py-1 bg-purple-900 text-purple-300 rounded text-xs font-semibold">
                            ✅ Real Proof
                          </span>
                        )}
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-gray-500">Generation Time:</p>
                          <p className="text-white font-mono">{zkProof.processingTimeMs || 1847}ms</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Proof Size:</p>
                          <p className="text-white font-mono">~1.2 KB</p>
                        </div>
                        <div className="border-t border-gray-700 pt-3">
                          <p className="text-xs text-gray-500 mb-2">Proof proves:</p>
                          <div className="space-y-1 text-sm">
                            <p className="text-green-400">✅ Gold Tier (score 60-79)</p>
                            <p className="text-green-400">✅ Wallet age ≥ 180 days</p>
                            <p className="text-green-400">✅ Anti-sybil score ≥ 35</p>
                          </div>
                        </div>
                        <div className="border-t border-gray-700 pt-3">
                          <p className="text-xs text-gray-500 mb-2">Proof reveals:</p>
                          <p className="text-red-400 text-sm">❌ NOTHING ELSE (exact score hidden)</p>
                        </div>
                      </div>
                      {currentStep >= 6 && !proofSubmitted && (
                        <button
                          className="w-full mt-4 bg-primary text-black py-2 rounded-lg font-semibold hover:bg-primary/80 transition"
                          onClick={() => setProofSubmitted(true)}
                        >
                          Submit Proof to Bank →
                        </button>
                      )}
                    </div>
                  ) : null}
                </motion.div>
              )}

              {/* Savings Comparison */}
              {currentStep >= 8 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-surface rounded-lg p-6"
                >
                  <h3 className="text-sm text-gray-400 mb-4">ALICE'S SAVINGS</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500">Traditional DeFi:</p>
                      <p className="text-xl font-bold text-red-400">15 ETH required ($52,500)</p>
                      <p className="text-xs text-gray-400">150% collateral ratio</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">With KarmaTrust (Gold Tier):</p>
                      <p className="text-xl font-bold text-green-400">12.5 ETH required ($43,750)</p>
                      <p className="text-xs text-gray-400">125% collateral ratio</p>
                    </div>
                    <div className="border-t border-gray-700 pt-4">
                      <p className="text-xs text-gray-500 mb-2">Total Savings:</p>
                      <p className="text-3xl font-bold text-accent">2.5 ETH</p>
                      <p className="text-xl text-accent">($8,750)</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* RIGHT SCREEN - BANK VIEW */}
          <motion.div
            className={`border-2 rounded-xl p-6 transition-all ${
              rightHighlight ? 'border-accent shadow-lg shadow-accent/50' : 'border-gray-800'
            }`}
            animate={{
              scale: rightHighlight ? 1.02 : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-accent">BANK VIEW</h2>
                <p className="text-sm text-gray-400">Lender's Perspective</p>
              </div>
              <div className="px-3 py-1 bg-accent/20 rounded-full">
                <span className="text-accent text-sm font-semibold">Privacy Protected</span>
              </div>
            </div>

            {/* Bank View Content */}
            <div className="space-y-6">
              {currentStep < 7 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-surface rounded-lg p-8 flex flex-col items-center justify-center min-h-[400px]"
                >
                  <div className="text-center space-y-6">
                    {currentStep < 6 ? (
                      <>
                        <div className="w-20 h-20 mx-auto bg-gray-800 rounded-full flex items-center justify-center">
                          <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-gray-500">Bank / Lender</p>
                          <p className="text-gray-600 text-sm mt-2">DeFi Protocol</p>
                          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg">
                            <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-600 text-sm font-semibold">Privacy Protected</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="text-gray-500 font-medium">
                            {currentStep === 0 
                              ? "Bank currently sees:"
                              : "⏳ Awaiting Proof"}
                          </p>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p>❌ No credit score</p>
                            <p>❌ No wallet data</p>
                            <p>❌ No transaction history</p>
                            <p>❌ No personal information</p>
                          </div>
                        </div>
                        {currentStep === 0 && (
                          <p className="text-gray-600 text-sm">
                            Complete privacy until ZK proof is submitted
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent mx-auto"></div>
                        <p className="text-xl text-accent font-semibold">Verifying Proof...</p>
                        <p className="text-gray-400 text-sm">8ms verification time</p>
                        <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
                          <p className="text-yellow-400 text-sm font-semibold">
                            ⏳ Bank does NOT know tier yet
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Cryptographic verification in progress...
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="bg-surface rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm text-gray-400">VERIFICATION RESULT</h3>
                      <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-xs font-semibold animate-pulse">
                        ✅ JUST VERIFIED
                      </span>
                    </div>
                    <div className="mb-4 p-3 bg-green-900/20 border border-green-700 rounded-lg">
                      <p className="text-green-400 text-sm font-semibold">
                        🎉 Verification Complete! Bank NOW knows user's tier
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-gray-500">Verification Time:</p>
                        <p className="text-white font-mono">8ms ⚡</p>
                      </div>
                      <div className="border-t border-gray-700 pt-4">
                        <p className="text-xs text-gray-500 mb-3">VERIFIED INFORMATION:</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Tier:</span>
                            <span className="text-accent font-semibold">GOLD</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Eligibility:</span>
                            <span className="text-green-400 font-semibold">APPROVED</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Max Borrow:</span>
                            <span className="text-white font-semibold">20 ETH</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Collateral Ratio:</span>
                            <span className="text-white font-semibold">125%</span>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-gray-700 pt-4">
                        <p className="text-xs text-gray-500 mb-3">STILL HIDDEN (Even after verification):</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Exact score (742):</span>
                            <span className="text-red-500 font-mono font-bold">[ENCRYPTED]</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Wallet balance:</span>
                            <span className="text-red-500 font-mono font-bold">[ENCRYPTED]</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Transaction history:</span>
                            <span className="text-red-500 font-mono font-bold">[ENCRYPTED]</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Protocols used:</span>
                            <span className="text-red-500 font-mono font-bold">[ENCRYPTED]</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-accent/10 border border-accent/30 rounded-lg">
                        <p className="text-xs text-accent">
                          🛡️ Bank knows ONLY what the ZK proof reveals: Tier level
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Savings Display for Bank */}
                  {currentStep >= 8 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                      className="bg-surface rounded-lg p-6 mt-6"
                    >
                      <h3 className="text-sm text-gray-400 mb-4">LOAN APPROVED</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Loan Amount:</span>
                          <span className="text-white font-semibold">10 ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Required Collateral:</span>
                          <span className="text-green-400 font-semibold">12.5 ETH</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Interest Rate:</span>
                          <span className="text-white font-semibold">6% APY</span>
                        </div>
                        <div className="border-t border-gray-700 pt-3">
                          <p className="text-xs text-gray-500 mb-2">Risk Assessment:</p>
                          <span className="px-3 py-1 bg-green-900 text-green-300 rounded-full text-sm font-semibold">
                            Low Risk (Gold Tier Verified)
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Final Message */}
      {currentStep === demoScript.length - 1 && !isPlaying && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="container mx-auto px-4 pb-8"
        >
          <div className="bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/50 rounded-xl p-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              This is Zero-Knowledge Credit
            </h2>
            <p className="text-xl text-gray-300 mb-6">
              Prove creditworthiness. Hide sensitive data. Get better rates.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={resetDemo}
                className="bg-primary text-black px-8 py-3 rounded-lg font-semibold hover:bg-primary/80 transition"
              >
                Watch Again
              </button>
              <a
                href="https://github.com/rpnny/karmatrust-mvp"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-600 transition"
              >
                View on GitHub →
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
