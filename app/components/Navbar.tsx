'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/Context/AuthContext';
import {
  Menu, X, TrendingDown, Bell, BarChart3, Receipt,
  PieChart, Brain, LayoutDashboard, LogOut, LineChart, Target
} from 'lucide-react';

const authLinks = [
  { href: '/dashboard',  label: 'Dashboard', icon: LayoutDashboard },
  { href: '/logger',     label: 'Log',        icon: Receipt },
  { href: '/analytics',  label: 'Analytics',  icon: LineChart },
  { href: '/advisor',    label: 'Advisor',    icon: Brain },
  { href: '/insights',   label: 'Insights',   icon: BarChart3 },
  { href: '/alerts',     label: 'Alerts',     icon: Bell },
];

export default function NavBar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <nav className="bg-black/40 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-black" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-pink-500 bg-clip-text text-transparent">
              SmartFin
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {!loading && user ? (
              <>
                {authLinks.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive(href)
                        ? 'bg-white/15 text-white'
                        : 'text-white/55 hover:text-white hover:bg-white/8'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </Link>
                ))}
                {user.role === 'super_admin' && (
                  <Link href="/admin" className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive('/admin') ? 'bg-amber-500/20 text-amber-300' : 'text-amber-400/70 hover:text-amber-300 hover:bg-amber-500/10'}`}>
                    Admin
                  </Link>
                )}
                <div className="w-px h-4 bg-white/10 mx-1" />
                <Link href="/settings" className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-white/50 hover:text-white hover:bg-white/8`}>
                  Settings
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white/45 hover:text-white hover:bg-white/8 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Logout
                </button>
              </>
            ) : !loading ? (
              <>
                <Link href="/auth/login" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/8 rounded-lg transition-all">
                  Login
                </Link>
                <Link href="/auth/register" className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-lg hover:scale-105 transition-all ml-1">
                  Sign Up Free
                </Link>
              </>
            ) : null}
          </div>

          {/* Mobile button */}
          <button onClick={() => setOpen(v => !v)} className="md:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all">
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-black/70 backdrop-blur-xl">
          <div className="px-3 pt-2 pb-4 space-y-0.5">
            {!loading && user ? (
              <>
                {authLinks.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive(href) ? 'bg-white/15 text-white' : 'text-white/60 hover:text-white hover:bg-white/8'}`}>
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                ))}
                {user.role === 'super_admin' && (
                  <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-amber-400 hover:bg-amber-500/10 transition-all">
                    Admin
                  </Link>
                )}
                <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/8 transition-all">
                  Settings
                </Link>
                <button onClick={() => { setOpen(false); logout(); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-white/45 hover:text-white hover:bg-white/8 transition-all">
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </>
            ) : !loading ? (
              <>
                <Link href="/auth/login" onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all">Login</Link>
                <Link href="/auth/register" onClick={() => setOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-center mt-1">Sign Up Free</Link>
              </>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
}