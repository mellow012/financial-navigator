'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/Context/AuthContext';
import {
  TrendingUp, TrendingDown, ArrowLeft, BarChart3, ShoppingBag,
  Flame, Droplets, Zap, Activity, AlertTriangle, CheckCircle,
  Minus, Calendar, RefreshCw, Wifi, WifiOff, Info
} from 'lucide-react';
import Link from 'next/link';

interface PriceItem {
  item: string;
  category: string;
  currentPrice: number;
  previousPrice: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  change: number;
  source: string;
  emoji: string;
}

interface MarketAlert {
  type: 'warning' | 'opportunity' | 'info';
  title: string;
  message: string;
}

interface InsightsData {
  inflationRate: number;
  lastUpdated: string;
  prices: PriceItem[];
  alerts: MarketAlert[];
  marketSummary: string;
  cached?: boolean;
}

const CATEGORIES = [
  { value: 'all', label: 'All', icon: Activity },
  { value: 'food', label: 'Food', icon: ShoppingBag },
  { value: 'fuel', label: 'Fuel', icon: Flame },
  { value: 'utilities', label: 'Utilities', icon: Zap },
];

export default function Insights() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('all');
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchInsights();
  }, [user]);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/insights');
      if (!res.ok) throw new Error('API failed');
      const json: InsightsData = await res.json();
      setData(json);
      setLastFetched(new Date());
    } catch (err) {
      console.error('Insights fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = data?.prices?.filter(
    (p) => selectedCat === 'all' || p.category === selectedCat
  ) ?? [];

  const rising = data?.prices?.filter(p => p.trend === 'up').length ?? 0;
  const falling = data?.prices?.filter(p => p.trend === 'down').length ?? 0;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Fetching live market data…</p>
          <p className="text-white/40 text-sm mt-1">Powered by AI web search</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-all">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <BarChart3 className="w-6 h-6 text-yellow-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Market Insights</h2>
              <p className="text-white/40 text-xs">
                {lastFetched ? `Updated ${lastFetched.toLocaleTimeString()}` : 'Live data'}
              </p>
            </div>
          </div>
          <button
            onClick={fetchInsights}
            className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-lg transition-all text-white/60 hover:text-white text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Inflation Banner */}
        <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-400/30 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">
                Malawi Annual Inflation: {data?.inflationRate ?? 28.7}%
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                {data?.marketSummary || 'Malawi markets remain under pressure. Use this data to make informed purchasing decisions and protect your budget.'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-white">{data?.prices?.length ?? 0}</p>
            <p className="text-white/50 text-sm mt-1">Items tracked</p>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-red-400">{rising}</p>
            <p className="text-white/50 text-sm mt-1">Prices rising</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-emerald-400">{falling}</p>
            <p className="text-white/50 text-sm mt-1">Prices falling</p>
          </div>
        </div>

        {/* Alerts */}
        {data?.alerts && data.alerts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <span>🚨</span> Market Alerts
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.alerts.map((alert, i) => (
                <div key={i} className={`rounded-xl p-4 border ${
                  alert.type === 'warning'
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : alert.type === 'opportunity'
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-sky-500/10 border-sky-500/30'
                }`}>
                  <h4 className={`font-semibold mb-1.5 text-sm ${
                    alert.type === 'warning' ? 'text-amber-300'
                    : alert.type === 'opportunity' ? 'text-emerald-300'
                    : 'text-sky-300'
                  }`}>{alert.title}</h4>
                  <p className="text-white/70 text-xs leading-relaxed">{alert.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setSelectedCat(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-all ${
                selectedCat === value
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Price table */}
        <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {['Item', 'Current Price', 'Previous', 'Change', 'Trend'].map(h => (
                    <th key={h} className={`p-4 text-white/50 font-semibold text-xs uppercase tracking-wide ${h === 'Item' ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-all">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{item.emoji}</span>
                        <div>
                          <p className="text-white font-medium text-sm">{item.item}</p>
                          <p className="text-white/40 text-xs">per {item.unit} · {item.source}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-white font-semibold">K{item.currentPrice.toLocaleString()}</p>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-white/50 text-sm">K{item.previousPrice.toLocaleString()}</p>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`inline-flex items-center gap-1 text-sm font-semibold ${
                        item.trend === 'up' ? 'text-red-400'
                        : item.trend === 'down' ? 'text-emerald-400'
                        : 'text-white/40'
                      }`}>
                        {item.trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
                        {item.trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
                        {item.trend === 'stable' && <Minus className="w-3.5 h-3.5" />}
                        {item.change > 0 ? '+' : ''}K{Math.abs(item.currentPrice - item.previousPrice).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        item.trend === 'up' ? 'bg-red-500/20 text-red-300'
                        : item.trend === 'down' ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-white/10 text-white/50'
                      }`}>
                        {item.changePercent > 0 ? '+' : ''}{item.changePercent.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Source note */}
        <p className="text-white/30 text-xs text-center flex items-center justify-center gap-1.5">
          <Info className="w-3.5 h-3.5" />
          Prices sourced via AI web search from public market data. Verify before major purchases.
        </p>
      </div>
    </div>
  );
}
