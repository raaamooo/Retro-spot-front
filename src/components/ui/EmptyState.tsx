'use client';

import React from 'react';
import { Inbox } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Button from './Button';
import styles from './StateComponents.module.css';

interface EmptyStateProps {
  title?: string;
  description?: string;
  message?: string; // for backward compatibility
  icon?: React.ElementType;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export default function EmptyState({ title, description, message, icon: Icon, action }: EmptyStateProps) {
  const { t } = useLanguage();

  return (
    <div className={styles.container}>
      <div className={styles.iconWrapper}>
        {Icon ? <Icon size={32} strokeWidth={1.5} /> : <Inbox size={32} strokeWidth={1.5} />}
      </div>
      <h3 className={styles.title}>
        {title || t('no_results')}
      </h3>
      <p className={styles.description}>
        {description || message || t('no_data')}
      </p>
      {action && (
        <div className={styles.action}>
          <Button variant="ghost" size="md" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
