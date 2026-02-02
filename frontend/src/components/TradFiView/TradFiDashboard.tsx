/**
 * TradFi Dashboard Component
 * 
 * Traditional Finance view - simulates a bank credit report.
 * Designed to look familiar to traditional financial institutions.
 * 
 * Design Philosophy:
 * - PDF-style layout (white background, formal typography)
 * - FICO score prominence (300-850 range)
 * - Bond-style risk ratings (AAA, AA, A, BBB, etc.)
 * - Traditional banking terminology
 * - Royal blue accent color (#4169e1)
 */

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface TradFiReport {
  format: 'traditional';
  ficoScore: number;
  riskRating: 'AAA' | 'AA' | 'A' | 'BBB' | 'BB' | 'B' | 'CCC';
  creditUtilization: number;
  accountAge: number;
  paymentHistory: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  derogatoriesCount: number;
  inquiriesLast12Months: number;
  publicRecords: number;
  reportDate: string;
  reportId: string;
}

interface TradFiDashboardProps {
  wallet: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function TradFiDashboard({ wallet }: TradFiDashboardProps) {
  const [report, setReport] = useState<TradFiReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTradFiReport();
  }, [wallet]);

  const fetchTradFiReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bridge/to-tradfi/${wallet}`);
      const data = await response.json();
      
      if (data.success) {
        setReport(data.data);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error || !report) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="h-full flex flex-col bg-white text-gray-900 rounded-2xl p-8 overflow-auto">
      {/* Header - Traditional Bank Style */}
      <motion.div 
        className="border-b-2 border-tradfi pb-4 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-tradfi">Credit Report</h1>
            <p className="text-sm text-gray-600">Traditional Finance Format</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Report ID</div>
            <div className="font-mono text-sm font-semibold">{report.reportId}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span>📄 Blockchain-Sourced Data</span>
          <span>|</span>
          <span>🔒 Verified Report</span>
          <span>|</span>
          <span>📅 {new Date(report.reportDate).toLocaleDateString()}</span>
        </div>
      </motion.div>

      {/* FICO Score - Prominent Display */}
      <motion.div 
        className="bg-gradient-to-br from-tradfi/10 to-tradfi/5 rounded-xl p-6 mb-6 border-2 border-tradfi/20"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="text-center">
          <div className="text-sm text-gray-600 mb-2">FICO® Credit Score</div>
          <div className="text-7xl font-bold text-tradfi mb-2">{report.ficoScore}</div>
          <div className="flex items-center justify-center gap-3">
            <ScoreGauge score={report.ficoScore} />
            <div className="text-left">
              <div className="text-xs text-gray-500">Range: 300 - 850</div>
              <div className="text-xs text-gray-500">Rating: {getScoreDescription(report.ficoScore)}</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Risk Rating - Bond Style */}
      <motion.div
        className="grid grid-cols-2 gap-4 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Credit Rating</div>
          <div className={`text-3xl font-bold ${getRatingColor(report.riskRating)}`}>
            {report.riskRating}
          </div>
          <div className="text-xs text-gray-500 mt-1">Investment Grade</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Payment History</div>
          <div className="text-xl font-semibold text-gray-800">{report.paymentHistory}</div>
          <div className="text-xs text-gray-500 mt-1">On-chain verified</div>
        </div>
      </motion.div>

      {/* Credit Factors */}
      <motion.div
        className="space-y-4 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Credit Factors</h3>
        
        <CreditFactorRow 
          label="Credit Utilization" 
          value={`${report.creditUtilization}%`}
          status={report.creditUtilization < 30 ? 'good' : report.creditUtilization < 50 ? 'fair' : 'poor'}
        />
        <CreditFactorRow 
          label="Account Age" 
          value={`${report.accountAge} months`}
          status={report.accountAge >= 24 ? 'good' : report.accountAge >= 12 ? 'fair' : 'poor'}
        />
        <CreditFactorRow 
          label="Derogatory Marks" 
          value={report.derogatoriesCount.toString()}
          status={report.derogatoriesCount === 0 ? 'good' : 'poor'}
        />
        <CreditFactorRow 
          label="Hard Inquiries (12mo)" 
          value={report.inquiriesLast12Months.toString()}
          status={report.inquiriesLast12Months <= 2 ? 'good' : 'fair'}
        />
        <CreditFactorRow 
          label="Public Records" 
          value={report.publicRecords.toString()}
          status={report.publicRecords === 0 ? 'good' : 'poor'}
        />
      </motion.div>

      {/* Footer - Compliance Notice */}
      <motion.div 
        className="mt-auto pt-4 border-t border-gray-200 text-xs text-gray-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="mb-2">
          <strong>Data Source:</strong> Ethereum blockchain analysis via KarmaTrust DAISY infrastructure
        </p>
        <p className="mb-2">
          <strong>Methodology:</strong> On-chain transaction history, wallet age, protocol interactions, and behavioral analysis
        </p>
        <p>
          ℹ️ This report translates blockchain data into traditional credit metrics. 
          FICO® is a registered trademark. This is a FICO-style score, not an official FICO score.
        </p>
      </motion.div>
    </div>
  );
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function ScoreGauge({ score }: { score: number }) {
  const percentage = ((score - 300) / 550) * 100;
  
  return (
    <div className="flex items-center gap-1">
      <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-tradfi transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function CreditFactorRow({ label, value, status }: { 
  label: string; 
  value: string; 
  status: 'good' | 'fair' | 'poor';
}) {
  const statusColors = {
    good: 'text-green-600',
    fair: 'text-yellow-600',
    poor: 'text-red-600',
  };

  const statusIcons = {
    good: '✓',
    fair: '•',
    poor: '⚠',
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900">{value}</span>
        <span className={`text-sm ${statusColors[status]}`}>{statusIcons[status]}</span>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="h-full flex items-center justify-center bg-white rounded-2xl">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-tradfi border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Generating TradFi report...</p>
      </div>
    </div>
  );
}

function ErrorState({ error }: { error: string | null }) {
  return (
    <div className="h-full flex items-center justify-center bg-white rounded-2xl p-8">
      <div className="text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <p className="text-gray-600 mb-2">Failed to generate report</p>
        <p className="text-sm text-gray-500">{error || 'Unknown error'}</p>
      </div>
    </div>
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getScoreDescription(score: number): string {
  if (score >= 800) return 'Exceptional';
  if (score >= 740) return 'Very Good';
  if (score >= 670) return 'Good';
  if (score >= 580) return 'Fair';
  return 'Poor';
}

function getRatingColor(rating: string): string {
  if (rating === 'AAA' || rating === 'AA') return 'text-green-600';
  if (rating === 'A' || rating === 'BBB') return 'text-blue-600';
  if (rating === 'BB' || rating === 'B') return 'text-yellow-600';
  return 'text-red-600';
}
