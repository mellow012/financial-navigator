'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/Context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { Transaction } from '@/types/finance';
import {
  ArrowLeft, BarChart3, PieChart, TrendingUp, TrendingDown,
  Calendar, RefreshCw, DollarSign
} from 'lucide-react';
import Link from 'next/link';
import AuthGuard from '@/app/components/AuthGuard';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

const CATEGORY_COLORS: Record<string, string> = {
  food:          'rgba(251,146,60,0.85)',
  fuel:          'rgba(239,68,68,0.85)',
  utilities:     'rgba(234,179,8,0.85)',
  transport:     'rgba(59,130,246,0.85)',
  health:        'rgba(34,197,94,0.85)',
  entertainment: 'rgba(168,85,247,0.85)',
  household:     'rgba(99,102,241,0.85)',
  other:         'rgba(148,163,184,0.85)',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function AnalyticsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'3m' | '6m' | '12m'>('6m');

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc'))
      );
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
    } finally {
      setLoading(false);
    }
  };

  // --- Derived data ---
  const monthsBack = period === '3m' ? 3 : period === '6m' ? 6 : 12;
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - monthsBack);

  const filtered = transactions.filter(t => new Date(t.date) >= cutoff);

  // Category breakdown (expenses only)
  const catTotals = filtered
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const catEntries = Object.entries(catTotals).sort(([, a], [, b]) => b - a);
  const totalExpense = catEntries.reduce((s, [, v]) => s + v, 0);

  // Monthly income vs expense
  const monthlyData: Record<string, { income: number; expense: number }> = {};
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[key] = { income: 0, expense: 0 };
  }
  filtered.forEach(t => {
    const key = t.date.slice(0, 7);
    if (!monthlyData[key]) return;
    if (t.type === 'income')  monthlyData[key].income  += Math.abs(t.amount);
    else                       monthlyData[key].expense += Math.abs(t.amount);
  });

  const monthKeys   = Object.keys(monthlyData).sort();
  const monthLabels = monthKeys.map(k => {
    const [y, m] = k.split('-');
    return `${MONTHS[parseInt(m) - 1]} ${y.slice(2)}`;
  });
  const incomeData  = monthKeys.map(k => monthlyData[k].income);
  const expenseData = monthKeys.map(k => monthlyData[k].expense);
  const savingsData = monthKeys.map(k => monthlyData[k].income - monthlyData[k].expense);

  // Chart options base
  const chartDefaults = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: 'rgba(255,255,255,0.7)', font: { family: 'Sora, sans-serif', size: 12 } } },
      tooltip: {
        backgroundColor: 'rgba(15,10,40,0.95)',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#fff',
        bodyColor: 'rgba(255,255,255,0.7)',
        callbacks: {
          label: (ctx: any) => ` K${Math.abs(ctx.raw).toLocaleString('en', { maximumFractionDigits: 0 })}`,
        },
      },
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'rgba(255,255,255,0.5)' } },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: {
          color: 'rgba(255,255,255,0.5)',
          callback: (v: any) => `K${(v / 1000).toFixed(0)}k`,
        },
      },
    },
  };

  // Summary stats
  const totalIncome  = filtered.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
  const netSavings   = totalIncome - totalExpense;
  const savingsRate  = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
  const avgMonthlyExpense = totalExpense / monthsBack;

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
      <RefreshCw className="w-8 h-8 text-white animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-all">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Analytics</h2>
          </div>
          {/* Period selector */}
          <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            {(['3m', '6m', '12m'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  period === p ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Income', value: `K${totalIncome.toLocaleString('en',{maximumFractionDigits:0})}`, icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { label: 'Total Expenses', value: `K${totalExpense.toLocaleString('en',{maximumFractionDigits:0})}`, icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
            { label: 'Net Savings', value: `K${Math.abs(netSavings).toLocaleString('en',{maximumFractionDigits:0})}`, icon: DollarSign, color: netSavings >= 0 ? 'text-purple-400' : 'text-red-400', bg: 'bg-purple-500/10 border-purple-500/20' },
            { label: 'Savings Rate', value: `${savingsRate.toFixed(1)}%`, icon: BarChart3, color: savingsRate >= 20 ? 'text-emerald-400' : savingsRate >= 10 ? 'text-yellow-400' : 'text-red-400', bg: 'bg-white/5 border-white/10' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className={`border rounded-xl p-4 ${bg}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-white/50 text-xs">{label}</span>
              </div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Income vs Expense — Bar Chart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-1">Income vs Expenses</h3>
          <p className="text-white/40 text-xs mb-4">Monthly comparison · last {period}</p>
          <div className="h-64">
            <Bar
              data={{
                labels: monthLabels,
                datasets: [
                  {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: 'rgba(52,211,153,0.75)',
                    borderRadius: 6,
                    borderSkipped: false,
                  },
                  {
                    label: 'Expenses',
                    data: expenseData,
                    backgroundColor: 'rgba(248,113,113,0.75)',
                    borderRadius: 6,
                    borderSkipped: false,
                  },
                ],
              }}
              options={chartDefaults as any}
            />
          </div>
        </div>

        {/* Net savings line chart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-1">Monthly Net Savings</h3>
          <p className="text-white/40 text-xs mb-4">Positive = saving · Negative = deficit</p>
          <div className="h-48">
            <Line
              data={{
                labels: monthLabels,
                datasets: [{
                  label: 'Net Savings',
                  data: savingsData,
                  borderColor: 'rgba(167,139,250,0.9)',
                  backgroundColor: 'rgba(139,92,246,0.15)',
                  borderWidth: 2.5,
                  pointBackgroundColor: 'rgba(167,139,250,1)',
                  pointRadius: 4,
                  fill: true,
                  tension: 0.4,
                }],
              }}
              options={{
                ...chartDefaults,
                scales: {
                  ...chartDefaults.scales,
                  y: {
                    ...chartDefaults.scales.y,
                    ticks: {
                      color: 'rgba(255,255,255,0.5)',
                      callback: (v: any) => `K${(v / 1000).toFixed(0)}k`,
                    },
                  },
                },
              } as any}
            />
          </div>
        </div>

        {/* Category breakdown */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Doughnut */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-1">Spending by Category</h3>
            <p className="text-white/40 text-xs mb-4">Last {period}</p>
            {catEntries.length > 0 ? (
              <div className="h-56 flex items-center justify-center">
                <Doughnut
                  data={{
                    labels: catEntries.map(([k]) => k),
                    datasets: [{
                      data: catEntries.map(([, v]) => v),
                      backgroundColor: catEntries.map(([k]) => CATEGORY_COLORS[k] || 'rgba(148,163,184,0.85)'),
                      borderColor: 'rgba(255,255,255,0.05)',
                      borderWidth: 2,
                      hoverOffset: 8,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '65%',
                    plugins: {
                      legend: { position: 'bottom', labels: { color: 'rgba(255,255,255,0.6)', boxWidth: 12, padding: 12, font: { size: 11 } } },
                      tooltip: chartDefaults.plugins.tooltip,
                    },
                  } as any}
                />
              </div>
            ) : (
              <div className="h-56 flex items-center justify-center">
                <p className="text-white/30 text-sm">No expense data</p>
              </div>
            )}
          </div>

          {/* Category list */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-1">Category Breakdown</h3>
            <p className="text-white/40 text-xs mb-4">% of total spending</p>
            <div className="space-y-3">
              {catEntries.slice(0, 6).map(([cat, amount]) => {
                const pct = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
                return (
                  <div key={cat}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white/70 text-sm capitalize">{cat}</span>
                      <div className="text-right">
                        <span className="text-white font-semibold text-sm">
                          K{amount.toLocaleString('en', { maximumFractionDigits: 0 })}
                        </span>
                        <span className="text-white/40 text-xs ml-2">{pct.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: CATEGORY_COLORS[cat] || 'rgba(148,163,184,0.85)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Inflation impact box */}
        <div className="bg-gradient-to-r from-red-500/15 to-orange-500/15 border border-red-400/25 rounded-2xl p-6">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            Inflation Impact Forecast
          </h3>
          <p className="text-white/60 text-sm mb-4">
            At 28.7% annual inflation, your average monthly expense of{' '}
            <strong className="text-white">K{avgMonthlyExpense.toLocaleString('en', { maximumFractionDigits: 0 })}</strong>{' '}
            will grow to:
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'In 3 months', multiplier: 1 + (0.287 / 12) * 3 },
              { label: 'In 6 months', multiplier: 1 + (0.287 / 12) * 6 },
              { label: 'In 12 months', multiplier: 1 + 0.287 },
            ].map(({ label, multiplier }) => (
              <div key={label} className="bg-black/20 rounded-xl p-3 text-center">
                <p className="text-orange-400 font-bold text-lg">
                  K{(avgMonthlyExpense * multiplier).toLocaleString('en', { maximumFractionDigits: 0 })}
                </p>
                <p className="text-white/40 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsWithGuard() {
  return <AuthGuard><AnalyticsPage /></AuthGuard>;
}