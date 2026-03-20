'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/Context/AuthContext';
import {
  TrendingDown, TrendingUp, DollarSign, PieChart, Wallet,
  Target, AlertCircle, Receipt, BarChart3, Lightbulb,
  ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import Link from 'next/link';
import { doc, getDoc, collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Transaction } from '@/types/finance';

const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍔', fuel: '⛽', utilities: '💡', transport: '🚗',
  health: '🏥', entertainment: '🎬', household: '🏠', income: '💰', other: '📦',
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [prevMonthExpense, setPrevMonthExpense] = useState(0);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (user) loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      // User profile
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      if (userSnap.exists()) {
        const d = userSnap.data();
        setUserName(d.fullName || d.name || user.email || '');
      }

      // Recent transactions (last 5)
      const recentSnap = await getDocs(
        query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc'), limit(5))
      );
      setRecentTransactions(recentSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));

      // Current month transactions
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthSnap = await getDocs(
        query(collection(db, 'users', user.uid, 'transactions'), where('date', '>=', startOfMonth))
      );
      const monthTxs: Transaction[] = monthSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      setAllTransactions(monthTxs);

      // Previous month for comparison
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
      const prevSnap = await getDocs(
        query(
          collection(db, 'users', user.uid, 'transactions'),
          where('date', '>=', startOfPrevMonth),
          where('date', '<=', endOfPrevMonth),
          where('type', '==', 'expense')
        )
      );
      const prevExpense = prevSnap.docs.reduce((s, d) => s + Math.abs(d.data().amount), 0);
      setPrevMonthExpense(prevExpense);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setDataLoading(false);
    }
  };

  const stats = useMemo(() => {
    const expense = allTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
    const income = allTransactions.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
    const savings = income - expense;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    // Month-over-month expense change
    const expenseChange = prevMonthExpense > 0
      ? ((expense - prevMonthExpense) / prevMonthExpense) * 100
      : null;

    // Top category
    const cats: Record<string, number> = {};
    allTransactions.filter(t => t.type === 'expense').forEach(t => {
      cats[t.category] = (cats[t.category] || 0) + Math.abs(t.amount);
    });
    const topCat = Object.entries(cats).sort(([, a], [, b]) => b - a)[0];

    return { expense, income, savings, savingsRate, expenseChange, topCat };
  }, [allTransactions, prevMonthExpense]);

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard…</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="bg-gradient-to-r from-yellow-400/20 to-orange-500/20 border border-yellow-400/30 rounded-2xl p-6 mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">
            Welcome back, {userName.split(' ')[0] || 'there'}! 👋
          </h1>
          <p className="text-white/60">Here's your financial snapshot for this month.</p>
        </div>

        {/* Main Stats */}
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/8 transition-all">
            <div className="w-11 h-11 bg-red-500/20 rounded-xl flex items-center justify-center mb-3">
              <TrendingDown className="w-5 h-5 text-red-400" />
            </div>
            <p className="text-white/50 text-sm mb-1">Month Expenses</p>
            <p className="text-3xl font-bold text-white">K{stats.expense.toLocaleString('en', { maximumFractionDigits: 0 })}</p>
            {stats.expenseChange !== null && (
              <div className={`flex items-center mt-2 text-sm ${stats.expenseChange > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {stats.expenseChange > 0
                  ? <ArrowUpRight className="w-4 h-4 mr-1" />
                  : <ArrowDownRight className="w-4 h-4 mr-1" />
                }
                <span>{Math.abs(stats.expenseChange).toFixed(1)}% vs last month</span>
              </div>
            )}
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/8 transition-all">
            <div className="w-11 h-11 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-white/50 text-sm mb-1">Month Income</p>
            <p className="text-3xl font-bold text-white">K{stats.income.toLocaleString('en', { maximumFractionDigits: 0 })}</p>
            <div className="flex items-center mt-2 text-sm text-white/40">
              <span>{allTransactions.filter(t => t.type === 'income').length} income entries</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/8 transition-all">
            <div className="w-11 h-11 bg-purple-500/20 rounded-xl flex items-center justify-center mb-3">
              <Wallet className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-white/50 text-sm mb-1">Net Savings</p>
            <p className={`text-3xl font-bold ${stats.savings >= 0 ? 'text-white' : 'text-red-400'}`}>
              {stats.savings >= 0 ? '' : '-'}K{Math.abs(stats.savings).toLocaleString('en', { maximumFractionDigits: 0 })}
            </p>
            <div className="flex items-center mt-2 text-sm text-purple-400">
              <span>{stats.savingsRate.toFixed(1)}% savings rate</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          <Link href="/logger" className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur border border-purple-400/30 rounded-xl p-5 hover:from-purple-500/30 hover:to-pink-500/30 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-purple-300" />
                <h3 className="text-white font-semibold">Log Transaction</h3>
              </div>
              <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-all" />
            </div>
            <p className="text-white/60 text-sm mb-2">Snap a receipt or enter manually</p>
            <p className="text-purple-300 text-sm">{allTransactions.length} logged this month</p>
          </Link>

          <Link href="/analytics" className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-white font-semibold">Analytics</h3>
              </div>
              <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-all" />
            </div>
            <p className="text-white/60 text-sm mb-2">Charts & spending trends</p>
            <p className="text-cyan-400 text-sm">📊 Income vs expense over time</p>
          </Link>

          <Link href="/budget" className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-orange-400" />
                <h3 className="text-white font-semibold">Budget Planner</h3>
              </div>
              <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-all" />
            </div>
            <p className="text-white/60 text-sm mb-2">Set spending limits by category</p>
            {stats.topCat && (
              <p className="text-orange-400 text-sm">
                Top spend: {CATEGORY_EMOJI[stats.topCat[0]]} {stats.topCat[0]} (K{stats.topCat[1].toLocaleString('en', { maximumFractionDigits: 0 })})
              </p>
            )}
          </Link>

          <Link href="/savings" className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                <h3 className="text-white font-semibold">Savings Goals</h3>
              </div>
              <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-all" />
            </div>
            <p className="text-white/60 text-sm mb-2">Track goals & deposits</p>
            <p className="text-purple-400 text-sm">🎯 School fees, emergency fund…</p>
          </Link>

          <Link href="/advisor" className="bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur border border-violet-400/30 rounded-xl p-5 hover:from-violet-500/30 hover:to-purple-500/30 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-violet-300" />
                <h3 className="text-white font-semibold">AI Advisor</h3>
              </div>
              <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-all" />
            </div>
            <p className="text-white/60 text-sm mb-2">Personalized financial advice</p>
            <p className="text-violet-300 text-sm">✨ Powered by Claude AI</p>
          </Link>

          <Link href="/insights" className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Market Insights</h3>
              </div>
              <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-all" />
            </div>
            <p className="text-white/60 text-sm mb-2">Live Malawi market prices</p>
            <p className="text-yellow-400 text-sm">📈 AI-powered price data</p>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Recent Transactions</h3>
              <Link href="/transactions" className="text-sm text-sky-400 hover:text-sky-300 transition-all">View All</Link>
            </div>
            <div className="space-y-2">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-white/40 text-sm">No transactions yet.</p>
                  <Link href="/logger" className="text-purple-400 text-sm hover:text-purple-300">Log your first →</Link>
                </div>
              ) : (
                recentTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0 ${tx.type === 'income' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                      {CATEGORY_EMOJI[tx.category] || '📦'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{tx.description || tx.category}</p>
                      <p className="text-white/40 text-xs">{tx.date?.slice(0, 10)}</p>
                    </div>
                    <p className={`font-semibold text-sm flex-shrink-0 ${tx.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tx.type === 'income' ? '+' : '-'}K{Math.abs(tx.amount).toLocaleString('en', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Savings health */}
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white font-semibold">Financial Health</h3>
            </div>
            <div className="space-y-3">
              {/* Savings rate bar */}
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-white/60">Savings Rate</span>
                  <span className={`font-semibold ${stats.savingsRate >= 20 ? 'text-emerald-400' : stats.savingsRate >= 10 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {stats.savingsRate.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${stats.savingsRate >= 20 ? 'bg-emerald-500' : stats.savingsRate >= 10 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(100, Math.max(0, stats.savingsRate))}%` }}
                  />
                </div>
                <p className="text-white/30 text-xs mt-1">Target: 20%</p>
              </div>

              {/* Inflation impact */}
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
                <p className="text-orange-300 font-medium text-sm mb-1">⚠️ Inflation Impact</p>
                <p className="text-white/60 text-xs leading-relaxed">
                  At 28.7% annual inflation, your K{stats.expense.toLocaleString('en', { maximumFractionDigits: 0 })} monthly expenses 
                  could cost K{(stats.expense * 1.287).toLocaleString('en', { maximumFractionDigits: 0 })} in 12 months.
                </p>
              </div>

              {/* Quick status */}
              {stats.savings < 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <p className="text-red-300 text-sm">🔴 Spending exceeds income by K{Math.abs(stats.savings).toLocaleString('en', { maximumFractionDigits: 0 })}</p>
                </div>
              )}
              {stats.savings >= 0 && stats.savingsRate >= 20 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                  <p className="text-emerald-300 text-sm">🟢 Excellent savings rate! Keep it up.</p>
                </div>
              )}
              {stats.savings >= 0 && stats.savingsRate < 20 && stats.savingsRate >= 10 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                  <p className="text-yellow-300 text-sm">🟡 Good progress. Aim for 20% savings.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}