'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/Context/AuthContext';
import { Transaction } from '@/types/finance';
import { toast } from '@/app/components/Toaster';
import {
  collection, query, orderBy, getDocs, deleteDoc, doc, limit, startAfter,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  ArrowLeft, Receipt, Search, Filter, TrendingUp, TrendingDown,
  ShoppingCart, Trash2, RefreshCw, ChevronDown, Calendar, Tag,
  SlidersHorizontal, X, Download
} from 'lucide-react';
import Link from 'next/link';

const CATEGORY_EMOJI: Record<string, string> = {
  food: '🍔', fuel: '⛽', utilities: '💡', transport: '🚗',
  health: '🏥', entertainment: '🎬', household: '🏠', income: '💰', other: '📦',
};

const CATEGORIES = ['all', 'food', 'fuel', 'utilities', 'transport', 'health', 'entertainment', 'household', 'other'];
const PAGE_SIZE = 20;

export default function Transactions() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [catFilter, setCatFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const ref = collection(db, 'users', user.uid, 'transactions');
      const snap = await getDocs(query(ref, orderBy('date', 'desc')));
      const txs: Transaction[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      setTransactions(txs);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Delete this transaction?')) return;
    setDeleting(id);
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'transactions', id));
      setTransactions(prev => prev.filter(t => t.id !== id));
      toast.success('Transaction deleted.');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete transaction.');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const matchType = typeFilter === 'all' || tx.type === typeFilter;
      const matchCat = catFilter === 'all' || tx.category === catFilter;
      const matchSearch = !search || 
        tx.description?.toLowerCase().includes(search.toLowerCase()) ||
        tx.category?.toLowerCase().includes(search.toLowerCase()) ||
        tx.ref?.toLowerCase().includes(search.toLowerCase());
      return matchType && matchCat && matchSearch;
    });
  }, [transactions, typeFilter, catFilter, search]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  // Totals for filtered set
  const totals = useMemo(() => {
    const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
    return { income, expense, net: income - expense };
  }, [filtered]);

  const exportCSV = () => {
    const headers = 'Date,Type,Category,Description,Amount,Reference\n';
    const rows = filtered.map(t =>
      `${t.date?.slice(0, 10)},${t.type},${t.category},"${t.description || ''}",${t.amount},${t.ref || ''}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-all">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <Receipt className="w-6 h-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-white">Transactions</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 hover:text-white transition-all"
            >
              <Download className="w-4 h-4" /> CSV
            </button>
            <Link
              href="/logger"
              className="px-3 py-1.5 text-sm bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 rounded-lg transition-all"
            >
              + Log New
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-white/50 text-xs mb-1">Income</p>
            <p className="text-emerald-400 font-bold text-lg">+K{totals.income.toLocaleString('en', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-white/50 text-xs mb-1">Expenses</p>
            <p className="text-red-400 font-bold text-lg">-K{totals.expense.toLocaleString('en', { maximumFractionDigits: 0 })}</p>
          </div>
          <div className={`${totals.net >= 0 ? 'bg-purple-500/10 border-purple-500/20' : 'bg-red-500/10 border-red-500/20'} border rounded-xl p-4`}>
            <p className="text-white/50 text-xs mb-1">Net</p>
            <p className={`font-bold text-lg ${totals.net >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
              {totals.net >= 0 ? '+' : ''}K{totals.net.toLocaleString('en', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="mb-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="Search transactions…"
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-white/40 hover:text-white" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 text-sm ${showFilters ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
            >
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </button>
          </div>

          {showFilters && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-white/50 text-xs mb-2 uppercase tracking-wide">Type</p>
                <div className="flex gap-2">
                  {(['all', 'income', 'expense'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => { setTypeFilter(t); setPage(0); }}
                      className={`px-3 py-1 rounded-lg text-sm border transition-all capitalize ${typeFilter === t ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-white/50 text-xs mb-2 uppercase tracking-wide">Category</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => { setCatFilter(cat); setPage(0); }}
                      className={`px-2 py-1 rounded-lg text-sm border transition-all capitalize flex items-center gap-1 ${catFilter === cat ? 'bg-purple-500/20 border-purple-500/40 text-purple-300' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                    >
                      {cat !== 'all' && <span>{CATEGORY_EMOJI[cat]}</span>}
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Count */}
        <p className="text-white/40 text-sm mb-3">
          Showing {paginated.length} of {filtered.length} transactions
        </p>

        {/* Transaction list */}
        {paginated.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
            <Receipt className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/60">No transactions found.</p>
            {transactions.length === 0 && (
              <Link href="/logger" className="inline-block mt-4 px-4 py-2 bg-purple-500/20 border border-purple-500/40 text-purple-300 rounded-xl text-sm">
                Log your first transaction
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {paginated.map((tx) => {
              const isIncome = tx.type === 'income';
              return (
                <div
                  key={tx.id}
                  className="bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-4 transition-all group"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${isIncome ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                    {CATEGORY_EMOJI[tx.category] || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">
                      {tx.description || tx.name || tx.category}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-white/40 text-xs">{tx.date?.slice(0, 10)}</span>
                      <span className="text-white/20">·</span>
                      <span className="text-white/40 text-xs capitalize">{tx.category}</span>
                      {tx.ref && (
                        <><span className="text-white/20">·</span>
                        <span className="text-white/30 text-xs font-mono">{tx.ref}</span></>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-bold ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isIncome ? '+' : '-'}K{Math.abs(tx.amount).toLocaleString('en', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(tx.id)}
                    disabled={deleting === tx.id}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 rounded-lg transition-all text-white/40 hover:text-red-400 flex-shrink-0"
                  >
                    {deleting === tx.id
                      ? <RefreshCw className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />
                    }
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 disabled:opacity-30 transition-all text-sm"
            >
              Previous
            </button>
            <span className="text-white/50 text-sm">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/60 disabled:opacity-30 transition-all text-sm"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}