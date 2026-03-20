import Link from 'next/link';
import { TrendingDown } from 'lucide-react';

const year = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="border-t border-white/8 bg-black/20 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-3.5 h-3.5 text-black" />
              </div>
              <span className="font-bold text-white">SmartFin MW</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed">
              Beat Malawi's 28.7% inflation with smart tracking and AI-powered advice.
            </p>
          </div>

          {/* App */}
          <div>
            <p className="text-white/70 font-semibold text-sm mb-3">App</p>
            <ul className="space-y-2 text-sm text-white/40">
              {[
                ['/',            'Home'],
                ['/dashboard',  'Dashboard'],
                ['/logger',     'Log Expense'],
                ['/analytics',  'Analytics'],
                ['/advisor',    'AI Advisor'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white/70 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tools */}
          <div>
            <p className="text-white/70 font-semibold text-sm mb-3">Tools</p>
            <ul className="space-y-2 text-sm text-white/40">
              {[
                ['/budget',    'Budget Planner'],
                ['/savings',   'Savings Goals'],
                ['/insights',  'Market Insights'],
                ['/shopping',  'Smart Shopping'],
                ['/alerts',    'Price Alerts'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white/70 transition-colors">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <p className="text-white/70 font-semibold text-sm mb-3">Company</p>
            <ul className="space-y-2 text-sm text-white/40">
              <li><Link href="/about"   className="hover:text-white/70 transition-colors">About</Link></li>
              <li><Link href="/privacy" className="hover:text-white/70 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms"   className="hover:text-white/70 transition-colors">Terms of Service</Link></li>
              <li className="pt-1">
                <a href="mailto:support@smartfin.mw" className="hover:text-white/70 transition-colors">
                  support@smartfin.mw
                </a>
              </li>
              <li><span className="font-mono">+265 999 123 456</span></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/30 text-xs">© {year} SmartFin MW. All rights reserved.</p>
          <p className="text-white/20 text-xs">Made with ❤️ for Malawians</p>
        </div>
      </div>
    </footer>
  );
}