'use client';

import React from 'react';
import styles from './Button.module.css';

// Maintaining old variants temporarily to not break other components during refactoring
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline' | 'filled';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export default function Button({
  variant = 'filled',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  
  // Map legacy variants to our two approved styles: 'filled' or 'ghost'
  const isGhost = variant === 'ghost' || variant === 'outline' || variant === 'secondary';
  const mappedVariantClass = isGhost ? styles.ghost : styles.filled;
  
  const classNames = [
    styles.button,
    mappedVariantClass,
    styles[size],
    fullWidth ? styles.fullWidth : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classNames}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className={styles.spinner} />}
      {children}
    </button>
  );
}
