'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/Context/AuthContext';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import {
  ArrowLeft, Settings, User, Bell, Globe, Shield,
  Save, RefreshCw, CheckCircle, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import Link from 'next/link';
import AuthGuard from '@/app/components/AuthGuard';

function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Profile fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [currency] = useState('MWK');

  // Password change
  const [showPwSection, setShowPwSection] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const d = snap.data();
        setName(d.name || user.displayName || '');
        setPhone(d.phone || '');
        setMonthlyIncome(d.monthlyIncome?.toString() || '');
      }
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name,
        phone,
        monthlyIncome: parseFloat(monthlyIncome) || 0,
      });
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (!user || !auth.currentUser || !currentPw || !newPw) return;
    if (newPw.length < 6) { setPwError('New password must be at least 6 characters.'); return; }
    setPwSaving(true);
    setPwError('');
    try {
      const cred = EmailAuthProvider.credential(user.email!, currentPw);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, newPw);
      setCurrentPw(''); setNewPw('');
      setShowPwSection(false);
      setPwSaved(true);
      setTimeout(() => setPwSaved(false), 4000);
    } catch (e: any) {
      setPwError(
        e.code === 'auth/wrong-password'
          ? 'Current password is incorrect.'
          : e.message || 'Failed to change password.'
      );
    } finally {
      setPwSaving(false);
    }
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
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-all">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <Settings className="w-5 h-5 text-white/60" />
            <h2 className="text-xl font-bold text-white">Settings</h2>
          </div>
          {saved && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <CheckCircle className="w-4 h-4" /> Saved!
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        {/* Profile */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-5 h-5 text-purple-400" />
            <h3 className="text-white font-semibold">Profile</h3>
          </div>

          <div className="space-y-4">
            <Field label="Full Name">
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className={inputCls}
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className={`${inputCls} opacity-50 cursor-not-allowed`}
              />
              <p className="text-white/30 text-xs mt-1">Email cannot be changed.</p>
            </Field>

            <Field label="Phone (Airtel/TNM)">
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+265 999 123 456"
                className={inputCls}
              />
            </Field>

            <Field label="Monthly Income (K)">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 font-medium">K</span>
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={e => setMonthlyIncome(e.target.value)}
                  placeholder="0"
                  className={`${inputCls} pl-8`}
                />
              </div>
              <p className="text-white/30 text-xs mt-1">Used for savings rate calculations and budget planning.</p>
            </Field>

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={saveProfile}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl disabled:opacity-50 transition-all hover:scale-[1.02]"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </section>

        {/* Security */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-sky-400" />
              <h3 className="text-white font-semibold">Security</h3>
            </div>
            {pwSaved && <span className="text-emerald-400 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Password updated!</span>}
          </div>

          {!showPwSection ? (
            <button
              onClick={() => setShowPwSection(true)}
              className="text-sm text-sky-400 hover:text-sky-300 underline transition-colors"
            >
              Change password
            </button>
          ) : (
            <div className="space-y-3">
              <Field label="Current Password">
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    className={`${inputCls} pr-10`}
                    placeholder="••••••••"
                  />
                  <button onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>
              <Field label="New Password">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  className={inputCls}
                  placeholder="Min. 6 characters"
                />
              </Field>
              {pwError && <p className="text-red-400 text-sm">{pwError}</p>}
              <div className="flex gap-2">
                <button onClick={changePassword} disabled={pwSaving || !currentPw || !newPw}
                  className="px-4 py-2 bg-sky-500/20 border border-sky-500/40 text-sky-300 rounded-xl text-sm disabled:opacity-50 flex items-center gap-1.5">
                  {pwSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                  Update Password
                </button>
                <button onClick={() => { setShowPwSection(false); setCurrentPw(''); setNewPw(''); setPwError(''); }}
                  className="px-4 py-2 hover:bg-white/10 text-white/50 rounded-xl text-sm">Cancel</button>
              </div>
            </div>
          )}
        </section>

        {/* App info */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-emerald-400" />
            <h3 className="text-white font-semibold">App Info</h3>
          </div>
          <dl className="space-y-2 text-sm">
            {[
              ['Version',  '1.0.0'],
              ['Currency', 'MWK (Malawian Kwacha)'],
              ['Inflation','28.7% (Malawi, 2025)'],
              ['User ID',  user?.uid || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <dt className="text-white/40">{k}</dt>
                <dd className="text-white/70 font-mono text-xs">{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}

const inputCls = 'w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-white/60 text-xs uppercase tracking-wide mb-2">{label}</label>
      {children}
    </div>
  );
}

export default function SettingsWithGuard() {
  return <AuthGuard><SettingsPage /></AuthGuard>;
}