'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/Context/AuthContext';
import { Brain } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** Optional redirect target (default: /auth/login) */
  redirectTo?: string;
}

/**
 * Wraps a page in auth protection.
 * Shows a branded loader while Firebase resolves the auth state,
 * then redirects unauthenticated users to the login page.
 */
export default function AuthGuard({ children, redirectTo = '/auth/login' }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Brain className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-white/50 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}