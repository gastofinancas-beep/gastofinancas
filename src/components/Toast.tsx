import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  subtitle?: string;
  duration?: number;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <aside aria-label="Notificações" className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2.5 w-full max-w-sm px-4 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`pointer-events-auto w-full flex items-start gap-3 p-3.5 rounded-2xl shadow-xl border backdrop-blur-xl ${
                isSuccess
                  ? 'bg-emerald-950/90 dark:bg-emerald-950/95 border-emerald-500/30 text-white'
                  : isError
                  ? 'bg-rose-950/90 dark:bg-rose-950/95 border-rose-500/30 text-white'
                  : isWarning
                  ? 'bg-amber-950/90 dark:bg-amber-950/95 border-amber-500/30 text-white'
                  : 'bg-slate-900/90 dark:bg-slate-900/95 border-slate-700/50 text-white'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 size={20} className="text-emerald-400" />}
                {isError && <AlertCircle size={20} className="text-rose-400" />}
                {isWarning && <AlertTriangle size={20} className="text-amber-400" />}
                {!isSuccess && !isError && !isWarning && <Info size={20} className="text-sky-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold leading-tight tracking-tight text-white">
                  {toast.title}
                </p>
                {toast.subtitle && (
                  <p className="text-[11px] text-slate-300 dark:text-slate-200 font-medium mt-0.5 leading-snug">
                    {toast.subtitle}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="shrink-0 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </aside>
  );
}
