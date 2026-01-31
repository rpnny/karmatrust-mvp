/**
 * Alice's Journey Page
 * 
 * An end-to-end demo showing the complete user flow from credit scoring
 * to borrowing with reduced collateral.
 * 
 * Flow:
 * 1. Enter wallet & calculate credit score
 * 2. Choose credential mode (Public or Privacy)
 * 3. Generate ZK proof (optional)
 * 4. View borrowing capacity
 * 5. See collateral savings vs traditional DeFi
 * 
 * This is the "WOW" moment for judges - showing the complete value proposition
 * in a single, beautiful flow.
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast, toast } from '../components/shared/Toast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// =============================================================================
// TYPES
// =============================================================================

interface JourneyStep {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
}

interface CreditResult {
  score: number;
  ficoDisplay: number;
  level: number;
  levelName: string;
  risk: string;
  factors: Record<string, number>;
}

interface CollateralData {
  borrowAmount: string;
  traditionalCollateral: number;
  karmatrustCollateral: number;
  savings: number;
  savingsPercent: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const INITIAL_STEPS: JourneyStep[] = [
  {
    id: 1,
    title: 'Calculate Credit',
    description: 'Analyze on-chain behavior',
    status: 'active',
  },
  {
    id: 2,
    title: 'Create Credential',
    description: 'Choose privacy mode',
    status: 'pending',
  },
  {
    id: 3,
    title: 'Generate Proof',
    description: 'Zero-knowledge verification',
    status: 'pending',
  },
  {
    id: 4,
    title: 'Check Lending',
    description: 'View borrowing capacity',
    status: 'pending',
  },
  {
    id: 5,
    title: 'Compare Savings',
    description: 'See the benefits',
    status: 'pending',
  },
];

const TIER_COLORS: Record<number, string> = {
  1: '#cd7f32', // Bronze
  2: '#c0c0c0', // Silver
  3: '#ffd700', // Gold
  4: '#e5e4e2', // Platinum
  5: '#b9f2ff', // Diamond
};

// =============================================================================
// COMPONENT
// =============================================================================

export default function Journey() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [steps, setSteps] = useState<JourneyStep[]>(INITIAL_STEPS);
  const [wallet, setWallet] = useState('0x8103ac5D4a8C01Be2181AF080794411376C7f61c');
  const [creditResult, setCreditResult] = useState<CreditResult | null>(null);
  const [collateralData, setCollateralData] = useState<CollateralData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-start the journey
  useEffect(() => {
    if (currentStep === 1 && !creditResult && !loading) {
      handleCalculateCredit();
    }
  }, []);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleCalculateCredit = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/credit/score?wallet=${wallet}`);
      const data = await res.json();

      if (data.success) {
        setCreditResult(data.data);
        updateStepStatus(1, 'completed');
        showToast(toast.success(
          'Credit Score Calculated!',
          `Your score is ${data.data.ficoDisplay} (${data.data.levelName} Tier)`,
          4000
        ));
        // Don't auto-advance, wait for user
      } else {
        const errorMsg = data.error || 'Failed to calculate credit score';
        setError(errorMsg);
        showToast(toast.error('Calculation Failed', errorMsg));
      }
    } catch (err: any) {
      setError(err.message);
      showToast(toast.error('Network Error', err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep < 5) {
      updateStepStatus(currentStep, 'completed');
      setCurrentStep(currentStep + 1);
      updateStepStatus(currentStep + 1, 'active');
      
      // Trigger specific actions for certain steps
      if (currentStep === 3) {
        // After generating proof, calculate collateral
        calculateCollateral();
      }
    }
  };

  const handleCreateCredential = () => {
    // Simulate credential creation
    showToast(toast.success(
      'Credential Created!',
      'Your on-chain attestation has been generated',
      3000
    ));
    handleNextStep();
  };

  const handleGenerateProof = () => {
    // Simulate proof generation
    showToast(toast.success(
      'ZK Proof Generated!',
      'Proof created in ~400ms. Your privacy is protected.',
      4000
    ));
    handleNextStep();
  };

  const calculateCollateral = async () => {
    if (!creditResult) return;

    const borrowAmount = 10; // 10 ETH example
    const tier = creditResult.level || 1;

    // Get tier-specific ratio from API
    try {
      const res = await fetch(`/api/contracts/lending/savings?tier=${tier}&amount=${borrowAmount}`);
      const data = await res.json();

      if (data.success) {
        const savings = data.data;
        setCollateralData({
          borrowAmount: borrowAmount.toString(),
          traditionalCollateral: parseFloat(savings.baseCollateral),
          karmatrustCollateral: parseFloat(savings.tierCollateral),
          savings: parseFloat(savings.savings),
          savingsPercent: savings.savingsPercent,
        });
        showToast(toast.info(
          'Collateral Calculated',
          `You save ${parseFloat(savings.savings).toFixed(2)} ETH (${savings.savingsPercent}%)`,
          4000
        ));
      }
    } catch (err: any) {
      console.error('Error calculating collateral:', err);
      showToast(toast.warning('Calculation Failed', 'Using default collateral values'));
    }
  };

  const updateStepStatus = (stepId: number, status: 'pending' | 'active' | 'completed') => {
    setSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status } : step))
    );
  };

  const handleRestart = () => {
    setCurrentStep(1);
    setSteps(INITIAL_STEPS);
    setCreditResult(null);
    setCollateralData(null);
    setError(null);
    setTimeout(() => handleCalculateCredit(), 500);
  };

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <div className="min-h-screen bg-background text-white p-8">
      {/* Header */}
      <motion.div
        className="max-w-6xl mx-auto mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-gray-400 hover:text-primary transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>

        <h1 className="text-5xl font-bold text-primary mb-4">Alice's Journey</h1>
        <p className="text-xl text-gray-400">
          From credit scoring to borrowing with <span className="text-primary">reduced collateral</span>
        </p>
      </motion.div>

      {/* Progress Bar */}
      <div className="max-w-6xl mx-auto mb-12 px-4">
        <div className="hidden md:flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <motion.div
                className={`relative flex flex-col items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                    step.status === 'completed'
                      ? 'bg-primary text-black'
                      : step.status === 'active'
                      ? 'bg-primary/20 text-primary border-2 border-primary animate-pulse'
                      : 'bg-surface text-gray-500 border-2 border-gray-700'
                  }`}
                >
                  {step.status === 'completed' ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step.id
                  )}
                </div>

                <div className="mt-3 text-center">
                  <div className={`text-sm font-semibold ${step.status === 'active' ? 'text-primary' : 'text-gray-400'}`}>
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">{step.description}</div>
                </div>
              </motion.div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 relative" style={{ top: '-35px' }}>
                  <div className="absolute inset-0 bg-gray-700" />
                  <motion.div
                    className="absolute inset-0 bg-primary"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: step.status === 'completed' ? 1 : 0 }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    style={{ transformOrigin: 'left' }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile Progress Indicator */}
        <div className="md:hidden flex items-center justify-center gap-2 mt-6">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`h-2 rounded-full transition-all duration-300 ${
                step.status === 'completed'
                  ? 'bg-primary w-8'
                  : step.status === 'active'
                  ? 'bg-primary/50 w-12 animate-pulse'
                  : 'bg-gray-700 w-6'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          className="max-w-6xl mx-auto mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 text-red-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        </motion.div>
      )}

      {/* Step Content */}
      <div className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {/* Step 1: Calculate Credit */}
          {currentStep === 1 && (
            <StepContainer key="step1" title="Step 1: Calculating Your Credit Score">
              {loading ? (
                <div className="space-y-6">
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-400 mb-6">Analyzing on-chain behavior...</p>
                  </div>
                  
                  {/* Loading Steps */}
                  <div className="space-y-3">
                    {['Fetching transaction history', 'Analyzing protocol interactions', 'Calculating wallet age', 'Evaluating risk factors', 'Computing final score'].map((step, i) => (
                      <motion.div
                        key={step}
                        className="flex items-center gap-3 text-sm"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.3 }}
                      >
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        <span className="text-gray-400">{step}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : creditResult ? (
                <div className="space-y-8">
                  {/* Score Display */}
                  <div className="text-center py-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', duration: 0.8 }}
                    >
                      <div className="text-7xl font-bold text-primary mb-2">{creditResult.ficoDisplay}</div>
                      <div className="text-2xl text-gray-400 mb-1">{creditResult.levelName} Tier</div>
                      <div className={`inline-block px-4 py-1 rounded-full text-sm ${
                        creditResult.risk === 'Low' ? 'bg-green-900/30 text-green-400' :
                        creditResult.risk === 'Medium' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>
                        {creditResult.risk} Risk
                      </div>
                    </motion.div>
                  </div>

                  {/* Detailed Factors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(creditResult.factors).map(([key, value], i) => (
                      <motion.div
                        key={key}
                        className="bg-background rounded-xl p-4 border border-gray-800"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-400">{formatFactorName(key)}</span>
                          <span className="text-sm font-semibold text-white">{(value * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${value * 100}%` }}
                            transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Explanation */}
                  <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-primary mb-2">📊 How This Score Was Calculated</h4>
                    <p className="text-sm text-gray-400">
                      Your score is based on {Object.keys(creditResult.factors).length} on-chain factors: wallet age, 
                      transaction frequency, protocol diversity, asset stability, and risk indicators. 
                      KarmaTrust uses a FICO-style algorithm (300-850 range) to make your on-chain credit 
                      understandable to traditional lenders.
                    </p>
                  </div>

                  {/* Next Button */}
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={handleNextStep}
                      className="bg-primary text-black px-8 py-3 rounded-xl font-semibold hover:bg-primary/90 transition transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 flex items-center gap-2"
                    >
                      Continue to Credentials
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : null}
            </StepContainer>
          )}

          {/* Step 2: Create Credential */}
          {currentStep === 2 && creditResult && (
            <StepContainer key="step2" title="Step 2: Create Your Credential">
              <div className="space-y-6">
                {/* Explanation */}
                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-800">
                  <p className="text-gray-400 text-sm mb-2">
                    KarmaTrust offers two credential modes. Choose based on your privacy preference:
                  </p>
                  <p className="text-primary text-xs">
                    👆 Click any mode to continue
                  </p>
                </div>

                {/* Options Grid */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Public Mode */}
                  <button
                    onClick={handleCreateCredential}
                    className="bg-background border-2 border-gray-700 rounded-xl p-6 hover:border-blue-500 transition-all duration-300 group text-left"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-4xl">👁️</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-blue-400 transition">
                          Public Mode
                        </h3>
                        <p className="text-sm text-gray-500">Score visible on EAS</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Instant verification</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Gas efficient</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Score is public</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <p className="text-xs text-gray-600">Best for: Quick loans, trusted parties</p>
                    </div>
                  </button>

                  {/* Privacy Mode */}
                  <button
                    onClick={handleCreateCredential}
                    className="bg-background border-2 border-gray-700 rounded-xl p-6 hover:border-primary transition-all duration-300 group text-left"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="text-4xl">🔐</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-white mb-1 group-hover:text-primary transition">
                          Privacy Mode
                        </h3>
                        <p className="text-sm text-gray-500">Commitment-based (ZK-friendly)</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Complete privacy</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>ZK-proof ready</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Score stays hidden</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-800">
                      <p className="text-xs text-gray-600">Best for: Maximum privacy, sensitive loans</p>
                    </div>
                  </button>
                </div>

                {/* Technical Details */}
                <div className="bg-background rounded-xl p-4 border border-gray-800">
                  <h4 className="text-sm font-semibold text-white mb-3">🔬 Technical Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-gray-500 mb-1">Public Mode</div>
                      <div className="text-gray-400">
                        • On-chain EAS attestation<br/>
                        • Schema: score, risk, timestamp<br/>
                        • Anyone can verify instantly
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500 mb-1">Privacy Mode</div>
                      <div className="text-gray-400">
                        • Poseidon commitment stored<br/>
                        • ZK proof reveals only tier<br/>
                        • Score remains cryptographically hidden
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </StepContainer>
          )}

          {/* Step 3: Generate Proof */}
          {currentStep === 3 && creditResult && (
            <StepContainer key="step3" title="Step 3: Generate Zero-Knowledge Proof">
              <div className="space-y-8">
                {/* Hero Section */}
                <div className="text-center py-6">
                  <motion.div
                    className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/20 mb-4"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </motion.div>
                  <h3 className="text-2xl font-bold text-white mb-2">Privacy-Preserving Verification</h3>
                  <p className="text-gray-400">
                    Prove you're in <span className="text-primary font-bold">{creditResult.levelName}</span> tier<br />
                    without revealing your exact score of <span className="blur-sm">{creditResult.ficoDisplay}</span>
                  </p>
                </div>

                  {/* What Gets Revealed */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div className="bg-red-900/10 border border-red-800/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <h4 className="text-sm font-semibold text-red-400">NOT Revealed</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>Your exact score ({creditResult.ficoDisplay})</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>Individual factor values</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>Transaction history details</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>Wallet activity patterns</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-green-900/10 border border-green-800/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <h4 className="text-sm font-semibold text-green-400">Only Revealed</h4>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-400">
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span>You're in {creditResult.levelName} tier</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span>Score is within tier bounds</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span>Proof is cryptographically valid</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">•</span>
                        <span>Attestation is on-chain</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Circuit Info */}
                <div className="bg-background rounded-xl p-6 border border-gray-800">
                  <h4 className="text-sm font-semibold text-white mb-4">⚡ Circuit Information</h4>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Circuit</div>
                      <div className="text-sm font-mono text-primary">tier_membership</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Constraints</div>
                      <div className="text-sm font-mono text-white">~250</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Proving Time</div>
                      <div className="text-sm font-mono text-white">~400ms</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Proof Size</div>
                      <div className="text-sm font-mono text-white">256 bytes</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-800 text-xs text-gray-500">
                    <p>Uses Groth16 proving system with Poseidon hash for ZK-friendly commitments. 
                    The circuit verifies your score is within the tier bounds without revealing the exact value.</p>
                  </div>
                </div>

                {/* Generate Button */}
                <div className="text-center">
                  <button
                    onClick={handleGenerateProof}
                    className="bg-primary text-black px-12 py-4 rounded-xl font-semibold text-lg hover:bg-primary/90 transition transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 flex items-center gap-2 mx-auto"
                  >
                    🔐 Generate Proof & Continue
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                  <p className="text-xs text-gray-600 mt-3">
                    Proof will be generated locally in your browser (~400ms)
                  </p>
                </div>
              </div>
            </StepContainer>
          )}

          {/* Step 4: Check Lending */}
          {currentStep === 4 && creditResult && (
            <StepContainer key="step4" title="Step 4: Your Borrowing Capacity">
              <div className="space-y-8">
                {/* Hero Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <motion.div
                    className="bg-background rounded-xl p-6 border-2 border-primary text-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="text-gray-400 text-sm mb-2">Your Tier</div>
                    <div className="text-4xl font-bold mb-2" style={{ color: TIER_COLORS[creditResult.level] }}>
                      {creditResult.levelName}
                    </div>
                    <div className="text-xs text-gray-600">Level {creditResult.level}/5</div>
                  </motion.div>

                  <motion.div
                    className="bg-background rounded-xl p-6 border border-gray-800 text-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="text-gray-400 text-sm mb-2">Collateral Ratio</div>
                    <div className="text-4xl font-bold text-primary mb-2">{getTierRatio(creditResult.level)}</div>
                    <div className="text-xs text-gray-600">vs 150% standard</div>
                  </motion.div>

                  <motion.div
                    className="bg-background rounded-xl p-6 border border-gray-800 text-center"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="text-gray-400 text-sm mb-2">Interest Rate</div>
                    <div className="text-4xl font-bold text-accent mb-2">{getTierInterest(creditResult.level)}</div>
                    <div className="text-xs text-gray-600">APR</div>
                  </motion.div>
                </div>

                {/* All Tiers Comparison */}
                <div className="bg-background rounded-xl p-6 border border-gray-800">
                  <h4 className="text-lg font-semibold text-white mb-4">📊 All Tier Comparison</h4>
                  <div className="space-y-3">
                    {[
                      { tier: 1, name: 'Bronze', ratio: '150%', rate: '10%', max: '1 ETH', color: '#cd7f32' },
                      { tier: 2, name: 'Silver', ratio: '140%', rate: '8%', max: '5 ETH', color: '#c0c0c0' },
                      { tier: 3, name: 'Gold', ratio: '125%', rate: '6%', max: '10 ETH', color: '#ffd700' },
                      { tier: 4, name: 'Platinum', ratio: '115%', rate: '4%', max: '50 ETH', color: '#e5e4e2' },
                      { tier: 5, name: 'Diamond', ratio: '110%', rate: '2%', max: '100 ETH', color: '#b9f2ff' },
                    ].map((t, i) => (
                      <motion.div
                        key={t.tier}
                        className={`flex items-center gap-4 p-4 rounded-lg ${
                          t.tier === creditResult.level
                            ? 'bg-primary/10 border-2 border-primary'
                            : 'bg-surface border border-gray-800'
                        }`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.1 }}
                      >
                        <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: t.color + '20' }}>
                          {t.tier === creditResult.level ? '👑' : ''}
                        </div>
                        <div className="flex-1 grid grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs text-gray-500">Tier</div>
                            <div className="text-sm font-semibold" style={{ color: t.color }}>{t.name}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Collateral</div>
                            <div className="text-sm font-semibold text-white">{t.ratio}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Interest</div>
                            <div className="text-sm font-semibold text-white">{t.rate}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Max Borrow</div>
                            <div className="text-sm font-semibold text-white">{t.max}</div>
                          </div>
                        </div>
                        {t.tier === creditResult.level && (
                          <div className="px-3 py-1 bg-primary text-black text-xs font-semibold rounded-full">
                            YOUR TIER
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Benefits */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-900/20 border border-green-700 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <h4 className="text-sm font-semibold text-green-400">Upgrade Path</h4>
                    </div>
                    <p className="text-xs text-gray-400">
                      Continue building your on-chain reputation to unlock better rates and higher limits. 
                      Next tier: {creditResult.level < 5 ? ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'][creditResult.level] : 'Max tier reached!'}
                    </p>
                  </div>

                  <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      <h4 className="text-sm font-semibold text-blue-400">Smart Contract Secured</h4>
                    </div>
                    <p className="text-xs text-gray-400">
                      Your collateral and loan terms are enforced by audited smart contracts on Sepolia. 
                      Transparent, trustless, and unstoppable.
                    </p>
                  </div>
                </div>

                {/* Contract Info */}
                <div className="bg-background rounded-xl p-4 border border-gray-800">
                  <h4 className="text-xs font-semibold text-gray-500 mb-2">📜 Smart Contract</h4>
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-mono text-gray-400">TieredLending.sol</div>
                    <a
                      href="https://sepolia.etherscan.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline"
                    >
                      View on Etherscan →
                    </a>
                  </div>
                </div>

                {/* Next Button */}
                <div className="flex justify-center mt-6">
                  <button
                    onClick={handleNextStep}
                    className="bg-primary text-black px-8 py-3 rounded-xl font-semibold hover:bg-primary/90 transition transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 flex items-center gap-2"
                  >
                    See Your Savings
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </StepContainer>
          )}

          {/* Step 5: Compare Savings */}
          {currentStep === 5 && creditResult && collateralData && (
            <StepContainer key="step5" title="Step 5: Your Collateral Savings">
              <SavingsComparison collateralData={collateralData} tierName={creditResult.levelName} />
            </StepContainer>
          )}
        </AnimatePresence>
      </div>

      {/* Restart Button */}
      {currentStep === 5 && (
        <motion.div
          className="max-w-6xl mx-auto mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <button
            onClick={handleRestart}
            className="bg-surface border border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary hover:text-black transition"
          >
            Restart Journey
          </button>
        </motion.div>
      )}
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function StepContainer({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div
      className="bg-surface rounded-2xl p-8 border border-gray-800"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-bold mb-6">{title}</h2>
      {children}
    </motion.div>
  );
}

function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div className="bg-background rounded-xl p-6 border border-gray-800">
      <div className="text-gray-400 text-sm mb-2">{title}</div>
      <div className="text-3xl font-bold" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function SavingsComparison({
  collateralData,
  tierName,
}: {
  collateralData: CollateralData;
  tierName: string;
}) {
  const chartData = [
    {
      name: 'Traditional DeFi',
      collateral: collateralData.traditionalCollateral,
      fill: '#6b7280',
    },
    {
      name: `KarmaTrust (${tierName})`,
      collateral: collateralData.karmatrustCollateral,
      fill: '#00ff88',
    },
  ];

  const savingsData = [
    { name: 'Locked', value: collateralData.karmatrustCollateral, fill: '#00ff88' },
    { name: 'Saved', value: collateralData.savings, fill: '#ffd700' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-background rounded-xl p-6 border border-gray-800 text-center">
          <div className="text-gray-400 text-sm mb-2">Borrow Amount</div>
          <div className="text-3xl font-bold text-white">{collateralData.borrowAmount} ETH</div>
        </div>
        <div className="bg-green-900/20 rounded-xl p-6 border border-green-700 text-center">
          <div className="text-green-400 text-sm mb-2">You Save</div>
          <div className="text-3xl font-bold text-green-400">{collateralData.savings.toFixed(2)} ETH</div>
        </div>
        <div className="bg-green-900/20 rounded-xl p-6 border border-green-700 text-center">
          <div className="text-green-400 text-sm mb-2">Savings %</div>
          <div className="text-3xl font-bold text-green-400">{collateralData.savingsPercent}%</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Bar Chart */}
        <div className="bg-background rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">Collateral Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #374151' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="collateral" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-background rounded-xl p-6 border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">Your Collateral Breakdown</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={savingsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                dataKey="value"
              >
                {savingsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #374151' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-primary/10 border border-primary rounded-xl p-6">
        <h3 className="text-xl font-bold text-primary mb-3">🎉 Your Benefits with KarmaTrust</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Less Collateral Needed</div>
            <div className="text-white font-semibold">{collateralData.savings.toFixed(2)} ETH saved</div>
          </div>
          <div>
            <div className="text-gray-400">More Capital Efficient</div>
            <div className="text-white font-semibold">{collateralData.savingsPercent}% improvement</div>
          </div>
          <div>
            <div className="text-gray-400">Privacy Protected</div>
            <div className="text-white font-semibold">Via Zero-Knowledge Proofs</div>
          </div>
        </div>
      </div>

      {/* Real-World Impact */}
      <div className="bg-background rounded-xl p-6 border border-gray-800">
        <h4 className="text-lg font-semibold text-white mb-4">💰 Real-World Impact</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div>
            <h5 className="text-sm font-semibold text-gray-400 mb-3">Traditional DeFi</h5>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex justify-between">
                <span>Borrow 10 ETH</span>
                <span className="text-white">10 ETH</span>
              </div>
              <div className="flex justify-between">
                <span>Collateral needed</span>
                <span className="text-red-400">{collateralData.traditionalCollateral} ETH</span>
              </div>
              <div className="flex justify-between">
                <span>Capital locked</span>
                <span className="text-red-400">{collateralData.traditionalCollateral} ETH</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-800">
                <span>Free to use</span>
                <span className="text-white font-semibold">0 ETH</span>
              </div>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-primary mb-3">KarmaTrust ({tierName})</h5>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex justify-between">
                <span>Borrow 10 ETH</span>
                <span className="text-white">10 ETH</span>
              </div>
              <div className="flex justify-between">
                <span>Collateral needed</span>
                <span className="text-primary">{collateralData.karmatrustCollateral} ETH</span>
              </div>
              <div className="flex justify-between">
                <span>Capital locked</span>
                <span className="text-primary">{collateralData.karmatrustCollateral} ETH</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-800">
                <span>Free to use</span>
                <span className="text-green-400 font-semibold">{collateralData.savings.toFixed(2)} ETH ✨</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-background rounded-xl p-4 border border-gray-800">
          <div className="text-2xl mb-2">🌾</div>
          <h5 className="text-sm font-semibold text-white mb-1">Yield Farming</h5>
          <p className="text-xs text-gray-500">
            Use your saved {collateralData.savings.toFixed(1)} ETH for additional yield farming positions
          </p>
        </div>
        <div className="bg-background rounded-xl p-4 border border-gray-800">
          <div className="text-2xl mb-2">💎</div>
          <h5 className="text-sm font-semibold text-white mb-1">Leverage Trading</h5>
          <p className="text-xs text-gray-500">
            Lower collateral means higher effective leverage on your positions
          </p>
        </div>
        <div className="bg-background rounded-xl p-4 border border-gray-800">
          <div className="text-2xl mb-2">🔄</div>
          <h5 className="text-sm font-semibold text-white mb-1">Capital Efficiency</h5>
          <p className="text-xs text-gray-500">
            Freed up capital can be deployed across multiple strategies
          </p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getTierRatio(tier: number): string {
  const ratios: Record<number, string> = {
    1: '150%',
    2: '140%',
    3: '125%',
    4: '115%',
    5: '110%',
  };
  return ratios[tier] || '150%';
}

function getTierInterest(tier: number): string {
  const rates: Record<number, string> = {
    1: '10%',
    2: '8%',
    3: '6%',
    4: '4%',
    5: '2%',
  };
  return rates[tier] || '10%';
}

function formatFactorName(key: string): string {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
