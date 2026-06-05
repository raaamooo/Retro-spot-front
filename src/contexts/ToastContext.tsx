'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
  createdAt: number;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue>({
  addToast: () => {},
});

export const useToast = () => useContext(ToastContext);

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

const TOAST_COLORS: Record<ToastType, { border: string; icon: string; bg: string }> = {
  success: { border: 'var(--success)', icon: 'var(--success)', bg: 'var(--success-bg)' },
  error: { border: 'var(--danger)', icon: 'var(--danger)', bg: 'var(--danger-bg)' },
  warning: { border: 'var(--warning)', icon: 'var(--warning)', bg: 'var(--warning-bg)' },
  info: { border: 'var(--info)', icon: 'var(--info)', bg: 'var(--info-bg)' },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const colors = TOAST_COLORS[toast.type];

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  }, [toast.id, onDismiss]);

  useEffect(() => {
    timerRef.current = setTimeout(handleDismiss, toast.duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast.duration, handleDismiss]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 16px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${colors.border}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        minWidth: '320px',
        maxWidth: '420px',
        position: 'relative',
        overflow: 'hidden',
        animation: isExiting
          ? 'toastSlideOut 300ms cubic-bezier(0.25, 0.1, 0.25, 1) forwards'
          : 'toastSlideIn 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
      }}
    >
      {/* Icon */}
      <span style={{
        color: colors.icon,
        flexShrink: 0,
        marginTop: '1px',
      }}>
        {TOAST_ICONS[toast.type]}
      </span>

      {/* Message */}
      <p style={{
        flex: 1,
        fontSize: '14px',
        fontWeight: 500,
        lineHeight: 1.4,
        color: 'var(--foreground)',
        margin: 0,
      }}>
        {toast.message}
      </p>

      {/* Close */}
      <button
        onClick={handleDismiss}
        style={{
          flexShrink: 0,
          padding: '2px',
          color: 'var(--muted)',
          borderRadius: 'var(--radius-sm)',
          transition: 'color 150ms',
          cursor: 'pointer',
        }}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>

      {/* Progress bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '2px',
        backgroundColor: colors.border,
        opacity: 0.4,
        animation: `progressBar ${toast.duration}ms linear forwards`,
      }} />
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts(prev => [...prev.slice(-4), { id, message, type, duration, createdAt: Date.now() }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 'var(--z-toast)' as any,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => (
          <div key={toast.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={toast} onDismiss={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
