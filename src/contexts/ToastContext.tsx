'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   Toast Notification System
   
   Single source of truth for toast notifications.
   Uses inline styles to match the editorial design system
   (no Tailwind dependency).
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

const TOAST_ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

const TOAST_COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: 'var(--success-bg)', border: 'var(--success)', icon: 'var(--success)' },
  error: { bg: 'var(--danger-bg)', border: 'var(--danger)', icon: 'var(--danger)' },
  warning: { bg: 'rgba(196, 153, 63, 0.12)', border: 'var(--accent)', icon: 'var(--accent)' },
  info: { bg: 'rgba(54, 162, 235, 0.1)', border: '#2980b9', icon: '#2980b9' },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, message, type, duration }].slice(-5));
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
    <div
      style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <ToastItem toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

/* ── Single Toast ── */
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const colors = TOAST_COLORS[toast.type];

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onDismiss(toast.id), 200);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast, onDismiss]);

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        minWidth: '300px',
        maxWidth: '420px',
        animation: isExiting
          ? 'slideOutRight 200ms ease-in forwards'
          : 'slideInRight 250ms ease-out',
        transition: 'opacity 200ms',
        opacity: isExiting ? 0 : 1,
      }}
    >
      <span style={{ color: colors.icon, flexShrink: 0, display: 'flex' }}>
        {TOAST_ICONS[toast.type]}
      </span>
      <span
        style={{
          flex: 1,
          fontSize: '14px',
          fontWeight: 500,
          color: 'var(--foreground)',
          lineHeight: 1.4,
          fontFamily: 'var(--font-body)',
        }}
      >
        {toast.message}
      </span>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(() => onDismiss(toast.id), 200);
        }}
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          color: 'var(--muted)',
          opacity: 0.6,
          cursor: 'pointer',
          background: 'none',
          border: 'none',
          padding: '4px',
        }}
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}
