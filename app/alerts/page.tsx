'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/Context/AuthContext';
import { PriceAlert } from '@/types/finance';
import { toast } from '@/app/components/Toaster';
import {
  collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  ArrowLeft, Bell, BellOff, Plus, Trash2, AlertTriangle, CheckCircle,
  TrendingUp, TrendingDown, RefreshCw, X, ToggleLeft, ToggleRight
} from 'lucide-react';
import Link from 'next/link';

const ITEMS = [
  'Maize Flour', 'Rice', 'Cooking Oil', 'Sugar', 'Tomatoes', 'Bread',
  'Petrol', 'Diesel', 'Electricity', 'Water', 'Other'
];

const CATEGORIES: Record<string, string> = {
  'Maize Flour': 'food', 'Rice': 'food', 'Cooking Oil': 'food',
  'Sugar': 'food', 'Tomatoes': 'food', 'Bread': 'food',
  'Petrol': 'fuel', 'Diesel': 'fuel',
  'Electricity': 'utilities', 'Water': 'utilities', 'Other': 'other'
};

const ITEM_EMOJI: Record<string, string> = {
  'Maize Flour': '🌽', 'Rice': '🍚', 'Cooking Oil': '🫗',
  'Sugar': '🍬', 'Tomatoes': '🍅', 'Bread': '🍞',
  'Petrol': '⛽', 'Diesel': '🛢️', 'Electricity': '⚡',
  'Water': '💧', 'Other': '📦'
};

const EMPTY_FORM = {
  item: 'Maize Flour',
  targetPrice: '',
  direction: 'below' as 'above' | 'below',
  notifyViaSMS: false,
  phoneNumber: '',
};

export default function Alerts() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchAlerts();
  }, [user]);

  const fetchAlerts = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const ref = collection(db, 'users', user.uid, 'alerts');
      const snap = await getDocs(query(ref, orderBy('createdAt', 'desc')));
      setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() } as PriceAlert)));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async () => {
    if (!user || !form.targetPrice) return;
    setSaving(true);
    try {
      const newAlert: Omit<PriceAlert, 'id'> = {
        uid: user.uid,
        item: form.item,
        category: CATEGORIES[form.item] || 'other',
        targetPrice: parseFloat(form.targetPrice),
        currentPrice: 0,
        direction: form.direction,
        active: true,
        triggered: false,
        createdAt: new Date().toISOString(),
        notifyViaSMS: form.notifyViaSMS,
        phoneNumber: form.notifyViaSMS ? form.phoneNumber : undefined,
      };
      const ref = await addDoc(collection(db, 'users', user.uid, 'alerts'), newAlert);
      setAlerts(prev => [{ id: ref.id, ...newAlert }, ...prev]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err) {
      console.error(err);
      alert('Failed to create alert.');
    } finally {
      setSaving(false);
    }
  };

  const toggleAlert = async (alert: PriceAlert) => {
    try {
      await updateDoc(doc(db, 'users', user!.uid, 'alerts', alert.id), { active: !alert.active });
      setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, active: !a.active } : a));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAlert = async (id: string) => {
    if (!user || !confirm('Delete this alert?')) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'alerts', id));
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  const active = alerts.filter(a => a.active).length;
  const triggered = alerts.filter(a => a.triggered).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-all">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <Bell className="w-6 h-6 text-yellow-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Price Alerts</h2>
              <p className="text-white/40 text-xs">{active} active · {triggered} triggered</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/40 text-yellow-300 rounded-xl transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> New Alert
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* How it works */}
        <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sky-300 font-medium text-sm">How Price Alerts Work</p>
              <p className="text-white/60 text-xs mt-1 leading-relaxed">
                Set a target price for any item. When our market data shows the price hits your target, 
                the alert triggers. You can also get SMS notifications (requires valid phone number).
              </p>
            </div>
          </div>
        </div>

        {/* Alerts list */}
        {alerts.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <BellOff className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">No Price Alerts Yet</p>
            <p className="text-white/50 text-sm mb-4">
              Create alerts to track when essentials like maize or fuel reach your target price.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-5 py-2.5 bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 rounded-xl text-sm"
            >
              + Create First Alert
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`border rounded-xl p-4 transition-all ${
                  alert.triggered
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : alert.active
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white/3 border-white/5 opacity-60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{ITEM_EMOJI[alert.item] || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-semibold">{alert.item}</span>
                      {alert.triggered && (
                        <span className="text-xs bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Triggered
                        </span>
                      )}
                      {!alert.active && !alert.triggered && (
                        <span className="text-xs bg-white/10 text-white/40 px-2 py-0.5 rounded-full">Paused</span>
                      )}
                    </div>
                    <p className="text-white/60 text-sm">
                      Alert when price goes{' '}
                      <span className={`font-semibold ${alert.direction === 'below' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {alert.direction === 'below' ? '↓ below' : '↑ above'}
                      </span>{' '}
                      <span className="text-white font-semibold">K{alert.targetPrice.toLocaleString()}</span>
                    </p>
                    {alert.notifyViaSMS && (
                      <p className="text-white/40 text-xs mt-0.5">📱 SMS to {alert.phoneNumber}</p>
                    )}
                    <p className="text-white/30 text-xs mt-0.5">
                      Created {alert.createdAt?.slice(0, 10)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleAlert(alert)}
                      className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                      title={alert.active ? 'Pause alert' : 'Enable alert'}
                    >
                      {alert.active
                        ? <ToggleRight className="w-5 h-5 text-emerald-400" />
                        : <ToggleLeft className="w-5 h-5 text-white/30" />
                      }
                    </button>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      disabled={deleting === alert.id}
                      className="p-1.5 hover:bg-red-500/20 rounded-lg transition-all text-white/30 hover:text-red-400"
                    >
                      {deleting === alert.id
                        ? <RefreshCw className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Alert Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-md bg-gradient-to-br from-indigo-900/95 to-purple-900/95 border border-white/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-white font-bold text-lg">New Price Alert</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-all">
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Item</label>
                <select
                  value={form.item}
                  onChange={e => setForm(f => ({ ...f, item: e.target.value }))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {ITEMS.map(item => (
                    <option key={item} value={item} className="bg-indigo-950">{item}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Alert Direction</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['below', 'above'] as const).map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, direction: d }))}
                      className={`py-2.5 rounded-xl border transition-all text-sm flex items-center justify-center gap-1.5 ${
                        form.direction === d
                          ? d === 'below' ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-red-500/20 border-red-500/40 text-red-300'
                          : 'bg-white/5 border-white/10 text-white/60'
                      }`}
                    >
                      {d === 'below' ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                      Price goes {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white/70 text-sm mb-2">Target Price (K)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 font-semibold">K</span>
                  <input
                    type="number"
                    value={form.targetPrice}
                    onChange={e => setForm(f => ({ ...f, targetPrice: e.target.value }))}
                    placeholder="0"
                    className="w-full pl-8 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.notifyViaSMS}
                    onChange={e => setForm(f => ({ ...f, notifyViaSMS: e.target.checked }))}
                    className="w-4 h-4 rounded accent-purple-500"
                  />
                  <span className="text-white/70 text-sm">Notify via SMS (Airtel/TNM)</span>
                </label>
                {form.notifyViaSMS && (
                  <input
                    type="tel"
                    value={form.phoneNumber}
                    onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))}
                    placeholder="+265 999 123 456"
                    className="mt-2 w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                )}
              </div>

              <button
                onClick={createAlert}
                disabled={saving || !form.targetPrice}
                className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-xl disabled:opacity-50 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5" />}
                {saving ? 'Creating…' : 'Create Alert'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}