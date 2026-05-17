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
    <div className="flex flex-col items-center justify-center py-20 px-8 text-center rounded-2xl border border-border/30 bg-surface/50 backdrop-blur-sm">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary ring-8 ring-primary/5">
        {Icon ? <Icon size={32} strokeWidth={1.5} /> : <Inbox size={32} strokeWidth={1.5} />}
      </div>
      <h3 className="text-2xl font-bold mb-3 font-heading text-foreground">
        {title || t('no_results')}
      </h3>
      <p className="text-muted-foreground text-base max-w-sm leading-relaxed">
        {description || message || t('no_data')}
      </p>
      {action && (
        <div className="mt-8">
          <Button variant="outline" size="md" onClick={action.onClick} className="rounded-full px-8">
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
