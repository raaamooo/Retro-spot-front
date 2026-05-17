'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './Form.module.css';

interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'options'> {
  label?: string;
  options: SelectOption[];
  error?: string;
  icon?: React.ReactNode;
}

export default function Select({
  label,
  options,
  error,
  icon,
  className = '',
  id,
  required,
  ...props
}: SelectProps) {
  const selectId = id || `select-${Math.random().toString(36).substring(2, 9)}`;

  const selectClassNames = [
    styles.input,
    styles.select,
    icon ? styles.inputWithIcon : '',
    error ? styles.inputError : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.formGroup}>
      {label && (
        <label htmlFor={selectId} className={styles.label}>
          {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}
      <div className={styles.inputWrapper}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <select
          id={selectId}
          className={selectClassNames}
          required={required}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className={styles.selectIconRight}>
          <ChevronDown size={16} />
        </div>
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
}
