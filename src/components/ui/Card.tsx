'use client';

import React from 'react';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const paddingClasses = {
  none: styles.paddingNone,
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
};

export default function Card({
  children,
  className = '',
  hoverable = false,
  padding = 'md',
  onClick,
  ...props
}: CardProps) {
  const isHoverable = hoverable || !!onClick;
  
  const classNames = [
    styles.card,
    paddingClasses[padding],
    isHoverable ? styles.hoverable : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      onClick={onClick}
      className={classNames}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
