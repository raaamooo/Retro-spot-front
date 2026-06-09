'use client';

import React, { useRef } from 'react';
import { useCardHover3D } from '@/animations/useCardHover3D';
import styles from './Card.module.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
  tilt?: boolean;
}

const paddingClasses = {
  none: styles.paddingNone,
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({
    children,
    className = '',
    hoverable = false,
    interactive = false,
    padding = 'md',
    onClick,
    tilt = false,
    ...props
  }, ref) => {
    const internalRef = useRef<HTMLDivElement>(null);
    const resolvedRef = (ref || internalRef) as React.RefObject<HTMLDivElement | null>;

    // Apply 3D Tilt hook conditionally
    useCardHover3D(resolvedRef, tilt ? 12 : 0);

    const isHoverable = hoverable || interactive || !!onClick;
    
    const classNames = [
      styles.card,
      paddingClasses[padding],
      isHoverable ? styles.hoverable : '',
      interactive ? styles.interactive : '',
      tilt ? 'card-3d-tilt' : '',
      className
    ].filter(Boolean).join(' ');

    return (
      <div
        ref={resolvedRef}
        onClick={onClick}
        className={classNames}
        role={onClick || interactive ? 'button' : undefined}
        tabIndex={onClick || interactive ? 0 : undefined}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
