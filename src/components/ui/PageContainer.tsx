'use client';

import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
};

export default function PageContainer({
  children,
  className = '',
  maxWidth = 'xl',
  padding = true,
}: PageContainerProps) {
  return (
    <div
      className={`
        mx-auto w-full
        ${maxWidthClasses[maxWidth]}
        ${padding ? 'px-4 sm:px-6 lg:px-8 py-6 sm:py-8' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
