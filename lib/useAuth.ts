/**
 * Re-exports from Context/AuthContext so any file that imports from
 * '@/lib/useAuth' still works without a breaking change.
 *
 * Canonical location is @/Context/AuthContext.tsx
 */
export { useAuth } from '@/Context/AuthContext';
export type { AppUser, Role } from '@/Context/AuthContext';