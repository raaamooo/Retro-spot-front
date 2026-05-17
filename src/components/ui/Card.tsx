'use client';

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  glowing?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-7',
};

export default function Card({
  children,
  className = '',
  hoverable = false,
  glowing = false,
  padding = 'md',
  onClick,
  ...props
}: CardProps) {
  return (
    <div
      onClick={onClick}
      {...props}
      className={`
        bg-surface rounded-md border border-border
        transition-all duration-250 ease-out
        ${paddingClasses[padding]}
        ${hoverable || onClick ? 'hover:bg-surface-elevated hover:border-accent hover:-translate-y-1 cursor-pointer' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {children}
    </div>
  );
}
