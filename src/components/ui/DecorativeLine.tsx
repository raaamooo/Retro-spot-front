'use client';

import React, { forwardRef } from 'react';
import styles from './DecorativeComponents.module.css';

interface DecorativeLineProps {
  className?: string;
  maxWidth?: number;
}

const DecorativeLine = forwardRef<HTMLDivElement, DecorativeLineProps>(({ className, maxWidth }, ref) => {
  return (
    <div className={`${styles.decorativeLineContainer} ${className || ''}`}>
      <div 
        ref={ref} 
        className={`${styles.decorativeLine} decorative-line`} 
        style={maxWidth ? { maxWidth: `${maxWidth}px` } : undefined}
      />
    </div>
  );
});

DecorativeLine.displayName = 'DecorativeLine';

export default DecorativeLine;
