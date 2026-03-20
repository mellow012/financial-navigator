import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft, TrendingDown, Brain, Shield, Smartphone,
  BarChart3, Heart, ArrowRight
} from 'lucide-react';

export const metadata: Metadata = { title: 'About SmartFin MW' };

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-10 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Hero */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25">
              <TrendingDown className="w-7 h-7 text-black" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">SmartFin MW</h1>
              <p className="text-white/50">Finance tracker built for Malawians</p>
            </div>
          </div>
          <p className="text-xl text-white/70 leading-relaxed">
            SmartFin MW was built to help everyday Malawians navigate one of Africa's highest
            inflation environments — 28.7% annually — with simple tools, real market data,
            and genuine AI-powered advice.
          </p>
        </div>

        {/* Problem/Solution */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-7 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">The Problem We Solve</h2>
          <div className="grid sm:grid-cols-2 gap-5 text-white/70 text-sm leading-relaxed">
            <div>
              <p className="text-red-400 font-semibold mb-2">Without SmartFin</p>
              <ul className="space-y-1.5">
                <li>• Tracking expenses in a paper notebook — or not at all</li>
                <li>• Not knowing which store has the cheapest maize this week</li>
                <li>• No warning when fuel prices jump 15% overnight</li>
                <li>• Getting financial "advice" that ignores Malawi's reality</li>
              </ul>
            </div>
            <div>
              <p className="text-emerald-400 font-semibold mb-2">With SmartFin</p>
              <ul className="space-y-1.5">
                <li>• Log cash, Airtel Money, and bank payments in seconds</li>
                <li>• Compare prices at Shoprite, Chipiku, and local markets</li>
                <li>• Get SMS alerts when petrol or maize hit your target price</li>
                <li>• AI advice that understands MWK, ESCOM, and 28.7% inflation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tech */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-5">How It's Built</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              {
                icon: Brain,
                title: 'Claude AI (Anthropic)',
                desc: 'Your advisor uses Claude Sonnet to analyze your real transactions and generate Malawi-specific financial advice. It also uses web search to fetch live market prices.',
                color: 'text-violet-400',
                bg: 'bg-violet-500/10 border-violet-500/20',
              },
              {
                icon: Shield,
                title: 'Firebase (Google)',
                desc: 'Your financial data is stored securely in Firestore with security rules that ensure only you can access your own records.',
                color: 'text-sky-400',
                bg: 'bg-sky-500/10 border-sky-500/20',
              },
              {
                icon: Smartphone,
                title: 'Next.js + React',
                desc: 'Built with Next.js App Router for fast performance. Receipt scanning uses Tesseract.js OCR — runs entirely in your browser, no data sent to a server.',
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10 border-emerald-500/20',
              },
              {
                icon: BarChart3,
                title: 'Chart.js Analytics',
                desc: 'All charts are generated client-side from your real Firestore data. Income vs expense trends, category breakdowns, and inflation forecasts.',
                color: 'text-yellow-400',
                bg: 'bg-yellow-500/10 border-yellow-500/20',
              },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className={`border rounded-xl p-5 ${bg}`}>
                <div className={`flex items-center gap-2 mb-2 ${color}`}>
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold text-sm text-white">{title}</span>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mission */}
        <div className="bg-gradient-to-r from-yellow-400/10 to-orange-500/10 border border-yellow-400/20 rounded-2xl p-7 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-5 h-5 text-rose-400" />
            <h2 className="text-xl font-bold text-white">Our Mission</h2>
          </div>
          <p className="text-white/70 leading-relaxed">
            Financial literacy and tools should not be luxury items. SmartFin MW is free,
            works on 2G connections, and is designed around how Malawians actually manage money —
            mobile money, cash, and the reality of price volatility on essential goods.
            We believe every Malawian deserves AI-powered financial tools, not just those with
            bank accounts and smartphones.
          </p>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold rounded-2xl hover:scale-105 transition-all shadow-lg shadow-orange-500/25"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-white/30 text-sm mt-4">
            Questions? Email{' '}
            <a href="mailto:hello@smartfin.mw" className="text-white/50 hover:text-white transition-colors underline">
              hello@smartfin.mw
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}