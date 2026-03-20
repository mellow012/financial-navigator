'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/Context/AuthContext';
import { db } from '@/lib/firebase';
import {
  collection, getDocs, doc, updateDoc, query,
  orderBy, limit, getCountFromServer
} from 'firebase/firestore';
import {
  ArrowLeft, Shield, Users, Activity, TrendingUp,
  RefreshCw, UserCheck, UserX, Search
} from 'lucide-react';
import Link from 'next/link';

interface AppUserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  totalSpent?: number;
  totalEarned?: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<AppUserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) { router.replace('/auth/login'); return; }
      if (user.role !== 'super_admin') { router.replace('/dashboard'); return; }
      fetchUsers();
    }
  }, [user, authLoading, router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50))
      );
      const countSnap = await getCountFromServer(collection(db, 'users'));
      setTotalUsers(countSnap.data().count);
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as AppUserRecord)));
    } finally {
      setLoading(false);
    }
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'super_admin' ? 'basic' : 'super_admin';
    setUpdatingRole(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } finally {
      setUpdatingRole(null);
    }
  };

  const filtered = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || loading) return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
      <RefreshCw className="w-8 h-8 text-white animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900">
      <div className="border-b border-white/10 bg-black/20 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 hover:bg-white/10 rounded-lg transition-all">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <Shield className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-xl font-bold text-white">Admin Panel</h2>
              <p className="text-white/40 text-xs">super_admin only</p>
            </div>
          </div>
          <button onClick={fetchUsers} className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
            <p className="text-3xl font-bold text-white">{totalUsers}</p>
            <p className="text-white/50 text-sm mt-1 flex items-center justify-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Total Users
            </p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 text-center">
            <p className="text-3xl font-bold text-amber-400">{users.filter(u => u.role === 'super_admin').length}</p>
            <p className="text-white/50 text-sm mt-1 flex items-center justify-center gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Admins
            </p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 text-center">
            <p className="text-3xl font-bold text-emerald-400">{users.filter(u => u.role === 'basic').length}</p>
            <p className="text-white/50 text-sm mt-1 flex items-center justify-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Basic Users
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users by name or email…"
            className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
          />
        </div>

        {/* Users table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  {['User', 'Joined', 'Role', 'Actions'].map(h => (
                    <th key={h} className={`p-4 text-xs font-semibold uppercase tracking-wide text-white/40 ${h === 'User' ? 'text-left' : 'text-center'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                    <td className="p-4">
                      <p className="text-white font-medium text-sm">{u.name || '—'}</p>
                      <p className="text-white/40 text-xs">{u.email}</p>
                    </td>
                    <td className="p-4 text-center">
                      <p className="text-white/60 text-xs">{u.createdAt?.slice(0, 10) || '—'}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        u.role === 'super_admin'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-white/10 text-white/50'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {u.id !== user?.uid && (
                        <button
                          onClick={() => toggleRole(u.id, u.role)}
                          disabled={updatingRole === u.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            u.role === 'super_admin'
                              ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                              : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                          } disabled:opacity-50`}
                        >
                          {updatingRole === u.id
                            ? <RefreshCw className="w-3 h-3 animate-spin" />
                            : u.role === 'super_admin'
                            ? <><UserX className="w-3 h-3" />Remove Admin</>
                            : <><UserCheck className="w-3 h-3" />Make Admin</>
                          }
                        </button>
                      )}
                      {u.id === user?.uid && (
                        <span className="text-white/20 text-xs">You</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-white/40 text-sm">No users found.</div>
          )}
        </div>

        <p className="text-white/25 text-xs text-center mt-4">
          Showing {filtered.length} of {totalUsers} total users (max 50 loaded)
        </p>
      </div>
    </div>
  );
}