/**
 * Analytics Dashboard Page
 * 
 * Advanced analytics and insights for credit scores.
 * Provides detailed visualizations and comparisons.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { Card, StatCard } from '../components/shared/Card';
import { Button } from '../components/shared/Button';

// =============================================================================
// TYPES
// =============================================================================

interface CreditResult {
  score: number;
  ficoDisplay: number;
  level: number;
  levelName: string;
  risk: string;
  factors: {
    wallet_age: number;
    transaction_frequency: number;
    protocol_diversity: number;
    asset_value: number;
    volatility: number;
    stability: number;
  };
}

// =============================================================================
// MOCK DATA
// =============================================================================

const TIER_DISTRIBUTION = [
  { name: 'Bronze', value: 35, color: '#cd7f32' },
  { name: 'Silver', value: 25, color: '#c0c0c0' },
  { name: 'Gold', value: 20, color: '#ffd700' },
  { name: 'Platinum', value: 15, color: '#e5e4e2' },
  { name: 'Diamond', value: 5, color: '#b9f2ff' },
];

const SCORE_TREND = [
  { month: 'Jan', score: 650 },
  { month: 'Feb', score: 680 },
  { month: 'Mar', score: 690 },
  { month: 'Apr', score: 710 },
  { month: 'May', score: 730 },
  { month: 'Jun', score: 750 },
];

// =============================================================================
// COMPONENT
// =============================================================================

export default function Analytics() {
  const { wallet } = useParams<{ wallet: string }>();
  const navigate = useNavigate();
  const [creditData, setCreditData] = useState<CreditResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wallet) return;

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/credit/score?wallet=${wallet}`);
        const data = await res.json();
        if (data.success) {
          setCreditData(data.data);
        }
      } catch (err) {
        console.error('Error fetching credit data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [wallet]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse text-xl">Loading Analytics...</div>
      </div>
    );
  }

  if (!creditData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Failed to load credit data</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  // Prepare radar chart data
  const radarData = Object.entries(creditData.factors).map(([key, value]) => ({
    factor: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    value: value * 100,
    fullMark: 100,
  }));

  // Prepare factor comparison
  const factorComparison = Object.entries(creditData.factors).map(([key, value]) => ({
    name: key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    yourScore: value * 100,
    average: Math.random() * 40 + 50, // Mock average
  }));

  return (
    <div className="min-h-screen bg-background text-white p-4 md:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary">Credit Analytics</h1>
            <p className="text-gray-400 text-sm mt-2 font-mono">
              {wallet?.slice(0, 10)}...{wallet?.slice(-8)}
            </p>
          </div>
          <Button onClick={() => navigate(`/demo/${wallet}`)} variant="outline">
            ← Back to Dashboard
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            label="Credit Score"
            value={creditData.ficoDisplay}
            variant="default"
            trend="up"
            trendValue="+12 pts"
          />
          <StatCard
            label="Tier"
            value={creditData.levelName}
            variant="success"
          />
          <StatCard
            label="Risk Level"
            value={creditData.risk}
            variant={creditData.risk === 'Low' ? 'success' : creditData.risk === 'Medium' ? 'warning' : 'error'}
          />
          <StatCard
            label="Percentile"
            value="Top 15%"
            variant="default"
            trend="up"
            trendValue="+3%"
          />
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <Card variant="bordered" padding="lg">
            <h2 className="text-xl font-semibold text-white mb-6">Factor Analysis</h2>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#374151" />
                <PolarAngleAxis dataKey="factor" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9ca3af' }} />
                <Radar name="Your Score" dataKey="value" stroke="#00ff88" fill="#00ff88" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </Card>

          {/* Tier Distribution */}
          <Card variant="bordered" padding="lg">
            <h2 className="text-xl font-semibold text-white mb-6">Global Tier Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={TIER_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {TIER_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Trend */}
          <Card variant="bordered" padding="lg">
            <h2 className="text-xl font-semibold text-white mb-6">Score History</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={SCORE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis domain={[600, 800]} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Line type="monotone" dataKey="score" stroke="#00ff88" strokeWidth={2} dot={{ fill: '#00ff88' }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Factor Comparison */}
          <Card variant="bordered" padding="lg">
            <h2 className="text-xl font-semibold text-white mb-6">vs. Network Average</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={factorComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 10 }} />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#9ca3af' }}
                />
                <Legend />
                <Bar dataKey="yourScore" fill="#00ff88" name="Your Score" />
                <Bar dataKey="average" fill="#6b7280" name="Network Avg" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Insights */}
        <Card variant="bordered" padding="lg">
          <h2 className="text-xl font-semibold text-white mb-4">AI-Powered Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <h3 className="font-semibold text-primary mb-1">Strength</h3>
                  <p className="text-sm text-gray-400">
                    Your wallet age and stability are excellent. Continue maintaining consistent on-chain activity.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-surface rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📈</span>
                <div>
                  <h3 className="font-semibold text-yellow-400 mb-1">Opportunity</h3>
                  <p className="text-sm text-gray-400">
                    Increase protocol diversity by interacting with 3+ additional DeFi protocols to boost your score.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
