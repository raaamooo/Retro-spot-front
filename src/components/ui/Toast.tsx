'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextProps {
  showToast: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextProps | undefined>(undefined);

let toastId = 0;

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: 'var(--success-bg)', border: 'var(--success)', icon: 'var(--success)' },
  error: { bg: 'var(--danger-bg)', border: 'var(--danger)', icon: 'var(--danger)' },
  warning: { bg: 'rgba(196, 153, 63, 0.12)', border: 'var(--accent)', icon: 'var(--accent)' },
  info: { bg: 'rgba(54, 162, 235, 0.1)', border: '#2980b9', icon: '#2980b9' },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const colors = COLORS[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onDismiss(toast.id), 200);
    }, toast.duration || 4000);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
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
        animation: isExiting ? 'slideOutRight 200ms ease-in forwards' : 'slideInRight 250ms ease-out',
        transition: 'opacity 200ms',
        opacity: isExiting ? 0 : 1,
      }}
    >
      <span style={{ color: colors.icon, flexShrink: 0, display: 'flex' }}>{ICONS[toast.type]}</span>
      <span style={{
        flex: 1,
        fontSize: '14px',
        fontWeight: 500,
        color: 'var(--foreground)',
        lineHeight: 1.4,
      }}>
        {toast.message}
      </span>
      <button
        onClick={() => { setIsExiting(true); setTimeout(() => onDismiss(toast.id), 200); }}
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          color: 'var(--muted)',
          opacity: 0.6,
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration?: number) => {
    setToasts(prev => [...prev, { id: `toast_${toastId++}`, type, message, duration }].slice(-5));
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const value: ToastContextProps = {
    showToast,
    success: (m) => showToast('success', m),
    error: (m) => showToast('error', m),
    warning: (m) => showToast('warning', m),
    info: (m) => showToast('info', m),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast Container */}
      <div style={{
        position: 'fixed',
        top: '80px',
        right: '20px',
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
      }}>
        {toasts.map(toast => (
          <div key={toast.id} style={{ pointerEvents: 'auto' }}>
            <ToastItem toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
