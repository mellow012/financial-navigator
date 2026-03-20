'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/Context/AuthContext';
import {
  ArrowRight, TrendingDown, Smartphone, BarChart3,
  Bell, Brain, Shield, Zap, Check, Target, Receipt,
  ShoppingCart, TrendingUp, Users
} from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      {/* Hero */}
      <section className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-yellow-400/15 border border-yellow-400/30 rounded-full px-4 py-2 mb-8">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 text-sm font-medium">
              AI-Powered · Works Offline · Free Forever
            </span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
            Beat Malawi's
            <br />
            <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">
              28.7% Inflation.
            </span>
          </h1>

          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
            Track cash, mobile money, and bank payments. Get AI-powered advice from Claude,
            live market prices, and alerts when essentials spike.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => router.push(user ? '/dashboard' : '/auth/register')}
              className="group bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-8 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-orange-500/30"
            >
              {user ? 'Go to Dashboard' : 'Start Saving Free'}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link
              href="#features"
              className="border border-white/25 text-white/80 hover:text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:border-white/40 hover:bg-white/5 transition-all"
            >
              See Features
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-white/40 text-sm">
            {[
              { icon: Users, label: 'Free for all Malawians' },
              { icon: Shield, label: 'Data stays on your device' },
              { icon: Smartphone, label: 'Works on 2G / offline' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inflation stat banner */}
      <section className="px-4 pb-16">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-red-500/15 to-orange-500/15 border border-red-400/20 rounded-2xl p-6 sm:p-8">
          <div className="grid sm:grid-cols-3 gap-6 text-center">
            {[
              { value: '28.7%', label: 'Annual Inflation (2025)', color: 'text-red-400' },
              { value: '15–25%', label: 'Savings Possible on Groceries', color: 'text-emerald-400' },
              { value: '60%', label: 'Malawians Track Spending Manually', color: 'text-yellow-400' },
            ].map(({ value, label, color }) => (
              <div key={label}>
                <p className={`text-4xl font-bold ${color} mb-1`}>{value}</p>
                <p className="text-white/50 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-3">Everything You Need</h2>
            <p className="text-white/50 text-lg">Built specifically for Malawi's financial reality</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Receipt,
                title: 'Smart Expense Logger',
                desc: 'Log cash, Airtel Money, TNM Mpamba, and bank transfers. Snap receipts — AI auto-fills the amount.',
                gradient: 'from-purple-500/20 to-pink-500/20',
                border: 'border-purple-400/30',
                iconColor: 'text-purple-400',
              },
              {
                icon: Brain,
                title: 'Claude AI Advisor',
                desc: 'Ask Claude anything about your finances. Get personalized tips based on your actual spending data.',
                gradient: 'from-violet-500/20 to-indigo-500/20',
                border: 'border-violet-400/30',
                iconColor: 'text-violet-300',
              },
              {
                icon: BarChart3,
                title: 'Live Market Insights',
                desc: 'Real-time Malawi prices for maize, petrol, cooking oil, and more via AI web search.',
                gradient: 'from-yellow-500/20 to-orange-500/20',
                border: 'border-yellow-400/30',
                iconColor: 'text-yellow-400',
              },
              {
                icon: Bell,
                title: 'Price Alerts',
                desc: 'Get notified when petrol, maize, or other essentials hit your target price. SMS-capable.',
                gradient: 'from-sky-500/20 to-cyan-500/20',
                border: 'border-sky-400/30',
                iconColor: 'text-sky-400',
              },
              {
                icon: ShoppingCart,
                title: 'Smart Shopping',
                desc: 'Compare prices across Shoprite, Chipiku, Game, and local markets. Find the best deal near you.',
                gradient: 'from-emerald-500/20 to-teal-500/20',
                border: 'border-emerald-400/30',
                iconColor: 'text-emerald-400',
              },
              {
                icon: Target,
                title: 'Savings Goals',
                desc: 'Set goals for school fees, a new phone, or an emergency fund. Track deposits and progress.',
                gradient: 'from-rose-500/20 to-pink-500/20',
                border: 'border-rose-400/30',
                iconColor: 'text-rose-400',
              },
            ].map(({ icon: Icon, title, desc, gradient, border, iconColor }) => (
              <div key={title} className={`bg-gradient-to-br ${gradient} backdrop-blur border ${border} rounded-2xl p-6`}>
                <div className={`w-12 h-12 bg-black/20 rounded-xl flex items-center justify-center mb-4 ${iconColor}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">{title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 pb-20">
        <div className="max-w-2xl mx-auto bg-black/20 backdrop-blur border border-white/10 rounded-3xl p-10 text-center">
          <TrendingUp className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-3">Ready to Outsmart Inflation?</h2>
          <p className="text-white/60 mb-8">
            Join Malawians using data and AI to protect their purchasing power.
          </p>
          <button
            onClick={() => router.push(user ? '/dashboard' : '/auth/register')}
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-10 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-transform shadow-lg shadow-orange-500/20"
          >
            {user ? 'View My Dashboard' : 'Get Started — It\'s Free'}
          </button>
          <div className="mt-6 flex items-center justify-center gap-4 text-white/30 text-sm">
            {['No credit card', 'No subscription', 'Works offline'].map(item => (
              <span key={item} className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-500" /> {item}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}