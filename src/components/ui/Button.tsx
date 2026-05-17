'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-foreground border border-transparent hover:bg-primary-hover hover:-translate-y-0.5 shadow-none',
  secondary:
    'bg-surface-elevated text-foreground border border-border hover:bg-surface hover:-translate-y-0.5 shadow-none',
  danger:
    'bg-danger text-white border border-transparent hover:bg-danger/90 shadow-none',
  success:
    'bg-success text-white border border-transparent hover:bg-success/90 shadow-none',
  ghost:
    'bg-transparent text-muted hover:text-foreground hover:bg-surface-elevated shadow-none',
  outline:
    'bg-transparent border-[1.5px] border-accent text-accent hover:bg-accent hover:text-primary-foreground hover:-translate-y-0.5 shadow-none',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-1.5 text-xs rounded-sm gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-sm gap-2',
  lg: 'px-7 py-3 text-base rounded-md gap-2.5',
  xl: 'px-9 py-4 text-lg rounded-md gap-3',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-250 ease-out
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1
        select-none
        disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:transform-none disabled:shadow-none
        active:scale-[0.98] active:translate-y-0
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
