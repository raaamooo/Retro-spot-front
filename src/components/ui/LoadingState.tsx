'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from './StateComponents.module.css';

interface LoadingStateProps {
  message?: string;
  fullHeight?: boolean;
}

export default function LoadingState({ message, fullHeight = false }: LoadingStateProps) {
  const { t } = useLanguage();

  return (
    <div className={styles.loadingContainer} style={{ minHeight: fullHeight ? '60vh' : 'auto' }}>
      <div className={styles.loadingSpinner} />
      <p className={styles.loadingText}>
        {message || t('loading')}
      </p>
    </div>
  );
}
