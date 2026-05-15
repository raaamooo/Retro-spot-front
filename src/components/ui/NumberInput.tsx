'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';

interface NumberInputProps {
  label?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  error?: string;
  disabled?: boolean;
}

export default function NumberInput({
  label,
  value,
  onChange,
  min = 0,
  max = 9999,
  step = 1,
  error,
  disabled = false,
}: NumberInputProps) {
  const decrease = () => {
    const next = Math.max(min, value - step);
    onChange(next);
  };

  const increase = () => {
    const next = Math.min(max, value + step);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-foreground">{label}</label>
      )}
      <div className="flex items-center gap-0 border border-border rounded-xl overflow-hidden bg-background">
        <button
          type="button"
          onClick={decrease}
          disabled={disabled || value <= min}
          className="px-3 py-2.5 text-muted hover:text-foreground hover:bg-surface-elevated transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Decrease"
        >
          <Minus size={16} />
        </button>
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const n = parseFloat(e.target.value);
            if (!isNaN(n) && n >= min && n <= max) onChange(n);
          }}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={`
            w-16 text-center py-2.5 text-sm font-semibold bg-transparent text-foreground border-x border-border
            focus:outline-none
            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none
          `}
        />
        <button
          type="button"
          onClick={increase}
          disabled={disabled || value >= max}
          className="px-3 py-2.5 text-muted hover:text-foreground hover:bg-surface-elevated transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Increase"
        >
          <Plus size={16} />
        </button>
      </div>
      {error && (
        <p className="text-xs text-danger font-medium">{error}</p>
      )}
    </div>
  );
}
