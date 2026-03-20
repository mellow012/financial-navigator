'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

/* ── Types ────────────────────────────────────────────────────────── */
export type Role = 'basic' | 'super_admin';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: Role;
  phone?: string;
  monthlyIncome?: number;
}

/* ── Context ──────────────────────────────────────────────────────── */
interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login:  (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ── Provider ─────────────────────────────────────────────────────── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          const data = snap.exists() ? snap.data() : {};
          setUser({
            uid:           firebaseUser.uid,
            email:         firebaseUser.email,
            displayName:   firebaseUser.displayName || data.name || null,
            role:          (data.role as Role) || 'basic',
            phone:         data.phone,
            monthlyIncome: data.monthlyIncome,
          });
        } catch {
          // Firestore offline or rules error — still set minimal user
          setUser({
            uid:         firebaseUser.uid,
            email:       firebaseUser.email,
            displayName: firebaseUser.displayName,
            role:        'basic',
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signup = async (email: string, password: string, name: string) => {
    const { user: fu } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(fu, { displayName: name });
    await setDoc(doc(db, 'users', fu.uid), {
      name,
      email,
      role:        'basic',
      createdAt:   new Date().toISOString(),
      currency:    'MWK',
      language:    'en',
      totalSpent:  0,
      totalEarned: 0,
      budgetLeft:  0,
    });
  };

  const login  = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password).then(() => undefined);

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ── Hook ─────────────────────────────────────────────────────────── */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}