'use client';

import React from 'react';
import styles from './Form.module.css';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function FormInput({
  label,
  error,
  icon,
  className = '',
  id,
  required,
  ...props
}: FormInputProps) {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

  const inputClassNames = [
    styles.input,
    icon ? styles.inputWithIcon : '',
    error ? styles.inputError : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.formGroup}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}
      <div className={styles.inputWrapper}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <input
          id={inputId}
          className={inputClassNames}
          required={required}
          {...props}
        />
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
}
