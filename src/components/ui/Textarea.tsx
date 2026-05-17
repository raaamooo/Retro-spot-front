'use client';

import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

import { AlertCircle } from 'lucide-react';

export default function Textarea({
  label,
  error,
  id,
  className = '',
  ...props
}: TextareaProps) {
  const inputId = id || `textarea-${label?.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="text-sm font-semibold text-foreground/90">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`
          w-full px-4 py-3 text-sm min-h-[120px] resize-y
          bg-surface border border-border rounded-sm
          text-foreground placeholder:text-muted-foreground
          transition-all duration-250 ease-out
          focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30 focus:bg-surface-elevated
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-danger focus:border-danger focus:ring-danger/20 text-danger' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-danger font-medium flex items-center gap-1.5 mt-0.5 animate-in fade-in slide-in-from-top-1">
          <AlertCircle size={14} />
          {error}
        </p>
      )}
    </div>
  );
}
