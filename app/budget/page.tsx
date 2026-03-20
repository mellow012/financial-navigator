'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/Context/AuthContext';
import { db } from '@/lib/firebase';
import {
  collection, getDocs, doc, setDoc, getDoc, query, where
} from 'firebase/firestore';
import {
  PieChart, ArrowLeft, DollarSign, Edit2, Save,
  AlertCircle, CheckCircle, TrendingUp, Target
} from 'lucide-react';
import Link from 'next/link';
import AuthGuard from '@/app/components/AuthGuard';

interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  limit: number;
  spent: number;
  color: string;
}

const DEFAULT_BUDGETS: Omit<BudgetCategory, 'limit' | 'spent'>[] = [
  { id: 'food',          name: 'Food & Groceries', icon: '🍔', color: 'orange'  },
  { id: 'transport',     name: 'Transport',         icon: '🚗', color: 'blue'    },
  { id: 'utilities',     name: 'Utilities',         icon: '💡', color: 'yellow'  },
  { id: 'fuel',          name: 'Fuel',              icon: '⛽', color: 'red'     },
  { id: 'health',        name: 'Health',            icon: '🏥', color: 'green'   },
  { id: 'entertainment', name: 'Entertainment',     icon: '🎬', color: 'purple'  },
  { id: 'household',     name: 'Household',         icon: '🏠', color: 'indigo'  },
  { id: 'other',         name: 'Other',             icon: '📦', color: 'gray'    },
];

const barColor: Record<string, string> = {
  orange:'bg-orange-500', blue:'bg-blue-500', yellow:'bg-yellow-500',
  red:'bg-red-500', green:'bg-green-500', purple:'bg-purple-500',
  indigo:'bg-indigo-500', gray:'bg-gray-500',
};

function BudgetPage() {
  const { user } = useAuth();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [tempIncome, setTempIncome]       = useState('');
  const [budgets, setBudgets]   = useState<BudgetCategory[]>([]);

  useEffect(() => { if (user) fetchData(); }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      const income = userSnap.data()?.monthlyIncome || 0;
      setMonthlyIncome(income);
      setTempIncome(income.toString());

      const budgetSnap = await getDoc(doc(db, 'users', user.uid, 'settings', 'budget'));
      const savedLimits = budgetSnap.data() || {};

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const txSnap = await getDocs(
        query(
          collection(db, 'users', user.uid, 'transactions'),
          where('date', '>=', startOfMonth),
          where('type', '==', 'expense'),
        )
      );

      const spending: Record<string, number> = {};
      txSnap.docs.forEach(d => {
        const { category, amount } = d.data();
        spending[category] = (spending[category] || 0) + Math.abs(amount);
      });

      setBudgets(DEFAULT_BUDGETS.map(cat => ({
        ...cat,
        limit: savedLimits[cat.id] || 0,
        spent: spending[cat.id] || 0,
      })));
    } finally {
      setLoading(false);
    }
  };

  const saveBudgets = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid), { monthlyIncome: parseFloat(tempIncome) || 0 }, { merge: true });
      const limits: Record<string, number> = {};
      budgets.forEach(b => { limits[b.id] = b.limit; });
      await setDoc(doc(db, 'users', user.uid, 'settings', 'budget'), limits);
      setMonthlyIncome(parseFloat(tempIncome) || 0);
      setEditMode(false);
    } finally {
      setSaving(false);
    }
  };

  const updateLimit = (id: string, v: string) =>
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, limit: parseFloat(v) || 0 } : b));

  const pct = (spent: number, limit: number) => limit === 0 ? 0 : Math.min((spent / limit) * 100, 100);
  const statusBar = (spent: number, limit: number) => {
    if (limit === 0) return 'bg-gray-500';
    const p = (spent / limit) * 100;
    return p >= 100 ? 'bg-red-500' : p >= 80 ? 'bg-yellow-500' : 'bg-emerald-500';
  };

  const totalBudgeted = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent    = budgets.reduce((s, b) => s + b.spent, 0);
  const remaining     = monthlyIncome - totalBudgeted;

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
      <div className="text-white text-lg">Loading budget…</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-all">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <PieChart className="w-5 h-5 text-orange-400" />
            <h2 className="text-xl font-bold text-white">Budget Planner</h2>
          </div>
          <button
            onClick={() => editMode ? saveBudgets() : setEditMode(true)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 rounded-xl transition-all text-sm disabled:opacity-60"
          >
            {editMode
              ? <><Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save'}</>
              : <><Edit2 className="w-4 h-4" />Edit Budget</>
            }
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Overview */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-white/50 text-sm">Monthly Income</span>
            </div>
            {editMode ? (
              <input
                type="number"
                value={tempIncome}
                onChange={e => setTempIncome(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            ) : (
              <p className="text-2xl font-bold text-white">K{monthlyIncome.toLocaleString()}</p>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-sky-400" />
              <span className="text-white/50 text-sm">Total Budgeted</span>
            </div>
            <p className="text-2xl font-bold text-white">K{totalBudgeted.toLocaleString()}</p>
            <p className="text-white/40 text-xs mt-1">
              {monthlyIncome > 0 ? `${((totalBudgeted / monthlyIncome) * 100).toFixed(0)}% of income` : 'Set income above'}
            </p>
          </div>

          <div className={`border rounded-xl p-5 ${remaining >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-orange-400" />
              <span className="text-white/50 text-sm">Remaining</span>
            </div>
            <p className={`text-2xl font-bold ${remaining >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              K{Math.abs(remaining).toLocaleString()}
            </p>
            <p className="text-white/40 text-xs mt-1">{remaining < 0 ? 'Over-budgeted!' : 'For savings'}</p>
          </div>
        </div>

        {/* Overall progress */}
        {totalSpent > 0 && totalBudgeted > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6">
            <div className="flex justify-between items-center mb-2">
              <p className="text-white font-semibold">This Month's Overall</p>
              <span className="text-white/50 text-sm">K{totalSpent.toLocaleString()} / K{totalBudgeted.toLocaleString()}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${statusBar(totalSpent, totalBudgeted)}`}
                style={{ width: `${pct(totalSpent, totalBudgeted)}%` }}
              />
            </div>
            <p className="text-white/40 text-xs mt-1.5">{pct(totalSpent, totalBudgeted).toFixed(1)}% of budget used</p>
          </div>
        )}

        {/* Category budgets */}
        <div className="space-y-3">
          {budgets.map(b => (
            <div key={b.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/8 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{b.icon}</span>
                  <div className="flex-1">
                    <p className="text-white font-medium">{b.name}</p>
                    {editMode ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-white/40 text-sm">K</span>
                        <input
                          type="number"
                          value={b.limit || ''}
                          onChange={e => updateLimit(b.id, e.target.value)}
                          placeholder="Set limit"
                          className="w-32 px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    ) : (
                      <p className="text-white/40 text-sm mt-0.5">
                        Budget: K{b.limit.toLocaleString()} · Spent: K{b.spent.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
                {!editMode && b.limit > 0 && (
                  <div className="text-right ml-4">
                    <p className={`text-lg font-bold ${b.spent >= b.limit ? 'text-red-400' : 'text-white'}`}>
                      K{(b.limit - b.spent).toLocaleString()}
                    </p>
                    <p className="text-white/40 text-xs">left</p>
                  </div>
                )}
              </div>

              {!editMode && b.limit > 0 && (
                <>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-1.5">
                    <div
                      className={`h-2 rounded-full transition-all ${statusBar(b.spent, b.limit)}`}
                      style={{ width: `${pct(b.spent, b.limit)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/40">{pct(b.spent, b.limit).toFixed(0)}% used</span>
                    {b.spent >= b.limit && <span className="text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Over budget!</span>}
                    {b.spent >= b.limit * 0.8 && b.spent < b.limit && <span className="text-yellow-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Near limit</span>}
                    {b.spent < b.limit * 0.8 && b.spent > 0 && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" />On track</span>}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Tips */}
        {!editMode && (
          <div className="mt-6 bg-gradient-to-r from-blue-500/15 to-cyan-500/15 border border-blue-400/30 rounded-xl p-5">
            <p className="text-white font-semibold mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-400" /> Budgeting Tips for Malawi
            </p>
            <ul className="space-y-1.5 text-sm text-white/70">
              <li>• With 28.7% inflation, revisit your budget limits monthly</li>
              <li>• Aim for the 50/30/20 rule: 50% needs, 30% wants, 20% savings</li>
              <li>• Build a 3-month emergency fund before discretionary spending</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BudgetWithGuard() {
  return <AuthGuard><BudgetPage /></AuthGuard>;
}