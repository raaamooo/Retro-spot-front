'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export default function Select({
  label,
  error,
  options,
  placeholder,
  id,
  className = '',
  ...props
}: SelectProps) {
  const inputId = id || `select-${label?.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={inputId}
          className={`
            w-full px-4 py-2.5 text-sm appearance-none
            bg-background border border-border rounded-xl
            text-foreground
            transition-colors duration-200
            focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring/20
            disabled:opacity-50 disabled:cursor-not-allowed
            pe-10
            ${error ? 'border-danger focus:border-danger focus:ring-danger/20' : ''}
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute top-1/2 -translate-y-1/2 end-3 text-muted pointer-events-none"
        />
      </div>
      {error && (
        <p className="text-xs text-danger font-medium">{error}</p>
      )}
    </div>
  );
}
