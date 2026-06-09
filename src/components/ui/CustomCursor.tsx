'use client';

import React, { useEffect, useState } from 'react';
import { useCustomCursor } from '@/animations/useCustomCursor';
import { useReducedMotion } from '@/animations/useReducedMotion';
import styles from './CustomCursor.module.css';

export default function CustomCursor() {
  const reducedMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const { cursorRef, cursorDotRef } = useCustomCursor();

  useEffect(() => {
    // Only enable if client-side, not reduced motion, and not a mobile touch device
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (!reducedMotion && !isTouch) {
      setEnabled(true);
      document.documentElement.classList.add('has-custom-cursor');
    }
    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
    };
  }, [reducedMotion]);

  if (!enabled) return null;

  return (
    <div className={styles.cursorWrapper}>
      <div ref={cursorRef} className={styles.cursorRing} />
      <div ref={cursorDotRef} className={styles.cursorDot} />
    </div>
  );
}
