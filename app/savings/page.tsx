'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/Context/AuthContext';
import { db } from '@/lib/firebase';
import { toast } from '@/app/components/Toaster';
import {
  collection, getDocs, addDoc, deleteDoc, doc,
  updateDoc, query, orderBy, getDoc, setDoc
} from 'firebase/firestore';
import {
  ArrowLeft, Target, Plus, Trash2, RefreshCw, TrendingUp,
  CheckCircle, Edit2, X, Save, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import AuthGuard from '@/app/components/AuthGuard';

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  color: string;
  emoji: string;
  createdAt: string;
  completed: boolean;
}

const COLORS = ['purple', 'blue', 'emerald', 'amber', 'pink', 'cyan', 'orange', 'rose'];
const EMOJIS = ['🏠', '🚗', '✈️', '📱', '🎓', '💍', '🏥', '💰', '🌱', '🎯'];

const colorMap: Record<string, string> = {
  purple: 'from-purple-500 to-violet-600',
  blue:   'from-blue-500 to-cyan-600',
  emerald:'from-emerald-500 to-teal-600',
  amber:  'from-amber-500 to-yellow-600',
  pink:   'from-pink-500 to-rose-600',
  cyan:   'from-cyan-500 to-sky-600',
  orange: 'from-orange-500 to-amber-600',
  rose:   'from-rose-500 to-pink-600',
};

const bgMap: Record<string, string> = {
  purple: 'bg-purple-500',
  blue:   'bg-blue-500',
  emerald:'bg-emerald-500',
  amber:  'bg-amber-500',
  pink:   'bg-pink-500',
  cyan:   'bg-cyan-500',
  orange: 'bg-orange-500',
  rose:   'bg-rose-500',
};

const BLANK_FORM = {
  name: '',
  targetAmount: '',
  currentAmount: '0',
  deadline: '',
  color: 'purple',
  emoji: '🎯',
};

function SavingsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  // Total saved vs total targets
  const totalSaved  = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const completed   = goals.filter(g => g.completed || g.currentAmount >= g.targetAmount).length;

  useEffect(() => { if (user) fetchGoals(); }, [user]);

  const fetchGoals = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const ref = collection(db, 'users', user.uid, 'savingsGoals');
      const snap = await getDocs(query(ref, orderBy('createdAt', 'desc')));
      setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() } as SavingsGoal)));
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (goal: SavingsGoal) => {
    setForm({
      name:          goal.name,
      targetAmount:  goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      deadline:      goal.deadline || '',
      color:         goal.color,
      emoji:         goal.emoji,
    });
    setEditId(goal.id);
    setShowForm(true);
  };

  const saveGoal = async () => {
    if (!user || !form.name || !form.targetAmount) return;
    setSaving(true);
    try {
      const data = {
        name:          form.name,
        targetAmount:  parseFloat(form.targetAmount),
        currentAmount: parseFloat(form.currentAmount) || 0,
        deadline:      form.deadline || undefined,
        color:         form.color,
        emoji:         form.emoji,
        completed:     false,
        createdAt:     new Date().toISOString(),
        uid:           user.uid,
      };

      if (editId) {
        await updateDoc(doc(db, 'users', user.uid, 'savingsGoals', editId), data);
        setGoals(prev => prev.map(g => g.id === editId ? { ...g, ...data } : g));
      } else {
        const ref = await addDoc(collection(db, 'users', user.uid, 'savingsGoals'), data);
        setGoals(prev => [{ id: ref.id, ...data }, ...prev]);
      }
      setShowForm(false);
      setEditId(null);
      setForm(BLANK_FORM);
    } finally {
      setSaving(false);
    }
  };

  const deleteGoal = async (id: string) => {
    if (!user) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'savingsGoals', id));
      setGoals(prev => prev.filter(g => g.id !== id));
      toast.success('Goal deleted.');
    } catch {
      toast.error('Failed to delete goal.');
    } finally {
      setDeleting(null);
    }
  };

  const addDeposit = async () => {
    if (!user || !depositGoalId || !depositAmount) return;
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;
    const goal = goals.find(g => g.id === depositGoalId)!;
    const newAmount = goal.currentAmount + amount;
    const completed = newAmount >= goal.targetAmount;
    await updateDoc(doc(db, 'users', user.uid, 'savingsGoals', depositGoalId), { currentAmount: newAmount, completed });
    setGoals(prev => prev.map(g => g.id === depositGoalId ? { ...g, currentAmount: newAmount, completed } : g));
    setDepositGoalId(null);
    setDepositAmount('');
  };

  const daysLeft = (deadline?: string) => {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000);
    return diff;
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
      <RefreshCw className="w-8 h-8 text-white animate-spin" />
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
            <Target className="w-6 h-6 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Savings Goals</h2>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditId(null); setForm(BLANK_FORM); }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 rounded-xl transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> New Goal
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Summary */}
        {goals.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-white">{goals.length}</p>
              <p className="text-white/50 text-sm mt-1">Total Goals</p>
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-emerald-400">K{totalSaved.toLocaleString('en', { maximumFractionDigits: 0 })}</p>
              <p className="text-white/50 text-sm mt-1">Total Saved</p>
            </div>
            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 text-center">
              <p className="text-3xl font-bold text-purple-400">{completed}</p>
              <p className="text-white/50 text-sm mt-1">Completed</p>
            </div>
          </div>
        )}

        {/* Goals */}
        {goals.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-14 text-center">
            <Target className="w-14 h-14 text-white/20 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">No Savings Goals Yet</h3>
            <p className="text-white/50 text-sm mb-6">Set a goal — whether it's a new phone, emergency fund, or school fees.</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:scale-105 transition-all"
            >
              <Sparkles className="w-4 h-4 inline mr-2" /> Create First Goal
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {goals.map(goal => {
              const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
              const isComplete = goal.currentAmount >= goal.targetAmount;
              const days = daysLeft(goal.deadline);
              return (
                <div key={goal.id} className={`bg-white/5 border rounded-2xl p-5 transition-all ${isComplete ? 'border-emerald-500/40' : 'border-white/10 hover:border-white/20'}`}>
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colorMap[goal.color] || colorMap.purple} flex items-center justify-center text-xl shadow-lg`}>
                        {goal.emoji}
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">{goal.name}</h3>
                        {isComplete && (
                          <span className="text-xs text-emerald-400 flex items-center gap-1 mt-0.5">
                            <CheckCircle className="w-3 h-3" /> Completed!
                          </span>
                        )}
                        {!isComplete && days !== null && (
                          <p className={`text-xs mt-0.5 ${days < 0 ? 'text-red-400' : days < 30 ? 'text-amber-400' : 'text-white/40'}`}>
                            {days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(goal)} className="p-1.5 hover:bg-white/10 rounded-lg transition-all text-white/40 hover:text-white">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        disabled={deleting === goal.id}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg transition-all text-white/40 hover:text-red-400"
                      >
                        {deleting === goal.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-white font-semibold">K{goal.currentAmount.toLocaleString('en', { maximumFractionDigits: 0 })}</span>
                      <span className="text-white/40">of K{goal.targetAmount.toLocaleString('en', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${isComplete ? 'from-emerald-500 to-teal-500' : colorMap[goal.color] || colorMap.purple}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-white/40 text-xs mt-1">{pct.toFixed(0)}% complete</p>
                  </div>

                  {/* Deposit button */}
                  {!isComplete && (
                    depositGoalId === goal.id ? (
                      <div className="flex gap-2 mt-3">
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40 text-sm">K</span>
                          <input
                            type="number"
                            value={depositAmount}
                            onChange={e => setDepositAmount(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addDeposit()}
                            placeholder="Amount"
                            autoFocus
                            className="w-full pl-7 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <button onClick={addDeposit} className="px-3 py-2 bg-emerald-500/30 hover:bg-emerald-500/50 text-emerald-300 rounded-lg text-sm transition-all">Add</button>
                        <button onClick={() => { setDepositGoalId(null); setDepositAmount(''); }} className="px-2 py-2 hover:bg-white/10 text-white/40 rounded-lg transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDepositGoalId(goal.id)}
                        className={`mt-3 w-full py-2 rounded-xl text-sm font-medium border transition-all bg-gradient-to-r ${colorMap[goal.color]} bg-opacity-20 border-white/10 text-white/70 hover:text-white hover:bg-white/10`}
                      >
                        + Add Money
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-md bg-gradient-to-br from-indigo-900/95 to-purple-900/95 border border-white/20 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">{editId ? 'Edit Goal' : 'New Savings Goal'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-all">
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Emoji picker */}
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wide mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => setForm(f => ({ ...f, emoji: e }))}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${form.emoji === e ? 'bg-purple-500/40 ring-2 ring-purple-500' : 'bg-white/5 hover:bg-white/10'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wide mb-2">Goal Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Emergency Fund"
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/60 text-xs uppercase tracking-wide mb-2">Target (K)</label>
                  <input
                    type="number"
                    value={form.targetAmount}
                    onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
                    placeholder="100000"
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-xs uppercase tracking-wide mb-2">Saved So Far (K)</label>
                  <input
                    type="number"
                    value={form.currentAmount}
                    onChange={e => setForm(f => ({ ...f, currentAmount: e.target.value }))}
                    placeholder="0"
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wide mb-2">Deadline (optional)</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [color-scheme:dark]"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-white/60 text-xs uppercase tracking-wide mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${colorMap[c]} transition-all ${form.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-transparent scale-110' : ''}`}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={saveGoal}
                disabled={saving || !form.name || !form.targetAmount}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl disabled:opacity-50 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saving ? 'Saving…' : editId ? 'Update Goal' : 'Create Goal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SavingsWithGuard() {
  return <AuthGuard><SavingsPage /></AuthGuard>;
}