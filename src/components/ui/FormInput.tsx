'use client';

import React from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

import { AlertCircle } from 'lucide-react';

export default function FormInput({
  label,
  error,
  hint,
  id,
  className = '',
  ...props
}: FormInputProps) {
  const inputId = id || `input-${label?.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-foreground/90">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-4 py-3 text-sm
          bg-surface border border-border/60 rounded-xl
          text-foreground placeholder:text-muted-foreground
          transition-all duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]
          focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 focus:bg-background
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-danger focus:border-danger focus:ring-danger/10 text-danger' : ''}
          ${className}
        `}
        {...props}
      />
      {hint && !error && (
        <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-danger font-medium flex items-center gap-1.5 mt-0.5 animate-in fade-in slide-in-from-top-1">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
}
