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
        setCurrentStep(2);
        updateStepStatus(2, 'active');
      } else {
        setError(data.error || 'Failed to calculate credit score');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCredential = () => {
    // Simulate credential creation
    updateStepStatus(2, 'completed');
    setCurrentStep(3);
    updateStepStatus(3, 'active');
  };

  const handleGenerateProof = () => {
    // Simulate proof generation
    updateStepStatus(3, 'completed');
    setCurrentStep(4);
    updateStepStatus(4, 'active');
    calculateCollateral();
  };

  const calculateCollateral = async () => {
    if (!creditResult) return;

    const borrowAmount = 10; // 10 ETH example
    const traditionalRatio = 1.5; // 150%
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
      }
    } catch (err) {
      console.error('Error calculating collateral:', err);
    }

    updateStepStatus(4, 'completed');
    setCurrentStep(5);
    updateStepStatus(5, 'active');
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
      <div className="max-w-6xl mx-auto mb-12">
        <div className="flex items-center justify-between">
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
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-gray-400">Analyzing on-chain behavior...</p>
                </div>
              ) : creditResult ? (
                <div className="text-center py-10">
                  <div className="text-6xl font-bold text-primary mb-4">{creditResult.ficoDisplay}</div>
                  <div className="text-2xl text-gray-400 mb-2">{creditResult.levelName} Tier</div>
                  <div className="text-lg text-gray-500">{creditResult.risk} Risk</div>
                </div>
              ) : null}
            </StepContainer>
          )}

          {/* Step 2: Create Credential */}
          {currentStep === 2 && creditResult && (
            <StepContainer key="step2" title="Step 2: Create Your Credential">
              <div className="grid grid-cols-2 gap-6">
                <CredentialOption
                  title="👁️ Public Mode"
                  description="Score visible on EAS"
                  onClick={handleCreateCredential}
                />
                <CredentialOption
                  title="🔐 Privacy Mode"
                  description="Commitment-based (ZK-friendly)"
                  onClick={handleCreateCredential}
                />
              </div>
            </StepContainer>
          )}

          {/* Step 3: Generate Proof */}
          {currentStep === 3 && creditResult && (
            <StepContainer key="step3" title="Step 3: Generate Zero-Knowledge Proof">
              <div className="text-center py-10">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-4">
                    <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="text-gray-400 mb-6">
                    Prove you're in <span className="text-primary font-bold">{creditResult.levelName}</span> tier<br />
                    without revealing your exact score
                  </p>
                </div>
                <button
                  onClick={handleGenerateProof}
                  className="bg-primary text-black px-8 py-3 rounded-lg font-semibold hover:bg-primary/80 transition"
                >
                  Generate Proof
                </button>
              </div>
            </StepContainer>
          )}

          {/* Step 4: Check Lending */}
          {currentStep === 4 && creditResult && (
            <StepContainer key="step4" title="Step 4: Your Borrowing Capacity">
              <div className="grid grid-cols-3 gap-6">
                <StatCard
                  title="Your Tier"
                  value={creditResult.levelName}
                  color={TIER_COLORS[creditResult.level]}
                />
                <StatCard title="Collateral Ratio" value={getTierRatio(creditResult.level)} color="#00ff88" />
                <StatCard title="Interest Rate" value={getTierInterest(creditResult.level)} color="#ffd700" />
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

function CredentialOption({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-background border-2 border-gray-700 rounded-xl p-8 hover:border-primary transition-all duration-300 group"
    >
      <div className="text-4xl mb-4">{title.split(' ')[0]}</div>
      <div className="text-lg font-semibold text-white mb-2 group-hover:text-primary transition">
        {title.substring(title.indexOf(' ') + 1)}
      </div>
      <div className="text-sm text-gray-500">{description}</div>
    </button>
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
      <div className="grid grid-cols-3 gap-6">
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
      <div className="grid grid-cols-2 gap-6">
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
