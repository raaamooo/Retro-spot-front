'use client';

import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export default function Textarea({
  label,
  error,
  id,
  className = '',
  ...props
}: TextareaProps) {
  const inputId = id || `textarea-${label?.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={`
          w-full px-4 py-2.5 text-sm min-h-[100px] resize-y
          bg-background border border-border rounded-xl
          text-foreground placeholder:text-muted
          transition-colors duration-200
          focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-xs text-danger font-medium">{error}</p>
      )}
    </div>
  );
}
