'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/Context/AuthContext';
import { db } from '@/lib/firebase';
import { Transaction } from '@/types/finance';
import {
  addDoc, collection, serverTimestamp, updateDoc, doc,
  increment, getDoc, setDoc
} from 'firebase/firestore';
import AuthGuard from '@/app/components/AuthGuard';
import { toast } from '@/app/components/Toaster';
import {
  Upload, Scan, DollarSign, Tag, FileText, TrendingDown, TrendingUp,
  X, Check, Camera, Sparkles, ArrowLeft, Receipt
} from 'lucide-react';
import Link from 'next/link';

const CATEGORIES = [
  { value: 'food',          label: 'Food',         emoji: '🍔' },
  { value: 'fuel',          label: 'Fuel',         emoji: '⛽' },
  { value: 'utilities',     label: 'Utilities',    emoji: '💡' },
  { value: 'transport',     label: 'Transport',    emoji: '🚗' },
  { value: 'health',        label: 'Health',       emoji: '🏥' },
  { value: 'entertainment', label: 'Entertain',    emoji: '🎬' },
  { value: 'household',     label: 'Household',    emoji: '🏠' },
  { value: 'income',        label: 'Income',       emoji: '💰' },
  { value: 'other',         label: 'Other',        emoji: '📦' },
];

const BLANK = {
  category:    'food',
  amount:      '',
  ref:         '',
  type:        'expense' as 'expense' | 'income',
  description: '',
  account:     'main',
};

function LoggerPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(BLANK);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tesseract, setTesseract] = useState<any>(null);

  // Lazy-load Tesseract only client-side
  useEffect(() => {
    let mounted = true;
    import('tesseract.js').then(mod => {
      if (mounted) setTesseract((mod as any).default ?? mod);
    }).catch(console.error);
    return () => { mounted = false; };
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleOCR = async () => {
    if (!image || !tesseract) return;
    setScanning(true);
    try {
      const { data: { text } } = await tesseract.recognize(image, 'eng');
      const amountMatch = text.match(/(?:K|MWK|k)?\s*(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)/);
      const lower = text.toLowerCase();
      let category = 'household';
      if (/maize|tomato|food|grocery|shoprite|chipiku/.test(lower))   category = 'food';
      else if (/fuel|petrol|diesel|puma|total/.test(lower))           category = 'fuel';
      else if (/electric|escom|water|utility/.test(lower))            category = 'utilities';
      else if (/transport|taxi|bus|minibus/.test(lower))              category = 'transport';
      else if (/health|medical|hospital|clinic/.test(lower))          category = 'health';
      if (amountMatch) {
        const amount = amountMatch[1].replace(/,/g, '');
        setForm(f => ({ ...f, amount, category }));
      }
    } catch (err) {
      console.error('OCR failed:', err);
    } finally {
      setScanning(false);
    }
  };

  const addTransaction = async () => {
    if (!user || !form.amount) return;
    setSubmitting(true);
    try {
      const amount = parseFloat(form.amount);
      const tx: Omit<Transaction, 'id'> = {
        category:    form.category,
        amount:      form.type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
        ref:         form.ref,
        type:        form.type,
        description: form.description,
        date:        new Date().toISOString(),
        uid:         user.uid,
        account:     form.account,
      };

      await addDoc(collection(db, 'users', user.uid, 'transactions'), tx);

      // Update user totals
      await updateDoc(doc(db, 'users', user.uid), {
        [form.type === 'expense' ? 'totalSpent' : 'totalEarned']: increment(Math.abs(amount)),
        budgetLeft: increment(form.type === 'expense' ? -Math.abs(amount) : Math.abs(amount)),
      });

      // Upsert account balance
      const accountRef = doc(db, 'users', user.uid, 'accounts', form.account);
      const accountSnap = await getDoc(accountRef);
      const delta = form.type === 'expense' ? -Math.abs(amount) : Math.abs(amount);
      if (accountSnap.exists()) {
        await updateDoc(accountRef, { balance: increment(delta), lastUpdated: serverTimestamp() });
      } else {
        await setDoc(accountRef, {
          name: 'Main Account', type: 'checking', balance: delta,
          currency: 'MWK', createdAt: serverTimestamp(), lastUpdated: serverTimestamp(),
        });
      }

      setSuccess(true);
      setTimeout(() => {
        setForm(BLANK);
        setImage(null);
        setImagePreview(null);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Transaction failed:', err);
      toast.error('Failed to log transaction. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-all">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <Receipt className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-white">Log Transaction</h2>
          </div>
          <div className="flex items-center gap-1.5 text-white/40 text-sm">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            Quick Entry
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {success && (
          <div className="mb-5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-emerald-400" />
            <p className="text-emerald-300 font-medium">Transaction logged successfully!</p>
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); addTransaction(); }} className="space-y-4">
          {/* Type */}
          <Card>
            <label className="block text-white/60 text-xs uppercase tracking-wide mb-3">Transaction Type</label>
            <div className="grid grid-cols-2 gap-3">
              {(['expense', 'income'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5 ${
                    form.type === t
                      ? t === 'expense'
                        ? 'border-red-500 bg-red-500/15'
                        : 'border-emerald-500 bg-emerald-500/15'
                      : 'border-white/10 bg-white/5 hover:bg-white/8'
                  }`}
                >
                  {t === 'expense'
                    ? <TrendingDown className={`w-6 h-6 ${form.type === t ? 'text-red-400' : 'text-white/40'}`} />
                    : <TrendingUp className={`w-6 h-6 ${form.type === t ? 'text-emerald-400' : 'text-white/40'}`} />
                  }
                  <span className={`text-sm font-medium capitalize ${form.type === t ? (t === 'expense' ? 'text-red-300' : 'text-emerald-300') : 'text-white/50'}`}>
                    {t}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* Amount */}
          <Card>
            <label className="block text-white/60 text-xs uppercase tracking-wide mb-3">Amount (MWK)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 text-xl font-bold">K</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full pl-10 pr-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white text-2xl font-bold placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="0.00"
                required
              />
            </div>
          </Card>

          {/* Category */}
          <Card>
            <label className="block text-white/60 text-xs uppercase tracking-wide mb-3">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, category: cat.value }))}
                  className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                    form.category === cat.value
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/8'
                  }`}
                >
                  <span className="text-xl">{cat.emoji}</span>
                  <span className={`text-xs ${form.category === cat.value ? 'text-purple-300' : 'text-white/50'}`}>{cat.label}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Description */}
          <Card>
            <label className="block text-white/60 text-xs uppercase tracking-wide mb-3">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="e.g. Grocery shopping at Shoprite"
            />
          </Card>

          {/* Reference */}
          <Card>
            <label className="block text-white/60 text-xs uppercase tracking-wide mb-3">Reference <span className="text-white/30 normal-case">(optional)</span></label>
            <input
              type="text"
              value={form.ref}
              onChange={e => setForm(f => ({ ...f, ref: e.target.value }))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              placeholder="REF123456"
            />
          </Card>

          {/* Receipt upload */}
          <Card>
            <label className="block text-white/60 text-xs uppercase tracking-wide mb-3">
              Receipt Scan <span className="text-white/30 normal-case">(optional — AI auto-fills amount)</span>
            </label>

            {!imagePreview ? (
              <label className="flex flex-col items-center justify-center w-full py-8 border-2 border-dashed border-white/20 rounded-xl hover:border-purple-500 hover:bg-white/5 transition-all cursor-pointer">
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" capture="environment" />
                <Upload className="w-10 h-10 text-white/30 mb-2" />
                <p className="text-white/50 text-sm">Upload or take photo of receipt</p>
                <p className="text-white/30 text-xs mt-0.5">PNG, JPG · AI extracts amount automatically</p>
              </label>
            ) : (
              <div className="relative">
                <img src={imagePreview} alt="Receipt" className="w-full h-52 object-cover rounded-xl border border-white/20" />
                <button
                  type="button"
                  onClick={() => { setImage(null); setImagePreview(null); }}
                  className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-500 rounded-lg"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                {tesseract && (
                  <button
                    type="button"
                    onClick={handleOCR}
                    disabled={scanning}
                    className="mt-3 w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
                  >
                    {scanning
                      ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Scanning receipt…</>
                      : <><Scan className="w-4 h-4" /> Scan with AI</>
                    }
                  </button>
                )}
              </div>
            )}
          </Card>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !form.amount}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold text-lg rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:scale-[1.02]"
          >
            {submitting
              ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
              : <><Check className="w-5 h-5" /> Log Transaction</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-5">
      {children}
    </div>
  );
}

export default function LoggerWithGuard() {
  return <AuthGuard><LoggerPage /></AuthGuard>;
}