'use client';

import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

/**
 * Modal — Accessible dialog component.
 * Uses inline styles matching the editorial design system (no Tailwind).
 */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showClose?: boolean;
}

const SIZE_MAX_WIDTHS: Record<string, string> = {
  sm: '384px',
  md: '512px',
  lg: '672px',
  xl: '896px',
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
}: ModalProps) {
  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, handleEsc]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 200ms ease-out',
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: SIZE_MAX_WIDTHS[size],
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          animation: 'modalIn 250ms ease-out',
        }}
      >
        {/* Header */}
        {(title || showClose) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              flexShrink: 0,
            }}
          >
            {title && (
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--foreground)',
                  margin: 0,
                }}
              >
                {title}
              </h2>
            )}
            {showClose && (
              <button
                onClick={onClose}
                aria-label="Close"
                style={{
                  padding: '6px',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  background: 'none',
                  border: 'none',
                  marginLeft: 'auto',
                  transition: 'color 150ms, background-color 150ms',
                }}
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
          {children}
        </div>
      </div>

      {/* Keyframe animations — defined in globals.css (fadeIn, modalIn) */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
