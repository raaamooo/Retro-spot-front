'use client';

import React from 'react';
import { Inbox } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Button from './Button';

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
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-elevated flex items-center justify-center mb-4 text-muted">
        {Icon ? <Icon size={28} /> : <Inbox size={28} />}
      </div>
      <h3 className="text-lg font-bold mb-1">
        {title || t('no_results')}
      </h3>
      <p className="text-muted font-medium text-sm max-w-xs">
        {description || message || t('no_data')}
      </p>
      {action && (
        <div className="mt-6">
          <Button variant="outline" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
