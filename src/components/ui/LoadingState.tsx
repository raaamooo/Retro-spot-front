'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

const sizeMap = {
  sm: 'w-5 h-5 border-2',
  md: 'w-8 h-8 border-3',
  lg: 'w-12 h-12 border-4',
};

export default function LoadingState({
  message,
  size = 'md',
  fullPage = false,
}: LoadingStateProps) {
  const { t } = useLanguage();

  const content = (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <span
        className={`
          inline-block rounded-full
          border-primary border-t-transparent animate-spin
          ${sizeMap[size]}
        `}
      />
      <p className="text-sm text-muted font-medium">
        {message || t('loading')}
      </p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}
