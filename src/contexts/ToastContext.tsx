'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

/* ═══════════════════════════════════════════════════════════════
   Toast Notification System
   ═══════════════════════════════════════════════════════════════ */

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextProps {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, message, type, duration }]);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/* ── Toast Container ── */
function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

/* ── Single Toast ── */
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  const colorMap: Record<ToastType, string> = {
    success: 'bg-success-bg border-success text-success',
    error: 'bg-danger-bg border-danger text-danger',
    warning: 'bg-warning-bg border-warning text-warning',
    info: 'bg-info-bg border-info text-info',
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-5 py-3 rounded-xl border shadow-lg
        animate-[slideUp_0.3s_ease-out] min-w-[280px] max-w-[420px]
        ${colorMap[toast.type]}
      `}
      style={{
        animationName: 'slideUp',
      }}
      role="alert"
    >
      <span className="font-medium text-sm flex-1">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="opacity-60 hover:opacity-100 transition-opacity text-current font-bold text-lg leading-none"
        aria-label="Dismiss"
      >
        &times;
      </button>
      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
