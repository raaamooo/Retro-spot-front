'use client';

import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showClose?: boolean;
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className={`
          relative w-full ${sizeClasses[size]}
          bg-surface border border-border rounded-2xl shadow-2xl
          animate-[modalIn_0.25s_ease-out]
          max-h-[85vh] flex flex-col
        `}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Header */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
            {title && (
              <h2 className="text-lg font-bold text-foreground">{title}</h2>
            )}
            {showClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated transition-colors focus-ring ms-auto"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex-1">{children}</div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
