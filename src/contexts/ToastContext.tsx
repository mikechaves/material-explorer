import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type ToastVariant = 'info' | 'success' | 'warn' | 'error';

type ToastInput = {
  title: string;
  message?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type Toast = {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  notify: (input: ToastInput) => void;
  dismiss: (id: string) => void;
};

const DEFAULT_TOAST_DURATION_MS = 3600;
const MAX_TOASTS = 4;

const variantStyles: Record<ToastVariant, string> = {
  info: 'border-cyan-300/45 bg-cyan-500/12 text-cyan-50',
  success: 'border-emerald-300/45 bg-emerald-500/12 text-emerald-50',
  warn: 'border-amber-300/45 bg-amber-500/12 text-amber-50',
  error: 'border-rose-300/45 bg-rose-500/12 text-rose-50',
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

function createToastId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutIdsRef = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timeoutId = timeoutIdsRef.current.get(id);
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
      timeoutIdsRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    ({ title, message, variant = 'info', durationMs = DEFAULT_TOAST_DURATION_MS }: ToastInput) => {
      const id = createToastId();
      setToasts((prev) => [{ id, title, message, variant }, ...prev].slice(0, MAX_TOASTS));
      if (durationMs > 0) {
        const timeoutId = window.setTimeout(() => {
          dismiss(id);
        }, durationMs);
        timeoutIdsRef.current.set(id, timeoutId);
      }
    },
    [dismiss]
  );

  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current;
    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      timeoutIds.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ notify, dismiss }}>
      {children}
      <div
        className="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(92vw,420px)] flex-col gap-2"
        aria-live="polite"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className={`pointer-events-auto rounded-xl border px-3 py-2 shadow-lg backdrop-blur-sm ${variantStyles[toast.variant]}`}
            >
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{toast.title}</div>
                  {toast.message && <div className="mt-0.5 text-xs text-white/90">{toast.message}</div>}
                </div>
                <button
                  type="button"
                  aria-label="Dismiss notification"
                  className="ui-btn h-7 w-7 rounded-md p-0 text-xs"
                  onClick={() => dismiss(toast.id)}
                >
                  x
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export function useToasts() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToasts must be used within a ToastProvider');
  return context;
}
