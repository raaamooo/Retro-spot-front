'use client';

import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const [isClosing, setIsClosing] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Touch drag to dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    if (diff > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  };

  const handleTouchEnd = () => {
    const diff = currentY.current - startY.current;
    if (diff > 120) {
      handleClose();
    } else if (sheetRef.current) {
      sheetRef.current.style.transform = 'translateY(0)';
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          zIndex: 'var(--z-modal-backdrop)' as any,
          animation: isClosing ? 'fadeOut 300ms forwards' : 'fadeIn 300ms forwards',
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          maxHeight: '85vh',
          backgroundColor: 'var(--surface)',
          borderTopLeftRadius: 'var(--radius-2xl)',
          borderTopRightRadius: 'var(--radius-2xl)',
          zIndex: 'var(--z-modal)' as any,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.2)',
          animation: isClosing
            ? 'bottomSheetDown 300ms cubic-bezier(0.25, 0.1, 0.25, 1) forwards'
            : 'bottomSheetUp 400ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
      >
        {/* Drag handle */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '12px 0 4px',
          cursor: 'grab',
        }}>
          <div style={{
            width: '36px',
            height: '4px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--border)',
          }} />
        </div>

        {/* Header */}
        {title && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 20px 16px',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontWeight: 500,
            }}>{title}</h3>
            <button
              onClick={handleClose}
              style={{
                padding: '8px',
                borderRadius: 'var(--radius-full)',
                color: 'var(--muted)',
                transition: 'all 150ms',
              }}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px 32px',
          paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
        }}>
          {children}
        </div>
      </div>
    </>
  );
}
