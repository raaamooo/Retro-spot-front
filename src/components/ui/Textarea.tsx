'use client';

import React from 'react';
import styles from './Form.module.css';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export default function Textarea({
  label,
  error,
  icon,
  className = '',
  id,
  required,
  ...props
}: TextareaProps) {
  const textareaId = id || `textarea-${Math.random().toString(36).substring(2, 9)}`;

  const textareaClassNames = [
    styles.input,
    styles.textarea,
    icon ? styles.inputWithIcon : '',
    error ? styles.inputError : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.formGroup}>
      {label && (
        <label htmlFor={textareaId} className={styles.label}>
          {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
        </label>
      )}
      <div className={styles.inputWrapper}>
        {icon && <div className={`${styles.icon} ${styles.textareaIcon}`}>{icon}</div>}
        <textarea
          id={textareaId}
          className={textareaClassNames}
          required={required}
          {...props}
        />
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
}
