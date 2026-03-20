'use client';
import { useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: string; type: ToastType; message: string; }

// Module-level singleton — works from anywhere, even before mount
type Listener = (msg: string, type: ToastType) => void;
let _listener: Listener | null = null;
const _queue: Array<{ message: string; type: ToastType }> = [];

export function showToast(message: string, type: ToastType = 'info') {
  if (_listener) _listener(message, type);
  else _queue.push({ message, type });
}
export const toast = {
  success: (m: string) => showToast(m, 'success'),
  error:   (m: string) => showToast(m, 'error'),
  info:    (m: string) => showToast(m, 'info'),
};

const STYLES: Record<ToastType, string> = {
  success: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200',
  error:   'bg-red-950/90 border-red-500/50 text-red-200',
  info:    'bg-sky-950/90 border-sky-500/50 text-sky-200',
};
const ICONS: Record<ToastType, React.ElementType> = {
  success: CheckCircle, error: AlertCircle, info: Info,
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((message: string, type: ToastType) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    setToasts(prev => [...prev.slice(-4), { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4500);
  }, []);

  useEffect(() => {
    _listener = add;
    _queue.splice(0).forEach(({ message, type }) => add(message, type));
    return () => { _listener = null; };
  }, [add]);

  if (!toasts.length) return null;

  return (
    <div aria-live="polite" className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map(t => {
        const Icon = ICONS[t.type];
        return (
          <div key={t.id} className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl pointer-events-auto shadow-2xl ${STYLES[t.type]}`}>
            <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-sm flex-1 font-medium leading-snug">{t.message}</p>
            <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="opacity-50 hover:opacity-100 transition-opacity mt-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}