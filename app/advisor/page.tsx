'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/Context/AuthContext';
import { Transaction, AdvisorTip } from '@/types/finance';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Lightbulb, TrendingUp, AlertCircle, CheckCircle, Sparkles,
  ArrowLeft, Target, Brain, Zap, TrendingDown, Send, RefreshCw,
  MessageCircle, X, ChevronDown, ChevronUp,
} from 'lucide-react';
import { toast } from '@/app/components/Toaster';
import Link from 'next/link';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function Advisor() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tips, setTips] = useState<AdvisorTip[]>([]);
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [stats, setStats] = useState({
    totalExpense: 0, totalIncome: 0,
    foodSpend: 0, fuelSpend: 0, utilitiesSpend: 0, savingsRate: 0,
  });

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [expandedTip, setExpandedTip] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchAndAnalyze();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildStats = (txs: Transaction[]) => {
    const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0);
    const income  = txs.filter(t => t.type === 'income').reduce((s, t) => s + Math.abs(t.amount), 0);
    const foodSpend      = txs.filter(t => t.category === 'food').reduce((s, t) => s + Math.abs(t.amount), 0);
    const fuelSpend      = txs.filter(t => t.category === 'fuel').reduce((s, t) => s + Math.abs(t.amount), 0);
    const utilitiesSpend = txs.filter(t => t.category === 'utilities').reduce((s, t) => s + Math.abs(t.amount), 0);
    const savingsRate    = income > 0 ? ((income - expense) / income) * 100 : 0;
    return { totalExpense: expense, totalIncome: income, foodSpend, fuelSpend, utilitiesSpend, savingsRate };
  };

  const fetchAndAnalyze = async (force = false) => {
    if (!user) return;
    if (force) setRefreshing(true); else setLoading(true);

    let localTxs: Transaction[] = [];
    let localStats = { totalExpense: 0, totalIncome: 0, foodSpend: 0, fuelSpend: 0, utilitiesSpend: 0, savingsRate: 0 };

    try {
      const snap = await getDocs(query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc')));
      localTxs   = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      localStats = buildStats(localTxs);
      setTransactions(localTxs);
      setStats(localStats);

      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: localTxs, stats: localStats }),
      });

      if (!res.ok) throw new Error(`Advisor API ${res.status}`);
      const data = await res.json();

      setTips((data.tips || []).sort((a: AdvisorTip, b: AdvisorTip) => a.priority - b.priority));
      setSummary(data.summary || '');
      setRateLimited(!!data.rateLimited);

      if (force && !data.rateLimited) toast.success('Analysis refreshed!');
      if (force && data.rateLimited)  toast.info('Using cached tips — AI quota resets soon.');
    } catch (err) {
      console.error('Advisor error:', err);
      setTips(generateFallbackTips(localTxs, localStats));
      if (force) toast.error('Could not reach AI. Showing rule-based tips.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const sendQuestion = async () => {
    if (!question.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);
    setQuestion('');
    setChatLoading(true);

    try {
      const res  = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions, stats, question: userMsg.content }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer || 'Sorry, I could not generate a response. Please try again.',
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Network error — please check your connection and try again.',
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const suggestedQuestions = [
    'How can I reduce my food expenses?',
    'What should I do with my savings?',
    'How does inflation affect my budget?',
    'Should I buy goods in bulk now?',
  ];

  /* ── Loading state ── */
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-white text-xl">AI is analyzing your finances…</p>
          <p className="text-white/50 text-sm mt-2">Powered by Groq AI</p>
        </div>
      </div>
    );
  }

  /* ── Helpers ── */
  const typeStyle = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-amber-500/10 border-amber-500/40 text-amber-300';
      case 'success': return 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300';
      case 'info':    return 'bg-sky-500/10 border-sky-500/40 text-sky-300';
      case 'insight': return 'bg-violet-500/10 border-violet-500/40 text-violet-300';
      default:        return 'bg-white/5 border-white/10 text-white';
    }
  };

  const iconColor = (type: string) => {
    switch (type) {
      case 'warning': return 'text-amber-400';
      case 'success': return 'text-emerald-400';
      case 'info':    return 'text-sky-400';
      case 'insight': return 'text-violet-400';
      default:        return 'text-white';
    }
  };

  const TipIcon = ({ type }: { type: string }) => {
    const cls = `w-5 h-5 ${iconColor(type)}`;
    switch (type) {
      case 'warning': return <AlertCircle className={cls} />;
      case 'success': return <CheckCircle className={cls} />;
      case 'insight': return <Lightbulb className={cls} />;
      default:        return <TrendingUp className={cls} />;
    }
  };

  /* ── Main render ── */
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">

      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-all">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <Brain className="w-6 h-6 text-purple-400" />
            <div>
              <h2 className="text-xl font-bold text-white">AI Financial Advisor</h2>
              <p className="text-white/40 text-xs">Powered by Groq AI</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAndAnalyze(true)}
              disabled={refreshing}
              className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/60 hover:text-white"
              title="Refresh analysis"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 rounded-xl transition-all text-purple-300"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-sm">Ask AI</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Expenses', value: `K${stats.totalExpense.toLocaleString('en', { maximumFractionDigits: 0 })}`, icon: TrendingDown, color: 'text-red-400' },
            { label: 'Total Income',   value: `K${stats.totalIncome.toLocaleString('en', { maximumFractionDigits: 0 })}`,   icon: TrendingUp,   color: 'text-emerald-400' },
            { label: 'Savings Rate',   value: `${stats.savingsRate.toFixed(1)}%`,                                           icon: Target,       color: 'text-purple-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${color}`} />
                <span className="text-white/50 text-xs">{label}</span>
              </div>
              <p className="text-xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* AI Summary */}
        {summary && (
          <div className="bg-gradient-to-r from-purple-500/15 to-violet-500/15 border border-purple-500/30 rounded-xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-semibold">AI Financial Summary</span>
            </div>
            <p className="text-white/80 text-sm leading-relaxed">{summary}</p>
          </div>
        )}

        {/* Rate limit banner */}
        {rateLimited && (
          <div className="mb-5 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
            <Zap className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 font-medium text-sm">AI quota temporarily reached</p>
              <p className="text-white/50 text-xs mt-0.5">
                Showing standard tips for now. Groq free tier resets every minute — refresh in 60 seconds for personalized AI analysis.
              </p>
            </div>
          </div>
        )}

        {/* Tips heading */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-bold text-white">Personalized Insights</h3>
          </div>
          <p className="text-white/40 text-sm">
            Based on {transactions.length} transactions · Malawi inflation: 28.7%
          </p>
        </div>

        {/* Tips list */}
        {tips.length > 0 ? (
          <div className="space-y-3">
            {tips.map((tip) => {
              const isExpanded = expandedTip === tip.id;
              const isLong     = tip.message.length > 140;
              return (
                <div key={tip.id} className={`backdrop-blur border rounded-xl p-5 transition-all ${typeStyle(tip.type)}`}>
                  <div className="flex items-start gap-4">
                    <div className={`w-9 h-9 rounded-lg bg-black/20 flex items-center justify-center flex-shrink-0 mt-0.5 ${iconColor(tip.type)}`}>
                      <TipIcon type={tip.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold mb-1">{tip.title}</h4>
                      <p className={`text-sm leading-relaxed opacity-85 ${!isExpanded && isLong ? 'line-clamp-2' : ''}`}>
                        {tip.message}
                      </p>
                      {isLong && (
                        <button
                          onClick={() => setExpandedTip(isExpanded ? null : tip.id)}
                          className="mt-2 text-xs opacity-60 hover:opacity-100 flex items-center gap-1"
                        >
                          {isExpanded
                            ? <><ChevronUp className="w-3 h-3" />Show less</>
                            : <><ChevronDown className="w-3 h-3" />Read more</>
                          }
                        </button>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full bg-black/20 flex-shrink-0 ${
                      tip.priority === 1 ? 'text-red-300' : tip.priority === 2 ? 'text-yellow-300' : 'text-white/40'
                    }`}>
                      {tip.priority === 1 ? 'Urgent' : tip.priority === 2 ? 'Important' : 'Info'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-12 text-center">
            <Brain className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Insights Yet</h3>
            <p className="text-white/50 mb-6">Log some transactions to receive AI-powered financial advice.</p>
            <Link
              href="/logger"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:scale-105 transition-all"
            >
              <Sparkles className="w-4 h-4 mr-2" /> Log Your First Transaction
            </Link>
          </div>
        )}

        {/* Suggested questions */}
        {tips.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-violet-500/20 to-purple-500/20 border border-violet-400/30 rounded-xl p-5">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-violet-300" />
              Ask a Question
            </h4>
            <div className="grid sm:grid-cols-2 gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => { setQuestion(q); setChatOpen(true); }}
                  className="text-left text-sm text-white/70 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat Drawer */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setChatOpen(false)} />
          <div className="relative w-full sm:w-[420px] sm:mr-6 sm:mb-6 bg-gradient-to-br from-indigo-950/95 to-purple-950/95 border border-white/20 rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[80vh] sm:max-h-[600px]">

            {/* Chat header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-500/30 rounded-full flex items-center justify-center">
                  <Brain className="w-4 h-4 text-purple-300" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">SmartFin AI</p>
                  <p className="text-white/40 text-xs">Powered by Groq</p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition-all">
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <Sparkles className="w-10 h-10 text-purple-400 mx-auto mb-3" />
                  <p className="text-white/60 text-sm">Ask me anything about your finances!</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-purple-500/30 text-white rounded-tr-sm'
                      : 'bg-white/10 text-white/90 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10 flex-shrink-0">
              {messages.length === 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {suggestedQuestions.slice(0, 2).map((q) => (
                    <button
                      key={q}
                      onClick={() => setQuestion(q)}
                      className="text-xs text-white/60 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1 transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendQuestion()}
                  placeholder="Ask about your finances…"
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={sendQuestion}
                  disabled={!question.trim() || chatLoading}
                  className="w-10 h-10 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
                >
                  <Send className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function generateFallbackTips(txs: Transaction[], stats: any): AdvisorTip[] {
  const tips: AdvisorTip[] = [];
  if (stats.savingsRate < 10) {
    tips.push({ id: 'savings', type: 'warning', title: 'Low Savings Rate',        message: `You're saving only ${stats.savingsRate.toFixed(1)}% of income. Aim for at least 20%.`,   priority: 1 });
  }
  if (stats.totalExpense > stats.totalIncome && stats.totalIncome > 0) {
    tips.push({ id: 'deficit', type: 'warning', title: 'Spending Exceeds Income', message: 'You are spending more than you earn. Review your expenses urgently.',                       priority: 1 });
  }
  if (txs.length < 5) {
    tips.push({ id: 'log-more', type: 'info',  title: 'Log More Transactions',   message: 'Log at least 10 transactions to receive meaningful AI-powered financial insights.',        priority: 2 });
  }
  if (tips.length === 0) {
    tips.push({ id: 'good',    type: 'success', title: 'Finances Look Healthy',   message: 'Your spending and savings look balanced. Keep logging transactions for deeper insights.', priority: 3 });
  }
  return tips;
}