'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/Context/AuthContext';
import { TrendingDown, ArrowLeft, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading, signup } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) router.replace('/dashboard');
  }, [user, authLoading, router]);

  const passwordStrength = () => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 6) s++;
    if (password.length >= 10) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9!@#$%^&*]/.test(password)) s++;
    return s;
  };
  const strength = passwordStrength();
  const strengthColor = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'][strength] || '';
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength] || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await signup(email, password, name.trim());
      router.push('/dashboard');
    } catch (err: any) {
      const code = err.code as string;
      if (code === 'auth/email-already-in-use') {
        setError('This email is already registered. Try logging in instead.');
      } else if (code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'Failed to create account.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <Skeleton />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md w-full">
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-8 text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/25">
            <TrendingDown className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Start Saving</h1>
          <p className="text-white/50">Create your free SmartFin account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full Name" value={name} onChange={setName} placeholder="John Banda" required />
          <Input label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" required />

          <div>
            <label className="block text-white/70 text-sm font-medium mb-2">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400 pr-11"
                placeholder="Min. 6 characters"
                required
              />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColor : 'bg-white/10'}`} />
                  ))}
                </div>
                <p className={`text-xs ${['', 'text-red-400', 'text-orange-400', 'text-yellow-400', 'text-emerald-400'][strength]}`}>
                  {strengthLabel}
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-500/15 border border-red-500/40 rounded-xl p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black py-3 rounded-xl font-bold hover:scale-[1.02] transition-all disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Sign Up Free'}
          </button>
        </form>

        {/* Perks */}
        <div className="mt-5 space-y-2">
          {['Free forever — no credit card needed', 'AI-powered financial insights', 'Works offline on 2G/3G'].map(perk => (
            <div key={perk} className="flex items-center gap-2 text-xs text-white/40">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              {perk}
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-white/50 text-sm">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-yellow-400 hover:text-yellow-300 font-semibold transition-colors">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

function Input({ label, type = 'text', value, onChange, placeholder, required }: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-white/70 text-sm font-medium mb-2">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        placeholder={placeholder} required={required}
      />
    </div>
  );
}

function Skeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="bg-black/40 backdrop-blur-xl border border-white/20 rounded-2xl p-8 max-w-md w-full animate-pulse space-y-6">
        <div className="h-6 bg-white/10 rounded w-32" />
        <div className="w-16 h-16 bg-white/10 rounded-2xl mx-auto" />
        <div className="h-8 bg-white/10 rounded w-40 mx-auto" />
        <div className="h-12 bg-white/10 rounded-xl" />
        <div className="h-12 bg-white/10 rounded-xl" />
        <div className="h-12 bg-white/10 rounded-xl" />
        <div className="h-12 bg-yellow-400/20 rounded-xl" />
      </div>
    </div>
  );
}